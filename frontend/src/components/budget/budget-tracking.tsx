"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  PlusIcon,
  CurrencyDollarIcon,
  TrendUpIcon,
  TrendDownIcon,
  WarningIcon,
  MapPinIcon,
  PencilIcon,
  ChartBarIcon,
} from "@phosphor-icons/react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { Workspace } from "@/lib/types";
import {
  useBudgetSummary,
  useSavingsDeposits,
  useCreateSavingsDeposit,
  useInitializeRoomBudgets,
  useUpdateRoomBudget,
} from "../../lib/hooks/useBudgetQueries";
import { useRooms } from "@/lib/hooks/useShoppingQueries";

interface BudgetTrackingProps {
  activeTab?: string;
  workspace?: Workspace;
  user?: SupabaseUser;
}

interface BudgetItem {
  id: string;
  budgetId: string;
  name: string;
  room: string;
  budgetAmount: number;
  spentAmount: number;
  estimatedTotal: number;
  actualTotal?: number;
  targetDate?: string | null;
}

export function BudgetTracking({ workspace }: BudgetTrackingProps) {
  const [isAddSavingsOpen, setIsAddSavingsOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<{
    id: string;
    planned_amount: string;
    target_date: string;
  } | null>(null);
  const [newSavingsForm, setNewSavingsForm] = useState({
    room_id: "",
    amount: "",
    note: "",
    operation: "add" as "add" | "subtract",
  });

  // Get data from Supabase
  const { data: budgetSummary = [], isLoading: budgetLoading } =
    useBudgetSummary(workspace?.id || "");
  const { data: rooms = [] } = useRooms(workspace?.id || "");
  const { data: savingsDeposits = [] } = useSavingsDeposits(
    workspace?.id || ""
  );

  // Mutations
  const initializeBudgetsMutation = useInitializeRoomBudgets(
    workspace?.id || ""
  );
  const updateBudgetMutation = useUpdateRoomBudget();
  const createSavingsMutation = useCreateSavingsDeposit(workspace?.id || "");

  // Auto-initialize budgets for all rooms on component mount
  useEffect(() => {
    if (
      rooms.length > 0 &&
      workspace?.id &&
      budgetSummary.length < rooms.length
    ) {
      console.log("Initializing budgets for rooms:", rooms);
      initializeBudgetsMutation.mutate(rooms);
    }
  }, [rooms, workspace?.id, budgetSummary.length, initializeBudgetsMutation]);

  // Form handlers
  const handleUpdateBudget = async (
    budgetId: string,
    planned_amount: string,
    target_date: string
  ) => {
    if (!planned_amount) return;

    try {
      // Check if budget exists
      const budgetExists = budgetItems.find(
        (item) => item.budgetId === budgetId
      );
      if (!budgetExists) {
        console.error("Budget not found:", budgetId);
        alert("Budget not found. Please refresh the page and try again.");
        return;
      }

      // Prepare the updates object, handling empty strings properly
      const updates = {
        planned_cents: Math.round(parseFloat(planned_amount) * 100),
        ...(target_date ? { target_date } : { target_date: null }),
      };

      console.log("Updating budget with data:", {
        budgetId,
        updates,
        originalTargetDate: target_date,
        budgetExists,
      });

      const result = await updateBudgetMutation.mutateAsync({
        budgetId,
        updates,
      });

      console.log("Budget update successful:", result);
      setEditingBudget(null);
    } catch (error) {
      console.error("Error updating budget:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));

      let errorMessage = "Unknown error";
      if (error && typeof error === "object" && "message" in error) {
        console.error("Supabase error message:", (error as Error).message);
        errorMessage = (error as Error).message;
      }

      if (
        errorMessage.includes("insufficient_privilege") ||
        errorMessage.includes("policy")
      ) {
        errorMessage =
          "Database access denied. Please run the missing RLS policies migration script in your Supabase dashboard.";
      }

      alert(`Failed to update budget: ${errorMessage}`);
    }
  };

  const handleCreateSavings = async () => {
    if (!newSavingsForm.room_id || !newSavingsForm.amount) return;

    try {
      const amountCents = Math.round(parseFloat(newSavingsForm.amount) * 100);

      // Check if withdrawing more than available
      if (newSavingsForm.operation === "subtract") {
        const currentSavings = savingsGoals.find(
          (goal) => goal.id === newSavingsForm.room_id
        );
        if (
          currentSavings &&
          amountCents > currentSavings.currentAmount * 100
        ) {
          alert(
            `Cannot withdraw $${
              newSavingsForm.amount
            }. Only $${currentSavings.currentAmount.toLocaleString()} available in savings.`
          );
          return;
        }
      }

      const finalAmountCents =
        newSavingsForm.operation === "subtract" ? -amountCents : amountCents;

      console.log("Creating savings deposit with data:", {
        room_id: newSavingsForm.room_id,
        date: new Date().toISOString().split("T")[0],
        amount_cents: finalAmountCents,
        note: newSavingsForm.note || undefined,
        workspace_id: workspace?.id,
        operation: newSavingsForm.operation,
      });

      await createSavingsMutation.mutateAsync({
        room_id: newSavingsForm.room_id,
        date: new Date().toISOString().split("T")[0],
        amount_cents: finalAmountCents,
        note: newSavingsForm.note || undefined,
      });
      setIsAddSavingsOpen(false);
      setNewSavingsForm({
        room_id: "",
        amount: "",
        note: "",
        operation: "add",
      });
    } catch (error) {
      console.error("Error creating savings deposit:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));

      // Check if it's a Supabase error
      let errorMessage = "Unknown error";
      if (error && typeof error === "object" && "message" in error) {
        console.error("Supabase error message:", (error as Error).message);
        errorMessage = (error as Error).message;
      }

      // Check for RLS policy issues
      if (
        errorMessage.includes("insufficient_privilege") ||
        errorMessage.includes("policy")
      ) {
        errorMessage =
          "Database access denied. Please run the missing RLS policies migration script (add-missing-policies.sql) in your Supabase dashboard.";
      }

      // Show user-friendly error
      alert(`Failed to create savings deposit: ${errorMessage}`);
    }
  };

  // Transform budget summary data for display
  const budgetItems = budgetSummary.map((summary) => ({
    id: summary.room_id,
    budgetId: summary.budget_id,
    name: `${summary.room_name} Budget`,
    room: summary.room_name,
    budgetAmount: summary.planned_cents / 100, // Convert cents to dollars
    spentAmount: summary.spent_cents / 100,
    estimatedTotal: summary.estimated_cents / 100,
    actualTotal:
      summary.actual_cents > 0 ? summary.actual_cents / 100 : undefined,
    targetDate: summary.target_date,
  }));

  // Debug logging
  console.log("Budget Summary Data:", budgetSummary);
  console.log("Transformed Budget Items:", budgetItems);

  // All rooms will have budgets after initialization

  // Group savings deposits by room to simulate "savings goals"
  const savingsGoals = rooms
    .map((room) => {
      const roomDeposits = savingsDeposits.filter((d) => d.room_id === room.id);
      const totalSaved = roomDeposits.reduce(
        (sum, deposit) => sum + deposit.amount_cents,
        0
      );
      const roomBudget = budgetItems.find((b) => b.room === room.name);

      if (totalSaved > 0 || roomBudget) {
        return {
          id: room.id,
          title: `${room.name} Savings`,
          targetAmount: roomBudget?.budgetAmount || 0,
          currentAmount: totalSaved / 100, // Convert cents to dollars
          deadline: null as Date | null, // No default deadline
          priority: (totalSaved > (roomBudget?.budgetAmount || 0)
            ? "high"
            : "medium") as "high" | "medium",
        };
      }
      return null;
    })
    .filter((goal): goal is NonNullable<typeof goal> => goal !== null);

  const totalBudget = budgetItems.reduce(
    (sum, item) => sum + item.budgetAmount,
    0
  );
  const totalSpent = budgetItems.reduce(
    (sum, item) => sum + item.spentAmount,
    0
  );
  const totalEstimated = budgetItems.reduce(
    (sum, item) => sum + item.estimatedTotal,
    0
  );
  const totalSavings = savingsGoals.reduce(
    (sum, goal) => sum + goal.currentAmount,
    0
  );
  const totalSavingsTarget = savingsGoals.reduce(
    (sum, goal) => sum + goal.targetAmount,
    0
  );

  const overBudgetItems = budgetItems.filter(
    (item) => item.spentAmount > item.budgetAmount
  );
  const nearBudgetItems = budgetItems.filter(
    (item) =>
      item.spentAmount <= item.budgetAmount &&
      item.spentAmount / item.budgetAmount > 0.8
  );

  // Show loading state
  if (budgetLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading budget data...</p>
        </div>
      </div>
    );
  }

  const getBudgetStatus = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage > 100)
      return { status: "over", color: "bg-red-500", textColor: "text-red-700" };
    if (percentage > 80)
      return {
        status: "warning",
        color: "bg-orange-500",
        textColor: "text-orange-700",
      };
    return {
      status: "good",
      color: "bg-green-500",
      textColor: "text-green-700",
    };
  };

  const BudgetCard = ({ item }: { item: BudgetItem }) => {
    const spentPercentage = (item.spentAmount / item.budgetAmount) * 100;
    const estimatedPercentage = (item.estimatedTotal / item.budgetAmount) * 100;
    const budgetStatus = getBudgetStatus(item.spentAmount, item.budgetAmount);

    return (
      <Card
        className={`transition-all duration-200 hover:shadow-md ${
          spentPercentage > 100 ? "border-red-200 bg-red-50" : "border-gray-200"
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-medium text-gray-900 mb-1">{item.name}</h3>
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <MapPinIcon className="w-4 h-4" />
                <span>{item.room}</span>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              disabled={initializeBudgetsMutation.isPending}
              onClick={() =>
                setEditingBudget({
                  id: item.budgetId,
                  planned_amount: item.budgetAmount.toString(),
                  target_date: item.targetDate || "",
                })
              }
            >
              <PencilIcon className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Spent</span>
                <div className="text-right">
                  <span className="font-medium text-gray-900">
                    ${item.spentAmount.toLocaleString()}
                  </span>
                  <span className={`ml-2 text-sm ${budgetStatus.textColor}`}>
                    {spentPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <Progress
                value={Math.min(spentPercentage, 100)}
                className="h-2"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Budget: ${item.budgetAmount.toLocaleString()}</span>
                <span>
                  Remaining: $
                  {Math.max(
                    0,
                    item.budgetAmount - item.spentAmount
                  ).toLocaleString()}
                </span>
              </div>
            </div>

            {item.estimatedTotal !== item.spentAmount && (
              <div className="pt-2 border-t border-gray-100">
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="text-gray-600">Projected Total</span>
                  <span
                    className={`font-medium ${
                      estimatedPercentage > 100
                        ? "text-red-600"
                        : "text-gray-900"
                    }`}
                  >
                    ${item.estimatedTotal.toLocaleString()}
                  </span>
                </div>
                <div className="text-xs">
                  {estimatedPercentage > 100 ? (
                    <div className="flex items-center space-x-1 text-red-600">
                      <WarningIcon className="w-3 h-3" />
                      <span>
                        $
                        {(
                          item.estimatedTotal - item.budgetAmount
                        ).toLocaleString()}{" "}
                        over budget
                      </span>
                    </div>
                  ) : (
                    <span className="text-green-600">Within budget limits</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Mobile-First Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Budget Tracking</h1>
          <p className="text-sm text-gray-600">
            {budgetItems.length} budgets • track your spending
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
          <Sheet open={isAddSavingsOpen} onOpenChange={setIsAddSavingsOpen}>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-xl p-6">
              <SheetHeader className="sr-only">
                <SheetTitle>
                  {newSavingsForm.operation === "add"
                    ? "Add Savings Deposit"
                    : "Withdraw Savings"}
                </SheetTitle>
                <SheetDescription>
                  {newSavingsForm.operation === "add"
                    ? "Record a new savings deposit for a room"
                    : "Withdraw savings from a room"}
                </SheetDescription>
              </SheetHeader>

              {/* Header with drag indicator */}
              <div className="flex flex-col items-center pb-4 -mt-2">
                <div className="w-12 h-1 bg-gray-300 rounded-full mb-4" />
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <CurrencyDollarIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {newSavingsForm.operation === "add"
                          ? "Add Savings Deposit"
                          : "Withdraw Savings"}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {newSavingsForm.operation === "add"
                          ? "Record a new savings deposit for a room"
                          : "Withdraw savings from a room"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <span className="mr-2 text-lg">
                      {newSavingsForm.operation === "add" ? "💰" : "💸"}
                    </span>
                    {newSavingsForm.operation === "add"
                      ? "Deposit Information"
                      : "Withdrawal Information"}
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Room</Label>
                      <Select
                        value={newSavingsForm.room_id}
                        onValueChange={(value) =>
                          setNewSavingsForm((prev) => ({
                            ...prev,
                            room_id: value,
                          }))
                        }
                      >
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue placeholder="Select room" />
                        </SelectTrigger>
                        <SelectContent>
                          {rooms.map((room) => (
                            <SelectItem key={room.id} value={room.id}>
                              {room.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="savings-amount">
                        {newSavingsForm.operation === "add"
                          ? "Deposit Amount ($)"
                          : "Withdrawal Amount ($)"}
                      </Label>
                      <Input
                        id="savings-amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newSavingsForm.amount}
                        onChange={(e) =>
                          setNewSavingsForm((prev) => ({
                            ...prev,
                            amount: e.target.value,
                          }))
                        }
                        className="bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <span className="mr-2 text-lg">📝</span>
                    Additional Details
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="savings-note">Note (optional)</Label>
                    <Input
                      id="savings-note"
                      placeholder={
                        newSavingsForm.operation === "add"
                          ? "e.g., Monthly savings deposit"
                          : "e.g., Emergency expense withdrawal"
                      }
                      value={newSavingsForm.note}
                      onChange={(e) =>
                        setNewSavingsForm((prev) => ({
                          ...prev,
                          note: e.target.value,
                        }))
                      }
                      className="bg-white"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 pt-4">
                  <Button
                    onClick={handleCreateSavings}
                    disabled={
                      createSavingsMutation.isPending ||
                      !newSavingsForm.room_id ||
                      !newSavingsForm.amount
                    }
                    className="w-full py-3 text-base font-medium"
                  >
                    {createSavingsMutation.isPending
                      ? newSavingsForm.operation === "add"
                        ? "Adding..."
                        : "Processing..."
                      : newSavingsForm.operation === "add"
                      ? "Add Deposit"
                      : "Withdraw Amount"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddSavingsOpen(false);
                      setNewSavingsForm({
                        room_id: "",
                        amount: "",
                        note: "",
                        operation: "add",
                      });
                    }}
                    className="w-full py-3 text-base font-medium"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Edit Budget Sheet */}
      {editingBudget && (
        <Sheet
          open={!!editingBudget}
          onOpenChange={() => setEditingBudget(null)}
        >
          <SheetContent side="bottom" className="h-[70vh] rounded-t-xl p-6">
            <SheetHeader className="sr-only">
              <SheetTitle>Edit Budget</SheetTitle>
              <SheetDescription>
                Update budget amount and target date
              </SheetDescription>
            </SheetHeader>

            {/* Header with drag indicator */}
            <div className="flex flex-col items-center pb-4 -mt-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full mb-4" />
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <PencilIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Edit Budget
                    </h2>
                    <p className="text-sm text-gray-500">
                      Update budget amount and target date
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Budget Details */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <span className="mr-2 text-lg">💰</span>
                  Budget Details
                </h3>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-budget-amount">
                      Budget Amount ($)
                    </Label>
                    <Input
                      id="edit-budget-amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={editingBudget.planned_amount}
                      onChange={(e) =>
                        setEditingBudget((prev) =>
                          prev
                            ? {
                                ...prev,
                                planned_amount: e.target.value,
                              }
                            : null
                        )
                      }
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-target-date">
                      Target Date (optional)
                    </Label>
                    <Input
                      id="edit-target-date"
                      type="date"
                      value={editingBudget.target_date}
                      onChange={(e) =>
                        setEditingBudget((prev) =>
                          prev
                            ? {
                                ...prev,
                                target_date: e.target.value,
                              }
                            : null
                        )
                      }
                      className="bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-4">
                <Button
                  onClick={() =>
                    handleUpdateBudget(
                      editingBudget.id,
                      editingBudget.planned_amount,
                      editingBudget.target_date
                    )
                  }
                  disabled={
                    updateBudgetMutation.isPending ||
                    !editingBudget.planned_amount ||
                    initializeBudgetsMutation.isPending
                  }
                  className="w-full py-3 text-base font-medium"
                >
                  {updateBudgetMutation.isPending
                    ? "Updating..."
                    : initializeBudgetsMutation.isPending
                    ? "Setting up budgets..."
                    : "Update Budget"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingBudget(null)}
                  className="w-full py-3 text-base font-medium"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Summary Overview with Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="savings">Savings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Summary Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    Total Budget
                  </span>
                  <CurrencyDollarIcon className="h-4 w-4 text-gray-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  ${totalBudget.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500">allocated budget</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    Amount Spent
                  </span>
                  <TrendUpIcon className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  ${totalSpent.toLocaleString()}
                </div>
                <div className="space-y-1">
                  <Progress
                    value={(totalSpent / totalBudget) * 100}
                    className="h-2"
                  />
                  <p className="text-xs text-gray-500">
                    {((totalSpent / totalBudget) * 100).toFixed(1)}% of budget
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    Projected Total
                  </span>
                  <TrendDownIcon className="h-4 w-4 text-orange-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  ${totalEstimated.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500">
                  {totalEstimated > totalBudget ? (
                    <span className="text-red-600">
                      ${(totalEstimated - totalBudget).toLocaleString()} over
                      budget
                    </span>
                  ) : (
                    <span className="text-green-600">within budget</span>
                  )}
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    Savings Progress
                  </span>
                  <CurrencyDollarIcon className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  ${totalSavings.toLocaleString()}
                </div>
                <div className="space-y-1">
                  <Progress
                    value={
                      totalSavingsTarget > 0
                        ? (totalSavings / totalSavingsTarget) * 100
                        : 0
                    }
                    className="h-2"
                  />
                  <p className="text-xs text-gray-500">
                    of ${totalSavingsTarget.toLocaleString()} goal
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Budget Alerts */}
          {(overBudgetItems.length > 0 || nearBudgetItems.length > 0) && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <WarningIcon className="h-5 w-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-orange-900">
                    Budget Alerts
                  </h3>
                </div>
                <div className="space-y-2">
                  {overBudgetItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200"
                    >
                      <span className="text-sm text-gray-700">
                        <strong>{item.name}</strong> is over budget by $
                        {(
                          item.spentAmount - item.budgetAmount
                        ).toLocaleString()}
                      </span>
                      <Badge variant="destructive">Over Budget</Badge>
                    </div>
                  ))}
                  {nearBudgetItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200"
                    >
                      <span className="text-sm text-gray-700">
                        <strong>{item.name}</strong> is at{" "}
                        {((item.spentAmount / item.budgetAmount) * 100).toFixed(
                          0
                        )}
                        % of budget
                      </span>
                      <Badge variant="secondary">Near Limit</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="budgets" className="space-y-4">
          {/* Budget Cards */}
          <div className="space-y-4">
            {budgetItems.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {budgetItems.map((item) => (
                  <BudgetCard key={item.id} item={item} />
                ))}
              </div>
            )}

            {budgetItems.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Setting up your budgets...
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    We&apos;re automatically creating budgets for all your
                    rooms. You can edit them by clicking the pencil icon on each
                    budget card.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="savings" className="space-y-4">
          {/* Savings Goals */}
          <div className="space-y-4">
            {savingsGoals.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Room Savings
                  </h2>
                </div>
                <Badge variant="outline">{savingsGoals.length} rooms</Badge>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savingsGoals.map((goal) => {
                const progress =
                  goal.targetAmount > 0
                    ? (goal.currentAmount / goal.targetAmount) * 100
                    : 0;
                const remaining = Math.max(
                  0,
                  goal.targetAmount - goal.currentAmount
                );
                const isGoalMet =
                  goal.currentAmount >= goal.targetAmount &&
                  goal.targetAmount > 0;
                const daysToDeadline = goal.deadline
                  ? Math.ceil(
                      (goal.deadline.getTime() - new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  : 0;

                const getSavingsStatus = () => {
                  if (goal.targetAmount === 0)
                    return {
                      status: "no-goal",
                      color: "bg-gray-400",
                      textColor: "text-gray-600",
                    };
                  if (isGoalMet)
                    return {
                      status: "complete",
                      color: "bg-green-500",
                      textColor: "text-green-700",
                    };
                  if (progress >= 80)
                    return {
                      status: "close",
                      color: "bg-blue-500",
                      textColor: "text-blue-700",
                    };
                  if (progress >= 50)
                    return {
                      status: "halfway",
                      color: "bg-yellow-500",
                      textColor: "text-yellow-700",
                    };
                  return {
                    status: "starting",
                    color: "bg-orange-500",
                    textColor: "text-orange-700",
                  };
                };

                const savingsStatus = getSavingsStatus();

                return (
                  <Card
                    key={goal.id}
                    className={`transition-all duration-200 hover:shadow-md ${
                      isGoalMet
                        ? "border-green-200 bg-green-50"
                        : "border-gray-200"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900 mb-1">
                            {goal.title}
                          </h3>
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <MapPinIcon className="w-4 h-4" />
                            <span>Room Savings</span>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            title="Add deposit to this room"
                            onClick={() => {
                              setNewSavingsForm((prev) => ({
                                ...prev,
                                room_id: goal.id,
                                operation: "add",
                              }));
                              setIsAddSavingsOpen(true);
                            }}
                          >
                            <PlusIcon className="w-4 h-4" />
                          </Button>
                          {goal.currentAmount > 0 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              title="Withdraw from this room"
                              onClick={() => {
                                setNewSavingsForm((prev) => ({
                                  ...prev,
                                  room_id: goal.id,
                                  operation: "subtract",
                                }));
                                setIsAddSavingsOpen(true);
                              }}
                            >
                              <span className="w-4 h-4 flex items-center justify-center text-lg leading-none">
                                −
                              </span>
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Saved</span>
                            <div className="text-right">
                              <span className="font-medium text-gray-900">
                                ${goal.currentAmount.toLocaleString()}
                              </span>
                              {goal.targetAmount > 0 && (
                                <span
                                  className={`ml-2 text-sm ${savingsStatus.textColor}`}
                                >
                                  {progress.toFixed(1)}%
                                </span>
                              )}
                            </div>
                          </div>
                          {goal.targetAmount > 0 && (
                            <Progress
                              value={Math.min(progress, 100)}
                              className="h-2"
                            />
                          )}
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>
                              {goal.targetAmount > 0
                                ? `Goal: $${goal.targetAmount.toLocaleString()}`
                                : "💡 Consider setting a savings goal"}
                            </span>
                            {goal.targetAmount > 0 && (
                              <span>
                                {isGoalMet
                                  ? "🎯 Goal achieved!"
                                  : `$${remaining.toLocaleString()} to go`}
                              </span>
                            )}
                          </div>
                        </div>

                        {goal.targetAmount > 0 && goal.deadline && (
                          <div className="pt-2 border-t border-gray-100">
                            <div className="flex justify-between items-center text-sm mb-1">
                              <span className="text-gray-600">Target Date</span>
                              <span className="text-gray-900">
                                {goal.deadline.toLocaleDateString()}
                              </span>
                            </div>
                            <div className="text-xs">
                              {isGoalMet ? (
                                <div className="flex items-center space-x-1 text-green-600">
                                  <span>🎉 Savings goal completed!</span>
                                </div>
                              ) : daysToDeadline > 0 ? (
                                <div className="flex items-center space-x-1 text-gray-600">
                                  <span>
                                    📅 {daysToDeadline} days remaining
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-1 text-red-600">
                                  <WarningIcon className="w-3 h-3" />
                                  <span>Goal date passed</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {savingsGoals.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <CurrencyDollarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Start saving for your move
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Track your moving fund progress by adding savings deposits
                    to your rooms. Each deposit brings you closer to your moving
                    goals.
                  </p>
                  <Button
                    onClick={() => {
                      setNewSavingsForm((prev) => ({
                        ...prev,
                        operation: "add",
                      }));
                      setIsAddSavingsOpen(true);
                    }}
                    className="mx-auto"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Your First Deposit
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
