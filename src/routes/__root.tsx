import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import TanStackQueryProvider from '#/integrations/tanstack-query/root-provider'
import appCss from '#/styles.css?url'
import type { QueryClient } from '@tanstack/react-query'
import { Toaster } from '#/components/ui/sonner'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Sage' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const { queryClient } = Route.useRouteContext()
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <TanStackQueryProvider queryClient={queryClient}>
          {children}
          <Toaster position="top-right" />
        </TanStackQueryProvider>
        <Scripts />
      </body>
    </html>
  )
}

export function DefaultComponent() {
  return <Outlet />
}
