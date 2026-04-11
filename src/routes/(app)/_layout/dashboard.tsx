import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getNewClients, getUpcomingBirthdays, getDashboardStats } from '#/server/functions/dashboard'
import { dashboardKeys } from '#/features/dashboard/hooks'
import { Users, Gift, UserPlus, Briefcase, AlertCircle, CheckCircle, FileText } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { cn } from '#/lib/utils'
import type { Client } from '#/db/schema'
import { jobTypeLabel } from '#/features/jobs/schemas'
import { getUpcomingRenewals } from '#/server/functions/service-agreements'
import { agreementKeys, useUpcomingRenewals } from '#/features/service-agreements/hooks'
import type { AgreementStatus } from '#/server/functions/service-agreements'

export const Route = createFileRoute('/(app)/_layout/dashboard')({
  component: DashboardPage,
  loader: async ({ context: { queryClient } }) => {
    await Promise.all([
      queryClient.ensureQueryData({
        queryKey: dashboardKeys.stats(),
        queryFn: () => getDashboardStats(),
      }),
      queryClient.ensureQueryData({
        queryKey: dashboardKeys.newClients(),
        queryFn: () => getNewClients(),
      }),
      queryClient.ensureQueryData({
        queryKey: dashboardKeys.birthdays(),
        queryFn: () => getUpcomingBirthdays(),
      }),
      queryClient.ensureQueryData({
        queryKey: agreementKeys.upcoming(),
        queryFn: () => getUpcomingRenewals(),
      }),
    ])
  },
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAge(dateOfBirth: string): number {
  const today = new Date()
  const [year, month, day] = dateOfBirth.split('-').map(Number)
  const bday = new Date(year, month - 1, day)
  let age = today.getFullYear() - bday.getFullYear()
  const m = today.getMonth() - bday.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < bday.getDate())) age--
  return age
}

function getNextBirthdayDate(dateOfBirth: string): string {
  const today = new Date()
  const [, month, day] = dateOfBirth.split('-').map(Number)
  const thisYear = new Date(today.getFullYear(), month - 1, day)
  const bday = thisYear < today ? new Date(today.getFullYear() + 1, month - 1, day) : thisYear
  return bday.toLocaleDateString('en-AU', { day: 'numeric', month: 'long' })
}

function formatDueDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
  })
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

