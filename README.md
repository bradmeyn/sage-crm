# Sage CRM

A small CRM (client management) build — .NET backend, React frontend. Built to
demonstrate a full-stack slice: auth, multi-tenancy, CRUD, file upload.

## Stack

- **Backend** (`backend/`) — ASP.NET Core Web API (.NET 9), EF Core + PostgreSQL,
  JWT auth (register/login/refresh/email confirmation) via ASP.NET Identity,
  multi-tenant via a `Business` entity. Started from [crm-api](https://github.com/bradmeyn/crm-api)
  as a baseline, then adapted to pair with this frontend — see `backend/`'s own
  history for the specific fixes (DTO mapping, dev-only email/file-storage
  providers so it runs with no cloud credentials, etc).
- **Frontend** (`frontend/`) — React 19 + Vite, TanStack Router (file-based) +
  TanStack Query, shadcn/ui. Theme ported from a sibling SvelteKit project so the
  two look like the same product.

## Running locally

**Backend** — no secrets are committed (see `.gitignore`), so a fresh clone needs
its own Postgres + JWT config supplied via `dotnet user-secrets`:

```bash
cd backend

# 1. A local Postgres — either Docker...
docker run -d --name sage-crm-db -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=crm_dev postgres:17
# ...or `createdb crm_dev` against a local install. Either way, match the
# connection string below to whatever host/port/db/user you end up with.

# 2. Secrets (dotnet user-secrets, not appsettings — never commit real values)
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" \
  "Host=localhost;Port=5432;Database=crm_dev;Username=postgres;Password=postgres"
dotnet user-secrets set "JwtSettings:Secret" "change-me-to-any-string-32-chars-or-longer"
dotnet user-secrets set "JwtSettings:Issuer" "sage-crm-api"
dotnet user-secrets set "JwtSettings:Audience" "sage-crm-frontend"

# 3. Migrate + run
dotnet ef database update
ASPNETCORE_ENVIRONMENT=Development dotnet run --urls http://localhost:5051
```

In `Development`, email confirmation links log to the console instead of sending
a real email, and file uploads write to `backend/uploads/` instead of Azure Blob
Storage — no cloud credentials needed to run this locally. After registering via
the API, grab the confirmation link from the console output to activate the
account (there's no email inbox in dev).

**Frontend**:

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

## Status

- Frontend: routing/theme/layout scaffolded, clients list + detail tabs
  (Overview, Personal Details, Financial Details, File Notes, Documents)
  currently on placeholder data.
- Backend: auth + client CRUD working end-to-end. Financial/personal-detail
  entities (assets, liabilities, income, goals, insurance) not yet added.
- Not yet wired: frontend → real API calls (still on mock data), login/register
  pages, file upload against the API.
