import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Users, Search, Shield, Plus, X, MessageSquare, StickyNote } from "lucide-react";
import { format } from "date-fns";
import type { Profile, AppRole } from "@/types/database";
import { ROLE_LABELS, ROLE_COLORS } from "@/types/database";

interface AdminNote {
  id: string;
  text: string;
  author_id: string;
  author_name: string;
  created_at: string;
}

interface UserWithRoles extends Profile {
  roles: AppRole[];
  admin_notes?: AdminNote[];
}

const AdminUsers = ({ initialSearch = "" }: { initialSearch?: string }) => {
  const { user: currentUser, hasRole } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [roleFilter, setRoleFilter] = useState<string>("all");

  useEffect(() => {
    if (initialSearch) setSearchQuery(initialSearch);
  }, [initialSearch]);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [newRole, setNewRole] = useState<AppRole | "">("");
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [notesUser, setNotesUser] = useState<UserWithRoles | null>(null);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [roleRemoveTarget, setRoleRemoveTarget] = useState<{ userId: string; role: AppRole; email: string } | null>(null);

  const isRavOwner = hasRole("rav_owner");
  const isRavTeam = hasRole("rav_owner") || hasRole("rav_admin") || hasRole("rav_staff");

  const fetchUsers = async () => {
    try {
      // Fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles: UserWithRoles[] = (profilesData || []).map((profile: Profile) => ({
        ...profile,
        roles: (rolesData || [])
          .filter((r: { user_id: string; role: AppRole }) => r.user_id === profile.id)
          .map((r: { user_id: string; role: AppRole }) => r.role),
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddRole = async () => {
    if (!selectedUser || !newRole) return;

    setIsAddingRole(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("user_roles")
        .insert({
          user_id: selectedUser.id,
          role: newRole,
        });

      if (error) throw error;

      toast({
        title: "Role Added",
        description: `${ROLE_LABELS[newRole]} role added to ${selectedUser.full_name || selectedUser.email}.`,
      });

      setNewRole("");
      setSelectedUser(null);
      fetchUsers();
    } catch (error: unknown) {
      console.error("Error adding role:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to add role.";
      toast({
        title: "Error",
        description: errorMessage.includes("duplicate") ? "User already has this role." : errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAddingRole(false);
    }
  };

  const handleRemoveRole = (userId: string, role: AppRole, email: string) => {
    // Self-protection: prevent removing your own admin/owner role
    if (userId === currentUser?.id && (role === "rav_admin" || role === "rav_owner")) {
      toast({
        title: "Not Allowed",
        description: "Cannot remove your own admin role",
        variant: "destructive",
      });
      return;
    }
    setRoleRemoveTarget({ userId, role, email });
  };

  const confirmRemoveRole = async () => {
    if (!roleRemoveTarget) return;
    const { userId, role } = roleRemoveTarget;
    setRoleRemoveTarget(null);

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);

      if (error) throw error;

      toast({
        title: "Role Removed",
        description: `${ROLE_LABELS[role]} role removed.`,
      });

      fetchUsers();
    } catch (error) {
      console.error("Error removing role:", error);
      toast({
        title: "Error",
        description: "Failed to remove role.",
        variant: "destructive",
      });
    }
  };

  const handleAddNote = async () => {
    if (!notesUser || !newNoteText.trim() || !currentUser) return;

    setIsSavingNote(true);
    try {
      const existingNotes: AdminNote[] = Array.isArray(notesUser.admin_notes) ? notesUser.admin_notes : [];
      const newNote: AdminNote = {
        id: crypto.randomUUID(),
        text: newNoteText.trim(),
        author_id: currentUser.id,
        author_name: currentUser.user_metadata?.full_name || currentUser.email || "Unknown",
        created_at: new Date().toISOString(),
      };
      const updatedNotes = [newNote, ...existingNotes];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("profiles")
        .update({ admin_notes: updatedNotes })
        .eq("id", notesUser.id);

      if (error) throw error;

      toast({
        title: "Note Added",
        description: `Note saved for ${notesUser.full_name || notesUser.email}.`,
      });

      setNewNoteText("");
      // Update local state
      setNotesUser({ ...notesUser, admin_notes: updatedNotes });
      // Refresh the users list to reflect note count
      fetchUsers();
    } catch (error) {
      console.error("Error adding note:", error);
      toast({
        title: "Error",
        description: "Failed to save note.",
        variant: "destructive",
      });
    } finally {
      setIsSavingNote(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      u.full_name?.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q);

    const matchesRole = roleFilter === "all" || u.roles.includes(roleFilter as AppRole);

    return matchesSearch && matchesRole;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">
            {users.length} registered users
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="rav_owner">RAV Owner</SelectItem>
              <SelectItem value="rav_admin">RAV Admin</SelectItem>
              <SelectItem value="rav_staff">RAV Staff</SelectItem>
              <SelectItem value="property_owner">Property Owner</SelectItem>
              <SelectItem value="renter">Renter</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {!isRavOwner && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50/50 dark:border-yellow-900 dark:bg-yellow-950/20">
          <CardContent className="py-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Role management requires RAV Owner permissions. You can view users but cannot modify roles.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No users found</h3>
              <p className="text-muted-foreground text-center">
                {searchQuery || roleFilter !== "all" ? "Try different filters" : "No users have registered yet"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>T&amp;C Accepted</TableHead>
                  <TableHead>Onboarding</TableHead>
                  {isRavTeam && <TableHead>Notes</TableHead>}
                  {isRavTeam && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.full_name || "No name"}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <Badge key={role} className={`${ROLE_COLORS[role]} flex items-center gap-1`}>
                            {ROLE_LABELS[role]}
                            {isRavOwner && user.id !== currentUser?.id && role !== "renter" && (
                              <button
                                onClick={() => handleRemoveRole(user.id, role, user.email)}
                                className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </Badge>
                        ))}
                        {user.roles.length === 0 && (
                          <span className="text-sm text-muted-foreground">No roles</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(user.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {user.current_terms_version ? (
                        <span className="text-muted-foreground">
                          v{user.current_terms_version}
                        </span>
                      ) : (
                        <span className="text-yellow-600 text-xs">⚠️ Not recorded</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.onboarding_completed_at ? (
                        format(new Date(user.onboarding_completed_at), "MMM d, yyyy")
                      ) : (
                        <span className="text-yellow-600 text-xs">Pending</span>
                      )}
                    </TableCell>
                    {isRavTeam && (
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1"
                          onClick={() => {
                            setNotesUser(user);
                            setNewNoteText("");
                            setIsNotesDialogOpen(true);
                          }}
                        >
                          <StickyNote className="h-4 w-4" />
                          {Array.isArray(user.admin_notes) && user.admin_notes.length > 0 && (
                            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                              {user.admin_notes.length}
                            </Badge>
                          )}
                        </Button>
                      </TableCell>
                    )}
                    {isRavTeam && (
                      <TableCell className="text-right">
                        {isRavOwner && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedUser(user)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Role
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add Role</DialogTitle>
                                <DialogDescription>
                                  Add a new role to {selectedUser?.full_name || selectedUser?.email}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="py-4">
                                <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(["rav_owner", "rav_admin", "rav_staff", "property_owner", "renter"] as AppRole[])
                                      .filter((r) => !selectedUser?.roles.includes(r))
                                      .map((role) => (
                                        <SelectItem key={role} value={role}>
                                          {ROLE_LABELS[role]}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <DialogFooter>
                                <Button
                                  onClick={handleAddRole}
                                  disabled={!newRole || isAddingRole}
                                >
                                  {isAddingRole ? "Adding..." : "Add Role"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Notes Dialog */}
      <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Notes for {notesUser?.full_name || notesUser?.email}
            </DialogTitle>
            <DialogDescription>
              Internal notes visible only to RAV team members
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <Textarea
                placeholder="Add a note..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                rows={2}
                className="flex-1"
              />
              <Button
                onClick={handleAddNote}
                disabled={!newNoteText.trim() || isSavingNote}
                className="self-end"
              >
                {isSavingNote ? "Saving..." : "Add"}
              </Button>
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-3">
              {(!notesUser?.admin_notes || notesUser.admin_notes.length === 0) ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No notes yet
                </p>
              ) : (
                notesUser.admin_notes.map((note) => (
                  <div key={note.id} className="border rounded-lg p-3 text-sm">
                    <p className="whitespace-pre-wrap">{note.text}</p>
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span>{note.author_name}</span>
                      <span>{format(new Date(note.created_at), "MMM d, yyyy h:mm a")}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Role Removal Confirmation Dialog */}
      <AlertDialog open={!!roleRemoveTarget} onOpenChange={(open) => { if (!open) setRoleRemoveTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Role?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove {roleRemoveTarget ? ROLE_LABELS[roleRemoveTarget.role] : ""} role from {roleRemoveTarget?.email}? This takes effect immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveRole}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsers;
