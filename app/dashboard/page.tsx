"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";

export const dynamic = "force-dynamic";
import { getKids, addKid, deleteKid, getActivities, getGoals } from "@/lib/supabase-data";
import { getTrialStatus as calculateTrialStatus, formatTrialMessage, type TrialStatus } from "@/lib/trial-checker";

interface Kid {
  id: string;
  name: string;
  age?: number;
  grade?: string;
}

interface Activity {
  id: string;
  child_name: string;
  subject: string;
  duration: number;
  platform: string;
  date: string;
  notes?: string;
}

interface Goal {
  id: string;
  child_name: string;
  subject: string;
  monthly_hours: number;
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

export default function DashboardHomePage() {
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [kids, setKids] = useState<Kid[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showAddKid, setShowAddKid] = useState(false);
  const [newKidName, setNewKidName] = useState("");
  const [newKidAge, setNewKidAge] = useState("");
  const [newKidGrade, setNewKidGrade] = useState("");
  const router = useRouter();

  // Initialize and load data
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

        // Load trial status
        const { data: userData } = await supabase
          .from("users")
          .select("trial_start_date, is_paid, trial_ended")
          .eq("id", user.id)
          .single();

        if (userData) {
          const status = calculateTrialStatus(userData.trial_start_date, userData.is_paid);
          setTrialStatus(status);

          if (status.trial_expired && !status.is_paid) {
            setShowUpgradeModal(true);
          }
        }

        // Load kids, activities, goals
        await loadData(user.id);
        setLoading(false);
      } catch (err) {
        console.error("Error initializing user:", err);
        setLoading(false);
      }
    };

    initializeUser();
  }, [router]);

  // Real-time listeners for kids
  useEffect(() => {
    if (!userId) return;

    try {
      const channel = supabase
        .channel(`kids:${userId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "kids", filter: `user_id=eq.${userId}` },
          () => {
            loadData(userId);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.error("Real-time listener error:", err);
    }
  }, [userId]);

  async function loadData(uid: string) {
    try {
      const kidsData = await getKids(uid);
      setKids(kidsData as Kid[]);

      const activitiesData = await getActivities(uid);
      setActivities(activitiesData as Activity[]);

      const goalsData = await getGoals(uid);
      setGoals(goalsData as Goal[]);
    } catch (err) {
      console.error("Error loading data:", err);
    }
  }

  async function handleAddKid() {
    if (!newKidName.trim()) {
      alert("Kid name is required");
      return;
    }

    if (kids.length >= 5) {
      alert("Pro tier limited to 5 children. Upgrade for more.");
      return;
    }

    try {
      await addKid(
        userId,
        newKidName,
        newKidAge ? parseInt(newKidAge) : undefined,
        newKidGrade || undefined
      );

      setNewKidName("");
      setNewKidAge("");
      setNewKidGrade("");
      setShowAddKid(false);
      await loadData(userId);
    } catch (err) {
      console.error("Error adding kid:", err);
      alert("Failed to add kid");
    }
  }

  async function handleDeleteKid(kidId: string) {
    if (!confirm("Delete this child's profile?")) return;

    try {
      await deleteKid(kidId);
      await loadData(userId);
    } catch (err) {
      console.error("Error deleting kid:", err);
      alert("Failed to delete kid");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  function calculateGoalProgress(childName: string, subject: string): number {
    const childActivities = activities.filter(
      (a) => a.child_name === childName && a.subject === subject
    );
    const totalHours = childActivities.reduce((sum, a) => sum + a.duration, 0);
    const goal = goals.find(
      (g) => g.child_name === childName && g.subject === subject
    );
    return goal ? Math.round((totalHours / goal.monthly_hours) * 100) : 0;
  }

  function getThisWeekActivity(): { [key: string]: number } {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyData: { [key: string]: number } = {};

    kids.forEach((kid) => {
      const kidActivities = activities.filter(
        (a) => a.child_name === kid.name && new Date(a.date) >= weekAgo
      );
      const totalHours = kidActivities.reduce((sum, a) => sum + a.duration, 0);
      weeklyData[kid.name] = totalHours;
    });

    return weeklyData;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!trialStatus?.can_access) {
    return (
      <div style={{ backgroundColor: "rgba(0,0,0,0.7)" }} className="fixed inset-0 flex items-center justify-center p-4 z-50">
        <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-8 max-w-md w-full">
          <h2 style={{ color: "#ff6b6b" }} className="text-2xl font-bold mb-4">
            Your Trial Has Ended
          </h2>
          <p style={{ color: "#666" }} className="mb-6">
            Your 30-day free trial is over. Upgrade to Pro to keep using Kernlo and generating reports.
          </p>

          <div style={{ backgroundColor: COLORS.light }} className="p-4 rounded-lg mb-6">
            <p style={{ color: COLORS.dark }} className="font-bold mb-2">
              Pro - $14.99/month
            </p>
            <ul style={{ color: "#666" }} className="text-sm space-y-1">
              <li>✓ Unlimited reports</li>
              <li>✓ Up to 5 children</li>
              <li>✓ All features</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/upgrade?email=${encodeURIComponent(email)}`}
              style={{ backgroundColor: COLORS.primary }}
              className="flex-1 px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 text-center"
            >
              Upgrade Now
            </Link>
            <button
              onClick={handleLogout}
              className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const weeklyData = getThisWeekActivity();

  return (
    <main style={{ backgroundColor: COLORS.light, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb" }} className="p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 style={{ color: COLORS.dark }} className="text-3xl font-bold">
              Kernlo
            </h1>
            <p style={{ color: "#666" }} className="text-sm">
              {formatTrialMessage(trialStatus!)}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-4 border border-gray-200">
            <p style={{ color: "#666" }} className="text-sm mb-2">
              Total Children
            </p>
            <p style={{ color: COLORS.primary }} className="text-3xl font-bold">
              {kids.length}
            </p>
          </div>

          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-4 border border-gray-200">
            <p style={{ color: "#666" }} className="text-sm mb-2">
              Total Goals
            </p>
            <p style={{ color: COLORS.primary }} className="text-3xl font-bold">
              {goals.length}
            </p>
          </div>

          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-4 border border-gray-200">
            <p style={{ color: "#666" }} className="text-sm mb-2">
              Total Hours Logged
            </p>
            <p style={{ color: COLORS.primary }} className="text-3xl font-bold">
              {Math.round(activities.reduce((sum, a) => sum + a.duration, 0))}
            </p>
          </div>

          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-4 border border-gray-200">
            <p style={{ color: "#666" }} className="text-sm mb-2">
              This Week
            </p>
            <p style={{ color: COLORS.primary }} className="text-3xl font-bold">
              {Math.round(Object.values(weeklyData).reduce((a, b) => a + b, 0))}h
            </p>
          </div>
        </div>

        {/* Kids Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold">
              Children
            </h2>
            {kids.length < 5 && (
              <button
                onClick={() => setShowAddKid(true)}
                style={{ backgroundColor: COLORS.primary }}
                className="px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90"
              >
                + Add Child
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kids.map((kid) => (
              <Link
                key={kid.id}
                href={`/dashboard/${kid.id}`}
                style={{ backgroundColor: "white", borderRadius: "12px" }}
                className="p-6 border border-gray-200 hover:border-gray-300 transition cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 style={{ color: COLORS.dark }} className="text-lg font-bold">
                      {kid.name}
                    </h3>
                    {kid.age && (
                      <p style={{ color: "#666" }} className="text-sm">
                        Age {kid.age}
                        {kid.grade && ` • Grade ${kid.grade}`}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteKid(kid.id);
                    }}
                    style={{ color: "#ff6b6b" }}
                    className="text-sm font-medium hover:opacity-70"
                  >
                    Delete
                  </button>
                </div>

                <p style={{ color: "#666" }} className="text-sm">
                  {activities.filter((a) => a.child_name === kid.name).length} activities logged
                </p>
              </Link>
            ))}
          </div>

          {kids.length === 0 && (
            <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-8 text-center border border-gray-200">
              <p style={{ color: "#666" }} className="mb-4">
                No children yet. Add your first child to get started.
              </p>
              <button
                onClick={() => setShowAddKid(true)}
                style={{ backgroundColor: COLORS.primary }}
                className="px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90"
              >
                Add Child
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Kid Modal */}
      {showAddKid && (
        <div style={{ backgroundColor: "rgba(0,0,0,0.7)" }} className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-8 max-w-md w-full">
            <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-6">
              Add Child
            </h2>

            <div className="space-y-4 mb-6">
              <input
                type="text"
                placeholder="Child's name"
                value={newKidName}
                onChange={(e) => setNewKidName(e.target.value)}
                style={{ color: "#1a1a2e" }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Age (optional)"
                value={newKidAge}
                onChange={(e) => setNewKidAge(e.target.value)}
                style={{ color: "#1a1a2e" }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Grade (optional)"
                value={newKidGrade}
                onChange={(e) => setNewKidGrade(e.target.value)}
                style={{ color: "#1a1a2e" }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddKid}
                style={{ backgroundColor: COLORS.primary }}
                className="flex-1 px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddKid(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
