import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { getInvitationDetails } from "@/server/functions/settings";
import { getSession } from "@/server/functions/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/loading-spinner";
import { z } from "zod";

export const Route = createFileRoute("/accept-invitation")({
  validateSearch: z.object({ id: z.string().optional() }),
  component: AcceptInvitationPage,
  loader: async ({ context: { queryClient } }) => {
    const session = await queryClient.fetchQuery({
      queryKey: ["session"],
      queryFn: () => getSession(),
    });
    return { session };
  },
});

function roleBadgeClass(role: string) {
  switch (role) {
    case "admin":
      return "bg-amber-100 text-amber-800 border-amber-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function AcceptInvitationPage() {
  const { id } = Route.useSearch();
  const loaderData = Route.useLoaderData();
  const navigate = useNavigate();
  const currentUser = loaderData?.session?.user ?? null;

  const {
    data: invitation,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["invitation", id],
    queryFn: () => getInvitationDetails({ data: { invitationId: id! } }),
    enabled: !!id,
    retry: false,
  });

  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Invalid invitation link</CardTitle>
            <CardDescription>No invitation ID was provided.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild variant="outline">
              <Link to="/login">Go to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Invitation not found</CardTitle>
            <CardDescription>
              This invitation is no longer valid or has already been used.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild variant="outline">
              <Link to="/login">Go to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired =
    invitation.status !== "pending" ||
    new Date(invitation.expiresAt) < new Date();

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Invitation expired</CardTitle>
            <CardDescription>
              This invitation has expired or is no longer valid.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild variant="outline">
              <Link to="/login">Go to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const orgName = invitation.organizationName ?? "your team";
  const inviterName = invitation.inviterName ?? "Someone";
  const role = invitation.role ?? "member";

  const handleAccept = async () => {
    await authClient.organization.acceptInvitation({ invitationId: id });
    navigate({ to: "/dashboard" });
  };

  const handleDecline = async () => {
    await authClient.organization.rejectInvitation({ invitationId: id });
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>You've been invited!</CardTitle>
          <CardDescription>
            <strong>{inviterName}</strong> has invited you to join{" "}
            <strong>{orgName}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
            <div>
              <p className="text-sm font-medium">{orgName}</p>
              <p className="text-xs text-muted-foreground">
                Invited by {inviterName}
              </p>
            </div>
            <Badge variant="outline" className={roleBadgeClass(role)}>
              {role}
            </Badge>
          </div>

          {!currentUser ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground text-center">
                Sign in or create an account to accept this invitation.
              </p>
              <Button asChild>
                <Link to="/login">Log in to accept</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/register">Create account</Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground text-center">
                Accepting as <strong>{currentUser.email}</strong>
              </p>
              <Button onClick={handleAccept}>Accept invitation</Button>
              <Button variant="outline" onClick={handleDecline}>
                Decline
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
