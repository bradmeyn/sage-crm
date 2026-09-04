import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/_app/clients/$clientId/')({
  component: OverviewPage,
})

const routeApi = getRouteApi('/_app/clients/$clientId')

function OverviewPage() {
  const client = routeApi.useLoaderData()

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="heading-tertiary">Contact</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <Row label="Email" value={client.email} />
          <Row label="Phone" value={client.phone} />
          <Row
            label="Status"
            value={
              <Badge variant="secondary" className="capitalize">
                {client.status}
              </Badge>
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="heading-tertiary">At a glance</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <Row label="Date of birth" value={client.personalDetails.dateOfBirth} />
          <Row label="Marital status" value={client.personalDetails.maritalStatus} />
          <Row
            label="Annual income"
            value={`$${client.financialDetails.annualIncome.toLocaleString()}`}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
