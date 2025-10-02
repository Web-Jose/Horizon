"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  CheckSquareIcon,
  WarningIcon,
  TrendUpIcon,
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  PlusIcon,
  FileTextIcon,
} from "@phosphor-icons/react";
import { formatDistanceToNow } from "date-fns";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { Workspace } from "@/lib/types";
import {
  useBudgetSummary,
  useSavingsDeposits,
} from "@/lib/hooks/useBudgetQueries";
import { useItems } from "@/lib/hooks/useShoppingQueries";
import { useTasks, useToggleTaskCompletion } from "@/lib/hooks/useTaskQueries";
import { CreateTaskSheet } from "./create-task-sheet";
import { CreateItemSheet } from "./create-item-sheet";

interface DashboardProps {
  activeTab?: string;
  viewMode?: "category" | "room";
  workspace?: Workspace;
  user?: SupabaseUser;
  onTabChange?: (tab: string) => void;
}

export function Dashboard({ workspace, onTabChange }: DashboardProps) {
  // Dialog states
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [createItemOpen, setCreateItemOpen] = useState(false);

  // Real data from Supabase
  const { data: budgetSummary = [], isLoading: budgetLoading } =
    useBudgetSummary(workspace?.id || "");
  const { data: savingsDeposits = [] } = useSavingsDeposits(
    workspace?.id || ""
  );
  const { data: items = [], isLoading: itemsLoading } = useItems(
    workspace?.id || ""
  );
  const { data: tasks = [], isLoading: tasksLoading } = useTasks(
    workspace?.id || ""
  );

  // Mutations
  const toggleTaskCompletion = useToggleTaskCompletion();

  // Calculate KPI data from real data
  const totalBudget = budgetSummary.reduce(
    (sum, budget) => sum + budget.planned_cents / 100,
    0
  );
  const spentAmount = budgetSummary.reduce(
    (sum, budget) => sum + budget.spent_cents / 100,
    0
  );
  const estimatedAmount = budgetSummary.reduce(
    (sum, budget) => sum + budget.estimated_cents / 100,
    0
  );
  const totalSavings = savingsDeposits.reduce(
    (sum, deposit) => sum + deposit.amount_cents / 100,
    0
  );

  const pendingItems = items.filter((item) => !item.purchased).length;
  const purchasedItems = items.filter((item) => item.purchased).length;

  const completedTasks = tasks.filter((task) => task.done).length;
  const totalTasks = tasks.length;

  const moveDate = workspace?.move_in_date
    ? new Date(workspace.move_in_date)
    : new Date();
  const daysUntilMove = Math.max(
    0,
    Math.ceil(
      (moveDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  // Get upcoming tasks (next 7 days, not completed)
  const upcomingTasks = tasks
    .filter((task) => !task.done && task.due_date)
    .filter((task) => {
      const dueDate = new Date(task.due_date!);
      const today = new Date();
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return dueDate >= today && dueDate <= weekFromNow;
    })
    .sort(
      (a, b) =>
        new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime()
    )
    .slice(0, 5)
    .map((task) => ({
      id: task.id,
      title: task.title,
      dueDate: new Date(task.due_date!),
      priority:
        task.priority === 1 ? "low" : task.priority === 2 ? "medium" : "high",
      assignee:
        task.assigned_to === "me"
          ? "Me"
          : task.assigned_to === "him"
          ? "Him"
          : "Both",
    }));

  // Calculate risk flags
  const riskFlags = [];

  // Budget overspend risks
  const overBudgetRooms = budgetSummary.filter(
    (budget) =>
      budget.estimated_cents > budget.planned_cents && budget.planned_cents > 0
  );

  if (overBudgetRooms.length > 0) {
    riskFlags.push({
      id: 1,
      message: `${overBudgetRooms.length} room${
        overBudgetRooms.length > 1 ? "s" : ""
      } over budget`,
      severity: "high" as const,
    });
  }

  // Overdue tasks
  const overdueTasks = tasks.filter((task) => {
    if (!task.due_date || task.done) return false;
    return new Date(task.due_date) < new Date();
  });

  if (overdueTasks.length > 0) {
    const highPriorityOverdue = overdueTasks.filter(
      (task) => task.priority === 3
    ).length;
    riskFlags.push({
      id: 2,
      message: `${overdueTasks.length} task${
        overdueTasks.length > 1 ? "s" : ""
      } overdue${
        highPriorityOverdue > 0 ? ` (${highPriorityOverdue} high priority)` : ""
      }`,
      severity:
        highPriorityOverdue > 0 ? ("high" as const) : ("medium" as const),
    });
  }

  // Unpurchased items without company assignment
  const unassignedItems = items.filter(
    (item) => !item.purchased && !item.company_id
  ).length;
  if (unassignedItems > 0) {
    riskFlags.push({
      id: 3,
      message: `${unassignedItems} item${
        unassignedItems > 1 ? "s" : ""
      } without company assignment`,
      severity: "medium" as const,
    });
  }

  // Recent activity - mock for now since we don't have activity log
  const recentActivity = [
    {
      id: 1,
      action: `${purchasedItems} item${
        purchasedItems !== 1 ? "s" : ""
      } purchased`,
      time: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      id: 2,
      action: `${completedTasks} task${
        completedTasks !== 1 ? "s" : ""
      } completed`,
      time: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    },
    {
      id: 3,
      action: `Budget tracking updated`,
      time: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    },
  ];

  const budgetProgress =
    totalBudget > 0 ? (spentAmount / totalBudget) * 100 : 0;
  const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Show loading state while data is being fetched
  if (budgetLoading || itemsLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Dashboard</h1>
        <p className="text-sm text-gray-600">
          Welcome back! {daysUntilMove} days until your move to{" "}
          {workspace?.name}
        </p>
      </div>

      {/* Summary Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
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
            <div className="space-y-1">
              <Progress value={budgetProgress} className="h-2" />
              <p className="text-xs text-gray-500">
                ${spentAmount.toLocaleString()} spent • $
                {estimatedAmount.toLocaleString()} estimated
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                Shopping Items
              </span>
              <ShoppingCartIcon className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {pendingItems}
            </div>
            <p className="text-xs text-gray-500">items to purchase</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                Task Progress
              </span>
              <CheckSquareIcon className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {completedTasks}/{totalTasks}
            </div>
            <div className="space-y-1">
              <Progress value={taskProgress} className="h-2" />
              <p className="text-xs text-gray-500">
                {taskProgress.toFixed(1)}% complete
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                Days to Move
              </span>
              <CalendarIcon className="h-4 w-4 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {daysUntilMove}
            </div>
            <p className="text-xs text-gray-500">days remaining</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                Total Savings
              </span>
              <TrendUpIcon className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              ${totalSavings.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500">
              from {savingsDeposits.length} deposit
              {savingsDeposits.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Flags */}
      {riskFlags.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center mb-3">
              <WarningIcon className="h-4 w-4 text-orange-600 mr-2" />
              <h3 className="text-sm font-medium text-orange-900">
                Attention Needed
              </h3>
            </div>
            <div className="space-y-2">
              {riskFlags.map((flag) => (
                <div
                  key={flag.id}
                  className="flex items-center justify-between p-2 bg-white rounded border"
                >
                  <span className="text-sm text-gray-700">{flag.message}</span>
                  <Badge
                    variant={
                      flag.severity === "high" ? "destructive" : "secondary"
                    }
                    className="text-xs"
                  >
                    {flag.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Tasks */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium text-gray-900">
                Upcoming Tasks
              </h3>
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => setCreateTaskOpen(true)}
              >
                <PlusIcon className="w-3 h-3 mr-1" />
                Add Task
              </Button>
            </div>
            <div className="space-y-3">
              {upcomingTasks.length === 0 ? (
                <div className="text-center py-4">
                  <CheckSquareIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No upcoming tasks</p>
                  <p className="text-xs text-gray-400">All caught up!</p>
                </div>
              ) : (
                upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded border hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-sm font-medium text-gray-900">
                          {task.title}
                        </h4>
                        <Badge
                          variant={
                            task.priority === "high"
                              ? "destructive"
                              : task.priority === "medium"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {task.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <CalendarIcon className="w-3 h-3" />
                          <span>{task.dueDate.toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <UsersIcon className="w-3 h-3" />
                          <span>{task.assignee}</span>
                        </div>
                      </div>
                    </div>
                    <Checkbox
                      checked={false}
                      onCheckedChange={() => {
                        toggleTaskCompletion.mutate({
                          taskId: task.id,
                          done: true,
                        });
                      }}
                      className="h-4 w-4"
                    />
                  </div>
                ))
              )}
            </div>
            <Button
              variant="ghost"
              className="w-full text-sm text-gray-600 mt-2"
              onClick={() => onTabChange?.("tasks")}
            >
              View all tasks →
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <h3 className="text-base font-medium text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={activity.id}>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700">{activity.action}</p>
                      <p className="text-xs text-gray-500 flex items-center mt-1">
                        <ClockIcon className="w-3 h-3 mr-1" />
                        {formatDistanceToNow(activity.time, {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                  {index < recentActivity.length - 1 && (
                    <Separator className="my-2" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="mb-4">
            <h3 className="text-base font-medium text-gray-900">
              Quick Actions
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Get things done faster with these common actions
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="h-14 flex-col space-y-1 text-xs"
              onClick={() => setCreateItemOpen(true)}
            >
              <ShoppingCartIcon className="w-4 h-4" />
              <span>Add Shopping Item</span>
            </Button>
            <Button
              variant="outline"
              className="h-14 flex-col space-y-1 text-xs"
              onClick={() => setCreateTaskOpen(true)}
            >
              <CheckSquareIcon className="w-4 h-4" />
              <span>Create Task</span>
            </Button>
            <Button
              variant="outline"
              className="h-14 flex-col space-y-1 text-xs"
              onClick={() => onTabChange?.("budgets")}
            >
              <CurrencyDollarIcon className="w-4 h-4" />
              <span>Manage Budget</span>
            </Button>
            <Button
              variant="outline"
              className="h-14 flex-col space-y-1 text-xs"
              onClick={() => onTabChange?.("companies")}
            >
              <FileTextIcon className="w-4 h-4" />
              <span>View Companies</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sheets */}
      <CreateTaskSheet
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        workspaceId={workspace?.id || ""}
      />

      <CreateItemSheet
        open={createItemOpen}
        onOpenChange={setCreateItemOpen}
        workspaceId={workspace?.id || ""}
      />
    </div>
  );
}
