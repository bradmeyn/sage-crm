import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/_app/clients/$clientId/personal-details')({
  component: PersonalDetailsPage,
})

const routeApi = getRouteApi('/_app/clients/$clientId')

function PersonalDetailsPage() {
  const client = routeApi.useLoaderData()
  const { personalDetails } = client

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="heading-tertiary">Personal Details</CardTitle>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Field label="Date of birth" value={personalDetails.dateOfBirth} />
        <Field label="Gender" value={personalDetails.gender} />
        <Field label="Marital status" value={personalDetails.maritalStatus} />
        <Field label="Address" value={personalDetails.address} />
      </CardContent>
    </Card>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}
