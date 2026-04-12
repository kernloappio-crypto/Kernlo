"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getTrialStatus, formatTrialMessage, type TrialStatus } from "@/lib/trial-checker";

interface Kid {
  id: string;
  name: string;
  age?: number;
  grade?: string;
}

interface Subject {
  id: string;
  date: string;
  subject: string;
  platform: string;
  topics: string;
  duration: string;
}

interface Report {
  id: string;
  child_name: string;
  report_type: "daily" | "weekly";
  generated_date: string;
  subjects: Subject[];
  report_content: string;
  notes?: string;
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

interface Goal {
  id: string;
  child_name: string;
  subject: string;
  monthly_hours: number;
}

export default function DashboardHomePage() {
  const [email, setEmail] = useState("");
  const [kids, setKids] = useState<Kid[]>([]);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [allGoals, setAllGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showAddKid, setShowAddKid] = useState(false);
  const [newKidName, setNewKidName] = useState("");
  const [newKidAge, setNewKidAge] = useState("");
  const [newKidGrade, setNewKidGrade] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const userEmail = localStorage.getItem("user_email");

    if (!token || !userEmail) {
      router.push("/auth/login");
      return;
    }

    setEmail(userEmail);

    // Check trial status
    const status = getTrialStatus(userEmail);
    setTrialStatus(status);

    // If trial expired and not paid, show upgrade modal
    if (status.trial_expired && !status.is_paid) {
      setShowUpgradeModal(true);
    }

    loadData(userEmail);
  }, [router]);

  function loadData(userEmail: string) {
    const allKidsData = JSON.parse(localStorage.getItem("kids") || "{}");
    const userKids = (allKidsData[userEmail] || []) as Kid[];
    setKids(userKids);

    const allReportsData = JSON.parse(localStorage.getItem("reports") || "{}");
    const userReports = (allReportsData[userEmail] || []) as Report[];
    setAllReports(userReports);

    const allGoalsData = JSON.parse(localStorage.getItem("goals") || "{}");
    const userGoals = (allGoalsData[userEmail] || []) as Goal[];
    setAllGoals(userGoals);

    setLoading(false);
  }

  function handleAddKid() {
    if (!newKidName) return;

    // Check kid limit (5 kids per account for MVP)
    const MAX_KIDS = 5;
    if (kids.length >= MAX_KIDS) {
      alert(`You've reached the limit of ${MAX_KIDS} children per account. Upgrade to Team plan for more children (coming soon).`);
      return;
    }

    const newKid: Kid = {
      id: Math.random().toString(36).substr(2, 9),
      name: newKidName,
      age: newKidAge ? parseInt(newKidAge) : undefined,
      grade: newKidGrade || undefined,
    };

    const allKidsData = JSON.parse(localStorage.getItem("kids") || "{}");
    if (!allKidsData[email]) allKidsData[email] = [];
    allKidsData[email].push(newKid);
    localStorage.setItem("kids", JSON.stringify(allKidsData));

    setKids([...kids, newKid]);
    setNewKidName("");
    setNewKidAge("");
    setNewKidGrade("");
    setShowAddKid(false);
  }

  function handleLogout() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_email");
    router.push("/");
  }

  if (loading) {
    return (
      <main style={{ backgroundColor: COLORS.light, minHeight: "100vh" }}>
        <div className="flex items-center justify-center min-h-screen">
          <div style={{ color: COLORS.primary }}>Loading...</div>
        </div>
      </main>
    );
  }

  // Calculate stats across all kids
  const totalHours = allReports.reduce(
    (sum, report) =>
      sum +
      report.subjects.reduce(
        (subSum, subject) => subSum + (parseInt(subject.duration) || 0) / 60,
        0
      ),
    0
  );

  const uniqueSubjects = new Set(allReports.flatMap(r => r.subjects.map(s => s.subject))).size;

  // Get stats per kid
  function getKidStats(kidName: string) {
    const kidReports = allReports.filter(r => r.child_name === kidName);
    const hours = kidReports.reduce(
      (sum, report) =>
        sum +
        report.subjects.reduce(
          (subSum, subject) => subSum + (parseInt(subject.duration) || 0) / 60,
          0
        ),
      0
    );

    const subjects = [...new Set(kidReports.flatMap(r => r.subjects.map(s => s.subject)))];
    const topSubjects = subjects.slice(0, 2).join(", ");

    return { hours, subjects: subjects.length, topSubjects };
  }



  return (
    <main style={{ backgroundColor: COLORS.light, minHeight: "100vh" }} className="flex">
      {/* Left Sidebar */}
      <div style={{ backgroundColor: "white", borderRight: `1px solid #e5e7eb` }} className="w-64 min-h-screen p-6 flex flex-col">
        <div className="mb-8">
          <h2 style={{ color: COLORS.primary }} className="text-2xl font-bold">
            kernlo
          </h2>
        </div>

        <nav className="space-y-2 mb-8">
          <Link
            href="/dashboard"
            style={{ backgroundColor: COLORS.primary, color: "white" }}
            className="block px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            🏠 Home
          </Link>
          <Link
            href="/generator"
            style={{ color: COLORS.dark }}
            className="block px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
          >
            📝 New Report
          </Link>
        </nav>

        <div className="mb-8">
          <p style={{ color: COLORS.primary }} className="text-xs font-semibold uppercase tracking-wide mb-3">
            Kids
          </p>
          <div className="space-y-2">
            {kids.length === 0 ? (
              <p style={{ color: "#999" }} className="text-xs">
                No kids yet.
              </p>
            ) : (
              kids.map((kid) => (
                <Link
                  key={kid.id}
                  href={`/dashboard/${kid.id}`}
                  style={{ color: COLORS.dark }}
                  className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
                >
                  {kid.name}
                </Link>
              ))
            )}
          </div>

          <button
            onClick={() => setShowAddKid(true)}
            disabled={kids.length >= 5}
            style={{
              color: kids.length >= 5 ? "#ccc" : COLORS.primary,
              borderColor: kids.length >= 5 ? "#ccc" : COLORS.primary,
            }}
            className="w-full mt-3 px-3 py-2 border rounded-lg text-sm font-medium hover:bg-blue-50 transition disabled:cursor-not-allowed"
          >
            + Add Kid {kids.length >= 5 && `(${kids.length}/5)`}
          </button>
          {kids.length >= 5 && (
            <p style={{ color: "#ff6b6b" }} className="text-xs mt-2 text-center">
              Max 5 kids per account. Team plan coming soon.
            </p>
          )}
        </div>

        <div className="mt-auto pt-6 border-t border-gray-200">
          <p style={{ color: "#999" }} className="text-xs mb-4">
            {email}
          </p>
          <button
            onClick={handleLogout}
            style={{ color: COLORS.primary, borderColor: COLORS.primary }}
            className="w-full px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <nav style={{ backgroundColor: "white", borderBottom: `1px solid #e5e7eb` }} className="sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between w-full">
            <h1 style={{ color: COLORS.dark }} className="text-2xl font-bold">
              Dashboard
            </h1>
          </div>
        </nav>

        <div className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto px-6 py-8">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 border border-gray-200">
                <p style={{ color: "#666" }} className="text-sm font-medium mb-2">
                  Total Hours
                </p>
                <p className="text-4xl font-bold" style={{ color: COLORS.primary }}>
                  {totalHours.toFixed(1)}h
                </p>
              </div>

              <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 border border-gray-200">
                <p style={{ color: "#666" }} className="text-sm font-medium mb-2">
                  Subjects Tracked
                </p>
                <p className="text-4xl font-bold" style={{ color: COLORS.secondary }}>
                  {uniqueSubjects}
                </p>
              </div>

              <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 border border-gray-200">
                <p style={{ color: "#666" }} className="text-sm font-medium mb-2">
                  Kids
                </p>
                <p className="text-4xl font-bold" style={{ color: COLORS.accent1 }}>
                  {kids.length}
                </p>
              </div>
            </div>

            {/* Goals Progress */}
            <div className="mb-8">
              <h2 style={{ color: COLORS.dark }} className="text-xl font-bold mb-4">
                Monthly Goals Progress
              </h2>
              {allGoals.length === 0 ? (
                <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 border border-gray-200 text-center">
                  <p style={{ color: "#999" }}>No goals set yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  {allGoals.map((goal) => {
                    const goalReports = allReports.filter(r => r.child_name === goal.child_name);
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
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p style={{ color: COLORS.dark }} className="font-semibold">
                              {goal.child_name}
                            </p>
                            <p style={{ color: "#666" }} className="text-sm">
                              {goal.subject}
                            </p>
                          </div>
                          <p
                            style={{
                              backgroundColor: isOnTrack ? "#d4edda" : "#fff3cd",
                              color: isOnTrack ? "#155724" : "#856404",
                            }}
                            className="px-2 py-1 rounded text-xs font-bold"
                          >
                            {percentage}%
                          </p>
                        </div>
                        <p style={{ color: "#666" }} className="text-xs mb-3">
                          {hoursLogged.toFixed(1)}h / {goal.monthly_hours}h
                        </p>
                        <div style={{ backgroundColor: COLORS.light }} className="h-2 rounded-full overflow-hidden">
                          <div
                            style={{
                              backgroundColor: isOnTrack ? COLORS.accent3 : COLORS.accent2,
                              width: `${Math.min(percentage, 100)}%`,
                            }}
                            className="h-full transition-all"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Weekly Summary */}
            <div className="mb-8">
              <h2 style={{ color: COLORS.dark }} className="text-xl font-bold mb-4">
                This Week's Activity
              </h2>
              {kids.length === 0 ? (
                <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 border border-gray-200 text-center">
                  <p style={{ color: "#999" }}>No kids yet.</p>
                </div>
              ) : (
                <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 border border-gray-200">
                  <div className="space-y-4">
                    {kids.map((kid) => {
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      const weekReports = allReports.filter(
                        r =>
                          r.child_name === kid.name &&
                          new Date(r.generated_date) >= weekAgo
                      );
                      const weekHours = weekReports.reduce(
                        (sum, report) =>
                          sum +
                          report.subjects.reduce(
                            (subSum, subject) => subSum + (parseInt(subject.duration) || 0) / 60,
                            0
                          ),
                        0
                      );
                      const maxHours = 20; // Scale for visualization

                      return (
                        <div key={kid.id} className="flex items-center gap-4">
                          <div style={{ minWidth: "100px" }}>
                            <p style={{ color: COLORS.dark }} className="font-semibold text-sm">
                              {kid.name}
                            </p>
                            <p style={{ color: "#666" }} className="text-xs">
                              {weekHours.toFixed(1)}h
                            </p>
                          </div>
                          <div className="flex-1">
                            <div style={{ backgroundColor: COLORS.light }} className="h-6 rounded-full overflow-hidden">
                              <div
                                style={{
                                  backgroundColor: COLORS.primary,
                                  width: `${Math.min((weekHours / maxHours) * 100, 100)}%`,
                                }}
                                className="h-full transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Kid Cards */}
            <div className="mb-8">
              <h2 style={{ color: COLORS.dark }} className="text-xl font-bold mb-4">
                Kids
              </h2>
              {kids.length === 0 ? (
                <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-12 border border-gray-200 text-center">
                  <p style={{ color: "#999" }} className="mb-4">
                    No kids yet. Add one to get started.
                  </p>
                  <button
                    onClick={() => setShowAddKid(true)}
                    style={{ backgroundColor: COLORS.primary }}
                    className="px-6 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90"
                  >
                    + Add Kid
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  {kids.map((kid) => {
                    const stats = getKidStats(kid.name);
                    return (
                      <Link
                        key={kid.id}
                        href={`/dashboard/${kid.id}`}
                        style={{ backgroundColor: "white", borderRadius: "12px" }}
                        className="p-6 border border-gray-200 hover:shadow-lg transition cursor-pointer"
                      >
                        <h3 style={{ color: COLORS.dark }} className="text-lg font-bold mb-2">
                          {kid.name}
                        </h3>
                        {kid.age && <p style={{ color: "#666" }} className="text-sm mb-1">Age: {kid.age}</p>}
                        {kid.grade && <p style={{ color: "#666" }} className="text-sm mb-4">Grade: {kid.grade}</p>}
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span style={{ color: "#666" }} className="text-sm">
                              Hours
                            </span>
                            <span style={{ color: COLORS.primary }} className="font-bold">
                              {stats.hours.toFixed(1)}h
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ color: "#666" }} className="text-sm">
                              Subjects
                            </span>
                            <span style={{ color: COLORS.secondary }} className="font-bold">
                              {stats.subjects}
                            </span>
                          </div>
                          {stats.topSubjects && (
                            <div className="flex justify-between">
                              <span style={{ color: "#666" }} className="text-sm">
                                Top
                              </span>
                              <span style={{ color: COLORS.accent3 }} className="text-sm font-medium">
                                {stats.topSubjects}
                              </span>
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>


          </div>
        </div>
      </div>

      {/* Trial Expired Modal */}
      {showUpgradeModal && trialStatus?.trial_expired && !trialStatus.is_paid && (
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
                onClick={() => handleLogout()}
                className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Kid Modal */}
      {showAddKid && (
        <div style={{ backgroundColor: "rgba(0,0,0,0.5)" }} className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-8 max-w-md w-full">
            <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-6">
              Add Kid
            </h2>

            <div className="space-y-4 mb-6">
              <input
                type="text"
                placeholder="Kid's name"
                value={newKidName}
                onChange={(e) => setNewKidName(e.target.value)}
                style={{ color: "#1a1a2e" }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="number"
                placeholder="Age (optional)"
                value={newKidAge}
                onChange={(e) => setNewKidAge(e.target.value)}
                style={{ color: "#1a1a2e" }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="text"
                placeholder="Grade (optional)"
                value={newKidGrade}
                onChange={(e) => setNewKidGrade(e.target.value)}
                style={{ color: "#1a1a2e" }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
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
                onClick={() => {
                  setShowAddKid(false);
                  setNewKidName("");
                  setNewKidAge("");
                  setNewKidGrade("");
                }}
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
