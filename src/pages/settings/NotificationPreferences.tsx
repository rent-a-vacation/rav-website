/**
 * Owner Notification Preferences — /settings/notifications
 * GitHub Issue: #222
 *
 * Accessible to property_owner role. Shows contact info, SMS opt-in with TCPA consent,
 * and per-type per-channel notification preferences driven by notification_catalog.
 */

import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Bell, Mail, Phone, Shield, Loader2, ArrowLeft, Check } from "lucide-react";

interface CatalogEntry {
  id: string;
  type_key: string;
  display_name: string;
  description: string;
  category: string;
  opt_out_level: string;
  default_in_app: boolean;
  default_email: boolean;
  default_sms: boolean;
  channel_in_app_allowed: boolean;
  channel_email_allowed: boolean;
  channel_sms_allowed: boolean;
  sort_order: number;
}

interface UserPref {
  type_key: string;
  channel: string;
  enabled: boolean;
}

const TCPA_CONSENT_TEXT =
  "By enabling SMS, you agree to receive marketing and informational text messages from Rent-A-Vacation at the number provided. Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe at any time. Reply HELP for help.";

const CATEGORY_LABELS: Record<string, string> = {
  transactional: "Bookings & Payments",
  marketing: "Seasonal Reminders",
  system: "Platform Updates",
};

const CATEGORY_ORDER = ["transactional", "marketing", "system"];

function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (phone.startsWith("+") && /^\+[1-9]\d{1,14}$/.test(phone)) return phone;
  return null;
}

