-- Moving Home Planner — V1 Schema (Postgres / Supabase friendly)

-- =========
-- ENUM TYPES
-- =========
create type fee_rule_type as enum ('flat','tiered','percent');
create type allocation_method as enum ('prorata','quantity');
create type assigned_to as enum ('me','him','both');
create type savings_target_source as enum ('planned','est','actual');

-- =========
-- CORE / AUTH
-- =========
create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  zip text,
  currency text not null,
  sales_tax_rate_pct numeric(6,4) not null default 0, -- percent (e.g. 0.0825 = 8.25%)
  move_in_date date,
  created_by uuid not null, -- references auth.users(id) in Supabase
  created_at timestamptz not null default now()
);

-- User profiles table (extends Supabase auth.users)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  full_name text,
  created_at timestamptz not null default now()
);

-- Workspace members table (replaces the old members table)
create table workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

-- Workspace invitations table for pending invites
create table workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  email text not null,
  status text not null default 'pending',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (workspace_id, email)
);

-- Keep the old members table for backward compatibility (can be removed later)
create table members (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null, -- references auth.users(id) in Supabase
  role text not null check (role = 'member'),
  primary key (workspace_id, user_id)
);

-- =========
-- TAXONOMY
-- =========
create table categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  color text,
  unique (workspace_id, name)
);

create table rooms (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  unique (workspace_id, name)
);

-- =========
-- COMPANIES & FEE RULES
-- =========
create table companies (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  website text,
  fees_taxable boolean not null default false,
  tax_override_pct numeric(6,4), -- optional percent override
  unique (workspace_id, name)
);

create table company_fee_rules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  type fee_rule_type not null,
  flat_cents integer,               -- for type='flat'
  percent_rate numeric(6,4),        -- for type='percent' (e.g. 0.05 = 5%)
  version integer not null default 1,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

create table company_fee_tiers (
  id uuid primary key default gen_random_uuid(),
  fee_rule_id uuid not null references company_fee_rules(id) on delete cascade,
  threshold_cents integer not null, -- "≤ threshold" bucket
  fee_cents integer not null
);

-- =========
-- ITEMS & PRICES
-- =========
create table items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  link text,
  image_url text,
  category_id uuid references categories(id) on delete set null,
  room_id uuid references rooms(id) on delete set null,
  company_id uuid references companies(id) on delete set null,
  quantity integer not null default 1 check (quantity >= 1),
  priority smallint not null default 2 check (priority between 1 and 3),
  purchased boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create table item_prices (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  est_unit_cents integer not null,
  actual_unit_cents integer, -- nullable until purchased
  created_at timestamptz not null default now()
);

-- =========
-- ORDERS, TOTALS & ALLOCATIONS
-- =========
create table orders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  company_id uuid not null references companies(id) on delete restrict,
  order_date date not null,
  created_at timestamptz not null default now()
);

create table order_items (
  order_id uuid not null references orders(id) on delete cascade,
  item_id uuid not null references items(id) on delete cascade,
  primary key (order_id, item_id)
);

create table order_totals (
  order_id uuid primary key references orders(id) on delete cascade,
  subtotal_cents integer not null default 0,
  delivery_fee_cents integer not null default 0,
  other_fees_cents integer not null default 0,
  tax_cents integer not null default 0
);

create table order_item_allocations (
  order_id uuid not null references orders(id) on delete cascade,
  item_id uuid not null references items(id) on delete cascade,
  alloc_delivery_cents integer not null default 0,
  alloc_other_fees_cents integer not null default 0,
  alloc_tax_cents integer not null default 0,
  method allocation_method not null,
  primary key (order_id, item_id)
);

-- =========
-- TASKS & MILESTONES
-- =========
create table tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  title text not null,
  assigned_to assigned_to not null,
  category_id uuid references categories(id) on delete set null,
  due_date date,
  priority smallint not null default 2 check (priority between 1 and 3),
  notes text,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table milestones (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  date date not null,
  notes text,
  created_at timestamptz not null default now()
);

