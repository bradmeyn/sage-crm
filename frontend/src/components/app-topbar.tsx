import { Bell, ChevronDown, LogOut, Search, User } from 'lucide-react'
import { useState } from 'react'

// No auth wired up yet on this frontend — placeholder identity until
// login/register pages land. Mirrors sage-crm-svelte's app-topbar.svelte.
const user = { name: 'Demo User', email: 'demo@sagecrm.com' }

export function AppTopbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="flex h-16 items-center justify-between gap-4 px-2">
      {/* Global search (visual placeholder — ⌘K search dialog not built yet) */}
      <div className="relative w-full max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search..."
          className="h-9 w-full rounded-md border border-input bg-card pr-12 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </div>

      <div className="flex items-center gap-1">
        <button
          aria-label="Notifications"
          className="grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted"
        >
          <Bell className="size-[18px]" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-md py-1 pr-2 pl-1 text-sm transition-colors hover:bg-muted"
          >
            <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary">
              <User className="size-4" />
            </span>
            <span className="hidden max-w-[10rem] truncate font-medium sm:inline">{user.name}</span>
            <ChevronDown className="size-4 text-muted-foreground" />
          </button>

          {menuOpen && (
            <>
              {/* click-away backdrop */}
              <button
                aria-label="Close menu"
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 z-20 mt-1 w-56 rounded-md border border-border bg-popover p-1 shadow-md">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
                <div className="my-1 h-px bg-border" />
                <button className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted">
                  <LogOut className="size-4" /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
