# Step-by-Step Team Setup Fix

Since you've added the `workspace_members` table but are still getting errors, here's what's likely missing:

## Quick Diagnosis

Run this in your Supabase SQL Editor to see what's missing:

```sql
-- Copy the contents of diagnostic-team-setup.sql and run it
```

## Most Likely Missing Components

### 1. Profiles Table (REQUIRED)

The error is likely because the `profiles` table is missing. The query tries to join `workspace_members` with `profiles`.

```sql
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. RLS Policies (LIKELY MISSING)

```sql
-- Enable RLS
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can read workspace members where they are members" ON workspace_members
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid()
            UNION
            SELECT id FROM workspaces WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can read own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);
```

### 3. Populate Profiles (REQUIRED)

```sql
-- Create profiles for existing users
INSERT INTO profiles (id, email, full_name)
SELECT
    id,
    email,
    raw_user_meta_data->>'full_name' as full_name
FROM auth.users
ON CONFLICT (id) DO NOTHING;
```

## Complete Fix (Recommended)

Just run the complete `setup-team-tables.sql` script I created earlier. It includes everything:

1. Creates all missing tables
2. Sets up RLS policies
3. Creates profiles for existing users
4. Adds proper indexes
5. Sets up auto-profile creation for new users

## Quick Test After Setup

After running the setup, test in your browser console:

```javascript
// This should work without errors
console.log("Testing team functionality...");
```

The errors should disappear and you should see warnings instead of errors if anything is still missing.

## Current Error Explanation

The error `Error fetching workspace members: {}` happens because:

1. ✅ `workspace_members` table exists (you added it)
2. ❌ `profiles` table likely missing (causing join error)
3. ❌ RLS policies likely missing (causing permission error)
4. ❌ No profiles exist for current user (causing empty results)

Run the complete setup script to fix all of these at once!
