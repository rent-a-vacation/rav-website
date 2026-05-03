import { vi } from "vitest";

type ChainReturn = ReturnType<typeof createChain>;

function createChain(resolvedValue: { data: unknown; error: unknown; count?: number }) {
  const chain: Record<string, (...args: unknown[]) => ChainReturn> = {};

  const methods = [
    "select",
    "insert",
    "update",
    "delete",
    "upsert",
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "lte",
    "like",
    "ilike",
    "in",
    "order",
    "limit",
    "range",
    "single",
    "maybeSingle",
    "match",
    "not",
    "or",
    "is",
    "filter",
    "contains",
    "textSearch",
  ];

  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  // Terminal methods resolve the promise
  chain.then = vi.fn().mockImplementation((resolve) => resolve(resolvedValue));

  // Make it thenable so await works
  return Object.assign(Promise.resolve(resolvedValue), chain);
}

/**
 * Creates a mock supabase client with chainable query builder.
 *
 * Usage:
 * ```ts
 * const mock = createSupabaseMock({
 *   listings: { data: [{ id: '1' }], error: null },
 *   favorites: { data: [], error: null },
 * });
 * vi.mocked(supabase.from).mockImplementation((table) => mock.from(table));
 * ```
 */
export function createSupabaseMock(
  tableData: Record<string, { data: unknown; error: unknown; count?: number }> = {}
) {
  const from = vi.fn().mockImplementation((table: string) => {
    const resolved = tableData[table] ?? { data: null, error: null };
    return createChain(resolved);
  });

  return {
    from,
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signInWithOAuth: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
}

/**
 * Preset: empty table response
 */
export function emptyResponse() {
  return { data: [], error: null };
}

/**
 * Preset: error response
 */
export function errorResponse(message = "Database error") {
  return { data: null, error: { message, code: "PGRST000" } };
}
