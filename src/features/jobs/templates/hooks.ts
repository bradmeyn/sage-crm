import { useMutation, useSuspenseQuery, useQueryClient } from '@tanstack/react-query'
import {
  getTemplates,
  createTemplate,
  cloneTemplate,
  updateTemplate,
  deleteTemplate,
} from '#/server/functions/job-templates'

// ─── Cache Keys ───────────────────────────────────────────────────────────────

export const templateKeys = {
  all: ['templates'] as const,
  list: () => ['templates', 'list'] as const,
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useTemplates() {
  return useSuspenseQuery({
    queryKey: templateKeys.list(),
    queryFn: () => getTemplates(),
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof createTemplate>[0]['data']) =>
      createTemplate({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.list() })
    },
  })
}

export function useCloneTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof cloneTemplate>[0]['data']) =>
      cloneTemplate({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.list() })
    },
  })
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof updateTemplate>[0]['data']) =>
      updateTemplate({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.list() })
    },
  })
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof deleteTemplate>[0]['data']) =>
      deleteTemplate({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.list() })
    },
  })
}
