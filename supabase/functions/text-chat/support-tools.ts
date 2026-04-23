// Support tool handlers invoked by the RAVIO support agent.
// Phase 22 C4 (#408) — DEC-036.
//
// Pure-logic module: accepts a minimal Supabase-like interface and user
// context, returns structured JSON the agent can reason about. Runs in both
// Deno (edge function) and Node (vitest) without runtime-specific imports.
//
// All queries are RLS-enforced — callers MUST pass a user-scoped client built
// with the caller's JWT (Authorization header). Never pass a service-role
// client here; tools must see only what the user is authorised to see.

// ── Structural types ────────────────────────────────────────────────────────
// Deliberately loose: the real @supabase/supabase-js client and the mocks in
// src/test/helpers/supabase-mock.ts both satisfy this shape.

type PgResult<T> = { data: T | null; error: { message: string; code?: string } | null };

export interface SupabaseLike {
  from: (table: string) => unknown;
}

export interface StripeLike {
  refunds: {
    retrieve: (id: string) => Promise<{
      id: string;
      status: string;
      amount: number;
      arrival_date?: number | null;
      failure_reason?: string | null;
    }>;
  };
}

export interface UserContext {
  userId: string;
  userEmail: string;
}

export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  note?: string;
}

// ── Safe field projections (sensitive fields never leave this module) ──────

const SAFE_BOOKING_COLUMNS = [
  "id",
  "listing_id",
  "renter_id",
  "status",
  "total_amount",
  "base_amount",
  "cleaning_fee",
  "service_fee",
  "tax_amount",
  "guest_count",
  "source_type",
  "special_requests",
  "paid_at",
  "created_at",
  "listings:listings(id, check_in_date, check_out_date, nightly_rate, status, source_type, property_id)",
].join(", ");

const SAFE_CANCELLATION_COLUMNS = [
  "id",
  "booking_id",
  "status",
  "reason",
  "requested_refund_amount",
  "policy_refund_amount",
  "final_refund_amount",
  "counter_offer_amount",
  "days_until_checkin",
  "refund_processed_at",
  "refund_reference",
  "created_at",
  "responded_at",
].join(", ");

const SAFE_DISPUTE_COLUMNS = [
  "id",
  "booking_id",
  "reporter_id",
  "category",
  "priority",
  "status",
  "description",
  "resolution_notes",
  "resolved_at",
  "refund_amount",
  "created_at",
].join(", ");

const VALID_DISPUTE_CATEGORIES = [
  "property_not_as_described",
  "access_issues",
  "safety_concerns",
  "cleanliness",
  "cancellation_dispute",
  "payment_dispute",
  "owner_no_show",
  "renter_damage",
  "renter_no_show",
  "unauthorized_guests",
  "rule_violation",
  "late_checkout",
  "other",
];

// Minimum description length to deter accidental empty escalations.
const MIN_DISPUTE_DESCRIPTION_LENGTH = 20;

// ── Tool: lookup_booking ────────────────────────────────────────────────────

export async function lookupBooking(
  supabase: SupabaseLike,
  userCtx: UserContext,
  args: { booking_id?: string; email?: string },
): Promise<ToolResult> {
  const { booking_id, email } = args;

  if (!booking_id && !email) {
    return { success: false, error: "Either booking_id or email is required." };
  }

  // Email branch: must match the authenticated user's own email.
  // No cross-account lookup — RLS would prevent it anyway, but reject early.
  if (email && !booking_id) {
    if (email.trim().toLowerCase() !== userCtx.userEmail.trim().toLowerCase()) {
      return {
        success: false,
        error: "I can only look up bookings on your own account. Please confirm the email on your account matches.",
      };
    }

    // Return the user's 10 most recent bookings.
    const query = (supabase.from("bookings") as {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          order: (col: string, opts: { ascending: boolean }) => {
            limit: (n: number) => Promise<PgResult<unknown[]>>;
          };
        };
      };
    })
      .select(SAFE_BOOKING_COLUMNS)
      .eq("renter_id", userCtx.userId)
      .order("created_at", { ascending: false })
      .limit(10);

    const { data, error } = await query;
    if (error) return { success: false, error: `Lookup failed: ${error.message}` };
    return { success: true, data: { bookings: data ?? [], total: (data ?? []).length } };
  }

  // booking_id branch: RLS scopes to bookings the user can see (as renter,
  // or as owner of the listing). maybeSingle() returns null on no match.
  const result = await (supabase.from("bookings") as {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        maybeSingle: () => Promise<PgResult<unknown>>;
      };
    };
  })
    .select(SAFE_BOOKING_COLUMNS)
    .eq("id", booking_id!)
    .maybeSingle();

  if (result.error) {
    return { success: false, error: `Lookup failed: ${result.error.message}` };
  }
  if (!result.data) {
    return {
      success: false,
      error: "No booking found with that ID on your account. If you believe this is an error, please confirm the booking ID.",
    };
  }
  return { success: true, data: { booking: result.data } };
}

