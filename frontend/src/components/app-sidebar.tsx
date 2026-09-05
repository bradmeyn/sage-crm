import { Link, useLocation } from '@tanstack/react-router'
import { Briefcase, LayoutDashboard, ListTodo, PanelLeft, Settings, Users } from 'lucide-react'
import { useState } from 'react'

// `soon` = slice not built yet in this frontend — rendered like an inactive
// item but inert. Mirrors sage-crm-svelte's app-sidebar.svelte section shape.
const sections = [
  {
    label: 'Work',
    links: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, soon: true },
      { href: '/tasks', label: 'Tasks', icon: ListTodo, soon: true },
      { href: '/jobs', label: 'Pipeline', icon: Briefcase, soon: true },
    ],
  },
  {
    label: 'Clients',
    links: [{ href: '/clients', label: 'Clients', icon: Users, soon: false }],
  },
  {
    label: 'Practice',
    links: [{ href: '/settings', label: 'Settings', icon: Settings, soon: true }],
  },
] as const

export function AppSidebar() {
  const location = useLocation()
  // Collapsed icon rail by default; toggle expands to the full labelled sidebar.
  const [expanded, setExpanded] = useState(false)

  return (
    <aside
      className={`flex shrink-0 flex-col overflow-hidden bg-primary text-primary-foreground transition-[width] duration-200 ${
        expanded ? 'w-60' : 'w-[68px]'
      }`}
    >
      <div className={`flex h-16 items-center ${expanded ? 'justify-between px-5' : 'justify-center'}`}>
        {expanded && (
          <Link to="/clients" className="font-serif text-2xl font-light tracking-tight">
            Sage
          </Link>
        )}
        <button
          onClick={() => setExpanded((e) => !e)}
          aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          title={expanded ? 'Collapse' : 'Expand'}
          className="grid size-9 place-items-center rounded-md text-primary-foreground/70 transition-colors hover:bg-white/10 hover:text-primary-foreground"
        >
          <PanelLeft className="size-5" />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-4 overflow-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.label}>
            {expanded && (
              <p className="mb-2 px-3 text-xs font-medium tracking-wider text-primary-foreground/50 uppercase">
                {section.label}
              </p>
            )}
            <div className="flex flex-col gap-1">
              {section.links.map((link) => {
                const isActive = !link.soon && location.pathname.startsWith(link.href)
                if (link.soon) {
                  return (
                    <span
                      key={link.label}
                      title={expanded ? 'Not built yet' : `${link.label} — not built yet`}
                      className={`flex cursor-not-allowed items-center gap-3 rounded-md py-2 text-sm text-primary-foreground/40 ${
                        expanded ? 'px-3' : 'justify-center'
                      }`}
                    >
                      <link.icon className="size-[18px] shrink-0" />
                      {expanded && link.label}
                    </span>
                  )
                }
                return (
                  <Link
                    key={link.label}
                    to={link.href}
                    title={expanded ? undefined : link.label}
                    className={`flex items-center gap-3 rounded-md py-2 text-sm transition-colors ${
                      expanded ? 'px-3' : 'justify-center'
                    } ${
                      isActive
                        ? 'bg-accent font-semibold text-primary'
                        : 'text-primary-foreground/80 hover:bg-white/10'
                    }`}
                  >
                    <link.icon className="size-[18px] shrink-0" />
                    {expanded && link.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
