import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '#/server/middleware'
import { db } from '#/db/index'
import { client, job, jobClient, jobMember, jobTask, jobComment, jobActivity, jobDocument, jobTemplate, notification } from '#/db/schema'
import { eq, and, desc, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

// ─── Private helpers ──────────────────────────────────────────────────────────

async function createNotificationsForMembers(
  jobId: string,
  excludeUserId: string,
  payload: { type: string; title: string; body: string; clientId?: string },
) {
  const members = await db.query.jobMember.findMany({
    where: eq(jobMember.jobId, jobId),
  })
  const targets = members.filter((m) => m.userId !== excludeUserId)
  if (!targets.length) return
  await db.insert(notification).values(
    targets.map((m) => ({
      userId: m.userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      jobId,
      clientId: payload.clientId ?? null,
    })),
  )
}

async function verifyClientOwnership(clientId: string, orgId: string) {
  const c = await db.query.client.findFirst({
    where: and(eq(client.id, clientId), eq(client.organizationId, orgId)),
  })
  if (!c) throw new Error('Client not found or unauthorized')
  return c
}

async function verifyJobOwnership(jobId: string, orgId: string) {
  const j = await db.query.job.findFirst({
    where: and(eq(job.id, jobId), eq(job.organizationId, orgId)),
  })
  if (!j) throw new Error('Job not found or unauthorized')
  return j
}

async function logActivity(
  tx: typeof db,
  { jobId, type, body, userId }: { jobId: string; type: string; body: string; userId: string },
) {
  await tx.insert(jobActivity).values({ jobId, type, body, createdById: userId })
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createJobSchema = z.object({
  clientId: z.string(),
  title: z.string().min(1).max(200),
  templateId: z.string().min(1),
  priority: z.string().default('MEDIUM'),
  status: z.string().default('ACTIVE'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  assignedToId: z.string().optional(),
})

const updateJobSchema = z.object({
  jobId: z.string(),
  title: z.string().min(1).max(200),
  priority: z.string(),
  status: z.string(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  assignedToId: z.string().optional(),
})

const updateJobStageSchema = z.object({
  jobId: z.string(),
  currentStage: z.string(),
})

const jobIdSchema = z.object({ jobId: z.string() })
const clientIdSchema = z.object({ clientId: z.string() })

const toggleTaskSchema = z.object({
  taskId: z.string(),
  jobId: z.string(),
  isCompleted: z.boolean(),
})

const addTaskSchema = z.object({
  jobId: z.string(),
  title: z.string().min(1),
  sortOrder: z.number().int().optional(),
})

const deleteTaskSchema = z.object({
  taskId: z.string(),
  jobId: z.string(),
})

const addJobClientSchema = z.object({ jobId: z.string(), clientId: z.string() })
const removeJobClientSchema = z.object({ jobId: z.string(), clientId: z.string() })

const addJobCommentSchema = z.object({ jobId: z.string(), body: z.string().min(1) })
const deleteJobCommentSchema = z.object({ commentId: z.string(), jobId: z.string() })

const uploadJobDocumentSchema = z.object({
  jobId: z.string(),
  fileName: z.string(),
  fileData: z.string(), // base64 encoded
  mimeType: z.string(),
  size: z.number().optional(),
})

const deleteJobDocumentSchema = z.object({ documentId: z.string(), jobId: z.string() })

// ─── Handlers ─────────────────────────────────────────────────────────────────

export const getJobs = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const orgId = context.session.session.activeOrganizationId!
    return db.query.job.findMany({
      where: eq(job.organizationId, orgId),
      orderBy: [desc(job.updatedAt)],
      with: {
        tasks: true,
        clients: { with: { client: true } },
        members: { with: { user: true } },
      },
    })
  })

export const getClientJobs = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator(clientIdSchema)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!
    await verifyClientOwnership(data.clientId, orgId)

    const refs = await db
      .select({ jobId: jobClient.jobId })
      .from(jobClient)
      .innerJoin(job, eq(job.id, jobClient.jobId))
      .where(and(eq(jobClient.clientId, data.clientId), eq(job.organizationId, orgId)))

    if (!refs.length) return []

    return db.query.job.findMany({
      where: inArray(job.id, refs.map((r) => r.jobId)),
      orderBy: [desc(job.updatedAt)],
      with: { tasks: true, clients: { with: { client: true } }, members: { with: { user: true } } },
    })
  })

