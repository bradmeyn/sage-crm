import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '#/server/middleware'
import { db } from '#/db/index'
import { serviceAgreement, notification } from '#/db/schema'
import { eq, and, gte } from 'drizzle-orm'
import { z } from 'zod'

// ─── Status computation ───────────────────────────────────────────────────────

export type AgreementStatus = 'ACTIVE' | 'RENEWAL_DUE' | 'OVERDUE' | 'LAPSED'

export function computeAgreementStatus(nextRenewalDate: string): AgreementStatus {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const renewal = new Date(nextRenewalDate)
  renewal.setHours(0, 0, 0, 0)

  const windowOpen = new Date(renewal)
  windowOpen.setDate(windowOpen.getDate() - 60)

  const lapsedAt = new Date(renewal)
  lapsedAt.setDate(lapsedAt.getDate() + 150)

  if (today >= lapsedAt) return 'LAPSED'
  if (today >= renewal) return 'OVERDUE'
  if (today >= windowOpen) return 'RENEWAL_DUE'
  return 'ACTIVE'
}

function advanceOneYear(dateStr: string): string {
  const d = new Date(dateStr)
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().split('T')[0]
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const clientIdSchema = z.object({ clientId: z.string() })
const idSchema = z.object({ id: z.string() })

const createSchema = z.object({
  clientId: z.string(),
  startDate: z.string(),
  nextRenewalDate: z.string(),
  feeAmount: z.number().int().positive(),
  feeFrequency: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUALLY']),
  services: z.string().min(1),
  notes: z.string().optional(),
})

const updateSchema = z.object({
  id: z.string(),
  startDate: z.string(),
  nextRenewalDate: z.string(),
  feeAmount: z.number().int().positive(),
  feeFrequency: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUALLY']),
  services: z.string().min(1),
  notes: z.string().optional(),
})

// ─── Server functions ─────────────────────────────────────────────────────────

export const getServiceAgreement = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator(clientIdSchema)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!
    const agreement = await db.query.serviceAgreement.findFirst({
      where: and(
        eq(serviceAgreement.clientId, data.clientId),
        eq(serviceAgreement.organizationId, orgId),
      ),
    })
    if (!agreement) return null
    return { ...agreement, status: computeAgreementStatus(agreement.nextRenewalDate) }
  })

export const createServiceAgreement = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(createSchema)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!
    const [created] = await db
      .insert(serviceAgreement)
      .values({ ...data, organizationId: orgId, notes: data.notes ?? null })
      .returning()
    return { ...created, status: computeAgreementStatus(created.nextRenewalDate) }
  })

export const updateServiceAgreement = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(updateSchema)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!
    const { id, ...fields } = data
    const [updated] = await db
      .update(serviceAgreement)
      .set({ ...fields, notes: fields.notes ?? null })
      .where(and(eq(serviceAgreement.id, id), eq(serviceAgreement.organizationId, orgId)))
      .returning()
    return { ...updated, status: computeAgreementStatus(updated.nextRenewalDate) }
  })

export const recordConsent = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(idSchema)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!
    const existing = await db.query.serviceAgreement.findFirst({
      where: and(eq(serviceAgreement.id, data.id), eq(serviceAgreement.organizationId, orgId)),
    })
    if (!existing) throw new Error('Agreement not found')
    const today = new Date().toISOString().split('T')[0]
    const nextRenewalDate = advanceOneYear(existing.nextRenewalDate)
    const [updated] = await db
      .update(serviceAgreement)
      .set({ lastConsentDate: today, nextRenewalDate })
      .where(eq(serviceAgreement.id, data.id))
      .returning()
    return { ...updated, status: computeAgreementStatus(updated.nextRenewalDate) }
  })

export const deleteServiceAgreement = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(idSchema)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!
    await db
      .delete(serviceAgreement)
      .where(and(eq(serviceAgreement.id, data.id), eq(serviceAgreement.organizationId, orgId)))
    return { success: true }
  })

export const getUpcomingRenewals = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const orgId = context.session.session.activeOrganizationId!
    const agreements = await db.query.serviceAgreement.findMany({
      where: eq(serviceAgreement.organizationId, orgId),
      with: { client: true },
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return agreements
      .map((a) => {
        const status = computeAgreementStatus(a.nextRenewalDate)
        const renewal = new Date(a.nextRenewalDate)
        renewal.setHours(0, 0, 0, 0)
        const daysUntilRenewal = Math.ceil((renewal.getTime() - today.getTime()) / 86400000)
        const deadlineAt = new Date(renewal)
        deadlineAt.setDate(deadlineAt.getDate() + 150)
        const daysUntilLapse = Math.ceil((deadlineAt.getTime() - today.getTime()) / 86400000)
        return { ...a, status, daysUntilRenewal, daysUntilLapse }
      })
      .filter((a) => {
        if (a.status !== 'ACTIVE') return true
        return a.daysUntilRenewal <= 30
      })
      .sort((a, b) => {
        const order = { LAPSED: 0, OVERDUE: 1, RENEWAL_DUE: 2, ACTIVE: 3 }
        if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status]
        return a.daysUntilRenewal - b.daysUntilRenewal
      })
  })

export const checkServiceAgreementRenewals = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const orgId = context.session.session.activeOrganizationId!
    const userId = context.session.user.id

    const agreements = await db.query.serviceAgreement.findMany({
      where: eq(serviceAgreement.organizationId, orgId),
      with: { client: true },
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    for (const a of agreements) {
      const status = computeAgreementStatus(a.nextRenewalDate)
      const renewal = new Date(a.nextRenewalDate)
      renewal.setHours(0, 0, 0, 0)
      const daysUntilRenewal = Math.ceil((renewal.getTime() - today.getTime()) / 86400000)
      const daysOverdue = -daysUntilRenewal

      let notifType: string | null = null
      let title = ''
      let body = ''

      if (status === 'RENEWAL_DUE' && daysUntilRenewal === 60) {
        notifType = 'AGREEMENT_RENEWAL_DUE'
        title = 'Service agreement renewal due'
        body = `The renewal window for ${a.client.firstName} ${a.client.lastName}'s service agreement opens today — renewal due by ${new Date(a.nextRenewalDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}.`
      } else if (status === 'OVERDUE' && daysOverdue === 0) {
        notifType = 'AGREEMENT_OVERDUE'
        title = 'Service agreement anniversary reached'
        body = `${a.client.firstName} ${a.client.lastName}'s service agreement anniversary has passed — consent must be obtained within 150 days to avoid lapse.`
      } else if (status === 'OVERDUE' && daysOverdue === 90) {
        notifType = 'AGREEMENT_LAPSED'
        title = 'Service agreement critically overdue'
        body = `${a.client.firstName} ${a.client.lastName}'s service agreement consent is 90 days overdue — only 60 days remaining before automatic lapse.`
      }

      if (!notifType) continue

      const existing = await db.query.notification.findFirst({
        where: and(
          eq(notification.userId, userId),
          eq(notification.type, notifType),
          eq(notification.clientId, a.clientId),
          gte(notification.createdAt, today),
        ),
      })
      if (existing) continue

      await db.insert(notification).values({
        userId,
        type: notifType,
        title,
        body,
        clientId: a.clientId,
      })
    }

    return { checked: agreements.length }
  })
