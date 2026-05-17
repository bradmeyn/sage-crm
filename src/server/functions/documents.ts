import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '#/server/middleware'
import { db } from '#/db/index'
import { clientDocument, client } from '#/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

async function verifyClientOwnership(clientId: string, orgId: string) {
  const c = await db.query.client.findFirst({
    where: and(eq(client.id, clientId), eq(client.organizationId, orgId)),
  })
  if (!c) throw new Error('Client not found or unauthorized')
  return c
}

const uploadDocumentSchema = z.object({
  clientId: z.string(),
  fileNoteId: z.string().optional(),
  category: z.string().default('OTHER'),
  description: z.string().optional(),
  fileName: z.string(),
  fileSize: z.number(),
  fileData: z.string(), // base64 encoded
  mimeType: z.string(),
})

const deleteDocumentSchema = z.object({ documentId: z.string(), clientId: z.string() })

export const getDocuments = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator(z.object({ clientId: z.string() }))
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!
    await verifyClientOwnership(data.clientId, orgId)
    return db.query.clientDocument.findMany({
      where: eq(clientDocument.clientId, data.clientId),
      orderBy: (d, { desc }) => [desc(d.createdAt)],
    })
  })

export const uploadDocument = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(uploadDocumentSchema)
  .handler(async ({ context, data }) => {
    const { session } = context
    const orgId = session.session.activeOrganizationId!
    await verifyClientOwnership(data.clientId, orgId)

    const base64Data = data.fileData.replace(/^data:[^;]+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    const ext = data.fileName.split('.').pop() ?? 'bin'
    const uniqueName = `${randomUUID()}.${ext}`
    const uploadPath = join(process.cwd(), 'public', 'uploads', uniqueName)
    await writeFile(uploadPath, buffer)

    const [doc] = await db
      .insert(clientDocument)
      .values({
        clientId: data.clientId,
        fileNoteId: data.fileNoteId ?? null,
        filePath: `/uploads/${uniqueName}`,
        name: data.fileName,
        description: data.description ?? null,
        size: data.fileSize,
        category: data.category,
        createdById: session.user.id,
        updatedById: session.user.id,
      })
      .returning()
    return doc
  })

export const deleteDocument = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(deleteDocumentSchema)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!
    await verifyClientOwnership(data.clientId, orgId)

    const doc = await db.query.clientDocument.findFirst({
      where: eq(clientDocument.id, data.documentId),
    })
    if (doc?.filePath) {
      try {
        await unlink(join(process.cwd(), 'public', doc.filePath))
      } catch {
        // ignore missing file
      }
    }

    await db.delete(clientDocument).where(eq(clientDocument.id, data.documentId))
    return { success: true }
  })
