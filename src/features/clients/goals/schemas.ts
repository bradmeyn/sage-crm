import { z } from 'zod'

export const GOAL_CATEGORIES = [
  { value: 'RETIREMENT', label: 'Retirement' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'PROPERTY', label: 'Property' },
  { value: 'EMERGENCY_FUND', label: 'Emergency Fund' },
  { value: 'DEBT_FREE', label: 'Debt Free' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'TRAVEL', label: 'Travel' },
  { value: 'OTHER', label: 'Other' },
] as const

export const GOAL_STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ACHIEVED', label: 'Achieved' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const

export const GOAL_PRIORITIES = [
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
] as const

export const goalFormSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  name: z.string().min(1, 'Name is required').max(200),
  targetAmount: z.number().int().min(0).optional(),
  currentAmount: z.number().int().min(0),
  targetDate: z.string().optional(),
  priority: z.string().min(1, 'Priority is required'),
  status: z.string().min(1, 'Status is required'),
  notes: z.string().optional(),
})

export type GoalFormValues = z.infer<typeof goalFormSchema>
