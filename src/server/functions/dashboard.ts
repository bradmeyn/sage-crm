import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/server/middleware";
import { db } from "@/db/index";
import { client, job } from "@/db/schema";
import { eq, and, gte, isNotNull, count, lt, lte } from "drizzle-orm";

export const getNewClients = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const orgId = context.session.session.activeOrganizationId!;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return db.query.client.findMany({
      where: and(
        eq(client.organizationId, orgId),
        eq(client.isActive, true),
        gte(client.createdAt, thirtyDaysAgo),
      ),
      orderBy: (c, { desc }) => [desc(c.createdAt)],
      limit: 10,
    });
  });

export const getUpcomingBirthdays = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const orgId = context.session.session.activeOrganizationId!;
    // Fetch active clients with a dateOfBirth set; filter to next 30 days in JS
    const allWithDob = await db.query.client.findMany({
      where: and(
        eq(client.organizationId, orgId),
        eq(client.isActive, true),
        isNotNull(client.dateOfBirth),
      ),
      orderBy: (c, { asc }) => [asc(c.lastName), asc(c.firstName)],
    });

    const today = new Date();
    const in30 = new Date();
    in30.setDate(in30.getDate() + 30);

    // Build a comparable "this year birthday" date for each client
    return allWithDob
      .filter((c) => {
        if (!c.dateOfBirth) return false;
        const [, month, day] = c.dateOfBirth.split("-").map(Number);
        const thisYear = new Date(today.getFullYear(), month - 1, day);
        const nextYear = new Date(today.getFullYear() + 1, month - 1, day);
        // Include if birthday falls within the next 30 days this year or wrapping into next year
        return (
          (thisYear >= today && thisYear <= in30) ||
          (nextYear >= today && nextYear <= in30)
        );
      })
      .sort((a, b) => {
        const toComparable = (dob: string) => {
          const [, month, day] = dob.split("-").map(Number);
          const bday = new Date(today.getFullYear(), month - 1, day);
          if (bday < today) bday.setFullYear(today.getFullYear() + 1);
          return bday.getTime();
        };
        return toComparable(a.dateOfBirth!) - toComparable(b.dateOfBirth!);
      })
      .slice(0, 10);
  });

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const orgId = context.session.session.activeOrganizationId!;
    const today = new Date().toISOString().split("T")[0];
    const in14 = new Date();
    in14.setDate(in14.getDate() + 14);
    const in14Str = in14.toISOString().split("T")[0];
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);

    const [
      [{ totalActiveClients }],
      [{ activeJobs }],
      [{ overdueJobs }],
      [{ completedThisMonth }],
      overdueJobList,
      upcomingJobList,
    ] = await Promise.all([
      db
        .select({ totalActiveClients: count() })
        .from(client)
        .where(
          and(eq(client.organizationId, orgId), eq(client.isActive, true)),
        ),
      db
        .select({ activeJobs: count() })
        .from(job)
        .where(and(eq(job.organizationId, orgId), eq(job.status, "ACTIVE"))),
      db
        .select({ overdueJobs: count() })
        .from(job)
        .where(
          and(
            eq(job.organizationId, orgId),
            eq(job.status, "ACTIVE"),
            isNotNull(job.dueDate),
            lt(job.dueDate, today),
          ),
        ),
      db
        .select({ completedThisMonth: count() })
        .from(job)
        .where(
          and(
            eq(job.organizationId, orgId),
            eq(job.status, "COMPLETED"),
            gte(job.updatedAt, firstOfMonth),
          ),
        ),
      db.query.job.findMany({
        where: and(
          eq(job.organizationId, orgId),
          eq(job.status, "ACTIVE"),
          isNotNull(job.dueDate),
          lt(job.dueDate, today),
        ),
        orderBy: (j, { asc }) => [asc(j.dueDate)],
        limit: 6,
        with: { clients: { with: { client: true } } },
      }),
      db.query.job.findMany({
        where: and(
          eq(job.organizationId, orgId),
          eq(job.status, "ACTIVE"),
          isNotNull(job.dueDate),
          gte(job.dueDate, today),
          lte(job.dueDate, in14Str),
        ),
        orderBy: (j, { asc }) => [asc(j.dueDate)],
        limit: 6,
        with: { clients: { with: { client: true } } },
      }),
    ]);

    return {
      totalActiveClients,
      activeJobs,
      overdueJobs,
      completedThisMonth,
      overdueJobList,
      upcomingJobList,
    };
  });
