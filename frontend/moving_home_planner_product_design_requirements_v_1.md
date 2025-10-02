# Moving Home Planner — Product Design Requirements (V1)

> A lightweight shared web app for two people planning a move: track items, fees/taxes by company, budget & savings by room, shared tasks and milestones, and a motivating progress dashboard.

---

## 1) Goals & Non‑Goals

**Primary goals**
- Replace ad‑hoc spreadsheets with an intuitive, cute, two‑person workspace.
- Let the couple see **where they are** and **what’s next** at a glance (dashboard).
- Track items by **category** and **room**; purchase lifecycle from estimate → actual.
- Capture **fee/tax rules per company** and allocate those costs to items fairly.
- Plan and track **budgets by room** and **savings progress** toward those budgets.
- Coordinate via **shared tasks**, assignments, priorities (1–3), and **milestones**.

**Non‑goals for V1**
- Email / push notifications (none for V1).
- Two‑way calendar sync (ICS export deferred to V2).
- Multi‑workspace orgs, advanced permissions beyond the two of you.
- Price scraping from retailers (V1 uses manual inputs + link preview).

---

## 2) Users & Roles
- **Member** (You, Boyfriend): identical permissions within a single **Workspace**. Either can CRUD anything inside the workspace.

---

## 3) Scope Overview (V1)
1) **Onboarding & Workspace Setup**
   - Create workspace, invite partner (email link), default **location ZIP** (for labeling) and **currency**.
   - Store **sales_tax_rate** numeric on workspace (manual entry/override at setup).  
     _Note: Fee taxability is per‑company; default **not taxable** unless toggled._
2) **Category & Room Schema**
   - Manage **Categories** (Essentials, Decor, Appliances, etc.).
   - Manage **Rooms** (Bedroom, Bedroom Closet, Bath, Kitchen, Dining Room, Patio, Den, Den Closet, Living Room, None).  
   - UI toggle: **By Category** vs **By Room** views (same totals, different lens).
3) **Company Directory & Fee Rules**
   - Create **Company** entries with fee/tax rule settings:
     - Delivery fee types: **Flat**, **Tiered thresholds** (e.g., Bob’s), or **% of subtotal**.
     - Other fees (bag, service) per order.
     - **Fees taxable?** (off by default; toggle per company).
     - Optional company‑specific **tax % override**; otherwise use workspace rate.
     - Versioned rule preview with sample subtotal.
4) **Shopping & Cost Tracking**
   - **Quick Add Item**: name, link, auto image preview (Open Graph), category, optional room, quantity, company, est. unit cost → est. total.
   - **Item Detail**: notes, photos, priority (1–3), toggle **Purchased?**, actual unit cost.
   - **Fee/Tax Allocation Engine**: allocate per‑company order‑level fees & taxes to items using selectable method (pro‑rata by item subtotal **or** by quantity). Persist per‑item breakdown.
5) **Planning: Tasks & Milestones**
   - **Tasks**: assign to Me/Him/Both; category tag; due date; priority (1–3); notes/goals; link items; mark done. My/Our filtered views.
   - **Milestones**: define (e.g., “Furniture ordered”, “Move‑in day”) with dates; attach tasks & items; timeline visualization; auto progress %.
6) **Budget & Savings (by Room)**
   - **Budget Setup** per **Room**: planned budget, savings horizon (derived from target date—e.g., move‑in or milestone date).
   - Live Budget vs Est/Actual cards and deltas with statuses.
   - **Savings Tracker**: record deposits; weekly target; progress %; on/off track callouts.
   - **Savings target** baseline: use **Planned Budget** unless Est/Actual exceed Planned; then prompt to choose which to use (remember choice per room).
7) **Dashboard**
   - Overall progress KPIs: items decided, items purchased, tasks done, milestones hit.
   - Spend status cards: **Planned vs Est vs Actual** (+ sparkline of Actual over time).
   - Upcoming (next 7 days): tasks, deliveries, store trips.
   - Risk flags: budget overruns, overdue tasks, unallocated fees.
   - Quick actions: Add item, New task, Re‑allocate fees, Reconcile order.

**Out of scope (V1)**
- Notifications (email/browser), external calendar sync, mobile offline.
- Multi‑currency, multiple addresses, complex tax jurisdictions.
- Auto price scraping or cart import.

