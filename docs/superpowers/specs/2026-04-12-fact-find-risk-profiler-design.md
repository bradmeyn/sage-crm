# Fact Find & Risk Profiler — Design Spec

## Goal

Allow advisers to send clients a configurable, multi-section fact find form and/or risk profiler via a magic link. Clients fill it out at their own pace (wizard UI, auto-save). Advisers review submissions in the CRM with field-level approval, smart diff warnings, and an "apply all" shortcut. The risk profiler auto-calculates a risk category which the adviser can override.

## Architecture

- **Public form**: `/fact-find/$token` — a public TanStack Router route (outside the auth gate). No login required. Token in the URL identifies the submission.
- **Storage**: Answers stored as individual `factFindAnswer` rows (one per field) so field-level approval maps directly to DB rows.
- **Risk profiler**: Separate table (`riskProfile`) with a different lifecycle — answers stored as JSONB, score computed server-side, category derived from score.
- **Questions**: Seeded per org on first use (same pattern as job templates). Editable in Settings.

## Tech Stack

TanStack Start v1, Drizzle ORM, PostgreSQL, TanStack Query, Shadcn UI, react-hook-form + zod, Resend (email), Better-Auth (org context for adviser-side).

---

## Data Model

### New tables

#### `factFind`
The envelope for each send.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| orgId | uuid FK | |
| clientId | uuid FK → client | |
| token | uuid UNIQUE | URL token |
| sectionsIncluded | text[] | e.g. `['personal','employment','risk']` |
| status | text | `sent` \| `in_progress` \| `submitted` \| `approved` \| `expired` |
| expiresAt | timestamp | default now + 30 days |
| submittedAt | timestamp | nullable |
| createdById | uuid FK → user | adviser who sent it |
| createdAt | timestamp | |
| updatedAt | timestamp | |

#### `factFindAnswer`
One row per field per submission.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| factFindId | uuid FK → factFind | |
| sectionKey | text | `personal` \| `employment` \| `dependants` \| `assets` \| `liabilities` \| `insurance` \| `estate_planning` \| `super` |
| fieldKey | text | e.g. `firstName`, `employerName`. For repeating-item sections, includes an index: `dependant_0_name`, `dependant_1_dob`, `asset_0_value` |
| rawValue | text | nullable — null means not yet answered |
| approvalStatus | text | `pending` \| `approved` \| `skipped` |
| approvedAt | timestamp | nullable |
| approvedById | uuid FK → user | nullable |

Sections with multiple items (dependants, assets, liabilities, insurance) use indexed field keys: `{section}_{index}_{field}`. The public form tracks the current item count in local state and writes indexed keys on save. The review UI groups rows by index to display each item as a unit.

#### `riskProfile`
One per client, updated on each risk profiler submission.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| clientId | uuid FK → client | UNIQUE |
| orgId | uuid FK | |
| factFindId | uuid FK → factFind | nullable — which submission produced this |
| answers | jsonb | `{ q1: 'option_b', q2: 'option_a', ... }` |
| score | integer | 0–100, computed server-side |
| category | text | `conservative` \| `moderately_conservative` \| `balanced` \| `moderately_aggressive` \| `aggressive` |
| adviserOverrideCategory | text | nullable |
| adviserOverrideNote | text | nullable |
| assessedAt | timestamp | |

#### `riskProfilerQuestion`
Seeded per org, editable.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| orgId | uuid FK | |
| order | integer | display order |
| questionText | text | |
| options | jsonb | `[{ text: string, score: number }]` |
| isActive | boolean | default true |

#### `clientDependant`
| id, clientId, orgId, name, relationship, dateOfBirth, notes, createdAt |

#### `clientEmployment`
| id, clientId, orgId, employerName, occupation, employmentType (PAYG/self-employed/contract/retired/other), annualIncome, startDate, notes, createdAt |

#### `clientEstatePlanning`
| id, clientId, orgId, hasWill, willDate, hasPOA, poaName, beneficiaries (text), notes, createdAt |

#### `clientSuper`
| id, clientId, orgId, fundName, memberNumber, balance, contributionRate, notes, createdAt |

