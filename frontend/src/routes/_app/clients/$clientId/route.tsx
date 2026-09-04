import { createFileRoute, Link, notFound, Outlet } from '@tanstack/react-router'
import { getMockClient } from '@/lib/mock-clients'

export const Route = createFileRoute('/_app/clients/$clientId')({
  loader: ({ params }) => {
    const client = getMockClient(params.clientId)
    if (!client) throw notFound()
    return client
  },
  component: ClientLayout,
})

const tabs = [
  { label: 'Overview', to: '.' },
  { label: 'Personal Details', to: 'personal-details' },
  { label: 'Financial Details', to: 'financial-details' },
  { label: 'File Notes', to: 'file-notes' },
  { label: 'Documents', to: 'documents' },
] as const

function ClientLayout() {
  const client = Route.useLoaderData()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/clients" className="text-sm text-muted-foreground hover:underline">
          ← Back to clients
        </Link>
        <h1 className="heading-primary mt-1">
          {client.firstName} {client.lastName}
        </h1>
        <p className="text-sm text-muted-foreground">{client.email}</p>
      </div>

      <nav className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            to={tab.to}
            from={Route.fullPath}
            activeOptions={{ exact: tab.to === '.' }}
            className="rounded-t-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground data-[status=active]:border-b-2 data-[status=active]:border-primary data-[status=active]:font-medium data-[status=active]:text-foreground"
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <Outlet />
    </div>
  )
}
