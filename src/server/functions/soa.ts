import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/server/middleware";
import { db } from "@/db/index";
import {
  strategyTemplate,
  soa,
  soaRecommendation,
  client,
} from "@/db/schema";
import { eq, and, asc, desc } from "drizzle-orm";
import { z } from "zod";
import { SYSTEM_STRATEGIES } from "@/features/soa/schemas";

// Lazily seed the system strategy library on first access per org.
async function seedStrategies(orgId: string) {
  const existing = await db.query.strategyTemplate.findFirst({
    where: and(
      eq(strategyTemplate.organizationId, orgId),
      eq(strategyTemplate.isSystem, true),
    ),
  });
  if (existing) return;
  await db.insert(strategyTemplate).values(
    SYSTEM_STRATEGIES.map((s, i) => ({
      organizationId: orgId,
      name: s.name,
      category: s.category,
      type: s.type,
      wording: s.wording,
      benefits: s.benefits,
      warnings: s.warnings,
      isSystem: true,
      sortOrder: i,
    })),
  );
}

export const getStrategyTemplates = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const orgId = context.session.session.activeOrganizationId!;
    await seedStrategies(orgId);
    return db.query.strategyTemplate.findMany({
      where: eq(strategyTemplate.organizationId, orgId),
      orderBy: [asc(strategyTemplate.sortOrder), asc(strategyTemplate.name)],
    });
  });

// ─── SOA documents ───────────────────────────────────────────────────────────

async function verifyClient(clientId: string, orgId: string) {
  const c = await db.query.client.findFirst({
    where: and(eq(client.id, clientId), eq(client.organizationId, orgId)),
  });
  if (!c) throw new Error("Client not found or unauthorized");
  return c;
}

async function verifySoa(soaId: string, orgId: string) {
  const s = await db.query.soa.findFirst({
    where: and(eq(soa.id, soaId), eq(soa.organizationId, orgId)),
  });
  if (!s) throw new Error("SOA not found or unauthorized");
  return s;
}

export const getSoas = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ clientId: z.string() }))
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!;
    await verifyClient(data.clientId, orgId);
    return db.query.soa.findMany({
      where: and(eq(soa.clientId, data.clientId), eq(soa.organizationId, orgId)),
      orderBy: [desc(soa.createdAt)],
      columns: { id: true, title: true, status: true, createdAt: true, updatedAt: true },
    });
  });

export const createSoa = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ clientId: z.string() }))
  .handler(async ({ context, data }) => {
    const { session } = context;
    const orgId = session.session.activeOrganizationId!;
    await verifyClient(data.clientId, orgId);
    const [row] = await db
      .insert(soa)
      .values({
        organizationId: orgId,
        clientId: data.clientId,
        createdById: session.user.id,
        updatedById: session.user.id,
      })
      .returning({ id: soa.id });
    return row;
  });

export const getSoa = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ soaId: z.string() }))
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!;
    const s = await db.query.soa.findFirst({
      where: and(eq(soa.id, data.soaId), eq(soa.organizationId, orgId)),
      with: {
        recommendations: {
          orderBy: [asc(soaRecommendation.sortOrder)],
        },
      },
    });
    if (!s) throw new Error("SOA not found");
    return s;
  });

export const updateSoa = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      soaId: z.string(),
      title: z.string().optional(),
      scope: z.string().optional(),
      intro: z.string().optional(),
      status: z.enum(["DRAFT", "ISSUED"]).optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const { session } = context;
    const orgId = session.session.activeOrganizationId!;
    await verifySoa(data.soaId, orgId);
    const [row] = await db
      .update(soa)
      .set({
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.scope !== undefined ? { scope: data.scope } : {}),
        ...(data.intro !== undefined ? { intro: data.intro } : {}),
        ...(data.status !== undefined
          ? {
              status: data.status,
              issuedAt: data.status === "ISSUED" ? new Date() : null,
            }
          : {}),
        updatedById: session.user.id,
        updatedAt: new Date(),
      })
      .where(eq(soa.id, data.soaId))
      .returning();
    return row;
  });

export const deleteSoa = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ soaId: z.string() }))
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!;
    await verifySoa(data.soaId, orgId);
    await db.delete(soa).where(eq(soa.id, data.soaId));
    return { success: true };
  });

// ─── Recommendations ─────────────────────────────────────────────────────────

export const addRecommendation = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      soaId: z.string(),
      templateId: z.string().optional(),
      category: z.string().optional(),
      type: z.string().optional(),
      title: z.string().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!;
    await verifySoa(data.soaId, orgId);

    let values = {
      category: data.category ?? "OTHER",
      type: data.type ?? "GENERIC",
      title: data.title ?? "New recommendation",
      wording: null as string | null,
      benefits: [] as string[],
      warnings: [] as string[],
      templateId: null as string | null,
    };

    if (data.templateId) {
      const t = await db.query.strategyTemplate.findFirst({
        where: and(
          eq(strategyTemplate.id, data.templateId),
          eq(strategyTemplate.organizationId, orgId),
        ),
      });
      if (t) {
        values = {
          category: t.category,
          type: t.type,
          title: t.name,
          wording: t.wording,
          benefits: t.benefits,
          warnings: t.warnings,
          templateId: t.id,
        };
      }
    }

    const last = await db.query.soaRecommendation.findFirst({
      where: eq(soaRecommendation.soaId, data.soaId),
      orderBy: [desc(soaRecommendation.sortOrder)],
      columns: { sortOrder: true },
    });

    const [row] = await db
      .insert(soaRecommendation)
      .values({
        soaId: data.soaId,
        ...values,
        sortOrder: (last?.sortOrder ?? -1) + 1,
      })
      .returning();
    return row;
  });

const recArgs = z.object({
  recommendationId: z.string(),
  soaId: z.string(),
});

export const updateRecommendation = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    recArgs.extend({
      title: z.string().optional(),
      wording: z.string().optional(),
      benefits: z.array(z.string()).optional(),
      warnings: z.array(z.string()).optional(),
      data: z.record(z.string(), z.unknown()).optional(),
      goalIds: z.array(z.string()).optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!;
    await verifySoa(data.soaId, orgId);
    const [row] = await db
      .update(soaRecommendation)
      .set({
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.wording !== undefined ? { wording: data.wording } : {}),
        ...(data.benefits !== undefined ? { benefits: data.benefits } : {}),
        ...(data.warnings !== undefined ? { warnings: data.warnings } : {}),
        ...(data.data !== undefined ? { data: data.data } : {}),
        ...(data.goalIds !== undefined ? { goalIds: data.goalIds } : {}),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(soaRecommendation.id, data.recommendationId),
          eq(soaRecommendation.soaId, data.soaId),
        ),
      )
      .returning();
    return row;
  });

export const deleteRecommendation = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(recArgs)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!;
    await verifySoa(data.soaId, orgId);
    await db
      .delete(soaRecommendation)
      .where(
        and(
          eq(soaRecommendation.id, data.recommendationId),
          eq(soaRecommendation.soaId, data.soaId),
        ),
      );
    return { success: true };
  });

export const reorderRecommendations = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ soaId: z.string(), orderedIds: z.array(z.string()) }))
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!;
    await verifySoa(data.soaId, orgId);
    await Promise.all(
      data.orderedIds.map((id, i) =>
        db
          .update(soaRecommendation)
          .set({ sortOrder: i })
          .where(
            and(
              eq(soaRecommendation.id, id),
              eq(soaRecommendation.soaId, data.soaId),
            ),
          ),
      ),
    );
    return { success: true };
  });
