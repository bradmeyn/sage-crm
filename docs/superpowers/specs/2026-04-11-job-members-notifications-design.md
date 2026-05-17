# Job Members, Notifications & Client Jobs Table — Design Spec

**Date:** 2026-04-11  
**Status:** Approved

---

## Context

The CRM is for Australian financial advisors. Jobs (New Client, Annual Review) run through a Kanban pipeline. This spec adds three connected features:

1. **Job members** — Trello-style initials circles. Advisors always assigned; other staff (admin etc.) can be added. Drives notification targeting.
2. **Notifications** — In-app bell with dropdown. Triggered by comments, stage moves, and upcoming client birthdays. Recipients = job members only.
3. **Client jobs tab** — Revert to table/list view. Kanban stays on the global `/jobs` page only.

---

## Database

### New table: `jobMember`

```ts
jobMember = pgTable('job_member', {
  id:            text('id').primaryKey().$defaultFn(() => randomUUID()),
  jobId:         text('job_id').notNull().references(() => job.id, { onDelete: 'cascade' }),
  userId:        text('user_id').notNull().references(() => user.id),
  addedById:     text('added_by_id').references(() => user.id),
  createdAt:     timestamp('created_at').notNull().defaultNow(),
}, (t) => [uniqueIndex().on(t.jobId, t.userId)])
```

Auto-populated: `createJob` inserts the creator into `jobMember` after creating the job record.

> **Note:** `job.assignedToId` remains in the DB untouched. The `jobMember` table replaces it functionally in the UI. No migration needed to remove the column.

### New table: `notification`

```ts
notification = pgTable('notification', {
  id:         text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId:     text('user_id').notNull().references(() => user.id),
  type:       text('type').notNull(), // COMMENT_ADDED | STAGE_CHANGED | BIRTHDAY_UPCOMING | JOB_MEMBER_ADDED
  title:      text('title').notNull(),
  body:       text('body').notNull(),
  jobId:      text('job_id').references(() => job.id, { onDelete: 'set null' }),
  clientId:   text('client_id').references(() => client.id, { onDelete: 'set null' }),
  isRead:     boolean('is_read').notNull().default(false),
  createdAt:  timestamp('created_at').notNull().defaultNow(),
})
```

---

## Feature 1: Job Members

### Server functions — `src/server/functions/job-members.ts`

| Function | Method | Description |
|---|---|---|
| `getJobMembers(jobId)` | GET | Members with user info (id, name, initials) |
| `addJobMember(jobId, userId)` | POST | Add org member; no-op if already added; creates `JOB_MEMBER_ADDED` notification |
| `removeJobMember(jobId, userId)` | POST | Remove member (no restriction) |

### Query updates

`getJobs`, `getClientJobs`, `getJob` — all updated to include:
```ts
members: (JobMember & { user: Pick<User, 'id' | 'name'> })[]
```

### Hooks — `src/features/jobs/members/hooks.ts`

- `useJobMembers(jobId)` — query
- `useAddJobMember()` — mutation, invalidates job detail + list
- `useRemoveJobMember()` — mutation, invalidates job detail + list

### UI — `src/features/jobs/components/job-member-stack.tsx`

Shared component used in two contexts:

**On job card** (`job-card.tsx`):
- Small avatars (22px), overlapping, max 3 shown + "+N" overflow
- Position: top-right corner, beside client name
- Read-only (no add/remove from card)

**On job detail** (right panel, replaces `assignedToId` field):
- Larger avatars (28px)
- Hover → tooltip with full name + "Remove" button appears
- `+` circle at end → popover listing unassigned org members (from `member` table), click to add
- Popover has a search input to filter by name

**Avatar colours:** deterministic hash of `user.id` → one of 6 preset colors. Consistent per user across app.

---

## Feature 2: Notifications

### Server functions — `src/server/functions/notifications.ts`

| Function | Method | Description |
|---|---|---|
| `getNotifications()` | GET | Current user's last 50 notifications, newest first |
| `markNotificationRead(id)` | POST | Set `isRead = true` |
| `markAllNotificationsRead()` | POST | Set `isRead = true` for all of current user's |
| `checkBirthdays()` | POST | Birthday sweep (see below) |

