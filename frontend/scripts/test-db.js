import { supabase } from "../src/lib/supabaseClient";

async function testDatabase() {
  console.log("Testing database connection...");

  try {
    // Test basic connection
    const { error: healthError } = await supabase
      .from("workspaces")
      .select("count")
      .limit(1);

    if (healthError) {
      console.error("Database connection failed:", healthError);
      if (
        healthError.message.includes('relation "workspaces" does not exist')
      ) {
        console.log("\n⚠️  Database tables do not exist yet.");
        console.log(
          "Please run the SQL from create_tables.sql in your Supabase dashboard first."
        );
        return;
      }
      return;
    }

    console.log("✅ Database connection successful");

    // Check if we have any workspaces
    const { data: workspaces, error: wsError } = await supabase
      .from("workspaces")
      .select("*")
      .limit(5);

    if (wsError) {
      console.error("Error fetching workspaces:", wsError);
      return;
    }

    console.log(`Found ${workspaces?.length || 0} workspaces`);

    if (workspaces && workspaces.length > 0) {
      const workspaceId = workspaces[0].id;
      console.log(
        `Testing with workspace: ${workspaces[0].name} (${workspaceId})`
      );

      // Test categories
      const { data: categories } = await supabase
        .from("categories")
        .select("*")
        .eq("workspace_id", workspaceId);

      console.log(`Found ${categories?.length || 0} categories`);

      // Test rooms
      const { data: rooms } = await supabase
        .from("rooms")
        .select("*")
        .eq("workspace_id", workspaceId);

      console.log(`Found ${rooms?.length || 0} rooms`);

      // Test items
      const { data: items } = await supabase
        .from("items")
        .select("*")
        .eq("workspace_id", workspaceId);

      console.log(`Found ${items?.length || 0} items`);
    } else {
      console.log("No workspaces found. You may need to create one first.");
    }
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

testDatabase();
