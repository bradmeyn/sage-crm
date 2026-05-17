import { Fragment, useState, useRef } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { getJob } from '#/server/functions/jobs'
import {
  jobKeys,
  useJob,
  useDeleteJob,
  useAddJobClient,
  useRemoveJobClient,
  useJobDocuments,
  useUploadJobDocument,
  useDeleteJobDocument,
} from '#/features/jobs/hooks'
import { useClients } from '#/features/clients/hooks'
import EditJobDialog from '#/features/jobs/components/edit-job-dialog'
import JobStageStepper from '#/features/jobs/components/job-stage-stepper'
import JobTaskList from '#/features/jobs/components/job-task-list'
import JobActivityFeed from '#/features/jobs/components/job-activity-feed'
import JobMemberStack from '#/features/jobs/components/job-member-stack'
import { Card } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Trash2, ChevronRight, X, Plus, Paperclip, Download } from 'lucide-react'
import { toast } from 'sonner'
import { JOB_STAGES, jobTypeLabel, jobStatusLabel, jobPriorityLabel } from '#/features/jobs/schemas'
import type { JobTypeValue } from '#/features/jobs/schemas'
import type { JobDocument } from '#/db/schema'

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  ON_HOLD: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
}

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-700',
  MEDIUM: 'bg-orange-100 text-orange-700',
  LOW: 'bg-gray-100 text-gray-600',
}

export const Route = createFileRoute('/(app)/_layout/jobs/$jobId')({
  component: JobDetailPage,
  loader: async ({ params: { jobId }, context: { queryClient } }) => {
    await queryClient.ensureQueryData({
      queryKey: jobKeys.detail(jobId),
      queryFn: () => getJob({ data: { jobId } }),
    })
    return { jobId }
  },
})

function JobDocumentSection({ jobId }: { jobId: string }) {
  const { data: docs = [] } = useJobDocuments(jobId)
  const uploadDoc = useUploadJobDocument(jobId)
  const deleteDoc = useDeleteJobDocument(jobId)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const fileData = reader.result as string
      uploadDoc.mutate(
        { jobId, fileName: file.name, fileData, mimeType: file.type, size: file.size },
        {
          onSuccess: () => toast.success('File uploaded'),
          onError: (err: Error) => toast.error(err.message),
        },
      )
    }
    reader.readAsDataURL(file)
    // Reset input so same file can be re-uploaded
    e.target.value = ''
  }

  const handleDelete = (doc: JobDocument) => {
    if (!confirm(`Delete "${doc.name}"?`)) return
    deleteDoc.mutate(
      { documentId: doc.id, jobId },
      {
        onSuccess: () => toast.success('File deleted'),
        onError: (err: Error) => toast.error(err.message),
      },
    )
  }

  return (
    <div className="space-y-2">
      {docs.length > 0 && (
        <div className="space-y-1">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-2 group">
              <Paperclip className="h-3 w-3 text-muted-foreground shrink-0" />
              <a
                href={doc.filePath}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline truncate flex-1"
                title={doc.name}
              >
                {doc.name}
              </a>
              <a href={doc.filePath} download={doc.name} className="text-muted-foreground hover:text-foreground">
                <Download className="h-3 w-3" />
              </a>
              <button
                type="button"
                onClick={() => handleDelete(doc)}
                disabled={deleteDoc.isPending}
                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploadDoc.isPending}
      >
        <Plus className="h-3 w-3 mr-1" />
        {uploadDoc.isPending ? 'Uploading…' : 'Attach file'}
      </Button>
    </div>
  )
}

