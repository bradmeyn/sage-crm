import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '#/components/ui/form'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { assetFormSchema, type AssetFormValues, ASSET_CATEGORIES, OWNER_OPTIONS } from '../schemas'
import { useCreateAsset, useUpdateAsset } from '../hooks'
import type { ClientAsset } from '#/db/schema'

interface AssetDialogProps {
  clientId: string
  asset?: ClientAsset
  trigger?: React.ReactNode
  onClose?: () => void
}

export default function AssetDialog({ clientId, asset, trigger, onClose }: AssetDialogProps) {
  const [open, setOpen] = useState(false)
  const createAsset = useCreateAsset()
  const updateAsset = useUpdateAsset()
  const isEditing = !!asset

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      category: asset?.category ?? 'OTHER',
      name: asset?.name ?? '',
      value: asset?.value ?? 0,
      owner: asset?.owner ?? 'CLIENT',
      notes: asset?.notes ?? '',
    },
  })

  const onSubmit = (data: AssetFormValues) => {
    if (isEditing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateAsset.mutate(
        { ...data, clientId, assetId: asset.id } as any,
        {
          onSuccess: () => {
            toast.success('Asset updated')
            handleClose()
          },
          onError: (err: Error) => toast.error(`Error: ${err.message}`),
        },
      )
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createAsset.mutate(
        { ...data, clientId } as any,
        {
          onSuccess: () => {
            toast.success('Asset added')
            handleClose()
          },
          onError: (err: Error) => toast.error(`Error: ${err.message}`),
        },
      )
    }
  }

  const handleClose = () => {
    setOpen(false)
    form.reset()
    onClose?.()
  }

  const isPending = createAsset.isPending || updateAsset.isPending

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true) }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Asset' : 'Add Asset'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ASSET_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Commonwealth Bank savings" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="owner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select owner..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {OWNER_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional notes..." rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Asset'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
