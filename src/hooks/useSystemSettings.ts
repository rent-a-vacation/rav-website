import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";
import { DEFAULT_COMMISSION } from "@/config/commission";

interface CommissionRateSettings {
  rate: number;
  proDiscount: number;
  businessDiscount: number;
}

// Fallback in percent units (the JSONB row stores percentages, not decimals).
// Sourced from DEFAULT_COMMISSION so this file does not re-encode DEC-041.
const COMMISSION_FALLBACK_PERCENT: CommissionRateSettings = {
  rate: DEFAULT_COMMISSION.base * 100,
  proDiscount: DEFAULT_COMMISSION.proDiscount * 100,
  businessDiscount: DEFAULT_COMMISSION.businessDiscount * 100,
};

interface SystemSettings {
  platformStaffOnly: boolean;
  requireUserApproval: boolean;
  autoApproveRoleUpgrades: boolean;
  voiceEnabled: boolean;
  voiceSearchEnabled: boolean;
  voiceListingEnabled: boolean;
  voiceBiddingEnabled: boolean;
  platformCommissionRate: CommissionRateSettings;
  loading: boolean;
  /**
   * Update a system setting. The optional `notes` is recorded in
   * admin_audit_log alongside the before/after values for compliance.
   */
  updateSetting: (key: string, value: Record<string, unknown>, notes?: string) => Promise<void>;
  isVoiceFeatureActive: (feature: "search" | "listing" | "bidding") => boolean;
}

const ALL_SETTING_KEYS = [
  "platform_staff_only",
  "require_user_approval",
  "auto_approve_role_upgrades",
  "voice_enabled",
  "voice_search_enabled",
  "voice_listing_enabled",
  "voice_bidding_enabled",
  "platform_commission_rate",
];

export function useSystemSettings(): SystemSettings {
  const { user, isRavTeam, isRavAdmin } = useAuth();
  const [platformStaffOnly, setPlatformStaffOnly] = useState(true);
  const [requireUserApproval, setRequireUserApproval] = useState(true);
  const [autoApproveRoleUpgrades, setAutoApproveRoleUpgrades] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceSearchEnabled, setVoiceSearchEnabled] = useState(true);
  const [voiceListingEnabled, setVoiceListingEnabled] = useState(false);
  const [voiceBiddingEnabled, setVoiceBiddingEnabled] = useState(false);
  const [platformCommissionRate, setPlatformCommissionRate] =
    useState<CommissionRateSettings>(COMMISSION_FALLBACK_PERCENT);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ALL_SETTING_KEYS);

      if (error) throw error;

      for (const row of data || []) {
        const val = row.setting_value as Record<string, unknown>;
        switch (row.setting_key) {
          case "platform_staff_only":
            setPlatformStaffOnly(val.enabled as boolean);
            break;
          case "require_user_approval":
            setRequireUserApproval(val.enabled as boolean);
            break;
          case "auto_approve_role_upgrades":
            setAutoApproveRoleUpgrades(val.enabled as boolean);
            break;
          case "voice_enabled":
            setVoiceEnabled(val.enabled as boolean);
            break;
          case "voice_search_enabled":
            setVoiceSearchEnabled(val.enabled as boolean);
            break;
          case "voice_listing_enabled":
            setVoiceListingEnabled(val.enabled as boolean);
            break;
          case "voice_bidding_enabled":
            setVoiceBiddingEnabled(val.enabled as boolean);
            break;
          case "platform_commission_rate":
            setPlatformCommissionRate({
              rate: (val.rate as number) ?? COMMISSION_FALLBACK_PERCENT.rate,
              proDiscount: (val.pro_discount as number) ?? COMMISSION_FALLBACK_PERCENT.proDiscount,
              businessDiscount: (val.business_discount as number) ?? COMMISSION_FALLBACK_PERCENT.businessDiscount,
            });
            break;
        }
      }
    } catch (error) {
      console.error("Error fetching system settings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isRavTeam()) {
      fetchSettings();
    } else {
      setLoading(false);
    }
  }, [isRavTeam, fetchSettings]);

  const updateSetting = async (
    key: string,
    value: Record<string, unknown>,
    notes?: string,
  ) => {
    if (!isRavAdmin()) {
      throw new Error("Only RAV admins can update system settings");
    }

    // Capture BEFORE value for the audit-log entry. Best-effort:
    // an unreadable row should not block the update path.
    let beforeValue: Record<string, unknown> | null = null;
    try {
      const { data: prevRow } = await supabase
        .from("system_settings")
        .select("setting_value")
        .eq("setting_key", key)
        .maybeSingle();
      beforeValue = (prevRow?.setting_value as Record<string, unknown>) ?? null;
    } catch {
      // ignore — audit log will record before_value as null
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("system_settings") as any)
      .update({
        setting_value: value,
        updated_at: new Date().toISOString(),
      })
      .eq("setting_key", key);

    if (error) throw error;

    // Best-effort audit-log write. Failure here should NOT revert the
    // setting change — the operator already saw a toast. We surface to
    // console + Sentry-friendly so ops can backfill if needed.
    if (user?.id) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: auditError } = await (supabase.from("admin_audit_log") as any).insert({
          actor_user_id: user.id,
          action: "update",
          entity_type: "system_setting",
          entity_key: key,
          before_value: beforeValue,
          after_value: value,
          notes: notes && notes.trim() ? notes.trim() : null,
        });
        if (auditError) {
          console.warn("[system_settings] audit log write failed", { key, auditError });
        }
      } catch (auditException) {
        console.warn("[system_settings] audit log exception", { key, auditException });
      }
    }

    await fetchSettings();
  };

  const isVoiceFeatureActive = (feature: "search" | "listing" | "bidding") => {
    if (!voiceEnabled) return false;
    switch (feature) {
      case "search": return voiceSearchEnabled;
      case "listing": return voiceListingEnabled;
      case "bidding": return voiceBiddingEnabled;
    }
  };

  return {
    platformStaffOnly,
    requireUserApproval,
    autoApproveRoleUpgrades,
    voiceEnabled,
    voiceSearchEnabled,
    voiceListingEnabled,
    voiceBiddingEnabled,
    platformCommissionRate,
    loading,
    updateSetting,
    isVoiceFeatureActive,
  };
}
