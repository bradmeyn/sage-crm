import { createFileRoute } from "@tanstack/react-router";
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getOrgDetails,
  inviteMember,
  cancelInvitation,
  removeMember,
  updateMemberRole,
} from "@/server/functions/settings";
import { getTemplates } from "@/server/functions/job-templates";
import { templateKeys } from "@/features/jobs/templates/hooks";
import TemplateManager from "@/features/jobs/templates/components/template-manager";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { MoreHorizontal, UserPlus } from "lucide-react";
import { useState } from "react";

const orgKeys = {
  all: ["org-details"] as const,
  detail: () => [...orgKeys.all] as const,
};

export const Route = createFileRoute("/(app)/_layout/settings")({
  component: SettingsPage,
  loader: async ({ context: { queryClient } }) => {
    await Promise.all([
      queryClient.ensureQueryData({
        queryKey: orgKeys.detail(),
        queryFn: () => getOrgDetails(),
      }),
      queryClient.ensureQueryData({
        queryKey: templateKeys.list(),
        queryFn: () => getTemplates(),
      }),
    ]);
  },
});

function roleBadgeVariant(role: string) {
  switch (role) {
    case "owner":
      return "default";
    case "admin":
      return "secondary";
    default:
      return "outline";
  }
}

function roleBadgeClass(role: string) {
  switch (role) {
    case "owner":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "admin":
      return "bg-amber-100 text-amber-800 border-amber-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-AU", { dateStyle: "medium" }).format(
    new Date(date),
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function SettingsPage() {
  const { session } = Route.useRouteContext();
  const currentUserId = session.user.id;
  const queryClient = useQueryClient();

  const { data: org } = useSuspenseQuery({
    queryKey: orgKeys.detail(),
    queryFn: () => getOrgDetails(),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => removeMember({ data: { memberId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.all });
      toast.success("Member removed");
    },
    onError: () => toast.error("Failed to remove member"),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({
      memberId,
      role,
    }: {
      memberId: string;
      role: "admin" | "member";
    }) => updateMemberRole({ data: { memberId, role } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.all });
      toast.success("Role updated");
    },
    onError: () => toast.error("Failed to update role"),
  });

  const cancelInviteMutation = useMutation({
    mutationFn: (invitationId: string) =>
      cancelInvitation({ data: { invitationId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.all });
      toast.success("Invitation cancelled");
    },
    onError: () => toast.error("Failed to cancel invitation"),
  });

  const pendingInvitations = (org?.invitations ?? []).filter(
    (inv) => inv.status === "pending",
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="heading-primary">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your team and invitations
        </p>
      </div>

      <Tabs defaultValue="team">
        <TabsList className="mb-6">
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="invitations">
            Invitations
            {pendingInvitations.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary text-primary-foreground text-xs px-1.5 py-0.5">
                {pendingInvitations.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="team">
          <div className="rounded-xl border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(org?.members ?? []).map((member) => {
                  const isSelf = member.userId === currentUserId;
                  const isOwner = member.role === "owner";
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                            {getInitials(member.user.name)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {member.user.name}
                              {isSelf && (
                                <span className="ml-1.5 text-xs text-muted-foreground">
                                  (you)
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {member.user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={roleBadgeVariant(member.role)}
                          className={roleBadgeClass(member.role)}>
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(member.createdAt)}
                      </TableCell>
                      <TableCell>
                        {!isOwner && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8">
                                <MoreHorizontal size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  updateRoleMutation.mutate({
                                    memberId: member.id,
                                    role:
                                      member.role === "admin"
                                        ? "member"
                                        : "admin",
                                  })
                                }>
                                Change to{" "}
                                {member.role === "admin" ? "member" : "admin"}
                              </DropdownMenuItem>
                              {!isSelf && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() =>
                                      removeMemberMutation.mutate(member.id)
                                    }>
                                    Remove member
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="invitations">
          <div className="flex justify-end mb-4">
            <InviteMemberDialog
              onSuccess={() =>
                queryClient.invalidateQueries({ queryKey: orgKeys.all })
              }
            />
          </div>

          {pendingInvitations.length === 0 ? (
            <div className="rounded-xl border bg-background p-10 text-center text-muted-foreground">
              No pending invitations
            </div>
          ) : (
            <div className="rounded-xl border bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvitations.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={roleBadgeVariant(inv.role)}
                          className={roleBadgeClass(inv.role)}>
                          {inv.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(inv.expiresAt)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          pending
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => cancelInviteMutation.mutate(inv.id)}
                          disabled={cancelInviteMutation.isPending}>
                          Cancel
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates">
          <TemplateManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InviteMemberDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");

  const inviteMutation = useMutation({
    mutationFn: () => inviteMember({ data: { email, role } }),
    onSuccess: () => {
      toast.success("Invitation sent");
      setEmail("");
      setRole("member");
      setOpen(false);
      onSuccess();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to send invitation");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus size={16} className="mr-2" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a team member</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="invite-email">Email address</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="invite-role">Role</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as "admin" | "member")}>
              <SelectTrigger id="invite-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => inviteMutation.mutate()}
            disabled={!email || inviteMutation.isPending}>
            {inviteMutation.isPending ? "Sending..." : "Send invitation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
