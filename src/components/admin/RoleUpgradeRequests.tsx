import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  usePendingRoleUpgradeRequests,
  useApproveRoleUpgrade,
  useRejectRoleUpgrade,
} from "@/hooks/useRoleUpgrade";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_LABELS } from "@/types/database";

export function RoleUpgradeRequests() {
  const { user } = useAuth();
  const { data: pendingRequests, isLoading } = usePendingRoleUpgradeRequests();
  const approveUpgrade = useApproveRoleUpgrade();
  const rejectUpgrade = useRejectRoleUpgrade();

  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    requestId: string | null;
  }>({ open: false, requestId: null });
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = async (request: typeof pendingRequests extends (infer T)[] | undefined ? T : never) => {
    await approveUpgrade.mutateAsync({
      id: request.id,
      user_id: request.user_id,
      user_email: request.user?.email,
      user_name: request.user?.full_name || undefined,
      requested_role: request.requested_role,
    });
  };

  const handleReject = async () => {
    if (!rejectDialog.requestId) return;

    await rejectUpgrade.mutateAsync({
      requestId: rejectDialog.requestId,
      reason: rejectionReason || undefined,
    });

    setRejectDialog({ open: false, requestId: null });
    setRejectionReason("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!pendingRequests || pendingRequests.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Pending Role Upgrade Requests
        </CardTitle>
        <CardDescription>
          Review user requests for additional roles ({pendingRequests.length} pending)
        </CardDescription>
      </CardHeader>

      <div className="space-y-3">
        {pendingRequests.map((request) => (
          <Card key={request.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {request.user?.full_name?.[0]?.toUpperCase() ||
                      request.user?.email[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium">
                    {request.user?.full_name || "No name provided"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {request.user?.email}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      Requesting: {ROLE_LABELS[request.requested_role] || request.requested_role}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(request.created_at).toLocaleDateString()}
                    </Badge>
                  </div>
                  {request.reason && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      "{request.reason}"
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleApprove(request)}
                  disabled={approveUpgrade.isPending || rejectUpgrade.isPending}
                >
                  {approveUpgrade.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    setRejectDialog({ open: true, requestId: request.id })
                  }
                  disabled={approveUpgrade.isPending || rejectUpgrade.isPending}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setRejectDialog({ open: false, requestId: null });
            setRejectionReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Role Upgrade</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this role upgrade request?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="role-rejection-reason">Reason (optional)</Label>
            <Textarea
              id="role-rejection-reason"
              placeholder="e.g., Insufficient information, please contact support..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialog({ open: false, requestId: null });
                setRejectionReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectUpgrade.isPending}
            >
              {rejectUpgrade.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