Internal helper `createNotificationsForJobMembers(jobId, excludeUserId, type, title, body, extras?)` — fetches job members, excludes one user (the actor), bulk-inserts notifications.

### Notification triggers

| Event | Where triggered | Recipients | Excluded |
|---|---|---|---|
| Comment added | `addJobComment` | job members | commenter |
| Stage changed | `updateJobStage` | job members | person who moved it |
| Member added | `addJobMember` | the new member only | — |
| Upcoming birthday | `checkBirthdays` | job members of active jobs for that client | — |

### Birthday sweep — `checkBirthdays()`

- Finds all `client` records where `dateOfBirth` falls within the next 7 days
- For each client, finds their active jobs (`status = 'ACTIVE'`) and those jobs' members
- Creates `BIRTHDAY_UPCOMING` notification if one hasn't been created for that `(userId, clientId)` pair today (dedup via `createdAt >= today 00:00`)
- Called in `_layout.tsx` `beforeLoad` — fires on every navigation but dedup prevents duplicates

### Hooks — `src/features/notifications/hooks.ts`

```ts
notificationKeys = {
  all: ['notifications'],
  list: ['notifications', 'list'],
}

useNotifications()     // useSuspenseQuery, refetchInterval: 30_000
useMarkRead()          // mutation → invalidates list
useMarkAllRead()       // mutation → invalidates list
```

### UI — `src/features/notifications/components/notification-bell.tsx`

Replaces the existing `<Bell>` icon stub in `_layout.tsx` header.

- Red badge on bell showing unread count (hidden when 0)
- Click → dropdown panel anchored below bell, `z-50`, closes on outside click
- Dropdown header: "Notifications" + unread count badge + "Mark all read" link
- Each item:
  - Icon: 💬 comment / 📋 stage / 🎂 birthday / 👤 member added
  - Title + body text
  - Relative timestamp ("2 min ago", "Yesterday")
  - Unread items: green left border or subtle green bg tint
  - Click → navigate to `jobId` route (if present) + mark read
- Empty state: "No notifications yet"

---

## Feature 3: Client Jobs Tab → Table

File: `src/routes/(app)/_layout/clients/$clientId/jobs/index.tsx`

Revert to `DataTable` using `buildClientJobColumns`. Remove Kanban board and `ViewToggle`. Columns: Title, Stage, Status, Priority, Due Date, Task Progress. Row click → `/jobs/$jobId`.

Global `/jobs` page is unaffected — remains Kanban-only.

---

## Files Changed / Created

| File | Change |
|---|---|
| `src/db/schema.ts` | Add `jobMember` + `notification` tables + relations |
| `drizzle/` | New migration SQL |
| `src/server/functions/job-members.ts` | New |
| `src/server/functions/notifications.ts` | New |
| `src/server/functions/jobs.ts` | `createJob` auto-adds member; `addJobComment` + `updateJobStage` trigger notifications; queries include members |
| `src/features/jobs/members/hooks.ts` | New |
| `src/features/notifications/hooks.ts` | New |
| `src/features/jobs/components/job-member-stack.tsx` | New |
| `src/features/notifications/components/notification-bell.tsx` | New |
| `src/features/jobs/components/job-card.tsx` | Add member avatar stack top-right |
| `src/routes/(app)/_layout/jobs/$jobId.tsx` | Replace assignedToId with `JobMemberStack` |
| `src/routes/(app)/_layout.tsx` | Add `NotificationBell`; call `checkBirthdays()` in beforeLoad |
| `src/routes/(app)/_layout/clients/$clientId/jobs/index.tsx` | Revert to table view |

---

## Verification

1. Create a job → creator auto-appears as member avatar on card (top-right) and in detail panel
2. Add a second org member to a job → avatar appears; that user sees "You were added to X" notification
3. Add a comment → other job members see `COMMENT_ADDED` notification within 30s (polling)
4. Drag job to new stage → other members see `STAGE_CHANGED` notification
5. Client with birthday in next 7 days → assigned advisor sees `BIRTHDAY_UPCOMING` notification on next page load
6. Bell badge shows correct unread count; "Mark all read" clears it
7. Clicking a notification navigates to the job and marks it read
8. Client detail → Jobs tab shows table, not board
9. Global Jobs page still shows Kanban board
