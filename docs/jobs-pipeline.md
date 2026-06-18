# Jobs / Pipeline

Living reference for the jobs (pipeline) feature. Notifications design spec
(point-in-time): `docs/superpowers/specs/2026-04-11-job-members-notifications-design.md`.

## What it does

Workflow pipeline for advice tasks. Each **job** has a type, runs through
template-defined **stages**, carries **tasks** (checklist), linked **clients**,
assigned **members**, **comments**, an **activity** timeline, and **documents**.
List + Kanban **board** views. Org-level **job templates** define stages and
default tasks; 9 system templates are lazily seeded per org, custom ones are
editable.

## File map

- Feature: `src/features/jobs/`
  - `schemas.ts` — `JOB_TYPES`, `JOB_STAGES`, `DEFAULT_JOB_TASKS`,
    `JOB_STATUSES`, `JOB_PRIORITIES`, label/progress helpers
  - `hooks.ts` — `jobKeys` + query/mutation hooks (incl. optimistic updates)
  - `members/hooks.ts`, `templates/` — sub-features
  - `components/` — `job-board.tsx`, `job-card.tsx`, `job-columns.tsx`,
    `job-stage-stepper.tsx`, `job-task-list.tsx`, `job-activity-feed.tsx`,
    `job-member-stack.tsx`, `create-job-dialog.tsx`, `edit-job-dialog.tsx`,
    `view-toggle.tsx`
- Server:
  - `jobs.ts` — `getJobs`, `getClientJobs`, `getJob`, `createJob`, `updateJob`,
    `updateJobStage`, `deleteJob`, task ops (`toggleJobTask`, `addJobTask`,
    `deleteJobTask`), client links (`addJobClient`, `removeJobClient`),
    `getJobTimeline`, comments, documents
  - `job-members.ts` — `getJobMembers`, `getAvailableMembers`, `addJobMember`,
    `removeJobMember`
  - `job-templates.ts` — `getTemplates` (lazy-seeds + backfills `templateId`),
    `createTemplate`, `cloneTemplate`, `updateTemplate`, `deleteTemplate`
- Routes: `(app)/_layout/jobs/index.tsx` (list + board), `jobs/$jobId.tsx`
  (detail), `clients/$clientId/jobs/index.tsx` (client's jobs)
- Schema: `job`, `jobTask`, `jobClient` (join), `jobComment`, `jobActivity`,
  `jobDocument`, `jobTemplate`. Org-scoped; `job.templateId → jobTemplate`.

## Data model notes

- **jobTemplate**: `stages` (JSON `{value,label}[]`), `defaultTasks` (JSON
  string[]), `isSystem` (locked), unique on `(orgId, slug)`.
- **jobActivity**: typed audit log (`JOB_CREATED`, `STAGE_CHANGED`,
  `STATUS_CHANGED`, `CLIENT_ADDED`…); written inside the mutating transaction.

## Integrations

Member changes/activity feed feed the [notifications](../src/features/notifications)
domain. Jobs link to clients via `jobClient`.

## Status

**Done:** job CRUD, templates (system + custom), stages/board/list, tasks,
client links, members, comments, activity timeline, documents.

**Remaining:** _(update as work lands)._
