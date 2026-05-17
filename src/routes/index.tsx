import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { getSession } from '#/server/functions/auth'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const session = await getSession()
    if (session?.user) {
      throw redirect({ to: '/clients' })
    }
  },
  component: LandingPage,
})

function Header() {
  return (
    <header className="">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center font-semibold">
            <Link to="/">Sage</Link>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="grow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-20 text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
              Supercharge Your Customer Relationships
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              The all-in-one CRM solution that helps you manage customers, close deals, and grow
              your business faster.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link to="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
