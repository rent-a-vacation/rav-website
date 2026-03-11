import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/render";

// Mock hooks
const mockKeys = [
  {
    id: "key-1",
    owner_user_id: "user-1",
    owner_email: "partner@example.com",
    name: "Travel Agent API",
    key_prefix: "rav_pk_abcd",
    scopes: ["listings:read", "search"],
    tier: "partner",
    daily_limit: 10000,
    per_minute_limit: 100,
    daily_usage: 42,
    is_active: true,
    revoked_at: null,
    expires_at: null,
    last_used_at: "2026-03-10T12:00:00Z",
    created_at: "2026-03-01T00:00:00Z",
    allowed_ips: ["203.0.113.5"],
  },
  {
    id: "key-2",
    owner_user_id: "user-1",
    owner_email: "partner@example.com",
    name: "Revoked Key",
    key_prefix: "rav_pk_1234",
    scopes: ["listings:read"],
    tier: "free",
    daily_limit: 100,
    per_minute_limit: 10,
    daily_usage: 0,
    is_active: false,
    revoked_at: "2026-03-05T00:00:00Z",
    expires_at: null,
    last_used_at: null,
    created_at: "2026-02-01T00:00:00Z",
    allowed_ips: null,
  },
];

vi.mock("@/hooks/admin/useApiKeys", () => ({
  useApiKeys: () => ({ data: mockKeys, isLoading: false }),
  useCreateApiKey: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRevokeApiKey: () => ({ mutateAsync: vi.fn() }),
  useUpdateApiKeyIps: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useApiKeyStats: () => ({ data: [] }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "admin-1", email: "admin@rav.com" },
    isRavAdmin: () => true,
    isRavTeam: () => true,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

import AdminApiKeys from "../AdminApiKeys";

describe("AdminApiKeys", () => {
  it("renders the API Keys header", () => {
    renderWithProviders(<AdminApiKeys />);
    expect(screen.getByText("API Keys")).toBeInTheDocument();
  });

  it("shows active key count", () => {
    renderWithProviders(<AdminApiKeys />);
    expect(screen.getByText(/Active Keys \(1\)/)).toBeInTheDocument();
  });

  it("displays key name and prefix", () => {
    renderWithProviders(<AdminApiKeys />);
    expect(screen.getByText("Travel Agent API")).toBeInTheDocument();
    expect(screen.getByText("rav_pk_abcd...")).toBeInTheDocument();
  });

  it("shows tier badges", () => {
    renderWithProviders(<AdminApiKeys />);
    expect(screen.getByText("partner")).toBeInTheDocument();
    expect(screen.getByText("free")).toBeInTheDocument();
  });

  it("shows usage counter", () => {
    renderWithProviders(<AdminApiKeys />);
    expect(screen.getByText("42 / 10000")).toBeInTheDocument();
  });

  it("shows active and revoked status badges", () => {
    renderWithProviders(<AdminApiKeys />);
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Revoked")).toBeInTheDocument();
  });

  it("has Create Key button", () => {
    renderWithProviders(<AdminApiKeys />);
    expect(screen.getByText("Create Key")).toBeInTheDocument();
  });
});
