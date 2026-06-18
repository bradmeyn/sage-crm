# Feature Docs

Living reference docs for the core features of the app. Each is an **as-built**
map (what it does · file map · data model · server functions · integrations ·
done/remaining) — keep them current as features change.

## Core features

- [Client Management](./client-management.md) — clients + balance sheet, cashflow,
  goals, insurance, documents, file notes
- [Fact Find & Risk Profiler](./fact-find.md) — data capture, risk profiler,
  client portal, PDF export
- [SOA Builder](./soa-builder.md) — Statements of Advice, strategy library,
  Word/PDF export
- [Jobs / Pipeline](./jobs-pipeline.md) — workflow pipeline, templates, board,
  tasks, members, activity
- [Service Agreements](./service-agreements.md) — fee agreements, consent/renewal
  cycle

## Other domains (no living doc yet)

- `auth` (Better-Auth + organizations), `dashboard`, `notifications`,
  `settings` — see code under `src/features/*` and `src/server/functions/*`.

## Design specs (point-in-time, historical)

Under `docs/superpowers/` — written before building; not maintained as living
docs:

- `specs/2026-04-12-fact-find-risk-profiler-design.md`
- `specs/2026-04-11-service-agreements-design.md` (+ `plans/…-service-agreements.md`)
- `specs/2026-04-11-job-members-notifications-design.md`

## Convention

When you add or change a feature, update its doc here in the same turn. New core
feature → add a doc and link it above.