create table milestone_links (
  id uuid primary key default gen_random_uuid(),
  milestone_id uuid not null references milestones(id) on delete cascade,
  item_id uuid references items(id) on delete cascade,
  task_id uuid references tasks(id) on delete cascade,
  -- exactly one of (item_id, task_id) must be present
  check (num_nonnulls(item_id, task_id) = 1)
);

-- =========
-- BUDGETS & SAVINGS
-- =========
create table room_budgets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  room_id uuid not null references rooms(id) on delete cascade,
  planned_cents integer not null default 0,
  target_date date,
  savings_target_source savings_target_source not null default 'planned',
  unique (workspace_id, room_id)
);

create table savings_deposits (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  room_id uuid not null references rooms(id) on delete cascade,
  date date not null,
  amount_cents integer not null,
  note text
);

-- =========
-- AUDIT / ACTIVITY
-- =========
create table activity_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  actor_id uuid, -- references auth.users(id) in Supabase
  type text not null,
  entity text not null,
  entity_id uuid,
  payload jsonb,
  created_at timestamptz not null default now()
);

-- =========
-- INDEXES (practical)
-- =========
create index idx_categories_ws on categories(workspace_id);
create index idx_rooms_ws on rooms(workspace_id);
create index idx_companies_ws on companies(workspace_id);
create index idx_items_ws on items(workspace_id);
create index idx_items_company on items(company_id);
create index idx_item_prices_item on item_prices(item_id);
create index idx_orders_ws on orders(workspace_id);
create index idx_orders_company on orders(company_id);
create index idx_order_items_item on order_items(item_id);
create index idx_tasks_ws_done on tasks(workspace_id, done);
create index idx_milestones_ws_date on milestones(workspace_id, date);
create index idx_savings_ws_room on savings_deposits(workspace_id, room_id);
create index idx_room_budgets_ws_room on room_budgets(workspace_id, room_id);
create index idx_activity_ws_created on activity_log(workspace_id, created_at);

-- =========
-- RLS POLICIES (Row Level Security)
-- =========

-- Enable RLS on all tables
alter table workspaces enable row level security;
alter table members enable row level security;
alter table categories enable row level security;
alter table rooms enable row level security;
alter table companies enable row level security;
alter table company_fee_rules enable row level security;
alter table company_fee_tiers enable row level security;
alter table items enable row level security;
alter table item_prices enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_totals enable row level security;
alter table order_item_allocations enable row level security;
alter table tasks enable row level security;
alter table milestones enable row level security;
alter table milestone_links enable row level security;
alter table room_budgets enable row level security;
alter table savings_deposits enable row level security;
alter table activity_log enable row level security;

-- Policies for workspaces: users can see workspaces they created or are members of
create policy "Users can view their workspaces" on workspaces
  for select using (created_by = auth.uid() or id in (
    select workspace_id from members where user_id = auth.uid()
  ));

create policy "Users can create workspaces" on workspaces
  for insert with check (created_by = auth.uid());

create policy "Workspace creators can update their workspaces" on workspaces
  for update using (created_by = auth.uid());

-- Policies for members: workspace creators can manage members
create policy "Members can view workspace members" on members
  for select using (workspace_id in (
    select id from workspaces where created_by = auth.uid() or id in (
      select workspace_id from members where user_id = auth.uid()
    )
  ));

create policy "Workspace creators can manage members" on members
  for all using (workspace_id in (
    select id from workspaces where created_by = auth.uid()
  ));

-- Generic policy for workspace-scoped tables: members can manage data in their workspaces
create policy "Members can manage categories" on categories
  for all using (workspace_id in (
    select workspace_id from members where user_id = auth.uid()
    union
    select id from workspaces where created_by = auth.uid()
  ));

create policy "Members can manage rooms" on rooms
  for all using (workspace_id in (
    select workspace_id from members where user_id = auth.uid()
    union
    select id from workspaces where created_by = auth.uid()
  ));

create policy "Members can manage companies" on companies
  for all using (workspace_id in (
    select workspace_id from members where user_id = auth.uid()
    union
    select id from workspaces where created_by = auth.uid()
  ));

