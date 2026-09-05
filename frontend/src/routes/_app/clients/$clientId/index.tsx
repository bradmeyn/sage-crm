import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { StatTile } from '@/components/stat-tile'

export const Route = createFileRoute('/_app/clients/$clientId/')({
  component: OverviewPage,
})

const routeApi = getRouteApi('/_app/clients/$clientId')
const currency = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 })

function OverviewPage() {
  const client = routeApi.useLoaderData()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="heading-tertiary">Overview</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {client.personalDetails.maritalStatus} · Born {client.personalDetails.dateOfBirth}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Annual income" value={currency.format(client.financialDetails.annualIncome)} />
        <StatTile label="Net worth" value={currency.format(client.financialDetails.netWorth)} />
        <StatTile label="Super balance" value={currency.format(client.financialDetails.superBalance)} />
      </div>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
        <p className="mt-1 text-sm">{client.personalDetails.address}</p>
      </div>
    </div>
  )
}
