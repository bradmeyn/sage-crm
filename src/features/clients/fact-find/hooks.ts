import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getFactFind,
  createDependant,
  updateDependant,
  deleteDependant,
  saveEstate,
  createBeneficiary,
  updateBeneficiary,
  deleteBeneficiary,
  updateHealth,
  updatePersonal,
  saveRiskProfile,
} from "@/server/functions/fact-find";

import {
  getFactFindRequests,
  createFactFindRequest,
  revokeFactFindRequest,
} from "@/server/functions/fact-find-requests";
import {
  getFactFindSubmission,
  importFactFindSection,
  completeFactFindReview,
} from "@/server/functions/fact-find-review";

export const factFindKeys = {
  all: ["fact-find"] as const,
  details: () => [...factFindKeys.all, "detail"] as const,
  detail: (clientId: string) => [...factFindKeys.details(), clientId] as const,
  requests: (clientId: string) =>
    [...factFindKeys.all, "requests", clientId] as const,
};

export function useFactFindRequests(clientId: string) {
  return useQuery({
    queryKey: factFindKeys.requests(clientId),
    queryFn: () => getFactFindRequests({ data: { clientId } }),
    enabled: !!clientId,
  });
}

export function useCreateFactFindRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof createFactFindRequest>[0]["data"]) =>
      createFactFindRequest({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: factFindKeys.requests(variables.clientId),
      });
    },
  });
}

export function useRevokeFactFindRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof revokeFactFindRequest>[0]["data"]) =>
      revokeFactFindRequest({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: factFindKeys.requests(variables.clientId),
      });
    },
  });
}

export function useFactFindSubmission(requestId: string, clientId: string) {
  return useQuery({
    queryKey: [...factFindKeys.all, "submission", requestId],
    queryFn: () => getFactFindSubmission({ data: { requestId, clientId } }),
    enabled: !!requestId && !!clientId,
  });
}

export function useImportFactFindSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof importFactFindSection>[0]["data"]) =>
      importFactFindSection({ data }),
    onSuccess: (_, variables) => {
      // Live data + completeness changed, and the diff must recompute.
      queryClient.invalidateQueries({
        queryKey: factFindKeys.detail(variables.clientId),
      });
      queryClient.invalidateQueries({
        queryKey: [...factFindKeys.all, "submission", variables.requestId],
      });
    },
  });
}

export function useCompleteFactFindReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof completeFactFindReview>[0]["data"]) =>
      completeFactFindReview({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: factFindKeys.requests(variables.clientId),
      });
    },
  });
}

export function useFactFind(clientId: string) {
  return useQuery({
    queryKey: factFindKeys.detail(clientId),
    queryFn: () => getFactFind({ data: { clientId } }),
    enabled: !!clientId,
  });
}

/** Every fact-find mutation invalidates the aggregated detail query. */
function useFactFindMutation<TFn extends (args: { data: any }) => Promise<any>>(
  fn: TFn,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<TFn>[0]["data"]) => fn({ data }),
    onSuccess: (_: unknown, variables: { clientId: string }) => {
      queryClient.invalidateQueries({
        queryKey: factFindKeys.detail(variables.clientId),
      });
    },
  });
}

export const useCreateDependant = () => useFactFindMutation(createDependant);
export const useUpdateDependant = () => useFactFindMutation(updateDependant);
export const useDeleteDependant = () => useFactFindMutation(deleteDependant);
export const useSaveEstate = () => useFactFindMutation(saveEstate);
export const useCreateBeneficiary = () =>
  useFactFindMutation(createBeneficiary);
export const useUpdateBeneficiary = () =>
  useFactFindMutation(updateBeneficiary);
export const useDeleteBeneficiary = () =>
  useFactFindMutation(deleteBeneficiary);
export const useUpdateHealth = () => useFactFindMutation(updateHealth);
export const useUpdatePersonal = () => useFactFindMutation(updatePersonal);
export const useSaveRiskProfile = () => useFactFindMutation(saveRiskProfile);
