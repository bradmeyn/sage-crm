import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { getClientJobs } from '#/server/functions/jobs'
import { jobKeys, useClientJobs, useDeleteJob } from '#/features/jobs/hooks'
import { buildClientJobColumns } from '#/features/jobs/components/job-columns'
import { DataTable } from '#/components/data-table'
import CreateJobDialog from '#/features/jobs/components/create-job-dialog'
import { Card } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Briefcase, Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { Job, JobTask, Client, JobClient } from '#/db/schema'

type JobWithTasks = Job & { tasks: JobTask[]; clients: (JobClient & { client: Client })[] }

export const Route = createFileRoute('/(app)/_layout/clients/$clientId/jobs/')({
  component: ClientJobsPage,
  loader: async ({ params: { clientId }, context: { queryClient } }) => {
    await queryClient.ensureQueryData({
      queryKey: jobKeys.byClient(clientId),
      queryFn: () => getClientJobs({ data: { clientId } }),
    })
    return { clientId }
  },
})

function ClientJobsPage() {
  const { clientId } = Route.useLoaderData()
  const { data: jobs = [] } = useClientJobs(clientId)
  const deleteJob = useDeleteJob()
  const navigate = useNavigate()

  const handleDelete = (job: JobWithTasks) => {
    if (!confirm('Delete this job? This cannot be undone.')) return
    deleteJob.mutate(
      { jobId: job.id },
      {
        onSuccess: () => toast.success('Job deleted'),
        onError: (err: Error) => toast.error(err.message),
      },
    )
  }

  const columns = buildClientJobColumns(handleDelete)

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Jobs</h2>
          <p className="text-muted-foreground">Client workflows and pipeline</p>
        </div>
        <CreateJobDialog clientId={clientId} />
      </div>

      {jobs.length > 0 ? (
        <DataTable
          columns={columns}
          data={jobs as JobWithTasks[]}
          onRowClick={(job) => navigate({ to: '/jobs/$jobId', params: { jobId: job.id } })}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No jobs yet</h3>
          <p className="text-muted-foreground mb-4">Create the first job for this client</p>
          <CreateJobDialog
            clientId={clientId}
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Job
              </Button>
            }
          />
        </div>
      )}
    </Card>
  )
}
