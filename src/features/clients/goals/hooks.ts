import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getGoals, createGoal, updateGoal, deleteGoal } from '#/server/functions/goals'

export const goalKeys = {
  all: ['goals'] as const,
  lists: () => [...goalKeys.all, 'list'] as const,
  list: (clientId: string) => [...goalKeys.lists(), clientId] as const,
}

export function useGoals(clientId: string) {
  return useQuery({
    queryKey: goalKeys.list(clientId),
    queryFn: () => getGoals({ data: { clientId } }),
    enabled: !!clientId,
  })
}

export function useCreateGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof createGoal>[0]['data']) => createGoal({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: goalKeys.list(variables.clientId) })
    },
  })
}

export function useUpdateGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof updateGoal>[0]['data']) => updateGoal({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: goalKeys.list(variables.clientId) })
    },
  })
}

export function useDeleteGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ goalId, clientId }: { goalId: string; clientId: string }) =>
      deleteGoal({ data: { goalId, clientId } }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: goalKeys.list(variables.clientId) })
    },
  })
}
