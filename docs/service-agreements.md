# Service Agreements

Living reference for the service-agreements feature. Design spec + plan
(point-in-time): `docs/superpowers/specs/2026-04-11-service-agreements-design.md`,
`docs/superpowers/plans/2026-04-11-service-agreements.md`.

## What it does

Tracks the ongoing fee agreement for a client: start date, fee amount +
frequency, the services provided, and the **annual consent / renewal** cycle
(recording client consent advances the next renewal date). Surfaces
**upcoming renewals** so advisers can action them before they lapse. One
agreement per client per org.

## File map

- Feature: `src/features/service-agreements/`
  - `hooks.ts` — `agreementKeys` + `useServiceAgreement`, `useUpcomingRenewals`,
    `useCreateServiceAgreement`, `useUpdateServiceAgreement`, `useRecordConsent`,
    `useDeleteServiceAgreement`
- Server: `service-agreements.ts` — `getServiceAgreement`,
  `createServiceAgreement`, `updateServiceAgreement`, `recordConsent`,
  `deleteServiceAgreement`, `getUpcomingRenewals`, `checkServiceAgreementRenewals`
- Routes: `(app)/_layout/clients/$clientId/service-agreements/index.tsx`
- Schema: `serviceAgreement` — `clientId`, `organizationId`, `startDate`,
  `nextRenewalDate`, `lastConsentDate`, `feeAmount` (int), `feeFrequency`
  (MONTHLY | QUARTERLY | ANNUALLY, CHECK-constrained), `services`, `notes`.
  Unique on `(clientId, organizationId)`.

## Data model notes

- Fees stored as integer (`feeAmount`); frequency enforced by a DB `check`.
- `recordConsent` stamps `lastConsentDate` and rolls `nextRenewalDate` forward.
- `getUpcomingRenewals` / `checkServiceAgreementRenewals` drive renewal surfacing.

## Status

**Done:** agreement CRUD, consent recording with renewal roll-forward, upcoming
renewals.

**Remaining:** _(update as work lands)._
