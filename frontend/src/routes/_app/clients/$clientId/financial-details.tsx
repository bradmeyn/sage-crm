import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { StatTile } from '@/components/stat-tile'

export const Route = createFileRoute('/_app/clients/$clientId/financial-details')({
  component: FinancialDetailsPage,
})

const routeApi = getRouteApi('/_app/clients/$clientId')
const currency = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 0,
})

function FinancialDetailsPage() {
  const { financialDetails } = routeApi.useLoaderData()

  return (
    <div className="flex flex-col gap-6">
      <h2 className="heading-tertiary">Financial Details</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Annual income" value={currency.format(financialDetails.annualIncome)} />
        <StatTile label="Net worth" value={currency.format(financialDetails.netWorth)} />
        <StatTile label="Super balance" value={currency.format(financialDetails.superBalance)} />
      </div>
    </div>
  )
}
