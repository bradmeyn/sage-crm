import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { getSoas } from "@/server/functions/soa";
import { soaKeys, useSoas, useCreateSoa, useDeleteSoa } from "@/features/soa/hooks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/(app)/_layout/clients/$clientId/soa/")({
  component: AdvicePage,
  loader: async ({ params: { clientId }, context: { queryClient } }) => {
    await queryClient.ensureQueryData({
      queryKey: soaKeys.list(clientId),
      queryFn: () => getSoas({ data: { clientId } }),
    });
    return { clientId };
  },
});

function AdvicePage() {
  const { clientId } = Route.useLoaderData();
  const navigate = useNavigate();
  const { data: soas = [] } = useSoas(clientId);
  const create = useCreateSoa();
  const del = useDeleteSoa(clientId);

  const newSoa = () =>
    create.mutate(
      { clientId },
      {
        onSuccess: (r) => navigate({ to: "/soa/$soaId", params: { soaId: r.id } }),
        onError: (e: Error) => toast.error(e.message),
      },
    );

  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="heading-secondary">Statements of Advice</h2>
          <p className="text-sm text-muted-foreground">
            Build and manage advice documents for this client
          </p>
        </div>
        <Button onClick={newSoa} disabled={create.isPending}>
          <Plus className="size-4" />
          New SOA
        </Button>
      </div>

      {soas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <FileText className="mb-3 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No advice documents yet</p>
        </div>
      ) : (
        <div className="divide-y rounded-lg border">
          {soas.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-4 py-3">
              <Link
                to="/soa/$soaId"
                params={{ soaId: s.id }}
                className="flex items-center gap-3 hover:underline"
              >
                <FileText className="size-4 text-muted-foreground" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{s.title}</span>
                    <Badge
                      variant={s.status === "ISSUED" ? "default" : "secondary"}
                    >
                      {s.status === "ISSUED" ? "Issued" : "Draft"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(s.updatedAt).toLocaleDateString("en-AU")}
                  </div>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                onClick={() =>
                  del.mutate(s.id, {
                    onSuccess: () => toast.success("SOA deleted"),
                    onError: (e: Error) => toast.error(e.message),
                  })
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
