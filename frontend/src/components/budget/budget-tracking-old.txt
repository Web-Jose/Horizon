"use client";

import { useState } from "react";
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
  SheetTrigger,
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
  GridFourIcon,
  PencilIcon,
  ChartBarIcon,
} from "@phosphor-icons/react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { Workspace } from "@/lib/types";
import {
  useBudgetSummary,
  useSavingsDeposits,
  useCreateRoomBudget,
  useCreateSavingsDeposit,
} from "../../lib/hooks/useBudgetQueries";
import { useRooms } from "@/lib/hooks/useShoppingQueries";

interface BudgetTrackingProps {
  activeTab?: string;
  viewMode?: "category" | "room";
  workspace?: Workspace;
  user?: SupabaseUser;
}

interface BudgetItem {
  id: string;
  name: string;
  category: string;
  room: string;
  budgetAmount: number;
  spentAmount: number;
  estimatedTotal: number;
  actualTotal?: number;
}

export function BudgetTracking({
  viewMode = "room",
  workspace,
}: BudgetTrackingProps) {
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  const [isAddSavingsOpen, setIsAddSavingsOpen] = useState(false);
  const [newBudgetForm, setNewBudgetForm] = useState({
    room_id: "",
    planned_amount: "",
    target_date: "",
  });
  const [newSavingsForm, setNewSavingsForm] = useState({
    room_id: "",
    amount: "",
    note: "",
  });

  // Get data from Supabase
  const { data: budgetSummary = [], isLoading: budgetLoading } =
    useBudgetSummary(workspace?.id || "");
  const { data: rooms = [] } = useRooms(workspace?.id || "");
  const { data: savingsDeposits = [] } = useSavingsDeposits(
    workspace?.id || ""
  );

  // Mutations
  const createBudgetMutation = useCreateRoomBudget(workspace?.id || "");
  const createSavingsMutation = useCreateSavingsDeposit(workspace?.id || "");

  // Form handlers
  const handleCreateBudget = async () => {
    if (!newBudgetForm.room_id || !newBudgetForm.planned_amount) return;

    try {
      await createBudgetMutation.mutateAsync({
        room_id: newBudgetForm.room_id,
        planned_cents: Math.round(
          parseFloat(newBudgetForm.planned_amount) * 100
        ),
        target_date: newBudgetForm.target_date || undefined,
      });
      setIsAddBudgetOpen(false);
      setNewBudgetForm({ room_id: "", planned_amount: "", target_date: "" });
    } catch (error) {
      console.error("Error creating budget:", error);
    }
  };

  const handleCreateSavings = async () => {
    if (!newSavingsForm.room_id || !newSavingsForm.amount) return;

    try {
      await createSavingsMutation.mutateAsync({
        room_id: newSavingsForm.room_id,
        date: new Date().toISOString().split("T")[0],
        amount_cents: Math.round(parseFloat(newSavingsForm.amount) * 100),
        note: newSavingsForm.note || undefined,
      });
      setIsAddSavingsOpen(false);
      setNewSavingsForm({ room_id: "", amount: "", note: "" });
    } catch (error) {
      console.error("Error creating savings deposit:", error);
    }
  };

  // Transform budget summary data for display
  const budgetItems = budgetSummary.map((summary) => ({
    id: summary.room_id,
    name: `${summary.room_name} Budget`,
    category: "Mixed", // We don't have category grouping in the new schema
    room: summary.room_name,
    budgetAmount: summary.planned_cents / 100, // Convert cents to dollars
    spentAmount: summary.spent_cents / 100,
    estimatedTotal: summary.estimated_cents / 100,
    actualTotal:
      summary.actual_cents > 0 ? summary.actual_cents / 100 : undefined,
  }));

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
          deadline: new Date("2024-12-31"), // Default deadline
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

  const groupedItems =
    viewMode === "category"
      ? budgetItems.reduce((acc, item) => {
          if (!acc[item.category]) acc[item.category] = [];
          acc[item.category].push(item);
          return acc;
        }, {} as Record<string, BudgetItem[]>)
      : budgetItems.reduce((acc, item) => {
          if (!acc[item.room]) acc[item.room] = [];
          acc[item.room].push(item);
          return acc;
        }, {} as Record<string, BudgetItem[]>);

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
      <Card className={`transition-all duration-200 hover:shadow-md ${spentPercentage > 100 ? "border-red-200 bg-red-50" : "border-gray-200"}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-medium text-gray-900 mb-1">{item.name}</h3>
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                {viewMode === "category" ? (
                  <>
                    <MapPinIcon className="w-4 h-4" />
                    <span>{item.room}</span>
                  </>
                ) : (
                  <>
                    <GridFourIcon className="w-4 h-4" />
                    <span>{item.category}</span>
                  </>
                )}
              </div>
            </div>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
              <PencilIcon className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Spent</span>
                <div className="text-right">
                  <span className="font-medium text-gray-900">${item.spentAmount.toLocaleString()}</span>
                  <span className={`ml-2 text-sm ${budgetStatus.textColor}`}>
                    {spentPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <Progress value={Math.min(spentPercentage, 100)} className="h-2" />
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
                      estimatedPercentage > 100 ? "text-red-600" : "text-gray-900"
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
                        ${(item.estimatedTotal - item.budgetAmount).toLocaleString()} over budget
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
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs">
                <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Add Savings</span>
                <span className="sm:hidden">Savings</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-xl p-6">
              <SheetHeader className="sr-only">
                <SheetTitle>Add Savings Deposit</SheetTitle>
                <SheetDescription>
                  Record a new savings deposit for a room
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
                        Add Savings Deposit
                      </h2>
                      <p className="text-sm text-gray-500">
                        Record a new savings deposit for a room
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <span className="mr-2 text-lg">💰</span>
                    Deposit Information
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Room</Label>
                      <Select
                        value={newSavingsForm.room_id}
                        onValueChange={(value) =>
                          setNewSavingsForm((prev) => ({ ...prev, room_id: value }))
                        }
                      >
                        <SelectTrigger className="bg-white">
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
                      <Label htmlFor="savings-amount">Deposit Amount ($)</Label>
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
                      placeholder="e.g., Monthly savings deposit"
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
                      ? "Adding..."
                      : "Add Deposit"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddSavingsOpen(false);
                      setNewSavingsForm({ room_id: "", amount: "", note: "" });
                    }}
                    className="w-full py-3 text-base font-medium"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Sheet open={isAddBudgetOpen} onOpenChange={setIsAddBudgetOpen}>
            <SheetTrigger asChild>
              <Button size="sm" className="text-xs">
                <PlusIcon className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Add Budget</span>
                <span className="sm:hidden">Budget</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-xl p-6">
              <SheetHeader className="sr-only">
                <SheetTitle>Add Budget Category</SheetTitle>
                <SheetDescription>
                  Create a new budget for a room or category
                </SheetDescription>
              </SheetHeader>

              {/* Header with drag indicator */}
              <div className="flex flex-col items-center pb-4 -mt-2">
                <div className="w-12 h-1 bg-gray-300 rounded-full mb-4" />
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <ChartBarIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Add Budget Category
                      </h2>
                      <p className="text-sm text-gray-500">
                        Create a new budget for a room or category
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <span className="mr-2 text-lg">🎯</span>
                    Budget Details
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Room</Label>
                      <Select
                        value={newBudgetForm.room_id}
                        onValueChange={(value) =>
                          setNewBudgetForm((prev) => ({ ...prev, room_id: value }))
                        }
                      >
                        <SelectTrigger className="bg-white">
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
                      <Label htmlFor="budget-amount">Budget Amount ($)</Label>
                      <Input
                        id="budget-amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newBudgetForm.planned_amount}
                        onChange={(e) =>
                          setNewBudgetForm((prev) => ({
                            ...prev,
                            planned_amount: e.target.value,
                          }))
                        }
                        className="bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <span className="mr-2 text-lg">📅</span>
                    Timeline
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="target-date">Target Date (optional)</Label>
                    <Input
                      id="target-date"
                      type="date"
                      value={newBudgetForm.target_date}
                      onChange={(e) =>
                        setNewBudgetForm((prev) => ({
                          ...prev,
                          target_date: e.target.value,
                        }))
                      }
                      className="bg-white"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 pt-4">
                  <Button
                    onClick={handleCreateBudget}
                    disabled={
                      createBudgetMutation.isPending ||
                      !newBudgetForm.room_id ||
                      !newBudgetForm.planned_amount
                    }
                    className="w-full py-3 text-base font-medium"
                  >
                    {createBudgetMutation.isPending
                      ? "Adding..."
                      : "Add Budget"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddBudgetOpen(false);
                      setNewBudgetForm({
                        room_id: "",
                        planned_amount: "",
                        target_date: "",
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
                  <span className="text-sm font-medium text-gray-600">Total Budget</span>
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
                  <span className="text-sm font-medium text-gray-600">Amount Spent</span>
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
                  <span className="text-sm font-medium text-gray-600">Projected Total</span>
                  <TrendDownIcon className="h-4 w-4 text-orange-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  ${totalEstimated.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500">
                  {totalEstimated > totalBudget ? (
                    <span className="text-red-600">
                      ${(totalEstimated - totalBudget).toLocaleString()} over budget
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
                  <span className="text-sm font-medium text-gray-600">Savings Progress</span>
                  <CurrencyDollarIcon className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  ${totalSavings.toLocaleString()}
                </div>
                <div className="space-y-1">
                  <Progress
                    value={totalSavingsTarget > 0 ? (totalSavings / totalSavingsTarget) * 100 : 0}
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
                        {(item.spentAmount - item.budgetAmount).toLocaleString()}
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
                        {((item.spentAmount / item.budgetAmount) * 100).toFixed(0)}%
                        of budget
                      </span>
                      <Badge variant="secondary">Near Limit</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
              <DialogHeader>
                <DialogTitle>Add Savings Deposit</DialogTitle>
                <DialogDescription>
                  Record a new savings deposit for a room
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Room</Label>
                  <Select
                    value={newSavingsForm.room_id}
                    onValueChange={(value) =>
                      setNewSavingsForm((prev) => ({ ...prev, room_id: value }))
                    }
                  >
                    <SelectTrigger>
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
                  <Label htmlFor="savings-amount">Deposit Amount ($)</Label>
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="savings-note">Note (optional)</Label>
                  <Input
                    id="savings-note"
                    placeholder="e.g., Monthly savings deposit"
                    value={newSavingsForm.note}
                    onChange={(e) =>
                      setNewSavingsForm((prev) => ({
                        ...prev,
                        note: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddSavingsOpen(false);
                      setNewSavingsForm({ room_id: "", amount: "", note: "" });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateSavings}
                    disabled={
                      createSavingsMutation.isPending ||
                      !newSavingsForm.room_id ||
                      !newSavingsForm.amount
                    }
                  >
                    {createSavingsMutation.isPending
                      ? "Adding..."
                      : "Add Deposit"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddBudgetOpen} onOpenChange={setIsAddBudgetOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Budget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Budget Category</DialogTitle>
                <DialogDescription>
                  Create a new budget for a room or category
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Room</Label>
                  <Select
                    value={newBudgetForm.room_id}
                    onValueChange={(value) =>
                      setNewBudgetForm((prev) => ({ ...prev, room_id: value }))
                    }
                  >
                    <SelectTrigger>
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
                  <Label htmlFor="budget-amount">Budget Amount ($)</Label>
                  <Input
                    id="budget-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newBudgetForm.planned_amount}
                    onChange={(e) =>
                      setNewBudgetForm((prev) => ({
                        ...prev,
                        planned_amount: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target-date">Target Date (optional)</Label>
                  <Input
                    id="target-date"
                    type="date"
                    value={newBudgetForm.target_date}
                    onChange={(e) =>
                      setNewBudgetForm((prev) => ({
                        ...prev,
                        target_date: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddBudgetOpen(false);
                      setNewBudgetForm({
                        room_id: "",
                        planned_amount: "",
                        target_date: "",
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateBudget}
                    disabled={
                      createBudgetMutation.isPending ||
                      !newBudgetForm.room_id ||
                      !newBudgetForm.planned_amount
                    }
                  >
                    {createBudgetMutation.isPending
                      ? "Adding..."
                      : "Add Budget"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalBudget.toLocaleString()}
            </div>
            <p className="text-xs text-gray-600">allocated budget</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalSpent.toLocaleString()}
            </div>
            <div className="space-y-1">
              <Progress
                value={(totalSpent / totalBudget) * 100}
                className="h-1"
              />
              <p className="text-xs text-gray-600">
                {((totalSpent / totalBudget) * 100).toFixed(1)}% of budget
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Projected Total
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalEstimated.toLocaleString()}
            </div>
            <p className="text-xs text-gray-600">
              {totalEstimated > totalBudget ? (
                <span className="text-red-600">
                  ${(totalEstimated - totalBudget).toLocaleString()} over budget
                </span>
              ) : (
                <span className="text-green-600">within budget</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Savings Progress
            </CardTitle>
            <PiggyBank className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalSavings.toLocaleString()}
            </div>
            <div className="space-y-1">
              <Progress
                value={(totalSavings / totalSavingsTarget) * 100}
                className="h-1"
              />
              <p className="text-xs text-gray-600">
                of ${totalSavingsTarget.toLocaleString()} goal
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Alerts */}
      {(overBudgetItems.length > 0 || nearBudgetItems.length > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg text-orange-900">
                Budget Alerts
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {overBudgetItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200"
              >
                <span className="text-sm text-gray-700">
                  <strong>{item.name}</strong> is over budget by $
                  {(item.spentAmount - item.budgetAmount).toLocaleString()}
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
                  {((item.spentAmount / item.budgetAmount) * 100).toFixed(0)}%
                  of budget
                </span>
                <Badge variant="secondary">Near Limit</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget Cards by Category/Room */}
        <div className="lg:col-span-2 space-y-6">
          {Object.entries(groupedItems).map(([groupName, items]) => (
            <div key={groupName} className="space-y-4">
              <div className="flex items-center space-x-2">
                {viewMode === "category" ? (
                  <Grid3X3 className="w-5 h-5 text-blue-600" />
                ) : (
                  <MapPin className="w-5 h-5 text-green-600" />
                )}
                <h2 className="text-xl font-semibold text-gray-800">
                  {groupName}
                </h2>
                <Badge variant="outline">
                  $
                  {items
                    .reduce((sum, item) => sum + item.budgetAmount, 0)
                    .toLocaleString()}{" "}
                  total budget
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((item) => (
                  <BudgetCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Savings Goals */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <PiggyBank className="w-5 h-5" />
                <span>Savings Goals</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {savingsGoals.map((goal) => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100;
                const daysToDeadline = Math.ceil(
                  (goal.deadline.getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                );

                return (
                  <div
                    key={goal.id}
                    className="space-y-3 p-4 border rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">
                        {goal.title}
                      </h4>
                      <Badge
                        variant={
                          goal.priority === "high"
                            ? "destructive"
                            : goal.priority === "medium"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {goal.priority}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>${goal.currentAmount.toLocaleString()}</span>
                        <span>{progress.toFixed(1)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Goal: ${goal.targetAmount.toLocaleString()}</span>
                        <span>{daysToDeadline} days left</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <Button variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Savings Goal
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
