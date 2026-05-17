import { useState, useRef, useEffect } from 'react'
import { useAvailableMembers, useAddJobMember, useRemoveJobMember } from '#/features/jobs/members/hooks'
import type { JobMember, User } from '#/db/schema'

type MemberWithUser = JobMember & { user: User }

// Deterministic colour per user based on id hash
const AVATAR_COLORS = [
  'bg-emerald-600',
  'bg-blue-600',
  'bg-violet-600',
  'bg-orange-500',
  'bg-rose-600',
  'bg-cyan-600',
]

function hashColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function initials(user: User): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
  }
  return user.name.slice(0, 2).toUpperCase()
}

// ─── Add-member popover (only rendered in md size) ────────────────────────────

function AddMemberPopover({ jobId, onClose }: { jobId: string; onClose: () => void }) {
  const { data: available = [] } = useAvailableMembers(jobId)
  const addMember = useAddJobMember()
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  const filtered = available.filter((m) =>
    m.user.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div
      ref={ref}
      className="absolute left-0 top-10 z-50 w-56 rounded-lg border bg-popover shadow-lg"
    >
      <div className="p-2 border-b">
        <input
          autoFocus
          className="w-full text-sm px-2 py-1 rounded border bg-background outline-none focus:ring-1 focus:ring-primary"
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="max-h-48 overflow-y-auto py-1">
        {filtered.length === 0 ? (
          <p className="px-3 py-2 text-xs text-muted-foreground">No members to add</p>
        ) : (
          filtered.map((m) => (
            <button
              key={m.userId}
              type="button"
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
              onClick={() => {
                addMember.mutate({ jobId, userId: m.userId })
                onClose()
              }}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${hashColor(m.userId)}`}
              >
                {initials(m.user)}
              </div>
              <span className="truncate">{m.user.name}</span>
              <span className="ml-auto text-xs text-muted-foreground capitalize">{m.role}</span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface JobMemberStackProps {
  members: MemberWithUser[]
  jobId: string
  size?: 'sm' | 'md'
}

export default function JobMemberStack({ members, jobId, size = 'md' }: JobMemberStackProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const removeMember = useRemoveJobMember()

  const dim = size === 'sm' ? 22 : 28
  const textSize = size === 'sm' ? 'text-[9px]' : 'text-[10px]'
  const maxShow = size === 'sm' ? 3 : 5
  const shown = members.slice(0, maxShow)
  const overflow = members.length - maxShow

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {shown.map((m) => (
          <div
            key={m.userId}
            className="relative group"
            style={{ marginLeft: shown.indexOf(m) === 0 ? 0 : -6 }}
            onMouseEnter={() => setHoveredId(m.userId)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div
              className={`rounded-full flex items-center justify-center font-bold text-white border-2 border-background cursor-default ${hashColor(m.userId)} ${textSize}`}
              style={{ width: dim, height: dim }}
            >
              {initials(m.user)}
            </div>

            {/* Tooltip (both sizes) */}
            {hoveredId === m.userId && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 whitespace-nowrap">
                <div className="bg-popover border rounded px-2 py-1 text-xs shadow-md flex items-center gap-1.5">
                  <span>{m.user.firstName && m.user.lastName
                    ? `${m.user.firstName} ${m.user.lastName}`
                    : m.user.name}</span>
                  {size === 'md' && (
                    <button
                      type="button"
                      className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                      onClick={() => removeMember.mutate({ jobId, userId: m.userId })}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {overflow > 0 && (
          <div
            className={`rounded-full flex items-center justify-center font-bold text-muted-foreground bg-muted border-2 border-background ${textSize}`}
            style={{ width: dim, height: dim, marginLeft: -6 }}
          >
            +{overflow}
          </div>
        )}
      </div>

      {/* Add button — md only */}
      {size === 'md' && (
        <div className="relative">
          <button
            type="button"
            className="rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            style={{ width: dim, height: dim }}
            onClick={() => setPopoverOpen((v) => !v)}
            aria-label="Add member"
          >
            <span className="text-base leading-none">+</span>
          </button>
          {popoverOpen && (
            <AddMemberPopover jobId={jobId} onClose={() => setPopoverOpen(false)} />
          )}
        </div>
      )}
    </div>
  )
}
