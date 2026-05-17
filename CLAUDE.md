# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server at localhost:3000
npm run build        # Production build
npm run test         # Run Vitest tests
npm run db:generate  # Generate Drizzle migration files
npm run db:push      # Push schema directly to DB (no migration files)
npm run db:studio    # Open Drizzle Studio GUI
```

**Applying migrations manually** (preferred over `db:push` for tracked changes):
```bash
psql "postgresql://bradmeyn:Charlieisagoodboy@localhost:5433/crm_ts" -f drizzle/000X_name.sql
# Then update drizzle/meta/_journal.json and insert into drizzle.__drizzle_migrations
```

**Environment**: `.env.local` — requires `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `RESEND_API_KEY`

## Architecture Overview

### Stack
- **TanStack Start v1.163+** — SSR + server functions (replaces separate API layer)
- **TanStack Router** — file-based routing with `routeTree.gen.ts` auto-generated
- **TanStack Query** — client-side data fetching/caching, `QueryClient` passed via router context
- **Better-Auth** — authentication with organization plugin; session stored in cookies
- **Drizzle ORM** — PostgreSQL via `node-postgres`; schema in `src/db/schema.ts`
- **Shadcn UI** — components in `src/components/ui/` (add with `npx shadcn@latest add <component>`)

### Path Aliases
Both `#/*` and `@/*` resolve to `./src/*` (configured in `package.json` `imports` and `tsconfig.json`).

### Server Functions Pattern
All backend logic lives in `src/server/functions/*.ts` as `createServerFn` calls — no separate Express/API routes. Every protected function uses `authMiddleware`:

```ts
export const myFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])          // injects context.session
  .inputValidator(zodSchema)            // optional; NOT .validator()
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!
    // ...drizzle queries
  })
```

Called from the client as `myFn({ data: { ... } })`.

**Critical API notes:**
- Use `.inputValidator(zodSchema)` — not `.validator()`
- Use `getRequest()` from `@tanstack/react-start/server` — not `getWebRequest()`

### Data Flow: Route → Query → Server Function
1. **Route loader** calls `queryClient.ensureQueryData({ queryKey, queryFn: serverFn })` to preload
2. **Feature hook** (e.g. `useJobs()`) calls `useSuspenseQuery` with the same key — data arrives instantly from cache
3. **Mutations** call server functions directly, then `queryClient.invalidateQueries`

Hook files follow the pattern: `src/features/<domain>/hooks.ts` exports `<domain>Keys` object + query/mutation hooks.

### Authentication & Organizations
- `_layout.tsx` `beforeLoad` is the auth gate — redirects to `/login` if no session; calls `ensureActiveOrganization()` if `activeOrganizationId` is null (happens after fresh login)
- `authMiddleware` throws if session or `activeOrganizationId` is missing — every server function is org-scoped
- All CRM data is org-scoped: every query filters by `organizationId`
- Session from server: `auth.api.getSession({ headers: getRequest().headers })`
- Session from client: `authClient.signIn.email()` / `authClient.signOut()`

### Route Structure
```
src/routes/
  __root.tsx                    # HTML shell, TanStack Query provider, Toaster
  index.tsx                     # Redirect to /dashboard or /login
  (auth)/login.tsx, register.tsx
  (app)/_layout.tsx             # Auth guard + sidebar layout (wraps all app routes)
  (app)/_layout/
    dashboard.tsx
    clients/
      index.tsx                 # Client list
      $clientId.tsx             # Client tab layout (nested tabs use _layout pattern)
      $clientId/                # Nested sub-routes under client
        index.tsx, file-notes/, documents/, balance-sheet/, cashflow/, goals/, insurance/, jobs/
    jobs/
      index.tsx                 # Jobs list + board view
      $jobId.tsx                # Job detail
    settings.tsx                # Team, Invitations, Templates tabs
  accept-invitation.tsx         # Public invite acceptance
  api/auth/$.ts                 # Better-Auth HTTP handler (must exist)
```

**Layout rule**: `_layout.tsx` pathless layout requires its children in a `_layout/` subdirectory.

### Feature Structure
```
src/features/<domain>/
  schemas.ts          # Zod schemas, constants (e.g. JOB_TYPES, JOB_STAGES), label helpers
  hooks.ts            # TanStack Query hooks + cache key objects
  components/         # React components for this domain
  <sub-feature>/      # Nested features follow same pattern (hooks.ts, schemas.ts, components/)
```

### Database Schema (`src/db/schema.ts`)
Key tables and relationships:
- `organization` → org-level scope for all CRM data
- `user`, `session`, `account`, `verification`, `member`, `invitation` — Better-Auth managed
- `client` → `fileNote`, `clientDocument`, `clientAsset`, `clientLiability`, `clientIncome`, `clientExpense`, `clientGoal`, `clientInsurance`
- `job` → `jobTask`, `jobClient` (join), `jobComment`, `jobActivity`, `jobDocument`; has `templateId → jobTemplate`
- `jobTemplate` — org-level pipeline templates; system templates (seeded) are locked, custom ones are editable

**Job templates lazy seeding**: `getTemplates()` seeds all 9 system templates on first call per org (from `JOB_STAGES`/`DEFAULT_JOB_TASKS` constants in `src/features/jobs/schemas.ts`), then backfills existing jobs with `templateId`.

### Migrations
Migration files in `drizzle/` are applied manually (see commands above). After applying SQL:
1. Add entry to `drizzle/meta/_journal.json`
2. Insert into `drizzle.__drizzle_migrations` table

### Shadcn Components
Available in `src/components/ui/`: alert, badge, breadcrumb, button, card, checkbox, command, dialog, dropdown-menu, form, input, label, progress, select, sonner, table, tabs, textarea.

Add new ones with `npx shadcn@latest add <name>` — files will appear at the literal `#/components/ui/` path and must be moved manually to `src/components/ui/`.

### File Uploads
Files uploaded as base64 strings via server functions, saved to `public/uploads/`. Pattern: client reads File → base64 → passes to server fn → writes to disk with `randomUUID` filename.
