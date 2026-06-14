import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/server/middleware";
import { db } from "@/db/index";
import { client, clientGoal } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

async function verifyClientOwnership(clientId: string, orgId: string) {
  const c = await db.query.client.findFirst({
    where: and(eq(client.id, clientId), eq(client.organizationId, orgId)),
  });
  if (!c) throw new Error("Client not found or unauthorized");
  return c;
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const goalCategories = [
  "RETIREMENT",
  "EDUCATION",
  "PROPERTY",
  "EMERGENCY_FUND",
  "DEBT_FREE",
  "BUSINESS",
  "TRAVEL",
  "OTHER",
] as const;

const goalStatuses = ["ACTIVE", "ACHIEVED", "ON_HOLD", "CANCELLED"] as const;
const goalPriorities = ["HIGH", "MEDIUM", "LOW"] as const;

const goalInputSchema = z.object({
  clientId: z.string(),
  category: z.enum(goalCategories).default("OTHER"),
  name: z.string().min(1).max(200),
  targetAmount: z.number().int().min(0).optional(),
  currentAmount: z.number().int().min(0).default(0),
  targetDate: z.string().optional(),
  priority: z.enum(goalPriorities).default("MEDIUM"),
  status: z.enum(goalStatuses).default("ACTIVE"),
  notes: z.string().optional(),
});

const updateGoalSchema = goalInputSchema.extend({
  goalId: z.string(),
});

const clientIdSchema = z.object({ clientId: z.string() });

// ─── Handlers ─────────────────────────────────────────────────────────────────

export const getGoals = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(clientIdSchema)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!;
    await verifyClientOwnership(data.clientId, orgId);
    return db.query.clientGoal.findMany({
      where: eq(clientGoal.clientId, data.clientId),
      orderBy: (g, { asc, desc }) => [
        asc(g.status),
        desc(g.priority),
        asc(g.name),
      ],
    });
  });

export const createGoal = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(goalInputSchema)
  .handler(async ({ context, data }) => {
    const { session } = context;
    const orgId = session.session.activeOrganizationId!;
    await verifyClientOwnership(data.clientId, orgId);
    const [goal] = await db
      .insert(clientGoal)
      .values({
        clientId: data.clientId,
        category: data.category,
        name: data.name,
        targetAmount: data.targetAmount ?? null,
        currentAmount: data.currentAmount,
        targetDate: data.targetDate ?? null,
        priority: data.priority,
        status: data.status,
        notes: data.notes ?? null,
        createdById: session.user.id,
        updatedById: session.user.id,
      })
      .returning();
    return goal;
  });

export const updateGoal = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(updateGoalSchema)
  .handler(async ({ context, data }) => {
    const { session } = context;
    const orgId = session.session.activeOrganizationId!;
    await verifyClientOwnership(data.clientId, orgId);
    const { goalId, clientId: _, ...fields } = data;
    const [updated] = await db
      .update(clientGoal)
      .set({
        category: fields.category,
        name: fields.name,
        targetAmount: fields.targetAmount ?? null,
        currentAmount: fields.currentAmount,
        targetDate: fields.targetDate ?? null,
        priority: fields.priority,
        status: fields.status,
        notes: fields.notes ?? null,
        updatedById: session.user.id,
        updatedAt: new Date(),
      })
      .where(
        and(eq(clientGoal.id, goalId), eq(clientGoal.clientId, data.clientId)),
      )
      .returning();
    if (!updated) throw new Error("Goal not found");
    return updated;
  });

export const deleteGoal = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ goalId: z.string(), clientId: z.string() }))
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!;
    await verifyClientOwnership(data.clientId, orgId);
    await db
      .delete(clientGoal)
      .where(
        and(
          eq(clientGoal.id, data.goalId),
          eq(clientGoal.clientId, data.clientId),
        ),
      );
    return { success: true };
  });
