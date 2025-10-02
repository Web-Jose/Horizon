# Database RLS Policies Fix

## Issue

If you're getting errors when creating budgets or savings deposits (like "Error creating budget: {}"), it's likely because your database is missing some Row Level Security (RLS) policies.

## Symptoms

- Console shows "Error creating budget: {}" or similar empty error objects
- Budget creation fails silently or with access denied errors
- Savings deposit creation fails

## Solution

1. **Go to your Supabase Dashboard**

   - Navigate to your project
   - Go to the SQL Editor

2. **Run the Missing Policies Script**

   - Copy the entire contents of `add-missing-policies.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute

3. **Verify the Fix**
   - Refresh your application
   - Try creating a budget or savings deposit
   - It should now work correctly

## What the Script Does

The script adds missing RLS policies for:

- `room_budgets` - Allows workspace members to manage budget data
- `savings_deposits` - Allows workspace members to manage savings data
- Other related tables that were missing policies

## Technical Details

The error occurs because:

1. Tables have RLS enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
2. But no policies are defined to allow access
3. Without policies, Supabase denies all access by default
4. This results in empty error objects being returned

The policies we add follow the workspace-based access pattern:

- Users can access data in workspaces they created
- Users can access data in workspaces they're members of

## Prevention

When adding new tables to the schema, always remember to:

1. Enable RLS: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
2. Add appropriate policies: `CREATE POLICY ... ON table_name ...`

This ensures proper data isolation between workspaces while allowing authorized access.
