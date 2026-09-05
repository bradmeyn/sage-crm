import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AppSidebar } from '@/components/app-sidebar'
import { AppTopbar } from '@/components/app-topbar'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  return (
    <div className="flex h-screen bg-primary">
      <AppSidebar />
      <div className="m-4 ml-0 flex flex-1 flex-col overflow-hidden rounded-xl bg-accent px-6 md:px-10">
        {/* One container around the topbar and the page, so search/user line up
            with the content instead of running to the full window width. */}
        <div className="mx-auto flex w-full max-w-[100rem] flex-1 flex-col overflow-hidden">
          <AppTopbar />
          <main className="flex-1 overflow-auto pb-10">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