const accentClasses: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400',
  red: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
  green: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
  gray: 'bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400',
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string
  value: number
  icon: LucideIcon
  accent: keyof typeof accentClasses
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
          <div className={cn('rounded-lg p-2', accentClasses[accent])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Job Row Components ───────────────────────────────────────────────────────

type JobWithClient = {
  id: string
  title: string
  jobType: string
  priority: string
  dueDate: string | null
  clients: { client: { id: string; firstName: string; lastName: string } }[]
}

function OverdueJobRow({ j }: { j: JobWithClient }) {
  return (
    <div className="flex items-center justify-between py-2 gap-3">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{j.title}</div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">
            {jobTypeLabel(j.jobType)}
          </span>
          {j.priority === 'HIGH' && (
            <span className="text-xs bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 px-1.5 py-0.5 rounded">
              High
            </span>
          )}
        </div>
      </div>
      <div className="text-right shrink-0">
        <Link
          to="/clients/$clientId"
          params={{ clientId: j.clients[0]?.client.id ?? '' }}
          className="text-xs text-primary hover:underline block"
        >
          {j.clients.map((jc) => `${jc.client.firstName} ${jc.client.lastName}`).join(' & ')}
        </Link>
        {j.dueDate && (
          <div className="text-xs text-red-600 dark:text-red-400 font-medium">
            {formatDueDate(j.dueDate)}
          </div>
        )}
      </div>
    </div>
  )
}

function UpcomingJobRow({ j }: { j: JobWithClient }) {
  return (
    <div className="flex items-center justify-between py-2 gap-3">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{j.title}</div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">
            {jobTypeLabel(j.jobType)}
          </span>
          {j.priority === 'HIGH' && (
            <span className="text-xs bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 px-1.5 py-0.5 rounded">
              High
            </span>
          )}
        </div>
      </div>
      <div className="text-right shrink-0">
        <Link
          to="/clients/$clientId"
          params={{ clientId: j.clients[0]?.client.id ?? '' }}
          className="text-xs text-primary hover:underline block"
        >
          {j.clients.map((jc) => `${jc.client.firstName} ${jc.client.lastName}`).join(' & ')}
        </Link>
        {j.dueDate && (
          <div className="text-xs text-muted-foreground">{formatDueDate(j.dueDate)}</div>
        )}
      </div>
    </div>
  )
}

// ─── Client Row Components ────────────────────────────────────────────────────

function ClientRow({ client }: { client: Client }) {
  return (
    <Link
      to="/clients/$clientId"
      params={{ clientId: client.id }}
      className="flex items-center justify-between py-2 hover:bg-muted/40 rounded-md px-2 -mx-2 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
          {client.firstName[0]}{client.lastName[0]}
        </div>
        <div>
          <div className="font-medium text-sm">{client.firstName} {client.lastName}</div>
          <div className="text-xs text-muted-foreground">{client.email || '—'}</div>
        </div>
      </div>
      <div className="text-xs text-muted-foreground shrink-0">
        {new Date(client.createdAt).toLocaleDateString('en-AU', {
          day: 'numeric',
          month: 'short',
        })}
      </div>
    </Link>
  )
}

function BirthdayRow({ client }: { client: Client }) {
  const turningAge = client.dateOfBirth ? getAge(client.dateOfBirth) + 1 : null
  const dateStr = client.dateOfBirth ? getNextBirthdayDate(client.dateOfBirth) : '—'

  return (
    <Link
      to="/clients/$clientId"
      params={{ clientId: client.id }}
      className="flex items-center justify-between py-2 hover:bg-muted/40 rounded-md px-2 -mx-2 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
          {client.firstName[0]}{client.lastName[0]}
        </div>
        <div>
          <div className="font-medium text-sm">{client.firstName} {client.lastName}</div>
          <div className="text-xs text-muted-foreground">{client.email || '—'}</div>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-xs font-medium">{dateStr}</div>
        {turningAge && (
          <div className="text-xs text-muted-foreground">Turning {turningAge}</div>
        )}
      </div>
    </Link>
  )
}

// ─── Renewal Row ──────────────────────────────────────────────────────────────

const RENEWAL_STATUS_BADGE: Record<AgreementStatus, { label: string; className: string }> = {
  ACTIVE: { label: 'Window Opens Soon', className: 'bg-blue-100 text-blue-700' },
  RENEWAL_DUE: { label: 'Renewal Due', className: 'bg-amber-100 text-amber-700' },
  OVERDUE: { label: 'Overdue', className: 'bg-orange-100 text-orange-700' },
  LAPSED: { label: 'Lapsed', className: 'bg-red-100 text-red-700' },
}

function RenewalRow({
  agreement,
}: {
  agreement: Awaited<ReturnType<typeof getUpcomingRenewals>>[number]
}) {
  const badge = RENEWAL_STATUS_BADGE[agreement.status]
  const urgency =
    agreement.status === 'LAPSED'
      ? `${Math.abs(agreement.daysUntilLapse)} days overdue`
      : agreement.status === 'OVERDUE'
        ? `${Math.abs(agreement.daysUntilRenewal)} days overdue`
        : agreement.daysUntilRenewal <= 0
          ? 'Today'
          : `${agreement.daysUntilRenewal}d`

  return (
    <Link
      to="/clients/$clientId/service-agreements"
      params={{ clientId: agreement.clientId }}
      className="flex items-center justify-between py-2 hover:bg-muted/40 rounded-md px-2 -mx-2 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
          {agreement.client.firstName[0]}{agreement.client.lastName[0]}
        </div>
        <div>
          <div className="font-medium text-sm">
            {agreement.client.firstName} {agreement.client.lastName}
          </div>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${badge.className}`}>
            {badge.label}
          </span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-xs font-medium">{urgency}</div>
      </div>
    </Link>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: stats } = useSuspenseQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: () => getDashboardStats(),
  })

  const { data: newClients = [] } = useSuspenseQuery({
    queryKey: dashboardKeys.newClients(),
    queryFn: () => getNewClients(),
  })

  const { data: upcomingBirthdays = [] } = useSuspenseQuery({
    queryKey: dashboardKeys.birthdays(),
    queryFn: () => getUpcomingBirthdays(),
  })

  const { data: upcomingRenewals = [] } = useUpcomingRenewals()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-semibold">Dashboard</h1>
      </div>

      {/* Row 1: KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Clients" value={stats.totalActiveClients} icon={Users} accent="blue" />
        <StatCard label="Active Jobs" value={stats.activeJobs} icon={Briefcase} accent="indigo" />
        <StatCard
          label="Overdue Jobs"
          value={stats.overdueJobs}
          icon={AlertCircle}
          accent={stats.overdueJobs > 0 ? 'red' : 'gray'}
        />
        <StatCard
          label="Completed This Month"
          value={stats.completedThisMonth}
          icon={CheckCircle}
          accent="green"
        />
      </div>

      {/* Row 2: Job Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Overdue Jobs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Overdue Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.overdueJobList.length > 0 ? (
              <div className="divide-y">
                {stats.overdueJobList.map((j) => (
                  <OverdueJobRow key={j.id} j={j} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="h-10 w-10 text-green-500 mb-3" />
                <p className="text-sm text-muted-foreground">No overdue jobs</p>
              </div>
            )}
            <div className="mt-3 pt-3 border-t">
              <Link to="/jobs" className="text-sm text-primary hover:underline">
                View all jobs →
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Due Next 14 Days */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Due Next 14 Days</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.upcomingJobList.length > 0 ? (
              <div className="divide-y">
                {stats.upcomingJobList.map((j) => (
                  <UpcomingJobRow key={j.id} j={j} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Briefcase className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Nothing due soon</p>
              </div>
            )}
            <div className="mt-3 pt-3 border-t">
              <Link to="/jobs" className="text-sm text-primary hover:underline">
                View all jobs →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Upcoming Renewals */}
      {upcomingRenewals.length > 0 && (
        <Card>
          <CardHeader className="flex items-center gap-4 pb-3">
            <div className="flex items-center rounded-full bg-primary/10 p-2 w-max text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Upcoming Service Renewals</CardTitle>
              <p className="text-sm text-muted-foreground">
                {upcomingRenewals.length} agreement{upcomingRenewals.length === 1 ? '' : 's'} requiring attention
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {upcomingRenewals.map((a) => (
                <RenewalRow key={a.id} agreement={a} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Row 4: Clients & Birthdays */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* New Clients */}
        <Card>
          <CardHeader className="flex items-center gap-4 pb-3">
            <div className="flex items-center rounded-full bg-primary/10 p-2 w-max text-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>New Clients</CardTitle>
              <p className="text-sm text-muted-foreground">
                {newClients.length > 0
                  ? `${newClients.length} new client${newClients.length === 1 ? '' : 's'} in the last 30 days`
                  : 'No new clients in the last 30 days'}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            {newClients.length > 0 ? (
              <div className="divide-y">
                {newClients.map((c) => (
                  <ClientRow key={c.id} client={c} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No new clients recently</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Birthdays */}
        <Card>
          <CardHeader className="flex items-center gap-4 pb-3">
            <div className="flex items-center rounded-full bg-primary/10 p-2 w-max text-primary">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Upcoming Birthdays</CardTitle>
              <p className="text-sm text-muted-foreground">
                {upcomingBirthdays.length > 0
                  ? `${upcomingBirthdays.length} birthday${upcomingBirthdays.length === 1 ? '' : 's'} in the next 30 days`
                  : 'No birthdays in the next 30 days'}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingBirthdays.length > 0 ? (
              <div className="divide-y">
                {upcomingBirthdays.map((c) => (
                  <BirthdayRow key={c.id} client={c} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Gift className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No upcoming birthdays</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
