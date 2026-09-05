import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/_app/clients/$clientId/personal-details')({
  component: PersonalDetailsPage,
})

const routeApi = getRouteApi('/_app/clients/$clientId')

function PersonalDetailsPage() {
  const { personalDetails } = routeApi.useLoaderData()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="heading-tertiary">Personal Details</h2>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date of birth" value={personalDetails.dateOfBirth} />
        <Field label="Gender" value={personalDetails.gender} />
        <Field label="Marital status" value={personalDetails.maritalStatus} />
        <Field label="Address" value={personalDetails.address} />
      </div>
    </div>
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
