# SOA Builder — Statement of Advice

Living reference for the SOA feature.

## What it does

Advisers build a per-client Statement of Advice: set scope/intro/title, pull
recommendations from an org-level strategy library (or blank), edit
wording/benefits/warnings, attach type-specific structured fields, link
recommendations to client goals, reorder, issue (DRAFT→ISSUED), and export to
Word (.docx, editable for manual alterations) and PDF (final issued copy).

## File map

- Feature: `src/features/soa/`
  - `schemas.ts` — categories, types, structured-field options, label helpers,
    `SYSTEM_STRATEGIES` (12 seeded)
  - `export-data.ts` — `SoaExportData` type + `recommendationDataLines()`
    (structured-field formatting shared by both exporters)
  - `hooks.ts` — `soaKeys` + query/mutation hooks
  - `components/soa-builder.tsx` — main editor (sidebar rail + sections)
  - `components/recommendation-card.tsx`, `strategy-picker-dialog.tsx`,
    `dot-point-list.tsx`, `typed-fields.tsx`
  - `soa-document.tsx` — `@react-pdf/renderer` document builder
  - `soa-docx.ts` — `docx` (Word) document builder
- Server: `src/server/functions/soa.ts` (incl. `exportSoa`)
- Routes:
  - `clients/$clientId/soa/index.tsx` — list/manage
  - `soa.$soaId.tsx` — builder detail
  - "Advice" tab in `clients/$clientId.tsx`
- Schema: `src/db/schema.ts` → `strategyTemplate`, `soa`, `soaRecommendation`

## Data model

- **strategyTemplate** (org-level, system-seeded + locked or custom): name,
  category, type, wording, benefits[], warnings[], isSystem, sortOrder.
- **soa**: clientId, title, status `DRAFT|ISSUED`, scope, intro,
  createdById/updatedById, issuedAt.
- **soaRecommendation**: soaId, templateId (nullable), category, type, title,
  wording, benefits[], warnings[], data (type-specific JSON), goalIds[],
  sortOrder.

No migration was needed to finish the feature — `intro`, `status`, and
`issuedAt` already existed on `soa`.

## Server functions (createServerFn + authMiddleware, org-scoped)

`getStrategyTemplates` (lazy-seeds) · `getSoas` · `createSoa` · `getSoa` ·
`updateSoa` (title/scope/intro/status→issuedAt) · `deleteSoa` ·
`addRecommendation` · `updateRecommendation` · `deleteRecommendation` ·
`reorderRecommendations` · `exportSoa` (`{ soaId, format: pdf|docx }` →
`{ filename, base64 }`).

## Strategy library — 12 seeded

Categories: Superannuation, Contributions, Insurance, Investment, Retirement,
Cashflow, Debt, Estate, Other. Types (drive structured fields): GENERIC,
INSURANCE, SUPER_CONTRIBUTION, INVESTMENT_SWITCH. Custom org strategies can be
added alongside the locked system ones.

## Integrations

Client context (name, risk profile, goals) is pulled from the fact find
(`src/features/clients/fact-find`) via `useFactFind` in the UI, and queried
directly server-side in `exportSoa`. Autosave reuses fact-find's `useAutosave`.
PDF export mirrors `exportFactFind`; the download flow mirrors
`fact-find-shell`; the sidebar layout mirrors `run-fact-find`.

## Export

`exportSoa` assembles a `SoaExportData` (SOA + recommendations + client name +
risk + goal names), then dynamic-imports the renderer for the requested format
(`@react-pdf/renderer` for PDF, `docx` Packer for Word) so neither lands in the
client bundle. The builder's Export menu downloads the returned base64 as a
Blob. Word is the editable copy for manual alterations; PDF is the final copy.

## Status

**Done:** SOA CRUD, builder (title/scope/intro, sidebar sections, autosave),
strategy picker, recommendation editing/reorder/delete, DRAFT/ISSUED controls,
Word + PDF export.

**Remaining:** distribution (email/client-facing); custom strategy management UI.
