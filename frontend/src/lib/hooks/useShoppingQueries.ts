"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShoppingService } from "../shopping";
import { ItemWithDetails } from "../types";

// Query Keys
export const queryKeys = {
  items: (workspaceId: string) => ["items", workspaceId] as const,
  item: (itemId: string) => ["item", itemId] as const,
  categories: (workspaceId: string) => ["categories", workspaceId] as const,
  rooms: (workspaceId: string) => ["rooms", workspaceId] as const,
  companies: (workspaceId: string) => ["companies", workspaceId] as const,
  members: (workspaceId: string) => ["members", workspaceId] as const,
  invitations: (workspaceId: string) => ["invitations", workspaceId] as const,
};

// Items Hooks
export function useItems(workspaceId: string) {
  return useQuery({
    queryKey: queryKeys.items(workspaceId),
    queryFn: () => ShoppingService.getItemsWithDetails(workspaceId),
    enabled: !!workspaceId,
    staleTime: 30 * 1000, // 30 seconds - items change frequently
  });
}

export function useItem(itemId: string) {
  return useQuery({
    queryKey: queryKeys.item(itemId),
    queryFn: () => ShoppingService.getItemWithDetails(itemId),
    enabled: !!itemId,
    staleTime: 60 * 1000, // 1 minute
  });
}

// Categories, Rooms, Companies Hooks
export function useCategories(workspaceId: string) {
  return useQuery({
    queryKey: queryKeys.categories(workspaceId),
    queryFn: () => ShoppingService.getCategories(workspaceId),
    enabled: !!workspaceId,
    staleTime: 10 * 60 * 1000, // 10 minutes - these don't change often
  });
}

export function useRooms(workspaceId: string) {
  return useQuery({
    queryKey: queryKeys.rooms(workspaceId),
    queryFn: () => ShoppingService.getRooms(workspaceId),
    enabled: !!workspaceId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCompanies(workspaceId: string) {
  return useQuery({
    queryKey: queryKeys.companies(workspaceId),
    queryFn: () => ShoppingService.getCompanies(workspaceId),
    enabled: !!workspaceId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Mutation Hooks
export function useCreateItem(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemData: Parameters<typeof ShoppingService.createItem>[1]) =>
      ShoppingService.createItem(workspaceId, itemData),
    onSuccess: (newItem) => {
      // Invalidate and refetch items
      queryClient.invalidateQueries({ queryKey: queryKeys.items(workspaceId) });

      // Optimistically add the new item to the cache
      queryClient.setQueryData(
        queryKeys.items(workspaceId),
        (old: ItemWithDetails[] = []) => {
          return [newItem, ...old];
        }
      );
    },
  });
}

export function useUpdateItemPurchased() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      purchased,
      actualPrice,
    }: {
      itemId: string;
      purchased: boolean;
      actualPrice?: number;
    }) => ShoppingService.updateItemPurchased(itemId, purchased, actualPrice),
    onMutate: async ({ itemId, purchased, actualPrice }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["items"] });

      // Snapshot the previous value
      const previousData = queryClient.getQueriesData({ queryKey: ["items"] });

      // Optimistically update all item queries
      queryClient.setQueriesData(
        { queryKey: ["items"] },
        (old: ItemWithDetails[] = []) => {
          return old.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  purchased,
                  actual_price:
                    actualPrice !== undefined ? actualPrice : item.actual_price,
                }
              : item
          );
        }
      );

      // Also update individual item query if it exists
      queryClient.setQueryData(
        queryKeys.item(itemId),
        (old: ItemWithDetails | undefined) => {
          if (old) {
            return {
              ...old,
              purchased,
              actual_price:
                actualPrice !== undefined ? actualPrice : old.actual_price,
            };
          }
          return old;
        }
      );

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Always refetch to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      updates,
    }: {
      itemId: string;
      updates: Parameters<typeof ShoppingService.updateItem>[1];
    }) => ShoppingService.updateItem(itemId, updates),
    onMutate: async ({ itemId, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["items"] });

      // Snapshot the previous value
      const previousData = queryClient.getQueriesData({ queryKey: ["items"] });

      // Optimistically update all item queries
      queryClient.setQueriesData(
        { queryKey: ["items"] },
        (old: ItemWithDetails[] = []) => {
          return old.map((item) =>
            item.id === itemId ? { ...item, ...updates } : item
          );
        }
      );

      // Also update individual item query if it exists
      queryClient.setQueryData(
        queryKeys.item(itemId),
        (old: ItemWithDetails | undefined) => {
          if (old) {
            return { ...old, ...updates };
          }
          return old;
        }
      );

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Always refetch to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => ShoppingService.deleteItem(itemId),
    onMutate: async (itemId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["items"] });

      // Snapshot the previous value
      const previousData = queryClient.getQueriesData({ queryKey: ["items"] });

      // Optimistically remove the item from all caches
      queryClient.setQueriesData(
        { queryKey: ["items"] },
        (old: ItemWithDetails[] = []) => {
          return old.filter((item) => item.id !== itemId);
        }
      );

      // Remove individual item query
      queryClient.removeQueries({ queryKey: queryKeys.item(itemId) });

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Always refetch to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
}
// Category Mutations
export function useCreateCategory(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryData: { name: string; color?: string }) =>
      ShoppingService.createCategory(workspaceId, categoryData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.categories(workspaceId),
      });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      categoryData,
    }: {
      categoryId: string;
      categoryData: { name?: string; color?: string };
    }) => ShoppingService.updateCategory(categoryId, categoryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) =>
      ShoppingService.deleteCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

// Room Mutations
export function useCreateRoom(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roomData: { name: string }) =>
      ShoppingService.createRoom(workspaceId, roomData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms(workspaceId) });
    },
  });
}

export function useUpdateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      roomId,
      roomData,
    }: {
      roomId: string;
      roomData: { name: string };
    }) => ShoppingService.updateRoom(roomId, roomData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
}

export function useDeleteRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roomId: string) => ShoppingService.deleteRoom(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
}

// Workspace Mutations
export function useUpdateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      workspaceData,
    }: {
      workspaceId: string;
      workspaceData: {
        name?: string;
        zip?: string;
        currency?: string;
        move_in_date?: string;
      };
    }) => ShoppingService.updateWorkspace(workspaceId, workspaceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}

// Member Management Hooks
export function useWorkspaceMembers(workspaceId: string) {
  return useQuery({
    queryKey: queryKeys.members(workspaceId),
    queryFn: () => ShoppingService.getWorkspaceMembers(workspaceId),
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePendingInvitations(workspaceId: string) {
  return useQuery({
    queryKey: queryKeys.invitations(workspaceId),
    queryFn: () => ShoppingService.getPendingInvitations(workspaceId),
    enabled: !!workspaceId,
    staleTime: 30 * 1000, // 30 seconds - invitations can change frequently
  });
}

export function useInviteMember(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email }: { email: string }) =>
      ShoppingService.inviteMember(workspaceId, email),
    onSuccess: () => {
      // Invalidate both members and invitations
      queryClient.invalidateQueries({
        queryKey: queryKeys.members(workspaceId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.invitations(workspaceId),
      });
    },
  });
}

export function useCancelInvitation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invitationId }: { invitationId: string }) =>
      ShoppingService.cancelInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.invitations(workspaceId),
      });
    },
  });
}

export function useRemoveMember(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId }: { userId: string }) =>
      ShoppingService.removeMember(workspaceId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.members(workspaceId),
      });
    },
  });
}
