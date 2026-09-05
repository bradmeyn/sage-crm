import { createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/_app/clients/$clientId/file-notes')({
  component: FileNotesPage,
})

function FileNotesPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="heading-tertiary">File Notes</h2>
        <Button size="sm" className="gap-2">
          <Plus className="size-4" />
          Add note
        </Button>
      </div>
      <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
        No file notes yet — this is where crm-api's FileNote records will list once wired up.
      </div>
    </div>
  )
}
