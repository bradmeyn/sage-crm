import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/server/middleware";
import { db } from "@/db/index";
import { client, clientInsurance } from "@/db/schema";
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

const insuranceCategories = [
  "LIFE",
  "TPD",
  "TRAUMA",
  "INCOME_PROTECTION",
  "HEALTH",
  "HOME_CONTENTS",
  "VEHICLE",
  "BUSINESS",
  "OTHER",
] as const;

const premiumFrequencies = ["MONTHLY", "QUARTERLY", "ANNUALLY"] as const;
const ownerValues = ["CLIENT", "PARTNER", "JOINT"] as const;
const insuranceStatuses = ["ACTIVE", "CANCELLED", "LAPSED", "PENDING"] as const;

const insuranceInputSchema = z.object({
  clientId: z.string(),
  category: z.enum(insuranceCategories).default("OTHER"),
  insurer: z.string().min(1).max(200),
  policyNumber: z.string().optional(),
  coverAmount: z.number().int().min(0).optional(),
  premium: z.number().int().min(0).optional(),
  premiumFrequency: z.enum(premiumFrequencies).default("MONTHLY"),
  owner: z.enum(ownerValues).default("CLIENT"),
  status: z.enum(insuranceStatuses).default("ACTIVE"),
  startDate: z.string().optional(),
  reviewDate: z.string().optional(),
  notes: z.string().optional(),
});

const updateInsuranceSchema = insuranceInputSchema.extend({
  insuranceId: z.string(),
});

const clientIdSchema = z.object({ clientId: z.string() });

// ─── Handlers ─────────────────────────────────────────────────────────────────

export const getInsurance = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(clientIdSchema)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!;
    await verifyClientOwnership(data.clientId, orgId);
    return db.query.clientInsurance.findMany({
      where: eq(clientInsurance.clientId, data.clientId),
      orderBy: (i, { asc }) => [asc(i.status), asc(i.category)],
    });
  });

export const createInsurance = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(insuranceInputSchema)
  .handler(async ({ context, data }) => {
    const { session } = context;
    const orgId = session.session.activeOrganizationId!;
    await verifyClientOwnership(data.clientId, orgId);
    const [policy] = await db
      .insert(clientInsurance)
      .values({
        clientId: data.clientId,
        category: data.category,
        insurer: data.insurer,
        policyNumber: data.policyNumber ?? null,
        coverAmount: data.coverAmount ?? null,
        premium: data.premium ?? null,
        premiumFrequency: data.premiumFrequency,
        owner: data.owner,
        status: data.status,
        startDate: data.startDate ?? null,
        reviewDate: data.reviewDate ?? null,
        notes: data.notes ?? null,
        createdById: session.user.id,
        updatedById: session.user.id,
      })
      .returning();
    return policy;
  });

export const updateInsurance = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(updateInsuranceSchema)
  .handler(async ({ context, data }) => {
    const { session } = context;
    const orgId = session.session.activeOrganizationId!;
    await verifyClientOwnership(data.clientId, orgId);
    const { insuranceId, clientId: _, ...fields } = data;
    const [updated] = await db
      .update(clientInsurance)
      .set({
        category: fields.category,
        insurer: fields.insurer,
        policyNumber: fields.policyNumber ?? null,
        coverAmount: fields.coverAmount ?? null,
        premium: fields.premium ?? null,
        premiumFrequency: fields.premiumFrequency,
        owner: fields.owner,
        status: fields.status,
        startDate: fields.startDate ?? null,
        reviewDate: fields.reviewDate ?? null,
        notes: fields.notes ?? null,
        updatedById: session.user.id,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(clientInsurance.id, insuranceId),
          eq(clientInsurance.clientId, data.clientId),
        ),
      )
      .returning();
    if (!updated) throw new Error("Insurance policy not found");
    return updated;
  });

export const deleteInsurance = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ insuranceId: z.string(), clientId: z.string() }))
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!;
    await verifyClientOwnership(data.clientId, orgId);
    await db
      .delete(clientInsurance)
      .where(
        and(
          eq(clientInsurance.id, data.insuranceId),
          eq(clientInsurance.clientId, data.clientId),
        ),
      );
    return { success: true };
  });
