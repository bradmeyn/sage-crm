import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAssets,
  createAsset,
  updateAsset,
  deleteAsset,
  getLiabilities,
  createLiability,
  updateLiability,
  deleteLiability,
} from "@/server/functions/balance-sheet";

export const balanceSheetKeys = {
  all: ["balance-sheet"] as const,
  assets: () => [...balanceSheetKeys.all, "assets"] as const,
  assetList: (clientId: string) =>
    [...balanceSheetKeys.assets(), clientId] as const,
  liabilities: () => [...balanceSheetKeys.all, "liabilities"] as const,
  liabilityList: (clientId: string) =>
    [...balanceSheetKeys.liabilities(), clientId] as const,
};

// ─── Assets ──────────────────────────────────────────────────────────────────

export function useAssets(clientId: string) {
  return useQuery({
    queryKey: balanceSheetKeys.assetList(clientId),
    queryFn: () => getAssets({ data: { clientId } }),
    enabled: !!clientId,
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof createAsset>[0]["data"]) =>
      createAsset({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: balanceSheetKeys.assetList(variables.clientId),
      });
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof updateAsset>[0]["data"]) =>
      updateAsset({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: balanceSheetKeys.assetList(variables.clientId),
      });
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      assetId,
      clientId,
    }: {
      assetId: string;
      clientId: string;
    }) => deleteAsset({ data: { assetId, clientId } }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: balanceSheetKeys.assetList(variables.clientId),
      });
    },
  });
}

// ─── Liabilities ─────────────────────────────────────────────────────────────

export function useLiabilities(clientId: string) {
  return useQuery({
    queryKey: balanceSheetKeys.liabilityList(clientId),
    queryFn: () => getLiabilities({ data: { clientId } }),
    enabled: !!clientId,
  });
}

export function useCreateLiability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof createLiability>[0]["data"]) =>
      createLiability({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: balanceSheetKeys.liabilityList(variables.clientId),
      });
    },
  });
}

export function useUpdateLiability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof updateLiability>[0]["data"]) =>
      updateLiability({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: balanceSheetKeys.liabilityList(variables.clientId),
      });
    },
  });
}

export function useDeleteLiability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      liabilityId,
      clientId,
    }: {
      liabilityId: string;
      clientId: string;
    }) => deleteLiability({ data: { liabilityId, clientId } }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: balanceSheetKeys.liabilityList(variables.clientId),
      });
    },
  });
}
