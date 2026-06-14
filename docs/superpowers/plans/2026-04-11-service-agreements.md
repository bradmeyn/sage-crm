# Service Agreements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an ongoing service agreements feature to the client detail page, with dashboard renewal alerts and notifications, satisfying Australian ASIC regulatory requirements.

**Architecture:** One `serviceAgreement` row per client. Status (`ACTIVE`, `RENEWAL_DUE`, `OVERDUE`, `LAPSED`) is computed from `nextRenewalDate` in server functions — never stored. Recording consent stamps `lastConsentDate` and advances `nextRenewalDate` by 12 months. A sweep function (called on each layout load) fires notifications when renewal windows open.

**Tech Stack:** TanStack Start v1, Drizzle ORM + PostgreSQL, TanStack Query, Shadcn UI, Zod, Sonner toasts.

---

## File Map

**Create:**

- `drizzle/0007_service_agreements.sql` — migration SQL
- `src/server/functions/service-agreements.ts` — all server functions + status helper
- `src/features/service-agreements/hooks.ts` — TanStack Query hooks + cache keys
- `src/features/service-agreements/components/service-agreement-dialog.tsx` — create/edit form dialog
- `src/features/service-agreements/components/service-agreement-card.tsx` — agreement display card
- `src/routes/(app)/_layout/clients/$clientId/service-agreements/index.tsx` — tab route

**Modify:**

- `src/db/schema.ts` — add `serviceAgreement` table + relations
- `drizzle/meta/_journal.json` — register migration entry
- `src/routes/(app)/_layout/clients/$clientId.tsx` — add "Service Agreements" tab to nav
- `src/routes/(app)/_layout/dashboard.tsx` — add Upcoming Renewals card
- `src/features/dashboard/hooks.ts` — add `upcomingRenewals` key + hook
- `src/routes/(app)/_layout.tsx` — call `checkServiceAgreementRenewals()` in `beforeLoad`
- `src/features/notifications/components/notification-bell.tsx` — add 3 new notification type icons

---

## Task 1: DB schema + migration

**Files:**

- Modify: `src/db/schema.ts`
- Create: `drizzle/0007_service_agreements.sql`
- Modify: `drizzle/meta/_journal.json`

- [ ] **Step 1: Add `serviceAgreement` table to schema**

In `src/db/schema.ts`, add after the `notification` table definition:

