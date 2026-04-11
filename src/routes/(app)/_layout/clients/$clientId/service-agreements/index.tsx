import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { FileText, Plus } from 'lucide-react'
import { getServiceAgreement } from '#/server/functions/service-agreements'
import { agreementKeys, useServiceAgreement } from '#/features/service-agreements/hooks'
import ServiceAgreementCard from '#/features/service-agreements/components/service-agreement-card'
import ServiceAgreementDialog from '#/features/service-agreements/components/service-agreement-dialog'
import { Button } from '#/components/ui/button'

export const Route = createFileRoute(
  '/(app)/_layout/clients/$clientId/service-agreements/',
)({
  component: ServiceAgreementsPage,
  loader: async ({ params: { clientId }, context: { queryClient } }) => {
    await queryClient.ensureQueryData({
      queryKey: agreementKeys.byClient(clientId),
      queryFn: () => getServiceAgreement({ data: { clientId } }),
    })
    return { clientId }
  },
})

function ServiceAgreementsPage() {
  const { clientId } = Route.useLoaderData()
  const { data: agreement } = useServiceAgreement(clientId)
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Service Agreement</h2>
          <p className="text-sm text-muted-foreground">
            Ongoing fee arrangement under ASIC requirements
          </p>
        </div>
        {!agreement && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Agreement
          </Button>
        )}
      </div>

      {agreement ? (
        <ServiceAgreementCard agreement={agreement} clientId={clientId} />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-white">
          <FileText className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="font-medium mb-1">No service agreement on file</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Record the client's ongoing service arrangement and track annual renewals.
          </p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Agreement
          </Button>
        </div>
      )}

      <ServiceAgreementDialog
        clientId={clientId}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  )
}
