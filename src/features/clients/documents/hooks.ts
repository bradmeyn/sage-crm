import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getDocuments, uploadDocument, deleteDocument } from '#/server/functions/documents'
import { fileNoteKeys } from '../file-notes/hooks'

export const clientDocumentKeys = {
  all: ['clientDocuments'] as const,
  lists: () => [...clientDocumentKeys.all, 'list'] as const,
  list: (clientId: string) =>
    [...clientDocumentKeys.lists(), clientId] as const,
}

export function useClientDocuments(clientId: string) {
  return useQuery({
    queryKey: clientDocumentKeys.list(clientId),
    queryFn: () => getDocuments({ data: { clientId } }),
    enabled: !!clientId,
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

export function useUploadClientDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      clientId,
      file,
      category,
      description,
      fileNoteId,
    }: {
      clientId: string
      file: File
      category?: string
      description?: string
      fileNoteId?: string
    }) => {
      const fileData = await fileToBase64(file)
      return uploadDocument({
        data: {
          clientId,
          fileNoteId,
          fileName: file.name,
          fileSize: file.size,
          fileData,
          mimeType: file.type,
          category: category ?? 'OTHER',
          description,
        },
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: clientDocumentKeys.list(variables.clientId),
      })
      queryClient.invalidateQueries({
        queryKey: fileNoteKeys.all,
      })
    },
  })
}

export function useDeleteClientDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      clientId,
      documentId,
    }: {
      clientId: string
      documentId: string
    }) => deleteDocument({ data: { documentId, clientId } }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: clientDocumentKeys.list(variables.clientId),
      })
      queryClient.invalidateQueries({
        queryKey: fileNoteKeys.all,
      })
    },
  })
}
