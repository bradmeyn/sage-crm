import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/server/middleware";
import { db } from "@/db/index";
import {
  client,
  clientDependant,
  clientEstate,
  clientBeneficiary,
  clientRiskProfile,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import {
  computeRiskCategory,
  RISK_QUESTIONS,
} from "@/features/clients/fact-find/schemas";

async function verifyClientOwnership(clientId: string, orgId: string) {
  const c = await db.query.client.findFirst({
    where: and(eq(client.id, clientId), eq(client.organizationId, orgId)),
  });
  if (!c) throw new Error("Client not found or unauthorized");
  return c;
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const clientIdSchema = z.object({ clientId: z.string() });

const dependantRelationships = [
  "CHILD",
  "STEPCHILD",
  "PARENT",
  "SIBLING",
  "OTHER",
] as const;

const dependantInputSchema = z.object({
  clientId: z.string(),
  name: z.string().min(1).max(200),
  dateOfBirth: z.string().optional(),
  relationship: z.enum(dependantRelationships).default("CHILD"),
  financiallyDependent: z.boolean().default(true),
  notes: z.string().optional(),
});
const updateDependantSchema = dependantInputSchema.extend({
  dependantId: z.string(),
});

const poaTypes = ["FINANCIAL", "MEDICAL", "BOTH"] as const;
const estateInputSchema = z.object({
  clientId: z.string(),
  hasWill: z.boolean().default(false),
  willLocation: z.string().optional(),
  willUpdatedDate: z.string().optional(),
  executor: z.string().optional(),
  hasPoa: z.boolean().default(false),
  poaType: z.enum(poaTypes).optional(),
  poaAttorney: z.string().optional(),
  hasGuardianship: z.boolean().default(false),
  notes: z.string().optional(),
});

const beneficiaryRelationships = [
  "SPOUSE",
  "CHILD",
  "FAMILY",
  "CHARITY",
  "ESTATE",
  "OTHER",
] as const;
const beneficiaryAppliesTo = ["WILL", "SUPER", "INSURANCE"] as const;
const beneficiaryInputSchema = z.object({
  clientId: z.string(),
  name: z.string().min(1).max(200),
  relationship: z.enum(beneficiaryRelationships).default("OTHER"),
  allocation: z.number().int().min(0).max(100).optional(),
  appliesTo: z.enum(beneficiaryAppliesTo).default("WILL"),
  notes: z.string().optional(),
});
const updateBeneficiarySchema = beneficiaryInputSchema.extend({
  beneficiaryId: z.string(),
});

const personalInputSchema = z.object({
  clientId: z.string(),
  title: z.string().optional(),
  middleName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  maritalStatus: z.string().optional(),
  residencyStatus: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  streetAddress: z.string().optional(),
  suburb: z.string().optional(),
  state: z.string().optional(),
  postcode: z.string().optional(),
  country: z.string().optional(),
  occupation: z.string().optional(),
  employer: z.string().optional(),
  taxFileNumber: z.string().optional(),
});

const healthStatuses = ["EXCELLENT", "GOOD", "FAIR", "POOR"] as const;
const healthInputSchema = z.object({
  clientId: z.string(),
  smoker: z.boolean().nullable().optional(),
  healthStatus: z.enum(healthStatuses).nullable().optional(),
  heightCm: z.number().int().min(0).nullable().optional(),
  weightKg: z.number().int().min(0).nullable().optional(),
});

// ─── Aggregator + completeness ──────────────────────────────────────────────

type SectionStatus = "complete" | "partial" | "empty";

// Loads a client with every fact-find relation. Shared by the aggregator and
// the PDF export so both see identical data.
async function loadFactFind(clientId: string) {
  const c = await db.query.client.findFirst({
    where: eq(client.id, clientId),
    with: {
      assets: true,
      liabilities: true,
      income: true,
      expenses: true,
      goals: true,
      insurance: true,
      dependants: true,
      beneficiaries: true,
      estate: true,
      riskProfile: true,
    },
  });
  if (!c) throw new Error("Client not found");
  return c;
}

export type FactFindData = Awaited<ReturnType<typeof loadFactFind>>;

export const getFactFind = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(clientIdSchema)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!;
    await verifyClientOwnership(data.clientId, orgId);

    const c = await loadFactFind(data.clientId);

    const personalStatus: SectionStatus =
      c.dateOfBirth && (c.email || c.phone) && c.streetAddress
        ? "complete"
        : c.dateOfBirth || c.email || c.phone
          ? "partial"
          : "empty";

    const healthStatus: SectionStatus =
      c.smoker !== null && c.healthStatus ? "complete" : "empty";

    const estateStatus: SectionStatus = !c.estate
      ? "empty"
      : c.estate.hasWill && c.estate.willLocation
        ? "complete"
        : "partial";

    const has = (n: number): SectionStatus => (n > 0 ? "complete" : "empty");

    const riskAnswered = Object.keys(c.riskProfile?.answers ?? {}).length;
    const riskStatus: SectionStatus =
      riskAnswered === 0
        ? "empty"
        : riskAnswered >= RISK_QUESTIONS.length
          ? "complete"
          : "partial";

    const sections = [
      { key: "personal", label: "Personal", status: personalStatus },
      { key: "dependants", label: "Dependants", status: has(c.dependants.length) },
      { key: "assets", label: "Assets", status: has(c.assets.length) },
      { key: "liabilities", label: "Liabilities", status: has(c.liabilities.length) },
      { key: "income", label: "Income", status: has(c.income.length) },
      { key: "expenses", label: "Expenses", status: has(c.expenses.length) },
      { key: "goals", label: "Goals", status: has(c.goals.length) },
      { key: "insurance", label: "Insurance", status: has(c.insurance.length) },
      { key: "estate", label: "Estate", status: estateStatus },
      { key: "beneficiaries", label: "Beneficiaries", status: has(c.beneficiaries.length) },
      { key: "health", label: "Health", status: healthStatus },
      { key: "risk", label: "Risk Profile", status: riskStatus },
    ] as const;

    const completeCount = sections.filter((s) => s.status === "complete").length;
    const completeness = Math.round((completeCount / sections.length) * 100);

    return {
      client: c,
      dependants: c.dependants,
      estate: c.estate ?? null,
      beneficiaries: c.beneficiaries,
      health: {
        smoker: c.smoker,
        healthStatus: c.healthStatus,
        heightCm: c.heightCm,
        weightKg: c.weightKg,
      },
      riskProfile: c.riskProfile ?? null,
      sections,
      completeness,
    };
  });