### New columns on `client`
- `dateOfBirth` date
- `address` text
- `maritalStatus` text (`single` \| `married` \| `defacto` \| `separated` \| `divorced` \| `widowed`)

### Field → table mapping on approval

| Section | Fields | Apply action |
|---------|--------|-------------|
| personal | firstName, lastName, preferredName, title, email, phone, dateOfBirth, address, maritalStatus | UPDATE client row |
| employment | employerName, occupation, employmentType, annualIncome | INSERT clientEmployment |
| dependants | name, relationship, dateOfBirth (repeating) | INSERT clientDependant rows |
| assets | description, type, value | INSERT clientAsset |
| liabilities | description, type, balance, interestRate | INSERT clientLiability |
| insurance | type, insurer, policyNumber, coverAmount, premium | INSERT clientInsurance |
| estate_planning | hasWill, willDate, hasPOA, poaName, beneficiaries | UPSERT clientEstatePlanning |
| super | fundName, memberNumber, balance, contributionRate | INSERT clientSuper |

---

## Token / Link System

- Adviser clicks "Send Fact Find" on the client's Fact Find tab
- Picks which sections to include (checkboxes: Personal, Employment, Dependants, Assets & Liabilities, Insurance, Estate Planning, Super, Risk Profiler)
- Server creates a `factFind` row with a UUID token, 30-day expiry, and `status: sent`
- Resend email sent to client's email address with link: `https://{domain}/fact-find/{token}`
- Public route `/fact-find/$token` resolves the token, checks expiry and status, serves the form
- Answers auto-save to `factFindAnswer` on blur (PUT server function, no auth required — token is the credential)
- First save transitions status from `sent` → `in_progress`
- Client clicks "Submit" → status becomes `submitted`, adviser receives in-app notification
- Adviser can resend the email from the CRM (same token, no new row)
- If expired, adviser generates a fresh link (new `factFind` row, new token)
- Adviser can open the link themselves during a meeting — the form works identically in both contexts

---

## Public Form (Client-Facing)

**Route**: `/fact-find/$token` — public, no auth required.

**Layout**: Wizard — one section per page. Progress bar at top showing completed/total steps. Back/Next navigation. Submit button on final step.

**Each section** renders its fields as a form. On blur, answers are saved via a server function (token authenticated). Partially answered fields are preserved between sessions.

**Sections rendered** = `factFind.sectionsIncluded`. Risk profiler (if included) is always the final step.

**Risk profiler step**: 12 multiple-choice questions rendered one at a time (or all on one step — implementation choice). Score computed server-side on submit.

**Submit**: All sections complete → client clicks "Submit" → `factFind.status` set to `submitted`, `submittedAt` recorded, adviser notified.

---

## Risk Profiler — Default Questions

Score = `round((sum of selected option scores / sum of max option scores per question) × 100)`

| # | Question | Options | Max score |
|---|----------|---------|-----------|
| 1 | How long before you need to access funds? | <2yr (0), 2–5yr (2), 5–10yr (4), 10–15yr (6), 15yr+ (8) | 8 |
| 2 | Portfolio drops 20% — you would: | Sell all (0), Sell some (2), Hold (5), Buy more (8) | 8 |
| 3 | How stable is your income? | Unstable (0), Somewhat (3), Stable (6), Multiple sources (8) | 8 |
| 4 | Investment knowledge? | None (0), Basic (3), Intermediate (5), Advanced (8) | 8 |
| 5 | Emergency fund covering 3+ months? | No (0), Working on it (2), Yes (5) | 5 |
| 6 | Primary investment goal? | Preserve capital (0), Steady income (2), Balanced growth (5), Max growth (8) | 8 |
| 7 | Max tolerable loss in any single year? | None (0), 5% (2), 15% (4), 25% (6), 25%+ (8) | 8 |
| 8 | Prior investment experience? | Never (0), A little (3), Moderate (5), Extensive (8) | 8 |
| 9 | Financial dependants? | Yes, heavily (0), Yes, some (2), No (5) | 5 |
| 10 | Years until retirement? | <5 (0), 5–10 (3), 10–20 (6), 20+ (8) | 8 |
| 11 | Markets fall 30% — you would: | Panic and sell (0), Anxious but hold (3), See as normal (6), Buy opportunity (8) | 8 |
| 12 | Current financial stage? | Building savings (2), Accumulating (5), Preserving wealth (8), Drawing down (2) | 8 |

