import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { DropdownMenuItem } from '#/components/ui/dropdown-menu'
import { useUpdateFileNote } from '#/features/clients/file-notes/hooks'
import { noteSchema, type NewNote, NOTE_TYPES } from '#/features/clients/file-notes/schemas'
import type { FileNote } from '#/db/schema'
import { toast } from 'sonner'

interface EditNoteMenuItemProps {
  note: FileNote
}

export default function EditNoteMenuItem({ note }: EditNoteMenuItemProps) {
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const updateFileNoteMutation = useUpdateFileNote()

  const form = useForm<NewNote>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: note.title,
      body: note.body,
      noteType: note.noteType,
      isPrivate: note.isPrivate,
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      title: note.title,
      body: note.body,
      noteType: note.noteType,
      isPrivate: note.isPrivate,
    })
    setFiles([])
  }, [form, note, open])

  const onSubmit = (data: NewNote) => {
    updateFileNoteMutation.mutate(
      {
        noteId: note.id,
        clientId: note.clientId,
        ...data,
        files,
      },
      {
        onSuccess: () => {
          toast.success('File note updated successfully')
          setOpen(false)
          setFiles([])
        },
        onError: (error: Error) => {
          toast.error(`Error updating file note: ${error.message}`)
        },
      },
    )
  }

  return (
    <>
      <DropdownMenuItem
        onSelect={(event) => {
          event.preventDefault()
          setOpen(true)
        }}
      >
        Edit
      </DropdownMenuItem>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
            <DialogDescription>Update note details and attach PDFs.</DialogDescription>
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
                <FormLabel>Add Documents</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    multiple
                    onChange={(event) => {
                      const selectedFiles = event.target.files
                        ? Array.from(event.target.files)
                        : []
                      setFiles(selectedFiles)
                    }}
                  />
                </FormControl>
                <FormDescription>Uploaded files will be linked to this file note.</FormDescription>
                <FormMessage />
              </FormItem>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateFileNoteMutation.isPending}>
                  {updateFileNoteMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}