export const getJob = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator(jobIdSchema)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!
    const j = await db.query.job.findFirst({
      where: and(eq(job.id, data.jobId), eq(job.organizationId, orgId)),
      with: {
        tasks: { orderBy: (t, { asc }) => [asc(t.sortOrder), asc(t.createdAt)] },
        clients: { with: { client: true } },
        members: { with: { user: true } },
        template: true,
      },
    })
    if (!j) throw new Error('Job not found or unauthorized')
    return j
  })

export const createJob = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(createJobSchema)
  .handler(async ({ context, data }) => {
    const { session } = context
    const orgId = session.session.activeOrganizationId!
    await verifyClientOwnership(data.clientId, orgId)

    const tmpl = await db.query.jobTemplate.findFirst({
      where: and(eq(jobTemplate.id, data.templateId), eq(jobTemplate.organizationId, orgId)),
    })
    if (!tmpl) throw new Error('Template not found')

    const initialStage = tmpl.stages[0]?.value ?? 'IN_PROGRESS'
    const defaultTasks = tmpl.defaultTasks

    return db.transaction(async (tx) => {
      const [newJob] = await tx
        .insert(job)
        .values({
          organizationId: orgId,
          title: data.title,
          jobType: tmpl.slug,
          templateId: tmpl.id,
          currentStage: initialStage,
          priority: data.priority,
          status: data.status,
          description: data.description ?? null,
          dueDate: data.dueDate ?? null,
          assignedToId: data.assignedToId ?? null,
          createdById: session.user.id,
          updatedById: session.user.id,
        })
        .returning()

      await tx.insert(jobClient).values({ jobId: newJob.id, clientId: data.clientId })

      if (defaultTasks.length > 0) {
        await tx.insert(jobTask).values(
          defaultTasks.map((title, idx) => ({
            jobId: newJob.id,
            title,
            sortOrder: idx,
            createdById: session.user.id,
            updatedById: session.user.id,
          })),
        )
      }

      // Auto-add creator as a job member
      await tx.insert(jobMember).values({
        jobId: newJob.id,
        userId: session.user.id,
        addedById: session.user.id,
      })

      await logActivity(tx, {
        jobId: newJob.id,
        type: 'JOB_CREATED',
        body: 'Created this job',
        userId: session.user.id,
      })

      const tasks = await tx.query.jobTask.findMany({
        where: eq(jobTask.jobId, newJob.id),
        orderBy: (t, { asc }) => [asc(t.sortOrder)],
      })

      return { ...newJob, tasks }
    })
  })

export const updateJob = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(updateJobSchema)
  .handler(async ({ context, data }) => {
    const { session } = context
    const orgId = session.session.activeOrganizationId!
    const existing = await verifyJobOwnership(data.jobId, orgId)

    const [updated] = await db
      .update(job)
      .set({
        title: data.title,
        priority: data.priority,
        status: data.status,
        description: data.description ?? null,
        dueDate: data.dueDate ?? null,
        assignedToId: data.assignedToId ?? null,
        updatedById: session.user.id,
        updatedAt: new Date(),
      })
      .where(and(eq(job.id, data.jobId), eq(job.organizationId, orgId)))
      .returning()

    if (!updated) throw new Error('Job not found')

    if (data.status !== existing.status) {
      await logActivity(db, {
        jobId: data.jobId,
        type: 'STATUS_CHANGED',
        body: `Changed status from ${existing.status} to ${data.status}`,
        userId: session.user.id,
      })
    }

    return updated
  })

