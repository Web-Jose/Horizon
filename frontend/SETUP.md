# 🏠 Moving Home Planner - Quick Setup Guide

Your environment is now configured! Here's what you need to do next:

## ✅ Current Status

- ✅ Environment variables configured
- ✅ Development server running at http://localhost:3000
- ❌ Database schema not yet applied

## 🚀 Next Steps

### 1. Set up your Supabase database

1. **Go to your Supabase project**: https://supabase.com/dashboard/project/jlnumgeggvpnhkassmho
2. **Navigate to SQL Editor** (in the left sidebar)
3. **Copy the entire contents** of `schema.md.txt`
4. **Paste it into the SQL Editor**
5. **Click "Run"** to execute the schema

### 2. Enable Authentication

1. In your Supabase dashboard, go to **Authentication** → **Settings**
2. Make sure **Enable email confirmations** is enabled
3. The app is ready to handle email/password authentication

### 3. Test the Application

1. Visit http://localhost:3000
2. You should see the authentication screen
3. Sign up for a new account
4. Complete the onboarding flow

## 🎯 What You'll See

After setting up the database schema, the app will:

1. **Authentication**: Sign up/sign in flow
2. **Onboarding Wizard**:
   - Workspace setup (name, ZIP, currency, tax rate, move-in date)
   - Partner invitation (optional)
   - Category and room selection
   - Completion confirmation
3. **Dashboard**: Placeholder dashboard showing success

## 🔧 Troubleshooting

If you encounter any issues:

1. **Database errors**: Make sure you've run the entire schema from `schema.md.txt`
2. **Environment issues**: Restart the dev server after any `.env.local` changes
3. **Auth issues**: Check that email authentication is enabled in Supabase

## 📝 The Schema Includes

- **Core tables**: workspaces, members, categories, rooms
- **Shopping**: items, prices, companies, fee rules
- **Planning**: tasks, milestones, milestone_links
- **Budgets**: room_budgets, savings_deposits
- **Security**: Row Level Security (RLS) policies
- **Audit**: activity_log for tracking changes

Run the schema and you'll be ready to test the full onboarding experience! 🎉
