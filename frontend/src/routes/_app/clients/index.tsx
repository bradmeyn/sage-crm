import { createFileRoute } from '@tanstack/react-router'
import { CirclePlus, ClipboardList, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ClientTable, type SortCol, type SortOrder } from '@/components/clients/client-table'
import { Button } from '@/components/ui/button'
import { mockClients } from '@/lib/mock-clients'

export const Route = createFileRoute('/_app/clients/')({
  component: ClientsListPage,
})

const collator = new Intl.Collator('en-AU', { sensitivity: 'base' })

function ClientsListPage() {
  const [sort, setSort] = useState<SortCol>('firstName')
  const [order, setOrder] = useState<SortOrder>('asc')
  const [search, setSearch] = useState('')

  function onSort(col: SortCol) {
    if (sort === col) setOrder(order === 'asc' ? 'desc' : 'asc')
    else {
      setSort(col)
      setOrder('asc')
    }
  }

  const rows = useMemo(() => {
    const dir = order === 'desc' ? -1 : 1
    const sorted = [...mockClients].sort((a, b) => {
      const cmp = collator.compare(a[sort] ?? '', b[sort] ?? '')
      return cmp !== 0 ? cmp * dir : collator.compare(a.firstName, b.firstName)
    })

    const q = search.trim().toLowerCase()
    if (!q) return sorted
    return sorted.filter((c) => [c.firstName, c.lastName, c.email, c.phone].some((v) => v?.toLowerCase().includes(q)))
  }, [sort, order, search])

  return (
    <div className="flex h-full min-h-0 flex-col pt-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-primary">Clients</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {mockClients.length} {mockClients.length === 1 ? 'client' : 'clients'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <CirclePlus className="size-4" /> Quick Add
          </Button>
          <Button size="sm" className="gap-2">
            <ClipboardList className="size-4" /> Add client
          </Button>
        </div>
      </div>

      <div className="mt-6 max-w-md">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone..."
            className="h-9 w-full rounded-md border border-input bg-card pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
          />
        </div>
      </div>

      <div className="mt-4 min-h-0 flex-1">
        <ClientTable clients={rows} sort={sort} order={order} onSort={onSort} />
      </div>
    </div>
  )
}
