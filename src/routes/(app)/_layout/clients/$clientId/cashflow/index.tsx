import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { getIncome, getExpenses } from "@/server/functions/cashflow";
import {
  cashflowKeys,
  useIncome,
  useExpenses,
  useDeleteIncome,
  useDeleteExpense,
} from "@/features/clients/cashflow/hooks";
import { buildIncomeColumns } from "@/features/clients/cashflow/components/income-columns";
import { buildExpenseColumns } from "@/features/clients/cashflow/components/expense-columns";
import IncomeDialog from "@/features/clients/cashflow/components/income-dialog";
import ExpenseDialog from "@/features/clients/cashflow/components/expense-dialog";
import { DataTable } from "@/components/data-table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  LayoutList,
  Plus,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { toAnnual } from "@/features/clients/cashflow/schemas";
import type { ClientIncome, ClientExpense } from "@/db/schema";

export const Route = createFileRoute(
  "/(app)/_layout/clients/$clientId/cashflow/",
)({
  component: CashflowPage,
  loader: async ({ params: { clientId }, context: { queryClient } }) => {
    await Promise.all([
      queryClient.ensureQueryData({
        queryKey: cashflowKeys.incomeList(clientId),
        queryFn: () => getIncome({ data: { clientId } }),
      }),
      queryClient.ensureQueryData({
        queryKey: cashflowKeys.expenseList(clientId),
        queryFn: () => getExpenses({ data: { clientId } }),
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

function CashflowPage() {
  const { clientId } = Route.useLoaderData();
  const { data: income = [] } = useIncome(clientId);
  const { data: expenses = [] } = useExpenses(clientId);
  const deleteIncome = useDeleteIncome();
  const deleteExpense = useDeleteExpense();

  const totalIncome = useMemo(
    () => income.reduce((sum, i) => sum + toAnnual(i.amount, i.frequency), 0),
    [income],
  );
  const totalExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + toAnnual(e.amount, e.frequency), 0),
    [expenses],
  );
  const surplus = totalIncome - totalExpenses;

  const incomeColumns = useMemo(
    () =>
      buildIncomeColumns(clientId, (item: ClientIncome) => {
        deleteIncome.mutate(
          { incomeId: item.id, clientId },
          {
            onSuccess: () => toast.success("Income deleted"),
            onError: (err: Error) => toast.error(err.message),
          },
        );
      }),
    [clientId, deleteIncome],
  );

  const expenseColumns = useMemo(
    () =>
      buildExpenseColumns(clientId, (item: ClientExpense) => {
        deleteExpense.mutate(
          { expenseId: item.id, clientId },
          {
            onSuccess: () => toast.success("Expense deleted"),
            onError: (err: Error) => toast.error(err.message),
          },
        );
      }),
    [clientId, deleteExpense],
  );

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          label="Annual Income"
          value={totalIncome}
          icon={ArrowUpCircle}
          valueClassName="text-emerald-600"
        />
        <SummaryCard
          label="Annual Expenses"
          value={totalExpenses}
          icon={ArrowDownCircle}
          valueClassName="text-rose-600"
        />
        <SummaryCard
          label="Annual Surplus / Deficit"
          value={surplus}
          icon={TrendingUp}
          valueClassName={surplus >= 0 ? "text-emerald-600" : "text-rose-600"}
        />
      </div>

      {/* Income */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Income</h2>
            <p className="text-muted-foreground">All income sources</p>
          </div>
          <IncomeDialog clientId={clientId} />
        </div>

        {income.length > 0 ? (
          <DataTable
            data={income}
            columns={incomeColumns}
            searchPlaceholder="Search income..."
            searchKeys={["name", "category"]}
            pageSize={15}
            enableSearch={income.length > 8}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <LayoutList className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No income recorded</h3>
            <p className="text-muted-foreground mb-4">
              Add the first income source for this client
            </p>
            <IncomeDialog
              clientId={clientId}
              trigger={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Income
                </Button>
              }
            />
          </div>
        )}
      </Card>

      {/* Expenses */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Expenses</h2>
            <p className="text-muted-foreground">All recurring expenses</p>
          </div>
          <ExpenseDialog clientId={clientId} />
        </div>

        {expenses.length > 0 ? (
          <DataTable
            data={expenses}
            columns={expenseColumns}
            searchPlaceholder="Search expenses..."
            searchKeys={["name", "category"]}
            pageSize={15}
            enableSearch={expenses.length > 8}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <LayoutList className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No expenses recorded</h3>
            <p className="text-muted-foreground mb-4">
              Add the first expense for this client
            </p>
            <ExpenseDialog
              clientId={clientId}
              trigger={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Expense
                </Button>
              }
            />
          </div>
        )}
      </Card>
    </div>
  );
}
