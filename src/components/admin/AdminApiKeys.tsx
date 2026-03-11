import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useApiKeys,
  useCreateApiKey,
  useRevokeApiKey,
  useUpdateApiKeyIps,
  useApiKeyStats,
} from "@/hooks/admin/useApiKeys";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Key, Plus, Copy, Ban, BarChart3, Shield } from "lucide-react";

const SCOPE_OPTIONS = [
  { value: "listings:read", label: "Listings (Read)" },
  { value: "search", label: "Search" },
  { value: "chat", label: "Chat" },
];

const TIER_OPTIONS = [
  { value: "free", label: "Free (100/day, 10/min)" },
  { value: "partner", label: "Partner (10K/day, 100/min)" },
  { value: "premium", label: "Premium (100K/day, 500/min)" },
];

export default function AdminApiKeys() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: keys = [], isLoading } = useApiKeys();
  const createKey = useCreateApiKey();
  const revokeKey = useRevokeApiKey();
  const updateIps = useUpdateApiKeyIps();

  const [createOpen, setCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyTier, setNewKeyTier] = useState<"free" | "partner" | "premium">("free");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["listings:read"]);
  const [newKeyAllowedIps, setNewKeyAllowedIps] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const [statsKeyId, setStatsKeyId] = useState<string | null>(null);
  const [editIpsKeyId, setEditIpsKeyId] = useState<string | null>(null);
  const [editIpsValue, setEditIpsValue] = useState("");
  const { data: stats = [] } = useApiKeyStats(statsKeyId);

  const handleCreate = async () => {
    if (!newKeyName.trim() || !user?.id) return;

    const parsedIps = newKeyAllowedIps
      .split(",")
      .map((ip) => ip.trim())
      .filter(Boolean);

    try {
      const fullKey = await createKey.mutateAsync({
        name: newKeyName.trim(),
        scopes: selectedScopes,
        tier: newKeyTier,
        ownerId: user.id,
        ...(parsedIps.length > 0 ? { allowedIps: parsedIps } : {}),
      });
      setGeneratedKey(fullKey);
      toast({ title: "API key created", description: "Copy the key now — it won't be shown again." });
    } catch {
      toast({ title: "Error", description: "Failed to create API key", variant: "destructive" });
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      await revokeKey.mutateAsync(revokeTarget);
      toast({ title: "API key revoked" });
    } catch {
      toast({ title: "Error", description: "Failed to revoke key", variant: "destructive" });
    }
    setRevokeTarget(null);
  };

  const resetCreateDialog = () => {
    setNewKeyName("");
    setNewKeyTier("free");
    setSelectedScopes(["listings:read"]);
    setNewKeyAllowedIps("");
    setGeneratedKey(null);
    setCreateOpen(false);
  };

  const handleSaveIps = async () => {
    if (!editIpsKeyId) return;
    const parsedIps = editIpsValue
      .split(",")
      .map((ip) => ip.trim())
      .filter(Boolean);

    try {
      await updateIps.mutateAsync({
        keyId: editIpsKeyId,
        allowedIps: parsedIps.length > 0 ? parsedIps : null,
      });
      toast({ title: "IP allowlist updated" });
    } catch {
      toast({ title: "Error", description: "Failed to update IP allowlist", variant: "destructive" });
    }
    setEditIpsKeyId(null);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading API keys...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Keys</h2>
          <p className="text-muted-foreground">
            Manage API keys for the public REST API (v1)
          </p>
        </div>

        <Dialog open={createOpen} onOpenChange={(open) => {
          if (!open) resetCreateDialog();
          else setCreateOpen(true);
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                The key will only be shown once. Store it securely.
              </DialogDescription>
            </DialogHeader>

            {generatedKey ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <Label className="text-sm font-medium text-green-800 dark:text-green-200">
                    Your API Key (copy now!)
                  </Label>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="flex-1 text-sm break-all bg-white dark:bg-gray-900 px-3 py-2 rounded border">
                      {generatedKey}
                    </code>
                    <Button size="icon" variant="outline" onClick={() => handleCopy(generatedKey)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={resetCreateDialog}>Done</Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="key-name">Name</Label>
                  <Input
                    id="key-name"
                    placeholder="e.g., Travel Agent Partner"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tier</Label>
                  <Select value={newKeyTier} onValueChange={(v) => setNewKeyTier(v as "free" | "partner" | "premium")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIER_OPTIONS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Scopes</Label>
                  <div className="space-y-1">
                    {SCOPE_OPTIONS.map((scope) => (
                      <label key={scope.value} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedScopes.includes(scope.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedScopes([...selectedScopes, scope.value]);
                            } else {
                              setSelectedScopes(selectedScopes.filter((s) => s !== scope.value));
                            }
                          }}
                        />
                        {scope.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allowed-ips">Allowed IPs (optional)</Label>
                  <Input
                    id="allowed-ips"
                    placeholder="e.g., 203.0.113.5, 198.51.100.0/24"
                    value={newKeyAllowedIps}
                    onChange={(e) => setNewKeyAllowedIps(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated. Leave empty to allow all IPs. Supports CIDR notation.
                  </p>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={resetCreateDialog}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={!newKeyName.trim() || createKey.isPending}>
                    {createKey.isPending ? "Creating..." : "Create Key"}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Keys Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Active Keys ({keys.filter((k) => k.is_active).length})
          </CardTitle>
          <CardDescription>
            Keys are hashed — only the prefix is visible after creation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No API keys yet. Create one to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Prefix</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Scopes</TableHead>
                  <TableHead>IP Allowlist</TableHead>
                  <TableHead>Usage (Today)</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {key.key_prefix}...
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={key.tier === "premium" ? "default" : key.tier === "partner" ? "secondary" : "outline"}>
                        {key.tier}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {key.scopes.map((s) => (
                          <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {key.allowed_ips && key.allowed_ips.length > 0 ? (
                        <div className="flex items-center gap-1">
                          <Shield className="h-3 w-3 text-green-600" />
                          <span className="text-xs">{key.allowed_ips.length} IP{key.allowed_ips.length > 1 ? "s" : ""}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Any</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {key.daily_usage} / {key.daily_limit}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {key.last_used_at
                        ? new Date(key.last_used_at).toLocaleDateString()
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      {key.is_active ? (
                        <Badge variant="default" className="bg-green-600">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Revoked</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setStatsKeyId(statsKeyId === key.id ? null : key.id)}
                          title="View stats"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                        {key.is_active && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditIpsKeyId(editIpsKeyId === key.id ? null : key.id);
                              setEditIpsValue(key.allowed_ips?.join(", ") || "");
                            }}
                            title="Edit IP allowlist"
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                        )}
                        {key.is_active && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => setRevokeTarget(key.id)}
                            title="Revoke key"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Stats Panel */}
      {statsKeyId && stats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Usage Stats (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Requests</TableHead>
                  <TableHead>Avg Response (ms)</TableHead>
                  <TableHead>Errors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map((s, i) => (
                  <TableRow key={i}>
                    <TableCell>{s.day}</TableCell>
                    <TableCell><code className="text-xs">{s.endpoint}</code></TableCell>
                    <TableCell>{s.request_count}</TableCell>
                    <TableCell>{s.avg_response_time_ms}ms</TableCell>
                    <TableCell className={s.error_count > 0 ? "text-destructive font-medium" : ""}>
                      {s.error_count}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* IP Allowlist Editor */}
      {editIpsKeyId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Edit IP Allowlist
            </CardTitle>
            <CardDescription>
              Restrict this API key to specific IP addresses. Leave empty to allow all IPs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="203.0.113.5, 198.51.100.0/24"
              value={editIpsValue}
              onChange={(e) => setEditIpsValue(e.target.value)}
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated IPv4 addresses or CIDR ranges. Clear all to allow any IP.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleSaveIps} disabled={updateIps.isPending}>
                {updateIps.isPending ? "Saving..." : "Save"}
              </Button>
              <Button variant="outline" onClick={() => setEditIpsKeyId(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revoke Confirmation */}
      <AlertDialog open={!!revokeTarget} onOpenChange={() => setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately invalidate the key. Any applications using it will lose access.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke} className="bg-destructive text-destructive-foreground">
              Revoke Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