// ─── PDF export ──────────────────────────────────────────────────────────────

export const exportFactFind = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(clientIdSchema)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!;
    await verifyClientOwnership(data.clientId, orgId);
    const c = await loadFactFind(data.clientId);

    // Dynamic imports keep @react-pdf out of the client bundle entirely.
    const { renderToBuffer } = await import("@react-pdf/renderer");
    const { buildFactFindDocument } = await import(
      "@/features/clients/fact-find/fact-find-document"
    );

    const buffer = await renderToBuffer(buildFactFindDocument(c));
    const filename = `fact-find-${c.firstName}-${c.lastName}.pdf`
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, "-");
    return { filename, base64: Buffer.from(buffer).toString("base64") };
  });

// ─── Dependants ──────────────────────────────────────────────────────────────

export const createDependant = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(dependantInputSchema)
  .handler(async ({ context, data }) => {
    const { session } = context;
    await verifyClientOwnership(
      data.clientId,
      session.session.activeOrganizationId!,
    );
    const [row] = await db
      .insert(clientDependant)
      .values({
        clientId: data.clientId,
        name: data.name,
        dateOfBirth: data.dateOfBirth ?? null,
        relationship: data.relationship,
        financiallyDependent: data.financiallyDependent,
        notes: data.notes ?? null,
        createdById: session.user.id,
        updatedById: session.user.id,
      })
      .returning();
    return row;
  });

