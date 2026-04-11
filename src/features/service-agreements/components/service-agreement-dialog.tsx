import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Textarea } from '#/components/ui/textarea'
import { toast } from 'sonner'
import {
  useCreateServiceAgreement,
  useUpdateServiceAgreement,
} from '#/features/service-agreements/hooks'
import type { ServiceAgreement } from '#/db/schema'

interface Props {
  clientId: string
  agreement?: ServiceAgreement
  open: boolean
  onOpenChange: (open: boolean) => void
}

function centsToDisplay(cents: number): string {
  return (cents / 100).toFixed(2)
}

function displayToCents(val: string): number {
  return Math.round(parseFloat(val) * 100)
}

export default function ServiceAgreementDialog({
  clientId,
  agreement,
  open,
  onOpenChange,
}: Props) {
  const isEdit = !!agreement
  const create = useCreateServiceAgreement(clientId)
  const update = useUpdateServiceAgreement(clientId)

  const today = new Date().toISOString().split('T')[0]
  const oneYearFromNow = (() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() + 1)
    return d.toISOString().split('T')[0]
  })()

  const [startDate, setStartDate] = useState(agreement?.startDate ?? today)
  const [nextRenewalDate, setNextRenewalDate] = useState(
    agreement?.nextRenewalDate ?? oneYearFromNow,
  )
  const [feeAmount, setFeeAmount] = useState(
    agreement ? centsToDisplay(agreement.feeAmount) : '',
  )
  const [feeFrequency, setFeeFrequency] = useState<'MONTHLY' | 'QUARTERLY' | 'ANNUALLY'>(
    (agreement?.feeFrequency as 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY') ?? 'ANNUALLY',
  )
  const [services, setServices] = useState(agreement?.services ?? '')
  const [notes, setNotes] = useState(agreement?.notes ?? '')

  const isPending = create.isPending || update.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cents = displayToCents(feeAmount)
    if (isNaN(cents) || cents <= 0) {
      toast.error('Enter a valid fee amount')
      return
    }
    const payload = {
      startDate,
      nextRenewalDate,
      feeAmount: cents,
      feeFrequency,
      services,
      notes: notes || undefined,
    }

    if (isEdit) {
      update.mutate(
        { id: agreement.id, ...payload },
        {
          onSuccess: () => {
            toast.success('Agreement updated')
            onOpenChange(false)
          },
          onError: (err: Error) => toast.error(err.message),
        },
      )
    } else {
      create.mutate(
        { clientId, ...payload },
        {
          onSuccess: () => {
            toast.success('Agreement created')
            onOpenChange(false)
          },
          onError: (err: Error) => toast.error(err.message),
        },
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Service Agreement' : 'New Service Agreement'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nextRenewalDate">Next Renewal Date</Label>
              <Input
                id="nextRenewalDate"
                type="date"
                value={nextRenewalDate}
                onChange={(e) => setNextRenewalDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="feeAmount">Fee Amount ($)</Label>
              <Input
                id="feeAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="5500.00"
                value={feeAmount}
                onChange={(e) => setFeeAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Fee Frequency</Label>
              <Select
                value={feeFrequency}
                onValueChange={(v) => setFeeFrequency(v as typeof feeFrequency)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  <SelectItem value="ANNUALLY">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="services">Services Included</Label>
            <Textarea
              id="services"
              placeholder="e.g. Annual financial plan review, investment advice, insurance review..."
              value={services}
              onChange={(e) => setServices(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Internal notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Agreement'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
