# Moving Home Planner - Frontend

A beautiful, intuitive web app for couples planning a move together. Track items, manage budgets, coordinate tasks, and stay organized throughout your moving journey.

## 🏠 Features

- **Shared Workspace**: Collaborative space for you and your partner
- **Smart Organization**: View items by category or room
- **Budget Planning**: Track planned vs actual spending by room
- **Task Management**: Assign and track moving-related tasks
- **Company Management**: Store fee rules for different retailers
- **Progress Dashboard**: See your moving progress at a glance

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A Supabase account and project

### Setup

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Supabase**

   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Project Settings > API
   - Copy your project URL and anon key

4. **Configure environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your Supabase credentials:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   ```

5. **Set up the database**

   - Go to your Supabase dashboard
   - Navigate to the SQL Editor
   - Copy and paste the schema from `schema.md.txt`
   - Run the SQL to create all tables and types

6. **Enable Row Level Security (RLS)**

   - In Supabase, go to Authentication > Settings
   - Enable Row Level Security for all tables
   - The schema includes workspace-based access policies

7. **Start the development server**

   ```bash
   npm run dev
   ```

8. **Open your browser**
   Navigate to `http://localhost:3000`

## 📋 Database Setup

The app uses the schema defined in `schema.md.txt`. Key features:

- **Multi-tenant**: Each workspace is isolated using RLS
- **Flexible organization**: Items can be categorized by type or room
- **Money handling**: All amounts stored as integer cents
- **Audit trail**: Activity logging for all major actions

### Required Supabase Configuration

1. **Authentication**: Enable email/password auth
2. **Row Level Security**: Enable RLS on all tables
3. **Database schema**: Run the provided SQL schema
4. **Policies**: The schema includes workspace-based RLS policies

## 🎨 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **TypeScript**: Full type safety
- **Icons**: Lucide React

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js app router
├── components/
│   ├── ui/                # shadcn/ui components
│   └── onboarding/        # Onboarding flow components
├── lib/
│   ├── types.ts           # TypeScript type definitions
│   ├── supabaseClient.ts  # Supabase client setup
│   └── onboarding.ts      # Onboarding service functions
```

## 🔄 Onboarding Flow

The app includes a comprehensive onboarding process:

1. **Authentication**: Sign up or sign in
2. **Workspace Setup**: Create your shared workspace
3. **Partner Invitation**: Invite your moving partner
4. **Organization**: Choose categories and rooms
5. **Completion**: Access your dashboard

## 🚦 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Style

- ESLint configuration for Next.js
- Consistent TypeScript usage
- Semantic component structure
- Responsive design patterns

## 🔒 Security

- Row Level Security (RLS) enforces workspace isolation
- Supabase Auth handles authentication
- Environment variables for sensitive data
- Input validation on all forms

## 📱 Next Steps

After completing the onboarding, you can:

- Add items to your shopping lists
- Set budgets for different rooms
- Create and assign moving tasks
- Configure company fee structures
- Track your progress on the dashboard

## 🤝 Contributing

This is part of the Moving Home Planner V1 implementation. See the product requirements document for detailed specifications.
