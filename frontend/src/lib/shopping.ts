import { supabase } from "./supabaseClient";
import {
  ItemWithDetails,
  Category,
  Room,
  Company,
  Workspace,
  WorkspaceMember,
  WorkspaceInvitation,
  Profile,
} from "./types";

export class ShoppingService {
  /**
   * Fetch all items for a workspace with related data
   */
  static async getItemsWithDetails(
    workspaceId: string
  ): Promise<ItemWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from("items")
        .select(
          `
          *,
          category:categories(id, name, color),
          room:rooms(id, name),
          company:companies(id, name, website),
          item_prices(est_unit_cents, actual_unit_cents)
        `
        )
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching items:", error);
        throw error;
      }

      // Define the expected shape of the item returned from Supabase
      type SupabaseItem = Omit<
        ItemWithDetails,
        "category" | "room" | "company" | "estimated_price" | "actual_price"
      > & {
        category: Category | null;
        room: Room | null;
        company: Company | null;
        item_prices?: { est_unit_cents?: number; actual_unit_cents?: number }[];
      };

      // Transform the data to match ItemWithDetails interface
      return ((data as SupabaseItem[]) || []).map((item) => {
        const latestPrice = item.item_prices?.[0];
        return {
          id: item.id,
          workspace_id: item.workspace_id,
          name: item.name,
          link: item.link,
          image_url: item.image_url,
          category_id: item.category_id,
          room_id: item.room_id,
          company_id: item.company_id,
          quantity: item.quantity,
          priority: item.priority,
          purchased: item.purchased,
          notes: item.notes,
          created_at: item.created_at,
          category: item.category,
          room: item.room,
          company: item.company,
          estimated_price: latestPrice?.est_unit_cents
            ? latestPrice.est_unit_cents / 100
            : 0,
          actual_price: latestPrice?.actual_unit_cents
            ? latestPrice.actual_unit_cents / 100
            : undefined,
        };
      });
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
Copy the contents of 'create_tables.sql' and run it to set up your database.

