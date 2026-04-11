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
