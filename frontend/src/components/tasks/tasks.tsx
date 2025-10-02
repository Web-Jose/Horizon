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
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckSquareIcon,
  CheckIcon,
  UserIcon,
  UsersIcon,
  CalendarIcon,
  WarningIcon,
  SpinnerGapIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { Workspace, TaskWithDetails, AssignedTo } from "@/lib/types";
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useToggleTaskCompletion,
  useDeleteTask,
} from "@/lib/hooks/useTaskQueries";
import { useCategories } from "@/lib/hooks/useShoppingQueries";

interface TasksProps {
  activeTab?: string;
  viewMode?: "category" | "room";
  workspace?: Workspace;
  user?: SupabaseUser;
}

export function Tasks({ workspace }: TasksProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(
    null
  );
  const [editingTask, setEditingTask] = useState<TaskWithDetails | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    notes: "",
    assigned_to: "me" as AssignedTo,
    priority: 2,
    category_id: "",
    due_date: "",
  });

  // TanStack Query hooks
  const { data: tasks = [], isLoading: loading } = useTasks(
    workspace?.id || ""
  );
  const { data: availableCategories = [] } = useCategories(workspace?.id || "");

  // Mutations
  const createTaskMutation = useCreateTask(workspace?.id || "");
  const updateTaskMutation = useUpdateTask();
  const toggleTaskCompletionMutation = useToggleTaskCompletion();
  const deleteTaskMutation = useDeleteTask();

  // Loading states from mutations
  const isSubmitting =
    createTaskMutation.isPending || updateTaskMutation.isPending;
  const isUpdating =
    updateTaskMutation.isPending ||
    toggleTaskCompletionMutation.isPending ||
    deleteTaskMutation.isPending;

  // Form handling functions
  const resetForm = () => {
    setFormData({
      title: "",
      notes: "",
      assigned_to: "me" as AssignedTo,
      priority: 2,
      category_id: "",
      due_date: "",
    });
    setSelectedDate(undefined);
    setEditingTask(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!workspace?.id || !formData.title.trim()) {
      return;
    }

    try {
      if (editingTask) {
        // Update existing task
        await updateTaskMutation.mutateAsync({
          taskId: editingTask.id,
          updates: {
            title: formData.title.trim(),
            assigned_to: formData.assigned_to,
            category_id: formData.category_id || undefined,
            due_date: formData.due_date || undefined,
            priority: formData.priority,
            notes: formData.notes || undefined,
          },
        });
      } else {
        // Create new task
        await createTaskMutation.mutateAsync({
          title: formData.title.trim(),
          assigned_to: formData.assigned_to,
          category_id: formData.category_id || undefined,
          due_date: formData.due_date || undefined,
          priority: formData.priority,
          notes: formData.notes || undefined,
        });
      }

      // Close dialog and reset form
      setIsAddTaskOpen(false);
      resetForm();
      setEditingTask(null);
    } catch (error) {
      console.error(
        editingTask ? "Error updating task:" : "Error creating task:",
        error
      );
      // You could add toast notification here
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    // Map done status to our status filter
    const taskStatus = task.done ? "completed" : "todo"; // Note: we don't have "in-progress" in schema
    const matchesStatus = filterStatus === "all" || taskStatus === filterStatus;

    // Map priority number to string
    const priorityMap: Record<number, string> = {
      1: "high",
      2: "medium",
      3: "low",
    };
    const taskPriority = priorityMap[task.priority] || "medium";
    const matchesPriority =
      filterPriority === "all" || taskPriority === filterPriority;

    const matchesAssignee =
      filterAssignee === "all" || task.assigned_to === filterAssignee;

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  const todoTasks = filteredTasks.filter((task) => !task.done);
  const inProgressTasks: TaskWithDetails[] = []; // We don't have "in-progress" status in schema
  const completedTasks = filteredTasks.filter((task) => task.done);

  const getAssigneeIcon = (assignee: string) => {
    switch (assignee) {
      case "me":
        return <UserIcon className="w-4 h-4" />;
      case "him":
        return <UserIcon className="w-4 h-4" />;
      case "both":
        return <UsersIcon className="w-4 h-4" />;
      default:
        return <UserIcon className="w-4 h-4" />;
    }
  };

  const isOverdue = (task: TaskWithDetails) => {
    return task.due_date && new Date() > new Date(task.due_date) && !task.done;
  };

  const handleToggleTask = async (taskId: string, done: boolean) => {
    try {
      await toggleTaskCompletionMutation.mutateAsync({ taskId, done: !done });
    } catch (error) {
      console.error("Error toggling task:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTaskMutation.mutateAsync(taskId);
      // Close the sheet after successful deletion
      setSelectedTask(null);
      setShowDeleteConfirmation(false);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  // Helper function to clear filters
  const clearFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setFilterPriority("all");
    setFilterAssignee("all");
  };

  // Empty State Component
  const EmptyState = ({ onAddTask }: { onAddTask: () => void }) => (
    <Card className="text-center py-12">
      <CardContent>
        <CheckSquareIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No tasks yet
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Start organizing your move by creating tasks. You can assign them to
          yourself or your partner and track progress.
        </p>
        <Button onClick={onAddTask} className="mx-auto">
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Your First Task
        </Button>
      </CardContent>
    </Card>
  );

  // No Results State Component
  const NoResultsState = ({
    onClearFilters,
  }: {
    onClearFilters: () => void;
  }) => (
    <Card className="text-center py-12">
      <CardContent>
        <MagnifyingGlassIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No tasks match your filters
        </h3>
        <p className="text-gray-600 mb-6">
          Try adjusting your search terms or clearing the filters to see more
          results.
        </p>
        <Button onClick={onClearFilters} variant="outline">
          Clear Filters
        </Button>
      </CardContent>
    </Card>
  );

  // Task Card Component
  const TaskCard = ({
    task,
    onClick,
  }: {
    task: TaskWithDetails;
    onClick: () => void;
  }) => (
    <Card
      className={`group cursor-pointer hover:shadow-md transition-all duration-200 ${
        task.done
          ? "bg-gray-50/50 border-gray-200"
          : isOverdue(task)
          ? "border-red-200 bg-red-50/30"
          : "hover:border-blue-200 hover:bg-blue-50/20"
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* Calendar Date */}
            <div className="flex-shrink-0 bg-white border border-gray-200 rounded-lg p-2 text-center min-w-[48px]">
              {task.due_date ? (
                <>
                  <div className="text-xs font-medium text-gray-500 uppercase">
                    {format(new Date(task.due_date), "MMM")}
                  </div>
                  <div className="text-lg font-bold text-gray-900 leading-none">
                    {format(new Date(task.due_date), "d")}
                  </div>
                </>
              ) : (
                <div className="text-xs text-gray-400">No date</div>
              )}
            </div>

            {/* Task Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h4
                  className={`font-medium truncate ${
                    task.done ? "line-through text-gray-500" : "text-gray-900"
                  }`}
                >
                  {task.title}
                </h4>

                {/* Priority indicator */}
                {task.priority === 1 && !task.done && (
                  <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full"></div>
                )}

                {/* Overdue warning */}
                {isOverdue(task) && (
                  <WarningIcon className="flex-shrink-0 w-4 h-4 text-red-500" />
                )}
              </div>

              {/* Metadata row */}
              <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  {getAssigneeIcon(task.assigned_to)}
                  <span className="capitalize">{task.assigned_to}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Action hint */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-400 flex-shrink-0">
              Tap for details
            </div>

            {/* Category Badge */}
            {task.category && (
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                {task.category.name}
              </Badge>
            )}

            {/* Status Icon */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleToggleTask(task.id, task.done);
              }}
              className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 hover:scale-110 ${
                task.done
                  ? "bg-green-500 border-green-500 text-white"
                  : "border-gray-300 hover:border-blue-500 group-hover:border-blue-400"
              }`}
            >
              {task.done && <CheckIcon className="w-3 h-3" />}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Mobile-First Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-600">
            {tasks.length} tasks • manage your move
          </p>
        </div>
        <Sheet open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
          <SheetTrigger asChild>
            <Button size="sm">
              <PlusIcon className="w-4 h-4 mr-1" />
              Add Task
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-xl p-6">
            <SheetHeader className="sr-only">
              <SheetTitle>Add New Task</SheetTitle>
              <SheetDescription>
                Create a new task for your moving checklist
              </SheetDescription>
            </SheetHeader>

            {/* Header with drag indicator */}
            <div className="flex flex-col items-center pb-4 -mt-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full mb-4" />
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <PlusIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {editingTask ? "Edit Task" : "Add Task"}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {editingTask
                        ? "Update your task details"
                        : "Create a new task for your moving checklist"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto space-y-6"
            >
              {/* Task Details */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <span className="mr-2 text-lg">✅</span>
                  Task Details
                </h3>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="task-title">Task Title *</Label>
                    <Input
                      id="task-title"
                      placeholder="What needs to be done?"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      required
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="task-notes">Notes (optional)</Label>
                    <Textarea
                      id="task-notes"
                      placeholder="Add more details..."
                      rows={3}
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      className="bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Assignment & Priority */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <span className="mr-2 text-lg">👤</span>
                  Assignment & Priority
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={formData.priority.toString()}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          priority: parseInt(value),
                        }))
                      }
                    >
                      <SelectTrigger className="bg-white w-full">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">🔥 High</SelectItem>
                        <SelectItem value="2">⚡ Medium</SelectItem>
                        <SelectItem value="3">📋 Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Assignee</Label>
                    <Select
                      value={formData.assigned_to}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          assigned_to: value as AssignedTo,
                        }))
                      }
                    >
                      <SelectTrigger className="bg-white w-full">
                        <SelectValue placeholder="Who's doing this?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="me">Me</SelectItem>
                        <SelectItem value="him">Him</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Organization */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <span className="mr-2 text-lg">📅</span>
                  Organization
                </h3>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Due Date (optional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal bg-white"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate
                            ? format(selectedDate, "PPP")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            setSelectedDate(date);
                            setFormData((prev) => ({
                              ...prev,
                              due_date: date ? format(date, "yyyy-MM-dd") : "",
                            }));
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Category (optional)</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, category_id: value }))
                      }
                    >
                      <SelectTrigger className="bg-white w-full">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </form>

            {/* Action Buttons */}
            <div className="pt-6 border-t bg-white space-y-3">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-3 text-base font-medium"
              >
                {isSubmitting ? (
                  <>
                    <SpinnerGapIcon className="w-4 h-4 mr-2 animate-spin" />
                    {editingTask ? "Updating..." : "Adding..."}
                  </>
                ) : editingTask ? (
                  <>
                    <CheckIcon className="w-5 h-5 mr-2" />
                    Update Task
                  </>
                ) : (
                  <>
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add Task
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddTaskOpen(false);
                  resetForm();
                }}
                className="w-full py-3 text-base font-medium"
              >
                Cancel
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Compact Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-orange-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-orange-900">
            {todoTasks.length}
          </div>
          <div className="text-xs text-orange-700">To Do</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-blue-900">
            {inProgressTasks.length}
          </div>
          <div className="text-xs text-blue-700">In Progress</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-green-900">
            {completedTasks.length}
          </div>
          <div className="text-xs text-green-700">Completed</div>
        </div>
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-red-900">
            {tasks.filter(isOverdue).length}
          </div>
          <div className="text-xs text-red-700">Overdue</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <FunnelIcon className="w-4 h-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-xl p-6">
            <SheetHeader className="sr-only">
              <SheetTitle>Filter Tasks</SheetTitle>
              <SheetDescription>
                Filter and organize your task list
              </SheetDescription>
            </SheetHeader>

            {/* Header with drag indicator */}
            <div className="flex flex-col items-center pb-4 -mt-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full mb-4" />
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <FunnelIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Filter Tasks
                    </h2>
                    <p className="text-sm text-gray-500">
                      Filter and organize your task list
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Filter Options */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <span className="mr-2 text-lg">🔍</span>
                  Filter Options
                </h3>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={filterStatus}
                      onValueChange={setFilterStatus}
                    >
                      <SelectTrigger className="bg-white w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={filterPriority}
                      onValueChange={setFilterPriority}
                    >
                      <SelectTrigger className="bg-white w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Assignee</Label>
                    <Select
                      value={filterAssignee}
                      onValueChange={setFilterAssignee}
                    >
                      <SelectTrigger className="bg-white w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Assignees</SelectItem>
                        <SelectItem value="me">Me</SelectItem>
                        <SelectItem value="him">Him</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t bg-white space-y-3">
              <Button
                onClick={() => setIsFilterOpen(false)}
                className="w-full py-3 text-base font-medium"
              >
                <>
                  <FunnelIcon className="w-5 h-5 mr-2" />
                  Apply Filters
                </>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFilterStatus("all");
                  setFilterPriority("all");
                  setFilterAssignee("all");
                }}
                className="w-full py-3 text-base font-medium"
              >
                Clear All Filters
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <SpinnerGapIcon className="w-8 h-8 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-600">Loading tasks...</span>
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState onAddTask={() => setIsAddTaskOpen(true)} />
      ) : filteredTasks.length === 0 ? (
        <NoResultsState onClearFilters={clearFilters} />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All ({filteredTasks.length})</TabsTrigger>
            <TabsTrigger value="todo">To Do ({todoTasks.length})</TabsTrigger>
            <TabsTrigger value="completed">
              Done ({completedTasks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-4">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => setSelectedTask(task)}
              />
            ))}
          </TabsContent>

          <TabsContent value="todo" className="space-y-2 mt-4">
            {todoTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => setSelectedTask(task)}
              />
            ))}
          </TabsContent>

          <TabsContent value="completed" className="space-y-2 mt-4">
            {completedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => setSelectedTask(task)}
              />
            ))}
          </TabsContent>
        </Tabs>
      )}

      {/* Task Detail View Sheet */}
      <Sheet
        open={selectedTask !== null}
        onOpenChange={() => {
          setSelectedTask(null);
          setShowDeleteConfirmation(false);
        }}
      >
        <SheetContent side="bottom" className="h-[85vh] rounded-t-xl p-6">
          <SheetHeader className="sr-only">
            <SheetTitle>Task Details</SheetTitle>
            <SheetDescription>View and manage task details</SheetDescription>
          </SheetHeader>
          {selectedTask && (
            <>
              {/* Header with drag indicator */}
              <div className="flex flex-col items-center pb-4 -mt-2">
                <div className="w-12 h-1 bg-gray-300 rounded-full mb-4" />
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        selectedTask.done
                          ? "bg-gradient-to-br from-green-500 to-emerald-600"
                          : isOverdue(selectedTask)
                          ? "bg-gradient-to-br from-red-500 to-rose-600"
                          : selectedTask.priority === 1
                          ? "bg-gradient-to-br from-red-500 to-orange-600"
                          : selectedTask.priority === 2
                          ? "bg-gradient-to-br from-blue-500 to-purple-600"
                          : "bg-gradient-to-br from-gray-500 to-slate-600"
                      }`}
                    >
                      {selectedTask.done ? (
                        <CheckSquareIcon className="w-6 h-6 text-white" />
                      ) : (
                        <CheckSquareIcon className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h2
                        className={`text-xl font-bold ${
                          selectedTask.done
                            ? "line-through text-gray-500"
                            : "text-gray-900"
                        }`}
                      >
                        {selectedTask.title}
                      </h2>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge
                          variant={selectedTask.done ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {selectedTask.done ? "✅ Completed" : "⏳ Pending"}
                        </Badge>
                        <Badge
                          variant={
                            selectedTask.priority === 1
                              ? "destructive"
                              : selectedTask.priority === 2
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {selectedTask.priority === 1
                            ? "🔥 High Priority"
                            : selectedTask.priority === 2
                            ? "⚡ Medium Priority"
                            : "📋 Low Priority"}
                        </Badge>
                        {isOverdue(selectedTask) && (
                          <Badge variant="destructive" className="text-xs">
                            <WarningIcon className="w-3 h-3 mr-1" />
                            Overdue
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6">
                {/* Task Details */}
                {selectedTask.notes && (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <span className="mr-2 text-lg">📝</span>
                      Notes
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {selectedTask.notes}
                    </p>
                  </div>
                )}

                {/* Assignment & Schedule */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <span className="mr-2 text-lg">👤</span>
                    Assignment & Schedule
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">
                        Assigned to:
                      </span>
                      <div className="flex items-center space-x-2">
                        {getAssigneeIcon(selectedTask.assigned_to)}
                        <span className="capitalize font-medium">
                          {selectedTask.assigned_to}
                        </span>
                      </div>
                    </div>
                    {selectedTask.due_date && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">
                          Due date:
                        </span>
                        <div
                          className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                            isOverdue(selectedTask)
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          <CalendarIcon className="w-4 h-4" />
                          <span>
                            {format(new Date(selectedTask.due_date), "PPP")}
                          </span>
                        </div>
                      </div>
                    )}
                    {selectedTask.category && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">
                          Category:
                        </span>
                        <Badge variant="outline">
                          {selectedTask.category.name}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t bg-white space-y-3">
                {!showDeleteConfirmation ? (
                  <>
                    <Button
                      onClick={() => {
                        // Close current sheet and open edit form with pre-filled data
                        if (selectedTask) {
                          // Set editing mode
                          setEditingTask(selectedTask);

                          // Pre-fill form with selected task data
                          setFormData({
                            title: selectedTask.title,
                            notes: selectedTask.notes || "",
                            assigned_to: selectedTask.assigned_to,
                            priority: selectedTask.priority,
                            category_id: selectedTask.category?.id || "",
                            due_date: selectedTask.due_date || "",
                          });

                          // Set the selected date for the calendar
                          if (selectedTask.due_date) {
                            setSelectedDate(new Date(selectedTask.due_date));
                          } else {
                            setSelectedDate(undefined);
                          }

                          // Close detail sheet and open edit sheet
                          setSelectedTask(null);
                          setIsAddTaskOpen(true);
                        }
                      }}
                      variant="outline"
                      className="w-full py-3 text-base font-medium"
                    >
                      <span className="mr-2">✏️</span>
                      Edit Task
                    </Button>
                    <Button
                      onClick={async () => {
                        try {
                          await handleToggleTask(
                            selectedTask.id,
                            selectedTask.done
                          );
                          // Close the sheet after successful toggle
                          setSelectedTask(null);
                        } catch (error) {
                          console.error("Error toggling task:", error);
                        }
                      }}
                      disabled={isUpdating}
                      className="w-full py-3 text-base font-medium"
                      variant={selectedTask.done ? "outline" : "default"}
                    >
                      {isUpdating ? (
                        <>
                          <SpinnerGapIcon className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : selectedTask.done ? (
                        <>
                          <span className="mr-2">↩️</span>
                          Mark as Pending
                        </>
                      ) : (
                        <>
                          <CheckIcon className="w-5 h-5 mr-2" />
                          Mark as Complete
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setShowDeleteConfirmation(true)}
                      variant="destructive"
                      className="w-full py-3 text-base font-medium"
                    >
                      <TrashIcon className="w-5 h-5 mr-2" />
                      Delete Task
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Delete Confirmation */}
                    <div className="bg-red-50 rounded-xl p-4 space-y-3">
                      <div className="text-center">
                        <TrashIcon className="w-12 h-12 text-red-500 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-red-900 mb-2">
                          Delete Task?
                        </h3>
                        <p className="text-sm text-red-700">
                          This action cannot be undone. The task &ldquo;
                          {selectedTask.title}&rdquo; will be permanently
                          deleted.
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDeleteTask(selectedTask.id)}
                      disabled={deleteTaskMutation.isPending}
                      variant="destructive"
                      className="w-full py-3 text-base font-medium"
                    >
                      {deleteTaskMutation.isPending ? (
                        <>
                          <SpinnerGapIcon className="w-4 h-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <TrashIcon className="w-5 h-5 mr-2" />
                          Yes, Delete Task
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setShowDeleteConfirmation(false)}
                      variant="outline"
                      className="w-full py-3 text-base font-medium"
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
