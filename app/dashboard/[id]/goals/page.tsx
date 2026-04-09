"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Kid {
  id: string;
  name: string;
  age?: number;
  grade?: string;
}

interface Report {
  id: string;
  child_name: string;
  report_type: "daily" | "weekly";
  generated_date: string;
  subjects: Array<{
    id: string;
    date: string;
    subject: string;
    platform: string;
    topics: string;
    duration: string;
  }>;
  report_content: string;
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

export default function GoalsPage() {
  const params = useParams();
  const kidId = params?.id as string;
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [kid, setKid] = useState<Kid | null>(null);
  const [childGoals, setChildGoals] = useState<Goal[]>([]);
  const [childReports, setChildReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSubject, setNewSubject] = useState("");
  const [newHours, setNewHours] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const userEmail = localStorage.getItem("user_email");

    if (!token || !userEmail) {
      router.push("/auth/login");
      return;
    }

    setEmail(userEmail);
    loadData(userEmail, kidId);
  }, [kidId, router]);

  function loadData(userEmail: string, id: string) {
    const allKidsData = JSON.parse(localStorage.getItem("kids") || "{}");
    const userKids = (allKidsData[userEmail] || []) as Kid[];
    const foundKid = userKids.find(k => k.id === id);

    if (!foundKid) {
      router.push("/dashboard");
      return;
    }

    setKid(foundKid);

    const allGoalsData = JSON.parse(localStorage.getItem("goals") || "{}");
    const userGoals = (allGoalsData[userEmail] || []) as Goal[];
    const kidGoals = userGoals.filter(g => g.child_name === foundKid.name);
    setChildGoals(kidGoals);

    const allReportsData = JSON.parse(localStorage.getItem("reports") || "{}");
    const userReports = (allReportsData[userEmail] || []) as Report[];
    const kidReports = userReports.filter(r => r.child_name === foundKid.name);
    setChildReports(kidReports);

    setLoading(false);
  }

  function handleAddGoal() {
    if (!kid || !newSubject || !newHours) return;

    const newGoal: Goal = {
      id: Math.random().toString(36).substr(2, 9),
      child_name: kid.name,
      subject: newSubject,
      monthly_hours: parseInt(newHours),
    };

    const allGoalsData = JSON.parse(localStorage.getItem("goals") || "{}");
    if (!allGoalsData[email]) allGoalsData[email] = [];
    allGoalsData[email].push(newGoal);
    localStorage.setItem("goals", JSON.stringify(allGoalsData));

    setChildGoals([...childGoals, newGoal]);
    setNewSubject("");
    setNewHours("");
  }

  function handleDeleteGoal(goalId: string) {
    const allGoalsData = JSON.parse(localStorage.getItem("goals") || "{}");
    allGoalsData[email] = (allGoalsData[email] as Goal[]).filter(g => g.id !== goalId);
    localStorage.setItem("goals", JSON.stringify(allGoalsData));
    setChildGoals(childGoals.filter(g => g.id !== goalId));
  }

  if (loading || !kid) {
    return (
      <main style={{ backgroundColor: COLORS.light, minHeight: "100vh" }}>
        <div className="flex items-center justify-center min-h-screen">
          <div style={{ color: COLORS.primary }}>Loading...</div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ backgroundColor: COLORS.light, minHeight: "100vh" }}>
      <div style={{ backgroundColor: "white", borderBottom: `1px solid #e5e7eb` }} className="sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href={`/dashboard/${kid.id}`} style={{ color: COLORS.primary }} className="text-sm hover:opacity-70">
            ← Back to {kid.name}
          </Link>
          <h1 style={{ color: COLORS.dark }} className="text-2xl font-bold">
            Learning Goals
          </h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Add Goal */}
        <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 border border-gray-200 mb-8">
          <h2 style={{ color: COLORS.dark }} className="text-lg font-bold mb-4">
            Add New Goal
          </h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Subject (e.g., Math)"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              style={{ color: "#1a1a2e" }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              type="number"
              placeholder="Monthly hours"
              value={newHours}
              onChange={(e) => setNewHours(e.target.value)}
              style={{ color: "#1a1a2e" }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <button
              onClick={handleAddGoal}
              style={{ backgroundColor: COLORS.primary }}
              className="w-full px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90"
            >
              Add Goal
            </button>
          </div>
        </div>

        {/* Goals Grid */}
        {childGoals.length === 0 ? (
          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-12 border border-gray-200 text-center">
            <p style={{ color: "#999" }}>No goals yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {childGoals.map((goal) => {
              const goalReports = childReports.filter(r => r.child_name === goal.child_name);
              const hoursLogged = goalReports.reduce(
                (sum, report) =>
                  sum +
                  report.subjects
                    .filter(s => s.subject === goal.subject)
                    .reduce((subSum, subject) => subSum + (parseInt(subject.duration) || 0) / 60, 0),
                0
              );
              const percentage = Math.round((hoursLogged / goal.monthly_hours) * 100);
              const isOnTrack = percentage >= 80;

              return (
                <div
                  key={goal.id}
                  style={{ backgroundColor: "white", borderRadius: "12px" }}
                  className="p-6 border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 style={{ color: COLORS.dark }} className="text-lg font-bold">
                      {goal.subject}
                    </h3>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      style={{ color: "#ff6b6b" }}
                      className="text-xs font-semibold hover:opacity-70"
                    >
                      ✕ Delete
                    </button>
                  </div>

                  <p style={{ color: "#666" }} className="text-sm mb-4">
                    {hoursLogged.toFixed(1)}h / {goal.monthly_hours}h
                  </p>

                  <div className="mb-4">
                    <div style={{ backgroundColor: COLORS.light }} className="h-3 rounded-full overflow-hidden">
                      <div
                        style={{
                          backgroundColor: isOnTrack ? COLORS.accent3 : COLORS.accent2,
                          width: `${Math.min(percentage, 100)}%`,
                        }}
                        className="h-full transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <p style={{ color: "#666" }} className="text-xs">
                      {percentage}% complete
                    </p>
                    <p
                      style={{
                        backgroundColor: isOnTrack ? "#d4edda" : "#fff3cd",
                        color: isOnTrack ? "#155724" : "#856404",
                      }}
                      className="px-2 py-1 rounded text-xs font-bold"
                    >
                      {isOnTrack ? "On Track" : "Behind"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
