import { z } from 'zod'

export const INSURANCE_CATEGORIES = [
  { value: 'LIFE', label: 'Life' },
  { value: 'TPD', label: 'TPD' },
  { value: 'TRAUMA', label: 'Trauma' },
  { value: 'INCOME_PROTECTION', label: 'Income Protection' },
  { value: 'HEALTH', label: 'Health' },
  { value: 'HOME_CONTENTS', label: 'Home & Contents' },
  { value: 'VEHICLE', label: 'Vehicle' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'OTHER', label: 'Other' },
] as const

export const PREMIUM_FREQUENCIES = [
  { value: 'MONTHLY', label: 'Monthly', multiplier: 12 },
  { value: 'QUARTERLY', label: 'Quarterly', multiplier: 4 },
  { value: 'ANNUALLY', label: 'Annually', multiplier: 1 },
] as const

export const INSURANCE_OWNER_OPTIONS = [
  { value: 'CLIENT', label: 'Client' },
  { value: 'PARTNER', label: 'Partner' },
  { value: 'JOINT', label: 'Joint' },
] as const

export const INSURANCE_STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'LAPSED', label: 'Lapsed' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const

export const insuranceFormSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  insurer: z.string().min(1, 'Insurer is required').max(200),
  policyNumber: z.string().optional(),
  coverAmount: z.number().int().min(0).optional(),
  premium: z.number().int().min(0).optional(),
  premiumFrequency: z.string().min(1, 'Frequency is required'),
  owner: z.string().min(1, 'Owner is required'),
  status: z.string().min(1, 'Status is required'),
  startDate: z.string().optional(),
  reviewDate: z.string().optional(),
  notes: z.string().optional(),
})

export type InsuranceFormValues = z.infer<typeof insuranceFormSchema>

export function annualPremium(premium: number | null | undefined, frequency: string): number {
  if (!premium) return 0
  const freq = PREMIUM_FREQUENCIES.find((f) => f.value === frequency)
  return premium * (freq?.multiplier ?? 1)
}
