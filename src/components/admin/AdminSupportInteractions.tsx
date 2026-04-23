// Phase 22 D2 (#411) — admin tab for RAVIO support observability.
// Metrics cards + filter bar + transcripts table + detail dialog.

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  MessagesSquare,
  Gauge,
  Flame,
  Timer,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Wrench,
  User,
  Bot,
} from "lucide-react";
import {
  useSupportConversations,
  useSupportMetrics,
  useSupportConversation,
  type ConversationListFilters,
  type ConversationWithUser,
} from "@/hooks/useSupportConversations";
import { formatPercent, formatDurationMs } from "@/lib/supportMetrics";
import { cn } from "@/lib/utils";

type EscalatedFilter = "all" | "yes" | "no";
type RatingFilter = "all" | "up" | "down" | "unrated";

function defaultDateWindow() {
  const now = new Date();
  const dateTo = new Date(now);
  dateTo.setDate(dateTo.getDate() + 1);
  const dateFrom = new Date(now);
  dateFrom.setDate(dateFrom.getDate() - 30);
  return { dateFrom: dateFrom.toISOString(), dateTo: dateTo.toISOString() };
}

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function durationBetween(startIso: string, endIso: string | null): string {
  if (!endIso) return "—";
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  return formatDurationMs(ms);
}