**Categories**:
- 0–25: Conservative
- 26–45: Moderately Conservative
- 46–65: Balanced
- 66–80: Moderately Aggressive
- 81–100: Aggressive

Questions are seeded per org on first use. Editable in Settings (text, options, scores, order, active/inactive). Adviser can override the computed category and add an explanatory note.

---

## CRM Review UI

### Fact Find tab (on client page)

New tab alongside File Notes, Documents, etc.

**List view** (default):
- "Send New" button (top right) → opens a dialog to select sections + confirms client email → creates `factFind` row + sends email
- Table of all fact finds for this client: Date Sent, Sections, Status badge, action link
- Status badges: Sent (grey), In Progress (blue), Submitted (yellow), Approved (green), Expired (red)
- Click a submitted/in-progress row → opens slide-over review panel

**Slide-over review panel**:
- Header: submission date, status, "Apply All" button, "Resend Email" button
- Body: sections grouped with section heading
- Each field row: Field label | Current value | Submitted value | Approve / Skip buttons
- Diff warning: submitted value highlighted in amber with ⚠️ icon when it differs from current
- No warning (greyed out) when submitted value matches current
- "Apply All" applies all `pending` answers in one server call, confirms with a count ("Apply 14 fields?")
- Individual approve: updates `factFindAnswer.approvalStatus = approved`, runs apply logic, updates client/related table
- Skip: sets `approvalStatus = skipped`, no data written
- All fields approved or skipped → `factFind.status` set to `approved`

**Risk profiler result** (if included):
- Shown at bottom of slide-over or as its own section
- Computed score + category badge
- Adviser override: dropdown to select different category + text note
- Save override button

### Settings — Risk Profiler Questions

New section in Settings page: "Risk Profiler". Lists all org questions with drag-to-reorder, edit text/options/scores, toggle active/inactive. "Reset to defaults" button.

---

## Route Structure

```
src/routes/
  fact-find/
    $token.tsx              # Public form — no auth
  (app)/_layout/clients/$clientId/
    fact-find/
      index.tsx             # Fact Find tab (list + slide-over)
  (app)/_layout/
    settings.tsx            # Add Risk Profiler Questions tab
```

## Feature Structure

```
src/features/
  fact-find/
    schemas.ts              # Zod schemas, section/field definitions, SECTIONS constant
    hooks.ts                # useFactFinds, useSendFactFind, useFactFindAnswers, useApproveField, useApplyAll
    components/
      send-fact-find-dialog.tsx
      fact-find-list.tsx
      fact-find-review-panel.tsx   # Slide-over
      field-review-row.tsx
  risk-profiler/
    schemas.ts              # Question definitions, scoring logic, DEFAULT_QUESTIONS
    hooks.ts                # useRiskProfile, useSaveRiskAnswers, useOverrideRiskCategory
    components/
      risk-profiler-step.tsx       # Used in public form
      risk-profile-result.tsx      # Used in review panel + client overview
      risk-questions-settings.tsx  # Settings page component
src/server/functions/
  fact-find.ts              # createFactFind, getFactFinds, saveAnswer, submitFactFind, approveField, applyAll
  risk-profiler.ts          # getRiskProfile, saveRiskAnswers, overrideRiskCategory, getRiskQuestions, updateRiskQuestion
src/routes/
  fact-find/$token.tsx      # Public wizard form
```

---

## Scope Boundaries (v1)

**In scope:**
- All 8 fact find sections (including risk profiler)
- Magic link send + resend + expiry
- Field-level approval with apply all + smart diff
- In-meeting mode (adviser opens the link in CRM)
- Risk profiler: default questions, scoring, category, adviser override
- Risk profiler questions editable in Settings

**Out of scope (future):**
- Fact find dashboard in sidebar (all clients, outstanding forms)
- Email templates customisation
- PDF export of completed fact find
- Client signatures / e-sign
- Automated reminders (cron job to re-notify client)
