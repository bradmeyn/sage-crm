import {
  createFileRoute,
  Outlet,
  useLoaderData,
  Link,
  useMatchRoute,
} from '@tanstack/react-router'
import { getClient } from '#/server/functions/clients'
import type { ClientWithPartner } from '#/server/functions/clients'
import { clientKeys } from '#/features/clients/hooks'
import { Card } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Phone, Mail, Copy, Edit } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/(app)/_layout/clients/$clientId')({
  component: ClientLayout,
  loader: async ({ params: { clientId }, context: { queryClient } }) => {
    const client = await queryClient.fetchQuery({
      queryKey: clientKeys.detail(clientId),
      queryFn: () => getClient({ data: { clientId } }),
    })
    return client
  },
})

function ClientLayout() {
  const client = useLoaderData({ from: Route.id }) as ClientWithPartner

  return (
    <div>
      <Card className="mb-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold mx-4">
              {client.firstName}
              {client.preferredName ? ` (${client.preferredName})` : ''} {client.lastName}
            </h1>
            <div className="flex space-x-3">
              <Button size="sm">
                <Edit className="mr-2 size-4" />
                Edit Client
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 max-w-xl">
            <ContactItem label="Email" info={client.email ?? ''} icon={Mail} />
            <ContactItem label="Phone Number" info={client.phone ?? ''} icon={Phone} />
          </div>
        </div>

        <div className="bg-white border-b">
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="-mb-px flex space-x-8">
              <NavTab to="/clients/$clientId" params={{ clientId: client.id }}>
                Overview
              </NavTab>
              <NavTab to="/clients/$clientId/file-notes" params={{ clientId: client.id }}>
                File Notes
              </NavTab>
              <NavTab to="/clients/$clientId/documents" params={{ clientId: client.id }}>
                Documents
              </NavTab>
              <NavTab to="/clients/$clientId/balance-sheet" params={{ clientId: client.id }}>
                Balance Sheet
              </NavTab>
              <NavTab to="/clients/$clientId/cashflow" params={{ clientId: client.id }}>
                Cashflow
              </NavTab>
              <NavTab to="/clients/$clientId/goals" params={{ clientId: client.id }}>
                Goals
              </NavTab>
              <NavTab to="/clients/$clientId/insurance" params={{ clientId: client.id }}>
                Insurance
              </NavTab>
              <NavTab to="/clients/$clientId/jobs" params={{ clientId: client.id }}>
                Jobs
              </NavTab>
              <NavTab to="/clients/$clientId/service-agreements" params={{ clientId: client.id }}>
                Service Agreements
              </NavTab>
            </nav>
          </div>
        </div>
      </Card>

      <div>
        <Outlet />
      </div>
    </div>
  )
}

function NavTab({
  to,
  params,
  children,
}: {
  to: string
  params: { clientId: string }
  children: React.ReactNode
}) {
  const matchRoute = useMatchRoute()
  const isActive = matchRoute({ to, params, fuzzy: false })

  return (
    <Link
      to={to}
      params={params}
      className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
        isActive
          ? 'border-primary text-primary'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {children}
    </Link>
  )
}

function ContactItem({
  label,
  info,
  icon: Icon,
}: {
  label: string
  info: string
  icon: React.ComponentType<{ className?: string }>
}) {
  const handleCopy = async () => {
    if (!info) { toast('No data to copy'); return }
    await navigator.clipboard.writeText(info)
    toast.success(`${label} copied to clipboard`)
  }

  return (
    <div
      className="group relative flex items-center space-x-3 rounded-md px-2 py-1 hover:bg-muted/50 cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={handleCopy}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCopy() } }}
      title={`Click to copy ${label}`}
    >
      <div className="p-2 bg-gray-100 rounded-full">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{info || '—'}</p>
      </div>
      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center">
        <Copy className="h-4 w-4 text-muted-foreground" aria-hidden />
        <span className="sr-only">Copy {label}</span>
      </div>
    </div>
  )
}
