import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  integer,
  uniqueIndex,
  json,
  check,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

// ─── Better-Auth Tables ─────────────────────────────────────────────────────

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  // Additional CRM fields
  firstName: text('first_name'),
  lastName: text('last_name'),
  phone: text('phone'),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  activeOrganizationId: text('active_organization_id'),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
})

// Better-Auth Organization Plugin Tables
export const organization = pgTable('organization', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').unique(),
  logo: text('logo'),
  createdAt: timestamp('created_at').notNull(),
  metadata: text('metadata'),
})

export const member = pgTable('member', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  createdAt: timestamp('created_at').notNull(),
})

export const invitation = pgTable('invitation', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role'),
  status: text('status').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  inviterId: text('inviter_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

// ─── CRM Tables ──────────────────────────────────────────────────────────────

export const client = pgTable('client', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  title: text('title'),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  preferredName: text('preferred_name'),
  dateOfBirth: text('date_of_birth'),
  email: text('email'),
  phone: text('phone'),
  streetAddress: text('street_address'),
  suburb: text('suburb'),
  state: text('state'),
  postcode: text('postcode'),
  country: text('country'),
  status: text('status').notNull().default('PROSPECT'),
  isActive: boolean('is_active').notNull().default(true),
  primaryAdvisorId: text('primary_advisor_id').references(() => user.id),
  taxFileNumber: text('tax_file_number'),
  occupation: text('occupation'),
  employer: text('employer'),
  quickNote: text('quick_note'),
  createdById: text('created_by_id').references(() => user.id),
  updatedById: text('updated_by_id').references(() => user.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const fileNote = pgTable('file_note', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id')
    .notNull()
    .references(() => client.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  body: text('body').notNull(),
  noteType: text('note_type').notNull().default('GENERAL'),
  isPrivate: boolean('is_private').notNull().default(false),
  createdById: text('created_by_id').references(() => user.id),
  updatedById: text('updated_by_id').references(() => user.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const clientDocument = pgTable('client_document', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id')
    .notNull()
    .references(() => client.id, { onDelete: 'cascade' }),
  fileNoteId: uuid('file_note_id').references(() => fileNote.id),
  filePath: text('file_path').notNull(),
  name: text('name'),
  description: text('description'),
  size: integer('size'),
  category: text('category').notNull().default('OTHER'),
  createdById: text('created_by_id').references(() => user.id),
  updatedById: text('updated_by_id').references(() => user.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Balance Sheet ────────────────────────────────────────────────────────────

export const clientAsset = pgTable('client_asset', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id')
    .notNull()
    .references(() => client.id, { onDelete: 'cascade' }),
  // CASH_AND_BANK | PROPERTY | INVESTMENT | SUPERANNUATION | VEHICLE | BUSINESS | OTHER
  category: text('category').notNull().default('OTHER'),
  name: text('name').notNull(),
  value: integer('value').notNull().default(0),
  // CLIENT | PARTNER | JOINT
  owner: text('owner').notNull().default('CLIENT'),
  notes: text('notes'),
  createdById: text('created_by_id').references(() => user.id),
  updatedById: text('updated_by_id').references(() => user.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const clientLiability = pgTable('client_liability', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id')
    .notNull()
    .references(() => client.id, { onDelete: 'cascade' }),
  // MORTGAGE | INVESTMENT_LOAN | PERSONAL_LOAN | CREDIT_CARD | VEHICLE_LOAN | OTHER
  category: text('category').notNull().default('OTHER'),
  name: text('name').notNull(),
  balance: integer('balance').notNull().default(0),
  // Credit limit (for credit cards / lines of credit)
  limit: integer('limit'),
  // Stored as basis points (e.g. 550 = 5.50%)
  interestRate: integer('interest_rate'),
  // CLIENT | PARTNER | JOINT
  owner: text('owner').notNull().default('CLIENT'),
  notes: text('notes'),
  createdById: text('created_by_id').references(() => user.id),
  updatedById: text('updated_by_id').references(() => user.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Cashflow ─────────────────────────────────────────────────────────────────

export const clientIncome = pgTable('client_income', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id')
    .notNull()
    .references(() => client.id, { onDelete: 'cascade' }),
  // EMPLOYMENT | SELF_EMPLOYMENT | INVESTMENT | RENTAL | SUPERANNUATION | GOVERNMENT | OTHER
  category: text('category').notNull().default('OTHER'),
  name: text('name').notNull(),
  amount: integer('amount').notNull().default(0),
  // WEEKLY | FORTNIGHTLY | MONTHLY | QUARTERLY | ANNUALLY
  frequency: text('frequency').notNull().default('ANNUALLY'),
  // CLIENT | PARTNER
  owner: text('owner').notNull().default('CLIENT'),
  notes: text('notes'),
  createdById: text('created_by_id').references(() => user.id),
  updatedById: text('updated_by_id').references(() => user.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const clientExpense = pgTable('client_expense', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id')
    .notNull()
    .references(() => client.id, { onDelete: 'cascade' }),
  // HOUSING | LIVING | TRANSPORT | INSURANCE | UTILITIES | HEALTHCARE | EDUCATION | ENTERTAINMENT | OTHER
  category: text('category').notNull().default('OTHER'),
  name: text('name').notNull(),
  amount: integer('amount').notNull().default(0),
  // WEEKLY | FORTNIGHTLY | MONTHLY | QUARTERLY | ANNUALLY
  frequency: text('frequency').notNull().default('MONTHLY'),
  notes: text('notes'),
  createdById: text('created_by_id').references(() => user.id),
  updatedById: text('updated_by_id').references(() => user.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Goals ───────────────────────────────────────────────────────────────────

export const clientGoal = pgTable('client_goal', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id')
    .notNull()
    .references(() => client.id, { onDelete: 'cascade' }),
  // RETIREMENT | EDUCATION | PROPERTY | EMERGENCY_FUND | DEBT_FREE | BUSINESS | TRAVEL | OTHER
  category: text('category').notNull().default('OTHER'),
  name: text('name').notNull(),
  targetAmount: integer('target_amount'),
  currentAmount: integer('current_amount').notNull().default(0),
  // YYYY-MM-DD stored as text
  targetDate: text('target_date'),
  // HIGH | MEDIUM | LOW
  priority: text('priority').notNull().default('MEDIUM'),
  // ACTIVE | ACHIEVED | ON_HOLD | CANCELLED
  status: text('status').notNull().default('ACTIVE'),
  notes: text('notes'),
  createdById: text('created_by_id').references(() => user.id),
  updatedById: text('updated_by_id').references(() => user.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Insurance ────────────────────────────────────────────────────────────────

export const clientInsurance = pgTable('client_insurance', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id')
    .notNull()
    .references(() => client.id, { onDelete: 'cascade' }),
  // LIFE | TPD | TRAUMA | INCOME_PROTECTION | HEALTH | HOME_CONTENTS | VEHICLE | BUSINESS | OTHER
  category: text('category').notNull().default('OTHER'),
  insurer: text('insurer').notNull(),
  policyNumber: text('policy_number'),
  // Cover / benefit amount
  coverAmount: integer('cover_amount'),
  premium: integer('premium'),
  // MONTHLY | QUARTERLY | ANNUALLY
  premiumFrequency: text('premium_frequency').notNull().default('MONTHLY'),
  // CLIENT | PARTNER | JOINT
  owner: text('owner').notNull().default('CLIENT'),
  // ACTIVE | CANCELLED | LAPSED | PENDING
  status: text('status').notNull().default('ACTIVE'),
  startDate: text('start_date'),
  reviewDate: text('review_date'),
  notes: text('notes'),
  createdById: text('created_by_id').references(() => user.id),
  updatedById: text('updated_by_id').references(() => user.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export const jobTemplate = pgTable(
  'job_template',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    stages: json('stages').$type<{ value: string; label: string }[]>().notNull().default([]),
    defaultTasks: json('default_tasks').$type<string[]>().notNull().default([]),
    isSystem: boolean('is_system').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    createdById: text('created_by_id').references(() => user.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('job_template_org_slug_unique').on(t.organizationId, t.slug)],
)

export const job = pgTable('job', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  // NEW_CLIENT | ANNUAL_REVIEW | INSURANCE_REVIEW | ESTATE_PLANNING | INVESTMENT_REVIEW | MORTGAGE_REVIEW | TAX_PLANNING | OTHER
  jobType: text('job_type').notNull(),
  templateId: uuid('template_id').references(() => jobTemplate.id, { onDelete: 'set null' }),
  // Stage key, varies by jobType
  currentStage: text('current_stage').notNull(),
  // ACTIVE | ON_HOLD | COMPLETED | CANCELLED
  status: text('status').notNull().default('ACTIVE'),
  // HIGH | MEDIUM | LOW
  priority: text('priority').notNull().default('MEDIUM'),
  description: text('description'),
  dueDate: text('due_date'),
  assignedToId: text('assigned_to_id').references(() => user.id),
  createdById: text('created_by_id').references(() => user.id),
  updatedById: text('updated_by_id').references(() => user.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const jobTask = pgTable('job_task', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id')
    .notNull()
    .references(() => job.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  isCompleted: boolean('is_completed').notNull().default(false),
  completedAt: text('completed_at'),
  completedById: text('completed_by_id').references(() => user.id),
  sortOrder: integer('sort_order').notNull().default(0),
  createdById: text('created_by_id').references(() => user.id),
  updatedById: text('updated_by_id').references(() => user.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const jobClient = pgTable(
  'job_client',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobId: uuid('job_id')
      .notNull()
      .references(() => job.id, { onDelete: 'cascade' }),
    clientId: uuid('client_id')
      .notNull()
      .references(() => client.id, { onDelete: 'cascade' }),
  },
  (t) => [uniqueIndex('job_client_job_id_client_id_unique').on(t.jobId, t.clientId)],
)

export const jobComment = pgTable('job_comment', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').notNull().references(() => job.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  createdById: text('created_by_id').notNull().references(() => user.id),
  updatedById: text('updated_by_id').references(() => user.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const jobActivity = pgTable('job_activity', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').notNull().references(() => job.id, { onDelete: 'cascade' }),
  // JOB_CREATED | STAGE_CHANGED | STATUS_CHANGED | CLIENT_ADDED | CLIENT_REMOVED | FILE_UPLOADED
  type: text('type').notNull(),
  body: text('body').notNull(),
  createdById: text('created_by_id').notNull().references(() => user.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const jobDocument = pgTable('job_document', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').notNull().references(() => job.id, { onDelete: 'cascade' }),
  filePath: text('file_path').notNull(),
  name: text('name').notNull(),
  size: integer('size'),
  mimeType: text('mime_type'),
  createdById: text('created_by_id').references(() => user.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const jobMember = pgTable(
  'job_member',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobId: uuid('job_id')
      .notNull()
      .references(() => job.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    addedById: text('added_by_id').references(() => user.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('job_member_job_id_user_id_unique').on(t.jobId, t.userId)],
)

export const notification = pgTable('notification', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  // COMMENT_ADDED | STAGE_CHANGED | BIRTHDAY_UPCOMING | JOB_MEMBER_ADDED
  type: text('type').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  jobId: uuid('job_id').references(() => job.id, { onDelete: 'set null' }),
  clientId: uuid('client_id').references(() => client.id, { onDelete: 'set null' }),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const serviceAgreement = pgTable(
  'service_agreement',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clientId: uuid('client_id').notNull().references(() => client.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id').notNull().references(() => organization.id, { onDelete: 'cascade' }),
    startDate: text('start_date').notNull(),
    nextRenewalDate: text('next_renewal_date').notNull(),
    lastConsentDate: text('last_consent_date'),
    feeAmount: integer('fee_amount').notNull(),
    feeFrequency: text('fee_frequency').notNull(),
    services: text('services').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    check('service_agreement_fee_frequency_check', sql`${t.feeFrequency} IN ('MONTHLY', 'QUARTERLY', 'ANNUALLY')`),
    uniqueIndex('service_agreement_client_org_unique').on(t.clientId, t.organizationId),
  ]
)

// ─── Relations ───────────────────────────────────────────────────────────────

export const fileNoteRelations = relations(fileNote, ({ many }) => ({
  documents: many(clientDocument),
}))

export const clientDocumentRelations = relations(clientDocument, ({ one }) => ({
  fileNote: one(fileNote, {
    fields: [clientDocument.fileNoteId],
    references: [fileNote.id],
  }),
}))

export const clientRelations = relations(client, ({ many }) => ({
  assets: many(clientAsset),
  liabilities: many(clientLiability),
  income: many(clientIncome),
  expenses: many(clientExpense),
  goals: many(clientGoal),
  insurance: many(clientInsurance),
  jobClients: many(jobClient),
  agreements: many(serviceAgreement),
}))

export const jobTemplateRelations = relations(jobTemplate, ({ many }) => ({
  jobs: many(job),
}))

export const jobRelations = relations(job, ({ one, many }) => ({
  clients: many(jobClient),
  tasks: many(jobTask),
  comments: many(jobComment),
  activities: many(jobActivity),
  documents: many(jobDocument),
  members: many(jobMember),
  assignedTo: one(user, { fields: [job.assignedToId], references: [user.id] }),
  template: one(jobTemplate, { fields: [job.templateId], references: [jobTemplate.id] }),
}))

export const jobMemberRelations = relations(jobMember, ({ one }) => ({
  job: one(job, { fields: [jobMember.jobId], references: [job.id] }),
  user: one(user, { fields: [jobMember.userId], references: [user.id] }),
  addedBy: one(user, { fields: [jobMember.addedById], references: [user.id] }),
}))

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, { fields: [notification.userId], references: [user.id] }),
  job: one(job, { fields: [notification.jobId], references: [job.id] }),
  client: one(client, { fields: [notification.clientId], references: [client.id] }),
}))

export const jobCommentRelations = relations(jobComment, ({ one }) => ({
  job: one(job, { fields: [jobComment.jobId], references: [job.id] }),
  createdBy: one(user, { fields: [jobComment.createdById], references: [user.id] }),
}))

export const jobActivityRelations = relations(jobActivity, ({ one }) => ({
  job: one(job, { fields: [jobActivity.jobId], references: [job.id] }),
  createdBy: one(user, { fields: [jobActivity.createdById], references: [user.id] }),
}))

export const jobDocumentRelations = relations(jobDocument, ({ one }) => ({
  job: one(job, { fields: [jobDocument.jobId], references: [job.id] }),
  createdBy: one(user, { fields: [jobDocument.createdById], references: [user.id] }),
}))

export const jobClientRelations = relations(jobClient, ({ one }) => ({
  job: one(job, { fields: [jobClient.jobId], references: [job.id] }),
  client: one(client, { fields: [jobClient.clientId], references: [client.id] }),
}))

export const jobTaskRelations = relations(jobTask, ({ one }) => ({
  job: one(job, { fields: [jobTask.jobId], references: [job.id] }),
}))

export const clientAssetRelations = relations(clientAsset, ({ one }) => ({
  client: one(client, { fields: [clientAsset.clientId], references: [client.id] }),
}))

export const clientLiabilityRelations = relations(clientLiability, ({ one }) => ({
  client: one(client, { fields: [clientLiability.clientId], references: [client.id] }),
}))

export const clientIncomeRelations = relations(clientIncome, ({ one }) => ({
  client: one(client, { fields: [clientIncome.clientId], references: [client.id] }),
}))

export const clientExpenseRelations = relations(clientExpense, ({ one }) => ({
  client: one(client, { fields: [clientExpense.clientId], references: [client.id] }),
}))

export const clientGoalRelations = relations(clientGoal, ({ one }) => ({
  client: one(client, { fields: [clientGoal.clientId], references: [client.id] }),
}))

export const clientInsuranceRelations = relations(clientInsurance, ({ one }) => ({
  client: one(client, { fields: [clientInsurance.clientId], references: [client.id] }),
}))

export const serviceAgreementRelations = relations(serviceAgreement, ({ one }) => ({
  client: one(client, { fields: [serviceAgreement.clientId], references: [client.id] }),
  organization: one(organization, { fields: [serviceAgreement.organizationId], references: [organization.id] }),
}))

// Type exports
export type User = typeof user.$inferSelect
export type Organization = typeof organization.$inferSelect
export type Client = typeof client.$inferSelect
export type FileNote = typeof fileNote.$inferSelect
export type ClientDocument = typeof clientDocument.$inferSelect
export type ClientAsset = typeof clientAsset.$inferSelect
export type ClientLiability = typeof clientLiability.$inferSelect
export type ClientIncome = typeof clientIncome.$inferSelect
export type ClientExpense = typeof clientExpense.$inferSelect
export type NewClient = typeof client.$inferInsert
export type NewFileNote = typeof fileNote.$inferInsert
export type NewClientDocument = typeof clientDocument.$inferInsert
export type NewClientAsset = typeof clientAsset.$inferInsert
export type NewClientLiability = typeof clientLiability.$inferInsert
export type NewClientIncome = typeof clientIncome.$inferInsert
export type NewClientExpense = typeof clientExpense.$inferInsert
export type ClientGoal = typeof clientGoal.$inferSelect
export type ClientInsurance = typeof clientInsurance.$inferSelect
export type NewClientGoal = typeof clientGoal.$inferInsert
export type NewClientInsurance = typeof clientInsurance.$inferInsert
export type JobTemplate = typeof jobTemplate.$inferSelect
export type Job = typeof job.$inferSelect
export type NewJob = typeof job.$inferInsert
export type JobTask = typeof jobTask.$inferSelect
export type NewJobTask = typeof jobTask.$inferInsert
export type JobClient = typeof jobClient.$inferSelect
export type JobComment = typeof jobComment.$inferSelect
export type JobActivity = typeof jobActivity.$inferSelect
export type JobDocument = typeof jobDocument.$inferSelect
export type JobMember = typeof jobMember.$inferSelect
export type Notification = typeof notification.$inferSelect
export type ServiceAgreement = typeof serviceAgreement.$inferSelect
export type NewServiceAgreement = typeof serviceAgreement.$inferInsert
