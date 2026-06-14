import { createServerFn } from "@tanstack/react-start";
import { createHash } from "crypto";
import { db } from "@/db/index";
import { client, factFindRequest, organization } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Sections a client can self-complete on the public portal.
const PORTAL_SECTIONS: { key: string; label: string }[] = [
  { key: "personal", label: "Personal details" },
  { key: "dependants", label: "Dependants" },
  { key: "estate", label: "Estate planning" },
  { key: "beneficiaries", label: "Beneficiaries" },
  { key: "health", label: "Health" },
  { key: "risk", label: "Risk profile" },
];
const PORTAL_KEYS = new Set(PORTAL_SECTIONS.map((s) => s.key));
const MAX_DOB_ATTEMPTS = 5;

function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

type RequestRow = typeof factFindRequest.$inferSelect;

async function findByToken(token: string): Promise<RequestRow | undefined> {
  if (!token) return undefined;
  return db.query.factFindRequest.findFirst({
    where: eq(factFindRequest.tokenHash, hashToken(token)),
  });
}

/** Live + staged values for the requested portal sections. */
async function buildInitialData(req: RequestRow) {
  const c = await db.query.client.findFirst({
    where: eq(client.id, req.clientId),
    with: {
      dependants: true,
      beneficiaries: true,
      estate: true,
      riskProfile: true,
    },
  });
  if (!c) throw new Error("Client not found");

  const prefill: Record<string, any> = {
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
  };

  const staged = (req.responseData ?? {}) as Record<string, any>;
  const sections = PORTAL_SECTIONS.filter((s) =>
    req.requestedSections.includes(s.key),
  );
  const data: Record<string, any> = {};
  for (const s of sections) data[s.key] = staged[s.key] ?? prefill[s.key];

  return { clientName: c.firstName, sections, data };
}

// ─── Token check (no data leaked) ────────────────────────────────────────────

export const checkFactFindToken = createServerFn({ method: "GET" })
  .validator(z.object({ token: z.string() }))
  .handler(async ({ data }) => {
    const req = await findByToken(data.token);
    if (!req) return { state: "invalid" as const };
    if (req.status === "REVOKED") return { state: "invalid" as const };
    if (req.status === "IMPORTED") return { state: "closed" as const };
    if (new Date(req.expiresAt) < new Date()) {
      if (req.status !== "EXPIRED") {
        await db
          .update(factFindRequest)
          .set({ status: "EXPIRED" })
          .where(eq(factFindRequest.id, req.id));
      }
      return { state: "expired" as const };
    }
    if (req.dobAttempts >= MAX_DOB_ATTEMPTS)
      return { state: "locked" as const };

    const org = await db.query.organization.findFirst({
      where: eq(organization.id, req.organizationId),
    });
    return {
      state: "ok" as const,
      orgName: org?.name ?? "Your adviser",
      alreadySubmitted: req.status === "SUBMITTED",
    };
  });

// Shared guard for the authenticated-by-DOB actions.
async function authorize(token: string, dateOfBirth: string) {
  const req = await findByToken(token);
  if (!req) throw new Error("This link is no longer valid");
  if (req.status === "REVOKED" || req.status === "IMPORTED")
    throw new Error("This link is no longer active");
  if (new Date(req.expiresAt) < new Date()) {
    await db
      .update(factFindRequest)
      .set({ status: "EXPIRED" })
      .where(eq(factFindRequest.id, req.id));
    throw new Error("This link has expired");
  }
  if (req.dobAttempts >= MAX_DOB_ATTEMPTS)
    throw new Error("Too many incorrect attempts — this link is locked");

  const c = await db.query.client.findFirst({
    where: eq(client.id, req.clientId),
    columns: { dateOfBirth: true },
  });
  if (!c?.dateOfBirth || c.dateOfBirth !== dateOfBirth) {
    const attempts = req.dobAttempts + 1;
    await db
      .update(factFindRequest)
      .set({ dobAttempts: attempts })
      .where(eq(factFindRequest.id, req.id));
    const left = MAX_DOB_ATTEMPTS - attempts;
    throw new Error(
      left > 0
        ? `That date of birth doesn't match. ${left} attempt${left === 1 ? "" : "s"} remaining.`
        : "Too many incorrect attempts — this link is now locked.",
    );
  }
  // Correct DOB: reset the counter.
  if (req.dobAttempts > 0) {
    await db
      .update(factFindRequest)
      .set({ dobAttempts: 0 })
      .where(eq(factFindRequest.id, req.id));
  }
  return req;
}

// ─── Open (verify DOB → return form data) ────────────────────────────────────

export const openFactFind = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string(), dateOfBirth: z.string() }))
  .handler(async ({ data }) => {
    const req = await authorize(data.token, data.dateOfBirth);
    return buildInitialData(req);
  });

// Merge submitted sections into staging, keeping only requested portal keys.
function mergeResponses(
  req: RequestRow,
  responses: Record<string, unknown>,
): Record<string, unknown> {
  const current = (req.responseData ?? {}) as Record<string, unknown>;
  const merged = { ...current };
  for (const [key, value] of Object.entries(responses)) {
    if (PORTAL_KEYS.has(key) && req.requestedSections.includes(key)) {
      merged[key] = value;
    }
  }
  return merged;
}

// ─── Save progress ───────────────────────────────────────────────────────────

export const saveFactFind = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string(),
      dateOfBirth: z.string(),
      responses: z.record(z.string(), z.unknown()),
    }),
  )
  .handler(async ({ data }) => {
    const req = await authorize(data.token, data.dateOfBirth);
    await db
      .update(factFindRequest)
      .set({
        responseData: mergeResponses(req, data.responses),
        updatedAt: new Date(),
      })
      .where(eq(factFindRequest.id, req.id));
    return { success: true };
  });

// ─── Submit (save + mark submitted) ──────────────────────────────────────────

export const submitFactFind = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string(),
      dateOfBirth: z.string(),
      responses: z.record(z.string(), z.unknown()),
    }),
  )
  .handler(async ({ data }) => {
    const req = await authorize(data.token, data.dateOfBirth);
    await db
      .update(factFindRequest)
      .set({
        responseData: mergeResponses(req, data.responses),
        status: "SUBMITTED",
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(factFindRequest.id, req.id));
    return { success: true };
  });
