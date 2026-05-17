import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '#/server/middleware'
import { db } from '#/db/index'
import { client, job, jobMember, notification } from '#/db/schema'
import { eq, and, gte, desc } from 'drizzle-orm'
import { z } from 'zod'

// ─── Server functions ─────────────────────────────────────────────────────────

export const getNotifications = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const userId = context.session.user.id
    return db.query.notification.findMany({
      where: eq(notification.userId, userId),
      orderBy: [desc(notification.createdAt)],
      limit: 50,
    })
  })

const notifIdSchema = z.object({ id: z.string() })

export const markNotificationRead = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(notifIdSchema)
  .handler(async ({ context, data }) => {
    const userId = context.session.user.id
    await db
      .update(notification)
      .set({ isRead: true })
      .where(and(eq(notification.id, data.id), eq(notification.userId, userId)))
    return { success: true }
  })

export const markAllNotificationsRead = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const userId = context.session.user.id
    await db
      .update(notification)
      .set({ isRead: true })
      .where(and(eq(notification.userId, userId), eq(notification.isRead, false)))
    return { success: true }
  })

// Birthday sweep — finds clients with DOB in the next 7 days and notifies their job members.
// Deduped: won't create duplicate notifications if already sent today.
export const checkBirthdays = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const orgId = context.session.session.activeOrganizationId!

    const clients = await db.query.client.findMany({
      where: eq(client.organizationId, orgId),
    })

    const today = new Date()
    const upcomingClients = clients.filter((c) => {
      if (!c.dateOfBirth) return false
      // dateOfBirth stored as YYYY-MM-DD text
      const [, month, day] = c.dateOfBirth.split('-').map(Number)
      // Check if birthday falls within next 7 days (ignore year)
      for (let offset = 0; offset <= 7; offset++) {
        const check = new Date(today)
        check.setDate(today.getDate() + offset)
        if (check.getMonth() + 1 === month && check.getDate() === day) return true
      }
      return false
    })

    if (!upcomingClients.length) return { checked: 0 }

    const todayStart = new Date(today)
    todayStart.setHours(0, 0, 0, 0)

    for (const c of upcomingClients) {
      // Find active jobs for this client
      const clientJobs = await db.query.job.findMany({
        where: and(eq(job.organizationId, orgId), eq(job.status, 'ACTIVE')),
        with: {
          clients: true,
          members: true,
        },
      })

      const clientActiveJobs = clientJobs.filter((j) =>
        j.clients.some((jc) => jc.clientId === c.id),
      )

      const [, month, day] = (c.dateOfBirth ?? '').split('-').map(Number)
      const daysUntil = (() => {
        for (let offset = 0; offset <= 7; offset++) {
          const check = new Date(today)
          check.setDate(today.getDate() + offset)
          if (check.getMonth() + 1 === month && check.getDate() === day) return offset
        }
        return 0
      })()

      for (const j of clientActiveJobs) {
        for (const m of j.members) {
          // Dedup: skip if notification already created today for this user+client
          const existing = await db.query.notification.findFirst({
            where: and(
              eq(notification.userId, m.userId),
              eq(notification.clientId, c.id),
              eq(notification.type, 'BIRTHDAY_UPCOMING'),
              gte(notification.createdAt, todayStart),
            ),
          })
          if (existing) continue

          await db.insert(notification).values({
            userId: m.userId,
            type: 'BIRTHDAY_UPCOMING',
            title: 'Upcoming birthday',
            body:
              daysUntil === 0
                ? `${c.firstName} ${c.lastName}'s birthday is today`
                : daysUntil === 1
                  ? `${c.firstName} ${c.lastName}'s birthday is tomorrow`
                  : `${c.firstName} ${c.lastName}'s birthday is in ${daysUntil} days`,
            jobId: j.id,
            clientId: c.id,
          })
        }
      }
    }

    return { checked: upcomingClients.length }
  })
