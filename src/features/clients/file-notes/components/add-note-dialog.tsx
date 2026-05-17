import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '#/components/ui/form'
import { useCreateFileNote } from '#/features/clients/file-notes/hooks'
import { noteSchema, type NewNote, NOTE_TYPES } from '#/features/clients/file-notes/schemas'
import { FileText, Plus, Upload } from 'lucide-react'
import { toast } from 'sonner'

interface AddNoteDialogProps {
  clientId: string
  trigger?: React.ReactNode
}

export default function AddNoteDialog({ clientId, trigger }: AddNoteDialogProps) {
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const createFileNoteMutation = useCreateFileNote()

  const form = useForm<NewNote>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: '',
      body: '',
      noteType: 'GENERAL',
      isPrivate: false,
    },
  })

  const onSubmit = (data: NewNote) => {
    createFileNoteMutation.mutate(
      { ...data, clientId, files },
      {
        onSuccess: () => {
          toast.success('File note created successfully')
          setOpen(false)
          setFiles([])
          form.reset()
        },
        onError: (error: Error) => {
          toast.error(`Error creating file note: ${error.message}`)
        },
      },
    )
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setFiles([])
      setIsDragging(false)
      form.reset()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Note
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Note</DialogTitle>
          <DialogDescription>Add a note for this client.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="noteType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {NOTE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Note title..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Body</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write your file note here..."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPrivate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visibility</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === 'private')}
                    value={field.value ? 'private' : 'shared'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="shared">Shared</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Attach Documents</FormLabel>
              <FormControl>
                <div
                  className={`flex flex-col items-center justify-center gap-2 rounded-md border border-dashed px-4 py-6 text-sm transition ${
                    isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/40'
                  }`}
                  onDragOver={(event) => {
                    event.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault()
                    setIsDragging(false)
                    const droppedFiles = event.dataTransfer.files
                      ? Array.from(event.dataTransfer.files)
                      : []
                    if (droppedFiles.length > 0) setFiles(droppedFiles)
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <div className="text-center">
                    <div className="font-medium">Drag files here, or click to browse</div>
                    <div className="text-xs text-muted-foreground">
                      Attach PDFs and other documents
                    </div>
                  </div>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      const selectedFiles = event.target.files
                        ? Array.from(event.target.files)
                        : []
                      setFiles(selectedFiles)
                    }}
                  />
                </div>
              </FormControl>
              <FormDescription>Uploaded files will be linked to this file note.</FormDescription>
              <FormMessage />
            </FormItem>

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={`${file.name}-${file.lastModified}`}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="truncate">{file.name}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                ))}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createFileNoteMutation.isPending}>
                {createFileNoteMutation.isPending ? 'Creating...' : 'Create File Note'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
