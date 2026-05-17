import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { getFileNotes } from '#/server/functions/file-notes'
import { fileNoteKeys, useFileNotes } from '#/features/clients/file-notes/hooks'
import { noteColumns } from '#/features/clients/file-notes/components/note-columns'
import AddNoteDialog from '#/features/clients/file-notes/components/add-note-dialog'
import { DataTable } from '#/components/data-table'
import { Card } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { FileText, Plus } from 'lucide-react'
import type { FileNote, ClientDocument } from '#/db/schema'

type FileNoteWithDocuments = FileNote & { documents?: ClientDocument[] }

export const Route = createFileRoute('/(app)/_layout/clients/$clientId/file-notes/')({
  component: FileNotesPage,
  loader: async ({ params: { clientId }, context: { queryClient } }) => {
    await queryClient.ensureQueryData({
      queryKey: fileNoteKeys.list(clientId),
      queryFn: () => getFileNotes({ data: { clientId } }),
    })
    return { clientId }
  },
})

function FileNotesPage() {
  const { clientId } = Route.useLoaderData()
  const { data: fileNotes = [] } = useFileNotes(clientId)
  const [selectedNote, setSelectedNote] = useState<FileNoteWithDocuments | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)

  const handleRowClick = (note: FileNoteWithDocuments) => {
    setSelectedNote(note)
    setIsViewOpen(true)
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">File Notes</h2>
          <p className="text-muted-foreground">Manage file notes for this client</p>
        </div>
        <AddNoteDialog clientId={clientId} />
      </div>

      {fileNotes.length > 0 ? (
        <DataTable
          data={fileNotes as FileNoteWithDocuments[]}
          columns={noteColumns}
          searchPlaceholder="Search file notes..."
          searchKeys={['title', 'body', 'noteType']}
          pageSize={10}
          onRowClick={handleRowClick}
          rowClassName="cursor-pointer hover:bg-muted/40"
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No file notes yet</h3>
          <p className="text-muted-foreground mb-4">
            Add your first file note for this client
          </p>
          <AddNoteDialog
            clientId={clientId}
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add File Note
              </Button>
            }
          />
        </div>
      )}

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedNote?.title ?? 'File Note'}</DialogTitle>
            <DialogDescription>Type: {selectedNote?.noteType ?? '—'}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Body</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {selectedNote?.body || 'No details provided.'}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Documents</h4>
              {selectedNote?.documents && selectedNote.documents.length > 0 ? (
                <div className="space-y-2">
                  {selectedNote.documents.map((document) => (
                    <div
                      key={document.id}
                      className="flex items-center justify-between rounded-md border p-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="truncate text-sm">{document.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No documents attached.</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsViewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
