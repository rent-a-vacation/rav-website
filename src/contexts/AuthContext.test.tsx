import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import React from "react";
import { mockUser } from "@/test/fixtures/users";

// Set up supabase auth mocks
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockSignUp = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();
const mockResend = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
      signUp: (...args: unknown[]) => mockSignUp(...args),
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
      signOut: (...args: unknown[]) => mockSignOut(...args),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
      resend: (...args: unknown[]) => mockResend(...args),
    },
    from: (...args: unknown[]) => mockFrom(...args),
  },
  isSupabaseConfigured: () => true,
}));

const { AuthProvider, useAuth } = await import("./AuthContext");

function createWrapper() {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>;
  };
}

beforeEach(() => {
  vi.clearAllMocks();

  // Default: no session
  mockGetSession.mockResolvedValue({
    data: { session: null },
    error: null,
  });

  // Default: auth state change returns subscription
  mockOnAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  });

  // Default supabase table mock
  mockFrom.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }),
  });
});

describe("AuthContext @p0", () => {
  it("provides initial unauthenticated state", async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.isConfigured).toBe(true);
  });

  it("throws when useAuth is used outside AuthProvider", () => {
    // Suppress console.error for the expected error
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used within an AuthProvider");

    consoleSpy.mockRestore();
  });

  it("role checks return false when unauthenticated", async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasRole("renter")).toBe(false);
    expect(result.current.isRavTeam()).toBe(false);
    expect(result.current.isPropertyOwner()).toBe(false);
    expect(result.current.isRenter()).toBe(false);
  });

  it("calls signOut and clears state", async () => {
    const user = mockUser();

    // Start with a session
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockOnAuthStateChange.mockImplementation((callback: (...args: any[]) => void) => {
      // Simulate SIGNED_IN event
      callback("SIGNED_IN", {
        user,
        access_token: "token",
        refresh_token: "refresh",
        expires_in: 3600,
        token_type: "bearer",
      });
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user,
          access_token: "token",
          refresh_token: "refresh",
          expires_in: 3600,
          token_type: "bearer",
        },
      },
      error: null,
    });

    // Mock signOut
    mockSignOut.mockImplementation(async () => {
      // Trigger SIGNED_OUT event via the stored callback
      return { error: null };
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    // Wait for initial load
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Call signOut
    await act(async () => {
      await result.current.signOut();
    });

    expect(mockSignOut).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
  });

  it("signUp passes account type in metadata", async () => {
    mockSignUp.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.signUp("test@test.com", "password", "Test User", "owner");
    });

    expect(mockSignUp).toHaveBeenCalledWith({
      email: "test@test.com",
      password: "password",
      options: expect.objectContaining({
        data: expect.objectContaining({
          account_type: "owner",
          full_name: "Test User",
        }),
      }),
    });
  });

  it("signIn calls signInWithPassword", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.signIn("test@test.com", "password");
    });

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "test@test.com",
      password: "password",
    });
  });

  describe("isEmailVerified", () => {
    it("returns false when no user", async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.isEmailVerified()).toBe(false);
    });

    it("returns true when user has email_confirmed_at", async () => {
      const user = mockUser({ email_confirmed_at: "2026-01-01T00:00:00Z" });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockOnAuthStateChange.mockImplementation((callback: (...args: any[]) => void) => {
        callback("SIGNED_IN", {
          user,
          access_token: "token",
          refresh_token: "refresh",
          expires_in: 3600,
          token_type: "bearer",
        });
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      mockGetSession.mockResolvedValue({
        data: {
          session: {
            user,
            access_token: "token",
            refresh_token: "refresh",
            expires_in: 3600,
            token_type: "bearer",
          },
        },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.user).not.toBeNull());
      expect(result.current.isEmailVerified()).toBe(true);
    });

    it("returns false when email_confirmed_at is null", async () => {
      const user = mockUser({ email_confirmed_at: undefined });
      // Remove the property entirely to simulate null
      delete (user as Record<string, unknown>).email_confirmed_at;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockOnAuthStateChange.mockImplementation((callback: (...args: any[]) => void) => {
        callback("SIGNED_IN", {
          user,
          access_token: "token",
          refresh_token: "refresh",
          expires_in: 3600,
          token_type: "bearer",
        });
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      mockGetSession.mockResolvedValue({
        data: {
          session: {
            user,
            access_token: "token",
            refresh_token: "refresh",
            expires_in: 3600,
            token_type: "bearer",
          },
        },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.user).not.toBeNull());
      expect(result.current.isEmailVerified()).toBe(false);
    });

    it("returns true for Google OAuth users even without email_confirmed_at", async () => {
      const user = mockUser({
        email_confirmed_at: undefined,
        app_metadata: { provider: "google", providers: ["google"] },
      });
      delete (user as Record<string, unknown>).email_confirmed_at;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockOnAuthStateChange.mockImplementation((callback: (...args: any[]) => void) => {
        callback("SIGNED_IN", {
          user,
          access_token: "token",
          refresh_token: "refresh",
          expires_in: 3600,
          token_type: "bearer",
        });
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      mockGetSession.mockResolvedValue({
        data: {
          session: {
            user,
            access_token: "token",
            refresh_token: "refresh",
            expires_in: 3600,
            token_type: "bearer",
          },
        },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.user).not.toBeNull());
      expect(result.current.isEmailVerified()).toBe(true);
    });
  });

  describe("isRavAdmin", () => {
    function setupWithRoles(roles: string[]) {
      const user = mockUser();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockOnAuthStateChange.mockImplementation((callback: (...args: any[]) => void) => {
        callback("SIGNED_IN", {
          user,
          access_token: "token",
          refresh_token: "refresh",
          expires_in: 3600,
          token_type: "bearer",
        });
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      mockGetSession.mockResolvedValue({
        data: {
          session: {
            user,
            access_token: "token",
            refresh_token: "refresh",
            expires_in: 3600,
            token_type: "bearer",
          },
        },
        error: null,
      });

      // Mock profiles table (maybeSingle) and user_roles table
      mockFrom.mockImplementation((table: string) => {
        if (table === "user_roles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: roles.map((r) => ({ role: r })),
                error: null,
              }),
            }),
          };
        }
        // profiles table
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      });
    }

    it("returns true for rav_admin role", async () => {
      setupWithRoles(["rav_admin"]);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isRavAdmin()).toBe(true));
    });

    it("returns true for rav_owner role", async () => {
      setupWithRoles(["rav_owner"]);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isRavAdmin()).toBe(true));
    });

    it("returns false for rav_staff role", async () => {
      setupWithRoles(["rav_staff"]);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      // Wait for roles to load, then check
      await waitFor(() => expect(result.current.isRavTeam()).toBe(true));
      expect(result.current.isRavAdmin()).toBe(false);
    });

    it("returns false for non-RAV roles", async () => {
      setupWithRoles(["renter"]);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      // Wait a tick for roles to propagate
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await waitFor(() => expect(result.current.hasRole("renter" as any)).toBe(true));
      expect(result.current.isRavAdmin()).toBe(false);
    });
  });

  describe("resendVerificationEmail", () => {
    it("calls supabase.auth.resend with correct params", async () => {
      mockResend.mockResolvedValue({ error: null });

      const user = mockUser({ email: "verify@test.com" });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockOnAuthStateChange.mockImplementation((callback: (...args: any[]) => void) => {
        callback("SIGNED_IN", {
          user,
          access_token: "token",
          refresh_token: "refresh",
          expires_in: 3600,
          token_type: "bearer",
        });
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      mockGetSession.mockResolvedValue({
        data: {
          session: {
            user,
            access_token: "token",
            refresh_token: "refresh",
            expires_in: 3600,
            token_type: "bearer",
          },
        },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.user).not.toBeNull());

      let resendResult: { error: unknown };
      await act(async () => {
        resendResult = await result.current.resendVerificationEmail();
      });

      expect(mockResend).toHaveBeenCalledWith({
        type: "signup",
        email: "verify@test.com",
        options: expect.objectContaining({
          emailRedirectTo: expect.any(String),
        }),
      });
      expect(resendResult!.error).toBeNull();
    });

    it("returns error when no user email", async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let resendResult: { error: unknown };
      await act(async () => {
        resendResult = await result.current.resendVerificationEmail();
      });

      expect(mockResend).not.toHaveBeenCalled();
      expect(resendResult!.error).toEqual(
        expect.objectContaining({ message: "No email address found" })
      );
    });
  });
});
