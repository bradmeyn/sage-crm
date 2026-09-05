import { useNavigate } from '@tanstack/react-router'
import { ChevronDown, ChevronRight, ChevronsUpDown, ChevronUp, User } from 'lucide-react'
import type { MockClient } from '@/lib/mock-clients'

export type SortCol = 'firstName' | 'lastName' | 'email'
export type SortOrder = 'asc' | 'desc'

const cols: { id: SortCol; label: string; sortable: true }[] = [
  { id: 'firstName', label: 'First Name', sortable: true },
  { id: 'lastName', label: 'Last Name', sortable: true },
  { id: 'email', label: 'Email', sortable: true },
]

export function ClientTable({
  clients,
  sort,
  order,
  onSort,
}: {
  clients: MockClient[]
  sort: SortCol
  order: SortOrder
  onSort: (col: SortCol) => void
}) {
  return (
    // The page pins the header/search above this and gives it the remaining
    // height (flex-1 min-h-0) — this scrolls internally rather than the whole
    // page, so the toolbar and column headers stay put over a long list.
    <div className="h-full overflow-y-auto rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-card">
          <tr className="border-b border-border">
            {cols.map((col) => (
              <th key={col.id} className="px-4 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                <button
                  className="flex items-center gap-1.5 transition-colors hover:text-foreground"
                  onClick={() => onSort(col.id)}
                >
                  {col.label}
                  {sort === col.id ? (
                    order === 'asc' ? (
                      <ChevronUp className="size-3.5" />
                    ) : (
                      <ChevronDown className="size-3.5" />
                    )
                  ) : (
                    <ChevronsUpDown className="size-3.5 opacity-40" />
                  )}
                </button>
              </th>
            ))}
            <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">Phone</th>
            <th className="w-10 px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <Row key={c.id} client={c} />
          ))}
        </tbody>
      </table>

      {clients.length === 0 && (
        <div className="p-12 text-center text-sm text-muted-foreground">No clients match your search.</div>
      )}
    </div>
  )
}

function Row({ client: c }: { client: MockClient }) {
  const navigate = useNavigate()

  return (
    <tr
      className="group cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/50"
      onClick={() => navigate({ to: '/clients/$clientId', params: { clientId: c.id } })}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-full border border-border bg-background">
            <User className="size-3.5 text-muted-foreground" />
          </span>
          <span>{c.firstName}</span>
        </div>
      </td>
      <td className="px-4 py-3">{c.lastName}</td>
      <td className="px-4 py-3">{c.email || '—'}</td>
      <td className="px-4 py-3">{c.phone || '—'}</td>
      <td className="px-4 py-3 text-right">
        <ChevronRight className="ml-auto size-4 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
      </td>
    </tr>
  )
}
