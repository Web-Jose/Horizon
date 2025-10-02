import { supabase } from "./supabaseClient";
import { TaskWithDetails, AssignedTo } from "./types";

export class TasksService {
  /**
   * Fetch all tasks for a workspace with related data
   */
  static async getTasksWithDetails(
    workspaceId: string
  ): Promise<TaskWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select(
          `
          *,
          category:categories(id, name, color)
        `
        )
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching tasks:", error);
        throw error;
      }

      return (data as TaskWithDetails[]) || [];
    } catch (error) {
      console.error("Database connection error:", error);

      // Check if this is a database setup issue
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes("relation") &&
        errorMessage.includes("does not exist")
      ) {
        console.warn(`
🏗️ Database Setup Required

Visit: https://supabase.com/dashboard/project/jlnumgeggvpnhkassmho/sql
Copy the contents of 'schema.md.txt' and run it to set up your database.

Returning mock data for development...
        `);

        // Return some mock data for development
        return [
          {
            id: "mock-1",
            workspace_id: "mock-workspace",
            title: "Book removal company",
            assigned_to: "me" as AssignedTo,
            category_id: "mock-category-1",
            due_date: "2024-02-15",
            priority: 1,
            notes: "Research and book a reliable removal company for the move",
            done: false,
            created_at: new Date().toISOString(),
            category: {
              id: "mock-category-1",
              workspace_id: "mock-workspace",
              name: "Logistics",
              color: "#3B82F6",
            },
          },
          {
            id: "mock-2",
            workspace_id: "mock-workspace",
            title: "Submit address change forms",
            assigned_to: "both" as AssignedTo,
            category_id: "mock-category-2",
            due_date: "2024-02-18",
            priority: 2,
            notes: "Update address with bank, insurance, utilities, etc.",
            done: false,
            created_at: new Date().toISOString(),
            category: {
              id: "mock-category-2",
              workspace_id: "mock-workspace",
              name: "Administrative",
              color: "#EF4444",
            },
          },
          {
            id: "mock-3",
            workspace_id: "mock-workspace",
            title: "Research internet providers",
            assigned_to: "me" as AssignedTo,
            category_id: "mock-category-3",
            due_date: null,
            priority: 2,
            notes: "Compare internet packages for the new home",
            done: true,
            created_at: new Date().toISOString(),
            category: {
              id: "mock-category-3",
              workspace_id: "mock-workspace",
              name: "Utilities",
              color: "#10B981",
            },
          },
        ];
      }

      return []; // Return empty array for other errors
    }
  }

  /**
   * Create a new task
   */
  static async createTask(
    workspaceId: string,
    taskData: {
      title: string;
      assigned_to: AssignedTo;
      category_id?: string;
      due_date?: string;
      priority?: number;
      notes?: string;
    }
  ): Promise<TaskWithDetails> {
    try {
      const insertData = {
        workspace_id: workspaceId,
        title: taskData.title,
        assigned_to: taskData.assigned_to,
        category_id: taskData.category_id || null,
        due_date: taskData.due_date || null,
        priority: taskData.priority ?? 2,
        notes: taskData.notes || null,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: task, error: taskError } = await (supabase as any)
        .from("tasks")
        .insert(insertData)
        .select()
        .single();

      if (taskError || !task) {
        console.error("Error creating task:", taskError);
        throw taskError || new Error("Failed to create task");
      }

      // Return the task with details (fetch it back with joins)
      return this.getTaskWithDetails(task.id);
    } catch (error) {
      console.error("Error in createTask:", error);
      throw error;
    }
  }

  /**
   * Get a single task with all its details
   */
  static async getTaskWithDetails(taskId: string): Promise<TaskWithDetails> {
    const { data, error } = await supabase
      .from("tasks")
      .select(
        `
        *,
        category:categories(id, name, color)
      `
      )
      .eq("id", taskId)
      .single();

    if (error) {
      console.error("Error fetching task with details:", error);
      throw error;
    }

    return data as TaskWithDetails;
  }

  /**
   * Update a task
   */
  static async updateTask(
    taskId: string,
    updates: {
      title?: string;
      assigned_to?: AssignedTo;
      category_id?: string;
      due_date?: string;
      priority?: number;
      notes?: string;
      done?: boolean;
    }
  ): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("tasks")
        .update(updates)
        .eq("id", taskId);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  }

  /**
   * Toggle task completion status
   */
  static async toggleTaskCompletion(
    taskId: string,
    done: boolean
  ): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("tasks")
        .update({ done })
        .eq("id", taskId);

      if (error) throw error;
    } catch (error) {
      console.error("Error toggling task completion:", error);
      throw error;
    }
  }

  /**
   * Delete a task
   */
  static async deleteTask(taskId: string): Promise<void> {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  }
}
