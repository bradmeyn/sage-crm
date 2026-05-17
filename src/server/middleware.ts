import { createMiddleware } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { auth } from '#/lib/auth'

export const authMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const session = await auth.api.getSession({
      headers: getRequest().headers,
    })

    if (!session?.user) throw new Error('Unauthorized')
    if (!session.session.activeOrganizationId) throw new Error('No active organization')

    return next({ context: { session } })
  },
)