const NotificationPreferences = () => {
  usePageMeta({
    title: "Notification Preferences | Rent-A-Vacation",
    description: "Manage your notification preferences and SMS settings",
  });

  const { user, profile } = useAuth();
  const { toast } = useToast();

  // Contact info state
  const [phoneInput, setPhoneInput] = useState("");
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [showTcpaConsent, setShowTcpaConsent] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [savingContact, setSavingContact] = useState(false);

  // Catalog & preferences state
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [userPrefs, setUserPrefs] = useState<UserPref[]>([]);
  const [localPrefs, setLocalPrefs] = useState<Record<string, Record<string, boolean>>>({});
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Load data
  useEffect(() => {
    if (!user) return;

    async function loadData() {
      setLoadingPrefs(true);

      const [catalogResult, prefsResult] = await Promise.all([
        supabase
          .from("notification_catalog")
          .select("*")
          .eq("active", true)
          .order("sort_order"),
        supabase
          .from("user_notification_preferences")
          .select("type_key, channel, enabled")
          .eq("user_id", user!.id),
      ]);

      if (catalogResult.data) setCatalog(catalogResult.data);
      if (prefsResult.data) setUserPrefs(prefsResult.data);

      // Build local prefs map (effective values)
      const prefs: Record<string, Record<string, boolean>> = {};
      if (catalogResult.data) {
        for (const entry of catalogResult.data) {
          prefs[entry.type_key] = {};
          const channels = ["in_app", "email", "sms"] as const;
          for (const ch of channels) {
            const allowedKey = `channel_${ch}_allowed` as keyof CatalogEntry;
            if (!entry[allowedKey]) continue;

            const defaultKey = `default_${ch}` as keyof CatalogEntry;
            let effective = entry[defaultKey] as boolean;

            // Check for explicit user preference
            const explicit = prefsResult.data?.find(
              (p) => p.type_key === entry.type_key && p.channel === ch,
            );
            if (explicit) effective = explicit.enabled;

            prefs[entry.type_key][ch] = effective;
          }
        }
      }
      setLocalPrefs(prefs);
      setLoadingPrefs(false);
    }

    loadData();
  }, [user]);

  // Load profile SMS settings
  useEffect(() => {
    if (profile) {
      setPhoneInput(profile.phone_e164 || profile.phone || "");
      setSmsEnabled(profile.sms_opted_in || false);
    }
  }, [profile]);

  const handleTogglePref = useCallback(
    (typeKey: string, channel: string, value: boolean) => {
      setLocalPrefs((prev) => ({
        ...prev,
        [typeKey]: { ...prev[typeKey], [channel]: value },
      }));
    },
    [],
  );

  const handleSaveContact = async () => {
    if (!user) return;
    setSavingContact(true);

    const normalized = phoneInput ? normalizePhone(phoneInput) : null;
    if (phoneInput && !normalized) {
      toast({ title: "Invalid phone number", description: "Please enter a valid US phone number.", variant: "destructive" });
      setSavingContact(false);
      return;
    }

    const updateData: Record<string, unknown> = {
      phone_e164: normalized,
    };

    if (smsEnabled && !profile?.sms_opted_in) {
      updateData.sms_opted_in = true;
      updateData.sms_opted_in_at = new Date().toISOString();
    } else if (!smsEnabled && profile?.sms_opted_in) {
      updateData.sms_opted_in = false;
      updateData.sms_opted_out_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Contact info saved" });
    }
    setSavingContact(false);
  };

  const handleEnableSms = () => {
    if (!phoneInput || !normalizePhone(phoneInput)) {
      toast({ title: "Phone number required", description: "Enter a valid phone number to enable SMS.", variant: "destructive" });
      return;
    }
    setShowTcpaConsent(true);
  };

  const handleConfirmSmsEnable = async () => {
    setSmsEnabled(true);
    setShowTcpaConsent(false);

    const normalized = normalizePhone(phoneInput);
    const { error } = await supabase
      .from("profiles")
      .update({
        phone_e164: normalized,
        sms_opted_in: true,
        sms_opted_in_at: new Date().toISOString(),
      })
      .eq("id", user!.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setSmsEnabled(false);
    } else {
      toast({ title: "SMS reminders enabled" });
    }
  };

  const handleDisableSms = async () => {
    setShowDisableConfirm(false);
    setSmsEnabled(false);

    const { error } = await supabase
      .from("profiles")
      .update({
        sms_opted_in: false,
        sms_opted_out_at: new Date().toISOString(),
      })
      .eq("id", user!.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setSmsEnabled(true);
    } else {
      toast({ title: "SMS reminders disabled" });
    }
  };

  const handleSavePreferences = async () => {
    if (!user) return;
    setSavingPrefs(true);

    // Compare local prefs to catalog defaults, upsert/delete as needed
    const upserts: Array<{ user_id: string; type_key: string; channel: string; enabled: boolean; updated_at: string }> = [];
    const deletes: Array<{ type_key: string; channel: string }> = [];

    for (const entry of catalog) {
      const channels = ["in_app", "email", "sms"] as const;
      for (const ch of channels) {
        const allowedKey = `channel_${ch}_allowed` as keyof CatalogEntry;
        if (!entry[allowedKey]) continue;

        const defaultKey = `default_${ch}` as keyof CatalogEntry;
        const defaultValue = entry[defaultKey] as boolean;
        const currentValue = localPrefs[entry.type_key]?.[ch];

        if (currentValue === undefined) continue;

        if (currentValue !== defaultValue) {
          upserts.push({
            user_id: user.id,
            type_key: entry.type_key,
            channel: ch,
            enabled: currentValue,
            updated_at: new Date().toISOString(),
          });
        } else {
          // Reset to default — delete the row if it exists
          deletes.push({ type_key: entry.type_key, channel: ch });
        }
      }
    }

    // Batch upsert
    if (upserts.length > 0) {
      const { error } = await supabase
        .from("user_notification_preferences")
        .upsert(upserts, { onConflict: "user_id,type_key,channel" });

      if (error) {
        toast({ title: "Error saving preferences", description: error.message, variant: "destructive" });
        setSavingPrefs(false);
        return;
      }
    }

    // Delete rows that match defaults
    for (const d of deletes) {
      await supabase
        .from("user_notification_preferences")
        .delete()
        .eq("user_id", user.id)
        .eq("type_key", d.type_key)
        .eq("channel", d.channel);
    }

    toast({ title: "Notification preferences saved" });
    setSavingPrefs(false);
  };

  // Group catalog by category
  const groupedCatalog = CATEGORY_ORDER.reduce(
    (acc, cat) => {
      const entries = catalog.filter((e) => e.category === cat);
      if (entries.length > 0) acc[cat] = entries;
      return acc;
    },
    {} as Record<string, CatalogEntry[]>,
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main id="main-content" className="flex-1 pt-16 md:pt-20">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <Link to="/notifications">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Notification Preferences</h1>
              <p className="text-sm text-muted-foreground">
                Control how and when you receive notifications
              </p>
            </div>
          </div>

          {/* Section 1: Contact Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information
              </CardTitle>
              <CardDescription>
                Your email and phone number for notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email (read-only) */}
              <div>
                <Label className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input value={user?.email || ""} disabled className="bg-muted" />
                  <Link to="/account">
                    <Button variant="outline" size="sm">
                      Change
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Phone number */}
              <div>
                <Label htmlFor="phone" className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="+1 (555) 555-5555"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  US phone number for SMS reminders (E.164 format)
                </p>
              </div>

              {/* SMS toggle */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label className="font-medium">
                      Receive SMS reminders about peak rental seasons at your resort
                    </Label>
                  </div>
                  <Switch
                    checked={smsEnabled}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleEnableSms();
                      } else {
                        setShowDisableConfirm(true);
                      }
                    }}
                  />
                </div>
                {smsEnabled && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Check className="h-3 w-3 text-green-600" />
                    SMS reminders are active
                  </p>
                )}
              </div>

              <Button onClick={handleSaveContact} disabled={savingContact}>
                {savingContact && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Contact Info
              </Button>
            </CardContent>
          </Card>

          {/* Section 2: Notification Type Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Types
              </CardTitle>
              <CardDescription>
                Choose which notifications you receive and how
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPrefs ? (
                <div className="py-8 text-center text-muted-foreground">
                  Loading preferences...
                </div>
              ) : (
                <div className="space-y-6">
                  {CATEGORY_ORDER.filter((cat) => groupedCatalog[cat]).map((cat) => (
                    <div key={cat}>
                      <h3 className="font-semibold text-sm mb-3">
                        {CATEGORY_LABELS[cat] || cat}
                      </h3>
                      <div className="space-y-3">
                        {groupedCatalog[cat].map((entry) => (
                          <div
                            key={entry.type_key}
                            className="border rounded-lg p-4"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">
                                    {entry.display_name}
                                  </span>
                                  {entry.opt_out_level === "mandatory" && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Shield className="h-3 w-3 mr-1" />
                                      Required
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {entry.description}
                                </p>
                              </div>
                            </div>

                            {entry.opt_out_level !== "mandatory" && (
                              <div className="flex items-center gap-4 mt-3 pt-3 border-t">
                                {entry.channel_in_app_allowed && (
                                  <label className="flex items-center gap-1.5 text-sm">
                                    <Switch
                                      checked={localPrefs[entry.type_key]?.in_app ?? entry.default_in_app}
                                      onCheckedChange={(v) =>
                                        handleTogglePref(entry.type_key, "in_app", v)
                                      }
                                      disabled={
                                        entry.opt_out_level === "channel_only" &&
                                        !localPrefs[entry.type_key]?.email &&
                                        !localPrefs[entry.type_key]?.sms &&
                                        localPrefs[entry.type_key]?.in_app
                                      }
                                    />
                                    In-app
                                  </label>
                                )}
                                {entry.channel_email_allowed && (
                                  <label className="flex items-center gap-1.5 text-sm">
                                    <Switch
                                      checked={localPrefs[entry.type_key]?.email ?? entry.default_email}
                                      onCheckedChange={(v) =>
                                        handleTogglePref(entry.type_key, "email", v)
                                      }
                                      disabled={
                                        entry.opt_out_level === "channel_only" &&
                                        !localPrefs[entry.type_key]?.in_app &&
                                        !localPrefs[entry.type_key]?.sms &&
                                        localPrefs[entry.type_key]?.email
                                      }
                                    />
                                    Email
                                  </label>
                                )}
                                {entry.channel_sms_allowed && (
                                  <label className="flex items-center gap-1.5 text-sm">
                                    <Switch
                                      checked={localPrefs[entry.type_key]?.sms ?? entry.default_sms}
                                      onCheckedChange={(v) =>
                                        handleTogglePref(entry.type_key, "sms", v)
                                      }
                                      disabled={!smsEnabled}
                                    />
                                    SMS
                                    {!smsEnabled && entry.channel_sms_allowed && (
                                      <span className="text-xs text-muted-foreground">
                                        (enable SMS above)
                                      </span>
                                    )}
                                  </label>
                                )}
                              </div>
                            )}

                            {entry.opt_out_level === "mandatory" && (
                              <div className="flex items-center gap-4 mt-3 pt-3 border-t text-sm text-muted-foreground">
                                {entry.channel_in_app_allowed && (
                                  <span className="flex items-center gap-1">
                                    <Check className="h-3 w-3 text-green-600" />
                                    In-app
                                  </span>
                                )}
                                {entry.channel_email_allowed && (
                                  <span className="flex items-center gap-1">
                                    <Check className="h-3 w-3 text-green-600" />
                                    Email
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <Separator className="mt-4" />
                    </div>
                  ))}

                  <Button
                    onClick={handleSavePreferences}
                    disabled={savingPrefs}
                    className="w-full"
                  >
                    {savingPrefs && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Preferences
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />

      {/* TCPA Consent Dialog */}
      <AlertDialog open={showTcpaConsent} onOpenChange={setShowTcpaConsent}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enable SMS Reminders</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              {TCPA_CONSENT_TEXT}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSmsEnable}>
              Confirm and enable SMS
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disable SMS Confirm Dialog */}
      <AlertDialog open={showDisableConfirm} onOpenChange={setShowDisableConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable SMS Reminders?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? You'll miss reminders about peak booking periods at your resort.
              You can re-enable at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep enabled</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisableSms} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Disable SMS
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default NotificationPreferences;
