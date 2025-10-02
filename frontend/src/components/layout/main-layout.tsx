"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  HouseIcon,
  ShoppingCartIcon,
  CheckSquareIcon,
  PiggyBankIcon,
  BuildingsIcon,
  GearIcon,
  UserIcon,
  SignOutIcon,
  ListIcon,
} from "@phosphor-icons/react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { Workspace } from "@/lib/types";

interface MainLayoutProps {
  children: React.ReactNode;
  user?: SupabaseUser;
  workspace?: Workspace;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSignOut: () => void;
}

export function MainLayout({
  children,
  user,
  workspace,
  activeTab,
  onTabChange,
  onSignOut,
}: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(true);

  // Handle responsive sidebar behavior
  React.useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth >= 768) {
        setSidebarCollapsed(false); // Desktop: show sidebar by default
      } else {
        setSidebarCollapsed(true); // Mobile: hide sidebar by default
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: HouseIcon },
    { id: "shopping", label: "Shopping", icon: ShoppingCartIcon },
    { id: "tasks", label: "Tasks", icon: CheckSquareIcon },
    { id: "budgets", label: "Budgets", icon: PiggyBankIcon },
    { id: "companies", label: "Companies", icon: BuildingsIcon },
    { id: "settings", label: "Space Settings", icon: GearIcon },
  ];

  const actionItems = [
    { id: "signout", label: "Sign Out", icon: SignOutIcon, action: onSignOut },
  ];

  // Helper function to handle navigation and close mobile menu
  const handleNavigation = (tabId: string) => {
    onTabChange(tabId);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      setSidebarCollapsed(true);
    }
  };

  // Helper function to close mobile menu
  const closeMobileMenu = () => {
    if (window.innerWidth < 768) {
      setSidebarCollapsed(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-50 h-screen
          ${
            sidebarCollapsed
              ? "md:w-16 md:flex -translate-x-full md:translate-x-0"
              : "w-full md:w-64 translate-x-0"
          } 
          fixed md:relative`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-gray-900">
                🏠 Moving Home Planner
              </h1>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="ml-auto"
          >
            <ListIcon className="w-4 h-4" />
          </Button>
        </div>

        {/* Workspace Info */}
        {workspace && !sidebarCollapsed && (
          <div className="px-4 py-2 border-b border-gray-100">
            <Badge variant="secondary" className="w-full justify-start">
              {workspace.name}
            </Badge>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-2 flex flex-col">
          <div className="space-y-1 flex-1">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start ${
                    sidebarCollapsed ? "px-2" : "px-3"
                  } ${
                    isActive ? "bg-blue-600 text-white hover:bg-blue-700" : ""
                  }`}
                  onClick={() => handleNavigation(item.id)}
                >
                  <IconComponent className="w-4 h-4" />
                  {!sidebarCollapsed && (
                    <span className="ml-2">{item.label}</span>
                  )}
                </Button>
              );
            })}
          </div>

          {/* Sign Out Button */}
          <div className="mt-auto pt-2 border-t border-gray-200">
            {actionItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={`w-full justify-start ${
                    sidebarCollapsed ? "px-2" : "px-3"
                  } text-red-600 hover:text-red-700 hover:bg-red-50`}
                  onClick={() => {
                    item.action();
                    closeMobileMenu();
                  }}
                >
                  <IconComponent className="w-4 h-4" />
                  {!sidebarCollapsed && (
                    <span className="ml-2">{item.label}</span>
                  )}
                </Button>
              );
            })}
          </div>
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-200 p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={`w-full justify-start ${
                  sidebarCollapsed ? "px-2" : "px-3"
                }`}
              >
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs">
                    {user?.email?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                {!sidebarCollapsed && (
                  <div className="ml-2 text-left truncate">
                    <p className="text-sm font-medium truncate">
                      {user?.email}
                    </p>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56"
              align={sidebarCollapsed ? "center" : "start"}
              side="right"
            >
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium text-sm">{user?.email}</p>
                  <p className="text-xs text-gray-500">{workspace?.name}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={closeMobileMenu}>
                <UserIcon className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={closeMobileMenu}>
                <GearIcon className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  onSignOut();
                  closeMobileMenu();
                }}
              >
                <SignOutIcon className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-0">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              {/* Mobile Menu Button - only show on mobile */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden flex-shrink-0"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                <ListIcon className="w-5 h-5" />
              </Button>

              {/* Current Page Title */}
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 capitalize truncate">
                {activeTab}
              </h2>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