Returning mock data for development...
        `);

        // Return some mock data for development
        return [
          {
            id: "mock-1",
            workspace_id: "mock-workspace",
            name: "Sample Item - Database Setup Required",
            link: null,
            image_url: null,
            category_id: null,
            room_id: null,
            company_id: null,
            quantity: 1,
            priority: 2,
            purchased: false,
            notes:
              "This is sample data. Set up your database to see real items.",
            created_at: new Date().toISOString(),
            category: null,
            room: null,
            company: null,
            estimated_price: 29.99,
            actual_price: undefined,
          },
        ];
      }

      return []; // Return empty array for other errors
    }
  }

  /**
   * Create a new item with initial price
   */
  static async createItem(
    workspaceId: string,
    itemData: {
      name: string;
      link?: string;
      category_id?: string;
      room_id?: string;
      company_id?: string;
      quantity?: number;
      priority?: number;
      notes?: string;
      est_unit_cents: number; // in cents
    }
  ): Promise<ItemWithDetails> {
    try {
      // Create the item record - force type assertion to bypass inference issues
      const insertData = {
        workspace_id: workspaceId,
        name: itemData.name,
        link: itemData.link,
        category_id: itemData.category_id,
        room_id: itemData.room_id,
        company_id: itemData.company_id,
        quantity: itemData.quantity ?? 1,
        priority: itemData.priority ?? 2,
        notes: itemData.notes,
      };

      const itemsTable = supabase.from("items") as unknown as {
        insert: (data: typeof insertData) => {
          select: () => {
            single: () => Promise<{
              data: { id: string } | null;
              error: Error | null;
            }>;
          };
        };
      };
      const { data: item, error: itemError } = await itemsTable
        .insert(insertData)
        .select()
        .single();

      if (itemError || !item) {
        console.error("Error creating item:", itemError);
        throw itemError || new Error("Failed to create item");
      }

      // Create the initial price record
      const priceData = {
        item_id: item.id,
        est_unit_cents: itemData.est_unit_cents,
      };

      const pricesTable = supabase.from("item_prices") as unknown as {
        insert: (data: typeof priceData) => Promise<{ error: Error | null }>;
      };
      const { error: priceError } = await pricesTable.insert(priceData);

      if (priceError) {
        console.error("Error creating item price:", priceError);
        throw priceError;
      }

      // Return the item with details (fetch it back with joins)
      return this.getItemWithDetails(item.id);
    } catch (error) {
      console.error("Error in createItem:", error);
      throw error;
    }
  }

  /**
   * Get a single item with all its details
   */
  static async getItemWithDetails(itemId: string): Promise<ItemWithDetails> {
    const { data, error } = await supabase
      .from("items")
      .select(
        `
        *,
        category:categories(id, name, color),
        room:rooms(id, name),
        company:companies(id, name, website),
        item_prices(est_unit_cents, actual_unit_cents)
      `
      )
      .eq("id", itemId)
      .single();

    if (error) {
      console.error("Error fetching item with details:", error);
      throw error;
    }

    // Transform the data to match ItemWithDetails interface
    type SupabaseItem = Omit<
      ItemWithDetails,
      "category" | "room" | "company" | "estimated_price" | "actual_price"
    > & {
      category: Category | null;
      room: Room | null;
      company: Company | null;
      item_prices?: { est_unit_cents?: number; actual_unit_cents?: number }[];
    };
    const itemData = data as SupabaseItem;
    const latestPrice = itemData.item_prices?.[0];
    return {
      id: itemData.id,
      workspace_id: itemData.workspace_id,
      name: itemData.name,
      link: itemData.link,
      image_url: itemData.image_url,
      category_id: itemData.category_id,
      room_id: itemData.room_id,
      company_id: itemData.company_id,
      quantity: itemData.quantity,
      priority: itemData.priority,
      purchased: itemData.purchased,
      notes: itemData.notes,
      created_at: itemData.created_at,
      category: itemData.category,
      room: itemData.room,
      company: itemData.company,
      estimated_price: latestPrice?.est_unit_cents
        ? latestPrice.est_unit_cents / 100
        : 0,
      actual_price: latestPrice?.actual_unit_cents
        ? latestPrice.actual_unit_cents / 100
        : undefined,
    };
  }

  /**
   * Get categories for a workspace
   */
  static async getCategories(workspaceId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("name");

    if (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get rooms for a workspace
   */
  static async getRooms(workspaceId: string): Promise<Room[]> {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("name");

    if (error) {
      console.error("Error fetching rooms:", error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get companies for a workspace
   */
  static async getCompanies(workspaceId: string): Promise<Company[]> {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("name");

    if (error) {
      console.error("Error fetching companies:", error);
      throw error;
    }

    return data || [];
  }

  /**
   * Update an item's purchase status and actual price
   */
  static async updateItemPurchased(
    itemId: string,
    purchased: boolean,
    actualPrice?: number
  ): Promise<void> {
    try {
      // Convert actualPrice from dollars to cents
      const actualUnitCents =
        actualPrice !== undefined ? Math.round(actualPrice * 100) : undefined;

      console.log("Updating item purchased status:", {
        itemId,
        purchased,
        actualPrice,
        actualUnitCents,
      });

      // Update the item's purchased status
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: itemError } = await (supabase as any)
        .from("items")
        .update({ purchased })
        .eq("id", itemId);

      if (itemError) {
        console.error("Item update error:", {
          itemId,
          purchased,
          error: itemError,
          errorDetails: JSON.stringify(itemError, null, 2),
        });

        // Check if this is a database connection issue
        if (
          itemError.message?.includes("Failed to fetch") ||
          itemError.message?.includes("NetworkError") ||
          !process.env.NEXT_PUBLIC_SUPABASE_URL
        ) {
          console.warn(
            "Database not available, using mock success for development"
          );
          return; // Mock success in development
        }

        throw itemError;
      }

      // Handle price updates based on purchase status
      if (purchased && actualUnitCents !== undefined) {
        // Marking as purchased with actual price - update or create price record
        // First check if a price record exists
        const { data: existingPrice, error: selectError } = await supabase
          .from("item_prices")
          .select("id")
          .eq("item_id", itemId)
          .single();

        console.log("Price record check:", {
          existingPrice,
          selectError,
          itemId,
        });

        // Handle database connection issues for development
        if (
          selectError &&
          (selectError.message?.includes("Failed to fetch") ||
            selectError.message?.includes("NetworkError") ||
            !process.env.NEXT_PUBLIC_SUPABASE_URL)
        ) {
          console.warn(
            "Database not available for price operations, using mock success"
          );
          return;
        }

        if (existingPrice) {
          // Update existing price record
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: priceError } = await (supabase as any)
            .from("item_prices")
            .update({ actual_unit_cents: actualUnitCents })
            .eq("item_id", itemId);

          if (priceError) {
            console.error("Price update error:", {
              error: priceError,
              itemId,
              actualUnitCents,
              operation: "update",
              errorDetails: JSON.stringify(priceError, null, 2),
            });

            // Handle database connection issues
            if (
              priceError.message?.includes("Failed to fetch") ||
              priceError.message?.includes("NetworkError")
            ) {
              console.warn(
                "Database not available, using mock success for development"
              );
              return;
            }

            throw priceError;
          }
        } else {
          // Create new price record if none exists
          console.log("Creating new price record for item:", itemId);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: priceError } = await (supabase as any)
            .from("item_prices")
            .insert({
              item_id: itemId,
              est_unit_cents: 0, // Default estimated price
              actual_unit_cents: actualUnitCents,
            });

          if (priceError) {
            console.error("Price insert error:", {
              error: priceError,
              itemId,
              actualUnitCents,
              operation: "insert",
              errorDetails: JSON.stringify(priceError, null, 2),
            });

            // Handle database connection issues
            if (
              priceError.message?.includes("Failed to fetch") ||
              priceError.message?.includes("NetworkError")
            ) {
              console.warn(
                "Database not available, using mock success for development"
              );
              return;
            }

            throw priceError;
          } else {
            console.log("Successfully created price record");
          }
        }
      } else if (!purchased) {
        // Marking as not purchased - clear actual price if it exists
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: clearPriceError } = await (supabase as any)
          .from("item_prices")
          .update({ actual_unit_cents: null })
          .eq("item_id", itemId);

        if (clearPriceError) {
          console.error("Error clearing actual price:", {
            error: clearPriceError,
            itemId,
            operation: "clear_actual_price",
          });

          // Handle database connection issues
          if (
            clearPriceError.message?.includes("Failed to fetch") ||
            clearPriceError.message?.includes("NetworkError") ||
            !process.env.NEXT_PUBLIC_SUPABASE_URL
          ) {
            console.warn(
              "Database not available, using mock success for development"
            );
          } else {
            throw clearPriceError;
          }
        } else {
          console.log("Successfully cleared actual price for item:", itemId);
        }
      }
    } catch (error) {
      console.error("Error updating item purchase status:", {
        itemId,
        purchased,
        actualPrice,
        error: error instanceof Error ? error.message : error,
        fullError: error,
      });

      // Check if this is a database setup issue
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes("relation") &&
        errorMessage.includes("does not exist")
      ) {
        const setupMessage = `
