# Service Agreements Design

**Date:** 2026-04-11  
**Status:** Approved

---

## Overview

Track ongoing service agreements (OSAs) for each client, satisfying Australian ASIC regulatory requirements under the Corporations Act 2001. Each client has at most one active agreement. The system tracks the fee, services provided, renewal dates, and consent status — alerting advisors when action is required.

---

## Regulatory Context

Under ASIC rules for ongoing fee arrangements:

- Arrangements lasting more than 12 months require **annual written consent**
- Renewal window: **60 days before** to **150 days after** the anniversary (reference day)
- Consent not obtained within 150 days post-anniversary → arrangement **terminates automatically**
- Records must be retained for **5 years** (criminal penalties for failure)
- Fee amount and services must be disclosed in writing before consent is sought

---

## Data Model

**Table: `serviceAgreement`**

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | `randomUUID()` |
| `clientId` | text FK → client (cascade delete) | |
| `organizationId` | text FK → organization | |
| `startDate` | date | When the arrangement began |
| `nextRenewalDate` | date | Next anniversary/reference day |
| `lastConsentDate` | date nullable | When consent was last recorded |
| `feeAmount` | integer | Stored in cents (e.g. 550000 = $5,500) |
| `feeFrequency` | text enum | `MONTHLY` \| `QUARTERLY` \| `ANNUALLY` |
| `services` | text | Free-text description of services included |
| `notes` | text nullable | Internal advisor notes |
| `createdAt` | timestamp | `defaultNow()` |

**Computed status (never stored):**

| Status | Condition |
|---|---|
| `ACTIVE` | `lastConsentDate` >= last anniversary AND today < `nextRenewalDate` - 60 days |
| `RENEWAL_DUE` | today is within 60 days before `nextRenewalDate` |
| `OVERDUE` | today is past `nextRenewalDate` but within 150 days |
| `LAPSED` | today is more than 150 days past `nextRenewalDate` without consent |

---

## Server Functions

**File:** `src/server/functions/service-agreements.ts`

- `getServiceAgreement({ clientId })` — returns the agreement for a client (with computed status)
- `createServiceAgreement({ clientId, startDate, nextRenewalDate, feeAmount, feeFrequency, services, notes })` 
- `updateServiceAgreement({ id, ...fields })` — update fee, services, dates, notes
- `recordConsent({ id })` — sets `lastConsentDate = today`, advances `nextRenewalDate` by 12 months
- `deleteServiceAgreement({ id })`
- `getUpcomingRenewals()` — returns all agreements where status is `RENEWAL_DUE`, `OVERDUE`, or `LAPSED`, or window opens within 30 days; used by dashboard
- `checkServiceAgreementRenewals()` — notification sweep; fires notifications for window open (60 days before), anniversary day, and 90-day overdue warning; deduped per client per day

**Status computation helper** (shared, used in both list and detail queries):

```ts
function computeStatus(nextRenewalDate: Date, lastConsentDate: Date | null): AgreementStatus {
  const today = new Date()
  const windowOpen = subDays(nextRenewalDate, 60)
  const lapsedAt = addDays(nextRenewalDate, 150)

  if (lastConsentDate && lastConsentDate >= nextRenewalDate) return 'ACTIVE' // consent obtained for this cycle
  if (today >= lapsedAt) return 'LAPSED'
  if (today >= nextRenewalDate) return 'OVERDUE'
  if (today >= windowOpen) return 'RENEWAL_DUE'
  return 'ACTIVE'
}
```

---

## UI

### Client Tab — Service Agreements

New tab added to `src/routes/(app)/_layout/clients/$clientId.tsx` nav: **"Service Agreements"**

Route: `src/routes/(app)/_layout/clients/$clientId/service-agreements/index.tsx`

**Empty state:** "No service agreement on file" + "Add Agreement" button.

**Agreement card** (when exists):

- Status badge: `ACTIVE` (green) / `RENEWAL_DUE` (amber) / `OVERDUE` (orange) / `LAPSED` (red)
- Renewal window dates: "Renewal window: 15 Mar 2025 → 13 Sep 2025"
- Fee: "$5,500 / year" (formatted from cents)
- Last consent date
- Services (text block)
- Notes (if any)
- Actions: **Record Consent** (disabled when `ACTIVE`), **Edit**, **Delete**

**Record Consent** stamps `lastConsentDate = today`, advances `nextRenewalDate` by 12 months, shows success toast.

### Dashboard — Upcoming Renewals

New card on `src/routes/(app)/_layout/dashboard.tsx`.

Lists all agreements where status is `RENEWAL_DUE`, `OVERDUE`, `LAPSED`, or window opens within 30 days. Sorted by urgency (lapsed first, then overdue, then renewal due, then by days remaining). Each row:

- Client name (links to service agreements tab)
- Status badge
- Days until deadline (or "X days overdue")

Empty state: "All agreements up to date."

### Notifications

Three notification types added to `TYPE_ICON` map in `notification-bell.tsx`:
- `AGREEMENT_RENEWAL_DUE` → 📋
- `AGREEMENT_OVERDUE` → ⚠️  
- `AGREEMENT_LAPSED` → 🚨

`checkServiceAgreementRenewals()` called in `_layout.tsx` `beforeLoad` alongside `checkBirthdays()`.

---

## Migration

New file: `drizzle/0007_service_agreements.sql`

```sql
CREATE TABLE service_agreement (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES client(id) ON DELETE CASCADE,
  organization_id TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  next_renewal_date DATE NOT NULL,
  last_consent_date DATE,
  fee_amount INTEGER NOT NULL,
  fee_frequency TEXT NOT NULL,
  services TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX service_agreement_client_idx ON service_agreement(client_id);
CREATE INDEX service_agreement_org_idx ON service_agreement(organization_id);
```

Applied manually via psql per project conventions.

---

## Out of Scope

- Full consent history / audit trail per year (can be added later)
- PDF generation of consent documents
- Email sending of FDS or consent requests
- Multiple concurrent agreements per client
