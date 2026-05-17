import { useSuspenseQuery } from '@tanstack/react-query'
import { getDashboardStats, getNewClients, getUpcomingBirthdays } from '#/server/functions/dashboard'

export const dashboardKeys = {
  stats: () => ['dashboard', 'stats'] as const,
  newClients: () => ['dashboard', 'newClients'] as const,
  birthdays: () => ['dashboard', 'birthdays'] as const,
}

export function useDashboardStats() {
  return useSuspenseQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: () => getDashboardStats(),
  })
}

export function useNewClients() {
  return useSuspenseQuery({
    queryKey: dashboardKeys.newClients(),
    queryFn: () => getNewClients(),
  })
}

export function useUpcomingBirthdays() {
  return useSuspenseQuery({
    queryKey: dashboardKeys.birthdays(),
    queryFn: () => getUpcomingBirthdays(),
  })
}
