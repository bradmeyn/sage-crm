import { z } from 'zod'

export const ASSET_CATEGORIES = [
  { value: 'CASH_AND_BANK', label: 'Cash & Bank' },
  { value: 'PROPERTY', label: 'Property' },
  { value: 'INVESTMENT', label: 'Investment' },
  { value: 'SUPERANNUATION', label: 'Superannuation' },
  { value: 'VEHICLE', label: 'Vehicle' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'OTHER', label: 'Other' },
] as const

export const LIABILITY_CATEGORIES = [
  { value: 'MORTGAGE', label: 'Mortgage' },
  { value: 'INVESTMENT_LOAN', label: 'Investment Loan' },
  { value: 'PERSONAL_LOAN', label: 'Personal Loan' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'VEHICLE_LOAN', label: 'Vehicle Loan' },
  { value: 'OTHER', label: 'Other' },
] as const

export const OWNER_OPTIONS = [
  { value: 'CLIENT', label: 'Client' },
  { value: 'PARTNER', label: 'Partner' },
  { value: 'JOINT', label: 'Joint' },
] as const

export const assetFormSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  name: z.string().min(1, 'Name is required').max(200),
  value: z.number().int().min(0, 'Value must be a positive number'),
  owner: z.string().min(1, 'Owner is required'),
  notes: z.string().optional(),
})

export type AssetFormValues = z.infer<typeof assetFormSchema>

export const liabilityFormSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  name: z.string().min(1, 'Name is required').max(200),
  balance: z.number().int().min(0, 'Balance must be a positive number'),
  limit: z.number().int().min(0).optional(),
  // User enters as percentage (e.g. 5.50), stored as basis points (550)
  interestRateDisplay: z.number().min(0).max(100).optional(),
  owner: z.string().min(1, 'Owner is required'),
  notes: z.string().optional(),
})

export type LiabilityFormValues = z.infer<typeof liabilityFormSchema>
