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
import {
  expenseFormSchema,
  type ExpenseFormValues,
  EXPENSE_CATEGORIES,
  FREQUENCIES,
} from '../schemas'
import { useCreateExpense, useUpdateExpense } from '../hooks'
import type { ClientExpense } from '#/db/schema'

interface ExpenseDialogProps {
  clientId: string
  expense?: ClientExpense
  trigger?: React.ReactNode
  onClose?: () => void
}

export default function ExpenseDialog({
  clientId,
  expense,
  trigger,
  onClose,
}: ExpenseDialogProps) {
  const [open, setOpen] = useState(false)
  const createExpense = useCreateExpense()
  const updateExpense = useUpdateExpense()
  const isEditing = !!expense

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      category: expense?.category ?? 'OTHER',
      name: expense?.name ?? '',
      amount: expense?.amount ?? 0,
      frequency: expense?.frequency ?? 'MONTHLY',
      notes: expense?.notes ?? '',
    },
  })

  const onSubmit = (data: ExpenseFormValues) => {
    if (isEditing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateExpense.mutate(
        { ...data, clientId, expenseId: expense.id } as any,
        {
          onSuccess: () => {
            toast.success('Expense updated')
            handleClose()
          },
          onError: (err: Error) => toast.error(`Error: ${err.message}`),
        },
      )
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createExpense.mutate(
        { ...data, clientId } as any,
        {
          onSuccess: () => {
            toast.success('Expense added')
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

  const isPending = createExpense.isPending || updateExpense.isPending

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true) }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
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
                      {EXPENSE_CATEGORIES.map((c) => (
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
                    <Input placeholder="e.g. Mortgage repayment" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ($)</FormLabel>
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
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FREQUENCIES.map((f) => (
                          <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Expense'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
