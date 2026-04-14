/**
 * Admin Notification Center — 4-tab admin dashboard section.
 * GitHub Issue: #223
 *
 * Tab 1: Overview — stats, warnings, recent activity
 * Tab 2: Notification Types — catalog management
 * Tab 3: Event Calendar — event instances management
 * Tab 4: Delivery Log — full delivery history
 */

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  BarChart3,
  Bell,
  Calendar,
  Send,
  AlertTriangle,
  Eye,
  Edit2,
  XCircle,
  Download,
  Loader2,
  CheckCircle2,
  Clock,
  MessageSquare,
  Plus,
  LayoutTemplate,
  CalendarPlus,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { AdminEventTemplates } from "./AdminEventTemplates";
import { EventInstanceDialog, type EventInstance } from "./EventInstanceDialog";

const DESTINATION_LABELS: Record<string, string> = {
  orlando: "Orlando",
  miami: "Miami",
  las_vegas: "Las Vegas",
  maui_hawaii: "Maui/Hawaii",
  myrtle_beach: "Myrtle Beach",
  colorado: "Colorado",
  new_york: "New York",
  nashville: "Nashville",
};

const STATUS_COLORS: Record<string, string> = {
  sent: "bg-blue-100 text-blue-800",
  delivered: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  test: "bg-purple-100 text-purple-800",
  pending: "bg-yellow-100 text-yellow-800",
  skipped_no_consent: "bg-gray-100 text-gray-600",
  skipped_already_listed: "bg-gray-100 text-gray-600",
  skipped_frequency_cap: "bg-gray-100 text-gray-600",
  skipped_duplicate: "bg-gray-100 text-gray-600",
  skipped_no_channel: "bg-gray-100 text-gray-600",
  opted_out: "bg-orange-100 text-orange-800",
};

const CHANNEL_COLORS: Record<string, string> = {
  in_app: "bg-blue-100 text-blue-800",
  email: "bg-green-100 text-green-800",
  sms: "bg-purple-100 text-purple-800",
};

// ---- Overview Tab ----

