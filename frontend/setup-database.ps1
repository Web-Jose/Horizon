# Moving Home Planner - Database Setup Script (PowerShell)
# This script helps set up your Supabase database with the required schema

Write-Host "🏠 Moving Home Planner - Database Setup" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""

Write-Host "Before running this script, make sure you have:" -ForegroundColor Yellow
Write-Host "1. Created a Supabase project at https://supabase.com"
Write-Host "2. Copied your project URL and anon key to .env.local"
Write-Host "3. Enabled email authentication in your Supabase project"
Write-Host ""

Write-Host "📋 Setting up database schema..." -ForegroundColor Blue
Write-Host ""

Write-Host "Please follow these steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Go to your Supabase dashboard"
Write-Host "2. Navigate to the SQL Editor"
Write-Host "3. Copy the entire contents of 'schema.md.txt'"
Write-Host "4. Paste it into the SQL Editor"
Write-Host "5. Click 'Run' to execute the schema"
Write-Host ""

Write-Host "🔒 The schema includes:" -ForegroundColor Magenta
Write-Host "   • All required tables and types"
Write-Host "   • Row Level Security (RLS) policies"
Write-Host "   • Proper indexes for performance"
Write-Host "   • Workspace-based data isolation"
Write-Host ""

Write-Host "✅ After running the schema, your database will have:" -ForegroundColor Green
Write-Host "   • workspaces - Store workspace information"
Write-Host "   • members - Manage workspace membership"
Write-Host "   • categories & rooms - Organization system"
Write-Host "   • companies & fee rules - Vendor management"
Write-Host "   • items & prices - Shopping lists"
Write-Host "   • tasks & milestones - Project management"
Write-Host "   • budgets & savings - Financial tracking"
Write-Host "   • activity_log - Audit trail"
Write-Host ""

Write-Host "🚀 Once complete, start the development server:" -ForegroundColor Green
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""

Write-Host "💡 Need help? Check the README.md for detailed setup instructions." -ForegroundColor Yellow

# Pause to keep the window open
Read-Host "Press Enter to continue..."