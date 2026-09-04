import { createFileRoute } from '@tanstack/react-router'
import { UploadCloud } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export const Route = createFileRoute('/_app/clients/$clientId/documents')({
  component: DocumentsPage,
})

function DocumentsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="heading-tertiary">Documents</h2>
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <UploadCloud className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium">Drag files here or click to upload</p>
          <p className="text-xs text-muted-foreground">
            Wire this to crm-api's FileStorageService (currently backs FileNote attachments) once
            a general client-document endpoint exists.
          </p>
          <input type="file" className="mt-2 text-sm" multiple disabled />
        </CardContent>
      </Card>
    </div>
  )
}
