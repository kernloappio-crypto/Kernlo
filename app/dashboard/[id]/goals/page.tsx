"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import Navbar from "@/components/Navbar";
import { signOut } from "@/lib/supabase-auth";
import { getGoals, addGoal, deleteGoal, getActivities } from "@/lib/supabase-data";

export const dynamic = "force-dynamic";

interface Goal {
  id: string;
  child_name: string;
  subject: string;
  monthly_hours: number;
}

interface Activity {
  id: string;
  child_name: string;
  subject: string;
  duration: number;
  date: string;
}

interface Kid {
  id: string;
  name: string;
}

const COLORS = {
  primary: "#0066cc",
  secondary: "#00d4ff",
  accent1: "#ff6b6b",
  accent2: "#ffd93d",
  accent3: "#6bcf7f",
  dark: "#1a1a2e",
  light: "#f0f7ff",
};

const SUBJECTS = [
  "Math",
  "English",
  "Science",
  "History",
  "Social Studies",
  "Arts",
  "Physical Education",
  "Other",
];

export default function GoalsPage() {
  const params = useParams();
  const router = useRouter();
  const kidId = params.id as string;

  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [kid, setKid] = useState<Kid | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newHours, setNewHours] = useState("");

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/auth/login");
          return;
        }

        setUserId(user.id);
        setEmail(user.email || "");

        // Load kid
        const { data: kidData } = await supabase
          .from("kids")
          .select("*")
          .eq("id", kidId)
          .eq("user_id", user.id)
          .single();

        if (kidData) {
          setKid(kidData as Kid);
        }

        // Load goals
        const goalsData = await getGoals(user.id);
        const kidGoals = goalsData.filter((g: any) => g.child_name === kidData?.name);
        setGoals(kidGoals as Goal[]);

        // Load activities
        const activitiesData = await getActivities(user.id);
        const kidActivities = activitiesData.filter((a: any) => a.child_name === kidData?.name);
        setActivities(kidActivities as Activity[]);

        setLoading(false);
      } catch (err) {
        console.error("Error initializing:", err);
        setLoading(false);
      }
    };

    initializeUser();
  }, [kidId, router]);

  async function handleAddGoal() {
    if (!newSubject || !newHours) {
      alert("Subject and hours are required");
      return;
    }

    try {
      await addGoal(userId, kid!.name, newSubject, parseFloat(newHours));

      // Reload goals
      const goalsData = await getGoals(userId);
      const kidGoals = goalsData.filter((g: any) => g.child_name === kid!.name);
      setGoals(kidGoals as Goal[]);

      setNewSubject("");
      setNewHours("");
      setShowAddGoal(false);
    } catch (err) {
      console.error("Error adding goal:", err);
      alert("Failed to add goal");
    }
  }

  async function handleDeleteGoal(goalId: string) {
    if (!confirm("Delete this goal?")) return;

    try {
      await deleteGoal(goalId);
      setGoals(goals.filter((g) => g.id !== goalId));
    } catch (err) {
      console.error("Error deleting goal:", err);
      alert("Failed to delete goal");
    }
  }

  function calculateProgress(subject: string): { progress: number; hours: number } {
    const subjectActivities = activities.filter((a) => a.subject === subject);
    const hours = subjectActivities.reduce((sum, a) => sum + a.duration, 0);
    const goal = goals.find((g) => g.subject === subject);
    const progress = goal ? Math.round((hours / goal.monthly_hours) * 100) : 0;
    return { progress: Math.min(progress, 100), hours };
  }

  async function handleLogout() {
    await signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!kid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Child not found</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main style={{ backgroundColor: COLORS.light, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb" }} className="p-6">
        <div className="max-w-7xl mx-auto">
          <Link href={`/dashboard/${kidId}`} style={{ color: COLORS.primary }} className="text-sm font-medium mb-4 block">
            ← Back to {kid.name}
          </Link>
          <h1 style={{ color: COLORS.dark }} className="text-3xl font-bold">
            Goals
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Add Goal Button */}
        <button
          onClick={() => setShowAddGoal(!showAddGoal)}
          style={{ backgroundColor: COLORS.primary }}
          className="px-6 py-3 text-white font-medium rounded-lg hover:opacity-90"
        >
          {showAddGoal ? "Cancel" : "+ Add Goal"}
        </button>

        {/* Add Goal Form */}
        {showAddGoal && (
          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 border border-gray-200">
            <h2 style={{ color: COLORS.dark }} className="text-lg font-bold mb-4">
              Set Monthly Goal
            </h2>

            <div className="space-y-4 mb-4">
              <div>
                <label style={{ color: "#666" }} className="text-sm font-medium block mb-2">
                  Subject
                </label>
                <select
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  style={{ color: "#1a1a2e" }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select subject...</option>
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ color: "#666" }} className="text-sm font-medium block mb-2">
                  Hours per Month
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="10"
                  value={newHours}
                  onChange={(e) => setNewHours(e.target.value)}
                  style={{ color: "#1a1a2e" }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              onClick={handleAddGoal}
              style={{ backgroundColor: COLORS.primary }}
              className="w-full px-4 py-2 text-white font-medium rounded-lg hover:opacity-90"
            >
              Save Goal
            </button>
          </div>
        )}

        {/* Goals List */}
        <div>
          <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-4">
            Monthly Goals
          </h2>

          {goals.length === 0 ? (
            <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-8 text-center border border-gray-200">
              <p style={{ color: "#666" }}>No goals set yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map((goal) => {
                const { progress, hours } = calculateProgress(goal.subject);
                const progressColor =
                  progress >= 80 ? COLORS.accent3 : progress >= 50 ? COLORS.accent2 : COLORS.accent1;

                return (
                  <div
                    key={goal.id}
                    style={{ backgroundColor: "white", borderRadius: "12px" }}
                    className="p-6 border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 style={{ color: COLORS.dark }} className="text-lg font-bold">
                          {goal.subject}
                        </h3>
                        <p style={{ color: "#666" }} className="text-sm">
                          {hours.toFixed(1)}h / {goal.monthly_hours}h
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        style={{ color: "#ff6b6b" }}
                        className="text-sm font-medium hover:opacity-70"
                      >
                        Delete
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ backgroundColor: "#e5e7eb", borderRadius: "4px" }} className="h-3 overflow-hidden">
                      <div
                        style={{
                          backgroundColor: progressColor,
                          width: `${progress}%`,
                          transition: "width 0.3s ease",
                        }}
                        className="h-full"
                      />
                    </div>

                    <p style={{ color: "#666" }} className="text-sm mt-2">
                      {progress}% complete
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Logout Section at Bottom */}
      <div className="max-w-7xl mx-auto px-6 py-12 border-t border-gray-200">
        <button
          onClick={handleLogout}
          style={{ color: COLORS.primary }}
          className="text-sm font-medium hover:opacity-70"
        >
          Logout
        </button>
        <p style={{ color: "#999" }} className="text-xs mt-3">
          {email}
        </p>
      </div>
    </main>
    </>
  );
}
