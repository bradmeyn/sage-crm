import { useMutation, useQuery, useSuspenseQuery, useQueryClient } from '@tanstack/react-query'
import {
  getJobs,
  getClientJobs,
  getJob,
  createJob,
  updateJob,
  updateJobStage,
  deleteJob,
  toggleJobTask,
  addJobTask,
  deleteJobTask,
  addJobClient,
  removeJobClient,
  getJobTimeline,
  addJobComment,
  deleteJobComment,
  getJobDocuments,
  uploadJobDocument,
  deleteJobDocument,
} from '#/server/functions/jobs'
import type { JobTask } from '#/db/schema'

// ─── Cache Keys ───────────────────────────────────────────────────────────────

export const jobKeys = {
  all: ['jobs'] as const,
  list: () => ['jobs', 'list'] as const,
  byClient: (clientId: string) => ['jobs', 'list', 'client', clientId] as const,
  detail: (jobId: string) => ['jobs', 'detail', jobId] as const,
  timeline: (jobId: string) => ['jobs', 'timeline', jobId] as const,
  documents: (jobId: string) => ['jobs', 'documents', jobId] as const,
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useJobs() {
  return useSuspenseQuery({
    queryKey: jobKeys.list(),
    queryFn: () => getJobs(),
  })
}

export function useClientJobs(clientId: string) {
  return useQuery({
    queryKey: jobKeys.byClient(clientId),
    queryFn: () => getClientJobs({ data: { clientId } }),
    enabled: !!clientId,
  })
}

export function useJob(jobId: string) {
  return useSuspenseQuery({
    queryKey: jobKeys.detail(jobId),
    queryFn: () => getJob({ data: { jobId } }),
  })
}

export function useJobTimeline(jobId: string) {
  return useQuery({
    queryKey: jobKeys.timeline(jobId),
    queryFn: () => getJobTimeline({ data: { jobId } }),
    enabled: !!jobId,
  })
}

export function useJobDocuments(jobId: string) {
  return useQuery({
    queryKey: jobKeys.documents(jobId),
    queryFn: () => getJobDocuments({ data: { jobId } }),
    enabled: !!jobId,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof createJob>[0]['data']) => createJob({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.list() })
      queryClient.invalidateQueries({ queryKey: jobKeys.byClient(variables.clientId) })
    },
  })
}

export function useUpdateJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof updateJob>[0]['data']) => updateJob({ data }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.list() })
      queryClient.invalidateQueries({ queryKey: jobKeys.all })
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(updated.id) })
      queryClient.invalidateQueries({ queryKey: jobKeys.timeline(updated.id) })
    },
  })
}

export function useUpdateJobStage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof updateJobStage>[0]['data']) => updateJobStage({ data }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.list() })
      queryClient.invalidateQueries({ queryKey: jobKeys.all })
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(updated.id) })
      queryClient.invalidateQueries({ queryKey: jobKeys.timeline(updated.id) })
    },
  })
}

export function useDeleteJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ jobId }: { jobId: string }) => deleteJob({ data: { jobId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.all })
    },
  })
}

export function useToggleJobTask(jobId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof toggleJobTask>[0]['data']) => toggleJobTask({ data }),
    onMutate: async ({ taskId, isCompleted }) => {
      await queryClient.cancelQueries({ queryKey: jobKeys.detail(jobId) })
      const prev = queryClient.getQueryData(jobKeys.detail(jobId))
      queryClient.setQueryData(jobKeys.detail(jobId), (old: unknown) => {
        if (!old || typeof old !== 'object') return old
        const j = old as { tasks: JobTask[] }
        return {
          ...j,
          tasks: j.tasks.map((t) =>
            t.id === taskId ? { ...t, isCompleted } : t,
          ),
        }
      })
      return { prev }
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(jobKeys.detail(jobId), context.prev)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) })
    },
  })
}

export function useAddJobTask(jobId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof addJobTask>[0]['data']) => addJobTask({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) })
    },
  })
}

export function useDeleteJobTask(jobId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof deleteJobTask>[0]['data']) => deleteJobTask({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) })
    },
  })
}

export function useAddJobClient(jobId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof addJobClient>[0]['data']) => addJobClient({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) })
      queryClient.invalidateQueries({ queryKey: jobKeys.list() })
      queryClient.invalidateQueries({ queryKey: jobKeys.all })
      queryClient.invalidateQueries({ queryKey: jobKeys.timeline(jobId) })
    },
  })
}

export function useRemoveJobClient(jobId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof removeJobClient>[0]['data']) => removeJobClient({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) })
      queryClient.invalidateQueries({ queryKey: jobKeys.list() })
      queryClient.invalidateQueries({ queryKey: jobKeys.all })
      queryClient.invalidateQueries({ queryKey: jobKeys.timeline(jobId) })
    },
  })
}

export function useAddJobComment(jobId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof addJobComment>[0]['data']) => addJobComment({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.timeline(jobId) })
    },
  })
}

export function useDeleteJobComment(jobId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof deleteJobComment>[0]['data']) => deleteJobComment({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.timeline(jobId) })
    },
  })
}

export function useUploadJobDocument(jobId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof uploadJobDocument>[0]['data']) =>
      uploadJobDocument({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.documents(jobId) })
      queryClient.invalidateQueries({ queryKey: jobKeys.timeline(jobId) })
    },
  })
}

export function useDeleteJobDocument(jobId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof deleteJobDocument>[0]['data']) =>
      deleteJobDocument({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.documents(jobId) })
    },
  })
}
