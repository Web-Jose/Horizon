"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { OnboardingService } from "@/lib/onboarding";
import { MainLayout } from "@/components/layout/main-layout";
import { MainContent } from "@/components/main-content";
import { Workspace } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasWorkspace, setHasWorkspace] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(
    null
  );
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    // Check current auth status
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Check if user has workspaces
        const workspaces = await OnboardingService.getUserWorkspaces(user.id);
        setHasWorkspace(workspaces.length > 0);
        if (workspaces.length > 0) {
          setCurrentWorkspace(workspaces[0]); // Use the first workspace
        }
      }

      setLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        const workspaces = await OnboardingService.getUserWorkspaces(
          session.user.id
        );
        setHasWorkspace(workspaces.length > 0);
      } else {
        setHasWorkspace(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    try {
      if (authMode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert("Check your email for the confirmation link!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleOnboardingComplete = async (workspaceId: string) => {
    // Handle successful onboarding completion
    setHasWorkspace(true);

    // Fetch the workspace details
    if (user) {
      const workspaces = await OnboardingService.getUserWorkspaces(user.id);
      const workspace = workspaces.find((w) => w && w.id === workspaceId);
      if (workspace) {
        setCurrentWorkspace(workspace);
      }
    }

    console.log("Onboarding completed for workspace:", workspaceId);
  };
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show auth form
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Moving Home Planner 🏠</CardTitle>
            <CardDescription>
              {authMode === "signin"
                ? "Sign in to your account"
                : "Create your account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={authLoading}>
                {authLoading
                  ? "Loading..."
                  : authMode === "signin"
                  ? "Sign In"
                  : "Sign Up"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={() =>
                  setAuthMode(authMode === "signin" ? "signup" : "signin")
                }
              >
                {authMode === "signin"
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authenticated but no workspace - show onboarding
  if (!hasWorkspace) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  // Authenticated with workspace - show main app
  return (
    <MainLayout
      user={user || undefined}
      workspace={currentWorkspace || undefined}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onSignOut={handleSignOut}
    >
      <MainContent
        activeTab={activeTab}
        workspace={currentWorkspace || undefined}
        user={user || undefined}
        onTabChange={setActiveTab}
      />
    </MainLayout>
  );
}
