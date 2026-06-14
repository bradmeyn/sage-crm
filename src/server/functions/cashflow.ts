import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/server/middleware";
import { db } from "@/db/index";
import { client, clientIncome, clientExpense } from "@/db/schema";
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

const incomeCategories = [
  "EMPLOYMENT",
  "SELF_EMPLOYMENT",
  "INVESTMENT",
  "RENTAL",
  "SUPERANNUATION",
  "GOVERNMENT",
  "OTHER",
] as const;

const expenseCategories = [
  "HOUSING",
  "LIVING",
  "TRANSPORT",
  "INSURANCE",
  "UTILITIES",
  "HEALTHCARE",
  "EDUCATION",
  "ENTERTAINMENT",
  "OTHER",
] as const;

const frequencies = [
  "WEEKLY",
  "FORTNIGHTLY",
  "MONTHLY",
  "QUARTERLY",
  "ANNUALLY",
] as const;

const ownerValues = ["CLIENT", "PARTNER"] as const;

const incomeInputSchema = z.object({
  clientId: z.string(),
  category: z.enum(incomeCategories).default("OTHER"),
  name: z.string().min(1).max(200),
  amount: z.number().int().min(0),
  frequency: z.enum(frequencies).default("ANNUALLY"),
  owner: z.enum(ownerValues).default("CLIENT"),
  notes: z.string().optional(),
});

const updateIncomeSchema = incomeInputSchema.extend({
  incomeId: z.string(),
});

const expenseInputSchema = z.object({
  clientId: z.string(),
  category: z.enum(expenseCategories).default("OTHER"),
  name: z.string().min(1).max(200),
  amount: z.number().int().min(0),
  frequency: z.enum(frequencies).default("MONTHLY"),
  notes: z.string().optional(),
});

const updateExpenseSchema = expenseInputSchema.extend({
  expenseId: z.string(),
});

const clientIdSchema = z.object({ clientId: z.string() });

// ─── Income ───────────────────────────────────────────────────────────────────

export const getIncome = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(clientIdSchema)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!;
    await verifyClientOwnership(data.clientId, orgId);
    return db.query.clientIncome.findMany({
      where: eq(clientIncome.clientId, data.clientId),
      orderBy: (i, { asc }) => [asc(i.category), asc(i.name)],
    });
  });

export const createIncome = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(incomeInputSchema)
  .handler(async ({ context, data }) => {
    const { session } = context;
    const orgId = session.session.activeOrganizationId!;
    await verifyClientOwnership(data.clientId, orgId);
    const [income] = await db
      .insert(clientIncome)
      .values({
        clientId: data.clientId,
        category: data.category,
        name: data.name,
        amount: data.amount,
        frequency: data.frequency,
        owner: data.owner,
        notes: data.notes ?? null,
        createdById: session.user.id,
        updatedById: session.user.id,
      })
      .returning();
    return income;
  });

export const updateIncome = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(updateIncomeSchema)
  .handler(async ({ context, data }) => {
    const { session } = context;
    const orgId = session.session.activeOrganizationId!;
    await verifyClientOwnership(data.clientId, orgId);
    const { incomeId, clientId: _, ...fields } = data;
    const [updated] = await db
      .update(clientIncome)
      .set({
        category: fields.category,
        name: fields.name,
        amount: fields.amount,
        frequency: fields.frequency,
        owner: fields.owner,
        notes: fields.notes ?? null,
        updatedById: session.user.id,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(clientIncome.id, incomeId),
          eq(clientIncome.clientId, data.clientId),
        ),
      )
      .returning();
    if (!updated) throw new Error("Income record not found");
    return updated;
  });

export const deleteIncome = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ incomeId: z.string(), clientId: z.string() }))
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!;
    await verifyClientOwnership(data.clientId, orgId);
    await db
      .delete(clientIncome)
      .where(
        and(
          eq(clientIncome.id, data.incomeId),
          eq(clientIncome.clientId, data.clientId),
        ),
      );
    return { success: true };
  });

// ─── Expenses ─────────────────────────────────────────────────────────────────

export const getExpenses = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(clientIdSchema)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!;
    await verifyClientOwnership(data.clientId, orgId);
    return db.query.clientExpense.findMany({
      where: eq(clientExpense.clientId, data.clientId),
      orderBy: (e, { asc }) => [asc(e.category), asc(e.name)],
    });
  });

export const createExpense = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(expenseInputSchema)
  .handler(async ({ context, data }) => {
    const { session } = context;
    const orgId = session.session.activeOrganizationId!;
    await verifyClientOwnership(data.clientId, orgId);
    const [expense] = await db
      .insert(clientExpense)
      .values({
        clientId: data.clientId,
        category: data.category,
        name: data.name,
        amount: data.amount,
        frequency: data.frequency,
        notes: data.notes ?? null,
        createdById: session.user.id,
        updatedById: session.user.id,
      })
      .returning();
    return expense;
  });

export const updateExpense = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(updateExpenseSchema)
  .handler(async ({ context, data }) => {
    const { session } = context;
    const orgId = session.session.activeOrganizationId!;
    await verifyClientOwnership(data.clientId, orgId);
    const { expenseId, clientId: _, ...fields } = data;
    const [updated] = await db
      .update(clientExpense)
      .set({
        category: fields.category,
        name: fields.name,
        amount: fields.amount,
        frequency: fields.frequency,
        notes: fields.notes ?? null,
        updatedById: session.user.id,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(clientExpense.id, expenseId),
          eq(clientExpense.clientId, data.clientId),
        ),
      )
      .returning();
    if (!updated) throw new Error("Expense record not found");
    return updated;
  });

export const deleteExpense = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ expenseId: z.string(), clientId: z.string() }))
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!;
    await verifyClientOwnership(data.clientId, orgId);
    await db
      .delete(clientExpense)
      .where(
        and(
          eq(clientExpense.id, data.expenseId),
          eq(clientExpense.clientId, data.clientId),
        ),
      );
    return { success: true };
  });
