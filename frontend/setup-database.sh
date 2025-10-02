#!/bin/bash

# Moving Home Planner - Database Setup Script
# This script helps set up your Supabase database with the required schema

echo "🏠 Moving Home Planner - Database Setup"
echo "======================================="
echo ""

echo "Before running this script, make sure you have:"
echo "1. Created a Supabase project at https://supabase.com"
echo "2. Copied your project URL and anon key to .env.local"
echo "3. Enabled email authentication in your Supabase project"
echo ""

echo "📋 Setting up database schema..."
echo ""

echo "Please follow these steps:"
echo ""
echo "1. Go to your Supabase dashboard"
echo "2. Navigate to the SQL Editor"
echo "3. Copy the entire contents of 'schema.md.txt'"
echo "4. Paste it into the SQL Editor"
echo "5. Click 'Run' to execute the schema"
echo ""

echo "🔒 The schema includes:"
echo "   • All required tables and types"
echo "   • Row Level Security (RLS) policies"
echo "   • Proper indexes for performance"
echo "   • Workspace-based data isolation"
echo ""

echo "✅ After running the schema, your database will have:"
echo "   • workspaces - Store workspace information"
echo "   • members - Manage workspace membership"
echo "   • categories & rooms - Organization system"
echo "   • companies & fee rules - Vendor management"
echo "   • items & prices - Shopping lists"
echo "   • tasks & milestones - Project management"
echo "   • budgets & savings - Financial tracking"
echo "   • activity_log - Audit trail"
echo ""

echo "🚀 Once complete, start the development server:"
echo "   npm run dev"
echo ""

echo "💡 Need help? Check the README.md for detailed setup instructions."