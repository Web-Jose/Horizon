"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, PlusIcon } from "@phosphor-icons/react";
import { format } from "date-fns";
import { useCreateTask } from "@/lib/hooks/useTaskQueries";
import { useCategories } from "@/lib/hooks/useShoppingQueries";
import { AssignedTo } from "@/lib/types";

interface CreateTaskSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
}

export function CreateTaskSheet({
  open,
  onOpenChange,
  workspaceId,
}: CreateTaskSheetProps) {
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState<AssignedTo>("me");
  const [categoryId, setCategoryId] = useState<string>("");
  const [dueDate, setDueDate] = useState<Date>();
  const [priority, setPriority] = useState<number>(2);
  const [notes, setNotes] = useState("");

  const createTaskMutation = useCreateTask(workspaceId);
  const { data: categories = [] } = useCategories(workspaceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    try {
      await createTaskMutation.mutateAsync({
        title: title.trim(),
        assigned_to: assignedTo,
        category_id: categoryId || undefined,
        due_date: dueDate ? dueDate.toISOString().split("T")[0] : undefined,
        priority,
        notes: notes.trim() || undefined,
      });

      // Reset form
      setTitle("");
      setAssignedTo("me");
      setCategoryId("");
      setDueDate(undefined);
      setPriority(2);
      setNotes("");

      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-xl p-6">
        <SheetHeader className="sr-only">
          <SheetTitle>Create New Task</SheetTitle>
          <SheetDescription>
            Add a new task to help organize your move
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
                <h2 className="text-xl font-bold text-gray-900">Add Task</h2>
                <p className="text-sm text-gray-500">
                  Create a new task for your moving checklist
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned-to">Assigned To</Label>
            <Select
              value={assignedTo}
              onValueChange={(value: AssignedTo) => setAssignedTo(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="me">Me</SelectItem>
                <SelectItem value="him">Him</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={categoryId || "none"}
              onValueChange={(value) =>
                setCategoryId(value === "none" ? "" : value)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : "Select date (optional)"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={priority.toString()}
              onValueChange={(value) => setPriority(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Low</SelectItem>
                <SelectItem value="2">Medium</SelectItem>
                <SelectItem value="3">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || createTaskMutation.isPending}
            >
              {createTaskMutation.isPending ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
