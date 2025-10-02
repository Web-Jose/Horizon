// Database types for Moving Home Planner

export type Database = {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          zip: string | null;
          currency: string;
          sales_tax_rate_pct: number;
          move_in_date: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          zip?: string | null;
          currency: string;
          sales_tax_rate_pct?: number;
          move_in_date?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          zip?: string | null;
          currency?: string;
          sales_tax_rate_pct?: number;
          move_in_date?: string | null;
          created_by?: string;
          created_at?: string;
        };
      };
      members: {
        Row: {
          workspace_id: string;
          user_id: string;
          role: string;
        };
        Insert: {
          workspace_id: string;
          user_id: string;
          role: string;
        };
        Update: {
          workspace_id?: string;
          user_id?: string;
          role?: string;
        };
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          role?: string;
          created_at?: string;
        };
      };
      workspace_invitations: {
        Row: {
          id: string;
          workspace_id: string;
          email: string;
          status: string;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          email: string;
          status?: string;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          email?: string;
          status?: string;
          expires_at?: string | null;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          color: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          color?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          color?: string | null;
        };
      };
      rooms: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
        };
      };
      companies: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          website: string | null;
          fees_taxable: boolean;
          tax_override_pct: number | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          website?: string | null;
          fees_taxable?: boolean;
          tax_override_pct?: number | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          website?: string | null;
          fees_taxable?: boolean;
          tax_override_pct?: number | null;
        };
      };
      company_fee_rules: {
        Row: {
          id: string;
          company_id: string;
          type: "flat" | "tiered" | "percent";
          flat_cents: number | null;
          percent_rate: number | null;
          version: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          type: "flat" | "tiered" | "percent";
          flat_cents?: number | null;
          percent_rate?: number | null;
          version?: number;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          type?: "flat" | "tiered" | "percent";
          flat_cents?: number | null;
          percent_rate?: number | null;
          version?: number;
          active?: boolean;
          created_at?: string;
        };
      };
      company_fee_tiers: {
        Row: {
          id: string;
          fee_rule_id: string;
          threshold_cents: number;
          fee_cents: number;
        };
        Insert: {
          id?: string;
          fee_rule_id: string;
          threshold_cents: number;
          fee_cents: number;
        };
        Update: {
          id?: string;
          fee_rule_id?: string;
          threshold_cents?: number;
          fee_cents?: number;
        };
      };
      items: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          link: string | null;
          image_url: string | null;
          category_id: string | null;
          room_id: string | null;
          company_id: string | null;
          quantity: number;
          priority: number;
          purchased: boolean;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          link?: string | null;
          image_url?: string | null;
          category_id?: string | null;
          room_id?: string | null;
          company_id?: string | null;
          quantity?: number;
          priority?: number;
          purchased?: boolean;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          link?: string | null;
          image_url?: string | null;
          category_id?: string | null;
          room_id?: string | null;
          company_id?: string | null;
          quantity?: number;
          priority?: number;
          purchased?: boolean;
          notes?: string | null;
          created_at?: string;
        };
      };
      item_prices: {
        Row: {
          id: string;
          item_id: string;
          est_unit_cents: number;
          actual_unit_cents: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          item_id: string;
          est_unit_cents: number;
          actual_unit_cents?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          item_id?: string;
          est_unit_cents?: number;
          actual_unit_cents?: number | null;
          created_at?: string;
        };
      };
      activity_log: {
        Row: {
          id: string;
          workspace_id: string;
          actor_id: string | null;
          type: string;
          entity: string;
          entity_id: string | null;
          payload: Record<string, unknown> | null; // jsonb type
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          actor_id?: string | null;
          type: string;
          entity: string;
          entity_id?: string | null;
          payload?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          actor_id?: string | null;
          type?: string;
          entity?: string;
          entity_id?: string | null;
          payload?: Record<string, unknown> | null;
          created_at?: string;
        };
      };
      room_budgets: {
        Row: {
          id: string;
          workspace_id: string;
          room_id: string;
          planned_cents: number;
          target_date: string | null;
          savings_target_source: "planned" | "est" | "actual";
        };
        Insert: {
          id?: string;
          workspace_id: string;
          room_id: string;
          planned_cents?: number;
          target_date?: string | null;
          savings_target_source?: "planned" | "est" | "actual";
        };
        Update: {
          id?: string;
          workspace_id?: string;
          room_id?: string;
          planned_cents?: number;
          target_date?: string | null;
          savings_target_source?: "planned" | "est" | "actual";
        };
      };
      savings_deposits: {
        Row: {
          id: string;
          workspace_id: string;
          room_id: string;
          date: string;
          amount_cents: number;
          note: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          room_id: string;
          date: string;
          amount_cents: number;
          note?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          room_id?: string;
          date?: string;
          amount_cents?: number;
          note?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      fee_rule_type: "flat" | "tiered" | "percent";
      allocation_method: "prorata" | "quantity";
      assigned_to: "me" | "him" | "both";
      savings_target_source: "planned" | "est" | "actual";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];
export type WorkspaceInsert =
  Database["public"]["Tables"]["workspaces"]["Insert"];
export type Member = Database["public"]["Tables"]["members"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Room = Database["public"]["Tables"]["rooms"]["Row"];
export type Company = Database["public"]["Tables"]["companies"]["Row"];
export type Item = Database["public"]["Tables"]["items"]["Row"];
export type ItemInsert = Database["public"]["Tables"]["items"]["Insert"];
export type ItemPrice = Database["public"]["Tables"]["item_prices"]["Row"];

// Extended types for UI components
export interface ItemWithDetails extends Item {
  category?: Category | null;
  room?: Room | null;
  company?: Company | null;
  prices?: ItemPrice[];
  estimated_price?: number; // calculated from latest price
  actual_price?: number; // calculated from latest price
}

export interface ShoppingItemStatus {
  pending: number;
  purchased: number;
  delivered: number;
}

// Onboarding flow types
export type OnboardingStep =
  | "workspace-setup"
  | "partner-invite"
  | "categories-rooms"
  | "complete";

export interface OnboardingData {
  workspaceName: string;
  zip: string;
  currency: string;
  salesTaxRate: number;
  moveInDate: string | null;
  partnerEmail: string;
  selectedCategories: string[];
  selectedRooms: string[];
}

// Default categories and rooms from requirements
export const DEFAULT_CATEGORIES = [
  { name: "Essentials", color: "#ef4444" },
  { name: "Decor", color: "#f97316" },
  { name: "Appliances", color: "#eab308" },
  { name: "Furniture", color: "#22c55e" },
  { name: "Cleaning", color: "#06b6d4" },
  { name: "Pantry", color: "#8b5cf6" },
  { name: "Storage", color: "#ec4899" },
];

export const DEFAULT_ROOMS = [
  "Bedroom",
  "Bedroom Closet",
  "Bath",
  "Kitchen",
  "Dining Room",
  "Patio",
  "Den",
  "Den Closet",
  "Living Room",
  "None",
];

export const CURRENCIES = [
  { value: "USD", label: "$ USD" },
  { value: "EUR", label: "€ EUR" },
  { value: "GBP", label: "£ GBP" },
  { value: "CAD", label: "$ CAD" },
];

// Task types
export type AssignedTo = "me" | "him" | "both";

export interface Task {
  id: string;
  workspace_id: string;
  title: string;
  assigned_to: AssignedTo;
  category_id: string | null;
  due_date: string | null;
  priority: number; // 1-3 (high-low)
  notes: string | null;
  done: boolean;
  created_at: string;
}

export interface TaskWithDetails extends Task {
  category: Category | null;
}

// Company types
export type FeeRuleType = "flat" | "tiered" | "percent";

export interface CompanyFeeRule {
  id: string;
  company_id: string;
  type: FeeRuleType;
  flat_cents: number | null;
  percent_rate: number | null;
  version: number;
  active: boolean;
  created_at: string;
  tiers?: CompanyFeeTier[];
}

export interface CompanyFeeTier {
  id?: string;
  fee_rule_id?: string;
  threshold_cents: number;
  fee_cents: number;
}

// Helper type for joined queries
export interface MemberWithWorkspace {
  workspace_id: string;
  user_id: string;
  role: string;
  workspaces: Workspace | null;
}

// Member and invitation types
export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: string;
  created_at: string;
  user?: {
    email: string;
    full_name: string | null;
  };
}

export interface WorkspaceInvitation {
  id: string;
  workspace_id: string;
  email: string;
  status: string;
  expires_at: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}