function OverviewTab() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [recentLogs, setRecentLogs] = useState<Array<Record<string, unknown>>>([]);
  const [pendingEvents, setPendingEvents] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [statsResult, logsResult, pendingResult] = await Promise.all([
        supabase.rpc("get_notification_center_stats"),
        supabase
          .from("notification_delivery_log")
          .select("*, profiles(full_name)")
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("event_instances")
          .select("id", { count: "exact", head: true })
          .eq("date_confirmed", false)
          .eq("status", "active"),
      ]);

      if (statsResult.data) setStats(statsResult.data);
      if (logsResult.data) setRecentLogs(logsResult.data);
      if (pendingResult.count) setPendingEvents(pendingResult.count);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="py-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats?.total_sms_opted_in || 0}</div>
            <p className="text-sm text-muted-foreground">Owners opted in to SMS</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats?.messages_sent_30d || 0}</div>
            <p className="text-sm text-muted-foreground">Messages sent (30d)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {stats?.messages_sent_30d
                ? `${Math.round(((stats.messages_delivered_30d || 0) / stats.messages_sent_30d) * 100)}%`
                : "N/A"}
            </div>
            <p className="text-sm text-muted-foreground">SMS delivery rate (30d)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats?.pending_date_confirmations || 0}</div>
            <p className="text-sm text-muted-foreground">Pending date confirmations</p>
          </CardContent>
        </Card>
      </div>

      {/* Warning banner */}
      {pendingEvents > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-800">
              {pendingEvents} floating event(s) need date confirmation
            </p>
            <p className="text-sm text-amber-700">
              Go to Event Calendar tab to confirm dates for annual_floating events.
            </p>
          </div>
        </div>
      )}

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Last 20 notification deliveries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Test</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No delivery log entries yet
                    </TableCell>
                  </TableRow>
                ) : (
                  recentLogs.map((log: Record<string, unknown>) => (
                    <TableRow key={log.id as string}>
                      <TableCell className="text-sm">
                        {(log.profiles as { full_name: string } | null)?.full_name || "Unknown"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={CHANNEL_COLORS[log.channel as string] || ""}>
                          {log.channel as string}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-mono">{log.type_key as string}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_COLORS[log.status as string] || ""}>
                          {log.status as string}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.sent_at
                          ? formatDistanceToNow(new Date(log.sent_at as string), { addSuffix: true })
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {log.test_mode && <Badge variant="outline" className="bg-purple-50">Test</Badge>}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---- Notification Types Tab ----

function NotificationTypesTab() {
  const { toast } = useToast();
  const [catalog, setCatalog] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("notification_catalog")
        .select("*")
        .order("sort_order");
      if (data) setCatalog(data);
      setLoading(false);
    }
    load();
  }, []);

  const toggleField = async (id: string, field: string, value: boolean) => {
    const { error } = await supabase
      .from("notification_catalog")
      .update({ [field]: value })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setCatalog((prev) =>
        prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
      );
    }
  };

  if (loading) return <div className="py-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type Key</TableHead>
            <TableHead>Display Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Opt-out Level</TableHead>
            <TableHead>Channels</TableHead>
            <TableHead>Active</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {catalog.map((row) => (
            <TableRow key={row.id as string}>
              <TableCell className="font-mono text-xs">{row.type_key as string}</TableCell>
              <TableCell className="text-sm">{row.display_name as string}</TableCell>
              <TableCell>
                <Badge variant="outline">{row.category as string}</Badge>
              </TableCell>
              <TableCell className="text-sm">{row.opt_out_level as string}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {row.channel_in_app_allowed && <Badge variant="outline" className="text-xs bg-blue-50">In-app</Badge>}
                  {row.channel_email_allowed && <Badge variant="outline" className="text-xs bg-green-50">Email</Badge>}
                  {row.channel_sms_allowed && (
                    <Badge variant="outline" className="text-xs bg-purple-50">
                      <Switch
                        checked={row.channel_sms_allowed as boolean}
                        onCheckedChange={(v) => toggleField(row.id as string, "channel_sms_allowed", v)}
                        className="scale-75"
                      />
                      SMS
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Switch
                  checked={row.active as boolean}
                  onCheckedChange={(v) => toggleField(row.id as string, "active", v)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ---- Event Calendar Tab ----

function EventCalendarTab() {
  const { toast } = useToast();
  const [events, setEvents] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [destFilter, setDestFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("2026");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [confirmSend, setConfirmSend] = useState<Record<string, unknown> | null>(null);
  const [instanceDialogOpen, setInstanceDialogOpen] = useState(false);
  const [editingInstance, setEditingInstance] = useState<EventInstance | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [confirmGenerate, setConfirmGenerate] = useState<{ target: number; source: number } | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      let query = supabase
        .from("event_instances")
        .select("*, seasonal_events(name, recurrence_type, category)")
        .eq("year", parseInt(yearFilter))
        .order("event_date");

      if (destFilter !== "all") {
        query = query.eq("destination", destFilter);
      }

      const { data } = await query;
      if (data) setEvents(data);
      setLoading(false);
    }
    load();
  }, [destFilter, yearFilter, reloadKey]);

  const handleConfirmDate = async (instanceId: string) => {
    const { error } = await supabase
      .from("event_instances")
      .update({ date_confirmed: true })
      .eq("id", instanceId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setEvents((prev) =>
        prev.map((e) => (e.id === instanceId ? { ...e, date_confirmed: true } : e)),
      );
      toast({ title: "Date confirmed" });
    }
  };

  const handleManualSend = async (instance: Record<string, unknown>) => {
    setConfirmSend(null);
    setSendingId(instance.id as string);

    try {
      const { data, error } = await supabase.functions.invoke("sms-scheduler", {
        body: { instance_id: instance.id, force_send: true },
      });

      if (error) throw error;
      toast({ title: "Manual send triggered", description: JSON.stringify(data) });
    } catch (e) {
      toast({
        title: "Send failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
    setSendingId(null);
  };

  const handleGenerateYear = async (targetYear: number, sourceYear: number) => {
    setConfirmGenerate(null);
    setGenerating(true);
    try {
      const { data, error } = await supabase.rpc("generate_event_instances_for_year", {
        p_year: targetYear,
        p_source_year: sourceYear,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      toast({
        title: `Generated ${targetYear} instances`,
        description: `Created ${row?.created_count ?? 0} (${row?.confirmed_count ?? 0} confirmed, ${row?.unconfirmed_count ?? 0} need date confirmation). Skipped ${row?.skipped_count ?? 0} existing.`,
      });
      setYearFilter(String(targetYear));
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast({
        title: "Generation failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
    setGenerating(false);
  };

  const handleCancelInstance = async (instanceId: string) => {
    const { error } = await supabase
      .from("event_instances")
      .update({ status: "cancelled" })
      .eq("id", instanceId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setEvents((prev) =>
        prev.map((e) => (e.id === instanceId ? { ...e, status: "cancelled" } : e)),
      );
      toast({ title: "Event cancelled" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2025">2025</SelectItem>
            <SelectItem value="2026">2026</SelectItem>
            <SelectItem value="2027">2027</SelectItem>
          </SelectContent>
        </Select>
        <Select value={destFilter} onValueChange={setDestFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All destinations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All destinations</SelectItem>
            {Object.entries(DESTINATION_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={generating}
            onClick={() => {
              const target = parseInt(yearFilter) + 1;
              setConfirmGenerate({ target, source: parseInt(yearFilter) });
            }}
          >
            {generating ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <CalendarPlus className="h-4 w-4 mr-1.5" />
            )}
            Generate {parseInt(yearFilter) + 1}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingInstance(null);
              setInstanceDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Instance
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-muted-foreground">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>12wk</TableHead>
                <TableHead>6wk</TableHead>
                <TableHead>2wk</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No events found
                  </TableCell>
                </TableRow>
              ) : (
                events.map((ev) => {
                  const se = ev.seasonal_events as { name: string; recurrence_type: string; category: string } | null;
                  return (
                    <TableRow key={ev.id as string} className={ev.status === "cancelled" ? "opacity-50" : ""}>
                      <TableCell className="text-sm font-medium">
                        {se?.name || "Unknown"}
                        {se?.recurrence_type === "annual_floating" && !ev.date_confirmed && (
                          <Badge
                            variant="outline"
                            className="ml-2 bg-amber-50 text-amber-700 cursor-pointer"
                            onClick={() => handleConfirmDate(ev.id as string)}
                          >
                            Confirm date
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {DESTINATION_LABELS[ev.destination as string] || ev.destination}
                      </TableCell>
                      <TableCell className="text-sm font-mono">{ev.event_date as string}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{ev.reminder_12wk as string}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{ev.reminder_6wk as string}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{ev.reminder_2wk as string}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{ev.priority as string}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={ev.status === "active" ? "bg-green-50" : "bg-gray-50"}>
                          {ev.status as string}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="Edit"
                            onClick={() => {
                              setEditingInstance({
                                id: ev.id as string,
                                event_id: ev.event_id as string,
                                destination: (ev.destination as string | null) ?? null,
                                year: ev.year as number,
                                event_date: ev.event_date as string,
                                end_date: (ev.end_date as string | null) ?? null,
                                priority: ev.priority as string,
                                status: ev.status as string,
                                date_confirmed: ev.date_confirmed as boolean,
                                notes: (ev.notes as string | null) ?? null,
                              });
                              setInstanceDialogOpen(true);
                            }}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title={ev.destination ? "Manual send" : "No SMS destination"}
                            disabled={ev.status !== "active" || sendingId === ev.id || !ev.destination}
                            onClick={() => setConfirmSend(ev)}
                          >
                            {sendingId === ev.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Send className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          {ev.status === "active" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              title="Cancel event"
                              onClick={() => handleCancelInstance(ev.id as string)}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Generate year confirm dialog */}
      <AlertDialog open={!!confirmGenerate} onOpenChange={() => setConfirmGenerate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate {confirmGenerate?.target} event instances?</AlertDialogTitle>
            <AlertDialogDescription>
              This copies every active annual_fixed and annual_floating event from{" "}
              {confirmGenerate?.source} to {confirmGenerate?.target}. Existing{" "}
              {confirmGenerate?.target} instances are preserved. Floating events will need date
              confirmation before SMS reminders fire.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                confirmGenerate &&
                handleGenerateYear(confirmGenerate.target, confirmGenerate.source)
              }
            >
              Generate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add / Edit instance dialog */}
      <EventInstanceDialog
        open={instanceDialogOpen}
        onOpenChange={setInstanceDialogOpen}
        initial={editingInstance}
        defaultYear={parseInt(yearFilter)}
        onSaved={() => setReloadKey((k) => k + 1)}
      />

      {/* Manual send confirm dialog */}
      <AlertDialog open={!!confirmSend} onOpenChange={() => setConfirmSend(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send SMS reminders now?</AlertDialogTitle>
            <AlertDialogDescription>
              This will trigger SMS reminders for{" "}
              {(confirmSend?.seasonal_events as { name: string } | null)?.name || "this event"} at{" "}
              {DESTINATION_LABELS[(confirmSend?.destination as string) || ""] || confirmSend?.destination}.
              Messages will be sent to all opted-in owners (force_send bypasses frequency cap).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmSend && handleManualSend(confirmSend)}>
              Send Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---- Delivery Log Tab ----

function DeliveryLogTab() {
  const [logs, setLogs] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const perPage = 25;

  useEffect(() => {
    async function load() {
      setLoading(true);
      let query = supabase
        .from("notification_delivery_log")
        .select("*, profiles(full_name)")
        .order("created_at", { ascending: false })
        .range(page * perPage, (page + 1) * perPage - 1);

      if (channelFilter !== "all") query = query.eq("channel", channelFilter);
      if (statusFilter !== "all") query = query.eq("status", statusFilter);

      const { data } = await query;
      if (data) setLogs(data);
      setLoading(false);
    }
    load();
  }, [page, channelFilter, statusFilter]);

  const handleExportCsv = () => {
    const headers = ["Date", "User", "Channel", "Type", "Status", "Message", "Provider ID", "Test"];
    const rows = logs.map((l) => [
      l.created_at,
      (l.profiles as { full_name: string } | null)?.full_name || "",
      l.channel,
      l.type_key,
      l.status,
      (l.message_body as string || "").replace(/"/g, '""').slice(0, 100),
      l.twilio_message_sid || l.resend_message_id || "",
      l.test_mode ? "Yes" : "No",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `delivery-log-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={channelFilter} onValueChange={(v) => { setChannelFilter(v); setPage(0); }}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All channels</SelectItem>
            <SelectItem value="in_app">In-app</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="test">Test</SelectItem>
            <SelectItem value="skipped_no_consent">Skipped (no consent)</SelectItem>
            <SelectItem value="skipped_frequency_cap">Skipped (freq cap)</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={handleExportCsv}>
          <Download className="h-4 w-4 mr-1.5" />
          Export CSV
        </Button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-muted-foreground">Loading...</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Provider ID</TableHead>
                  <TableHead>Test</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No delivery log entries
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id as string}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {log.created_at
                          ? format(new Date(log.created_at as string), "MMM d, HH:mm")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {(log.profiles as { full_name: string } | null)?.full_name || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={CHANNEL_COLORS[log.channel as string] || ""}>
                          {log.channel as string}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{log.type_key as string}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_COLORS[log.status as string] || ""}>
                          {(log.status as string).replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs max-w-40 truncate">
                        {(log.message_body as string || "").slice(0, 60)}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {(log.twilio_message_sid as string) || (log.resend_message_id as string) || "—"}
                      </TableCell>
                      <TableCell>
                        {log.test_mode && <Badge variant="outline" className="bg-purple-50 text-xs">Test</Badge>}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">Page {page + 1}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={logs.length < perPage}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// ---- Main Component ----

export default function AdminNotificationCenter() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Center
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage notifications, seasonal events, and SMS delivery
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="overview" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="types" className="gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            Types
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5">
            <LayoutTemplate className="h-3.5 w-3.5" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Event Calendar
          </TabsTrigger>
          <TabsTrigger value="log" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Delivery Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="types">
          <NotificationTypesTab />
        </TabsContent>
        <TabsContent value="templates">
          <AdminEventTemplates />
        </TabsContent>
        <TabsContent value="calendar">
          <EventCalendarTab />
        </TabsContent>
        <TabsContent value="log">
          <DeliveryLogTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
