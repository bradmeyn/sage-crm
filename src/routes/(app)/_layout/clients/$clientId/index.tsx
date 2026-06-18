import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getClient } from "@/server/functions/clients";
import type { ClientWithPartner } from "@/server/functions/clients";
import { clientKeys } from "@/features/clients/hooks";
import PartnerSection from "@/features/clients/components/partner-section";
import ClientPracticeCard from "@/features/clients/components/client-practice-card";

export const Route = createFileRoute("/(app)/_layout/clients/$clientId/")({
  component: ClientDetailPage,
  errorComponent: () => <div>Error loading client</div>,
  loader: async ({ context, params: { clientId } }) => {
    return context.queryClient.ensureQueryData({
      queryKey: clientKeys.detail(clientId),
      queryFn: () => getClient({ data: { clientId } }),
    });
  },
});

function ClientDetailPage() {
  const client = Route.useLoaderData() as ClientWithPartner;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 max-w-xl">
          <h3 className="text-lg font-semibold mb-3">Personal details</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            <div>
              <dt className="text-sm text-muted-foreground">Title</dt>
              <dd className="mt-1 text-sm">{client.title ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">First name</dt>
              <dd className="mt-1 text-sm">{client.firstName ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Last name</dt>
              <dd className="mt-1 text-sm">{client.lastName ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Preferred name</dt>
              <dd className="mt-1 text-sm">{client.preferredName ?? "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="mb-6 max-w-xl">
          <h3 className="text-lg font-semibold mb-3">Contact info</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            <div>
              <dt className="text-sm text-muted-foreground">Email</dt>
              <dd className="mt-1 text-sm">{client.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Phone</dt>
              <dd className="mt-1 text-sm">{client.phone ?? "—"}</dd>
            </div>
          </dl>
        </div>

        <ClientPracticeCard client={client} />

        <PartnerSection client={client} />
      </CardContent>
    </Card>
  );
}