// ── Tool: check_refund_status (DB-first, live Stripe fallback) ─────────────

export async function checkRefundStatus(
  supabase: SupabaseLike,
  userCtx: UserContext,
  args: { booking_id: string },
  stripe?: StripeLike,
): Promise<ToolResult> {
  if (!args.booking_id) {
    return { success: false, error: "booking_id is required." };
  }

  // RLS enforces — users see only cancellations on bookings they participate in.
  const result = await (supabase.from("cancellation_requests") as {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        order: (col: string, opts: { ascending: boolean }) => {
          limit: (n: number) => {
            maybeSingle: () => Promise<PgResult<Record<string, unknown>>>;
          };
        };
      };
    };
  })
    .select(SAFE_CANCELLATION_COLUMNS)
    .eq("booking_id", args.booking_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (result.error) {
    return { success: false, error: `Refund lookup failed: ${result.error.message}` };
  }
  if (!result.data) {
    return {
      success: true,
      data: { has_cancellation: false },
      note: "No cancellation request on file for this booking.",
    };
  }

  const cancellation = result.data;
  const refundReference = cancellation.refund_reference as string | null;
  const refundProcessedAt = cancellation.refund_processed_at as string | null;

  // DB-first answer. Live Stripe reconcile only when the DB says "refund owed
  // but not yet processed" or when arrival date could be useful.
  // Fail-closed: Stripe errors never break the response — we return DB state
  // with a note so the agent can still answer.
  if (stripe && refundReference && !refundProcessedAt) {
    try {
      const stripeRefund = await stripe.refunds.retrieve(refundReference);
      return {
        success: true,
        data: {
          cancellation,
          stripe_refund: {
            id: stripeRefund.id,
            status: stripeRefund.status,
            amount: stripeRefund.amount,
            arrival_date: stripeRefund.arrival_date ?? null,
            failure_reason: stripeRefund.failure_reason ?? null,
          },
          source: "db+stripe",
        },
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: true,
        data: { cancellation, source: "db" },
        note: `Live Stripe state unavailable (${msg}); returning our last known record.`,
      };
    }
  }

  return {
    success: true,
    data: { cancellation, source: "db" },
  };
}

// ── Tool: check_dispute_status ──────────────────────────────────────────────

export async function checkDisputeStatus(
  supabase: SupabaseLike,
  _userCtx: UserContext,
  args: { booking_id: string },
): Promise<ToolResult> {
  if (!args.booking_id) {
    return { success: false, error: "booking_id is required." };
  }

  const result = await (supabase.from("disputes") as {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        order: (col: string, opts: { ascending: boolean }) => Promise<PgResult<unknown[]>>;
      };
    };
  })
    .select(SAFE_DISPUTE_COLUMNS)
    .eq("booking_id", args.booking_id)
    .order("created_at", { ascending: false });

  if (result.error) {
    return { success: false, error: `Dispute lookup failed: ${result.error.message}` };
  }

  const disputes = result.data ?? [];
  return {
    success: true,
    data: { disputes, total: disputes.length },
  };
}

// ── Tool: open_dispute ──────────────────────────────────────────────────────

export async function openDispute(
  supabase: SupabaseLike,
  userCtx: UserContext,
  args: { booking_id: string; category: string; description: string },
): Promise<ToolResult> {
  const { booking_id, category, description } = args;

  if (!booking_id || !category || !description) {
    return { success: false, error: "booking_id, category, and description are all required." };
  }
  if (!VALID_DISPUTE_CATEGORIES.includes(category)) {
    return {
      success: false,
      error: `Invalid category. Must be one of: ${VALID_DISPUTE_CATEGORIES.join(", ")}.`,
    };
  }
  if (description.trim().length < MIN_DISPUTE_DESCRIPTION_LENGTH) {
    return {
      success: false,
      error: `Please provide a description of at least ${MIN_DISPUTE_DESCRIPTION_LENGTH} characters explaining the issue.`,
    };
  }

  // RLS policy "Users can create disputes" enforces reporter_id = auth.uid().
  // source='ravio_support' tags this as an agent-opened dispute so AdminDisputes
  // can surface + filter + measure separately from user-filed ones (#409).
  const result = await (supabase.from("disputes") as {
    insert: (row: Record<string, unknown>) => {
      select: (cols: string) => {
        single: () => Promise<PgResult<Record<string, unknown>>>;
      };
    };
  })
    .insert({
      booking_id,
      reporter_id: userCtx.userId,
      category,
      description,
      status: "open",
      source: "ravio_support",
    })
    .select(SAFE_DISPUTE_COLUMNS)
    .single();

  if (result.error) {
    return { success: false, error: `Could not open dispute: ${result.error.message}` };
  }
  return {
    success: true,
    data: { dispute: result.data },
    note: "Dispute opened. The RAV team has been notified and will follow up.",
  };
}

// ── Tool: query_support_docs ────────────────────────────────────────────────

