import { createFileRoute } from '@tanstack/react-router'
import { UploadCloud } from 'lucide-react'

export const Route = createFileRoute('/_app/clients/$clientId/documents')({
  component: DocumentsPage,
})

function DocumentsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="heading-tertiary">Documents</h2>
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
        <UploadCloud className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium">Drag files here or click to upload</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Wire this to crm-api's FileStorageService (currently backs FileNote attachments) once a
          general client-document endpoint exists.
        </p>
        <input type="file" className="mt-2 text-sm" multiple disabled />
      </div>
    </div>
  )
}
