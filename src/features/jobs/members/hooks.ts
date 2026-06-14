import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { jobKeys } from "@/features/jobs/hooks";
import {
  getJobMembers,
  getAvailableMembers,
  addJobMember,
  removeJobMember,
} from "@/server/functions/job-members";

export const jobMemberKeys = {
  byJob: (jobId: string) => ["jobs", "members", jobId] as const,
  available: (jobId: string) =>
    ["jobs", "members", "available", jobId] as const,
};

export function useJobMembers(jobId: string) {
  return useSuspenseQuery({
    queryKey: jobMemberKeys.byJob(jobId),
    queryFn: () => getJobMembers({ data: { jobId } }),
  });
}

export function useAvailableMembers(jobId: string) {
  return useSuspenseQuery({
    queryKey: jobMemberKeys.available(jobId),
    queryFn: () => getAvailableMembers({ data: { jobId } }),
  });
}

export function useAddJobMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { jobId: string; userId: string }) =>
      addJobMember({ data: vars }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: jobMemberKeys.byJob(vars.jobId),
      });
      queryClient.invalidateQueries({
        queryKey: jobMemberKeys.available(vars.jobId),
      });
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(vars.jobId) });
      queryClient.invalidateQueries({ queryKey: jobKeys.list() });
    },
  });
}

export function useRemoveJobMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { jobId: string; userId: string }) =>
      removeJobMember({ data: vars }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: jobMemberKeys.byJob(vars.jobId),
      });
      queryClient.invalidateQueries({
        queryKey: jobMemberKeys.available(vars.jobId),
      });
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(vars.jobId) });
      queryClient.invalidateQueries({ queryKey: jobKeys.list() });
    },
  });
}
