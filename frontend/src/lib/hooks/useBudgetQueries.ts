import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { Room } from "@/lib/types";

// Create untyped client for budget tables
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const supabase = createClient(supabaseUrl, supabaseKey);

// Types for budget data
export interface RoomBudget {
  id: string;
  workspace_id: string;
  room_id: string;
  planned_cents: number;
  target_date: string | null;
  savings_target_source: "planned" | "est" | "actual";
  room?: Room;
}

export interface SavingsDeposit {
  id: string;
  workspace_id: string;
  room_id: string;
  date: string;
  amount_cents: number;
  note: string | null;
  room?: Room;
}

export interface BudgetSummary {
  budget_id: string;
  room_id: string;
  room_name: string;
  planned_cents: number;
  spent_cents: number;
  estimated_cents: number;
  actual_cents: number;
  target_date: string | null;
  savings_target_source: "planned" | "est" | "actual";
}

// Room Budget queries
export function useRoomBudgets(workspaceId: string) {
  return useQuery({
    queryKey: ["roomBudgets", workspaceId],
    queryFn: async (): Promise<RoomBudget[]> => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from("room_budgets")
        .select(
          `
          *,
          room:rooms(*)
        `
        )
        .eq("workspace_id", workspaceId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!workspaceId,
  });
}

export function useRoomBudget(workspaceId: string, roomId: string) {
  return useQuery({
    queryKey: ["roomBudget", workspaceId, roomId],
    queryFn: async (): Promise<RoomBudget | null> => {
      if (!workspaceId || !roomId) return null;

      const { data, error } = await supabase
        .from("room_budgets")
        .select(
          `
          *,
          room:rooms(*)
        `
        )
        .eq("workspace_id", workspaceId)
        .eq("room_id", roomId)
        .single();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 = not found
      return data;
    },
    enabled: !!workspaceId && !!roomId,
  });
}

// Savings Deposits queries
export function useSavingsDeposits(workspaceId: string) {
  return useQuery({
    queryKey: ["savingsDeposits", workspaceId],
    queryFn: async (): Promise<SavingsDeposit[]> => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from("savings_deposits")
        .select(
          `
          *,
          room:rooms(*)
        `
        )
        .eq("workspace_id", workspaceId)
        .order("date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!workspaceId,
  });
}

export function useRoomSavingsDeposits(workspaceId: string, roomId: string) {
  return useQuery({
    queryKey: ["roomSavingsDeposits", workspaceId, roomId],
    queryFn: async (): Promise<SavingsDeposit[]> => {
      if (!workspaceId || !roomId) return [];

      const { data, error } = await supabase
        .from("savings_deposits")
        .select(
          `
          *,
          room:rooms(*)
        `
        )
        .eq("workspace_id", workspaceId)
        .eq("room_id", roomId)
        .order("date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!workspaceId && !!roomId,
  });
}

// Budget Summary with calculated spent/estimated amounts from items
export function useBudgetSummary(workspaceId: string) {
  return useQuery({
    queryKey: ["budgetSummary", workspaceId],
    queryFn: async (): Promise<BudgetSummary[]> => {
      if (!workspaceId) return [];

      // Get room budgets
      const { data: budgets, error: budgetsError } = await supabase
        .from("room_budgets")
        .select(
          `
          *,
          room:rooms(*)
        `
        )
        .eq("workspace_id", workspaceId);

      if (budgetsError) throw budgetsError;

      // Get items with prices to calculate spent/estimated amounts
      const { data: items, error: itemsError } = await supabase
        .from("items")
        .select(
          `
          *,
          item_prices(*)
        `
        )
        .eq("workspace_id", workspaceId)
        .not("room_id", "is", null);

      if (itemsError) throw itemsError;

      // Calculate summary for each room
      const summary: BudgetSummary[] = (budgets || []).map((budget) => {
        const roomItems = (items || []).filter(
          (item) => item.room_id === budget.room_id
        );

        let spent_cents = 0;
        let estimated_cents = 0;
        let actual_cents = 0;

        roomItems.forEach((item) => {
          const latestPrice = item.item_prices?.[item.item_prices.length - 1];
          if (latestPrice) {
            const quantity = item.quantity || 1;

            // Estimated total
            estimated_cents += quantity * (latestPrice.est_unit_cents || 0);

            // Actual total (if purchased)
            if (item.purchased && latestPrice.actual_unit_cents) {
              const actualTotal = quantity * latestPrice.actual_unit_cents;
              actual_cents += actualTotal;
              spent_cents += actualTotal;
            } else {
              // Use estimated for spent if not purchased yet
              spent_cents += quantity * (latestPrice.est_unit_cents || 0);
            }
          }
        });

        return {
          budget_id: budget.id,
          room_id: budget.room_id,
          room_name: budget.room?.name || "Unknown Room",
          planned_cents: budget.planned_cents,
          spent_cents,
          estimated_cents,
          actual_cents,
          target_date: budget.target_date,
          savings_target_source: budget.savings_target_source,
        };
      });

      return summary;
    },
    enabled: !!workspaceId,
  });
}

// Room Budget mutations
export function useCreateRoomBudget(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newBudget: {
      room_id: string;
      planned_cents: number;
      target_date?: string;
      savings_target_source?: "planned" | "est" | "actual";
    }): Promise<RoomBudget> => {
      const { data, error } = await supabase
        .from("room_budgets")
        .insert({
          workspace_id: workspaceId,
          room_id: newBudget.room_id,
          planned_cents: newBudget.planned_cents,
          target_date: newBudget.target_date || null,
          savings_target_source: newBudget.savings_target_source || "planned",
        })
        .select(
          `
          *,
          room:rooms(*)
        `
        )
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roomBudgets", workspaceId] });
      queryClient.invalidateQueries({
        queryKey: ["budgetSummary", workspaceId],
      });
    },
  });
}

export function useUpdateRoomBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      budgetId,
      updates,
    }: {
      budgetId: string;
      updates: {
        planned_cents?: number;
        target_date?: string | null;
        savings_target_source?: "planned" | "est" | "actual";
      };
    }): Promise<RoomBudget> => {
      const { data, error } = await supabase
        .from("room_budgets")
        .update(updates)
        .eq("id", budgetId)
        .select(
          `
          *,
          room:rooms(*)
        `
        )
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["roomBudgets", data.workspace_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["budgetSummary", data.workspace_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["roomBudget", data.workspace_id, data.room_id],
      });
    },
  });
}