const AdminSupportInteractions = () => {
  const { dateFrom: initialFrom, dateTo: initialTo } = defaultDateWindow();
  const [dateFrom, setDateFrom] = useState(initialFrom);
  const [dateTo, setDateTo] = useState(initialTo);
  const [searchEmail, setSearchEmail] = useState("");
  const [escalated, setEscalated] = useState<EscalatedFilter>("all");
  const [rating, setRating] = useState<RatingFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filters: ConversationListFilters = useMemo(
    () => ({ searchEmail, dateFrom, dateTo, escalated, rating, limit: 100 }),
    [searchEmail, dateFrom, dateTo, escalated, rating],
  );

  const { data: conversations = [], isLoading } = useSupportConversations(filters);
  const { data: metrics, isLoading: metricsLoading } = useSupportMetrics({ dateFrom, dateTo });

  return (
    <div className="space-y-6">
      {/* Metrics cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<MessagesSquare className="h-5 w-5 text-primary" />}
          label="Conversations"
          value={metricsLoading ? "…" : `${metrics?.total_conversations ?? 0}`}
          sublabel={`${metrics?.ended_conversations ?? 0} ended`}
        />
        <MetricCard
          icon={<Gauge className="h-5 w-5 text-emerald-600" />}
          label="Deflection"
          value={metricsLoading ? "…" : formatPercent(metrics?.deflection_pct)}
          sublabel="Ended without escalation"
        />
        <MetricCard
          icon={<Flame className="h-5 w-5 text-orange-500" />}
          label="Escalation"
          value={metricsLoading ? "…" : formatPercent(metrics?.escalation_pct)}
          sublabel={`${metrics?.escalated_count ?? 0} escalated`}
        />
        <MetricCard
          icon={<Timer className="h-5 w-5 text-blue-500" />}
          label="Median Response"
          value={metricsLoading ? "…" : formatDurationMs(metrics?.median_response_ms)}
          sublabel="User → assistant"
        />
      </div>

      {/* Feedback summary */}
      <Card>
        <CardContent className="pt-6 flex flex-wrap gap-6 items-center text-sm">
          <span className="text-muted-foreground">User feedback in window:</span>
          <span className="flex items-center gap-1">
            <ThumbsUp className="h-4 w-4 text-emerald-600" />
            {metrics?.positive_rating_count ?? 0} helpful
          </span>
          <span className="flex items-center gap-1">
            <ThumbsDown className="h-4 w-4 text-muted-foreground" />
            {metrics?.negative_rating_count ?? 0} not helpful
          </span>
          <span className="text-muted-foreground">
            ({metrics?.rated_count ?? 0} of {metrics?.total_conversations ?? 0} rated)
          </span>
        </CardContent>
      </Card>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by user email..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="pl-10"
          />
        </div>
        <Input
          type="date"
          value={dateFrom.slice(0, 10)}
          onChange={(e) => setDateFrom(new Date(e.target.value).toISOString())}
          className="w-[160px]"
          aria-label="Start date"
        />
        <Input
          type="date"
          value={dateTo.slice(0, 10)}
          onChange={(e) => setDateTo(new Date(e.target.value).toISOString())}
          className="w-[160px]"
          aria-label="End date"
        />
        <Select value={escalated} onValueChange={(v) => setEscalated(v as EscalatedFilter)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Escalation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="yes">Escalated</SelectItem>
            <SelectItem value="no">Not escalated</SelectItem>
          </SelectContent>
        </Select>
        <Select value={rating} onValueChange={(v) => setRating(v as RatingFilter)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any rating</SelectItem>
            <SelectItem value="up">Helpful</SelectItem>
            <SelectItem value="down">Not helpful</SelectItem>
            <SelectItem value="unrated">Unrated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transcripts table */}
      {isLoading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : conversations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessagesSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">No support conversations match the filters.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Turns</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conversations.map((c) => (
                <TranscriptRow key={c.id} conversation={c} onOpen={() => setSelectedId(c.id)} />
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <TranscriptDialog
        conversationId={selectedId}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </div>
  );
};

function MetricCard({
  icon,
  label,
  value,
  sublabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6 space-y-1">
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          {icon}
          <span>{label}</span>
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{sublabel}</p>
      </CardContent>
    </Card>
  );
}

function TranscriptRow({
  conversation,
  onOpen,
}: {
  conversation: ConversationWithUser;
  onOpen: () => void;
}) {
  const turnCount =
    conversation.user_message_count + conversation.assistant_message_count + conversation.tool_call_count;

  return (
    <TableRow>
      <TableCell>
        <p className="font-medium text-sm">{conversation.user?.full_name || "Unknown"}</p>
        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
          {conversation.user?.email ?? ""}
        </p>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {formatRelative(conversation.started_at)}
      </TableCell>
      <TableCell className="text-xs">
        {durationBetween(conversation.started_at, conversation.ended_at)}
      </TableCell>
      <TableCell className="text-xs">{turnCount}</TableCell>
      <TableCell>
        {conversation.escalated_at ? (
          <Badge variant="outline" className="border-orange-400/50 text-orange-700">
            Escalated
          </Badge>
        ) : conversation.ended_at ? (
          <Badge variant="outline" className="border-emerald-400/50 text-emerald-700">
            Deflected
          </Badge>
        ) : (
          <Badge variant="outline">In progress</Badge>
        )}
      </TableCell>
      <TableCell>
        {conversation.user_rating === 1 ? (
          <ThumbsUp className="h-4 w-4 text-emerald-600" />
        ) : conversation.user_rating === -1 ? (
          <ThumbsDown className="h-4 w-4 text-orange-600" />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <Button size="sm" variant="outline" onClick={onOpen}>
          View transcript
        </Button>
      </TableCell>
    </TableRow>
  );
}

function TranscriptDialog({
  conversationId,
  onOpenChange,
}: {
  conversationId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isLoading } = useSupportConversation(conversationId);

  return (
    <Dialog open={!!conversationId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Support Conversation</DialogTitle>
          <DialogDescription>
            {data?.conversation.user?.full_name || "User"} ·{" "}
            {data?.conversation.user?.email ?? ""}
          </DialogDescription>
        </DialogHeader>

        {isLoading || !data ? (
          <Skeleton className="h-72 w-full" />
        ) : (
          <div className="space-y-4">
            <TranscriptMeta conversation={data.conversation} />

            <div className="space-y-3">
              {data.messages.map((msg) => (
                <TurnRow key={msg.id} msg={msg} />
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TranscriptMeta({ conversation }: { conversation: ConversationWithUser }) {
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      <Badge variant="outline">Route: {conversation.route_context}</Badge>
      {conversation.classifier_context_detected && (
        <Badge variant="outline">
          Classifier detected: {conversation.classifier_context_detected}
        </Badge>
      )}
      <Badge variant="outline">Used: {conversation.classifier_context_used}</Badge>
      {conversation.classifier_dismissed && <Badge variant="outline">Classifier dismissed</Badge>}
      {conversation.escalated_to_dispute_id && (
        <Badge className="bg-orange-100 text-orange-700">
          Escalated → dispute {conversation.escalated_to_dispute_id.slice(0, 8)}…
        </Badge>
      )}
      {conversation.user_rating === 1 && (
        <Badge className="bg-emerald-100 text-emerald-700">Helpful</Badge>
      )}
      {conversation.user_rating === -1 && (
        <Badge className="bg-orange-100 text-orange-700">Not helpful</Badge>
      )}
    </div>
  );
}

type TurnMessage = {
  id: string;
  turn_index: number;
  turn_type: "user" | "assistant" | "tool_call" | "tool_result" | "error";
  content: string | null;
  tool_name: string | null;
  tool_args: unknown;
  tool_result_json: unknown;
  created_at: string;
};

function TurnRow({ msg }: { msg: TurnMessage }) {
  switch (msg.turn_type) {
    case "user":
      return (
        <div className="flex gap-2">
          <User className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
          <div className="flex-1 text-sm rounded-md bg-primary/5 p-3 whitespace-pre-wrap">
            {msg.content}
          </div>
        </div>
      );
    case "assistant":
      return (
        <div className="flex gap-2">
          <Bot className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 text-sm rounded-md bg-muted/40 p-3 whitespace-pre-wrap">
            {msg.content}
          </div>
        </div>
      );
    case "tool_call":
      return (
        <div className="text-xs text-muted-foreground pl-6 border-l-2 border-muted py-1">
          <Wrench className="inline h-3.5 w-3.5 mr-1" />
          Called <code className="font-mono">{msg.tool_name}</code>
          {msg.tool_args ? (
            <details className="ml-5 mt-1">
              <summary className="cursor-pointer">args</summary>
              <pre className="mt-1 p-2 bg-muted rounded text-[11px] overflow-x-auto">
                {JSON.stringify(msg.tool_args, null, 2)}
              </pre>
            </details>
          ) : null}
        </div>
      );
    case "tool_result":
      return (
        <div className="text-xs text-muted-foreground pl-6 border-l-2 border-muted py-1">
          <Wrench className="inline h-3.5 w-3.5 mr-1" />
          Result from <code className="font-mono">{msg.tool_name}</code>
          {msg.tool_result_json ? (
            <details className="ml-5 mt-1">
              <summary className="cursor-pointer">result</summary>
              <pre className="mt-1 p-2 bg-muted rounded text-[11px] overflow-x-auto">
                {JSON.stringify(msg.tool_result_json, null, 2)}
              </pre>
            </details>
          ) : null}
        </div>
      );
    case "error":
      return (
        <div className={cn("flex gap-2 text-sm rounded-md p-3 bg-red-50 text-red-700")}>
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{msg.content ?? "(unknown error)"}</span>
        </div>
      );
  }
}

export default AdminSupportInteractions;
