import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider, isServer } from '@tanstack/react-query'

function makeQueryClient() {
  return new QueryClient()
}

let browserQueryClient: QueryClient | undefined

function getQueryClient(): QueryClient {
  if (isServer) return makeQueryClient()
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}

export function getContext() {
  return { queryClient: getQueryClient() }
}

export default function TanStackQueryProvider({
  queryClient,
  children,
}: {
  queryClient: QueryClient
  children: ReactNode
}) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
