import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getStrategyTemplates,
  getSoas,
  getSoa,
  createSoa,
  updateSoa,
  deleteSoa,
  addRecommendation,
  updateRecommendation,
  deleteRecommendation,
  reorderRecommendations,
} from "@/server/functions/soa";

export const soaKeys = {
  all: ["soa"] as const,
  templates: () => [...soaKeys.all, "templates"] as const,
  lists: () => [...soaKeys.all, "list"] as const,
  list: (clientId: string) => [...soaKeys.lists(), clientId] as const,
  detail: (soaId: string) => [...soaKeys.all, "detail", soaId] as const,
};

export function useStrategyTemplates() {
  return useQuery({
    queryKey: soaKeys.templates(),
    queryFn: () => getStrategyTemplates(),
  });
}

export function useSoas(clientId: string) {
  return useQuery({
    queryKey: soaKeys.list(clientId),
    queryFn: () => getSoas({ data: { clientId } }),
    enabled: !!clientId,
  });
}

export function useSoa(soaId: string) {
  return useQuery({
    queryKey: soaKeys.detail(soaId),
    queryFn: () => getSoa({ data: { soaId } }),
    enabled: !!soaId,
  });
}

export function useCreateSoa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof createSoa>[0]["data"]) =>
      createSoa({ data }),
    onSuccess: (_, v) =>
      qc.invalidateQueries({ queryKey: soaKeys.list(v.clientId) }),
  });
}

export function useDeleteSoa(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (soaId: string) => deleteSoa({ data: { soaId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: soaKeys.list(clientId) }),
  });
}

// SOA-detail mutations all refresh the open SOA.
function useSoaDetailMutation<TFn extends (a: { data: any }) => Promise<any>>(
  fn: TFn,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<TFn>[0]["data"]) => fn({ data }),
    onSuccess: (_: unknown, v: { soaId: string }) =>
      qc.invalidateQueries({ queryKey: soaKeys.detail(v.soaId) }),
  });
}

export const useUpdateSoa = () => useSoaDetailMutation(updateSoa);
export const useAddRecommendation = () =>
  useSoaDetailMutation(addRecommendation);
export const useUpdateRecommendation = () =>
  useSoaDetailMutation(updateRecommendation);
export const useDeleteRecommendation = () =>
  useSoaDetailMutation(deleteRecommendation);
export const useReorderRecommendations = () =>
  useSoaDetailMutation(reorderRecommendations);
