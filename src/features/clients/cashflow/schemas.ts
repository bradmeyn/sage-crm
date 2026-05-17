import { z } from 'zod'

export const INCOME_CATEGORIES = [
  { value: 'EMPLOYMENT', label: 'Employment' },
  { value: 'SELF_EMPLOYMENT', label: 'Self Employment' },
  { value: 'INVESTMENT', label: 'Investment' },
  { value: 'RENTAL', label: 'Rental' },
  { value: 'SUPERANNUATION', label: 'Superannuation' },
  { value: 'GOVERNMENT', label: 'Government' },
  { value: 'OTHER', label: 'Other' },
] as const

export const EXPENSE_CATEGORIES = [
  { value: 'HOUSING', label: 'Housing' },
  { value: 'LIVING', label: 'Living' },
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'HEALTHCARE', label: 'Healthcare' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'ENTERTAINMENT', label: 'Entertainment' },
  { value: 'OTHER', label: 'Other' },
] as const

export const FREQUENCIES = [
  { value: 'WEEKLY', label: 'Weekly', multiplier: 52 },
  { value: 'FORTNIGHTLY', label: 'Fortnightly', multiplier: 26 },
  { value: 'MONTHLY', label: 'Monthly', multiplier: 12 },
  { value: 'QUARTERLY', label: 'Quarterly', multiplier: 4 },
  { value: 'ANNUALLY', label: 'Annually', multiplier: 1 },
] as const

export const INCOME_OWNER_OPTIONS = [
  { value: 'CLIENT', label: 'Client' },
  { value: 'PARTNER', label: 'Partner' },
] as const

export const incomeFormSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  name: z.string().min(1, 'Name is required').max(200),
  amount: z.number().int().min(0, 'Amount must be a positive number'),
  frequency: z.string().min(1, 'Frequency is required'),
  owner: z.string().min(1, 'Owner is required'),
  notes: z.string().optional(),
})

export type IncomeFormValues = z.infer<typeof incomeFormSchema>

export const expenseFormSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  name: z.string().min(1, 'Name is required').max(200),
  amount: z.number().int().min(0, 'Amount must be a positive number'),
  frequency: z.string().min(1, 'Frequency is required'),
  notes: z.string().optional(),
})

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>

export function toAnnual(amount: number, frequency: string): number {
  const freq = FREQUENCIES.find((f) => f.value === frequency)
  return amount * (freq?.multiplier ?? 1)
}
