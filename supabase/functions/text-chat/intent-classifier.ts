// Lightweight intent classifier for ambiguous-route RAVIO messages.
// Phase 22 C3 (#407) — DEC-036.
//
// Runs only when the route-detected context is 'general' (home, /help, /faq)
// and the user has sent their first message. Returns:
//   'support'  — account/booking/refund/dispute questions
//   'rentals'  — find/browse/search discovery questions
//   null       — keep the 'general' fallback (no chip, no swap)
//
// Two-stage pipeline:
//   1. Keyword heuristics (zero latency, covers ~80% of cases)
//   2. Small model fallback via OpenRouter (only when keywords are ambiguous)
//
// The output is the *classified* context; the edge fn decides whether to
// actually swap the system prompt + tools based on whether it differs from
// the route-detected context.

export type ClassifiedContext = "support" | "rentals";

// Keyword sets — intentionally narrow. Prefer keeping confidence HIGH by
// matching only terms that are unambiguous on their own. Ambiguous terms
// (e.g. "booking" on its own matches both contexts) go in the model fallback.

const SUPPORT_KEYWORDS = [
  // Refund / money
  "refund",
  "refunded",
  "money back",
  "charge",
  "charged twice",
  "double-charged",
  "chargeback",
  // Cancellation
  "cancel my",
  "cancel the booking",
  "cancel booking",
  "cancellation",
  // Disputes / problems
  "dispute",
  "file a complaint",
  "report an issue",
  "report a problem",
  "file a claim",
  // Bookings I already have
  "my booking",
  "my bookings",
  "my reservation",
  "my stay",
  "i booked",
  "my offer",
  "my offers",
  // Personal-state
  "where's my",
  "wheres my",
  "didn't get",
  "never received",
  "something's wrong",
  "havent received",
  "haven't received",
  // Account
  "my account",
  "password",
  "delete my account",
  "change my email",
  // Owner-specific support
  "my listing",
  "my listings",
  "my payout",
  "payout",
];

const RENTALS_KEYWORDS = [
  "find",
  "search for",
  "looking for",
  "show me",
  "available",
  "vacancies",
  "browse",
  "near ",
  "in orlando",
  "in maui",
  "in aspen",
  "in hawaii",
  "in florida",
  "cheap",
  "under $",
  "beach",
  "mountain",
  "ski",
  "condo",
  "resort in",
  "hotel",
  "vacation in",
  "trip to",
  "bedrooms",
  "sleeps",
  "what's available",
  "whats available",
  "stays in",
];

function containsAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

export function classifyByKeywords(message: string): ClassifiedContext | null {
  const hasSupport = containsAny(message, SUPPORT_KEYWORDS);
  const hasRentals = containsAny(message, RENTALS_KEYWORDS);

  if (hasSupport && !hasRentals) return "support";
  if (hasRentals && !hasSupport) return "rentals";
  // Both or neither → ambiguous
  return null;
}

// Model fallback prompt — one-shot classifier. Cheap because:
//   - 30-40 input tokens
//   - max_tokens=5 (response is one word)
//   - called only on ambiguous messages on general routes
const CLASSIFIER_SYSTEM_PROMPT = `You classify a user message to a travel marketplace assistant into exactly one of:
- support: questions about their existing bookings, refunds, cancellations, disputes, account, payouts, or personal problems
- rentals: browsing/discovery — searching for vacation properties, destinations, dates, amenities
- unclear: cannot tell from this message alone

Respond with a single lowercase word: support, rentals, or unclear. No punctuation, no explanation.`;

interface OpenRouterLike {
  (input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

/**
 * Model fallback classifier. Only call when keyword classifier returned null.
 * Fails closed: on any error, returns null (no swap, keeps 'general' context).
 */
export async function classifyByModel(
  message: string,
  openRouterKey: string,
  options: { model?: string; fetchImpl?: OpenRouterLike } = {},
): Promise<ClassifiedContext | null> {
  const model = options.model ?? "google/gemini-3-flash-preview";
  const fetchImpl = options.fetchImpl ?? fetch;

  try {
    const response = await fetchImpl("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://rent-a-vacation.com",
        "X-Title": "Rent-A-Vacation Intent Classifier",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: CLASSIFIER_SYSTEM_PROMPT },
          { role: "user", content: message.slice(0, 500) },
        ],
        stream: false,
        max_tokens: 5,
        temperature: 0,
      }),
    });

    if (!response.ok) return null;

    const body = await response.json();
    const raw = (body.choices?.[0]?.message?.content ?? "").toString().trim().toLowerCase();
    if (raw === "support") return "support";
    if (raw === "rentals") return "rentals";
    // "unclear" or anything else → null
    return null;
  } catch {
    // Classifier errors must never break the main chat — fail closed.
    return null;
  }
}

/**
 * Full classifier pipeline. Keyword first, model fallback only when ambiguous.
 */
export async function classifyIntent(
  message: string,
  openRouterKey: string | null,
  options: { model?: string; fetchImpl?: OpenRouterLike } = {},
): Promise<ClassifiedContext | null> {
  const trimmed = message.trim();
  if (!trimmed) return null;

  const byKeyword = classifyByKeywords(trimmed);
  if (byKeyword) return byKeyword;

  if (!openRouterKey) return null;
  return classifyByModel(trimmed, openRouterKey, options);
}
