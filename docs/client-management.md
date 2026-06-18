# Client Management

Living reference for the client domain and its financial sub-features.

## What it does

CRUD for clients (the core CRM entity), partner linking, and a tabbed client
record with sub-features: balance sheet (assets/liabilities), cashflow
(income/expenses), goals, insurance, documents, and file notes. Each sub-feature
is an org-scoped, client-scoped data set. Related: [fact-find](./fact-find.md)
captures much of this data; [SOA builder](./soa-builder.md) and
[service agreements](./service-agreements.md) hang off the client.

## File map

- Feature: `src/features/clients/`
  - `hooks.ts` (`clientKeys`), `schemas.ts` — client core
  - Sub-features, each with `hooks.ts` (+ keys), `schemas.ts`, `components/`:
    `balance-sheet/` (`balanceSheetKeys`), `cashflow/` (`cashflowKeys`),
    `goals/` (`goalKeys`), `insurance/` (`insuranceKeys`), `documents/`,
    `file-notes/`, `fact-find/` (see its own doc)
- Server:
  - `clients.ts` — `getClients`, `getClient`, `createClient`, `updateClient`,
    `deleteClient`, `linkPartner`, `unlinkPartner`
  - `balance-sheet.ts` — assets + liabilities CRUD
  - `cashflow.ts` — income + expenses CRUD
  - `goals.ts`, `insurance.ts`, `documents.ts`, `file-notes.ts` — CRUD each
- Routes (all under `(app)/_layout/clients/`):
  - `index.tsx` — client list
  - `$clientId.tsx` — client tab layout (NavTabs + `<Outlet/>`)
  - `$clientId/index.tsx` — overview, then `balance-sheet/`, `cashflow/`,
    `goals/`, `insurance/`, `documents/`, `file-notes/`, `fact-find/`, `jobs/`,
    `service-agreements/`, `soa/`
- Schema: `client`, `clientAsset`, `clientLiability`, `clientIncome`,
  `clientExpense`, `clientGoal`, `clientInsurance`, `clientDocument`, `fileNote`
  (plus fact-find tables documented in [fact-find](./fact-find.md)). All
  org-scoped + client-scoped with audit columns.

## Client entity fields

Identity: title, firstName, **middleName**, lastName, preferredName,
dateOfBirth, **gender**, **maritalStatus**, **residencyStatus** (tax),
taxFileNumber, occupation, employer. Contact: single email + phone, residential
address (street/suburb/state/postcode/country). State is an `AU_STATES`
dropdown; postcode is 4-digit; DOB cannot be future-dated.

Practice/CRM: **status** lifecycle (PROSPECT → ACTIVE → INACTIVE → FORMER —
there is no separate `isActive`; "active client" = `status = 'ACTIVE'`),
**leadSource**, **clientSince** (onboarded date, ≠ createdAt), **isVulnerable** +
**vulnerabilityNote**, primaryAdvisorId, quickNote. Partner link (1:1) via
partnerId + partnerRelationship.

Enum option sets + label helpers live in `src/features/clients/schemas.ts`
(`CLIENT_STATUSES`, `GENDERS`, `MARITAL_STATUSES`, `RESIDENCY_STATUSES`,
`LEAD_SOURCES`, `AU_STATES`); enums are also CHECK-constrained in the DB.

**Editing surfaces:** Quick Add dialog (minimal — name/contact); fact-find
**Personal** section (identity + address, autosave via `updatePersonal`); client
overview **Practice details** card (status/leadSource/clientSince/vulnerable, via
`updateClient`); status badge in the client header.

**Deferred (intentionally not on `client`):** secondary/support adviser;
KYC/ID-verification (its own future table/feature); separate postal address.

## Conventions

- Every sub-feature follows the standard pattern: `<keys>` object in `hooks.ts`,
  `useSuspenseQuery`/`useQuery` reads, mutations invalidate keys, route loader
  pre-fetches via `queryClient.ensureQueryData`.
- Documents upload as base64 → server fn → `public/uploads/` (see CLAUDE.md).

## Status

**Done:** client CRUD, partner linking, all sub-feature CRUD, tabbed record.

**Remaining:** _(update as work lands)._