function JobDetailPage() {
  const { jobId } = Route.useLoaderData()
  const { session } = Route.useRouteContext()
  const { data: job } = useJob(jobId)
  const deleteJob = useDeleteJob()
  const navigate = useNavigate()
  const addJobClient = useAddJobClient(jobId)
  const removeJobClient = useRemoveJobClient(jobId)
  const { data: allClients = [] } = useClients()

  const [selectedClientId, setSelectedClientId] = useState<string>('')

  const attachedIds = new Set(job.clients.map((jc) => jc.client.id))
  const availableClients = allClients.filter((c) => !attachedIds.has(c.id))

  const currentUserId = (session as { user?: { id?: string } })?.user?.id

  const handleDelete = () => {
    if (!confirm('Delete this job? This cannot be undone.')) return
    deleteJob.mutate(
      { jobId: job.id },
      {
        onSuccess: () => {
          toast.success('Job deleted')
          navigate({ to: '/jobs' })
        },
        onError: (err: Error) => toast.error(err.message),
      },
    )
  }

  const handleAddClient = () => {
    if (!selectedClientId) return
    addJobClient.mutate(
      { jobId: job.id, clientId: selectedClientId },
      {
        onSuccess: () => {
          toast.success('Client added to job')
          setSelectedClientId('')
        },
        onError: (err: Error) => toast.error(err.message),
      },
    )
  }

  const handleRemoveClient = (clientId: string) => {
    removeJobClient.mutate(
      { jobId: job.id, clientId },
      {
        onSuccess: () => toast.success('Client removed'),
        onError: (err: Error) => toast.error(err.message),
      },
    )
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/jobs" className="hover:text-foreground transition-colors">Jobs</Link>
        <ChevronRight className="h-4 w-4" />
        {job.clients.map((jc, i) => (
          <Fragment key={jc.client.id}>
            {i > 0 && <span className="text-muted-foreground">&amp;</span>}
            <Link
              to="/clients/$clientId"
              params={{ clientId: jc.client.id }}
              className="hover:text-foreground transition-colors"
            >
              {jc.client.firstName} {jc.client.lastName}
            </Link>
          </Fragment>
        ))}
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">{job.title}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-bold">{job.title}</h1>
          <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
            {jobTypeLabel(job.jobType)}
          </span>
          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${STATUS_STYLES[job.status] ?? 'bg-gray-100 text-gray-600'}`}>
            {jobStatusLabel(job.status)}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <EditJobDialog job={job} />
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
            disabled={deleteJob.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stage stepper */}
      <Card className="p-4">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Pipeline Stage</h2>
        <JobStageStepper
          jobId={job.id}
          stages={job.template?.stages ?? JOB_STAGES[job.jobType as JobTypeValue] ?? []}
          currentStage={job.currentStage}
        />
      </Card>

      {/* Two-column body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task list (2/3) */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Checklist</h2>
          <JobTaskList jobId={job.id} tasks={job.tasks} />
        </Card>

        {/* Metadata (1/3) */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold mb-2">Details</h2>

          <MetaRow label="Client">
            <div className="space-y-1">
              {job.clients.map((jc) => (
                <div key={jc.client.id} className="flex items-center gap-1">
                  <Link
                    to="/clients/$clientId"
                    params={{ clientId: jc.client.id }}
                    className="text-primary hover:underline font-medium text-sm"
                  >
                    {jc.client.firstName} {jc.client.lastName}
                  </Link>
                  {job.clients.length > 1 && (
                    <button
                      onClick={() => handleRemoveClient(jc.client.id)}
                      disabled={removeJobClient.isPending}
                      className="text-muted-foreground hover:text-destructive ml-1"
                      title="Remove client"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {availableClients.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger className="h-7 text-xs flex-1">
                    <SelectValue placeholder="Add client…" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableClients.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.firstName} {c.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  onClick={handleAddClient}
                  disabled={!selectedClientId || addJobClient.isPending}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            )}
          </MetaRow>

          <MetaRow label="Members">
            <JobMemberStack members={job.members ?? []} jobId={job.id} size="md" />
          </MetaRow>

          <MetaRow label="Priority">
            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${PRIORITY_STYLES[job.priority] ?? 'bg-gray-100 text-gray-600'}`}>
              {jobPriorityLabel(job.priority)}
            </span>
          </MetaRow>

          <MetaRow label="Due Date">
            {job.dueDate
              ? new Date(job.dueDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
              : <span className="text-muted-foreground text-sm">—</span>
            }
          </MetaRow>

          {job.description && (
            <MetaRow label="Description">
              <p className="text-sm text-muted-foreground">{job.description}</p>
            </MetaRow>
          )}

          <MetaRow label="Created">
            <span className="text-sm text-muted-foreground">
              {new Date(job.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </MetaRow>

          <MetaRow label="Files">
            <JobDocumentSection jobId={job.id} />
          </MetaRow>
        </Card>
      </div>

      {/* Activity / Comments */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Activity</h2>
        <JobActivityFeed jobId={job.id} currentUserId={currentUserId} />
      </Card>
    </div>
  )
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <div>{children}</div>
    </div>
  )
}