export async function querySupportDocs(
  supabase: SupabaseLike,
  _userCtx: UserContext,
  args: { query: string; doc_type?: string },
): Promise<ToolResult> {
  const { query, doc_type } = args;

  if (!query?.trim()) {
    return { success: false, error: "query is required." };
  }

  // Base chain — RLS already limits to status='active' for non-staff.
  type BaseChain = {
    select: (cols: string) => BaseChain;
    eq: (col: string, val: string) => BaseChain;
    textSearch: (col: string, q: string, opts?: { type?: string }) => BaseChain;
    limit: (n: number) => Promise<PgResult<unknown[]>>;
  };

  let chain = (supabase.from("support_docs") as BaseChain)
    .select("slug, title, doc_type, audience, tags, sections, version")
    .eq("status", "active");

  if (doc_type) {
    chain = chain.eq("doc_type", doc_type);
  }

  const result = await chain
    .textSearch("search_tsv", query, { type: "websearch" })
    .limit(5);

  if (result.error) {
    return { success: false, error: `Doc search failed: ${result.error.message}` };
  }

  return {
    success: true,
    data: { results: result.data ?? [], total: (result.data ?? []).length },
  };
}

// ── Registry + dispatcher ───────────────────────────────────────────────────

export const SUPPORT_TOOL_NAMES = [
  "lookup_booking",
  "check_refund_status",
  "check_dispute_status",
  "open_dispute",
  "query_support_docs",
] as const;

export type SupportToolName = (typeof SUPPORT_TOOL_NAMES)[number];

export function isSupportTool(name: string): name is SupportToolName {
  return (SUPPORT_TOOL_NAMES as readonly string[]).includes(name);
}

export async function dispatchSupportTool(
  name: SupportToolName,
  supabase: SupabaseLike,
  userCtx: UserContext,
  args: Record<string, unknown>,
  stripe?: StripeLike,
): Promise<ToolResult> {
  switch (name) {
    case "lookup_booking":
      return lookupBooking(supabase, userCtx, args as Parameters<typeof lookupBooking>[2]);
    case "check_refund_status":
      return checkRefundStatus(
        supabase,
        userCtx,
        args as Parameters<typeof checkRefundStatus>[2],
        stripe,
      );
    case "check_dispute_status":
      return checkDisputeStatus(supabase, userCtx, args as Parameters<typeof checkDisputeStatus>[2]);
    case "open_dispute":
      return openDispute(supabase, userCtx, args as Parameters<typeof openDispute>[2]);
    case "query_support_docs":
      return querySupportDocs(supabase, userCtx, args as Parameters<typeof querySupportDocs>[2]);
  }
}

// ── OpenRouter / Claude-compatible tool schemas ─────────────────────────────
// Function-calling spec, same shape as the existing SEARCH_TOOL in index.ts.

export const SUPPORT_TOOL_SCHEMAS = [
  {
    type: "function" as const,
    function: {
      name: "lookup_booking",
      description:
        "Look up a booking the authenticated user is part of. Provide booking_id for a specific booking, or just email (the user's own email) to list their 10 most recent bookings.",
      parameters: {
        type: "object",
        properties: {
          booking_id: { type: "string", description: "The UUID of the booking." },
          email: {
            type: "string",
            description:
              "The authenticated user's email. Must match the user's account email. Used only when booking_id is unknown.",
          },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "check_refund_status",
      description:
        "Return the latest cancellation and refund state for a booking, reconciled with Stripe when we have a refund reference but no processed timestamp.",
      parameters: {
        type: "object",
        properties: {
          booking_id: { type: "string", description: "The UUID of the booking." },
        },
        required: ["booking_id"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "check_dispute_status",
      description: "Return any open or closed disputes on a booking the user is part of.",
      parameters: {
        type: "object",
        properties: {
          booking_id: { type: "string", description: "The UUID of the booking." },
        },
        required: ["booking_id"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "open_dispute",
      description:
        "Open a new dispute on a booking. Only call this after explicit user confirmation that they want to escalate. Provide a clear, specific description (20+ chars).",
      parameters: {
        type: "object",
        properties: {
          booking_id: { type: "string", description: "The UUID of the booking." },
          category: {
            type: "string",
            enum: VALID_DISPUTE_CATEGORIES,
            description: "The dispute category that best matches the issue.",
          },
          description: {
            type: "string",
            description: "Clear explanation of the issue, in the user's words where possible.",
          },
        },
        required: ["booking_id", "category", "description"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "query_support_docs",
      description:
        "Keyword-search the Rent-A-Vacation support knowledge base (policies, FAQs, processes, guides). Call this BEFORE answering policy questions so the answer is grounded in current, approved content.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Keyword query; plain English is fine." },
          doc_type: {
            type: "string",
            enum: ["policy", "faq", "process", "guide"],
            description: "Optional filter to a specific document type.",
          },
        },
        required: ["query"],
      },
    },
  },
];
