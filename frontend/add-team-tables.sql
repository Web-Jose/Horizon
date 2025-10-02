-- Add team functionality tables
-- Run this SQL in your Supabase SQL editor or database client

-- Create profiles table (if it doesn't exist)
-- This should store user profile information
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workspace_members table
-- This table links users to workspaces with roles
CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- Create workspace_invitations table
-- This table stores pending invitations
CREATE TABLE IF NOT EXISTS workspace_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workspace_id, email)
);

-- Add RLS policies for workspace_members
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read members of workspaces they belong to
CREATE POLICY "Users can read workspace members where they are members" ON workspace_members
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Workspace owners can manage members
CREATE POLICY "Workspace owners can manage members" ON workspace_members
    FOR ALL USING (
        workspace_id IN (
            SELECT id FROM workspaces 
            WHERE created_by = auth.uid()
        )
    );

-- Add RLS policies for workspace_invitations
ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read invitations for workspaces they own
CREATE POLICY "Workspace owners can read invitations" ON workspace_invitations
    FOR SELECT USING (
        workspace_id IN (
            SELECT id FROM workspaces 
            WHERE created_by = auth.uid()
        )
    );

-- Policy: Workspace owners can manage invitations
CREATE POLICY "Workspace owners can manage invitations" ON workspace_invitations
    FOR ALL USING (
        workspace_id IN (
            SELECT id FROM workspaces 
            WHERE created_by = auth.uid()
        )
    );

-- Add RLS policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_workspace_id ON workspace_invitations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_email ON workspace_invitations(email);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_status ON workspace_invitations(status);