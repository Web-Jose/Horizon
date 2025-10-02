# Quick Setup Guide - Team Functionality

## Issue

You're seeing console errors because the team functionality requires new database tables that don't exist yet:

- `workspace_members`
- `workspace_invitations`
- `profiles`

## Solution

### Option 1: Quick Migration (Recommended)

1. Open your Supabase dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `setup-team-tables.sql`
4. Click "Run" to execute the migration
5. Refresh your application - team functionality will now work!

### Option 2: Disable Team Functionality Temporarily

If you want to keep the current functionality without team features:

1. In `space-settings.tsx`, change the tabs grid from `grid-cols-4` to `grid-cols-3`
2. Remove or comment out the "Team" tab content

## What the Migration Does

- ✅ Creates `profiles` table for user information
- ✅ Creates `workspace_members` table for team membership
- ✅ Creates `workspace_invitations` table for pending invites
- ✅ Sets up Row Level Security (RLS) policies
- ✅ Creates automatic profile creation for new users
- ✅ Adds performance indexes
- ✅ Migrates existing users to profiles table

## After Migration

Once you run the migration, the team functionality will work:

- ✅ Send email invitations (currently logs to console)
- ✅ Manage team members
- ✅ View pending invitations
- ✅ Remove team members
- ✅ Secure access controls

## Error Handling

The code now includes graceful error handling:

- If tables don't exist, it shows empty states instead of crashing
- Helpful error messages guide users to run the migration
- Console warnings instead of errors for missing tables

## Current State

Your application will continue to work normally. The team tab will show:

- Current user as owner
- Empty states for members/invitations
- Invitation form with helpful error messages if tables are missing

Run the migration when you're ready to enable full team functionality!
