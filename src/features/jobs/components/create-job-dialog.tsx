import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { JOB_PRIORITIES, JOB_STATUSES, ACTIVE_JOB_SLUGS } from '../schemas'
import { useCreateJob } from '../hooks'
import { useClients } from '#/features/clients/hooks'
import { useTemplates } from '../templates/hooks'

const createJobFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  templateId: z.string().min(1, 'Template is required'),
  priority: z.string().min(1, 'Priority is required'),
  status: z.string().min(1, 'Status is required'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
})

type CreateJobFormValues = z.infer<typeof createJobFormSchema>

interface CreateJobDialogProps {
  /** Pre-fill clientId — if provided the client selector is hidden */
  clientId?: string
  trigger?: React.ReactNode
}

export default function CreateJobDialog({ clientId, trigger }: CreateJobDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState(clientId ?? '')
  const [clientError, setClientError] = useState('')

  const createJob = useCreateJob()
  const { data: clients = [] } = useClients()
  const { data: allTemplates } = useTemplates()
  const templates = allTemplates.filter((t) =>
    ACTIVE_JOB_SLUGS.includes(t.slug as (typeof ACTIVE_JOB_SLUGS)[number]),
  )

  const form = useForm<CreateJobFormValues>({
    resolver: zodResolver(createJobFormSchema),
    defaultValues: {
      title: '',
      templateId: '',
      priority: 'MEDIUM',
      status: 'ACTIVE',
      description: '',
      dueDate: '',
    },
  })

  const onSubmit = (data: CreateJobFormValues) => {
    const cid = clientId ?? selectedClientId
    if (!cid) {
      setClientError('Client is required')
      return
    }
    createJob.mutate(
      {
        clientId: cid,
        title: data.title,
        templateId: data.templateId,
        priority: data.priority,
        status: data.status,
        description: data.description || undefined,
        dueDate: data.dueDate || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Job created')
          handleClose()
        },
        onError: (err: Error) => toast.error(`Error: ${err.message}`),
      },
    )
  }

  const handleClose = () => {
    setOpen(false)
    setClientError('')
    if (!clientId) setSelectedClientId('')
    form.reset({
      title: '',
      templateId: '',
      priority: 'MEDIUM',
      status: 'ACTIVE',
      description: '',
      dueDate: '',
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true) }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Job
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Create Job</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!clientId && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Client</label>
                <Select
                  onValueChange={(v) => { setSelectedClientId(v); setClientError('') }}
                  value={selectedClientId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.firstName} {c.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {clientError && <p className="text-sm text-destructive">{clientError}</p>}
              </div>
            )}

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Initial onboarding" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="templateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select template..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {templates.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {JOB_PRIORITIES.map((p) => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {JOB_STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional description..." rows={2} {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button type="submit" disabled={createJob.isPending}>
                {createJob.isPending ? 'Creating...' : 'Create Job'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
