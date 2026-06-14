import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getIncome,
  createIncome,
  updateIncome,
  deleteIncome,
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "@/server/functions/cashflow";

export const cashflowKeys = {
  all: ["cashflow"] as const,
  income: () => [...cashflowKeys.all, "income"] as const,
  incomeList: (clientId: string) =>
    [...cashflowKeys.income(), clientId] as const,
  expenses: () => [...cashflowKeys.all, "expenses"] as const,
  expenseList: (clientId: string) =>
    [...cashflowKeys.expenses(), clientId] as const,
};

// ─── Income ──────────────────────────────────────────────────────────────────

export function useIncome(clientId: string) {
  return useQuery({
    queryKey: cashflowKeys.incomeList(clientId),
    queryFn: () => getIncome({ data: { clientId } }),
    enabled: !!clientId,
  });
}

export function useCreateIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof createIncome>[0]["data"]) =>
      createIncome({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: cashflowKeys.incomeList(variables.clientId),
      });
    },
  });
}

export function useUpdateIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof updateIncome>[0]["data"]) =>
      updateIncome({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: cashflowKeys.incomeList(variables.clientId),
      });
    },
  });
}

export function useDeleteIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      incomeId,
      clientId,
    }: {
      incomeId: string;
      clientId: string;
    }) => deleteIncome({ data: { incomeId, clientId } }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: cashflowKeys.incomeList(variables.clientId),
      });
    },
  });
}

// ─── Expenses ────────────────────────────────────────────────────────────────

export function useExpenses(clientId: string) {
  return useQuery({
    queryKey: cashflowKeys.expenseList(clientId),
    queryFn: () => getExpenses({ data: { clientId } }),
    enabled: !!clientId,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof createExpense>[0]["data"]) =>
      createExpense({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: cashflowKeys.expenseList(variables.clientId),
      });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof updateExpense>[0]["data"]) =>
      updateExpense({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: cashflowKeys.expenseList(variables.clientId),
      });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      expenseId,
      clientId,
    }: {
      expenseId: string;
      clientId: string;
    }) => deleteExpense({ data: { expenseId, clientId } }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: cashflowKeys.expenseList(variables.clientId),
      });
    },
  });
}