```ts
export const serviceAgreement = pgTable("service_agreement", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  clientId: text("client_id")
    .notNull()
    .references(() => client.id, { onDelete: "cascade" }),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  startDate: text("start_date").notNull(),
  nextRenewalDate: text("next_renewal_date").notNull(),
  lastConsentDate: text("last_consent_date"),
  feeAmount: integer("fee_amount").notNull(),
  feeFrequency: text("fee_frequency").notNull(),
  services: text("services").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

- [ ] **Step 2: Add relations**

In `src/db/schema.ts`, add a relations block for `serviceAgreement` and update `clientRelations` to include it:

```ts
export const serviceAgreementRelations = relations(
  serviceAgreement,
  ({ one }) => ({
    client: one(client, {
      fields: [serviceAgreement.clientId],
      references: [client.id],
    }),
    organization: one(organization, {
      fields: [serviceAgreement.organizationId],
      references: [organization.id],
    }),
  }),
);
```

Find the existing `clientRelations` block and add `agreements: many(serviceAgreement)` to it. Also add `serviceAgreement` to the imports wherever `many` is used for other client relations.

- [ ] **Step 3: Export the type**

At the bottom of `src/db/schema.ts` where other types are exported, add:

```ts
export type ServiceAgreement = typeof serviceAgreement.$inferSelect;
export type NewServiceAgreement = typeof serviceAgreement.$inferInsert;
```

- [ ] **Step 4: Create migration SQL**

Create `drizzle/0007_service_agreements.sql`:

```sql
CREATE TABLE service_agreement (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES client(id) ON DELETE CASCADE,
  organization_id TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  start_date TEXT NOT NULL,
  next_renewal_date TEXT NOT NULL,
  last_consent_date TEXT,
  fee_amount INTEGER NOT NULL,
  fee_frequency TEXT NOT NULL CHECK (fee_frequency IN ('MONTHLY', 'QUARTERLY', 'ANNUALLY')),
  services TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX service_agreement_client_idx ON service_agreement(client_id);
CREATE INDEX service_agreement_org_idx ON service_agreement(organization_id);
```

- [ ] **Step 5: Apply migration**

```bash
psql "postgresql://bradmeyn:Charlieisagoodboy@localhost:5433/crm_ts" -f drizzle/0007_service_agreements.sql
```

Expected output: `CREATE TABLE`, `CREATE INDEX`, `CREATE INDEX`

- [ ] **Step 6: Register migration in journal**

In `drizzle/meta/_journal.json`, append to the `entries` array:

```json
{
  "idx": 6,
  "version": "7",
  "when": 1744300000000,
  "tag": "0007_service_agreements",
  "breakpoints": true
}
```

Note: idx is 6 (not 7) because the journal was at idx 5 before the job_members migration which wasn't registered.

- [ ] **Step 7: Verify build**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in ...`

---

## Task 2: Server functions

**Files:**

- Create: `src/server/functions/service-agreements.ts`

- [ ] **Step 1: Create the file with status helper + CRUD**

Create `src/server/functions/service-agreements.ts`:

```ts
import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/server/middleware";
import { db } from "@/db/index";
import { serviceAgreement, notification, client } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { z } from "zod";

// ─── Status computation ───────────────────────────────────────────────────────

export type AgreementStatus = "ACTIVE" | "RENEWAL_DUE" | "OVERDUE" | "LAPSED";

export function computeAgreementStatus(
  nextRenewalDate: string,
): AgreementStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const renewal = new Date(nextRenewalDate);
  renewal.setHours(0, 0, 0, 0);

  const windowOpen = new Date(renewal);
  windowOpen.setDate(windowOpen.getDate() - 60);

  const lapsedAt = new Date(renewal);
  lapsedAt.setDate(lapsedAt.getDate() + 150);

  if (today >= lapsedAt) return "LAPSED";
  if (today >= renewal) return "OVERDUE";
  if (today >= windowOpen) return "RENEWAL_DUE";
  return "ACTIVE";
}

function advanceOneYear(dateStr: string): string {
  const d = new Date(dateStr);
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split("T")[0];
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const clientIdSchema = z.object({ clientId: z.string() });
const idSchema = z.object({ id: z.string() });

const createSchema = z.object({
  clientId: z.string(),
  startDate: z.string(),
  nextRenewalDate: z.string(),
  feeAmount: z.number().int().positive(),
  feeFrequency: z.enum(["MONTHLY", "QUARTERLY", "ANNUALLY"]),
  services: z.string().min(1),
  notes: z.string().optional(),
});

const updateSchema = z.object({
  id: z.string(),
  startDate: z.string(),
  nextRenewalDate: z.string(),
  feeAmount: z.number().int().positive(),
  feeFrequency: z.enum(["MONTHLY", "QUARTERLY", "ANNUALLY"]),
  services: z.string().min(1),
  notes: z.string().optional(),
});

// ─── Server functions ─────────────────────────────────────────────────────────

export const getServiceAgreement = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator(clientIdSchema)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!;
    const agreement = await db.query.serviceAgreement.findFirst({
      where: and(
        eq(serviceAgreement.clientId, data.clientId),
        eq(serviceAgreement.organizationId, orgId),
      ),
    });
    if (!agreement) return null;
    return {
      ...agreement,
      status: computeAgreementStatus(agreement.nextRenewalDate),
    };
  });

export const createServiceAgreement = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(createSchema)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!;
    const [created] = await db
      .insert(serviceAgreement)
      .values({ ...data, organizationId: orgId, notes: data.notes ?? null })
      .returning();
    return {
      ...created,
      status: computeAgreementStatus(created.nextRenewalDate),
    };
  });

export const updateServiceAgreement = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(updateSchema)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!;
    const { id, ...fields } = data;
    const [updated] = await db
      .update(serviceAgreement)
      .set({ ...fields, notes: fields.notes ?? null })
      .where(
        and(
          eq(serviceAgreement.id, id),
          eq(serviceAgreement.organizationId, orgId),
        ),
      )
      .returning();
    return {
      ...updated,
      status: computeAgreementStatus(updated.nextRenewalDate),
    };
  });

export const recordConsent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(idSchema)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!;
    const existing = await db.query.serviceAgreement.findFirst({
      where: and(
        eq(serviceAgreement.id, data.id),
        eq(serviceAgreement.organizationId, orgId),
      ),
    });
    if (!existing) throw new Error("Agreement not found");
    const today = new Date().toISOString().split("T")[0];
    const nextRenewalDate = advanceOneYear(existing.nextRenewalDate);
    const [updated] = await db
      .update(serviceAgreement)
      .set({ lastConsentDate: today, nextRenewalDate })
      .where(eq(serviceAgreement.id, data.id))
      .returning();
    return {
      ...updated,
      status: computeAgreementStatus(updated.nextRenewalDate),
    };
  });

export const deleteServiceAgreement = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(idSchema)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!;
    await db
      .delete(serviceAgreement)
      .where(
        and(
          eq(serviceAgreement.id, data.id),
          eq(serviceAgreement.organizationId, orgId),
        ),
      );
    return { success: true };
  });

export const getUpcomingRenewals = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const orgId = context.session.session.activeOrganizationId!;
    const agreements = await db.query.serviceAgreement.findMany({
      where: eq(serviceAgreement.organizationId, orgId),
      with: { client: true },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return agreements
      .map((a) => {
        const status = computeAgreementStatus(a.nextRenewalDate);
        const renewal = new Date(a.nextRenewalDate);
        renewal.setHours(0, 0, 0, 0);
        const daysUntilRenewal = Math.ceil(
          (renewal.getTime() - today.getTime()) / 86400000,
        );
        const deadlineAt = new Date(renewal);
        deadlineAt.setDate(deadlineAt.getDate() + 150);
        const daysUntilLapse = Math.ceil(
          (deadlineAt.getTime() - today.getTime()) / 86400000,
        );
        return { ...a, status, daysUntilRenewal, daysUntilLapse };
      })
      .filter((a) => {
        // Include: RENEWAL_DUE, OVERDUE, LAPSED, or window opening within 30 days
        if (a.status !== "ACTIVE") return true;
        return a.daysUntilRenewal <= 30;
      })
      .sort((a, b) => {
        const order = { LAPSED: 0, OVERDUE: 1, RENEWAL_DUE: 2, ACTIVE: 3 };
        if (order[a.status] !== order[b.status])
          return order[a.status] - order[b.status];
        return a.daysUntilRenewal - b.daysUntilRenewal;
      });
  });

export const checkServiceAgreementRenewals = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const orgId = context.session.session.activeOrganizationId!;
    const userId = context.session.user.id;

    const agreements = await db.query.serviceAgreement.findMany({
      where: eq(serviceAgreement.organizationId, orgId),
      with: { client: true },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    for (const a of agreements) {
      const status = computeAgreementStatus(a.nextRenewalDate);
      const renewal = new Date(a.nextRenewalDate);
      renewal.setHours(0, 0, 0, 0);
      const daysUntilRenewal = Math.ceil(
        (renewal.getTime() - today.getTime()) / 86400000,
      );
      const daysOverdue = -daysUntilRenewal;

      // Determine which notification type applies today
      let notifType: string | null = null;
      let title = "";
      let body = "";

      if (status === "ACTIVE" && daysUntilRenewal === 60) {
        notifType = "AGREEMENT_RENEWAL_DUE";
        title = "Service agreement renewal due";
        body = `The renewal window for ${a.client.firstName} ${a.client.lastName}'s service agreement opens today — renewal due by ${new Date(a.nextRenewalDate).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}.`;
      } else if (status === "OVERDUE" && daysOverdue === 0) {
        notifType = "AGREEMENT_OVERDUE";
        title = "Service agreement anniversary reached";
        body = `${a.client.firstName} ${a.client.lastName}'s service agreement anniversary has passed — consent must be obtained within 150 days to avoid lapse.`;
      } else if (status === "OVERDUE" && daysOverdue === 90) {
        notifType = "AGREEMENT_LAPSED";
        title = "Service agreement critically overdue";
        body = `${a.client.firstName} ${a.client.lastName}'s service agreement consent is 90 days overdue — only 60 days remaining before automatic lapse.`;
      }

      if (!notifType) continue;

      // Dedup: skip if already sent today for this agreement
      const existing = await db.query.notification.findFirst({
        where: and(
          eq(notification.userId, userId),
          eq(notification.type, notifType),
          eq(notification.clientId, a.clientId),
          gte(notification.createdAt, today),
        ),
      });
      if (existing) continue;

      await db.insert(notification).values({
        userId,
        type: notifType,
        title,
        body,
        clientId: a.clientId,
      });
    }

    return { checked: agreements.length };
  });
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in ...`

---

## Task 3: Hooks

**Files:**

- Create: `src/features/service-agreements/hooks.ts`

- [ ] **Step 1: Create hooks file**

Create `src/features/service-agreements/hooks.ts`:

```ts
import {
  useSuspenseQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getServiceAgreement,
  createServiceAgreement,
  updateServiceAgreement,
  recordConsent,
  deleteServiceAgreement,
  getUpcomingRenewals,
} from "@/server/functions/service-agreements";

