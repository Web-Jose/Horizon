-- Minimal Fix for Existing workspace_members Table
-- Since you already have workspace_members table, this adds the missing pieces

-- Step 1: Create profiles table (likely missing)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Enable RLS on existing tables
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 3: Add essential RLS policies
CREATE POLICY "Users can read workspace members where they are members" ON workspace_members
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid()
            UNION
            SELECT id FROM workspaces WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Workspace owners can manage members" ON workspace_members
    FOR ALL USING (
        workspace_id IN (
            SELECT id FROM workspaces 
            WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can read own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Step 4: Create profiles for existing users
INSERT INTO profiles (id, email, full_name)
SELECT 
    id, 
    email, 
    raw_user_meta_data->>'full_name' as full_name
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Step 5: Create auto-profile function for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Success message
SELECT 'Minimal team setup complete! workspace_members should now work.' as result;