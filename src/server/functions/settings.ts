import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { authMiddleware } from '#/server/middleware'
import { auth } from '#/lib/auth'
import { db } from '#/db/index'
import { invitation, organization, user } from '#/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member']),
})

const cancelInvitationSchema = z.object({
  invitationId: z.string(),
})

const removeMemberSchema = z.object({
  memberId: z.string(),
})

const updateMemberRoleSchema = z.object({
  memberId: z.string(),
  role: z.enum(['admin', 'member']),
})

export const getOrgDetails = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const orgId = context.session.session.activeOrganizationId!
    const org = await auth.api.getFullOrganization({
      headers: getRequest().headers,
      query: { organizationId: orgId },
    })
    return org
  })

export const inviteMember = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(inviteMemberSchema)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!
    await auth.api.createInvitation({
      headers: getRequest().headers,
      body: {
        organizationId: orgId,
        email: data.email,
        role: data.role,
      },
    })
    return { success: true }
  })

export const cancelInvitation = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(cancelInvitationSchema)
  .handler(async ({ context: _context, data }) => {
    await auth.api.cancelInvitation({
      headers: getRequest().headers,
      body: { invitationId: data.invitationId },
    })
    return { success: true }
  })

export const removeMember = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(removeMemberSchema)
  .handler(async ({ context: _context, data }) => {
    await auth.api.removeMember({
      headers: getRequest().headers,
      body: { memberIdOrEmail: data.memberId },
    })
    return { success: true }
  })

export const updateMemberRole = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(updateMemberRoleSchema)
  .handler(async ({ context: _context, data }) => {
    await auth.api.updateMemberRole({
      headers: getRequest().headers,
      body: { memberId: data.memberId, role: data.role },
    })
    return { success: true }
  })

// Public — no auth required; queries DB directly for invitation + org + inviter name
export const getInvitationDetails = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ invitationId: z.string() }))
  .handler(async ({ data }) => {
    const row = await db.query.invitation.findFirst({
      where: eq(invitation.id, data.invitationId),
    })
    if (!row) return null

    const org = await db.query.organization.findFirst({
      where: eq(organization.id, row.organizationId),
    })

    const inviter = await db.query.user.findFirst({
      where: eq(user.id, row.inviterId),
    })

    return {
      id: row.id,
      email: row.email,
      role: row.role,
      status: row.status,
      expiresAt: row.expiresAt,
      organizationName: org?.name ?? null,
      inviterName: inviter?.name ?? null,
    }
  })
