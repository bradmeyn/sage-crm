import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  linkPartner,
  unlinkPartner,
} from "@/server/functions/clients";
import type { NewClient, PartnerRelationshipValue } from "./schemas";

export const clientKeys = {
  all: ["clients"] as const,
  lists: () => [...clientKeys.all, "list"] as const,
  list: (sort?: string, order?: string) =>
    [...clientKeys.lists(), { sort, order }] as const,
  details: () => [...clientKeys.all, "detail"] as const,
  detail: (id: string) => [...clientKeys.details(), id] as const,
};

export function useClients(sort?: string, order?: string) {
  return useQuery({
    queryKey: clientKeys.list(sort, order),
    queryFn: () =>
      getClients({
        data: {
          sort: sort as "firstName" | "lastName" | "email" | undefined,
          order: order as "asc" | "desc" | undefined,
        },
      }),
  });
}

export function useClient(clientId: string) {
  return useQuery({
    queryKey: clientKeys.detail(clientId),
    queryFn: () => getClient({ data: { clientId } }),
    enabled: !!clientId,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: NewClient) => createClient({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.list() });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof updateClient>[0]["data"]) =>
      updateClient({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.list() });
      queryClient.invalidateQueries({
        queryKey: clientKeys.detail(variables.clientId),
      });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clientId: string) => deleteClient({ data: { clientId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.list() });
    },
  });
}

export function useLinkPartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      clientId: string;
      partnerId: string;
      relationship: PartnerRelationshipValue;
    }) => linkPartner({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: clientKeys.detail(variables.clientId),
      });
      queryClient.invalidateQueries({
        queryKey: clientKeys.detail(variables.partnerId),
      });
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
    },
  });
}

export function useUnlinkPartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { clientId: string; currentPartnerId: string }) =>
      unlinkPartner({ data: { clientId: data.clientId } }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: clientKeys.detail(variables.clientId),
      });
      queryClient.invalidateQueries({
        queryKey: clientKeys.detail(variables.currentPartnerId),
      });
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
    },
  });
}