export function useDeleteRoomBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (budgetId: string): Promise<void> => {
      const { error } = await supabase
        .from("room_budgets")
        .delete()
        .eq("id", budgetId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roomBudgets"] });
      queryClient.invalidateQueries({ queryKey: ["budgetSummary"] });
    },
  });
}

// Savings Deposit mutations
export function useCreateSavingsDeposit(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newDeposit: {
      room_id: string;
      date: string;
      amount_cents: number;
      note?: string;
    }): Promise<SavingsDeposit> => {
      const { data, error } = await supabase
        .from("savings_deposits")
        .insert({
          workspace_id: workspaceId,
          room_id: newDeposit.room_id,
          date: newDeposit.date,
          amount_cents: newDeposit.amount_cents,
          note: newDeposit.note || null,
        })
        .select(
          `
          *,
          room:rooms(*)
        `
        )
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["savingsDeposits", workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["roomSavingsDeposits", workspaceId],
      });
    },
  });
}

export function useUpdateSavingsDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      depositId,
      updates,
    }: {
      depositId: string;
      updates: {
        date?: string;
        amount_cents?: number;
        note?: string;
      };
    }): Promise<SavingsDeposit> => {
      const { data, error } = await supabase
        .from("savings_deposits")
        .update(updates)
        .eq("id", depositId)
        .select(
          `
          *,
          room:rooms(*)
        `
        )
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["savingsDeposits", data.workspace_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["roomSavingsDeposits", data.workspace_id, data.room_id],
      });
    },
  });
}

export function useDeleteSavingsDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (depositId: string): Promise<void> => {
      const { error } = await supabase
        .from("savings_deposits")
        .delete()
        .eq("id", depositId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savingsDeposits"] });
      queryClient.invalidateQueries({ queryKey: ["roomSavingsDeposits"] });
    },
  });
}

// Initialize budgets for all rooms that don't have one
export function useInitializeRoomBudgets(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rooms: Room[]): Promise<RoomBudget[]> => {
      // Get existing budgets
      const { data: existingBudgets } = await supabase
        .from("room_budgets")
        .select("room_id")
        .eq("workspace_id", workspaceId);

      const existingRoomIds = new Set(
        existingBudgets?.map((b) => b.room_id) || []
      );

      // Find rooms without budgets
      const roomsNeedingBudgets = rooms.filter(
        (room) => !existingRoomIds.has(room.id)
      );

      if (roomsNeedingBudgets.length === 0) {
        return [];
      }

      // Create $0 budgets for rooms that don't have them
      const budgetsToCreate = roomsNeedingBudgets.map((room) => ({
        workspace_id: workspaceId,
        room_id: room.id,
        planned_cents: 0,
        target_date: null,
        savings_target_source: "planned" as const,
      }));

      const { data, error } = await supabase
        .from("room_budgets")
        .insert(budgetsToCreate)
        .select(
          `
          *,
          room:rooms(*)
        `
        );

      if (error) throw error;
      return data || [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roomBudgets", workspaceId] });
      queryClient.invalidateQueries({
        queryKey: ["budgetSummary", workspaceId],
      });
    },
  });
}
