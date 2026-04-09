"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { Kid, Goal, ComplianceSetting } from "@/lib/types";

const COLORS = {
  primary: "#0066cc",
  secondary: "#00d4ff",
  accent1: "#ff6b6b",
  accent2: "#ffd93d",
  accent3: "#6bcf7f",
  dark: "#1a1a2e",
  light: "#f0f7ff",
};

type Tab = "overview" | "goals" | "compliance";

export default function DashboardPage() {
  const { user, supabase } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [activeChild, setActiveChild] = useState("");
  const [kids, setKids] = useState<Kid[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [complianceSettings, setComplianceSettings] = useState<ComplianceSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQuickLog, setShowQuickLog] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, supabase]);

  async function loadData() {
    if (!user) return;

    try {
      // Get workspace
      const { data: workspace, error: wsError } = await supabase
        .from("workspaces")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (wsError || !workspace) {
        // Create workspace if doesn't exist
        const { data: newWs } = await supabase
          .from("workspaces")
          .insert([{ user_id: user.id, name: `${user.email}'s Workspace` }])
          .select()
          .single();
        
        if (newWs) {
          await loadKidsAndGoals(newWs.id);
        }
      } else {
        await loadKidsAndGoals(workspace.id);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadKidsAndGoals(workspaceId: string) {
    // Load kids
    const { data: kidsData } = await supabase
      .from("kids")
      .select("*")
      .eq("workspace_id", workspaceId);

    if (kidsData && kidsData.length > 0) {
      setKids(kidsData);
      setActiveChild(kidsData[0].id);

      // Load goals
      const { data: goalsData } = await supabase
        .from("goals")
        .select("*")
        .eq("workspace_id", workspaceId);

      if (goalsData) {
        setGoals(goalsData);
      }
    }

    // Load compliance settings
    const { data: complianceData } = await supabase
      .from("compliance_settings")
      .select("*")
      .eq("workspace_id", workspaceId)
      .single();

    if (complianceData) {
      setComplianceSettings(complianceData);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <main style={{ backgroundColor: COLORS.light, minHeight: "100vh" }}>
      {/* Top Navigation */}
      <nav style={{ backgroundColor: "white", borderBottom: `1px solid #e5e7eb` }} className="sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div style={{ color: COLORS.primary }} className="text-2xl font-bold">
            kernlo
          </div>
          <div className="flex items-center gap-6">
            <Link href="/generator" style={{ color: COLORS.dark }} className="text-sm font-medium hover:opacity-70">
              New Report
            </Link>
            <button
              onClick={() => setShowQuickLog(true)}
              style={{ backgroundColor: COLORS.primary }}
              className="px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90"
            >
              ⚡ Quick Log
            </button>
            <button
              onClick={() => supabase.auth.signOut()}
              className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Log Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="mb-8 border-b border-gray-200 flex gap-8">
          {["overview", "goals", "compliance"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as Tab)}
              style={{
                color: activeTab === tab ? COLORS.primary : "#999",
                borderBottom: activeTab === tab ? `2px solid ${COLORS.primary}` : "none",
              }}
              className="pb-4 font-medium text-sm capitalize transition"
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div>
            <div className="mb-8">
              <p style={{ color: COLORS.primary }} className="text-xs font-semibold uppercase tracking-wide mb-3">
                Kids
              </p>
              <div className="flex gap-2">
                {kids.map((kid) => (
                  <button
                    key={kid.id}
                    onClick={() => setActiveChild(kid.id)}
                    style={{
                      backgroundColor: activeChild === kid.id ? COLORS.primary : "white",
                      color: activeChild === kid.id ? "white" : COLORS.dark,
                      borderColor: COLORS.primary,
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium border transition"
                  >
                    {kid.name}
                  </button>
                ))}
              </div>
            </div>
            <p style={{ color: COLORS.dark }} className="text-lg">Overview content coming</p>
          </div>
        )}

        {/* Goals Tab */}
        {activeTab === "goals" && (
          <div>
            <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-6">
              Learning Goals
            </h2>
            <p style={{ color: COLORS.dark }} className="text-lg">Goals content coming</p>
          </div>
        )}

        {/* Compliance Tab */}
        {activeTab === "compliance" && (
          <div>
            <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-6">
              Compliance Tracking
            </h2>
            <p style={{ color: COLORS.dark }} className="text-lg">Compliance content coming</p>
          </div>
        )}
      </div>

      {/* Quick Log Modal */}
      {showQuickLog && (
        <div style={{ backgroundColor: "rgba(0,0,0,0.5)" }} className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-8 max-w-md w-full">
            <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-6">
              Quick Log
            </h2>
            <p style={{ color: COLORS.dark }}>Coming soon</p>
            <button
              onClick={() => setShowQuickLog(false)}
              className="mt-6 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
