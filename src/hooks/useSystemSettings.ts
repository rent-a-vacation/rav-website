import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

interface CommissionRateSettings {
  rate: number;
  proDiscount: number;
  businessDiscount: number;
}

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
  updateSetting: (key: string, value: Record<string, unknown>) => Promise<void>;
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
  const { isRavTeam, isRavAdmin } = useAuth();
  const [platformStaffOnly, setPlatformStaffOnly] = useState(true);
  const [requireUserApproval, setRequireUserApproval] = useState(true);
  const [autoApproveRoleUpgrades, setAutoApproveRoleUpgrades] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceSearchEnabled, setVoiceSearchEnabled] = useState(true);
  const [voiceListingEnabled, setVoiceListingEnabled] = useState(false);
  const [voiceBiddingEnabled, setVoiceBiddingEnabled] = useState(false);
  const [platformCommissionRate, setPlatformCommissionRate] = useState<CommissionRateSettings>({
    rate: 15,
    proDiscount: 2,
    businessDiscount: 5,
  });
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
              rate: (val.rate as number) ?? 15,
              proDiscount: (val.pro_discount as number) ?? 2,
              businessDiscount: (val.business_discount as number) ?? 5,
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
    value: Record<string, unknown>
  ) => {
    if (!isRavAdmin()) {
      throw new Error("Only RAV admins can update system settings");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("system_settings") as any)
      .update({
        setting_value: value,
        updated_at: new Date().toISOString(),
      })
      .eq("setting_key", key);

    if (error) throw error;

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
