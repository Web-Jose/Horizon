"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  PencilIcon,
  TrashIcon,
  SpinnerGapIcon,
  CheckIcon,
  XIcon,
  GlobeIcon,
  CalculatorIcon,
} from "@phosphor-icons/react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import {
  Workspace,
  Company,
  CompanyFeeRule,
  CompanyFeeTier,
} from "@/lib/types";
import {
  useCompanies,
  useCreateCompany,
  useUpdateCompany,
  useDeleteCompany,
  useCompanyFeeRules,
  useCreateFeeRule,
  useUpdateFeeRule,
  // useDeleteFeeRule,
} from "../../lib/hooks/useCompanyQueries";

interface CompaniesProps {
  activeTab?: string;
  viewMode?: "category" | "room";
  workspace?: Workspace;
  user?: SupabaseUser;
}

type FeeRuleType = "flat" | "tiered" | "percent";

interface FeeRuleFormData {
  type: FeeRuleType;
  flat_cents: number;
  percent_rate: number;
  tiers: CompanyFeeTier[];
  other_fees_cents: number;
}

export function Companies({ workspace }: CompaniesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isRuleSheetOpen, setIsRuleSheetOpen] = useState(false);
  const [isEditCompanyOpen, setIsEditCompanyOpen] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [previewSubtotal, setPreviewSubtotal] = useState(50000); // $500.00 in cents

  // Form states
  const [companyFormData, setCompanyFormData] = useState({
    name: "",
    website: "",
    fees_taxable: false,
    tax_override_pct: "",
  });

  const [editCompanyFormData, setEditCompanyFormData] = useState({
    name: "",
    website: "",
    fees_taxable: false,
    tax_override_pct: "",
  });

  const [ruleFormData, setRuleFormData] = useState<FeeRuleFormData>({
    type: "flat",
    flat_cents: 0,
    percent_rate: 0,
    tiers: [{ threshold_cents: 0, fee_cents: 0 }],
    other_fees_cents: 0,
  });

  // TanStack Query hooks
  const { data: companies = [], isLoading: companiesLoading } = useCompanies(
    workspace?.id || ""
  );

  const { data: feeRules = [] } = useCompanyFeeRules(selectedCompany?.id || "");

  // Mutations
  const createCompanyMutation = useCreateCompany(workspace?.id || "");
  const updateCompanyMutation = useUpdateCompany();
  const deleteCompanyMutation = useDeleteCompany();
  const createFeeRuleMutation = useCreateFeeRule();
  const updateFeeRuleMutation = useUpdateFeeRule();
  // const deleteRuleMutation = useDeleteFeeRule();

  // Loading states
  const isSubmitting =
    createCompanyMutation.isPending || updateCompanyMutation.isPending;
  const isDeleting = deleteCompanyMutation.isPending;
  const isRuleSubmitting =
    createFeeRuleMutation.isPending || updateFeeRuleMutation.isPending;

  // Form handlers
  const resetCompanyForm = () => {
    setCompanyFormData({
      name: "",
      website: "",
      fees_taxable: false,
      tax_override_pct: "",
    });
  };

  const resetRuleForm = () => {
    setRuleFormData({
      type: "flat",
      flat_cents: 0,
      percent_rate: 0,
      tiers: [{ threshold_cents: 0, fee_cents: 0 }],
      other_fees_cents: 0,
    });
  };

  const resetEditCompanyForm = () => {
    setEditCompanyFormData({
      name: "",
      website: "",
      fees_taxable: false,
      tax_override_pct: "",
    });
  };

  const openEditCompany = (company: Company) => {
    setEditCompanyFormData({
      name: company.name,
      website: company.website || "",
      fees_taxable: company.fees_taxable,
      tax_override_pct: company.tax_override_pct
        ? (company.tax_override_pct * 100).toString()
        : "",
    });
    setIsEditCompanyOpen(true);
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace?.id || !companyFormData.name.trim()) return;

    try {
      await createCompanyMutation.mutateAsync({
        name: companyFormData.name.trim(),
        website: companyFormData.website || undefined,
        fees_taxable: companyFormData.fees_taxable,
        tax_override_pct: companyFormData.tax_override_pct
          ? parseFloat(companyFormData.tax_override_pct) / 100
          : undefined,
      });

      setIsAddCompanyOpen(false);
      resetCompanyForm();
    } catch (error) {
      console.error("Error creating company:", error);
    }
  };

  const handleEditCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany || !editCompanyFormData.name.trim()) return;

    try {
      await updateCompanyMutation.mutateAsync({
        companyId: selectedCompany.id,
        updates: {
          name: editCompanyFormData.name.trim(),
          website: editCompanyFormData.website || undefined,
          fees_taxable: editCompanyFormData.fees_taxable,
          tax_override_pct: editCompanyFormData.tax_override_pct
            ? parseFloat(editCompanyFormData.tax_override_pct) / 100
            : undefined,
        },
      });

      setIsEditCompanyOpen(false);
      resetEditCompanyForm();
      // Update the selected company with new data
      const updatedCompany: Company = {
        ...selectedCompany,
        name: editCompanyFormData.name.trim(),
        website: editCompanyFormData.website || null,
        fees_taxable: editCompanyFormData.fees_taxable,
        tax_override_pct: editCompanyFormData.tax_override_pct
          ? parseFloat(editCompanyFormData.tax_override_pct) / 100
          : null,
      };
      setSelectedCompany(updatedCompany);
    } catch (error) {
      console.error("Error updating company:", error);
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    try {
      await deleteCompanyMutation.mutateAsync(companyId);
      setSelectedCompany(null);
      setShowDeleteConfirmation(false);
    } catch (error) {
      console.error("Error deleting company:", error);
    }
  };

  const handleRuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;

    try {
      // First, deactivate existing rules
      const activeRules = feeRules.filter(
        (rule: CompanyFeeRule) => rule.active
      );
      for (const rule of activeRules) {
        await updateFeeRuleMutation.mutateAsync({
          ruleId: rule.id,
          updates: { active: false },
        });
      }

      // Create new rule
      await createFeeRuleMutation.mutateAsync({
        company_id: selectedCompany.id,
        type: ruleFormData.type,
        flat_cents:
          ruleFormData.type === "flat" ? ruleFormData.flat_cents : undefined,
        percent_rate:
          ruleFormData.type === "percent"
            ? ruleFormData.percent_rate / 100
            : undefined,
        tiers: ruleFormData.type === "tiered" ? ruleFormData.tiers : undefined,
        active: true,
      });

      setIsRuleSheetOpen(false);
      resetRuleForm();
    } catch (error) {
      console.error("Error creating fee rule:", error);
    }
  };

  // Calculation helpers
  const calculateDeliveryFee = (
    subtotalCents: number,
    rule: CompanyFeeRule
  ): number => {
    if (!rule) return 0;

    switch (rule.type) {
      case "flat":
        return rule.flat_cents || 0;
      case "percent":
        return Math.round(subtotalCents * (rule.percent_rate || 0));
      case "tiered":
        if (!rule.tiers?.length) return 0;
        // Find the applicable tier (smallest threshold where subtotal <= threshold)
        const applicableTier = rule.tiers
          .filter((tier) => subtotalCents <= tier.threshold_cents)
          .sort((a, b) => a.threshold_cents - b.threshold_cents)[0];
        return applicableTier?.fee_cents || 0;
      default:
        return 0;
    }
  };

  const calculateTax = (
    subtotalCents: number,
    company: Company,
    deliveryFee: number,
    otherFees: number
  ): number => {
    const taxableBase =
      subtotalCents + (company.fees_taxable ? deliveryFee + otherFees : 0);
    const taxRate =
      company.tax_override_pct || workspace?.sales_tax_rate_pct || 0;
    return Math.round(taxableBase * taxRate);
  };

  const getPreviewCalculation = () => {
    if (!selectedCompany) return null;

    const activeRule = feeRules.find((rule: CompanyFeeRule) => rule.active);
    if (!activeRule) return null;

    const deliveryFee = calculateDeliveryFee(previewSubtotal, activeRule);
    const otherFees = ruleFormData.other_fees_cents;
    const tax = calculateTax(
      previewSubtotal,
      selectedCompany,
      deliveryFee,
      otherFees
    );
    const total = previewSubtotal + deliveryFee + otherFees + tax;

    return {
      subtotal: previewSubtotal,
      deliveryFee,
      otherFees,
      tax,
      total,
    };
  };

  const filteredCompanies = companies.filter(
    (company: Company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.website?.toLowerCase().includes(searchTerm.toLowerCase()) ??
        false)
  );

  // Format cents to currency
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: workspace?.currency || "USD",
    }).format(cents / 100);
  };

  // Empty State Component
  const EmptyState = ({ onAddCompany }: { onAddCompany: () => void }) => (
    <Card className="text-center py-12">
      <CardContent>
        <BuildingOfficeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No companies yet
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Add moving companies, furniture stores, and service providers to track
          their fees and delivery costs.
        </p>
        <Button onClick={onAddCompany} className="mx-auto">
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Your First Company
        </Button>
      </CardContent>
    </Card>
  );

  // Company Card Component
  const CompanyCard = ({ company }: { company: Company }) => {
    const companyRules = feeRules.filter(
      (rule: CompanyFeeRule) => rule.company_id === company.id
    );
    const activeRule = companyRules.find((rule: CompanyFeeRule) => rule.active);

    return (
      <Card
        className="group cursor-pointer hover:shadow-md transition-all duration-200 hover:border-blue-200"
        onClick={() => setSelectedCompany(company)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-semibold text-gray-900 truncate">
                  {company.name}
                </h3>
                {activeRule && (
                  <Badge variant="secondary" className="text-xs">
                    {activeRule.type}
                  </Badge>
                )}
              </div>

              {company.website && (
                <div className="flex items-center space-x-2 mb-2">
                  <GlobeIcon className="w-4 h-4 text-gray-400" />
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline truncate"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {company.website}
                  </a>
                </div>
              )}

              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <span>Fees Taxable:</span>
                  <Badge
                    variant={company.fees_taxable ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {company.fees_taxable ? "Yes" : "No"}
                  </Badge>
                </div>
                {company.tax_override_pct && (
                  <div className="flex items-center space-x-1">
                    <span>Tax Rate:</span>
                    <span className="font-medium">
                      {(company.tax_override_pct * 100).toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-400 flex-shrink-0 ml-4">
              Tap for details
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Mobile-First Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Companies</h1>
          <p className="text-sm text-gray-600">
            {companies.length} companies • manage service providers
          </p>
        </div>
        <Sheet open={isAddCompanyOpen} onOpenChange={setIsAddCompanyOpen}>
          <SheetTrigger asChild>
            <Button size="sm">
              <PlusIcon className="w-4 h-4 mr-1" />
              Add Company
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-xl p-6">
            <SheetHeader className="sr-only">
              <SheetTitle>Add New Company</SheetTitle>
              <SheetDescription>
                Add a new service provider or vendor
              </SheetDescription>
            </SheetHeader>

            {/* Header with drag indicator */}
            <div className="flex flex-col items-center pb-4 -mt-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full mb-4" />
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                    <BuildingOfficeIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Add Company
                    </h2>
                    <p className="text-sm text-gray-500">
                      Create a new service provider or vendor
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleCompanySubmit}
              className="flex-1 overflow-y-auto space-y-6"
            >
              {/* Company Details */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <span className="mr-2 text-lg">🏢</span>
                  Company Details
                </h3>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name *</Label>
                    <Input
                      id="company-name"
                      placeholder="e.g., IKEA, Home Depot, Moving Company"
                      value={companyFormData.name}
                      onChange={(e) =>
                        setCompanyFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      required
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-website">Website (optional)</Label>
                    <Input
                      id="company-website"
                      placeholder="https://company.com"
                      type="url"
                      value={companyFormData.website}
                      onChange={(e) =>
                        setCompanyFormData((prev) => ({
                          ...prev,
                          website: e.target.value,
                        }))
                      }
                      className="bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Tax Settings */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <span className="mr-2 text-lg">💰</span>
                  Tax Settings
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Fees Taxable</Label>
                      <p className="text-sm text-gray-500">
                        Are delivery and service fees subject to tax?
                      </p>
                    </div>
                    <Switch
                      checked={companyFormData.fees_taxable}
                      onCheckedChange={(checked) =>
                        setCompanyFormData((prev) => ({
                          ...prev,
                          fees_taxable: checked,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax-override">Tax Rate Override (%)</Label>
                    <Input
                      id="tax-override"
                      placeholder={`Default: ${(
                        (workspace?.sales_tax_rate_pct || 0) * 100
                      ).toFixed(2)}%`}
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={companyFormData.tax_override_pct}
                      onChange={(e) =>
                        setCompanyFormData((prev) => ({
                          ...prev,
                          tax_override_pct: e.target.value,
                        }))
                      }
                      className="bg-white"
                    />
                    <p className="text-xs text-gray-500">
                      Override the workspace tax rate for this company
                    </p>
                  </div>
                </div>
              </div>
            </form>

            {/* Action Buttons */}
            <div className="pt-6 border-t bg-white space-y-3">
              <Button
                onClick={handleCompanySubmit}
                disabled={isSubmitting}
                className="w-full py-3 text-base font-medium"
              >
                {isSubmitting ? (
                  <>
                    <SpinnerGapIcon className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add Company
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddCompanyOpen(false);
                  resetCompanyForm();
                }}
                className="w-full py-3 text-base font-medium"
              >
                Cancel
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search companies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Companies List */}
      {companiesLoading ? (
        <div className="flex items-center justify-center py-12">
          <SpinnerGapIcon className="w-8 h-8 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-600">Loading companies...</span>
        </div>
      ) : companies.length === 0 ? (
        <EmptyState onAddCompany={() => setIsAddCompanyOpen(true)} />
      ) : filteredCompanies.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <MagnifyingGlassIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No companies match your search
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search terms to see more results.
            </p>
            <Button onClick={() => setSearchTerm("")} variant="outline">
              Clear Search
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredCompanies.map((company: Company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      )}

      {/* Company Detail Sheet */}
      <Sheet
        open={selectedCompany !== null}
        onOpenChange={() => {
          setSelectedCompany(null);
          setShowDeleteConfirmation(false);
        }}
      >
        <SheetContent side="bottom" className="h-[85vh] rounded-t-xl p-6">
          <SheetHeader className="sr-only">
            <SheetTitle>Company Details</SheetTitle>
            <SheetDescription>View and manage company details</SheetDescription>
          </SheetHeader>
          {selectedCompany && (
            <>
              {/* Header with drag indicator */}
              <div className="flex flex-col items-center pb-4 -mt-2">
                <div className="w-12 h-1 bg-gray-300 rounded-full mb-4" />
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                      <BuildingOfficeIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-900">
                        {selectedCompany.name}
                      </h2>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge
                          variant={
                            selectedCompany.fees_taxable
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          Fees{" "}
                          {selectedCompany.fees_taxable
                            ? "Taxable"
                            : "Not Taxable"}
                        </Badge>
                        {selectedCompany.tax_override_pct && (
                          <Badge variant="outline" className="text-xs">
                            {(selectedCompany.tax_override_pct * 100).toFixed(
                              2
                            )}
                            % Tax
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <Tabs defaultValue="details" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="rules">Fee Rules</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-6">
                    {/* Company Info */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <h3 className="font-semibold text-gray-900 flex items-center">
                        <span className="mr-2 text-lg">🏢</span>
                        Company Information
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">
                            Name:
                          </span>
                          <span className="font-medium">
                            {selectedCompany.name}
                          </span>
                        </div>
                        {selectedCompany.website && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">
                              Website:
                            </span>
                            <a
                              href={selectedCompany.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center space-x-1"
                            >
                              <GlobeIcon className="w-4 h-4" />
                              <span>Visit</span>
                            </a>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">
                            Fees Taxable:
                          </span>
                          <Badge
                            variant={
                              selectedCompany.fees_taxable
                                ? "default"
                                : "secondary"
                            }
                          >
                            {selectedCompany.fees_taxable ? "Yes" : "No"}
                          </Badge>
                        </div>
                        {selectedCompany.tax_override_pct && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">
                              Tax Rate:
                            </span>
                            <span className="font-medium">
                              {(selectedCompany.tax_override_pct * 100).toFixed(
                                2
                              )}
                              %
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="rules" className="space-y-6">
                    {/* Fee Rules */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 flex items-center">
                          <span className="mr-2 text-lg">⚙️</span>
                          Fee Rules
                        </h3>
                        <Button
                          onClick={() => setIsRuleSheetOpen(true)}
                          variant="outline"
                          size="sm"
                        >
                          <PlusIcon className="w-4 h-4 mr-1" />
                          Add Rule
                        </Button>
                      </div>

                      {feeRules.length === 0 ? (
                        <div className="text-center py-8">
                          <CalculatorIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-500 text-sm">
                            No fee rules configured yet
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {feeRules.map((rule: CompanyFeeRule) => (
                            <div
                              key={rule.id}
                              className={`p-3 rounded-lg border ${
                                rule.active
                                  ? "border-green-200 bg-green-50"
                                  : "border-gray-200 bg-white"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <Badge
                                      variant={
                                        rule.active ? "default" : "secondary"
                                      }
                                      className="text-xs"
                                    >
                                      {rule.type}
                                    </Badge>
                                    {rule.active && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs text-green-700"
                                      >
                                        Active
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    {rule.type === "flat" &&
                                      `Flat fee: ${formatCurrency(
                                        rule.flat_cents || 0
                                      )}`}
                                    {rule.type === "percent" &&
                                      `${(
                                        (rule.percent_rate || 0) * 100
                                      ).toFixed(1)}% of subtotal`}
                                    {rule.type === "tiered" &&
                                      `${rule.tiers?.length || 0} tiers`}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Preview Calculator */}
                    {feeRules.some((rule: CompanyFeeRule) => rule.active) && (
                      <div className="bg-blue-50 rounded-xl p-4 space-y-3">
                        <h3 className="font-semibold text-gray-900 flex items-center">
                          <span className="mr-2 text-lg">🧮</span>
                          Fee Calculator
                        </h3>
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label>Order Subtotal</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={previewSubtotal / 100}
                              onChange={(e) =>
                                setPreviewSubtotal(
                                  Math.round(
                                    parseFloat(e.target.value || "0") * 100
                                  )
                                )
                              }
                              className="bg-white"
                            />
                          </div>

                          {(() => {
                            const calc = getPreviewCalculation();
                            if (!calc) return null;

                            return (
                              <div className="bg-white rounded-lg p-3 space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>Subtotal:</span>
                                  <span>{formatCurrency(calc.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>Delivery Fee:</span>
                                  <span>
                                    {formatCurrency(calc.deliveryFee)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>Other Fees:</span>
                                  <span>{formatCurrency(calc.otherFees)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>Tax:</span>
                                  <span>{formatCurrency(calc.tax)}</span>
                                </div>
                                <div className="border-t pt-2">
                                  <div className="flex justify-between font-semibold">
                                    <span>Total:</span>
                                    <span>{formatCurrency(calc.total)}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t bg-white space-y-3">
                {!showDeleteConfirmation ? (
                  <>
                    <Button
                      onClick={() => openEditCompany(selectedCompany)}
                      variant="outline"
                      className="w-full py-3 text-base font-medium"
                    >
                      <PencilIcon className="w-5 h-5 mr-2" />
                      Edit Company
                    </Button>
                    <Button
                      onClick={() => setShowDeleteConfirmation(true)}
                      variant="destructive"
                      className="w-full py-3 text-base font-medium"
                    >
                      <TrashIcon className="w-5 h-5 mr-2" />
                      Delete Company
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="bg-red-50 rounded-xl p-4 space-y-3">
                      <div className="text-center">
                        <TrashIcon className="w-12 h-12 text-red-500 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-red-900 mb-2">
                          Delete Company?
                        </h3>
                        <p className="text-sm text-red-700">
                          This action cannot be undone. All fee rules and
                          associated data for &ldquo;{selectedCompany.name}
                          &rdquo; will be permanently deleted.
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDeleteCompany(selectedCompany.id)}
                      disabled={isDeleting}
                      variant="destructive"
                      className="w-full py-3 text-base font-medium"
                    >
                      {isDeleting ? (
                        <>
                          <SpinnerGapIcon className="w-4 h-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <TrashIcon className="w-5 h-5 mr-2" />
                          Yes, Delete Company
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setShowDeleteConfirmation(false)}
                      variant="outline"
                      className="w-full py-3 text-base font-medium"
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Fee Rule Creation Sheet */}
      <Sheet open={isRuleSheetOpen} onOpenChange={setIsRuleSheetOpen}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-xl p-6">
          <SheetHeader className="sr-only">
            <SheetTitle>Add Fee Rule</SheetTitle>
            <SheetDescription>
              Create a new fee rule for delivery and other charges
            </SheetDescription>
          </SheetHeader>

          {/* Header with drag indicator */}
          <div className="flex flex-col items-center pb-4 -mt-2">
            <div className="w-12 h-1 bg-gray-300 rounded-full mb-4" />
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
                  <CalculatorIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Add Fee Rule
                  </h2>
                  <p className="text-sm text-gray-500">
                    Configure delivery and service fees
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleRuleSubmit}
            className="flex-1 overflow-y-auto space-y-6"
          >
            {/* Rule Type */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <span className="mr-2 text-lg">⚙️</span>
                Rule Type
              </h3>
              <div className="space-y-2">
                <Label>Fee Structure</Label>
                <Select
                  value={ruleFormData.type}
                  onValueChange={(value: FeeRuleType) =>
                    setRuleFormData((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger className="bg-white w-full">
                    <SelectValue placeholder="Select fee type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">💰 Flat Fee</SelectItem>
                    <SelectItem value="percent">📊 Percentage</SelectItem>
                    <SelectItem value="tiered">📈 Tiered Thresholds</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Rule Configuration */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <span className="mr-2 text-lg">🔧</span>
                Configuration
              </h3>

              {ruleFormData.type === "flat" && (
                <div className="space-y-2">
                  <Label>Flat Delivery Fee</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={ruleFormData.flat_cents / 100}
                    onChange={(e) =>
                      setRuleFormData((prev) => ({
                        ...prev,
                        flat_cents: Math.round(
                          parseFloat(e.target.value || "0") * 100
                        ),
                      }))
                    }
                    className="bg-white"
                  />
                </div>
              )}

              {ruleFormData.type === "percent" && (
                <div className="space-y-2">
                  <Label>Percentage Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="5.0"
                    value={ruleFormData.percent_rate}
                    onChange={(e) =>
                      setRuleFormData((prev) => ({
                        ...prev,
                        percent_rate: parseFloat(e.target.value || "0"),
                      }))
                    }
                    className="bg-white"
                  />
                </div>
              )}

              {ruleFormData.type === "tiered" && (
                <div className="space-y-3">
                  <div>
                    <Label>Tiered Fee Structure</Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Set different delivery fees based on order totals. Lower
                      thresholds take precedence.
                    </p>
                  </div>

                  {/* Example/Help text */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <div className="text-blue-600 text-sm">💡</div>
                      <div className="text-xs text-blue-700">
                        <strong>Example:</strong> If order total is $75, and you
                        have tiers &ldquo;≤ $50 → $5.99&rdquo; and &ldquo;≤ $100
                        → $7.99&rdquo;, the fee will be $7.99 (uses the lowest
                        threshold that the order total fits under).
                      </div>
                    </div>
                  </div>

                  {/* Tiers list */}
                  <div className="space-y-2">
                    {ruleFormData.tiers.map((tier, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 rounded-lg p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            Tier {index + 1}
                          </span>
                          {ruleFormData.tiers.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newTiers = ruleFormData.tiers.filter(
                                  (_, i) => i !== index
                                );
                                setRuleFormData((prev) => ({
                                  ...prev,
                                  tiers: newTiers,
                                }));
                              }}
                              className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                            >
                              <XIcon className="w-3 h-3" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-600">
                              Orders up to ($)
                            </Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                ≤
                              </span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="100.00"
                                value={tier.threshold_cents / 100}
                                onChange={(e) => {
                                  const newTiers = [...ruleFormData.tiers];
                                  newTiers[index] = {
                                    ...tier,
                                    threshold_cents: Math.round(
                                      parseFloat(e.target.value || "0") * 100
                                    ),
                                  };
                                  setRuleFormData((prev) => ({
                                    ...prev,
                                    tiers: newTiers,
                                  }));
                                }}
                                className="bg-white pl-8"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs text-gray-600">
                              Delivery fee ($)
                            </Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                $
                              </span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="7.99"
                                value={tier.fee_cents / 100}
                                onChange={(e) => {
                                  const newTiers = [...ruleFormData.tiers];
                                  newTiers[index] = {
                                    ...tier,
                                    fee_cents: Math.round(
                                      parseFloat(e.target.value || "0") * 100
                                    ),
                                  };
                                  setRuleFormData((prev) => ({
                                    ...prev,
                                    tiers: newTiers,
                                  }));
                                }}
                                className="bg-white pl-8"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Visual representation */}
                        {tier.threshold_cents > 0 && tier.fee_cents > 0 && (
                          <div className="text-xs text-gray-600 bg-white rounded p-2 border">
                            📋 Orders from $0.01 to $
                            {(tier.threshold_cents / 100).toFixed(2)}
                            will have a ${(tier.fee_cents / 100).toFixed(
                              2
                            )}{" "}
                            delivery fee
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newTiers = [
                        ...ruleFormData.tiers,
                        { threshold_cents: 0, fee_cents: 0 },
                      ];
                      setRuleFormData((prev) => ({ ...prev, tiers: newTiers }));
                    }}
                    className="w-full"
                  >
                    <PlusIcon className="w-4 h-4 mr-1" />
                    Add Another Tier
                  </Button>
                </div>
              )}
            </div>

            {/* Other Fees */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <span className="mr-2 text-lg">💳</span>
                Additional Fees
              </h3>
              <div className="space-y-2">
                <Label>Other Fees (bag fees, service charges, etc.)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={ruleFormData.other_fees_cents / 100}
                  onChange={(e) =>
                    setRuleFormData((prev) => ({
                      ...prev,
                      other_fees_cents: Math.round(
                        parseFloat(e.target.value || "0") * 100
                      ),
                    }))
                  }
                  className="bg-white"
                />
              </div>
            </div>
          </form>

          {/* Action Buttons */}
          <div className="pt-6 border-t bg-white space-y-3">
            <Button
              onClick={handleRuleSubmit}
              disabled={isRuleSubmitting}
              className="w-full py-3 text-base font-medium"
            >
              {isRuleSubmitting ? (
                <>
                  <SpinnerGapIcon className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckIcon className="w-5 h-5 mr-2" />
                  Create Rule
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsRuleSheetOpen(false);
                resetRuleForm();
              }}
              className="w-full py-3 text-base font-medium"
            >
              Cancel
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Company Sheet */}
      <Sheet open={isEditCompanyOpen} onOpenChange={setIsEditCompanyOpen}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-xl p-6">
          <SheetHeader className="sr-only">
            <SheetTitle>Edit Company</SheetTitle>
            <SheetDescription>
              Update company information and settings
            </SheetDescription>
          </SheetHeader>

          {/* Header with drag indicator */}
          <div className="flex flex-col items-center pb-4 -mt-2">
            <div className="w-12 h-1 bg-gray-300 rounded-full mb-4" />
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <PencilIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Edit Company
                  </h2>
                  <p className="text-sm text-gray-500">
                    Update company information and settings
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleEditCompanySubmit}
            className="flex-1 overflow-y-auto space-y-6"
          >
            {/* Company Details */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <span className="mr-2 text-lg">🏢</span>
                Company Details
              </h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-company-name">Company Name *</Label>
                  <Input
                    id="edit-company-name"
                    placeholder="e.g., IKEA, Home Depot, Moving Company"
                    value={editCompanyFormData.name}
                    onChange={(e) =>
                      setEditCompanyFormData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    required
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-company-website">
                    Website (optional)
                  </Label>
                  <Input
                    id="edit-company-website"
                    placeholder="https://company.com"
                    type="url"
                    value={editCompanyFormData.website}
                    onChange={(e) =>
                      setEditCompanyFormData((prev) => ({
                        ...prev,
                        website: e.target.value,
                      }))
                    }
                    className="bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Tax Settings */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <span className="mr-2 text-lg">💰</span>
                Tax Settings
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Fees Taxable</Label>
                    <p className="text-sm text-gray-500">
                      Are delivery and service fees subject to tax?
                    </p>
                  </div>
                  <Switch
                    checked={editCompanyFormData.fees_taxable}
                    onCheckedChange={(checked) =>
                      setEditCompanyFormData((prev) => ({
                        ...prev,
                        fees_taxable: checked,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-tax-override">
                    Tax Rate Override (%)
                  </Label>
                  <Input
                    id="edit-tax-override"
                    placeholder={`Default: ${(
                      (workspace?.sales_tax_rate_pct || 0) * 100
                    ).toFixed(2)}%`}
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={editCompanyFormData.tax_override_pct}
                    onChange={(e) =>
                      setEditCompanyFormData((prev) => ({
                        ...prev,
                        tax_override_pct: e.target.value,
                      }))
                    }
                    className="bg-white"
                  />
                  <p className="text-xs text-gray-500">
                    Override the workspace tax rate for this company
                  </p>
                </div>
              </div>
            </div>
          </form>

          {/* Action Buttons */}
          <div className="pt-6 border-t bg-white space-y-3">
            <Button
              onClick={handleEditCompanySubmit}
              disabled={isSubmitting}
              className="w-full py-3 text-base font-medium"
            >
              {isSubmitting ? (
                <>
                  <SpinnerGapIcon className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckIcon className="w-5 h-5 mr-2" />
                  Update Company
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditCompanyOpen(false);
                resetEditCompanyForm();
              }}
              className="w-full py-3 text-base font-medium"
            >
              Cancel
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
