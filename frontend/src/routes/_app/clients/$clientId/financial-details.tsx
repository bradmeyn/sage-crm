import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/_app/clients/$clientId/financial-details')({
  component: FinancialDetailsPage,
})

const routeApi = getRouteApi('/_app/clients/$clientId')

const currency = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 })

function FinancialDetailsPage() {
  const client = routeApi.useLoaderData()
  const { financialDetails } = client

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard label="Annual income" value={currency.format(financialDetails.annualIncome)} />
      <StatCard label="Net worth" value={currency.format(financialDetails.netWorth)} />
      <StatCard label="Super balance" value={currency.format(financialDetails.superBalance)} />
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-normal text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <span className="heading-secondary">{value}</span>
      </CardContent>
    </Card>
  )
}
