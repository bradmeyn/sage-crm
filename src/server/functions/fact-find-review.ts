import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/server/middleware";
import { db } from "@/db/index";
import {
  client,
  factFindRequest,
  clientDependant,
  clientBeneficiary,
  clientEstate,
  clientRiskProfile,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { computeRiskCategory } from "@/features/clients/fact-find/schemas";

const SECTION_LABELS: Record<string, string> = {
  personal: "Personal details",
  dependants: "Dependants",
  estate: "Estate planning",
  beneficiaries: "Beneficiaries",
  health: "Health",
  risk: "Risk profile",
};

async function verifyClientOwnership(clientId: string, orgId: string) {
  const c = await db.query.client.findFirst({
    where: and(eq(client.id, clientId), eq(client.organizationId, orgId)),
  });
  if (!c) throw new Error("Client not found or unauthorized");
  return c;
}

async function loadRequest(requestId: string, clientId: string, orgId: string) {
  const req = await db.query.factFindRequest.findFirst({
    where: and(
      eq(factFindRequest.id, requestId),
      eq(factFindRequest.organizationId, orgId),
      eq(factFindRequest.clientId, clientId),
    ),
  });
  if (!req) throw new Error("Request not found");
  return req;
}

// Current live values for the portal-editable sections (to diff against).
async function currentValues(clientId: string) {
  const c = await db.query.client.findFirst({
    where: eq(client.id, clientId),
    with: {
      dependants: true,
      beneficiaries: true,
      estate: true,
      riskProfile: true,
    },
  });
  if (!c) throw new Error("Client not found");
  return {
    personal: {
      title: c.title ?? "",
      dateOfBirth: c.dateOfBirth ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
      streetAddress: c.streetAddress ?? "",
      suburb: c.suburb ?? "",
      state: c.state ?? "",
      postcode: c.postcode ?? "",
      country: c.country ?? "",
      occupation: c.occupation ?? "",
      employer: c.employer ?? "",
    },
    dependants: c.dependants.map((d) => ({
      name: d.name,
      dateOfBirth: d.dateOfBirth ?? "",
      relationship: d.relationship,
      financiallyDependent: d.financiallyDependent,
      notes: d.notes ?? "",
    })),
    estate: c.estate
      ? {
          hasWill: c.estate.hasWill,
          willLocation: c.estate.willLocation ?? "",
          executor: c.estate.executor ?? "",
          hasPoa: c.estate.hasPoa,
          poaType: c.estate.poaType ?? "",
          hasGuardianship: c.estate.hasGuardianship,
          notes: c.estate.notes ?? "",
        }
      : { hasWill: false, hasPoa: false, hasGuardianship: false },
    beneficiaries: c.beneficiaries.map((b) => ({
      name: b.name,
      relationship: b.relationship,
      allocation: b.allocation,
      appliesTo: b.appliesTo,
    })),
    health: {
      smoker: c.smoker,
      healthStatus: c.healthStatus ?? "",
      heightCm: c.heightCm,
      weightKg: c.weightKg,
    },
    risk: { answers: c.riskProfile?.answers ?? {} },
  } as Record<string, any>;
}

// ─── Review (diff submitted vs live) ─────────────────────────────────────────

export const getFactFindSubmission = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ requestId: z.string(), clientId: z.string() }))
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!;
    await verifyClientOwnership(data.clientId, orgId);
    const req = await loadRequest(data.requestId, data.clientId, orgId);

    const proposed = (req.responseData ?? {}) as Record<string, any>;
    const current = await currentValues(data.clientId);

    const sections = req.requestedSections
      .filter((key) => key in proposed && key in SECTION_LABELS)
      .map((key) => ({
        key,
        label: SECTION_LABELS[key],
        proposed: proposed[key],
        current: current[key],
        changed:
          JSON.stringify(proposed[key]) !== JSON.stringify(current[key]),
      }));

    return { status: req.status, submittedAt: req.submittedAt, sections };
  });

// ─── Import one section into the live record ─────────────────────────────────

