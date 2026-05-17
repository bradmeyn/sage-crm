import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getInsurance,
  createInsurance,
  updateInsurance,
  deleteInsurance,
} from '#/server/functions/insurance'

export const insuranceKeys = {
  all: ['insurance'] as const,
  lists: () => [...insuranceKeys.all, 'list'] as const,
  list: (clientId: string) => [...insuranceKeys.lists(), clientId] as const,
}

export function useInsurance(clientId: string) {
  return useQuery({
    queryKey: insuranceKeys.list(clientId),
    queryFn: () => getInsurance({ data: { clientId } }),
    enabled: !!clientId,
  })
}

export function useCreateInsurance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof createInsurance>[0]['data']) =>
      createInsurance({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: insuranceKeys.list(variables.clientId) })
    },
  })
}

export function useUpdateInsurance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof updateInsurance>[0]['data']) =>
      updateInsurance({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: insuranceKeys.list(variables.clientId) })
    },
  })
}

export function useDeleteInsurance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ insuranceId, clientId }: { insuranceId: string; clientId: string }) =>
      deleteInsurance({ data: { insuranceId, clientId } }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: insuranceKeys.list(variables.clientId) })
    },
  })
}
