import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '#/server/middleware'
import { db } from '#/db/index'
import { fileNote, client } from '#/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

async function verifyClientOwnership(clientId: string, orgId: string) {
  const c = await db.query.client.findFirst({
    where: and(eq(client.id, clientId), eq(client.organizationId, orgId)),
  })
  if (!c) throw new Error('Client not found or unauthorized')
  return c
}

const noteInputSchema = z.object({
  clientId: z.string(),
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  noteType: z.string().min(1),
  isPrivate: z.boolean().default(false),
})

const updateNoteSchema = z.object({
  noteId: z.string(),
  clientId: z.string(),
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  noteType: z.string().min(1),
  isPrivate: z.boolean().default(false),
})

const deleteNoteSchema = z.object({ noteId: z.string(), clientId: z.string() })

export const getFileNotes = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator(z.object({ clientId: z.string() }))
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!
    await verifyClientOwnership(data.clientId, orgId)
    return db.query.fileNote.findMany({
      where: eq(fileNote.clientId, data.clientId),
      with: { documents: true },
      orderBy: (fn, { desc }) => [desc(fn.createdAt)],
    })
  })

export const createFileNote = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(noteInputSchema)
  .handler(async ({ context, data }) => {
    const { session } = context
    const orgId = session.session.activeOrganizationId!
    await verifyClientOwnership(data.clientId, orgId)
    const [note] = await db
      .insert(fileNote)
      .values({
        clientId: data.clientId,
        title: data.title,
        body: data.body,
        noteType: data.noteType,
        isPrivate: data.isPrivate,
        createdById: session.user.id,
        updatedById: session.user.id,
      })
      .returning()
    return note
  })

export const updateFileNote = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(updateNoteSchema)
  .handler(async ({ context, data }) => {
    const { session } = context
    const orgId = session.session.activeOrganizationId!
    await verifyClientOwnership(data.clientId, orgId)
    const { noteId, ...fields } = data
    const [updated] = await db
      .update(fileNote)
      .set({
        title: fields.title,
        body: fields.body,
        noteType: fields.noteType,
        isPrivate: fields.isPrivate,
        updatedById: session.user.id,
        updatedAt: new Date(),
      })
      .where(eq(fileNote.id, noteId))
      .returning()
    return updated
  })

export const deleteFileNote = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(deleteNoteSchema)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!
    await verifyClientOwnership(data.clientId, orgId)
    await db.delete(fileNote).where(eq(fileNote.id, data.noteId))
    return { success: true }
  })