export const importFactFindSection = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      requestId: z.string(),
      clientId: z.string(),
      sectionKey: z.string(),
    }),
  )
  .handler(async ({ context, data }) => {
    const { session } = context;
    const orgId = session.session.activeOrganizationId!;
    await verifyClientOwnership(data.clientId, orgId);
    const req = await loadRequest(data.requestId, data.clientId, orgId);

    const proposed = (req.responseData ?? {}) as Record<string, any>;
    const value = proposed[data.sectionKey];
    if (value == null) throw new Error("Nothing submitted for this section");

    const uid = session.user.id;
    const clientId = data.clientId;

    switch (data.sectionKey) {
      case "personal":
        await db
          .update(client)
          .set({
            title: value.title || null,
            dateOfBirth: value.dateOfBirth || null,
            email: value.email || null,
            phone: value.phone || null,
            streetAddress: value.streetAddress || null,
            suburb: value.suburb || null,
            state: value.state || null,
            postcode: value.postcode || null,
            country: value.country || null,
            occupation: value.occupation || null,
            employer: value.employer || null,
            updatedById: uid,
            updatedAt: new Date(),
          })
          .where(eq(client.id, clientId));
        break;

      case "health":
        await db
          .update(client)
          .set({
            smoker: value.smoker ?? null,
            healthStatus: value.healthStatus || null,
            heightCm: value.heightCm ?? null,
            weightKg: value.weightKg ?? null,
            updatedById: uid,
            updatedAt: new Date(),
          })
          .where(eq(client.id, clientId));
        break;

      case "estate":
        await db
          .insert(clientEstate)
          .values({
            clientId,
            hasWill: !!value.hasWill,
            willLocation: value.willLocation || null,
            executor: value.executor || null,
            hasPoa: !!value.hasPoa,
            poaType: value.poaType || null,
            hasGuardianship: !!value.hasGuardianship,
            notes: value.notes || null,
            createdById: uid,
            updatedById: uid,
          })
          .onConflictDoUpdate({
            target: clientEstate.clientId,
            set: {
              hasWill: !!value.hasWill,
              willLocation: value.willLocation || null,
              executor: value.executor || null,
              hasPoa: !!value.hasPoa,
              poaType: value.poaType || null,
              hasGuardianship: !!value.hasGuardianship,
              notes: value.notes || null,
              updatedById: uid,
              updatedAt: new Date(),
            },
          });
        break;

      case "dependants":
        // The client's submitted list is the intended full list — replace.
        await db
          .delete(clientDependant)
          .where(eq(clientDependant.clientId, clientId));
        if (Array.isArray(value) && value.length) {
          await db.insert(clientDependant).values(
            value.map((d: any) => ({
              clientId,
              name: String(d.name ?? "").slice(0, 200) || "Unnamed",
              dateOfBirth: d.dateOfBirth || null,
              relationship: d.relationship || "CHILD",
              financiallyDependent: d.financiallyDependent !== false,
              notes: d.notes || null,
              createdById: uid,
              updatedById: uid,
            })),
          );
        }
        break;

      case "beneficiaries":
        await db
          .delete(clientBeneficiary)
          .where(eq(clientBeneficiary.clientId, clientId));
        if (Array.isArray(value) && value.length) {
          await db.insert(clientBeneficiary).values(
            value.map((b: any) => ({
              clientId,
              name: String(b.name ?? "").slice(0, 200) || "Unnamed",
              relationship: b.relationship || "OTHER",
              allocation:
                b.allocation == null ? null : Number(b.allocation) || null,
              appliesTo: b.appliesTo || "WILL",
              createdById: uid,
              updatedById: uid,
            })),
          );
        }
        break;

      case "risk": {
        const answers = (value.answers ?? {}) as Record<string, number>;
        const category = computeRiskCategory(answers) as
          | "CONSERVATIVE"
          | "MODERATELY_CONSERVATIVE"
          | "BALANCED"
          | "GROWTH"
          | "HIGH_GROWTH"
          | null;
        await db
          .insert(clientRiskProfile)
          .values({ clientId, answers, category, createdById: uid, updatedById: uid })
          .onConflictDoUpdate({
            target: clientRiskProfile.clientId,
            set: { answers, category, updatedById: uid, updatedAt: new Date() },
          });
        break;
      }

      default:
        throw new Error("This section cannot be imported");
    }

    return { success: true };
  });

// ─── Finish review ───────────────────────────────────────────────────────────

export const completeFactFindReview = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ requestId: z.string(), clientId: z.string() }))
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!;
    await verifyClientOwnership(data.clientId, orgId);
    await loadRequest(data.requestId, data.clientId, orgId);
    await db
      .update(factFindRequest)
      .set({ status: "IMPORTED", updatedAt: new Date() })
      .where(
        and(
          eq(factFindRequest.id, data.requestId),
          eq(factFindRequest.organizationId, orgId),
        ),
      );
    return { success: true };
  });
