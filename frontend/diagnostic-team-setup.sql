-- Team Functionality Diagnostic Script
-- Run this in your Supabase SQL Editor to check what's missing

-- Check if tables exist
SELECT 
    'workspace_members' as table_name,
    CASE WHEN EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'workspace_members'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'profiles' as table_name,
    CASE WHEN EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'workspace_invitations' as table_name,
    CASE WHEN EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'workspace_invitations'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status;

-- Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('workspace_members', 'profiles', 'workspace_invitations');

-- Check if policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('workspace_members', 'profiles', 'workspace_invitations');

-- Try a simple select to see what error occurs
-- (This will help us understand the exact issue)
SELECT 'Testing workspace_members access...' as test;
SELECT COUNT(*) as workspace_members_count FROM workspace_members LIMIT 1;
SELECT 'Testing profiles access...' as test;
SELECT COUNT(*) as profiles_count FROM profiles LIMIT 1;