export const updateDependant = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(updateDependantSchema)
  .handler(async ({ context, data }) => {
    const { session } = context;
    await verifyClientOwnership(
      data.clientId,
      session.session.activeOrganizationId!,
    );
    const [row] = await db
      .update(clientDependant)
      .set({
        name: data.name,
        dateOfBirth: data.dateOfBirth ?? null,
        relationship: data.relationship,
        financiallyDependent: data.financiallyDependent,
        notes: data.notes ?? null,
        updatedById: session.user.id,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(clientDependant.id, data.dependantId),
          eq(clientDependant.clientId, data.clientId),
        ),
      )
      .returning();
    if (!row) throw new Error("Dependant not found");
    return row;
  });

export const deleteDependant = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ dependantId: z.string(), clientId: z.string() }))
  .handler(async ({ context, data }) => {
    await verifyClientOwnership(
      data.clientId,
      context.session.session.activeOrganizationId!,
    );
    await db
      .delete(clientDependant)
      .where(
        and(
          eq(clientDependant.id, data.dependantId),
          eq(clientDependant.clientId, data.clientId),
        ),
      );
    return { success: true };
  });

// ─── Estate (one row per client; upsert) ─────────────────────────────────────

export const saveEstate = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(estateInputSchema)
  .handler(async ({ context, data }) => {
    const { session } = context;
    await verifyClientOwnership(
      data.clientId,
      session.session.activeOrganizationId!,
    );
    const [row] = await db
      .insert(clientEstate)
      .values({
        clientId: data.clientId,
        hasWill: data.hasWill,
        willLocation: data.willLocation ?? null,
        willUpdatedDate: data.willUpdatedDate ?? null,
        executor: data.executor ?? null,
        hasPoa: data.hasPoa,
        poaType: data.poaType ?? null,
        poaAttorney: data.poaAttorney ?? null,
        hasGuardianship: data.hasGuardianship,
        notes: data.notes ?? null,
        createdById: session.user.id,
        updatedById: session.user.id,
      })
      .onConflictDoUpdate({
        target: clientEstate.clientId,
        set: {
          hasWill: data.hasWill,
          willLocation: data.willLocation ?? null,
          willUpdatedDate: data.willUpdatedDate ?? null,
          executor: data.executor ?? null,
          hasPoa: data.hasPoa,
          poaType: data.poaType ?? null,
          poaAttorney: data.poaAttorney ?? null,
          hasGuardianship: data.hasGuardianship,
          notes: data.notes ?? null,
          updatedById: session.user.id,
          updatedAt: new Date(),
        },
      })
      .returning();
    return row;
  });

// ─── Beneficiaries ───────────────────────────────────────────────────────────

export const createBeneficiary = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(beneficiaryInputSchema)
  .handler(async ({ context, data }) => {
    const { session } = context;
    await verifyClientOwnership(
      data.clientId,
      session.session.activeOrganizationId!,
    );
    const [row] = await db
      .insert(clientBeneficiary)
      .values({
        clientId: data.clientId,
        name: data.name,
        relationship: data.relationship,
        allocation: data.allocation ?? null,
        appliesTo: data.appliesTo,
        notes: data.notes ?? null,
        createdById: session.user.id,
        updatedById: session.user.id,
      })
      .returning();
    return row;
  });

export const updateBeneficiary = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(updateBeneficiarySchema)
  .handler(async ({ context, data }) => {
    const { session } = context;
    await verifyClientOwnership(
      data.clientId,
      session.session.activeOrganizationId!,
    );
    const [row] = await db
      .update(clientBeneficiary)
      .set({
        name: data.name,
        relationship: data.relationship,
        allocation: data.allocation ?? null,
        appliesTo: data.appliesTo,
        notes: data.notes ?? null,
        updatedById: session.user.id,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(clientBeneficiary.id, data.beneficiaryId),
          eq(clientBeneficiary.clientId, data.clientId),
        ),
      )
      .returning();
    if (!row) throw new Error("Beneficiary not found");
    return row;
  });

