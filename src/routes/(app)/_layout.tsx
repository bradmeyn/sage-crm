import { Outlet, createFileRoute, Link, redirect } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { LayoutDashboard, Users, User, Settings, Briefcase } from 'lucide-react'
import SearchDialog from '#/components/global-search-dialog'
import { authClient } from '#/lib/auth-client'
import { getSession, ensureActiveOrganization } from '#/server/functions/auth'
import { checkBirthdays } from '#/server/functions/notifications'
import { checkServiceAgreementRenewals } from '#/server/functions/service-agreements'
import NotificationBell from '#/features/notifications/components/notification-bell'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/(app)/_layout')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session?.user) {
      throw redirect({ to: '/login' })
    }
    // Ensure the session has an active organization set
    if (!session.session.activeOrganizationId) {
      await ensureActiveOrganization()
    }
    // Fire birthday sweep (no-op if already run today)
    checkBirthdays().catch(() => {})
    checkServiceAgreementRenewals().catch(() => {})
    return { session }
  },
  component: ProtectedLayout,
})

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const

export default function ProtectedLayout() {
  const { session } = Route.useRouteContext()
  const navigate = useNavigate()
  const orgName = (session as { session?: { activeOrganizationId?: string } })?.session
    ?.activeOrganizationId
    ? 'CRM'
    : 'CRM'

  const handleLogout = async () => {
    await authClient.signOut()
    navigate({ to: '/login' })
  }

  return (
    <div className="flex h-screen gap-4 bg-primary">
      {/* Sidebar */}
      <aside className="w-60 flex flex-col overflow-hidden shadow-sm bg-primary">
        <div className="h-16 px-4 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-lg font-light text-white font-serif"
          >
            <span>{orgName}</span>
          </Link>
        </div>

        <div className="flex-1 overflow-auto py-4 px-2">
          <div className="mb-6">
            <p className="text-xs font-medium text-white px-3 mb-3">Menu</p>
            <nav className="flex flex-col gap-1">
              {links.map((link) => (
                <SidebarLink
                  key={link.to}
                  to={link.to}
                  icon={link.icon}
                  label={link.label}
                />
              ))}
            </nav>
          </div>
        </div>

        <div className="p-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-white w-full justify-start"
            onClick={handleLogout}
          >
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-accent rounded-xl overflow-hidden m-4 px-10">
        <header className="h-16 px-6 flex items-center justify-end gap-2">
          <SearchDialog />
          <NotificationBell />
          <Button variant="ghost" size="icon" className="text-muted-foreground" asChild>
            <Link to="/settings">
              <Settings size={18} />
            </Link>
          </Button>
          <div className="p-2 rounded-full bg-gray-100 overflow-hidden">
            <User size={18} className="text-muted-foreground" />
          </div>
        </header>

        <main className="flex-1 overflow-auto max-w-[100rem] mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function SidebarLink({
  to,
  icon: Icon,
  label,
}: {
  to: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 py-2 px-3 rounded-md transition-colors"
      activeProps={{ className: 'bg-muted border text-primary font-semibold' }}
      inactiveProps={{ className: 'text-muted' }}
    >
      <Icon />
      <span className="text-sm">{label}</span>
    </Link>
  )
}
