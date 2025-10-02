-- Add missing RLS policies for budget tables
-- These policies allow workspace members to manage budget data in their workspaces

-- Policies for room_budgets
create policy "Members can manage room budgets" on room_budgets
  for all using (workspace_id in (
    select workspace_id from members where user_id = auth.uid()
    union
    select id from workspaces where created_by = auth.uid()
  ));

-- Policies for savings_deposits  
create policy "Members can manage savings deposits" on savings_deposits
  for all using (workspace_id in (
    select workspace_id from members where user_id = auth.uid()
    union
    select id from workspaces where created_by = auth.uid()
  ));

-- Policies for milestones
create policy "Members can manage milestones" on milestones
  for all using (workspace_id in (
    select workspace_id from members where user_id = auth.uid()
    union
    select id from workspaces where created_by = auth.uid()
  ));

-- Policies for milestone_links
create policy "Members can manage milestone links" on milestone_links
  for all using (milestone_id in (
    select id from milestones where workspace_id in (
      select workspace_id from members where user_id = auth.uid()
      union
      select id from workspaces where created_by = auth.uid()
    )
  ));

-- Policies for company_fee_rules
create policy "Members can manage company fee rules" on company_fee_rules
  for all using (company_id in (
    select id from companies where workspace_id in (
      select workspace_id from members where user_id = auth.uid()
      union
      select id from workspaces where created_by = auth.uid()
    )
  ));

-- Policies for company_fee_tiers
create policy "Members can manage company fee tiers" on company_fee_tiers
  for all using (fee_rule_id in (
    select id from company_fee_rules where company_id in (
      select id from companies where workspace_id in (
        select workspace_id from members where user_id = auth.uid()
        union
        select id from workspaces where created_by = auth.uid()
      )
    )
  ));

-- Policies for orders
create policy "Members can manage orders" on orders
  for all using (workspace_id in (
    select workspace_id from members where user_id = auth.uid()
    union
    select id from workspaces where created_by = auth.uid()
  ));

-- Policies for order_items
create policy "Members can manage order items" on order_items
  for all using (order_id in (
    select id from orders where workspace_id in (
      select workspace_id from members where user_id = auth.uid()
      union
      select id from workspaces where created_by = auth.uid()
    )
  ));

-- Policies for order_totals
create policy "Members can manage order totals" on order_totals
  for all using (order_id in (
    select id from orders where workspace_id in (
      select workspace_id from members where user_id = auth.uid()
      union
      select id from workspaces where created_by = auth.uid()
    )
  ));

-- Policies for order_item_allocations
create policy "Members can manage order item allocations" on order_item_allocations
  for all using (order_id in (
    select id from orders where workspace_id in (
      select workspace_id from members where user_id = auth.uid()
      union
      select id from workspaces where created_by = auth.uid()
    )
  ));

-- Policies for activity_log
create policy "Members can view activity log" on activity_log
  for select using (workspace_id in (
    select workspace_id from members where user_id = auth.uid()
    union
    select id from workspaces where created_by = auth.uid()
  ));

create policy "System can insert activity log" on activity_log
  for insert with check (workspace_id in (
    select workspace_id from members where user_id = auth.uid()
    union
    select id from workspaces where created_by = auth.uid()
  ));