export const deleteBeneficiary = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ beneficiaryId: z.string(), clientId: z.string() }))
  .handler(async ({ context, data }) => {
    await verifyClientOwnership(
      data.clientId,
      context.session.session.activeOrganizationId!,
    );
    await db
      .delete(clientBeneficiary)
      .where(
        and(
          eq(clientBeneficiary.id, data.beneficiaryId),
          eq(clientBeneficiary.clientId, data.clientId),
        ),
      );
    return { success: true };
  });

// ─── Personal (lives on the client record) ───────────────────────────────────

export const updatePersonal = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(personalInputSchema)
  .handler(async ({ context, data }) => {
    const { session } = context;
    await verifyClientOwnership(
      data.clientId,
      session.session.activeOrganizationId!,
    );
    const [row] = await db
      .update(client)
      .set({
        title: data.title || null,
        middleName: data.middleName || null,
        dateOfBirth: data.dateOfBirth || null,
        gender: data.gender || null,
        maritalStatus: data.maritalStatus || null,
        residencyStatus: data.residencyStatus || null,
        email: data.email || null,
        phone: data.phone || null,
        streetAddress: data.streetAddress || null,
        suburb: data.suburb || null,
        state: data.state || null,
        postcode: data.postcode || null,
        country: data.country || null,
        occupation: data.occupation || null,
        employer: data.employer || null,
        taxFileNumber: data.taxFileNumber || null,
        updatedById: session.user.id,
        updatedAt: new Date(),
      })
      .where(eq(client.id, data.clientId))
      .returning();
    return row;
  });

// ─── Health (lives on the client record) ─────────────────────────────────────

export const updateHealth = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(healthInputSchema)
  .handler(async ({ context, data }) => {
    const { session } = context;
    await verifyClientOwnership(
      data.clientId,
      session.session.activeOrganizationId!,
    );
    const [row] = await db
      .update(client)
      .set({
        smoker: data.smoker ?? null,
        healthStatus: data.healthStatus ?? null,
        heightCm: data.heightCm ?? null,
        weightKg: data.weightKg ?? null,
        updatedById: session.user.id,
        updatedAt: new Date(),
      })
      .where(eq(client.id, data.clientId))
      .returning({
        smoker: client.smoker,
        healthStatus: client.healthStatus,
        heightCm: client.heightCm,
        weightKg: client.weightKg,
      });
    return row;
  });

// ─── Risk profile (upsert; category computed server-side) ────────────────────

const riskCategories = [
  "CONSERVATIVE",
  "MODERATELY_CONSERVATIVE",
  "BALANCED",
  "GROWTH",
  "HIGH_GROWTH",
] as const;

export const saveRiskProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      clientId: z.string(),
      answers: z.record(z.string(), z.number()),
      confirmedCategory: z.enum(riskCategories).nullable().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const { session } = context;
    await verifyClientOwnership(
      data.clientId,
      session.session.activeOrganizationId!,
    );
    const category = computeRiskCategory(data.answers) as
      | (typeof riskCategories)[number]
      | null;
    const [row] = await db
      .insert(clientRiskProfile)
      .values({
        clientId: data.clientId,
        answers: data.answers,
        category,
        confirmedCategory: data.confirmedCategory ?? null,
        createdById: session.user.id,
        updatedById: session.user.id,
      })
      .onConflictDoUpdate({
        target: clientRiskProfile.clientId,
        set: {
          answers: data.answers,
          category,
          confirmedCategory: data.confirmedCategory ?? null,
          updatedById: session.user.id,
          updatedAt: new Date(),
        },
      })
      .returning();
    return row;
  });
