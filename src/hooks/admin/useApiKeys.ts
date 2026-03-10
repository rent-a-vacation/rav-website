import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpc = supabase.rpc as any;

export interface ApiKeyRow {
  id: string;
  owner_user_id: string;
  owner_email: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  tier: string;
  daily_limit: number;
  per_minute_limit: number;
  daily_usage: number;
  is_active: boolean;
  revoked_at: string | null;
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
}

export interface ApiKeyStats {
  endpoint: string;
  request_count: number;
  avg_response_time_ms: number;
  error_count: number;
  day: string;
}

const API_KEY_TIERS = {
  free: { daily: 100, perMinute: 10 },
  partner: { daily: 10_000, perMinute: 100 },
  premium: { daily: 100_000, perMinute: 500 },
} as const;

/** List all API keys (admin only) */
export function useApiKeys() {
  return useQuery<ApiKeyRow[]>({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const { data, error } = await rpc("list_api_keys");
      if (error) throw error;
      return (data ?? []) as ApiKeyRow[];
    },
  });
}

/** Get usage stats for a specific API key */
export function useApiKeyStats(keyId: string | null, days = 7) {
  return useQuery<ApiKeyStats[]>({
    queryKey: ["api-key-stats", keyId, days],
    enabled: !!keyId,
    queryFn: async () => {
      const { data, error } = await rpc("get_api_key_stats", {
        p_key_id: keyId,
        p_days: days,
      });
      if (error) throw error;
      return (data ?? []) as ApiKeyStats[];
    },
  });
}

/** Create a new API key — returns the full key (shown once) */
export function useCreateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      name: string;
      scopes: string[];
      tier: keyof typeof API_KEY_TIERS;
      ownerId: string;
    }) => {
      // Generate key client-side (shown to user once)
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      const hex = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const fullKey = `rav_pk_${hex}`;
      const keyPrefix = fullKey.substring(0, 12);

      // Hash the key for storage
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest(
        "SHA-256",
        encoder.encode(fullKey)
      );
      const keyHash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const tierLimits = API_KEY_TIERS[params.tier];

      const { error } = await supabase.from("api_keys").insert({
        owner_user_id: params.ownerId,
        name: params.name,
        key_prefix: keyPrefix,
        key_hash: keyHash,
        scopes: params.scopes,
        tier: params.tier,
        daily_limit: tierLimits.daily,
        per_minute_limit: tierLimits.perMinute,
      });

      if (error) throw error;
      return fullKey; // Return the full key — shown to user once
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
  });
}

/** Revoke an API key */
export function useRevokeApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await supabase
        .from("api_keys")
        .update({ is_active: false, revoked_at: new Date().toISOString() })
        .eq("id", keyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
  });
}
