import { createServerFn } from "@tanstack/react-start";
import { randomBytes, createHash } from "crypto";
import { authMiddleware } from "@/server/middleware";
import { db } from "@/db/index";
import { client, factFindRequest, organization } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { sendFactFindEmail } from "@/lib/email";

const SECTION_KEYS = [
  "personal",
  "dependants",
  "assets",
  "liabilities",
  "income",
  "expenses",
  "goals",
  "insurance",
  "estate",
  "beneficiaries",
  "health",
] as const;

const EXPIRY_DAYS = 14;

// Module-private so `crypto` stays inside server-fn handlers and is stripped
// from the client bundle. Phase B's public route defines its own lookup hash.
function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

async function verifyClientOwnership(clientId: string, orgId: string) {
  const c = await db.query.client.findFirst({
    where: and(eq(client.id, clientId), eq(client.organizationId, orgId)),
  });
  if (!c) throw new Error("Client not found or unauthorized");
  return c;
}

// ─── Create + send ───────────────────────────────────────────────────────────

export const createFactFindRequest = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      clientId: z.string(),
      sections: z.array(z.enum(SECTION_KEYS)).min(1),
    }),
  )
  .handler(async ({ context, data }) => {
    const { session } = context;
    const orgId = session.session.activeOrganizationId!;
    const c = await verifyClientOwnership(data.clientId, orgId);

    if (!c.email) {
      throw new Error("Client has no email address on file");
    }
    if (!c.dateOfBirth) {
      throw new Error(
        "Client needs a date of birth on file before sending (used to verify the link)",
      );
    }

    const rawToken = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const [request] = await db
      .insert(factFindRequest)
      .values({
        organizationId: orgId,
        clientId: data.clientId,
        tokenHash: hashToken(rawToken),
        requestedSections: data.sections,
        status: "PENDING",
        expiresAt,
        sentAt: new Date(),
        createdById: session.user.id,
      })
      .returning();

    const org = await db.query.organization.findFirst({
      where: eq(organization.id, orgId),
    });
    const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
    const link = `${baseUrl}/fact-find?token=${rawToken}`;

    await sendFactFindEmail({
      clientName: c.firstName,
      orgName: org?.name ?? "Your adviser",
      email: c.email,
      link,
      expiresInDays: EXPIRY_DAYS,
    });

    return { id: request.id, status: request.status };
  });

// ─── List (adviser view) ─────────────────────────────────────────────────────

export const getFactFindRequests = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ clientId: z.string() }))
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!;
    await verifyClientOwnership(data.clientId, orgId);

    const rows = await db.query.factFindRequest.findMany({
      where: and(
        eq(factFindRequest.clientId, data.clientId),
        eq(factFindRequest.organizationId, orgId),
      ),
      orderBy: [desc(factFindRequest.createdAt)],
      columns: {
        id: true,
        status: true,
        requestedSections: true,
        expiresAt: true,
        sentAt: true,
        submittedAt: true,
        createdAt: true,
      },
    });
    return rows;
  });

// ─── Revoke ──────────────────────────────────────────────────────────────────

export const revokeFactFindRequest = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ requestId: z.string(), clientId: z.string() }))
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!;
    await verifyClientOwnership(data.clientId, orgId);
    await db
      .update(factFindRequest)
      .set({ status: "REVOKED", updatedAt: new Date() })
      .where(
        and(
          eq(factFindRequest.id, data.requestId),
          eq(factFindRequest.organizationId, orgId),
        ),
      );
    return { success: true };
  });
