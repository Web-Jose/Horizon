"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { OnboardingData, OnboardingStep } from "@/lib/types";
import { WorkspaceSetupStep } from "./workspace-setup-step";
import { PartnerInviteStep } from "./partner-invite-step";
import { CategoriesRoomsStep } from "./categories-rooms-step";
import { CompletionStep } from "./completion-step";
import { OnboardingService } from "@/lib/onboarding";

const STEPS: { key: OnboardingStep; title: string; description: string }[] = [
  {
    key: "workspace-setup",
    title: "Workspace Setup",
    description: "Create your moving planner workspace",
  },
  {
    key: "partner-invite",
    title: "Invite Partner",
    description: "Add your partner to the workspace",
  },
  {
    key: "categories-rooms",
    title: "Categories & Rooms",
    description: "Choose your organization system",
  },
  {
    key: "complete",
    title: "Complete",
    description: "Your workspace is ready!",
  },
];

interface OnboardingWizardProps {
  onComplete: (workspaceId: string) => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] =
    useState<OnboardingStep>("workspace-setup");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    workspaceName: "",
    zip: "",
    currency: "USD",
    salesTaxRate: 8.25,
    moveInDate: null,
    partnerEmail: "",
    selectedCategories: [],
    selectedRooms: [],
  });

  const currentStepIndex = STEPS.findIndex((step) => step.key === currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].key);
    }
  };

  const goToPreviousStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].key);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const result = (await OnboardingService.completeOnboarding(data)) as {
        workspace: { id: string };
      };
      setCurrentStep("complete");
      setTimeout(() => {
        onComplete(result.workspace.id);
      }, 2000);
    } catch (error) {
      console.error("Onboarding failed:", error);
      // Handle error - show toast or error message
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "workspace-setup":
        return (
          <WorkspaceSetupStep
            data={data}
            onUpdate={updateData}
            onNext={goToNextStep}
          />
        );
      case "partner-invite":
        return (
          <PartnerInviteStep
            data={data}
            onUpdate={updateData}
            onNext={goToNextStep}
            onPrevious={goToPreviousStep}
          />
        );
      case "categories-rooms":
        return (
          <CategoriesRoomsStep
            data={data}
            onUpdate={updateData}
            onComplete={handleComplete}
            onPrevious={goToPreviousStep}
            isSubmitting={isSubmitting}
          />
        );
      case "complete":
        return <CompletionStep />;
      default:
        return null;
    }
  };

  const currentStepInfo = STEPS[currentStepIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Moving Home Planner 🏠
              </h1>
              <p className="text-gray-600">
                Let&apos;s get your shared workspace set up!
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>
                  Step {currentStepIndex + 1} of {STEPS.length}
                </span>
                <span>{Math.round(progress)}% complete</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>

            <CardTitle className="text-xl">{currentStepInfo.title}</CardTitle>
            <CardDescription>{currentStepInfo.description}</CardDescription>
          </CardHeader>

          <CardContent>{renderCurrentStep()}</CardContent>
        </Card>
      </div>
    </div>
  );
}
