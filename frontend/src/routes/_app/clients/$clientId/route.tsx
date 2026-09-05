import { createFileRoute, Link, notFound, Outlet, useLocation } from '@tanstack/react-router'
import { Copy, FileText, IdCard, Mail, NotebookPen, Phone, UserRound, Wallet } from 'lucide-react'
import { useState } from 'react'
import { StatusBadge } from '@/components/clients/status-badge'
import { getMockClient } from '@/lib/mock-clients'

export const Route = createFileRoute('/_app/clients/$clientId')({
  loader: ({ params }) => {
    const client = getMockClient(params.clientId)
    if (!client) throw notFound()
    return client
  },
  component: ClientLayout,
})

const sections = [
  { label: 'Overview', icon: UserRound, to: '.', end: true },
  { label: 'Personal Details', icon: IdCard, to: 'personal-details', end: false },
  { label: 'Financial Details', icon: Wallet, to: 'financial-details', end: false },
  { label: 'File Notes', icon: NotebookPen, to: 'file-notes', end: false },
  { label: 'Documents', icon: FileText, to: 'documents', end: false },
] as const

function ClientLayout() {
  const client = Route.useLoaderData()
  const location = useLocation()
  const [copied, setCopied] = useState<string | null>(null)

  async function copy(label: string, value: string | null) {
    if (!value) return
    await navigator.clipboard.writeText(value)
    setCopied(label)
    setTimeout(() => setCopied((c) => (c === label ? null : c)), 1500)
  }

  return (
    <div className="pt-8">
      <Link to="/clients" className="text-sm text-muted-foreground hover:underline">
        ← Clients
      </Link>

      <div className="mt-2 overflow-hidden rounded-xl border border-border bg-card">
        {/* Identity row inside the same card as the nav and content — as its own
            card it read as a detached strip. */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight">
              {client.firstName} {client.lastName}
            </h1>
            <StatusBadge status={client.status} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip label="Email" value={client.email} icon={Mail} copied={copied} onCopy={copy} />
            <Chip label="Phone" value={client.phone} icon={Phone} copied={copied} onCopy={copy} />
          </div>
        </div>

        <div className="flex flex-col md:flex-row">
          <aside className="shrink-0 border-b border-border md:w-52 md:border-r md:border-b-0">
            <nav className="flex gap-1 overflow-x-auto p-2 md:flex-col md:p-3">
              {sections.map((section) => {
                const isActive = section.end
                  ? location.pathname === `/clients/${client.id}`
                  : location.pathname.startsWith(`/clients/${client.id}/${section.to}`)
                return (
                  <Link
                    key={section.label}
                    to={section.to}
                    from={Route.fullPath}
                    className={`flex items-start gap-2.5 rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-primary/10 font-medium text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <section.icon className="mt-0.5 size-4 shrink-0" />
                    <span className="min-w-0 flex-1">{section.label}</span>
                  </Link>
                )
              })}
            </nav>
          </aside>

          <div className="min-w-0 flex-1 p-5 sm:p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}

function Chip({
  label,
  value,
  icon: Icon,
  copied,
  onCopy,
}: {
  label: string
  value: string | null
  icon: typeof Mail
  copied: string | null
  onCopy: (label: string, value: string | null) => void
}) {
  return (
    <button
      type="button"
      disabled={!value}
      onClick={() => onCopy(label, value)}
      title={value ? `Copy ${label.toLowerCase()}` : `No ${label.toLowerCase()}`}
      className="group flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted disabled:cursor-default disabled:opacity-60 disabled:hover:bg-transparent"
    >
      <Icon className="size-3.5 shrink-0" />
      <span className="max-w-[16rem] truncate">{value || '—'}</span>
      {value && (
        <span className="text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
          {copied === label ? 'Copied' : ''}
          <Copy className="ml-0.5 inline size-3" />
        </span>
      )}
    </button>
  )
}
