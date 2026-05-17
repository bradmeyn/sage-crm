import { createFileRoute } from '@tanstack/react-router'
import { getJobs } from '#/server/functions/jobs'
import { getTemplates } from '#/server/functions/job-templates'
import { jobKeys, useJobs } from '#/features/jobs/hooks'
import { templateKeys } from '#/features/jobs/templates/hooks'
import CreateJobDialog from '#/features/jobs/components/create-job-dialog'
import JobBoard from '#/features/jobs/components/job-board'
import { Briefcase } from 'lucide-react'
import type { Job, JobTask, Client, JobClient } from '#/db/schema'

type JobWithTasksAndClients = Job & { tasks: JobTask[]; clients: (JobClient & { client: Client })[] }

export const Route = createFileRoute('/(app)/_layout/jobs/')({
  component: JobsPage,
  validateSearch: (s: Record<string, unknown>) => ({
    type: typeof s.type === 'string' ? s.type : undefined,
  }),
  loader: async ({ context: { queryClient } }) => {
    await Promise.all([
      queryClient.ensureQueryData({
        queryKey: jobKeys.list(),
        queryFn: () => getJobs(),
      }),
      queryClient.ensureQueryData({
        queryKey: templateKeys.list(),
        queryFn: () => getTemplates(),
      }),
    ])
  },
})

function JobsPage() {
  const { data: jobs = [] } = useJobs()

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold">Jobs</h1>
        <CreateJobDialog />
      </div>

      {jobs.length > 0 ? (
        <JobBoard jobs={jobs as JobWithTasksAndClients[]} />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No jobs yet</h3>
          <p className="text-muted-foreground mb-4">Create the first job for a client</p>
          <CreateJobDialog />
        </div>
      )}
    </div>
  )
}
