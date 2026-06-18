import { z } from 'zod'

export const clientSchema = z.object({
  title: z.enum(['Mr', 'Ms', 'Mrs', 'Dr', 'Prof']).optional(),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  preferredName: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
})

export type NewClient = z.infer<typeof clientSchema>

// ─── Client field option sets (enums stored as text) ────────────────────────

export const CLIENT_STATUSES = [
  { value: 'PROSPECT', label: 'Prospect' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'FORMER', label: 'Former' },
] as const

export const GENDERS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
  { value: 'PREFER_NOT_SAY', label: 'Prefer not to say' },
] as const

export const MARITAL_STATUSES = [
  { value: 'SINGLE', label: 'Single' },
  { value: 'MARRIED', label: 'Married' },
  { value: 'DE_FACTO', label: 'De facto' },
  { value: 'SEPARATED', label: 'Separated' },
  { value: 'DIVORCED', label: 'Divorced' },
  { value: 'WIDOWED', label: 'Widowed' },
] as const

export const RESIDENCY_STATUSES = [
  { value: 'AU_RESIDENT', label: 'Australian resident' },
  { value: 'FOREIGN_RESIDENT', label: 'Foreign resident' },
  { value: 'TEMP_RESIDENT', label: 'Temporary resident' },
] as const

export const LEAD_SOURCES = [
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'EVENT', label: 'Event' },
  { value: 'SOCIAL', label: 'Social media' },
  { value: 'EXISTING_CLIENT', label: 'Existing client' },
  { value: 'OTHER', label: 'Other' },
] as const

export const AU_STATES = [
  { value: 'NSW', label: 'NSW' },
  { value: 'VIC', label: 'VIC' },
  { value: 'QLD', label: 'QLD' },
  { value: 'WA', label: 'WA' },
  { value: 'SA', label: 'SA' },
  { value: 'TAS', label: 'TAS' },
  { value: 'ACT', label: 'ACT' },
  { value: 'NT', label: 'NT' },
] as const

const labelFrom =
  (opts: ReadonlyArray<{ value: string; label: string }>) =>
  (v?: string | null) =>
    opts.find((o) => o.value === v)?.label ?? v ?? '—'

export const clientStatusLabel = labelFrom(CLIENT_STATUSES)
export const genderLabel = labelFrom(GENDERS)
export const maritalStatusLabel = labelFrom(MARITAL_STATUSES)
export const residencyStatusLabel = labelFrom(RESIDENCY_STATUSES)
export const leadSourceLabel = labelFrom(LEAD_SOURCES)

// Shared field validation (4-digit AU postcode; DOB not in the future).
export const postcodeSchema = z
  .string()
  .regex(/^\d{4}$/, 'Postcode must be 4 digits')
export const dobSchema = z
  .string()
  .refine(
    (v) => !v || (!Number.isNaN(Date.parse(v)) && new Date(v) <= new Date()),
    'Date of birth must be a valid past date',
  )

export const PARTNER_RELATIONSHIPS = [
  { value: 'SPOUSE', label: 'Spouse' },
  { value: 'PARTNER', label: 'Partner' },
  { value: 'DE_FACTO', label: 'De facto' },
] as const

export type PartnerRelationshipValue = 'SPOUSE' | 'PARTNER' | 'DE_FACTO'

export const partnerLinkSchema = z.object({
  partnerId: z.string().min(1, 'Please select a partner'),
  relationship: z.enum(['SPOUSE', 'PARTNER', 'DE_FACTO']),
})

export type PartnerLinkFormValues = z.infer<typeof partnerLinkSchema>
