import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/server/middleware";
import { db } from "@/db/index";
import { client } from "@/db/schema";
import { eq, and, asc, desc } from "drizzle-orm";
import { z } from "zod";

const clientInputSchema = z.object({
  title: z.enum(["Mr", "Ms", "Mrs", "Dr", "Prof"]).optional(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  preferredName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
});

const clientIdSchema = z.object({ clientId: z.string() });

const updateClientSchema = z.object({
  clientId: z.string(),
  title: z.enum(["Mr", "Ms", "Mrs", "Dr", "Prof"]).optional(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  preferredName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
});

const getClientsSchema = z.object({
  sort: z.enum(["firstName", "lastName", "email"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

const SORTABLE_COLS = {
  firstName: client.firstName,
  lastName: client.lastName,
  email: client.email,
} as const;

export const getClients = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(getClientsSchema)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!;
    const col = SORTABLE_COLS[data?.sort ?? "lastName"];
    const dir = data?.order === "desc" ? desc : asc;
    return db.query.client.findMany({
      where: eq(client.organizationId, orgId),
      orderBy: [dir(col), asc(client.firstName)],
    });
  });

export const getClient = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(clientIdSchema)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!;
    const c = await db.query.client.findFirst({
      where: and(
        eq(client.id, data.clientId),
        eq(client.organizationId, orgId),
      ),
    });
    if (!c) throw new Error("Client not found");

    let partner: {
      id: string;
      firstName: string;
      lastName: string;
      preferredName: string | null;
    } | null = null;
    if (c.partnerId) {
      const p = await db.query.client.findFirst({
        where: eq(client.id, c.partnerId),
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          preferredName: true,
        },
      });
      partner = p ?? null;
    }

    return { ...c, partner };
  });

export type ClientWithPartner = Awaited<ReturnType<typeof getClient>>;

export const createClient = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(clientInputSchema)
  .handler(async ({ context, data }) => {
    const { session } = context;
    const orgId = session.session.activeOrganizationId!;
    const [newClient] = await db
      .insert(client)
      .values({
        organizationId: orgId,
        title: data.title,
        firstName: data.firstName,
        lastName: data.lastName,
        preferredName: data.preferredName || null,
        email: data.email || null,
        phone: data.phone || null,
        createdById: session.user.id,
        updatedById: session.user.id,
      })
      .returning();
    return newClient;
  });

export const updateClient = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(updateClientSchema)
  .handler(async ({ context, data }) => {
    const { session } = context;
    const orgId = session.session.activeOrganizationId!;
    const { clientId, ...fields } = data;
    const [updated] = await db
      .update(client)
      .set({
        title: fields.title,
        firstName: fields.firstName,
        lastName: fields.lastName,
        preferredName: fields.preferredName || null,
        email: fields.email || null,
        phone: fields.phone || null,
        updatedById: session.user.id,
        updatedAt: new Date(),
      })
      .where(and(eq(client.id, clientId), eq(client.organizationId, orgId)))
      .returning();
    if (!updated) throw new Error("Client not found or unauthorized");
    return updated;
  });

export const deleteClient = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(clientIdSchema)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!;
    await db
      .delete(client)
      .where(
        and(eq(client.id, data.clientId), eq(client.organizationId, orgId)),
      );
    return { success: true };
  });

// ─── Partner linking ──────────────────────────────────────────────────────────

const linkPartnerSchema = z.object({
  clientId: z.string(),
  partnerId: z.string(),
  relationship: z.enum(["SPOUSE", "PARTNER", "DE_FACTO"]),
});

const unlinkPartnerSchema = z.object({
  clientId: z.string(),
});

export const linkPartner = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(linkPartnerSchema)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!;
    const { clientId, partnerId, relationship } = data;

    if (clientId === partnerId)
      throw new Error("A client cannot be linked to themselves");

    const [clientA, clientB] = await Promise.all([
      db.query.client.findFirst({
        where: and(eq(client.id, clientId), eq(client.organizationId, orgId)),
        columns: { id: true, partnerId: true, firstName: true, lastName: true },
      }),
      db.query.client.findFirst({
        where: and(eq(client.id, partnerId), eq(client.organizationId, orgId)),
        columns: { id: true, partnerId: true, firstName: true, lastName: true },
      }),
    ]);

    if (!clientA) throw new Error("Client not found");
    if (!clientB)
      throw new Error("Partner not found or not in your organisation");
    if (clientA.partnerId)
      throw new Error(
        `${clientA.firstName} ${clientA.lastName} already has a partner linked`,
      );
    if (clientB.partnerId)
      throw new Error(
        `${clientB.firstName} ${clientB.lastName} already has a partner linked`,
      );

    await db.transaction(async (tx) => {
      await tx
        .update(client)
        .set({
          partnerId,
          partnerRelationship: relationship,
          updatedAt: new Date(),
        })
        .where(eq(client.id, clientId));
      await tx
        .update(client)
        .set({
          partnerId: clientId,
          partnerRelationship: relationship,
          updatedAt: new Date(),
        })
        .where(eq(client.id, partnerId));
    });

    return { success: true };
  });

export const unlinkPartner = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(unlinkPartnerSchema)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!;

    const c = await db.query.client.findFirst({
      where: and(
        eq(client.id, data.clientId),
        eq(client.organizationId, orgId),
      ),
      columns: { id: true, partnerId: true },
    });

    if (!c) throw new Error("Client not found");
    if (!c.partnerId) throw new Error("This client has no linked partner");

    const partnerId = c.partnerId;

    await db.transaction(async (tx) => {
      await tx
        .update(client)
        .set({
          partnerId: null,
          partnerRelationship: null,
          updatedAt: new Date(),
        })
        .where(eq(client.id, data.clientId));
      await tx
        .update(client)
        .set({
          partnerId: null,
          partnerRelationship: null,
          updatedAt: new Date(),
        })
        .where(and(eq(client.id, partnerId), eq(client.organizationId, orgId)));
    });

    return { success: true };
  });