export const updateJobStage = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(updateJobStageSchema)
  .handler(async ({ context, data }) => {
    const { session } = context
    const orgId = session.session.activeOrganizationId!
    const existing = await verifyJobOwnership(data.jobId, orgId)

    const [updated] = await db
      .update(job)
      .set({
        currentStage: data.currentStage,
        updatedById: session.user.id,
        updatedAt: new Date(),
      })
      .where(and(eq(job.id, data.jobId), eq(job.organizationId, orgId)))
      .returning()

    if (!updated) throw new Error('Job not found')

    if (existing.currentStage !== data.currentStage) {
      await logActivity(db, {
        jobId: data.jobId,
        type: 'STAGE_CHANGED',
        body: `Moved from ${existing.currentStage} to ${data.currentStage}`,
        userId: session.user.id,
      })
      await createNotificationsForMembers(data.jobId, session.user.id, {
        type: 'STAGE_CHANGED',
        title: 'Job stage updated',
        body: `"${existing.title}" moved to ${data.currentStage.replace(/_/g, ' ').toLowerCase()}`,
      })
    }

    return updated
  })

export const deleteJob = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(jobIdSchema)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!
    await verifyJobOwnership(data.jobId, orgId)
    await db.delete(job).where(and(eq(job.id, data.jobId), eq(job.organizationId, orgId)))
    return { success: true }
  })

export const toggleJobTask = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(toggleTaskSchema)
  .handler(async ({ context, data }) => {
    const { session } = context
    const orgId = session.session.activeOrganizationId!
    await verifyJobOwnership(data.jobId, orgId)

    const today = new Date().toISOString().split('T')[0]

    const [updated] = await db
      .update(jobTask)
      .set({
        isCompleted: data.isCompleted,
        completedAt: data.isCompleted ? today : null,
        completedById: data.isCompleted ? session.user.id : null,
        updatedById: session.user.id,
        updatedAt: new Date(),
      })
      .where(and(eq(jobTask.id, data.taskId), eq(jobTask.jobId, data.jobId)))
      .returning()

    if (!updated) throw new Error('Task not found')
    return updated
  })

export const addJobTask = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(addTaskSchema)
  .handler(async ({ context, data }) => {
    const { session } = context
    const orgId = session.session.activeOrganizationId!
    await verifyJobOwnership(data.jobId, orgId)

    const [newTask] = await db
      .insert(jobTask)
      .values({
        jobId: data.jobId,
        title: data.title,
        sortOrder: data.sortOrder ?? 999,
        createdById: session.user.id,
        updatedById: session.user.id,
      })
      .returning()

    return newTask
  })

export const deleteJobTask = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(deleteTaskSchema)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!
    await verifyJobOwnership(data.jobId, orgId)
    await db.delete(jobTask).where(and(eq(jobTask.id, data.taskId), eq(jobTask.jobId, data.jobId)))
    return { success: true }
  })

export const addJobClient = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(addJobClientSchema)
  .handler(async ({ context, data }) => {
    const { session } = context
    const orgId = session.session.activeOrganizationId!
    await verifyJobOwnership(data.jobId, orgId)
    const c = await verifyClientOwnership(data.clientId, orgId)
    await db
      .insert(jobClient)
      .values({ jobId: data.jobId, clientId: data.clientId })
      .onConflictDoNothing()

    await logActivity(db, {
      jobId: data.jobId,
      type: 'CLIENT_ADDED',
      body: `Added ${c.firstName} ${c.lastName} as a client`,
      userId: session.user.id,
    })

    return { success: true }
  })

export const removeJobClient = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(removeJobClientSchema)
  .handler(async ({ context, data }) => {
    const { session } = context
    const orgId = session.session.activeOrganizationId!
    await verifyJobOwnership(data.jobId, orgId)

    const existing = await db
      .select({ id: jobClient.id })
      .from(jobClient)
      .where(eq(jobClient.jobId, data.jobId))

    if (existing.length <= 1) {
      throw new Error('Cannot remove the last client from a job')
    }

    const c = await db.query.client.findFirst({ where: eq(client.id, data.clientId) })

    await db
      .delete(jobClient)
      .where(and(eq(jobClient.jobId, data.jobId), eq(jobClient.clientId, data.clientId)))

    if (c) {
      await logActivity(db, {
        jobId: data.jobId,
        type: 'CLIENT_REMOVED',
        body: `Removed ${c.firstName} ${c.lastName} from this job`,
        userId: session.user.id,
      })
    }

    return { success: true }
  })

// ─── Timeline (comments + activity merged) ────────────────────────────────────

