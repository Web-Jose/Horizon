"use client";

import { useState } from "react";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { OnboardingData, CURRENCIES } from "@/lib/types";

interface WorkspaceSetupStepProps {
  data: OnboardingData;
  onUpdate: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
}

export function WorkspaceSetupStep({
  data,
  onUpdate,
  onNext,
}: WorkspaceSetupStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateAndProceed = () => {
    const newErrors: Record<string, string> = {};

    if (!data.workspaceName.trim()) {
      newErrors.workspaceName = "Workspace name is required";
    }

    if (!data.currency) {
      newErrors.currency = "Currency is required";
    }

    if (data.salesTaxRate < 0 || data.salesTaxRate > 50) {
      newErrors.salesTaxRate = "Sales tax rate must be between 0% and 50%";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onNext();
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    onUpdate({ moveInDate: date ? date.toISOString().split("T")[0] : null });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Create Your Workspace
        </h3>
        <p className="text-gray-600 text-sm">
          Set up the basics for your moving planner. You and your partner will
          share this workspace.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="workspaceName">Workspace Name *</Label>
          <Input
            id="workspaceName"
            placeholder="e.g., Our New Home Move"
            value={data.workspaceName}
            onChange={(e) => onUpdate({ workspaceName: e.target.value })}
            className={errors.workspaceName ? "border-red-500" : ""}
          />
          {errors.workspaceName && (
            <p className="text-sm text-red-500">{errors.workspaceName}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="zip">ZIP Code (optional)</Label>
            <Input
              id="zip"
              placeholder="12345"
              value={data.zip}
              onChange={(e) => onUpdate({ zip: e.target.value })}
            />
            <p className="text-xs text-gray-500">For location labeling only</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency *</Label>
            <Select
              value={data.currency}
              onValueChange={(value) => onUpdate({ currency: value })}
            >
              <SelectTrigger
                className={errors.currency ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.currency && (
              <p className="text-sm text-red-500">{errors.currency}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="salesTaxRate">Sales Tax Rate (%)</Label>
          <Input
            id="salesTaxRate"
            type="number"
            step="0.01"
            min="0"
            max="50"
            placeholder="8.25"
            value={data.salesTaxRate}
            onChange={(e) =>
              onUpdate({ salesTaxRate: parseFloat(e.target.value) || 0 })
            }
            className={errors.salesTaxRate ? "border-red-500" : ""}
          />
          {errors.salesTaxRate && (
            <p className="text-sm text-red-500">{errors.salesTaxRate}</p>
          )}
          <p className="text-xs text-gray-500">
            Default tax rate for purchases (can be overridden per company)
          </p>
        </div>

        <div className="space-y-2">
          <Label>Move-in Date (optional)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {data.moveInDate
                  ? format(new Date(data.moveInDate), "PPP")
                  : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={
                  data.moveInDate ? new Date(data.moveInDate) : undefined
                }
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <p className="text-xs text-gray-500">
            Used for budget planning and savings targets
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={validateAndProceed} className="px-8">
          Next Step
        </Button>
      </div>
    </div>
  );
}
