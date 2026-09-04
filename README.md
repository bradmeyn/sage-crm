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

**Backend** — needs a local Postgres (see `backend/appsettings.json` for the
connection string shape) and JWT settings, supplied via `dotnet user-secrets` or
`appsettings.Development.json` (gitignored — never commit real secrets there):

```bash
cd backend
dotnet ef database update
ASPNETCORE_ENVIRONMENT=Development dotnet run --urls http://localhost:5051
```

In `Development`, email confirmation links log to the console instead of sending
a real email, and file uploads write to `backend/uploads/` instead of Azure Blob
Storage — no cloud credentials needed to run this locally.

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
