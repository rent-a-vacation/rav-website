import type { User, Session } from "@supabase/supabase-js";
import type { AppRole, Profile } from "@/types/database";

/**
 * Creates a mock Supabase User object.
 */
export function mockUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-test-123",
    aud: "authenticated",
    role: "authenticated",
    email: "test@example.com",
    email_confirmed_at: new Date().toISOString(),
    phone: "",
    confirmed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: { full_name: "Test User" },
    identities: [],
    factors: [],
    ...overrides,
  } as User;
}

/**
 * Creates a mock Supabase Session object.
 */
export function mockSession(overrides: Partial<Session> = {}): Session {
  const user = mockUser(overrides.user ? overrides.user as Partial<User> : {});
  return {
    access_token: "test-access-token",
    refresh_token: "test-refresh-token",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: "bearer",
    user,
    ...overrides,
  } as Session;
}

/**
 * Creates a mock Profile object.
 */
export function mockProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "user-test-123",
    email: "test@example.com",
    full_name: "Test User",
    phone: null,
    avatar_url: null,
    approval_status: "approved",
    approved_by: null,
    approved_at: null,
    rejection_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates a mock auth context value for testing components that use useAuth.
 */
export function mockAuthContext(overrides: Record<string, unknown> = {}) {
  const user = mockUser();
  const session = mockSession();
  const roles: AppRole[] = ["renter"];

  return {
    user,
    session,
    profile: mockProfile(),
    roles,
    isLoading: false,
    isConfigured: true,
    isPasswordRecovery: false,
    signUp: vi.fn().mockResolvedValue({ error: null }),
    signIn: vi.fn().mockResolvedValue({ error: null }),
    signInWithGoogle: vi.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
    resendVerificationEmail: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn().mockResolvedValue(undefined),
    clearPasswordRecovery: vi.fn(),
    hasRole: (role: AppRole) => roles.includes(role),
    isRavTeam: () => false,
    isRavAdmin: () => false,
    isPropertyOwner: () => false,
    isRenter: () => true,
    isEmailVerified: () => true,
    ...overrides,
  };
}
