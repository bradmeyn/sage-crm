import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { mockClients } from '@/lib/mock-clients'

export const Route = createFileRoute('/_app/clients/')({
  component: ClientsListPage,
})

const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  lead: 'secondary',
  inactive: 'outline',
}

function ClientsListPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-primary">Clients</h1>
          <p className="text-sm text-muted-foreground">
            {mockClients.length} clients — placeholder data, wire up to crm-api next.
          </p>
        </div>
        <Button>
          <Plus />
          Add client
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search clients…" className="pl-9" />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockClients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">
                  <Link
                    to="/clients/$clientId"
                    params={{ clientId: client.id }}
                    className="hover:underline"
                  >
                    {client.firstName} {client.lastName}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{client.email}</TableCell>
                <TableCell className="text-muted-foreground">{client.phone}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[client.status]} className="capitalize">
                    {client.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
