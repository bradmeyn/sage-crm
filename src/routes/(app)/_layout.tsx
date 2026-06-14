import {
  Outlet,
  createFileRoute,
  Link,
  redirect,
} from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  User,
  Settings,
  Briefcase,
  ListTodo,
  LogOut,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import SearchDialog from "@/components/global-search-dialog";
import { authClient } from "@/lib/auth-client";
import { getSession, ensureActiveOrganization } from "@/server/functions/auth";
import { checkBirthdays } from "@/server/functions/notifications";
import { checkServiceAgreementRenewals } from "@/server/functions/service-agreements";
import NotificationBell from "@/features/notifications/components/notification-bell";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/_layout")({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session?.user) {
      throw redirect({ to: "/login" });
    }
    // Ensure the session has an active organization set
    if (!session.session.activeOrganizationId) {
      await ensureActiveOrganization();
    }
    // Fire birthday sweep (no-op if already run today)
    checkBirthdays().catch(() => {});
    checkServiceAgreementRenewals().catch(() => {});
    return { session };
  },
  component: ProtectedLayout,
});

const navSections = [
  {
    label: "Work",
    links: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/tasks", label: "Tasks", icon: ListTodo },
      { to: "/jobs", label: "Pipeline", icon: Briefcase },
    ],
  },
  {
    label: "Clients",
    links: [{ to: "/clients", label: "Clients", icon: Users }],
  },
  {
    label: "Practice",
    links: [{ to: "/settings", label: "Settings", icon: Settings }],
  },
] as const;

function ProtectedLayout() {
  const { session } = Route.useRouteContext();
  const navigate = useNavigate();
  const user = (session as { user?: { name?: string; email?: string } }).user;
  const userName = user?.name || "Account";
  const userEmail = user?.email ?? "";

  const handleLogout = async () => {
    await authClient.signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="flex h-screen gap-4 bg-primary">
      {/* Sidebar */}
      <aside className="w-60 flex flex-col overflow-hidden shadow-sm bg-primary">
        {/* TODO: replace brand with an org switcher once multi-org listing is wired up */}
        <div className="h-16 px-4 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-lg font-light text-white font-serif">
            <span>Sage</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-auto py-4 px-2 flex flex-col gap-6">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="text-xs font-medium uppercase tracking-wide text-white/60 px-3 mb-2">
                {section.label}
              </p>
              <div className="flex flex-col gap-1">
                {section.links.map((link) => (
                  <SidebarLink
                    key={link.to}
                    to={link.to}
                    icon={link.icon}
                    label={link.label}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-accent rounded-xl overflow-hidden m-4 px-10">
        <header className="h-16 px-6 flex items-center justify-end gap-2">
          <SearchDialog />
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="gap-2 pl-2 pr-1 text-muted-foreground">
                <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary">
                  <User size={16} />
                </span>
                <span className="hidden sm:inline text-sm font-medium text-foreground max-w-[10rem] truncate">
                  {userName}
                </span>
                <ChevronDown size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col">
                <span className="text-sm font-medium">{userName}</span>
                {userEmail && (
                  <span className="text-xs font-normal text-muted-foreground truncate">
                    {userEmail}
                  </span>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <Settings size={16} />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogout}>
                <LogOut size={16} />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 overflow-auto max-w-[100rem] mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarLink({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 py-2 px-3 rounded-md transition-colors"
      activeProps={{ className: "bg-muted border text-primary font-semibold" }}
      inactiveProps={{ className: "text-muted" }}>
      <Icon />
      <span className="text-sm">{label}</span>
    </Link>
  );
}
