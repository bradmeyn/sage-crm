import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { auth } from '#/lib/auth'
import { db } from '#/db/index'
import { member, organization, session } from '#/db/schema'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  businessName: z.string().min(2),
})

export const registerUser = createServerFn({ method: 'POST' })
  .inputValidator(registerSchema)
  .handler(async ({ data }) => {
    // 1. Create user + session via Better-Auth
    const signUpResponse = await auth.api.signUpEmail({
      body: {
        email: data.email,
        password: data.password,
        name: `${data.firstName} ${data.lastName}`,
        firstName: data.firstName,
        lastName: data.lastName,
      },
      headers: getRequest().headers,
    })

    if (!signUpResponse.user) {
      throw new Error('Failed to create user')
    }

    const userId = signUpResponse.user.id

    // 2. Create organization directly via Drizzle (bypasses session requirement)
    const orgId = randomUUID()
    const slug = data.businessName.toLowerCase().replace(/\s+/g, '-')

    await db.insert(organization).values({
      id: orgId,
      name: data.businessName,
      slug,
      createdAt: new Date(),
    })

    // 3. Add user as owner member
    await db.insert(member).values({
      id: randomUUID(),
      organizationId: orgId,
      userId,
      role: 'owner',
      createdAt: new Date(),
    })

    // 4. Set activeOrganizationId on the user's new session directly via Drizzle
    await db
      .update(session)
      .set({ activeOrganizationId: orgId })
      .where(eq(session.userId, userId))

    return { success: true }
  })

export const getSession = createServerFn({ method: 'GET' }).handler(async () => {
  const s = await auth.api.getSession({
    headers: getRequest().headers,
  })
  return s
})

// Ensures the user has an active organization set on their session.
// Called from the protected layout's beforeLoad for returning users.
export const ensureActiveOrganization = createServerFn({ method: 'POST' }).handler(async () => {
  const s = await auth.api.getSession({
    headers: getRequest().headers,
  })
  if (!s?.user) throw new Error('Unauthorized')

  if (s.session.activeOrganizationId) {
    return s
  }

  // Find user's first organization membership
  const membership = await db.query.member.findFirst({
    where: eq(member.userId, s.user.id),
  })

  if (!membership) throw new Error('No organization found for user')

  // Update session directly via Drizzle
  await db
    .update(session)
    .set({ activeOrganizationId: membership.organizationId })
    .where(eq(session.id, s.session.id))

  // Return the updated session
  const updatedSession = await auth.api.getSession({
    headers: getRequest().headers,
  })
  return updatedSession
})
