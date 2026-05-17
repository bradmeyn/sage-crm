import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '#/server/middleware'
import { db } from '#/db/index'
import { job, jobMember, member, notification } from '#/db/schema'
import { eq, and, not, inArray } from 'drizzle-orm'
import { z } from 'zod'

const jobIdSchema = z.object({ jobId: z.string() })
const memberSchema = z.object({ jobId: z.string(), userId: z.string() })

async function verifyJobOwnership(jobId: string, orgId: string) {
  const j = await db.query.job.findFirst({
    where: and(eq(job.id, jobId), eq(job.organizationId, orgId)),
  })
  if (!j) throw new Error('Job not found or unauthorized')
  return j
}

export const getJobMembers = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator(jobIdSchema)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!
    await verifyJobOwnership(data.jobId, orgId)
    return db.query.jobMember.findMany({
      where: eq(jobMember.jobId, data.jobId),
      with: { user: true },
    })
  })

export const getAvailableMembers = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator(jobIdSchema)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!
    await verifyJobOwnership(data.jobId, orgId)

    // All org members
    const orgMembers = await db.query.member.findMany({
      where: eq(member.organizationId, orgId),
      with: { user: true },
    })

    // Already assigned
    const existing = await db.query.jobMember.findMany({
      where: eq(jobMember.jobId, data.jobId),
    })
    const assignedUserIds = new Set(existing.map((m) => m.userId))

    return orgMembers
      .filter((m) => !assignedUserIds.has(m.userId))
      .map((m) => ({ memberId: m.id, userId: m.userId, role: m.role, user: m.user }))
  })

export const addJobMember = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(memberSchema)
  .handler(async ({ context, data }) => {
    const { session } = context
    const orgId = session.session.activeOrganizationId!
    const j = await verifyJobOwnership(data.jobId, orgId)

    await db
      .insert(jobMember)
      .values({
        jobId: data.jobId,
        userId: data.userId,
        addedById: session.user.id,
      })
      .onConflictDoNothing()

    // Notify the newly added user (if not adding themselves)
    if (data.userId !== session.user.id) {
      await db.insert(notification).values({
        userId: data.userId,
        type: 'JOB_MEMBER_ADDED',
        title: 'Added to a job',
        body: `You were added to "${j.title}"`,
        jobId: data.jobId,
      })
    }

    return { success: true }
  })

export const removeJobMember = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(memberSchema)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!
    await verifyJobOwnership(data.jobId, orgId)
    await db
      .delete(jobMember)
      .where(and(eq(jobMember.jobId, data.jobId), eq(jobMember.userId, data.userId)))
    return { success: true }
  })
