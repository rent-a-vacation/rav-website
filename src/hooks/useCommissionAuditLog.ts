import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/**
 * Recent change history for the platform commission rate.
 * Reads from admin_audit_log filtered to
 * (entity_type='system_setting', entity_key='platform_commission_rate').
 * Migration 080. Issue #510.
 *
 * RLS on admin_audit_log requires RAV team membership, so this hook only
 * returns data inside the admin dashboard context.
 */

export interface CommissionAuditEntry {
  id: string;
  actor_user_id: string;
  before_value: { rate?: number; pro_discount?: number; business_discount?: number } | null;
  after_value: { rate?: number; pro_discount?: number; business_discount?: number } | null;
  notes: string | null;
  created_at: string;
  actor_email?: string | null;
}

export function useCommissionAuditLog(limit = 5) {
  return useQuery<CommissionAuditEntry[]>({
    queryKey: ["commission-audit-log", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_audit_log")
        .select("id, actor_user_id, before_value, after_value, notes, created_at")
        .eq("entity_type", "system_setting")
        .eq("entity_key", "platform_commission_rate")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.warn("[useCommissionAuditLog] fetch failed", error);
        return [];
      }
      return (data as CommissionAuditEntry[]) ?? [];
    },
    staleTime: 30 * 1000, // 30s — refreshes after a save
  });
}
