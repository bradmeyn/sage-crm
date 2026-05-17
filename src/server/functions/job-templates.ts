import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '#/server/middleware'
import { db } from '#/db/index'
import { job, jobTemplate } from '#/db/schema'
import { eq, and, isNull, count } from 'drizzle-orm'
import { z } from 'zod'
import { JOB_TYPES, JOB_STAGES, DEFAULT_JOB_TASKS } from '#/features/jobs/schemas'
import type { JobTypeValue } from '#/features/jobs/schemas'

// ─── Private helpers ──────────────────────────────────────────────────────────

async function seedTemplates(orgId: string) {
  // Priority order: New Client=0, Annual Review=1, Quick Action=2, rest after
  const priorityOrder: JobTypeValue[] = ['NEW_CLIENT', 'ANNUAL_REVIEW', 'QUICK_ACTION']

  const sorted = [...JOB_TYPES].sort((a, b) => {
    const ai = priorityOrder.indexOf(a.value as JobTypeValue)
    const bi = priorityOrder.indexOf(b.value as JobTypeValue)
    if (ai === -1 && bi === -1) return JOB_TYPES.indexOf(a) - JOB_TYPES.indexOf(b)
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })

  const seeds = sorted.map((t, i) => ({
    organizationId: orgId,
    name: t.label,
    slug: t.value,
    stages: JOB_STAGES[t.value as JobTypeValue] ?? [],
    defaultTasks: DEFAULT_JOB_TASKS[t.value as JobTypeValue] ?? [],
    isSystem: true as const,
    sortOrder: i,
  }))

  const inserted = await db
    .insert(jobTemplate)
    .values(seeds)
    .onConflictDoNothing()
    .returning()

  // Backfill existing jobs that don't yet have a templateId
  for (const tmpl of inserted) {
    await db
      .update(job)
      .set({ templateId: tmpl.id })
      .where(
        and(
          eq(job.organizationId, orgId),
          eq(job.jobType, tmpl.slug),
          isNull(job.templateId),
        ),
      )
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export const getTemplates = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const orgId = context.session.session.activeOrganizationId!

    let templates = await db.query.jobTemplate.findMany({
      where: eq(jobTemplate.organizationId, orgId),
      orderBy: (t, { asc }) => [asc(t.sortOrder), asc(t.createdAt)],
    })

    if (templates.length === 0) {
      await seedTemplates(orgId)
      templates = await db.query.jobTemplate.findMany({
        where: eq(jobTemplate.organizationId, orgId),
        orderBy: (t, { asc }) => [asc(t.sortOrder), asc(t.createdAt)],
      })
    }

    return templates
  })

// ─── Mutations ────────────────────────────────────────────────────────────────

const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  stages: z.array(z.object({ value: z.string().min(1), label: z.string().min(1) })).min(1),
  defaultTasks: z.array(z.string()).default([]),
})

export const createTemplate = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(createTemplateSchema)
  .handler(async ({ context, data }) => {
    const { session } = context
    const orgId = session.session.activeOrganizationId!

    const slug = data.name
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_|_$/g, '')

    // Ensure unique slug within the org
    const existing = await db.query.jobTemplate.findFirst({
      where: and(eq(jobTemplate.organizationId, orgId), eq(jobTemplate.slug, slug)),
    })
    const finalSlug = existing ? `${slug}_${Date.now()}` : slug

    const maxOrder = await db
      .select({ val: jobTemplate.sortOrder })
      .from(jobTemplate)
      .where(eq(jobTemplate.organizationId, orgId))
      .orderBy(jobTemplate.sortOrder)

    const nextOrder = maxOrder.length > 0 ? Math.max(...maxOrder.map((r) => r.val)) + 1 : 0

    const [tmpl] = await db
      .insert(jobTemplate)
      .values({
        organizationId: orgId,
        name: data.name,
        slug: finalSlug,
        stages: data.stages,
        defaultTasks: data.defaultTasks,
        isSystem: false,
        sortOrder: nextOrder,
        createdById: session.user.id,
      })
      .returning()

    return tmpl
  })

