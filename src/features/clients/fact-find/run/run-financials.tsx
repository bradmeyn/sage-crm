import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useAssets,
  useLiabilities,
  useDeleteAsset,
  useDeleteLiability,
} from "@/features/clients/balance-sheet/hooks";
import {
  useIncome,
  useExpenses,
  useDeleteIncome,
  useDeleteExpense,
} from "@/features/clients/cashflow/hooks";
import { useGoals, useDeleteGoal } from "@/features/clients/goals/hooks";
import {
  useInsurance,
  useDeleteInsurance,
} from "@/features/clients/insurance/hooks";
import AssetDialog from "@/features/clients/balance-sheet/components/asset-dialog";
import LiabilityDialog from "@/features/clients/balance-sheet/components/liability-dialog";
import IncomeDialog from "@/features/clients/cashflow/components/income-dialog";
import ExpenseDialog from "@/features/clients/cashflow/components/expense-dialog";
import GoalDialog from "@/features/clients/goals/components/goal-dialog";
import InsuranceDialog from "@/features/clients/insurance/components/insurance-dialog";

const aud = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});

const editTrigger = (
  <Button variant="ghost" size="icon">
    <Pencil className="size-4" />
  </Button>
);

function RunFinancialSection<T extends { id: string }>({
  items,
  getLabel,
  getValue,
  addDialog,
  renderEdit,
  onDelete,
  emptyHint,
}: {
  items: T[];
  getLabel: (i: T) => string;
  getValue?: (i: T) => number;
  addDialog: React.ReactNode;
  renderEdit: (i: T) => React.ReactNode;
  onDelete: (i: T) => void;
  emptyHint: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">{addDialog}</div>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
          {emptyHint}
        </p>
      ) : (
        <div className="divide-y rounded-lg border">
          {items.map((it) => (
            <div key={it.id} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm">{getLabel(it)}</span>
              <div className="flex items-center gap-2">
                {getValue && (
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {aud.format(getValue(it) || 0)}
                  </span>
                )}
                {renderEdit(it)}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(it)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const ok = (msg: string) => ({
  onSuccess: () => toast.success(msg),
  onError: (e: Error) => toast.error(e.message),
});

export function RunAssets({ clientId }: { clientId: string }) {
  const { data = [] } = useAssets(clientId);
  const del = useDeleteAsset();
  return (
    <RunFinancialSection
      items={data}
      getLabel={(a) => a.name}
      getValue={(a) => a.value}
      addDialog={<AssetDialog clientId={clientId} />}
      renderEdit={(a) => <AssetDialog clientId={clientId} asset={a} trigger={editTrigger} />}
      onDelete={(a) => del.mutate({ assetId: a.id, clientId }, ok("Asset removed"))}
      emptyHint="No assets yet"
    />
  );
}

export function RunLiabilities({ clientId }: { clientId: string }) {
  const { data = [] } = useLiabilities(clientId);
  const del = useDeleteLiability();
  return (
    <RunFinancialSection
      items={data}
      getLabel={(l) => l.name}
      getValue={(l) => l.balance}
      addDialog={<LiabilityDialog clientId={clientId} />}
      renderEdit={(l) => <LiabilityDialog clientId={clientId} liability={l} trigger={editTrigger} />}
      onDelete={(l) => del.mutate({ liabilityId: l.id, clientId }, ok("Liability removed"))}
      emptyHint="No liabilities yet"
    />
  );
}

export function RunIncome({ clientId }: { clientId: string }) {
  const { data = [] } = useIncome(clientId);
  const del = useDeleteIncome();
  return (
    <RunFinancialSection
      items={data}
      getLabel={(i) => i.name}
      getValue={(i) => i.amount}
      addDialog={<IncomeDialog clientId={clientId} />}
      renderEdit={(i) => <IncomeDialog clientId={clientId} income={i} trigger={editTrigger} />}
      onDelete={(i) => del.mutate({ incomeId: i.id, clientId }, ok("Income removed"))}
      emptyHint="No income yet"
    />
  );
}

export function RunExpenses({ clientId }: { clientId: string }) {
  const { data = [] } = useExpenses(clientId);
  const del = useDeleteExpense();
  return (
    <RunFinancialSection
      items={data}
      getLabel={(e) => e.name}
      getValue={(e) => e.amount}
      addDialog={<ExpenseDialog clientId={clientId} />}
      renderEdit={(e) => <ExpenseDialog clientId={clientId} expense={e} trigger={editTrigger} />}
      onDelete={(e) => del.mutate({ expenseId: e.id, clientId }, ok("Expense removed"))}
      emptyHint="No expenses yet"
    />
  );
}

export function RunGoals({ clientId }: { clientId: string }) {
  const { data = [] } = useGoals(clientId);
  const del = useDeleteGoal();
  return (
    <RunFinancialSection
      items={data}
      getLabel={(g) => g.name}
      getValue={(g) => g.targetAmount ?? 0}
      addDialog={<GoalDialog clientId={clientId} />}
      renderEdit={(g) => <GoalDialog clientId={clientId} goal={g} trigger={editTrigger} />}
      onDelete={(g) => del.mutate({ goalId: g.id, clientId }, ok("Goal removed"))}
      emptyHint="No goals yet"
    />
  );
}

export function RunInsurance({ clientId }: { clientId: string }) {
  const { data = [] } = useInsurance(clientId);
  const del = useDeleteInsurance();
  return (
    <RunFinancialSection
      items={data}
      getLabel={(p) => p.insurer}
      getValue={(p) => p.coverAmount ?? 0}
      addDialog={<InsuranceDialog clientId={clientId} />}
      renderEdit={(p) => <InsuranceDialog clientId={clientId} policy={p} trigger={editTrigger} />}
      onDelete={(p) => del.mutate({ insuranceId: p.id, clientId }, ok("Policy removed"))}
      emptyHint="No insurance yet"
    />
  );
}
