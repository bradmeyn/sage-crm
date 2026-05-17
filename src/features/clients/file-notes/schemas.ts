import { z } from 'zod'

export const noteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  body: z.string().min(1, 'Body is required'),
  noteType: z.string().min(1, 'Type is required'),
  isPrivate: z.boolean().default(false),
})

export type NewNote = z.infer<typeof noteSchema>

export const NOTE_TYPES = [
  { value: 'GENERAL', label: 'General Note' },
  { value: 'MEETING', label: 'Meeting Notes' },
  { value: 'PHONE_CALL', label: 'Phone Call' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'DOCUMENT', label: 'Document' },
  { value: 'COMPLIANCE', label: 'Compliance' },
] as const
