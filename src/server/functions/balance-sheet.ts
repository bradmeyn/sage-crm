import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/server/middleware";
import { db } from "@/db/index";
import { client, clientAsset, clientLiability } from "@/db/schema";
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

const assetCategories = [
  "CASH_AND_BANK",
  "PROPERTY",
  "INVESTMENT",
  "SUPERANNUATION",
  "VEHICLE",
  "BUSINESS",
  "OTHER",
] as const;

const liabilityCategories = [
  "MORTGAGE",
  "INVESTMENT_LOAN",
  "PERSONAL_LOAN",
  "CREDIT_CARD",
  "VEHICLE_LOAN",
  "OTHER",
] as const;

const ownerValues = ["CLIENT", "PARTNER", "JOINT"] as const;

const assetInputSchema = z.object({
  clientId: z.string(),
  category: z.enum(assetCategories).default("OTHER"),
  name: z.string().min(1).max(200),
  value: z.number().int().min(0),
  owner: z.enum(ownerValues).default("CLIENT"),
  notes: z.string().optional(),
});

const updateAssetSchema = assetInputSchema.extend({
  assetId: z.string(),
});

const liabilityInputSchema = z.object({
  clientId: z.string(),
  category: z.enum(liabilityCategories).default("OTHER"),
  name: z.string().min(1).max(200),
  balance: z.number().int().min(0),
  limit: z.number().int().min(0).optional(),
  interestRate: z.number().int().min(0).optional(),
  owner: z.enum(ownerValues).default("CLIENT"),
  notes: z.string().optional(),
});

const updateLiabilitySchema = liabilityInputSchema.extend({
  liabilityId: z.string(),
});

const clientIdSchema = z.object({ clientId: z.string() });

// ─── Assets ───────────────────────────────────────────────────────────────────

export const getAssets = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(clientIdSchema)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!;
    await verifyClientOwnership(data.clientId, orgId);
    return db.query.clientAsset.findMany({
      where: eq(clientAsset.clientId, data.clientId),
      orderBy: (a, { asc }) => [asc(a.category), asc(a.name)],
    });
  });

export const createAsset = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(assetInputSchema)
  .handler(async ({ context, data }) => {
    const { session } = context;
    const orgId = session.session.activeOrganizationId!;
    await verifyClientOwnership(data.clientId, orgId);
    const [asset] = await db
      .insert(clientAsset)
      .values({
        clientId: data.clientId,
        category: data.category,
        name: data.name,
        value: data.value,
        owner: data.owner,
        notes: data.notes ?? null,
        createdById: session.user.id,
        updatedById: session.user.id,
      })
      .returning();
    return asset;
  });

export const updateAsset = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(updateAssetSchema)
  .handler(async ({ context, data }) => {
    const { session } = context;
    const orgId = session.session.activeOrganizationId!;
    await verifyClientOwnership(data.clientId, orgId);
    const { assetId, clientId: _, ...fields } = data;
    const [updated] = await db
      .update(clientAsset)
      .set({
        category: fields.category,
        name: fields.name,
        value: fields.value,
        owner: fields.owner,
        notes: fields.notes ?? null,
        updatedById: session.user.id,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(clientAsset.id, assetId),
          eq(clientAsset.clientId, data.clientId),
        ),
      )
      .returning();
    if (!updated) throw new Error("Asset not found");
    return updated;
  });

export const deleteAsset = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ assetId: z.string(), clientId: z.string() }))
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!;
    await verifyClientOwnership(data.clientId, orgId);
    await db
      .delete(clientAsset)
      .where(
        and(
          eq(clientAsset.id, data.assetId),
          eq(clientAsset.clientId, data.clientId),
        ),
      );
    return { success: true };
  });

// ─── Liabilities ──────────────────────────────────────────────────────────────

export const getLiabilities = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(clientIdSchema)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!;
    await verifyClientOwnership(data.clientId, orgId);
    return db.query.clientLiability.findMany({
      where: eq(clientLiability.clientId, data.clientId),
      orderBy: (l, { asc }) => [asc(l.category), asc(l.name)],
    });
  });

export const createLiability = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(liabilityInputSchema)
  .handler(async ({ context, data }) => {
    const { session } = context;
    const orgId = session.session.activeOrganizationId!;
    await verifyClientOwnership(data.clientId, orgId);
    const [liability] = await db
      .insert(clientLiability)
      .values({
        clientId: data.clientId,
        category: data.category,
        name: data.name,
        balance: data.balance,
        limit: data.limit ?? null,
        interestRate: data.interestRate ?? null,
        owner: data.owner,
        notes: data.notes ?? null,
        createdById: session.user.id,
        updatedById: session.user.id,
      })
      .returning();
    return liability;
  });

export const updateLiability = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(updateLiabilitySchema)
  .handler(async ({ context, data }) => {
    const { session } = context;
    const orgId = session.session.activeOrganizationId!;
    await verifyClientOwnership(data.clientId, orgId);
    const { liabilityId, clientId: _, ...fields } = data;
    const [updated] = await db
      .update(clientLiability)
      .set({
        category: fields.category,
        name: fields.name,
        balance: fields.balance,
        limit: fields.limit ?? null,
        interestRate: fields.interestRate ?? null,
        owner: fields.owner,
        notes: fields.notes ?? null,
        updatedById: session.user.id,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(clientLiability.id, liabilityId),
          eq(clientLiability.clientId, data.clientId),
        ),
      )
      .returning();
    if (!updated) throw new Error("Liability not found");
    return updated;
  });

export const deleteLiability = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ liabilityId: z.string(), clientId: z.string() }))
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!;
    await verifyClientOwnership(data.clientId, orgId);
    await db
      .delete(clientLiability)
      .where(
        and(
          eq(clientLiability.id, data.liabilityId),
          eq(clientLiability.clientId, data.clientId),
        ),
      );
    return { success: true };
  });
