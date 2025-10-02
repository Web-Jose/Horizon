"use client";

import { Dashboard } from "@/components/dashboard/dashboard";
import { ShoppingLists } from "@/components/shopping/shopping-lists";
import { Tasks } from "@/components/tasks/tasks";
import { BudgetTracking } from "@/components/budget/budget-tracking";
import { Companies } from "@/components/companies/companies";
import { SpaceSettings } from "@/components/settings/space-settings";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { Workspace } from "@/lib/types";

interface MainContentProps {
  activeTab: string;
  workspace?: Workspace;
  user?: SupabaseUser;
  onTabChange?: (tab: string) => void;
}

export function MainContent({
  activeTab,
  workspace,
  user,
  onTabChange,
}: MainContentProps) {
  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <Dashboard
            activeTab={activeTab}
            workspace={workspace}
            user={user}
            onTabChange={onTabChange}
          />
        );
      case "shopping":
        return (
          <ShoppingLists
            activeTab={activeTab}
            workspace={workspace}
            user={user}
          />
        );
      case "tasks":
        return (
          <Tasks activeTab={activeTab} workspace={workspace} user={user} />
        );
      case "budgets":
        return (
          <BudgetTracking
            activeTab={activeTab}
            workspace={workspace}
            user={user}
          />
        );
      case "companies":
        return (
          <Companies activeTab={activeTab} workspace={workspace} user={user} />
        );
      case "settings":
        return (
          <SpaceSettings
            activeTab={activeTab}
            workspace={workspace}
            user={user}
          />
        );
      default:
        return null;
    }
  };

  return <div className="space-y-6">{renderActiveTab()}</div>;
}
