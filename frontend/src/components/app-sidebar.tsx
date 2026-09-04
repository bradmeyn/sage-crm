import { Link, useMatchRoute } from '@tanstack/react-router'
import { Briefcase, LayoutDashboard, Settings, Users } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

export function AppSidebar() {
  const matchRoute = useMatchRoute()
  const clientsActive = Boolean(matchRoute({ to: '/clients', fuzzy: true }))

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <span className="font-serif text-lg font-medium tracking-tight text-sidebar-foreground">
          Sage CRM
        </span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton disabled className="cursor-not-allowed opacity-50">
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={clientsActive} render={<Link to="/clients" />}>
                  <Users />
                  <span>Clients</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton disabled className="cursor-not-allowed opacity-50">
                  <Briefcase />
                  <span>Jobs</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton disabled className="cursor-not-allowed opacity-50">
                  <Settings />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
