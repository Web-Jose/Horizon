// Onboarding service functions for Moving Home Planner
/* eslint-disable @typescript-eslint/no-explicit-any */

import { supabase } from "./supabaseClient";
import {
  OnboardingData,
  WorkspaceInsert,
  DEFAULT_CATEGORIES,
  DEFAULT_ROOMS,
  MemberWithWorkspace,
} from "./types";

export class OnboardingService {
  /**
   * Create a new workspace with the provided data
   */
  static async createWorkspace(data: OnboardingData, userId: string) {
    try {
      // Convert sales tax rate from percentage to decimal (e.g., 8.25 -> 0.0825)
      const salesTaxDecimal = data.salesTaxRate / 100;

      const workspaceData: WorkspaceInsert = {
        name: data.workspaceName,
        zip: data.zip || null,
        currency: data.currency,
        sales_tax_rate_pct: salesTaxDecimal,
        move_in_date: data.moveInDate || null,
        created_by: userId,
      };

      // Type assertion to work around Supabase inference issues
      const workspaceQuery = supabase.from("workspaces") as any;
      const { data: workspace, error: workspaceError } = await workspaceQuery
        .insert(workspaceData)
        .select()
        .single();

      if (workspaceError) {
        console.error("Error creating workspace:", workspaceError);
        throw new Error("Failed to create workspace");
      }

      if (!workspace) {
        throw new Error("Workspace creation failed - no data returned");
      }

      // Add the creator as a member
      const memberQuery = supabase.from("members") as any;
      const { error: memberError } = await memberQuery.insert({
        workspace_id: workspace.id,
        user_id: userId,
        role: "member",
      });

      if (memberError) {
        console.error("Error adding creator as member:", memberError);
        throw new Error("Failed to add creator as member");
      }

      return workspace;
    } catch (error) {
      console.error("Workspace creation failed:", error);
      throw error;
    }
  }

  /**
   * Send invitation to partner (for V1, we'll store the email and show invite link)
   * In production, this would send an actual email
   */
  static async invitePartner(workspaceId: string, partnerEmail: string) {
    try {
      // For V1, we'll create a simple invitation record or use a basic invite system
      // In a real app, you'd integrate with email service
      const inviteUrl = `${
        window.location.origin
      }/invite/${workspaceId}?email=${encodeURIComponent(partnerEmail)}`;

      // Log the activity
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        const activityQuery = supabase.from("activity_log") as any;
        await activityQuery.insert({
          workspace_id: workspaceId,
          actor_id: user.user.id,
          type: "partner_invited",
          entity: "workspace",
          entity_id: workspaceId,
          payload: { partner_email: partnerEmail, invite_url: inviteUrl },
        });
      }

      return { inviteUrl, success: true };
    } catch (error) {
      console.error("Partner invitation failed:", error);
      throw error;
    }
  }

  /**
   * Create default categories for the workspace
   */
  static async createDefaultCategories(
    workspaceId: string,
    selectedCategories?: string[]
  ) {
    try {
      const categoriesToCreate =
        selectedCategories && selectedCategories.length > 0
          ? DEFAULT_CATEGORIES.filter((cat) =>
              selectedCategories.includes(cat.name)
            )
          : DEFAULT_CATEGORIES;

      const categoriesData = categoriesToCreate.map((category) => ({
        workspace_id: workspaceId,
        name: category.name,
        color: category.color,
      }));

      const categoriesQuery = supabase.from("categories") as any;
      const { data: categories, error } = await categoriesQuery
        .insert(categoriesData)
        .select();

      if (error) {
        console.error("Error creating categories:", error);
        throw new Error("Failed to create categories");
      }

      return categories;
    } catch (error) {
      console.error("Category creation failed:", error);
      throw error;
    }
  }

  /**
   * Create default rooms for the workspace
   */
  static async createDefaultRooms(
    workspaceId: string,
    selectedRooms?: string[]
  ) {
    try {
      const roomsToCreate =
        selectedRooms && selectedRooms.length > 0
          ? selectedRooms
          : DEFAULT_ROOMS;

      const roomsData = roomsToCreate.map((roomName) => ({
        workspace_id: workspaceId,
        name: roomName,
      }));

      const roomsQuery = supabase.from("rooms") as any;
      const { data: rooms, error } = await roomsQuery
        .insert(roomsData)
        .select();

      if (error) {
        console.error("Error creating rooms:", error);
        throw new Error("Failed to create rooms");
      }

      return rooms;
    } catch (error) {
      console.error("Room creation failed:", error);
      throw error;
    }
  }

  /**
   * Complete the full onboarding process
   */
  static async completeOnboarding(data: OnboardingData) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error("User not authenticated");
      }

      // Step 1: Create workspace
      const workspace = await this.createWorkspace(data, user.user.id);

      // Step 2: Create categories and rooms
      const [categories, rooms] = await Promise.all([
        this.createDefaultCategories(workspace.id, data.selectedCategories),
        this.createDefaultRooms(workspace.id, data.selectedRooms),
      ]);

      // Step 3: Send partner invitation if provided
      let inviteResult = null;
      if (data.partnerEmail) {
        inviteResult = await this.invitePartner(
          workspace.id,
          data.partnerEmail
        );
      }

      // Log completion
      const completionActivityQuery = supabase.from("activity_log") as any;
      await completionActivityQuery.insert({
        workspace_id: workspace.id,
        actor_id: user.user.id,
        type: "onboarding_completed",
        entity: "workspace",
        entity_id: workspace.id,
        payload: {
          categories_created: categories?.length || 0,
          rooms_created: rooms?.length || 0,
          partner_invited: !!data.partnerEmail,
        },
      });

      return {
        workspace,
        categories,
        rooms,
        invite: inviteResult,
        success: true,
      };
    } catch (error) {
      console.error("Onboarding completion failed:", error);
      throw error;
    }
  }

  /**
   * Check if user has any workspaces
   */
  static async getUserWorkspaces(userId: string) {
    try {
      const { data: members, error } = await supabase
        .from("members")
        .select(
          `
          workspace_id,
          workspaces (
            id,
            name,
            currency,
            move_in_date,
            created_at
          )
        `
        )
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching user workspaces:", error);
        throw new Error("Failed to fetch workspaces");
      }

      // Extract workspaces from the members data
      const workspaces =
        members
          ?.map((member: MemberWithWorkspace) => member.workspaces)
          .filter(Boolean) || [];
      return workspaces;
    } catch (error) {
      console.error("Workspace fetch failed:", error);
      throw error;
    }
  }
}