create policy "Members can manage items" on items
  for all using (workspace_id in (
    select workspace_id from members where user_id = auth.uid()
    union
    select id from workspaces where created_by = auth.uid()
  ));

create policy "Members can manage item_prices" on item_prices
  for all using (item_id in (
    select id from items where workspace_id in (
      select workspace_id from members where user_id = auth.uid()
      union
      select id from workspaces where created_by = auth.uid()
    )
  ));

create policy "Members can manage tasks" on tasks
  for all using (workspace_id in (
    select workspace_id from members where user_id = auth.uid()
    union
    select id from workspaces where created_by = auth.uid()
  ));

-- =========
-- TEAM FUNCTIONALITY RLS POLICIES
-- =========

-- Profiles RLS
alter table profiles enable row level security;

create policy "Users can read own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Workspace Members RLS
alter table workspace_members enable row level security;

create policy "Users can read workspace members where they are members" on workspace_members
  for select using (
    workspace_id in (
      select workspace_id from workspace_members 
      where user_id = auth.uid()
      union
      select id from workspaces where created_by = auth.uid()
    )
  );

create policy "Workspace owners can manage members" on workspace_members
  for all using (
    workspace_id in (
      select id from workspaces 
      where created_by = auth.uid()
    )
  );

-- Workspace Invitations RLS
alter table workspace_invitations enable row level security;

create policy "Workspace owners can read invitations" on workspace_invitations
  for select using (
    workspace_id in (
      select id from workspaces 
      where created_by = auth.uid()
    )
  );

create policy "Workspace owners can manage invitations" on workspace_invitations
  for all using (
    workspace_id in (
      select id from workspaces 
      where created_by = auth.uid()
    )
  );

-- =========
-- TEAM FUNCTIONALITY FUNCTIONS AND TRIGGERS
-- =========

-- Function to automatically create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on auth.users insert
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========
-- TEAM FUNCTIONALITY INDEXES
-- =========
create index if not exists idx_workspace_members_workspace_id on workspace_members(workspace_id);
create index if not exists idx_workspace_members_user_id on workspace_members(user_id);
create index if not exists idx_workspace_invitations_workspace_id on workspace_invitations(workspace_id);
create index if not exists idx_workspace_invitations_email on workspace_invitations(email);
create index if not exists idx_workspace_invitations_status on workspace_invitations(status);

-- Add similar policies for other tables...
-- (For brevity, I'm showing the pattern. You'd add similar policies for all remaining tables)

-- =========
-- SAMPLE DATA FOR TESTING
-- =========

-- Create a sample workspace (you'll need to replace the UUID with a real auth user ID)
-- INSERT INTO workspaces (id, name, currency, sales_tax_rate_pct, created_by) 
-- VALUES ('00000000-0000-0000-0000-000000000001', 'Our New Home', 'USD', 0.0825, 'your-auth-user-id-here');

-- Sample categories
-- INSERT INTO categories (workspace_id, name, color) VALUES 
-- ('00000000-0000-0000-0000-000000000001', 'Furniture', '#3B82F6'),
-- ('00000000-0000-0000-0000-000000000001', 'Appliances', '#10B981'),
-- ('00000000-0000-0000-0000-000000000001', 'Electronics', '#8B5CF6'),
-- ('00000000-0000-0000-0000-000000000001', 'Decor', '#F59E0B'),
-- ('00000000-0000-0000-0000-000000000001', 'Essentials', '#EF4444');

-- Sample rooms
-- INSERT INTO rooms (workspace_id, name) VALUES 
-- ('00000000-0000-0000-0000-000000000001', 'Living Room'),
-- ('00000000-0000-0000-0000-000000000001', 'Kitchen'),
-- ('00000000-0000-0000-0000-000000000001', 'Bedroom'),
-- ('00000000-0000-0000-0000-000000000001', 'Bedroom Closet'),
-- ('00000000-0000-0000-0000-000000000001', 'Bathroom'),
-- ('00000000-0000-0000-0000-000000000001', 'Dining Room'),
-- ('00000000-0000-0000-0000-000000000001', 'Den'),
-- ('00000000-0000-0000-0000-000000000001', 'Patio');