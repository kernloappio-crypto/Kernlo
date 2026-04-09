"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { ComplianceSetting, Kid } from "@/lib/types";

const COLORS = {
  primary: "#0066cc",
  dark: "#1a1a2e",
};

const STATE_REQUIREMENTS: { [key: string]: { [subject: string]: number } } = {
  CA: { Math: 180, "Language Arts": 180, Science: 180, History: 180 },
  TX: { Math: 180, "Language Arts": 180, Science: 90, History: 90 },
  FL: { Math: 180, "Language Arts": 180, Science: 90, History: 90 },
  NY: { Math: 120, "Language Arts": 120, Science: 120, History: 120 },
};

export function ComplianceTab({ activeChild, kids }: { activeChild: string; kids: Kid[] }) {
  const { supabase, user } = useAuth();
  const [state, setState] = useState("CA");
  const [compliance, setCompliance] = useState<ComplianceSetting | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompliance();
  }, []);

  async function loadCompliance() {
    if (!user) return;

    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!workspace) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("compliance_settings")
      .select("*")
      .eq("workspace_id", workspace.id)
      .single();

    if (data) {
      setState(data.state);
      setCompliance(data);
    }
    setLoading(false);
  }

  async function updateState(newState: string) {
    if (!user) return;

    setState(newState);

    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!workspace) return;

    const requirements = STATE_REQUIREMENTS[newState] || {};

    if (compliance) {
      await supabase
        .from("compliance_settings")
        .update({ state: newState, requirements })
        .eq("id", compliance.id);
    } else {
      const { data } = await supabase
        .from("compliance_settings")
        .insert([{
          workspace_id: workspace.id,
          state: newState,
          requirements,
        }])
        .select();

      if (data) setCompliance(data[0]);
    }
  }

  const requirements = STATE_REQUIREMENTS[state] || {};
  const activeKidName = kids.find(k => k.id === activeChild)?.name || "Unknown";

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-6">
        Compliance Tracking for {activeKidName}
      </h2>

      {/* State Selector */}
      <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 border border-gray-200 mb-8">
        <label style={{ color: COLORS.dark }} className="font-semibold block mb-3">
          Select State
        </label>
        <select
          value={state}
          onChange={(e) => updateState(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          {Object.keys(STATE_REQUIREMENTS).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Requirements */}
      <div className="grid grid-cols-2 gap-6">
        {Object.entries(requirements).map(([subject, hours]) => (
          <div
            key={subject}
            style={{ backgroundColor: "white", borderRadius: "12px" }}
            className="p-6 border border-gray-200"
          >
            <h4 style={{ color: COLORS.dark }} className="font-semibold mb-2">
              {subject}
            </h4>
            <p style={{ color: "#666" }} className="text-sm mb-4">
              Required: {hours} hours/year
            </p>
            <div style={{ backgroundColor: "#f0f7ff" }} className="h-2 rounded-full overflow-hidden">
              <div
                style={{ backgroundColor: "#ff6b6b", width: "30%" }}
                className="h-full"
              />
            </div>
            <p style={{ color: "#666" }} className="text-xs mt-2">
              30% complete (108/360 hours)
            </p>
          </div>
        ))}
      </div>

      {/* Export Button */}
      <button
        style={{ backgroundColor: COLORS.primary }}
        className="mt-8 px-6 py-3 text-white font-medium rounded-lg hover:opacity-90"
      >
        📥 Export for Submission
      </button>
    </div>
  );
}
