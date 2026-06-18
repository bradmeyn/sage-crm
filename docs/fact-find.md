# Fact Find & Risk Profiler

Living reference for the fact-find feature. Design spec (point-in-time):
`docs/superpowers/specs/2026-04-12-fact-find-risk-profiler-design.md`.

## What it does

Captures a client's full financial picture across sections (personal, dependants,
assets, liabilities, income, expenses, goals, insurance, estate, beneficiaries,
health) plus a **risk profiler** (questionnaire → computed category, adviser can
confirm/override). An adviser can run the fact find in-app, or send a **client
portal link** for the client to complete and submit, then review and import the
submission. Exports to PDF.

## File map

- Feature: `src/features/clients/fact-find/`
  - `schemas.ts` — section/label helpers, `RISK_CATEGORIES`, `RISK_QUESTIONS`,
    `riskCategoryLabel`
  - `hooks.ts` — `factFindKeys` + query/mutation hooks
  - `use-autosave.ts` — shared autosave hook (also used by SOA)
  - `fact-find-document.tsx` — `@react-pdf/renderer` PDF builder
  - `components/fact-find-shell.tsx` — overview hub (section list + completeness,
    send/review/download actions)
  - `components/` — section editors, send/review dialogs
  - `run/run-fact-find.tsx` — sidebar stepper data-entry flow; `run/` per-section
    forms
- Server:
  - `fact-find.ts` — `getFactFind`, `exportFactFind`, section CRUD
    (dependants, estate, beneficiaries, personal, health, `saveRiskProfile`)
  - `fact-find-requests.ts` — `createFactFindRequest`, `getFactFindRequests`,
    `revokeFactFindRequest`
  - `fact-find-review.ts` — `getFactFindSubmission`, `importFactFindSection`,
    `completeFactFindReview`
  - `fact-find-portal.ts` — **public** (token-auth): `checkFactFindToken`,
    `openFactFind`, `saveFactFind`, `submitFactFind`
- Routes:
  - `(app)/_layout/clients/$clientId/fact-find/index.tsx` — shell/hub
  - `(app)/_layout/fact-find.$clientId.tsx` — run flow (sidebar stepper)
  - `src/routes/fact-find.tsx` — public client portal (no app auth; token-scoped)
- Schema: `client` (base personal fields), `clientDependant`, `clientEstate`,
  `clientBeneficiary`, `clientRiskProfile`, `factFindRequest`. Financial sections
  reuse the balance-sheet/cashflow/goals/insurance tables (see
  [client-management](./client-management.md)).

## Data model notes

- **clientRiskProfile**: `answers` (JSON {questionId: weight}), `category`
  (computed: CONSERVATIVE | MODERATELY_CONSERVATIVE | BALANCED | GROWTH |
  HIGH_GROWTH), `confirmedCategory` (adviser override), `notes`.
- **factFindRequest**: token-scoped portal request with a status lifecycle
  (PENDING → SUBMITTED → IMPORTED, plus EXPIRED/REVOKED).

## Integrations

Autosave (`use-autosave.ts`) and risk category labels are reused by the
[SOA builder](./soa-builder.md). PDF export pattern (`exportFactFind`) is the
template the SOA export mirrors.

## Status

**Done:** all sections, risk profiler with override, in-app run flow, client
portal (send/fill/submit), adviser review + import, PDF export.

**Remaining:** _(update as work lands)._
