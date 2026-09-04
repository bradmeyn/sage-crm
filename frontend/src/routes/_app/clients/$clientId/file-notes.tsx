import { createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export const Route = createFileRoute('/_app/clients/$clientId/file-notes')({
  component: FileNotesPage,
})

function FileNotesPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="heading-tertiary">File Notes</h2>
        <Button size="sm">
          <Plus />
          Add note
        </Button>
      </div>
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No file notes yet — this is where crm-api's FileNote records will list once wired up.
        </CardContent>
      </Card>
    </div>
  )
}
