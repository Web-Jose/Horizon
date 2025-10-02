import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import {
  Company,
  CompanyFeeRule,
  CompanyFeeTier,
  FeeRuleType,
} from "@/lib/types";

// Create untyped client for new tables
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const supabase = createClient(supabaseUrl, supabaseKey);

// Company queries
export function useCompanies(workspaceId: string) {
  return useQuery({
    queryKey: ["companies", workspaceId],
    queryFn: async (): Promise<Company[]> => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("name");

      if (error) throw error;
      return data || [];
    },
    enabled: !!workspaceId,
  });
}

export function useCompany(companyId: string) {
  return useQuery({
    queryKey: ["company", companyId],
    queryFn: async (): Promise<Company | null> => {
      if (!companyId) return null;

      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });
}

// Company mutations
export function useCreateCompany(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newCompany: {
      name: string;
      website?: string;
      fees_taxable: boolean;
      tax_override_pct?: number;
    }): Promise<Company> => {
      const { data, error } = await supabase
        .from("companies")
        .insert({
          workspace_id: workspaceId,
          name: newCompany.name,
          website: newCompany.website || null,
          fees_taxable: newCompany.fees_taxable,
          tax_override_pct: newCompany.tax_override_pct || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies", workspaceId] });
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      companyId,
      updates,
    }: {
      companyId: string;
      updates: {
        name?: string;
        website?: string;
        fees_taxable?: boolean;
        tax_override_pct?: number;
      };
    }): Promise<Company> => {
      const { data, error } = await supabase
        .from("companies")
        .update(updates)
        .eq("id", companyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["companies", data.workspace_id],
      });
      queryClient.invalidateQueries({ queryKey: ["company", data.id] });
    },
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (companyId: string): Promise<void> => {
      const { error } = await supabase
        .from("companies")
        .delete()
        .eq("id", companyId);

      if (error) throw error;
    },
    onSuccess: (_, companyId) => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.removeQueries({ queryKey: ["company", companyId] });
      queryClient.removeQueries({ queryKey: ["companyFeeRules", companyId] });
    },
  });
}

// Company Fee Rules queries
export function useCompanyFeeRules(companyId: string) {
  return useQuery({
    queryKey: ["companyFeeRules", companyId],
    queryFn: async (): Promise<CompanyFeeRule[]> => {
      if (!companyId) return [];

      // First get the rules
      const { data: rules, error: rulesError } = await supabase
        .from("company_fee_rules")
        .select("*")
        .eq("company_id", companyId)
        .order("version", { ascending: false });

      if (rulesError) throw rulesError;

      if (!rules || rules.length === 0) return [];

      // Then get tiers for each rule
      const rulesWithTiers = await Promise.all(
        rules.map(async (rule: CompanyFeeRule) => {
          if (rule.type === "tiered") {
            const { data: tiers, error: tiersError } = await supabase
              .from("company_fee_tiers")
              .select("*")
              .eq("fee_rule_id", rule.id)
              .order("threshold_cents");

            if (tiersError) throw tiersError;
            return { ...rule, tiers: tiers || [] };
          }
          return rule;
        })
      );

      return rulesWithTiers;
    },
    enabled: !!companyId,
  });
}

export function useCreateFeeRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      company_id,
      type,
      flat_cents,
      percent_rate,
      tiers,
      active = true,
    }: {
      company_id: string;
      type: FeeRuleType;
      flat_cents?: number;
      percent_rate?: number;
      tiers?: CompanyFeeTier[];
      active?: boolean;
    }): Promise<CompanyFeeRule> => {
      // Create the rule first
      const { data: rule, error: ruleError } = await supabase
        .from("company_fee_rules")
        .insert({
          company_id,
          type,
          flat_cents: flat_cents || null,
          percent_rate: percent_rate || null,
          active,
        })
        .select()
        .single();

      if (ruleError) throw ruleError;

      // If it's a tiered rule, create the tiers
      if (type === "tiered" && tiers && tiers.length > 0) {
        const tiersToInsert = tiers.map((tier) => ({
          fee_rule_id: rule.id,
          threshold_cents: tier.threshold_cents,
          fee_cents: tier.fee_cents,
        }));

        const { data: createdTiers, error: tiersError } = await supabase
          .from("company_fee_tiers")
          .insert(tiersToInsert)
          .select();

        if (tiersError) throw tiersError;

        return { ...rule, tiers: createdTiers };
      }

      return rule;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["companyFeeRules", variables.company_id],
      });
    },
  });
}

export function useUpdateFeeRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ruleId,
      updates,
    }: {
      ruleId: string;
      updates: {
        active?: boolean;
        flat_cents?: number;
        percent_rate?: number;
      };
    }): Promise<CompanyFeeRule> => {
      const { data, error } = await supabase
        .from("company_fee_rules")
        .update(updates)
        .eq("id", ruleId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["companyFeeRules", data.company_id],
      });
    },
  });
}

export function useDeleteFeeRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ruleId: string): Promise<void> => {
      // Delete tiers first (cascade should handle this, but being explicit)
      await supabase
        .from("company_fee_tiers")
        .delete()
        .eq("fee_rule_id", ruleId);

      // Then delete the rule
      const { error } = await supabase
        .from("company_fee_rules")
        .delete()
        .eq("id", ruleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyFeeRules"] });
    },
  });
}
