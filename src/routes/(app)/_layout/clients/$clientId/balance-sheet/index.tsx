import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { getAssets, getLiabilities } from "@/server/functions/balance-sheet";
import {
  balanceSheetKeys,
  useAssets,
  useLiabilities,
  useDeleteAsset,
  useDeleteLiability,
} from "@/features/clients/balance-sheet/hooks";
import { buildAssetColumns } from "@/features/clients/balance-sheet/components/asset-columns";
import { buildLiabilityColumns } from "@/features/clients/balance-sheet/components/liability-columns";
import AssetDialog from "@/features/clients/balance-sheet/components/asset-dialog";
import LiabilityDialog from "@/features/clients/balance-sheet/components/liability-dialog";
import { DataTable } from "@/components/data-table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LayoutList,
  Plus,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import type { ClientAsset, ClientLiability } from "@/db/schema";

export const Route = createFileRoute(
  "/(app)/_layout/clients/$clientId/balance-sheet/",
)({
  component: BalanceSheetPage,
  loader: async ({ params: { clientId }, context: { queryClient } }) => {
    await Promise.all([
      queryClient.ensureQueryData({
        queryKey: balanceSheetKeys.assetList(clientId),
        queryFn: () => getAssets({ data: { clientId } }),
      }),
      queryClient.ensureQueryData({
        queryKey: balanceSheetKeys.liabilityList(clientId),
        queryFn: () => getLiabilities({ data: { clientId } }),
      }),
    ]);
    return { clientId };
  },
});

const fmt = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});

function SummaryCard({
  label,
  value,
  icon: Icon,
  valueClassName,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
      <div className="p-2 rounded-full bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`text-xl font-semibold ${valueClassName ?? ""}`}>
          {fmt.format(value)}
        </p>
      </div>
    </div>
  );
}

function BalanceSheetPage() {
  const { clientId } = Route.useLoaderData();
  const { data: assets = [] } = useAssets(clientId);
  const { data: liabilities = [] } = useLiabilities(clientId);
  const deleteAsset = useDeleteAsset();
  const deleteLiability = useDeleteLiability();

  const totalAssets = useMemo(
    () => assets.reduce((sum, a) => sum + a.value, 0),
    [assets],
  );
  const totalLiabilities = useMemo(
    () => liabilities.reduce((sum, l) => sum + l.balance, 0),
    [liabilities],
  );
  const netWorth = totalAssets - totalLiabilities;

  const assetColumns = useMemo(
    () =>
      buildAssetColumns(clientId, (asset: ClientAsset) => {
        deleteAsset.mutate(
          { assetId: asset.id, clientId },
          {
            onSuccess: () => toast.success("Asset deleted"),
            onError: (err: Error) => toast.error(err.message),
          },
        );
      }),
    [clientId, deleteAsset],
  );

  const liabilityColumns = useMemo(
    () =>
      buildLiabilityColumns(clientId, (liability: ClientLiability) => {
        deleteLiability.mutate(
          { liabilityId: liability.id, clientId },
          {
            onSuccess: () => toast.success("Liability deleted"),
            onError: (err: Error) => toast.error(err.message),
          },
        );
      }),
    [clientId, deleteLiability],
  );

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          label="Total Assets"
          value={totalAssets}
          icon={TrendingUp}
          valueClassName="text-emerald-600"
        />
        <SummaryCard
          label="Total Liabilities"
          value={totalLiabilities}
          icon={TrendingDown}
          valueClassName="text-rose-600"
        />
        <SummaryCard
          label="Net Worth"
          value={netWorth}
          icon={Wallet}
          valueClassName={netWorth >= 0 ? "text-emerald-600" : "text-rose-600"}
        />
      </div>

      {/* Assets */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Assets</h2>
            <p className="text-muted-foreground">What the client owns</p>
          </div>
          <AssetDialog clientId={clientId} />
        </div>

        {assets.length > 0 ? (
          <DataTable
            data={assets}
            columns={assetColumns}
            searchPlaceholder="Search assets..."
            searchKeys={["name", "category"]}
            pageSize={15}
            enableSearch={assets.length > 8}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <LayoutList className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No assets recorded</h3>
            <p className="text-muted-foreground mb-4">
              Add the first asset for this client
            </p>
            <AssetDialog
              clientId={clientId}
              trigger={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Asset
                </Button>
              }
            />
          </div>
        )}
      </Card>

      {/* Liabilities */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Liabilities</h2>
            <p className="text-muted-foreground">What the client owes</p>
          </div>
          <LiabilityDialog clientId={clientId} />
        </div>

        {liabilities.length > 0 ? (
          <DataTable
            data={liabilities}
            columns={liabilityColumns}
            searchPlaceholder="Search liabilities..."
            searchKeys={["name", "category"]}
            pageSize={15}
            enableSearch={liabilities.length > 8}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <LayoutList className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No liabilities recorded</h3>
            <p className="text-muted-foreground mb-4">
              Add the first liability for this client
            </p>
            <LiabilityDialog
              clientId={clientId}
              trigger={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Liability
                </Button>
              }
            />
          </div>
        )}
      </Card>
    </div>
  );
}
