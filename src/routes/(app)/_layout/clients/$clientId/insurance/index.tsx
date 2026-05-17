import { useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { getInsurance } from '#/server/functions/insurance'
import { insuranceKeys, useInsurance, useDeleteInsurance } from '#/features/clients/insurance/hooks'
import { buildInsuranceColumns } from '#/features/clients/insurance/components/insurance-columns'
import InsuranceDialog from '#/features/clients/insurance/components/insurance-dialog'
import { DataTable } from '#/components/data-table'
import { Card } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { LayoutList, Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { ClientInsurance } from '#/db/schema'

export const Route = createFileRoute('/(app)/_layout/clients/$clientId/insurance/')({
  component: InsurancePage,
  loader: async ({ params: { clientId }, context: { queryClient } }) => {
    await queryClient.ensureQueryData({
      queryKey: insuranceKeys.list(clientId),
      queryFn: () => getInsurance({ data: { clientId } }),
    })
    return { clientId }
  },
})

function InsurancePage() {
  const { clientId } = Route.useLoaderData()
  const { data: policies = [] } = useInsurance(clientId)
  const deleteInsurance = useDeleteInsurance()

  const columns = useMemo(
    () =>
      buildInsuranceColumns(clientId, (policy: ClientInsurance) => {
        deleteInsurance.mutate(
          { insuranceId: policy.id, clientId },
          {
            onSuccess: () => toast.success('Policy deleted'),
            onError: (err: Error) => toast.error(err.message),
          },
        )
      }),
    [clientId, deleteInsurance],
  )

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Insurance</h2>
          <p className="text-muted-foreground">Insurance policies and cover</p>
        </div>
        <InsuranceDialog clientId={clientId} />
      </div>

      {policies.length > 0 ? (
        <DataTable
          data={policies}
          columns={columns}
          searchPlaceholder="Search policies..."
          searchKeys={['insurer', 'category', 'policyNumber']}
          pageSize={20}
          enableSearch={policies.length > 8}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <LayoutList className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No insurance policies recorded</h3>
          <p className="text-muted-foreground mb-4">Add the first policy for this client</p>
          <InsuranceDialog
            clientId={clientId}
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Policy
              </Button>
            }
          />
        </div>
      )}
    </Card>
  )
}
