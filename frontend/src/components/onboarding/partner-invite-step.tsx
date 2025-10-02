"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingData } from "@/lib/types";
import { Mail, UsersIcon } from "lucide-react";

interface PartnerInviteStepProps {
  data: OnboardingData;
  onUpdate: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function PartnerInviteStep({
  data,
  onUpdate,
  onNext,
  onPrevious,
}: PartnerInviteStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateEmail = (email: string): boolean => {
    if (!email) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateAndProceed = () => {
    const newErrors: Record<string, string> = {};

    if (data.partnerEmail && !validateEmail(data.partnerEmail)) {
      newErrors.partnerEmail = "Please enter a valid email address";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onNext();
    }
  };

  const skipStep = () => {
    onUpdate({ partnerEmail: "" });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <UsersIcon className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Invite Your Partner
        </h3>
        <p className="text-gray-600 text-sm">
          Add your partner to collaborate on your moving plans. They&#39;ll get
          identical access to manage items, tasks, and budgets.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="partnerEmail">Partner&#39;s Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="partnerEmail"
              type="email"
              placeholder="partner@example.com"
              value={data.partnerEmail}
              onChange={(e) => onUpdate({ partnerEmail: e.target.value })}
              className={`pl-10 ${errors.partnerEmail ? "border-red-500" : ""}`}
            />
          </div>
          {errors.partnerEmail && (
            <p className="text-sm text-red-500">{errors.partnerEmail}</p>
          )}
          <p className="text-xs text-gray-500">
            We&#39;ll send them an invitation link to join your workspace
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">
            What your partner can do:
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Add and edit items in your shopping lists</li>
            <li>• Manage tasks and mark them as complete</li>
            <li>• Track budgets and record savings</li>
            <li>• View the shared dashboard and progress</li>
          </ul>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <div className="text-amber-600 mt-0.5">💡</div>
            <div>
              <h4 className="font-medium text-amber-900">Skip for now?</h4>
              <p className="text-sm text-amber-800">
                You can always invite your partner later from the workspace
                settings.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <div className="space-x-2">
          <Button variant="ghost" onClick={skipStep}>
            Skip for now
          </Button>
          <Button onClick={validateAndProceed} className="px-8">
            {data.partnerEmail ? "Send Invite & Continue" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