export const getJobTimeline = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator(jobIdSchema)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!
    await verifyJobOwnership(data.jobId, orgId)

    const [comments, activities] = await Promise.all([
      db.query.jobComment.findMany({
        where: eq(jobComment.jobId, data.jobId),
        with: { createdBy: true },
        orderBy: [desc(jobComment.createdAt)],
      }),
      db.query.jobActivity.findMany({
        where: eq(jobActivity.jobId, data.jobId),
        with: { createdBy: true },
        orderBy: [desc(jobActivity.createdAt)],
      }),
    ])

    return [
      ...comments.map((c) => ({ ...c, entryType: 'comment' as const })),
      ...activities.map((a) => ({ ...a, entryType: 'activity' as const })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  })

export const addJobComment = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(addJobCommentSchema)
  .handler(async ({ context, data }) => {
    const { session } = context
    const orgId = session.session.activeOrganizationId!
    await verifyJobOwnership(data.jobId, orgId)

    const [comment] = await db
      .insert(jobComment)
      .values({ jobId: data.jobId, body: data.body, createdById: session.user.id })
      .returning()

    await createNotificationsForMembers(data.jobId, session.user.id, {
      type: 'COMMENT_ADDED',
      title: 'New comment',
      body: `${session.user.name} commented: ${data.body.slice(0, 80)}${data.body.length > 80 ? '…' : ''}`,
    })

    return comment
  })

export const deleteJobComment = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(deleteJobCommentSchema)
  .handler(async ({ context, data }) => {
    const { session } = context
    const orgId = session.session.activeOrganizationId!
    await verifyJobOwnership(data.jobId, orgId)

    const existing = await db.query.jobComment.findFirst({
      where: and(eq(jobComment.id, data.commentId), eq(jobComment.jobId, data.jobId)),
    })
    if (!existing) throw new Error('Comment not found')
    if (existing.createdById !== session.user.id) throw new Error('Cannot delete another user\'s comment')

    await db.delete(jobComment).where(eq(jobComment.id, data.commentId))
    return { success: true }
  })

// ─── Job Documents ────────────────────────────────────────────────────────────

export const getJobDocuments = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator(jobIdSchema)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!
    await verifyJobOwnership(data.jobId, orgId)
    return db.query.jobDocument.findMany({
      where: eq(jobDocument.jobId, data.jobId),
      orderBy: [desc(jobDocument.createdAt)],
    })
  })

export const uploadJobDocument = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(uploadJobDocumentSchema)
  .handler(async ({ context, data }) => {
    const { session } = context
    const orgId = session.session.activeOrganizationId!
    await verifyJobOwnership(data.jobId, orgId)

    const base64Data = data.fileData.replace(/^data:[^;]+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    const ext = data.fileName.split('.').pop() ?? 'bin'
    const uniqueName = `${randomUUID()}.${ext}`
    const uploadPath = join(process.cwd(), 'public', 'uploads', uniqueName)
    await writeFile(uploadPath, buffer)

    return db.transaction(async (tx) => {
      const [doc] = await tx
        .insert(jobDocument)
        .values({
          jobId: data.jobId,
          filePath: `/uploads/${uniqueName}`,
          name: data.fileName,
          size: data.size ?? null,
          mimeType: data.mimeType,
          createdById: session.user.id,
        })
        .returning()

      await logActivity(tx, {
        jobId: data.jobId,
        type: 'FILE_UPLOADED',
        body: `Uploaded ${data.fileName}`,
        userId: session.user.id,
      })

      return doc
    })
  })

export const deleteJobDocument = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(deleteJobDocumentSchema)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!
    await verifyJobOwnership(data.jobId, orgId)

    const doc = await db.query.jobDocument.findFirst({
      where: and(eq(jobDocument.id, data.documentId), eq(jobDocument.jobId, data.jobId)),
    })
    if (!doc) throw new Error('Document not found')

    if (doc.filePath) {
      try {
        await unlink(join(process.cwd(), 'public', doc.filePath))
      } catch {
        // ignore missing file
      }
    }

    await db.delete(jobDocument).where(eq(jobDocument.id, data.documentId))
    return { success: true }
  })
