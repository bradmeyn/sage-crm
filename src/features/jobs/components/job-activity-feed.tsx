import { useState } from 'react'
import {
  Plus,
  ArrowRight,
  RefreshCw,
  UserPlus,
  UserMinus,
  Paperclip,
  MessageSquare,
  Trash2,
} from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Textarea } from '#/components/ui/textarea'
import { toast } from 'sonner'
import { useJobTimeline, useAddJobComment, useDeleteJobComment } from '#/features/jobs/hooks'
import type { User } from '#/db/schema'

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  JOB_CREATED: <Plus className="h-3.5 w-3.5" />,
  STAGE_CHANGED: <ArrowRight className="h-3.5 w-3.5" />,
  STATUS_CHANGED: <RefreshCw className="h-3.5 w-3.5" />,
  CLIENT_ADDED: <UserPlus className="h-3.5 w-3.5" />,
  CLIENT_REMOVED: <UserMinus className="h-3.5 w-3.5" />,
  FILE_UPLOADED: <Paperclip className="h-3.5 w-3.5" />,
}

type TimelineEntry = {
  id: string
  body: string
  createdAt: Date | string
  createdBy: User
  entryType: 'comment' | 'activity'
  type?: string
}

function formatTimeAgo(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

function getUserDisplayName(user: User): string {
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`
  return user.name ?? user.email
}

type Props = {
  jobId: string
  currentUserId?: string
}

export default function JobActivityFeed({ jobId, currentUserId }: Props) {
  const [commentText, setCommentText] = useState('')
  const { data: timeline = [], isLoading } = useJobTimeline(jobId)
  const addComment = useAddJobComment(jobId)
  const deleteComment = useDeleteJobComment(jobId)

  const handlePost = () => {
    const body = commentText.trim()
    if (!body) return
    addComment.mutate(
      { jobId, body },
      {
        onSuccess: () => setCommentText(''),
        onError: (err: Error) => toast.error(err.message),
      },
    )
  }

  const handleDelete = (commentId: string) => {
    deleteComment.mutate(
      { commentId, jobId },
      { onError: (err: Error) => toast.error(err.message) },
    )
  }

  return (
    <div className="space-y-4">
      {/* Comment input */}
      <div className="space-y-2">
        <Textarea
          placeholder="Add a comment…"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          rows={3}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost()
          }}
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handlePost}
            disabled={!commentText.trim() || addComment.isPending}
          >
            Post
          </Button>
        </div>
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading activity…</div>
      ) : timeline.length === 0 ? (
        <div className="text-sm text-muted-foreground">No activity yet.</div>
      ) : (
        <div className="space-y-3">
          {(timeline as TimelineEntry[]).map((entry) => (
            <div key={entry.id} className="flex items-start gap-3">
              {/* Icon */}
              <div
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  entry.entryType === 'comment'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {entry.entryType === 'comment' ? (
                  <MessageSquare className="h-3.5 w-3.5" />
                ) : (
                  ACTIVITY_ICONS[entry.type ?? ''] ?? <RefreshCw className="h-3.5 w-3.5" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">
                    {getUserDisplayName(entry.createdBy)}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatTimeAgo(entry.createdAt)}
                  </span>
                </div>
                <p className={`text-sm mt-0.5 ${entry.entryType === 'activity' ? 'text-muted-foreground' : ''}`}>
                  {entry.body}
                </p>
              </div>

              {/* Delete button (own comments only) */}
              {entry.entryType === 'comment' && currentUserId && entry.createdBy.id === currentUserId && (
                <button
                  type="button"
                  onClick={() => handleDelete(entry.id)}
                  disabled={deleteComment.isPending}
                  className="mt-0.5 text-muted-foreground hover:text-destructive transition-colors"
                  title="Delete comment"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
