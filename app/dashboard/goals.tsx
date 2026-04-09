"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { Goal, Kid } from "@/lib/types";

const COLORS = {
  primary: "#0066cc",
  dark: "#1a1a2e",
};

export function GoalsTab({ activeChild, kids }: { activeChild: string; kids: Kid[] }) {
  const { supabase, user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState({ subject: "", hours: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeChild) return;
    loadGoals();
  }, [activeChild]);

  async function loadGoals() {
    if (!user) return;

    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!workspace) return;

    const { data } = await supabase
      .from("goals")
      .select("*")
      .eq("workspace_id", workspace.id)
      .eq("kid_id", activeChild);

    setGoals(data || []);
    setLoading(false);
  }

  async function addGoal() {
    if (!user || !newGoal.subject || newGoal.hours === 0) return;

    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!workspace) return;

    const { data } = await supabase
      .from("goals")
      .insert([{
        workspace_id: workspace.id,
        kid_id: activeChild,
        subject: newGoal.subject,
        monthly_hours: newGoal.hours,
      }])
      .select();

    if (data) {
      setGoals([...goals, data[0]]);
      setNewGoal({ subject: "", hours: 0 });
    }
  }

  const activeKidName = kids.find(k => k.id === activeChild)?.name || "Unknown";

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-6">
        Monthly Goals for {activeKidName}
      </h2>

      {/* Add Goal Form */}
      <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 border border-gray-200 mb-8">
        <h3 style={{ color: COLORS.dark }} className="font-semibold mb-4">
          Add New Goal
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Subject (e.g., Math)"
            value={newGoal.subject}
            onChange={(e) => setNewGoal({ ...newGoal, subject: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <input
            type="number"
            placeholder="Monthly hours"
            value={newGoal.hours}
            onChange={(e) => setNewGoal({ ...newGoal, hours: parseInt(e.target.value) })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <button
          onClick={addGoal}
          style={{ backgroundColor: COLORS.primary }}
          className="mt-4 w-full px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90"
        >
          Add Goal
        </button>
      </div>

      {/* Goals List */}
      <div className="grid grid-cols-2 gap-6">
        {goals.map((goal) => (
          <div
            key={goal.id}
            style={{ backgroundColor: "white", borderRadius: "12px" }}
            className="p-6 border border-gray-200"
          >
            <h4 style={{ color: COLORS.dark }} className="font-semibold mb-2">
              {goal.subject}
            </h4>
            <p style={{ color: "#666" }} className="text-sm mb-4">
              Target: {goal.monthly_hours} hours/month
            </p>
            <div style={{ backgroundColor: "#f0f7ff" }} className="h-2 rounded-full overflow-hidden">
              <div
                style={{ backgroundColor: COLORS.primary, width: "45%" }}
                className="h-full transition"
              />
            </div>
            <p style={{ color: "#666" }} className="text-xs mt-2">
              45% complete
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