const cloneTemplateSchema = z.object({ id: z.string() })

export const cloneTemplate = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(cloneTemplateSchema)
  .handler(async ({ context, data }) => {
    const { session } = context
    const orgId = session.session.activeOrganizationId!

    const source = await db.query.jobTemplate.findFirst({
      where: and(eq(jobTemplate.id, data.id), eq(jobTemplate.organizationId, orgId)),
    })
    if (!source) throw new Error('Template not found')

    const baseSlug = `${source.slug}_COPY`
    const existing = await db.query.jobTemplate.findFirst({
      where: and(eq(jobTemplate.organizationId, orgId), eq(jobTemplate.slug, baseSlug)),
    })
    const finalSlug = existing ? `${baseSlug}_${Date.now()}` : baseSlug

    const maxOrder = await db
      .select({ val: jobTemplate.sortOrder })
      .from(jobTemplate)
      .where(eq(jobTemplate.organizationId, orgId))
      .orderBy(jobTemplate.sortOrder)

    const nextOrder = maxOrder.length > 0 ? Math.max(...maxOrder.map((r) => r.val)) + 1 : 0

    const [tmpl] = await db
      .insert(jobTemplate)
      .values({
        organizationId: orgId,
        name: `${source.name} (copy)`,
        slug: finalSlug,
        stages: source.stages,
        defaultTasks: source.defaultTasks,
        isSystem: false,
        sortOrder: nextOrder,
        createdById: session.user.id,
      })
      .returning()

    return tmpl
  })

const updateTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  stages: z.array(z.object({ value: z.string().min(1), label: z.string().min(1) })).min(1).optional(),
  defaultTasks: z.array(z.string()).optional(),
  sortOrder: z.number().int().optional(),
})

export const updateTemplate = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(updateTemplateSchema)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!

    const existing = await db.query.jobTemplate.findFirst({
      where: and(eq(jobTemplate.id, data.id), eq(jobTemplate.organizationId, orgId)),
    })
    if (!existing) throw new Error('Template not found')
    if (existing.isSystem) throw new Error('System templates cannot be edited — clone to customise')

    const updates: Partial<typeof existing> = { updatedAt: new Date() }
    if (data.name !== undefined) updates.name = data.name
    if (data.stages !== undefined) updates.stages = data.stages
    if (data.defaultTasks !== undefined) updates.defaultTasks = data.defaultTasks
    if (data.sortOrder !== undefined) updates.sortOrder = data.sortOrder

    const [updated] = await db
      .update(jobTemplate)
      .set(updates)
      .where(and(eq(jobTemplate.id, data.id), eq(jobTemplate.organizationId, orgId)))
      .returning()

    return updated
  })

const deleteTemplateSchema = z.object({ id: z.string() })

export const deleteTemplate = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(deleteTemplateSchema)
  .handler(async ({ context, data }) => {
    const orgId = context.session.session.activeOrganizationId!

    const existing = await db.query.jobTemplate.findFirst({
      where: and(eq(jobTemplate.id, data.id), eq(jobTemplate.organizationId, orgId)),
    })
    if (!existing) throw new Error('Template not found')
    if (existing.isSystem) throw new Error('System templates cannot be deleted')

    const [{ jobCount }] = await db
      .select({ jobCount: count() })
      .from(job)
      .where(and(eq(job.organizationId, orgId), eq(job.templateId, data.id)))

    if (jobCount > 0) {
      throw new Error(
        `${jobCount} job${jobCount === 1 ? '' : 's'} use this template — reassign them first`,
      )
    }

    await db
      .delete(jobTemplate)
      .where(and(eq(jobTemplate.id, data.id), eq(jobTemplate.organizationId, orgId)))

    return { success: true }
  })