---

## 4) User Flows (End‑to‑End)

### A) Onboarding & Workspace Setup
1. Create Workspace → set **name**, **ZIP (label only)**, **currency**, **sales_tax_rate** (manual numeric), **move‑in date**.
2. Invite partner (email). Partner accepts → joins workspace.
3. Optional: import starter lists (templates like Essentials, Cleaning, Pantry).

**Acceptance**: Both members see the same dashboard and can CRUD.

### B) Manage Categories & Rooms
1. Add/Edit **Categories** (text, color).
2. Add/Edit **Rooms** (enum set above; allow custom additions).
3. Toggle **view lens**: By Category / By Room.

**Acceptance**: Changing lens does not change totals; just pivots grouping.

### C) Company & Fee Rules
1. Add **Company**: name, website, default delivery window text.
2. Define **Rule**:
   - Type: Flat / Tiered / Percent.
   - Add **tiers** as rows: `≤ threshold` → `fee` (e.g., Bob’s table).
   - Add other fees (bag, service). Toggle **fees taxable** (default **off**).
   - Optional **company tax override %**.
3. **Preview**: enter example subtotal → see computed delivery fee, other fees, taxes.
4. Save rule (versioned); set as **active**.

**Acceptance**: For a given subtotal, preview and saved rule produce identical outputs.

### D) Quick Add Item
1. Enter `name` → paste `link` → app fetches Open Graph image/title (non‑blocking).
2. Select `category`, optional `room`, `quantity`, `company`.
3. Enter `est_unit_cost` → auto `est_total = quantity × est_unit_cost`.
4. Save; item appears in **Shopping** and relevant **Room/Category** view.

**Acceptance**: Creating item requires (name, quantity≥1). All computed fields (est totals) update immediately.

### E) Item Detail & Purchase Lifecycle
1. Open item → add notes/photos → set **priority** (1–3).
2. Toggle **Purchased?** when bought → enter `actual_unit_cost`.
3. App recomputes `actual_subtotal` and triggers **re‑allocation** suggestion for company fees/taxes.

**Acceptance**: Mixed est/actual states handled (see calculations). Purchased items are clearly marked.

### F) Fee/Tax Allocation
1. For each **company**, gather items in an order window (e.g., same day or explicit “Reconcile Order” action).
2. Compute company‑level **subtotal** (sum of item est or actual subtotals—use **actual** if present else est).
3. Apply company **fee rule** + **tax rule** to get order‑level delivery fee, other fees, and tax amount.
4. **Allocate** order‑level fees & taxes to items based on selected method:
   - **Pro‑rata by item subtotal**, or
   - **By quantity** (equal per unit).
5. **Persist** per‑item allocations for reporting and budget math.

**Acceptance**: Sum of per‑item allocations equals order‑level totals (after rounding reconciliation).

### G) Tasks (Assign & Track)
1. New Task → title, assign (Me/Him/Both), category tag, due date, priority (1–3), notes/goals.
2. Link relevant items (optional).
3. Mark done. “My Tasks” and “Our Tasks” filters.

**Acceptance**: Task lists reflect assignments; completion toggles progress in linked milestones.

### H) Milestones & Timeline
1. Create Milestone → name, date.
2. Attach tasks and items.
3. Timeline shows milestones; progress % from linked tasks/items completion.

