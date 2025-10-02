"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TasksService } from "../tasks";
import { TaskWithDetails, AssignedTo } from "../types";

// Query Keys
export const taskQueryKeys = {
  tasks: (workspaceId: string) => ["tasks", workspaceId] as const,
  task: (taskId: string) => ["task", taskId] as const,
};

// Tasks Hooks
export function useTasks(workspaceId: string) {
  return useQuery({
    queryKey: taskQueryKeys.tasks(workspaceId),
    queryFn: () => TasksService.getTasksWithDetails(workspaceId),
    enabled: !!workspaceId,
    staleTime: 30 * 1000, // 30 seconds - tasks change frequently
  });
}

export function useTask(taskId: string) {
  return useQuery({
    queryKey: taskQueryKeys.task(taskId),
    queryFn: () => TasksService.getTaskWithDetails(taskId),
    enabled: !!taskId,
    staleTime: 60 * 1000, // 1 minute
  });
}

// Task Mutations
export function useCreateTask(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskData: {
      title: string;
      assigned_to: AssignedTo;
      category_id?: string;
      due_date?: string;
      priority?: number;
      notes?: string;
    }) => TasksService.createTask(workspaceId, taskData),
    onMutate: async (newTask) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: taskQueryKeys.tasks(workspaceId),
      });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(
        taskQueryKeys.tasks(workspaceId)
      );

      // Optimistically update to the new value
      queryClient.setQueryData(
        taskQueryKeys.tasks(workspaceId),
        (old: TaskWithDetails[] = []) => [
          {
            id: `temp-${Date.now()}`,
            workspace_id: workspaceId,
            title: newTask.title,
            assigned_to: newTask.assigned_to,
            category_id: newTask.category_id || null,
            due_date: newTask.due_date || null,
            priority: newTask.priority ?? 2,
            notes: newTask.notes || null,
            done: false,
            created_at: new Date().toISOString(),
            category: null, // Will be populated after successful creation
          } satisfies TaskWithDetails,
          ...old,
        ]
      );

      // Return a context object with the snapshotted value
      return { previousTasks };
    },
    onError: (err, newTask, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(
        taskQueryKeys.tasks(workspaceId),
        context?.previousTasks
      );
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: taskQueryKeys.tasks(workspaceId),
      });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      updates,
    }: {
      taskId: string;
      updates: {
        title?: string;
        assigned_to?: AssignedTo;
        category_id?: string;
        due_date?: string;
        priority?: number;
        notes?: string;
        done?: boolean;
      };
    }) => TasksService.updateTask(taskId, updates),
    onMutate: async ({ taskId, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      // Snapshot the previous value
      const previousData = queryClient.getQueriesData({ queryKey: ["tasks"] });

      // Optimistically update all task queries
      queryClient.setQueriesData(
        { queryKey: ["tasks"] },
        (old: TaskWithDetails[] = []) => {
          return old.map((task) =>
            task.id === taskId ? { ...task, ...updates } : task
          );
        }
      );

      // Return a context object with the snapshotted value
      return { previousData };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useToggleTaskCompletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, done }: { taskId: string; done: boolean }) =>
      TasksService.toggleTaskCompletion(taskId, done),
    onMutate: async ({ taskId, done }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      // Snapshot the previous value
      const previousData = queryClient.getQueriesData({ queryKey: ["tasks"] });

      // Optimistically update all task queries
      queryClient.setQueriesData(
        { queryKey: ["tasks"] },
        (old: TaskWithDetails[] = []) => {
          return old.map((task) =>
            task.id === taskId ? { ...task, done } : task
          );
        }
      );

      // Return a context object with the snapshotted value
      return { previousData };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => TasksService.deleteTask(taskId),
    onMutate: async (taskId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      // Snapshot the previous value
      const previousData = queryClient.getQueriesData({ queryKey: ["tasks"] });

      // Optimistically update all task queries
      queryClient.setQueriesData(
        { queryKey: ["tasks"] },
        (old: TaskWithDetails[] = []) => {
          return old.filter((task) => task.id !== taskId);
        }
      );

      // Return a context object with the snapshotted value
      return { previousData };
    },
    onError: (err, taskId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