export const agreementKeys = {
  all: ["service-agreements"] as const,
  byClient: (clientId: string) =>
    ["service-agreements", "client", clientId] as const,
  upcoming: () => ["service-agreements", "upcoming"] as const,
};

export function useServiceAgreement(clientId: string) {
  return useQuery({
    queryKey: agreementKeys.byClient(clientId),
    queryFn: () => getServiceAgreement({ data: { clientId } }),
    enabled: !!clientId,
  });
}

export function useUpcomingRenewals() {
  return useSuspenseQuery({
    queryKey: agreementKeys.upcoming(),
    queryFn: () => getUpcomingRenewals(),
  });
}

export function useCreateServiceAgreement(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof createServiceAgreement>[0]["data"]) =>
      createServiceAgreement({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: agreementKeys.byClient(clientId),
      });
      queryClient.invalidateQueries({ queryKey: agreementKeys.upcoming() });
    },
  });
}

export function useUpdateServiceAgreement(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof updateServiceAgreement>[0]["data"]) =>
      updateServiceAgreement({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: agreementKeys.byClient(clientId),
      });
      queryClient.invalidateQueries({ queryKey: agreementKeys.upcoming() });
    },
  });
}

export function useRecordConsent(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recordConsent({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: agreementKeys.byClient(clientId),
      });
      queryClient.invalidateQueries({ queryKey: agreementKeys.upcoming() });
    },
  });
}

