import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getFileNotes,
  createFileNote,
  updateFileNote,
  deleteFileNote,
} from '#/server/functions/file-notes'
import { uploadDocument } from '#/server/functions/documents'
import type { NewNote } from './schemas'

export const fileNoteKeys = {
  all: ['file-notes'] as const,
  lists: () => [...fileNoteKeys.all, 'list'] as const,
  list: (clientId: string) => [...fileNoteKeys.lists(), clientId] as const,
  details: () => [...fileNoteKeys.all, 'detail'] as const,
  detail: (clientId: string, noteId: string) =>
    [...fileNoteKeys.details(), clientId, noteId] as const,
}

export function useFileNotes(clientId: string) {
  return useQuery({
    queryKey: fileNoteKeys.list(clientId),
    queryFn: () => getFileNotes({ data: { clientId } }),
    enabled: !!clientId,
  })
}

export interface CreateFileNoteInput extends NewNote {
  clientId: string
  files?: File[]
}

export function useCreateFileNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ files, ...data }: CreateFileNoteInput) => {
      const note = await createFileNote({ data })

      if (files && files.length > 0) {
        await Promise.all(
          files.map(async (file) => {
            const fileData = await fileToBase64(file)
            return uploadDocument({
              data: {
                clientId: data.clientId,
                fileNoteId: note.id,
                fileName: file.name,
                fileSize: file.size,
                fileData,
                mimeType: file.type,
                category: 'OTHER',
              },
            })
          }),
        )
      }

      return note
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: fileNoteKeys.list(variables.clientId),
      })
    },
  })
}

export interface UpdateFileNoteInput extends NewNote {
  noteId: string
  clientId: string
  files?: File[]
}

export function useUpdateFileNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ files, ...data }: UpdateFileNoteInput) => {
      const note = await updateFileNote({ data })

      if (files && files.length > 0) {
        await Promise.all(
          files.map(async (file) => {
            const fileData = await fileToBase64(file)
            return uploadDocument({
              data: {
                clientId: data.clientId,
                fileNoteId: data.noteId,
                fileName: file.name,
                fileSize: file.size,
                fileData,
                mimeType: file.type,
                category: 'OTHER',
              },
            })
          }),
        )
      }

      return note
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: fileNoteKeys.list(variables.clientId),
      })
    },
  })
}

export function useDeleteFileNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ noteId, clientId }: { noteId: string; clientId: string }) =>
      deleteFileNote({ data: { noteId, clientId } }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: fileNoteKeys.list(variables.clientId),
      })
    },
  })
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
