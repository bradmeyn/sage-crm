import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '#/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '#/components/ui/form'
import { Alert, AlertDescription } from '#/components/ui/alert'
import { Input } from '#/components/ui/input'
import { Button } from '#/components/ui/button'
import { Mail } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from '@tanstack/react-router'
import { loginSchema, type LoginCredentials } from '#/features/auth/schemas'
import { cn } from '#/lib/utils'
import LoadingSpinner from '#/components/loading-spinner'
import { authClient } from '#/lib/auth-client'
import { getSession } from '#/server/functions/auth'

export const Route = createFileRoute('/(auth)/login')({
  beforeLoad: async () => {
    const session = await getSession()
    if (session?.user) {
      throw redirect({ to: '/clients' })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const navigate = useNavigate()

  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(data: LoginCredentials) {
    try {
      setErrorMessage(null)
      const result = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      })

      if (result.error) {
        setErrorMessage(result.error.message ?? 'Login failed')
        return
      }

      navigate({ to: '/clients' })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Login failed')
    }
  }

  return (
    <div className="min-h-screen">
      <header className="py-6 px-8 border-b bg-background">
        <Link to="/" className="text-xl font-bold">
          Sage
        </Link>
      </header>

      <main className="container max-w-sm py-12 mx-auto">
        <Card>
          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <CardHeader className="space-y-4">
            <CardTitle className="text-2xl">Sign In</CardTitle>
            <CardDescription>Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <FormControl>
                          <Input
                            placeholder="john@example.com"
                            className={cn(
                              'pl-9',
                              form.formState.errors.email &&
                                'border-red-500 focus-visible:ring-red-500',
                            )}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Your password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                    <LoadingSpinner text="Signing in..." />
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="justify-center">
            <div className="text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-primary hover:underline">
                Get started
              </Link>
            </div>
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}
