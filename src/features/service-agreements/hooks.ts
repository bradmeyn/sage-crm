import { useQuery, useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getServiceAgreement,
  createServiceAgreement,
  updateServiceAgreement,
  recordConsent,
  deleteServiceAgreement,
  getUpcomingRenewals,
} from '#/server/functions/service-agreements'

export const agreementKeys = {
  all: ['service-agreements'] as const,
  byClient: (clientId: string) => ['service-agreements', 'client', clientId] as const,
  upcoming: () => ['service-agreements', 'upcoming'] as const,
}

export function useServiceAgreement(clientId: string) {
  return useQuery({
    queryKey: agreementKeys.byClient(clientId),
    queryFn: () => getServiceAgreement({ data: { clientId } }),
    enabled: !!clientId,
  })
}

export function useUpcomingRenewals() {
  return useSuspenseQuery({
    queryKey: agreementKeys.upcoming(),
    queryFn: () => getUpcomingRenewals(),
  })
}

export function useCreateServiceAgreement(clientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof createServiceAgreement>[0]['data']) =>
      createServiceAgreement({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agreementKeys.byClient(clientId) })
      queryClient.invalidateQueries({ queryKey: agreementKeys.upcoming() })
    },
  })
}

export function useUpdateServiceAgreement(clientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof updateServiceAgreement>[0]['data']) =>
      updateServiceAgreement({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agreementKeys.byClient(clientId) })
      queryClient.invalidateQueries({ queryKey: agreementKeys.upcoming() })
    },
  })
}

export function useRecordConsent(clientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => recordConsent({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agreementKeys.byClient(clientId) })
      queryClient.invalidateQueries({ queryKey: agreementKeys.upcoming() })
    },
  })
}

export function useDeleteServiceAgreement(clientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteServiceAgreement({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agreementKeys.byClient(clientId) })
      queryClient.invalidateQueries({ queryKey: agreementKeys.upcoming() })
    },
  })
}
