import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { DataTable } from "@/components/data-table";
import AddClientDialog from "@/features/clients/components/add-client-dialog";
import { clientColumns } from "@/features/clients/components/client-columns";
import { getClients, getClient } from "@/server/functions/clients";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import type { Client } from "@/db/schema";
import { clientKeys } from "@/features/clients/hooks";

const VALID_SORT = ["firstName", "lastName", "email"] as const;
type SortCol = (typeof VALID_SORT)[number];
type SortDir = "asc" | "desc";

const searchSchema = z.object({
  sort: z.enum(VALID_SORT).catch("lastName"),
  order: z.enum(["asc", "desc"]).catch("asc"),
});

export const Route = createFileRoute("/(app)/_layout/clients/")({
  component: ClientListPage,
  validateSearch: searchSchema,
  errorComponent: () => <div>Error loading clients</div>,
  loaderDeps: ({ search: { sort, order } }) => ({ sort, order }),
  loader: async ({ context: { queryClient }, deps: { sort, order } }) => {
    await queryClient.ensureQueryData({
      queryKey: clientKeys.list(sort, order),
      queryFn: () => getClients({ data: { sort, order } }),
    });
  },
});

function ClientListPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { sort, order } = Route.useSearch();

  const { data: clients } = useSuspenseQuery({
    queryKey: clientKeys.list(sort, order),
    queryFn: () => getClients({ data: { sort, order } }),
    staleTime: 5 * 60 * 1000,
  });

  const handleSort = (col: string, dir: SortDir) => {
    navigate({ search: { sort: col as SortCol, order: dir } });
  };

  const handleRowClick = (client: Client) => {
    navigate({ to: "/clients/$clientId", params: { clientId: client.id } });
  };

  const handleRowMouseEnter = (client: Client) => {
    queryClient.prefetchQuery({
      queryKey: clientKeys.detail(client.id),
      queryFn: () => getClient({ data: { clientId: client.id } }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-primary">Clients</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {clients.length} {clients.length === 1 ? "client" : "clients"}
          </p>
        </div>
        <AddClientDialog />
      </div>

      <DataTable
        data={clients ?? []}
        columns={clientColumns}
        searchPlaceholder="Search by name, email or phone..."
        searchKeys={["firstName", "lastName", "email", "phone"]}
        pageSize={15}
        sortColumn={sort}
        sortDirection={order}
        onSort={handleSort}
        onRowClick={handleRowClick}
        onRowMouseEnter={handleRowMouseEnter}
        rowClassName="cursor-pointer hover:bg-muted/50 group"
        enablePagination={true}
        enableSearch={true}
      />
    </div>
  );
}