export function useDeleteServiceAgreement(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteServiceAgreement({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: agreementKeys.byClient(clientId),
      });
      queryClient.invalidateQueries({ queryKey: agreementKeys.upcoming() });
    },
  });
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in ...`

---

## Task 4: Form dialog (create + edit)

**Files:**

- Create: `src/features/service-agreements/components/service-agreement-dialog.tsx`

- [ ] **Step 1: Create dialog component**

Create `src/features/service-agreements/components/service-agreement-dialog.tsx`:

```tsx
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  useCreateServiceAgreement,
  useUpdateServiceAgreement,
} from "@/features/service-agreements/hooks";
import type { ServiceAgreement } from "@/db/schema";

interface Props {
  clientId: string;
  agreement?: ServiceAgreement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function centsToDisplay(cents: number): string {
  return (cents / 100).toFixed(2);
}

function displayToCents(val: string): number {
  return Math.round(parseFloat(val) * 100);
}

export default function ServiceAgreementDialog({
  clientId,
  agreement,
  open,
  onOpenChange,
}: Props) {
  const isEdit = !!agreement;
  const create = useCreateServiceAgreement(clientId);
  const update = useUpdateServiceAgreement(clientId);

  const today = new Date().toISOString().split("T")[0];
  const oneYearFromNow = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split("T")[0];
  })();

  const [startDate, setStartDate] = useState(agreement?.startDate ?? today);
  const [nextRenewalDate, setNextRenewalDate] = useState(
    agreement?.nextRenewalDate ?? oneYearFromNow,
  );
  const [feeAmount, setFeeAmount] = useState(
    agreement ? centsToDisplay(agreement.feeAmount) : "",
  );
  const [feeFrequency, setFeeFrequency] = useState<
    "MONTHLY" | "QUARTERLY" | "ANNUALLY"
  >(
    (agreement?.feeFrequency as "MONTHLY" | "QUARTERLY" | "ANNUALLY") ??
      "ANNUALLY",
  );
  const [services, setServices] = useState(agreement?.services ?? "");
  const [notes, setNotes] = useState(agreement?.notes ?? "");

  const isPending = create.isPending || update.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cents = displayToCents(feeAmount);
    if (isNaN(cents) || cents <= 0) {
      toast.error("Enter a valid fee amount");
      return;
    }
    const payload = {
      startDate,
      nextRenewalDate,
      feeAmount: cents,
      feeFrequency,
      services,
      notes: notes || undefined,
    };

    if (isEdit) {
      update.mutate(
        { id: agreement.id, ...payload },
        {
          onSuccess: () => {
            toast.success("Agreement updated");
            onOpenChange(false);
          },
          onError: (err: Error) => toast.error(err.message),
        },
      );
    } else {
      create.mutate(
        { clientId, ...payload },
        {
          onSuccess: () => {
            toast.success("Agreement created");
            onOpenChange(false);
          },
          onError: (err: Error) => toast.error(err.message),
        },
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Service Agreement" : "New Service Agreement"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nextRenewalDate">Next Renewal Date</Label>
              <Input
                id="nextRenewalDate"
                type="date"
                value={nextRenewalDate}
                onChange={(e) => setNextRenewalDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="feeAmount">Fee Amount ($)</Label>
              <Input
                id="feeAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="5500.00"
                value={feeAmount}
                onChange={(e) => setFeeAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Fee Frequency</Label>
              <Select
                value={feeFrequency}
                onValueChange={(v) =>
                  setFeeFrequency(v as typeof feeFrequency)
                }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  <SelectItem value="ANNUALLY">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="services">Services Included</Label>
            <Textarea
              id="services"
              placeholder="e.g. Annual financial plan review, investment advice, insurance review..."
              value={services}
              onChange={(e) => setServices(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Internal notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Saving…"
                : isEdit
                  ? "Save Changes"
                  : "Create Agreement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in ...`

---

## Task 5: Agreement card + tab route

**Files:**

- Create: `src/features/service-agreements/components/service-agreement-card.tsx`
- Create: `src/routes/(app)/_layout/clients/$clientId/service-agreements/index.tsx`

- [ ] **Step 1: Create the agreement card component**

Create `src/features/service-agreements/components/service-agreement-card.tsx`:

```tsx
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import {
  useRecordConsent,
  useDeleteServiceAgreement,
} from "@/features/service-agreements/hooks";
import ServiceAgreementDialog from "./service-agreement-dialog";
import type { ServiceAgreement } from "@/db/schema";
import type { AgreementStatus } from "@/server/functions/service-agreements";

const STATUS_BADGE: Record<
  AgreementStatus,
  { label: string; className: string }
> = {
  ACTIVE: { label: "Active", className: "bg-emerald-100 text-emerald-700" },
  RENEWAL_DUE: {
    label: "Renewal Due",
    className: "bg-amber-100 text-amber-700",
  },
  OVERDUE: { label: "Overdue", className: "bg-orange-100 text-orange-700" },
  LAPSED: { label: "Lapsed", className: "bg-red-100 text-red-700" },
};

const FREQ_LABEL: Record<string, string> = {
  MONTHLY: "month",
  QUARTERLY: "quarter",
  ANNUALLY: "year",
};

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatFee(cents: number, frequency: string) {
  const dollars = (cents / 100).toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
  });
  return `${dollars} / ${FREQ_LABEL[frequency] ?? frequency.toLowerCase()}`;
}

function renewalWindow(nextRenewalDate: string) {
  const renewal = new Date(nextRenewalDate);
  const open = new Date(renewal);
  open.setDate(open.getDate() - 60);
  const close = new Date(renewal);
  close.setDate(close.getDate() + 150);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  return `${fmt(open)} → ${fmt(close)}`;
}

interface Props {
  agreement: ServiceAgreement & { status: AgreementStatus };
  clientId: string;
}

export default function ServiceAgreementCard({ agreement, clientId }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const recordConsent = useRecordConsent(clientId);
  const deleteAgreement = useDeleteServiceAgreement(clientId);
  const badge = STATUS_BADGE[agreement.status];

  const handleRecordConsent = () => {
    recordConsent.mutate(agreement.id, {
      onSuccess: () =>
        toast.success("Consent recorded — renewal date advanced by 12 months"),
      onError: (err: Error) => toast.error(err.message),
    });
  };

  const handleDelete = () => {
    if (!confirm("Delete this service agreement? This cannot be undone."))
      return;
    deleteAgreement.mutate(agreement.id, {
      onSuccess: () => toast.success("Agreement deleted"),
      onError: (err: Error) => toast.error(err.message),
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Ongoing Service Agreement</h3>
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                {badge.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleRecordConsent}
                disabled={
                  agreement.status === "ACTIVE" || recordConsent.isPending
                }
                title={
                  agreement.status === "ACTIVE"
                    ? "Consent not yet due"
                    : "Record client consent"
                }>
                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                Record Consent
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setEditOpen(true)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-muted-foreground hover:text-destructive"
                onClick={handleDelete}
                disabled={deleteAgreement.isPending}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <Row
              label="Annual Fee"
              value={formatFee(agreement.feeAmount, agreement.feeFrequency)}
            />
            <Row label="Start Date" value={formatDate(agreement.startDate)} />
            <Row
              label="Next Renewal"
              value={formatDate(agreement.nextRenewalDate)}
            />
            <Row
              label="Last Consent"
              value={
                agreement.lastConsentDate
                  ? formatDate(agreement.lastConsentDate)
                  : "—"
              }
            />
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Renewal Window
            </p>
            <p className="text-sm">
              {renewalWindow(agreement.nextRenewalDate)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              60 days before to 150 days after anniversary (ASIC requirement)
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Services Included
            </p>
            <p className="text-sm whitespace-pre-wrap">{agreement.services}</p>
          </div>

          {agreement.notes && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Notes
              </p>
              <p className="text-sm text-muted-foreground">{agreement.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <ServiceAgreementDialog
        clientId={clientId}
        agreement={agreement}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm mt-0.5">{value}</p>
    </div>
  );
}
```

- [ ] **Step 2: Create the tab route**

Create `src/routes/(app)/_layout/clients/$clientId/service-agreements/index.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getServiceAgreement } from "@/server/functions/service-agreements";
import {
  agreementKeys,
  useServiceAgreement,
} from "@/features/service-agreements/hooks";
import ServiceAgreementCard from "@/features/service-agreements/components/service-agreement-card";
import ServiceAgreementDialog from "@/features/service-agreements/components/service-agreement-dialog";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute(
  "/(app)/_layout/clients/$clientId/service-agreements/",
)({
  component: ServiceAgreementsPage,
  loader: async ({ params: { clientId }, context: { queryClient } }) => {
    await queryClient.ensureQueryData({
      queryKey: agreementKeys.byClient(clientId),
      queryFn: () => getServiceAgreement({ data: { clientId } }),
    });
    return { clientId };
  },
});

function ServiceAgreementsPage() {
  const { clientId } = Route.useLoaderData();
  const { data: agreement } = useServiceAgreement(clientId);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Service Agreement</h2>
          <p className="text-sm text-muted-foreground">
            Ongoing fee arrangement under ASIC requirements
          </p>
        </div>
        {!agreement && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Agreement
          </Button>
        )}
      </div>

      {agreement ? (
        <ServiceAgreementCard agreement={agreement} clientId={clientId} />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-white">
          <FileText className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="font-medium mb-1">No service agreement on file</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Record the client's ongoing service arrangement and track annual
            renewals.
          </p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Agreement
          </Button>
        </div>
      )}

      <ServiceAgreementDialog
        clientId={clientId}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in ...`

---

## Task 6: Wire tab into client layout

**Files:**

- Modify: `src/routes/(app)/_layout/clients/$clientId.tsx`

- [ ] **Step 1: Add Service Agreements tab to the nav**

In `src/routes/(app)/_layout/clients/$clientId.tsx`, add a new `<NavTab>` entry in the nav list after the Jobs tab:

```tsx
<NavTab
  to="/clients/$clientId/service-agreements"
  params={{ clientId: client.id }}>
  Service Agreements
</NavTab>
```

The full nav block becomes:

```tsx
<nav className="-mb-px flex space-x-8">
  <NavTab to="/clients/$clientId" params={{ clientId: client.id }}>
    Overview
  </NavTab>
  <NavTab to="/clients/$clientId/file-notes" params={{ clientId: client.id }}>
    File Notes
  </NavTab>
  <NavTab to="/clients/$clientId/documents" params={{ clientId: client.id }}>
    Documents
  </NavTab>
  <NavTab
    to="/clients/$clientId/balance-sheet"
    params={{ clientId: client.id }}>
    Balance Sheet
  </NavTab>
  <NavTab to="/clients/$clientId/cashflow" params={{ clientId: client.id }}>
    Cashflow
  </NavTab>
  <NavTab to="/clients/$clientId/goals" params={{ clientId: client.id }}>
    Goals
  </NavTab>
  <NavTab to="/clients/$clientId/insurance" params={{ clientId: client.id }}>
    Insurance
  </NavTab>
  <NavTab to="/clients/$clientId/jobs" params={{ clientId: client.id }}>
    Jobs
  </NavTab>
  <NavTab
    to="/clients/$clientId/service-agreements"
    params={{ clientId: client.id }}>
    Service Agreements
  </NavTab>
</nav>
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in ...`

---

## Task 7: Dashboard Upcoming Renewals card

**Files:**

- Modify: `src/features/dashboard/hooks.ts`
- Modify: `src/routes/(app)/_layout/dashboard.tsx`

- [ ] **Step 1: Add upcoming renewals to dashboard hooks**

In `src/features/dashboard/hooks.ts`, add:

```ts
import { getUpcomingRenewals } from "@/server/functions/service-agreements";
import { agreementKeys } from "@/features/service-agreements/hooks";

export function useUpcomingRenewals() {
  return useSuspenseQuery({
    queryKey: agreementKeys.upcoming(),
    queryFn: () => getUpcomingRenewals(),
  });
}
```

- [ ] **Step 2: Add card to dashboard page**

In `src/routes/(app)/_layout/dashboard.tsx`:

1. Add import at the top:

```ts
import { getUpcomingRenewals } from "@/server/functions/service-agreements";
import { agreementKeys } from "@/features/service-agreements/hooks";
import { useUpcomingRenewals } from "@/features/dashboard/hooks";
import { FileText } from "lucide-react";
import type { AgreementStatus } from "@/server/functions/service-agreements";
```

2. Add to the loader's `Promise.all`:

```ts
queryClient.ensureQueryData({
  queryKey: agreementKeys.upcoming(),
  queryFn: () => getUpcomingRenewals(),
}),
```

3. Add the `useUpcomingRenewals` call inside `DashboardPage`:

```ts
const { data: upcomingRenewals = [] } = useUpcomingRenewals();
```

4. Add a `RenewalRow` component near the other row components:

```tsx
const RENEWAL_STATUS_BADGE: Record<
  AgreementStatus,
  { label: string; className: string }
> = {
  ACTIVE: {
    label: "Window Opens Soon",
    className: "bg-blue-100 text-blue-700",
  },
  RENEWAL_DUE: {
    label: "Renewal Due",
    className: "bg-amber-100 text-amber-700",
  },
  OVERDUE: { label: "Overdue", className: "bg-orange-100 text-orange-700" },
  LAPSED: { label: "Lapsed", className: "bg-red-100 text-red-700" },
};

function RenewalRow({
  agreement,
}: {
  agreement: Awaited<ReturnType<typeof getUpcomingRenewals>>[number];
}) {
  const badge = RENEWAL_STATUS_BADGE[agreement.status];
  const urgency =
    agreement.status === "LAPSED"
      ? `${Math.abs(agreement.daysUntilLapse)} days overdue`
      : agreement.status === "OVERDUE"
        ? `${Math.abs(agreement.daysUntilRenewal)} days overdue`
        : agreement.daysUntilRenewal <= 0
          ? "Today"
          : `${agreement.daysUntilRenewal}d`;

  return (
    <Link
      to="/clients/$clientId/service-agreements"
      params={{ clientId: agreement.clientId }}
      className="flex items-center justify-between py-2 hover:bg-muted/40 rounded-md px-2 -mx-2 transition-colors">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
          {agreement.client.firstName[0]}
          {agreement.client.lastName[0]}
        </div>
        <div>
          <div className="font-medium text-sm">
            {agreement.client.firstName} {agreement.client.lastName}
          </div>
          <span
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${badge.className}`}>
            {badge.label}
          </span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-xs font-medium">{urgency}</div>
      </div>
    </Link>
  );
}
```

5. Add the Upcoming Renewals card in the JSX after the Row 3 grid (before the closing `</div>`):

```tsx
{
  /* Row 4: Upcoming Renewals */
}
{
  upcomingRenewals.length > 0 && (
    <Card>
      <CardHeader className="flex items-center gap-4 pb-3">
        <div className="flex items-center rounded-full bg-primary/10 p-2 w-max text-primary">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <CardTitle>Upcoming Service Renewals</CardTitle>
          <p className="text-sm text-muted-foreground">
            {upcomingRenewals.length} agreement
            {upcomingRenewals.length === 1 ? "" : "s"} requiring attention
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {upcomingRenewals.map((a) => (
            <RenewalRow key={a.id} agreement={a} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in ...`

---

## Task 8: Notifications + layout sweep

**Files:**

- Modify: `src/features/notifications/components/notification-bell.tsx`
- Modify: `src/routes/(app)/_layout.tsx`

- [ ] **Step 1: Add new notification type icons to the bell**

In `src/features/notifications/components/notification-bell.tsx`, update the `TYPE_ICON` map:

```ts
const TYPE_ICON: Record<string, string> = {
  COMMENT_ADDED: "💬",
  STAGE_CHANGED: "📋",
  BIRTHDAY_UPCOMING: "🎂",
  JOB_MEMBER_ADDED: "👤",
  AGREEMENT_RENEWAL_DUE: "📄",
  AGREEMENT_OVERDUE: "⚠️",
  AGREEMENT_LAPSED: "🚨",
};
```

- [ ] **Step 2: Wire sweep into layout beforeLoad**

In `src/routes/(app)/_layout.tsx`, import the sweep function:

```ts
import { checkServiceAgreementRenewals } from "@/server/functions/service-agreements";
```

Then in `beforeLoad`, after the existing `checkBirthdays().catch(() => {})` call, add:

```ts
checkServiceAgreementRenewals().catch(() => {});
```

- [ ] **Step 3: Final build verification**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in ...`

- [ ] **Step 4: Smoke test**

1. Start dev server: `npm run dev`
2. Navigate to any client → Service Agreements tab → should show empty state with "Add Agreement" button
3. Create an agreement with a `nextRenewalDate` set to 30 days from now → status badge should show `RENEWAL_DUE`
4. Click "Record Consent" → toast confirms, `nextRenewalDate` advances 12 months, badge changes to `ACTIVE`
5. Navigate to Dashboard → "Upcoming Service Renewals" card should appear for the agreement set to renewal due
6. Check notification bell → should have a notification for the agreement if sweep fired