**Acceptance**: Progress % reflects (# completed / # total) across attached tasks + items purchased.

### I) Budgets & Savings (by Room)
1. For each **Room**, set **Planned Budget**.
2. App shows **Weeks to Save** from today to target date (default: move‑in date; editable per room).
3. Record **savings deposits**; app shows **weekly target** and progress.
4. If Est/Actual exceed Planned, prompt: “Use Est/Actual as savings target?” → remember selection per room.

**Acceptance**: Room budget card shows Planned vs Est vs Actual, difference $/% and status.

### J) Dashboard
- **KPI strip**: Items decided, Items purchased, Tasks done, Milestones hit.
- **Spend cards**: Planned vs Est vs Actual with trend.
- **Upcoming 7 days**: tasks, delivery windows, store trips.
- **Risk flags**: rooms over budget; overdue tasks; items with no company or unallocated fees.
- **Quick actions**: Add Item, New Task, Re‑allocate Fees, Reconcile Order.

**Acceptance**: Counts and totals are consistent with underlying data; quick actions lead to relevant forms.

---

## 5) Calculations & Rules (Deterministic)

### 5.1 Money representation
- Store all amounts as **integer cents**; display per workspace currency.
- Rounding: **banker’s rounding** to 2 decimals on display; allocation uses remainder reconciliation (below).

### 5.2 Item totals
- `est_total = quantity × est_unit_cost`
- `actual_subtotal = quantity × actual_unit_cost` (only when actual provided)
- **Mixed states**: use **actual_subtotal** when available; otherwise **est_total** for company subtotal, budgets, and dashboard.

### 5.3 Company fees & taxes
- **Order subtotal** per company = sum of item subtotals (actual if present else est) in that order.
- **Delivery fee** (from rule):
  - Flat: constant.
  - Tiered: find smallest tier with `subtotal ≤ threshold`.
  - Percent: `subtotal × rate` (rounded to cents).
- **Other fees**: sum of configured fees.
- **Tax amount**:
  - **Base** = item subtotal (always taxable) **+ sum(fees where “fees taxable” is true)**.
  - **Rate** = company override rate if set; else workspace `sales_tax_rate`.
  - **Tax** = `Base × Rate` (rounded to cents).

### 5.4 Allocation methods
- **Input**: order‑level totals: `delivery_fee`, `other_fees`, `tax`.
- **Method A – Pro‑rata by item subtotal**:
  - For each item: `weight_i = subtotal_i / Σ subtotals`
  - Allocate each component `X_i = roundToCents(X_total × weight_i)`.
- **Method B – By quantity**:
  - `weight_i = qty_i / Σ qty` then same rounding.
- **Remainder reconciliation**: After rounding, if Σ allocations ≠ total, adjust ±$0.01 to items with largest fractional remainders (deterministic tie‑break by item id).

### 5.5 Budget & savings
- **Room Planned Budget** is authoritative **unless** user opts to switch the savings target to Est/Actual when they exceed Planned.
- **Difference $** = `Planned − Current (Est/Actual per rule)`
- **Difference %** = `Difference $ / Planned`
- **Budget Status** thresholds:  
  - On track: `Current ≤ Planned × 0.95`  
  - Watch: `Planned × 0.95 < Current ≤ Planned`  
  - Over: `Current > Planned`
- **Weeks to Save**: from today → target date; min 0.
- **Weekly Target**: `(Savings Target − Total Saved So Far) / max(1, Weeks)`.
- **Savings Progress %**: `Total Saved / Savings Target`.

### 5.6 Progress metrics
- **Items decided**: items count (any state).
- **Items purchased**: items where `purchased = true`.
- **Tasks done**: tasks where `done = true`.
- **Milestone progress %**: `(completed attached tasks + purchased attached items) / (total attached)`.

---

## 6) Information Architecture & Data Model (Postgres/Supabase)

**Entities & key fields**
- `workspaces` (id, name, zip, currency, sales_tax_rate_pct, move_in_date, created_by)
- `members` (workspace_id, user_id, role='member')
- `categories` (id, workspace_id, name, color)
- `rooms` (id, workspace_id, name) — seed with your enum list; allow custom.
- `companies` (id, workspace_id, name, website, fees_taxable boolean default false, tax_override_pct nullable)
- `company_fee_rules` (id, company_id, type enum ['flat','tiered','percent'], flat_cents, percent_rate, version, active boolean)
- `company_fee_tiers` (id, fee_rule_id, threshold_cents, fee_cents) — for `type='tiered'`
- `items` (id, workspace_id, name, link, image_url, category_id, room_id, company_id, quantity int default 1, priority smallint 1..3, purchased boolean default false, notes)
- `item_prices` (id, item_id, est_unit_cents, actual_unit_cents nullable, created_at)
- `orders` (id, workspace_id, company_id, order_date) — logical grouping for allocation (manual “Reconcile Order”).
- `order_items` (order_id, item_id)
- `order_totals` (order_id, subtotal_cents, delivery_fee_cents, other_fees_cents, tax_cents)
- `order_item_allocations` (order_id, item_id, alloc_delivery_cents, alloc_other_fees_cents, alloc_tax_cents, method enum ['prorata','quantity'])
- `tasks` (id, workspace_id, title, assigned_to enum ['me','him','both'], category_id nullable, due_date, priority 1..3, notes, done boolean)
- `milestones` (id, workspace_id, name, date, notes)
- `milestone_links` (id, milestone_id, item_id nullable, task_id nullable)
- `room_budgets` (id, workspace_id, room_id, planned_cents, target_date, savings_target_source enum ['planned','est','actual'])
- `savings_deposits` (id, workspace_id, room_id, date, amount_cents, note)
- `activity_log` (id, workspace_id, actor_id, type, entity, entity_id, payload, created_at)

**Security**
- Supabase Auth; **RLS**: all tables include `workspace_id`; policies restrict to members of that workspace.

---

## 7) UI/UX Principles & Components
- **Aesthetic**: cozy, cute, friendly; rounded cards, playful micro‑copy; emoji accents used sparingly 🌱.
- **Components (shadcn/ui)**: `Card`, `Tabs`, `Badge`, `Table`, `Dialog`, `Sheet`, `Progress`, `Toggle`, `Switch`, `DatePicker`.
- **Design patterns**
  - **Lens toggle** (Category / Room) at top of Shopping and Dashboard.
  - **Inline editing** for quantities and est/actual unit price.
  - **Pills** for priority 1–3 (Low/Med/High) with color.
  - **Allocation banner**: after purchases, show sticky banner “Reconcile order for {Company}”.
  - **Budget chips** on room cards (On track / Watch / Over) with clear colors.
  - **Empty states** with CTAs and example templates.

**Key Screens**
- **Dashboard**: KPI strip, spend cards, upcoming list, risk flags, quick actions.
- **Shopping**: table grouped by current lens; columns: Item, Qty, Company, Est/Actual, Fees/Tax (allocated), Total, Purchased?, Link.
- **Item Drawer**: full details and lifecycle actions.
- **Companies**: rules editor with live preview.
- **Tasks**: My/Our toggle, list by due date, quick complete.
- **Milestones**: timeline with progress bars; drill‑in shows attached items/tasks.
- **Budgets**: room cards with progress/savings; deposit form.

---

## 8) Acceptance Criteria (Representative)

**Company Rules**
- Given a tiered rule and `subtotal = $399.99`, the delivery fee equals the configured tier’s fee; at `subtotal = $0`, fee is $0 if configured as such.
- Toggling **fees taxable** updates preview and existing future allocations; past persisted allocations remain unchanged until re‑allocation is run.

**Allocation**
- For two items with subtotals $100 and $50 and delivery fee $30 (pro‑rata), allocations are $20 and $10. If rounding creates $0.01 discrepancy, the cent is assigned to the item with the larger fractional remainder.

**Budget & Savings**
- If Room Planned = $1,000 and Current Est = $1,050, app prompts to switch the savings target to Est; user choice is stored; Weekly Target recalculates accordingly.

**Dashboard Consistency**
- KPI counts, totals, and budget deltas equal the sums from Items/Tasks/Milestones/Budgets views.

**Security**
- Non‑members cannot access workspace data via RLS; verified via Supabase policies.

---

## 9) Technical Architecture

**Frontend**: Next.js (App Router), TypeScript, shadcn/ui, Tailwind.  
**Backend**: Next.js API routes or Supabase Edge Functions for rule evaluation & allocation jobs.  
**Database**: Supabase Postgres with RLS and row‑level ownership via `workspace_id`.

**Services**
- **Rule engine**: pure TypeScript module; deterministic, unit‑tested.
- **Link preview**: fetch Open Graph tags on server; store `image_url` if present.
- **Daily maintenance job** (optional V1.1): reconcile overdue tasks, compute trend sparkline series.

**Performance**
- Target TTI < 2.5s on mid‑range mobile; list virtualization for large item tables.

**Accessibility**
- Color‑contrast AA, keyboard nav, focus states; semantic tables and ARIA for toggles.

---

## 10) Data Migration / Import (Nice‑to‑have V1.1)
- CSV import for Items (columns matching spreadsheet names); mapping wizard.
- Export CSV for Items, Tasks, Budgets.

---

## 11) Analytics & Logging (Optional V1.1)
- Minimal event logging: item_created, task_completed, allocation_run, budget_changed.
- Client opt‑out toggle.