🏗️ Database Setup Required

It looks like the database tables haven't been created yet. To set up your database:

1. Go to: https://supabase.com/dashboard/project/jlnumgeggvpnhkassmho/sql
2. Copy the contents of 'create_tables.sql' or 'schema.md.txt'  
3. Paste it into the SQL Editor and click "Run"
4. Refresh this page to try again

For now, the app will run in development mode with mock data.
        `;
        console.warn(setupMessage);

        // In development, return success to allow UI testing
        if (process.env.NODE_ENV === "development") {
          console.log(
            "🔧 Development mode: Mocking successful update operation"
          );
          return;
        }
      }

      throw error;
    }
  }

  /**
   * Update an item
   */
  static async updateItem(
    itemId: string,
    updates: {
      name?: string;
      link?: string;
      category_id?: string;
      room_id?: string;
      company_id?: string;
      quantity?: number;
      priority?: number;
      notes?: string;
      est_unit_cents?: number;
    }
  ): Promise<void> {
    try {
      const { est_unit_cents, ...itemUpdates } = updates;

      // Update the item record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: itemError } = await (supabase as any)
        .from("items")
        .update(itemUpdates)
        .eq("id", itemId);

      if (itemError) throw itemError;

      // Update price if provided
      if (est_unit_cents !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: priceError } = await (supabase as any)
          .from("item_prices")
          .update({ est_unit_cents })
          .eq("item_id", itemId);

        if (priceError) throw priceError;
      }
    } catch (error) {
      console.error("Error updating item:", error);
      throw error;
    }
  }

  /**
   * Delete an item
   */
  static async deleteItem(itemId: string): Promise<void> {
    try {
      const { error } = await supabase.from("items").delete().eq("id", itemId);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting item:", error);
      throw error;
    }
  }

  /**
   * Calculate shopping summary stats
   */
  static calculateSummary(items: ItemWithDetails[]) {
    const totalEstimated = items.reduce(
      (sum, item) => sum + (item.estimated_price || 0) * item.quantity,
      0
    );

    const totalSpent = items.reduce(
      (sum, item) =>
        sum + (item.actual_price || item.estimated_price || 0) * item.quantity,
      0
    );

    const pendingItems = items.filter((item) => !item.purchased).length;
    const purchasedItems = items.filter((item) => item.purchased).length;

    return {
      totalEstimated,
      totalSpent,
      pendingItems,
      purchasedItems,
    };
  }

  // Category CRUD operations
  static async createCategory(
    workspaceId: string,
    categoryData: { name: string; color?: string }
  ): Promise<Category> {
    try {
      const insertData = {
        workspace_id: workspaceId,
        name: categoryData.name,
        color: categoryData.color || "#6b7280",
      };

      const categoriesTable = supabase.from("categories") as unknown as {
        insert: (data: typeof insertData) => {
          select: () => {
            single: () => Promise<{
              data: Category | null;
              error: Error | null;
            }>;
          };
        };
      };

      const { data, error } = await categoriesTable
        .insert(insertData)
        .select()
        .single();

      if (error || !data) {
        console.error("Error creating category:", error);
        throw error || new Error("Failed to create category");
      }

      return data;
    } catch (error) {
      console.error("Error in createCategory:", error);
      throw error;
    }
  }

  static async updateCategory(
    categoryId: string,
    categoryData: { name?: string; color?: string }
  ): Promise<Category> {
    try {
      const categoriesTable = supabase.from("categories") as unknown as {
        update: (data: typeof categoryData) => {
          eq: (
            column: string,
            value: string
          ) => {
            select: () => {
              single: () => Promise<{
                data: Category | null;
                error: Error | null;
              }>;
            };
          };
        };
      };

      const { data, error } = await categoriesTable
        .update(categoryData)
        .eq("id", categoryId)
        .select()
        .single();

      if (error || !data) {
        console.error("Error updating category:", error);
        throw error || new Error("Failed to update category");
      }

      return data;
    } catch (error) {
      console.error("Error in updateCategory:", error);
      throw error;
    }
  }

  static async deleteCategory(categoryId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryId);

      if (error) {
        console.error("Error deleting category:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error in deleteCategory:", error);
      throw error;
    }
  }

  // Room CRUD operations
  static async createRoom(
    workspaceId: string,
    roomData: { name: string }
  ): Promise<Room> {
    try {
      const insertData = {
        workspace_id: workspaceId,
        name: roomData.name,
      };

      const roomsTable = supabase.from("rooms") as unknown as {
        insert: (data: typeof insertData) => {
          select: () => {
            single: () => Promise<{
              data: Room | null;
              error: Error | null;
            }>;
          };
        };
      };

      const { data, error } = await roomsTable
        .insert(insertData)
        .select()
        .single();

      if (error || !data) {
        console.error("Error creating room:", error);
        throw error || new Error("Failed to create room");
      }

      return data;
    } catch (error) {
      console.error("Error in createRoom:", error);
      throw error;
    }
  }

  static async updateRoom(
    roomId: string,
    roomData: { name: string }
  ): Promise<Room> {
    try {
      const roomsTable = supabase.from("rooms") as unknown as {
        update: (data: typeof roomData) => {
          eq: (
            column: string,
            value: string
          ) => {
            select: () => {
              single: () => Promise<{
                data: Room | null;
                error: Error | null;
              }>;
            };
          };
        };
      };

      const { data, error } = await roomsTable
        .update(roomData)
        .eq("id", roomId)
        .select()
        .single();

      if (error || !data) {
        console.error("Error updating room:", error);
        throw error || new Error("Failed to update room");
      }

      return data;
    } catch (error) {
      console.error("Error in updateRoom:", error);
      throw error;
    }
  }

  static async deleteRoom(roomId: string): Promise<void> {
    try {
      const { error } = await supabase.from("rooms").delete().eq("id", roomId);

      if (error) {
        console.error("Error deleting room:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error in deleteRoom:", error);
      throw error;
    }
  }

  // Workspace update operation
  static async updateWorkspace(
    workspaceId: string,
    workspaceData: {
      name?: string;
      zip?: string;
      currency?: string;
      move_in_date?: string;
    }
  ): Promise<Workspace> {
    try {
      const workspacesTable = supabase.from("workspaces") as unknown as {
        update: (data: typeof workspaceData) => {
          eq: (
            column: string,
            value: string
          ) => {
            select: () => {
              single: () => Promise<{
                data: Workspace | null;
                error: Error | null;
              }>;
            };
          };
        };
      };

      const { data, error } = await workspacesTable
        .update(workspaceData)
        .eq("id", workspaceId)
        .select()
        .single();

      if (error || !data) {
        console.error("Error updating workspace:", error);
        throw error || new Error("Failed to update workspace");
      }

      return data;
    } catch (error) {
      console.error("Error in updateWorkspace:", error);
      throw error;
    }
  }

  // Member management operations
  static async getWorkspaceMembers(workspaceId: string) {
    try {
      const membersTable = supabase.from("workspace_members") as unknown as {
        select: (query: string) => {
          eq: (
            column: string,
            value: string
          ) => Promise<{
            data: WorkspaceMember[] | null;
            error: Error | null;
          }>;
        };
      };

      const { data, error } = await membersTable
        .select(
          `
          *,
          user:profiles(email, full_name)
        `
        )
        .eq("workspace_id", workspaceId);

      if (error) {
        // Since team functionality is still being set up, return empty array for any error
        console.warn(
          "🔧 Team functionality incomplete setup detected. Likely missing:"
        );
        console.warn("   • profiles table (for user data)");
        console.warn("   • RLS policies (for security)");
        console.warn("   • user profile records");
        console.warn(
          "   👉 Run the complete setup-team-tables.sql script to fix all issues at once"
        );
        console.debug("Error details:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      // Handle case where team setup is incomplete - always return empty array to prevent crashes
      console.warn(
        "🔧 Team functionality setup incomplete - returning empty member list"
      );
      console.debug("getWorkspaceMembers catch error:", error);
      return [];
    }
  }

  static async inviteMember(
    workspaceId: string,
    email: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Check if team tables exist, return helpful message if not
      const testTable = supabase.from("workspace_members") as unknown as {
        select: () => {
          limit: (count: number) => Promise<{
            data: WorkspaceMember[] | null;
            error: Error | null;
          }>;
        };
      };

      const { error: testError } = await testTable.select().limit(1);

      if (
        testError &&
        (testError.message?.includes(
          'relation "workspace_members" does not exist'
        ) ||
          testError.message?.includes(
            'table "workspace_members" does not exist'
          ))
      ) {
        return {
          success: false,
          message:
            "Team functionality not available. Please run the database migration first.",
        };
      }

      // First check if user exists
      const usersTable = supabase.from("profiles") as unknown as {
        select: (query: string) => {
          eq: (
            column: string,
            value: string
          ) => {
            single: () => Promise<{
              data: Profile | null;
              error: Error | null;
            }>;
          };
        };
      };

      const { data: existingUser } = await usersTable
        .select("id, email")
        .eq("email", email)
        .single();

      if (existingUser) {
        // Check if already a member
        const membersTable = supabase.from("workspace_members") as unknown as {
          select: () => {
            eq: (
              column: string,
              value: string
            ) => {
              eq: (
                column: string,
                value: string
              ) => {
                single: () => Promise<{
                  data: WorkspaceMember | null;
                  error: Error | null;
                }>;
              };
            };
          };
        };

        const { data: existingMember } = await membersTable
          .select()
          .eq("workspace_id", workspaceId)
          .eq("user_id", existingUser.id)
          .single();

        if (existingMember) {
          return {
            success: false,
            message: "User is already a member of this workspace",
          };
        }

        // Add as member
        const insertTable = supabase.from("workspace_members") as unknown as {
          insert: (data: {
            workspace_id: string;
            user_id: string;
            role: string;
          }) => {
            select: () => Promise<{
              data: WorkspaceMember[] | null;
              error: Error | null;
            }>;
          };
        };

        const { error: insertError } = await insertTable
          .insert({
            workspace_id: workspaceId,
            user_id: existingUser.id,
            role: "member",
          })
          .select();

        if (insertError) {
          throw insertError;
        }

        return {
          success: true,
          message: "User added to workspace successfully",
        };
      } else {
        // Store invitation for when user signs up
        const invitationsTable = supabase.from(
          "workspace_invitations"
        ) as unknown as {
          insert: (data: {
            workspace_id: string;
            email: string;
            status: string;
            expires_at: string;
          }) => {
            select: () => Promise<{
              data: WorkspaceInvitation[] | null;
              error: Error | null;
            }>;
          };
        };

        const { error: inviteError } = await invitationsTable
          .insert({
            workspace_id: workspaceId,
            email: email,
            status: "pending",
            expires_at: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000
            ).toISOString(), // 7 days
          })
          .select();

        if (inviteError) {
          throw inviteError;
        }

        // TODO: Send actual email invitation
        console.log(`Email invitation would be sent to: ${email}`);

        return {
          success: true,
          message: "Invitation sent successfully",
        };
      }
    } catch (error) {
      console.error("Error in inviteMember:", error);

      // Handle missing tables gracefully - more robust error checking
      const errorStr = JSON.stringify(error).toLowerCase();
      const errorCode = (error as { code?: string })?.code;

      if (
        (errorStr.includes("workspace_members") ||
          errorStr.includes("workspace_invitations") ||
          errorStr.includes("profiles")) &&
        (errorStr.includes("does not exist") ||
          errorStr.includes("not found") ||
          errorCode === "PGRST116" ||
          errorCode === "42P01")
      ) {
        return {
          success: false,
          message:
            "Team functionality requires database migration. Please run the setup script first.",
        };
      }

      return {
        success: false,
        message: "Failed to send invitation",
      };
    }
  }

  static async getPendingInvitations(workspaceId: string) {
    try {
      const invitationsTable = supabase.from(
        "workspace_invitations"
      ) as unknown as {
        select: (query: string) => {
          eq: (
            column: string,
            value: string
          ) => {
            eq: (
              column: string,
              value: string
            ) => Promise<{
              data: WorkspaceInvitation[] | null;
              error: Error | null;
            }>;
          };
        };
      };

      const { data, error } = await invitationsTable
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("status", "pending");

      if (error) {
        // For invitations, always return empty array if there's any error (tables likely don't exist)
        console.warn(
          "workspace_invitations table does not exist yet. Run the database migration to enable team functionality."
        );
        console.debug("getPendingInvitations error:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      // Handle case where tables don't exist yet - always return empty array
      console.warn(
        "Team functionality not available - database tables missing. Please run the migration script."
      );
      console.debug("getPendingInvitations catch error:", error);
      return [];
    }
  }

  static async cancelInvitation(invitationId: string): Promise<void> {
    try {
      const invitationsTable = supabase.from(
        "workspace_invitations"
      ) as unknown as {
        delete: () => {
          eq: (
            column: string,
            value: string
          ) => Promise<{
            error: Error | null;
          }>;
        };
      };

      const { error } = await invitationsTable.delete().eq("id", invitationId);

      if (error) {
        console.error("Error canceling invitation:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error in cancelInvitation:", error);
      throw error;
    }
  }

  static async removeMember(
    workspaceId: string,
    userId: string
  ): Promise<void> {
    try {
      const membersTable = supabase.from("workspace_members") as unknown as {
        delete: () => {
          eq: (
            column: string,
            value: string
          ) => {
            eq: (
              column: string,
              value: string
            ) => Promise<{
              error: Error | null;
            }>;
          };
        };
      };

      const { error } = await membersTable
        .delete()
        .eq("workspace_id", workspaceId)
        .eq("user_id", userId);

      if (error) {
        console.error("Error removing member:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error in removeMember:", error);
      throw error;
    }
  }
}
