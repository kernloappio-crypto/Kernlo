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

type TabType = "overview" | "goals" | "compliance";

export default function KidDashboardPage() {
  const params = useParams();
  const kidId = params?.id as string;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [email, setEmail] = useState("");
  const [kid, setKid] = useState<Kid | null>(null);
  const [childReports, setChildReports] = useState<Report[]>([]);
  const [childGoals, setChildGoals] = useState<Goal[]>([]);
  const [allKids, setAllKids] = useState<Kid[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [showEditKid, setShowEditKid] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAge, setEditAge] = useState("");
  const [editGrade, setEditGrade] = useState("");
  const [state, setState] = useState("CA");

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
    setAllKids(userKids);

    const foundKid = userKids.find(k => k.id === id);
    if (!foundKid) {
      router.push("/dashboard");
      return;
    }

    setKid(foundKid);
    setEditName(foundKid.name);
    setEditAge(foundKid.age?.toString() || "");
    setEditGrade(foundKid.grade || "");

    const allReportsData = JSON.parse(localStorage.getItem("reports") || "{}");
    const userReports = (allReportsData[userEmail] || []) as Report[];
    const kidReports = userReports.filter(r => r.child_name === foundKid.name);
    setChildReports(kidReports);

    const allGoalsData = JSON.parse(localStorage.getItem("goals") || "{}");
    const userGoals = (allGoalsData[userEmail] || []) as Goal[];
    const kidGoals = userGoals.filter(g => g.child_name === foundKid.name);
    setChildGoals(kidGoals);

    const savedState = localStorage.getItem("state");
    if (savedState) setState(savedState);

    setLoading(false);
  }

  function handleLogout() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_email");
    router.push("/");
  }

  function handleEditKid() {
    if (!kid || !editName) return;

    const allKidsData = JSON.parse(localStorage.getItem("kids") || "{}");
    const userKids = allKidsData[email] as Kid[];
    const kidIndex = userKids.findIndex(k => k.id === kid.id);

    userKids[kidIndex] = {
      ...kid,
      name: editName,
      age: editAge ? parseInt(editAge) : undefined,
      grade: editGrade || undefined,
    };

    allKidsData[email] = userKids;
    localStorage.setItem("kids", JSON.stringify(allKidsData));

    // Update all reports with new name if changed
    if (editName !== kid.name) {
      const allReportsData = JSON.parse(localStorage.getItem("reports") || "{}");
      const userReports = allReportsData[email] as Report[];
      userReports.forEach(r => {
        if (r.child_name === kid.name) r.child_name = editName;
      });
      allReportsData[email] = userReports;
      localStorage.setItem("reports", JSON.stringify(allReportsData));

      // Update all goals with new name
      const allGoalsData = JSON.parse(localStorage.getItem("goals") || "{}");
      const userGoals = allGoalsData[email] as Goal[];
      userGoals.forEach(g => {
        if (g.child_name === kid.name) g.child_name = editName;
      });
      allGoalsData[email] = userGoals;
      localStorage.setItem("goals", JSON.stringify(allGoalsData));
    }

    setKid(userKids[kidIndex]);
    setShowEditKid(false);
  }

  function handleDeleteKid() {
    if (!kid) return;

    const allKidsData = JSON.parse(localStorage.getItem("kids") || "{}");
    allKidsData[email] = (allKidsData[email] as Kid[]).filter(k => k.id !== kid.id);
    localStorage.setItem("kids", JSON.stringify(allKidsData));

    // Delete all reports for this kid
    const allReportsData = JSON.parse(localStorage.getItem("reports") || "{}");
    allReportsData[email] = (allReportsData[email] as Report[]).filter(r => r.child_name !== kid.name);
    localStorage.setItem("reports", JSON.stringify(allReportsData));

    // Delete all goals for this kid
    const allGoalsData = JSON.parse(localStorage.getItem("goals") || "{}");
    allGoalsData[email] = (allGoalsData[email] as Goal[]).filter(g => g.child_name !== kid.name);
    localStorage.setItem("goals", JSON.stringify(allGoalsData));

    router.push("/dashboard");
  }

  function handleQuickLogSave(subject: string, hours: number, notes: string) {
    if (!kid) return;

    const newReport: Report = {
      id: Math.random().toString(36).substr(2, 9),
      child_name: kid.name,
      report_type: "daily",
      generated_date: new Date().toISOString().split("T")[0],
      subjects: [{
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString().split("T")[0],
        subject,
        platform: "Quick Log",
        topics: notes,
        duration: (hours * 60).toString(),
      }],
      report_content: `Quick logged ${hours} hours on ${subject}.`,
    };

    const allReportsData = JSON.parse(localStorage.getItem("reports") || "{}");
    if (!allReportsData[email]) allReportsData[email] = [];
    allReportsData[email].push(newReport);
    localStorage.setItem("reports", JSON.stringify(allReportsData));

    setChildReports([...childReports, newReport]);
    setShowQuickLog(false);
  }

  function addGoal(subject: string, hours: number) {
    if (!kid) return;

    const newGoal: Goal = {
      id: Math.random().toString(36).substr(2, 9),
      child_name: kid.name,
      subject,
      monthly_hours: hours,
    };

    const allGoalsData = JSON.parse(localStorage.getItem("goals") || "{}");
    if (!allGoalsData[email]) allGoalsData[email] = [];
    allGoalsData[email].push(newGoal);
    localStorage.setItem("goals", JSON.stringify(allGoalsData));

    setChildGoals([...childGoals, newGoal]);
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

  const totalReports = childReports.length;
  const totalHours = childReports.reduce(
    (sum, report) =>
      sum +
      report.subjects.reduce(
        (subSum, subject) => subSum + (parseInt(subject.duration) || 0) / 60,
        0
      ),
    0
  );

  const STATE_REQUIREMENTS: { [key: string]: { [subject: string]: number } } = {
    CA: { Math: 180, "Language Arts": 180, Science: 180, History: 180 },
    TX: { Math: 180, "Language Arts": 180, Science: 90, History: 90 },
    FL: { Math: 180, "Language Arts": 180, Science: 90, History: 90 },
    NY: { Math: 120, "Language Arts": 120, Science: 120, History: 120 },
  };

  const requirements = STATE_REQUIREMENTS[state] || {};

  return (
    <main style={{ backgroundColor: COLORS.light, minHeight: "100vh" }} className="flex">
      {/* Left Sidebar */}
      <div style={{ backgroundColor: "white", borderRight: `1px solid #e5e7eb` }} className="w-64 min-h-screen p-6 flex flex-col">
        <Link href="/dashboard" style={{ color: COLORS.primary }} className="text-2xl font-bold mb-8">
          kernlo
        </Link>

        <nav className="space-y-2 mb-8">
          <Link
            href="/dashboard"
            style={{ color: COLORS.dark }}
            className="block px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
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
            {allKids.map((k) => (
              <Link
                key={k.id}
                href={`/dashboard/${k.id}`}
                style={{
                  backgroundColor: k.id === kid.id ? COLORS.primary : "transparent",
                  color: k.id === kid.id ? "white" : COLORS.dark,
                }}
                className="block px-3 py-2 rounded-lg text-sm font-medium hover:opacity-80 transition"
              >
                {k.name}
              </Link>
            ))}
          </div>
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
              {kid.name}
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowQuickLog(true)}
                style={{ backgroundColor: COLORS.primary }}
                className="px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90"
              >
                ⚡ Quick Log
              </button>
              <button
                onClick={() => setShowEditKid(true)}
                style={{ borderColor: COLORS.primary, color: COLORS.primary }}
                className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-blue-50"
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{ borderColor: "#ff6b6b", color: "#ff6b6b" }}
                className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-red-50"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        </nav>

        <div className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto px-6 py-8">
            {/* Tab Navigation */}
            <div className="mb-8 border-b border-gray-200 flex gap-8">
              {[
                { id: "overview" as TabType, label: "Overview" },
                { id: "goals" as TabType, label: "Goals" },
                { id: "compliance" as TabType, label: "Compliance" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    color: activeTab === tab.id ? COLORS.primary : "#999",
                    borderBottom: activeTab === tab.id ? `2px solid ${COLORS.primary}` : "none",
                  }}
                  className="pb-4 font-medium text-sm capitalize transition"
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div>
                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 border border-gray-200">
                    <p style={{ color: "#666" }} className="text-sm font-medium mb-2">
                      Total Reports
                    </p>
                    <p className="text-4xl font-bold" style={{ color: COLORS.primary }}>
                      {totalReports}
                    </p>
                  </div>

                  <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 border border-gray-200">
                    <p style={{ color: "#666" }} className="text-sm font-medium mb-2">
                      Total Hours
                    </p>
                    <p className="text-4xl font-bold" style={{ color: COLORS.secondary }}>
                      {totalHours.toFixed(1)}h
                    </p>
                  </div>

                  <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 border border-gray-200">
                    <p style={{ color: "#666" }} className="text-sm font-medium mb-2">
                      Subjects
                    </p>
                    <p className="text-4xl font-bold" style={{ color: COLORS.accent1 }}>
                      {new Set(childReports.flatMap(r => r.subjects.map(s => s.subject))).size}
                    </p>
                  </div>
                </div>

                <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="border border-gray-200 overflow-hidden">
                  <div style={{ backgroundColor: "#f9fafb" }} className="px-6 py-4 border-b border-gray-200">
                    <h3 style={{ color: COLORS.dark }} className="font-semibold">
                      Recent Reports
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {childReports.length === 0 ? (
                      <div className="p-6 text-center">
                        <p style={{ color: "#999" }}>No reports yet.</p>
                      </div>
                    ) : (
                      childReports.slice(0, 10).map((report) => (
                        <div key={report.id} className="px-6 py-4 hover:bg-gray-50">
                          <p style={{ color: COLORS.dark }} className="font-semibold">
                            {report.subjects.map(s => s.subject).join(", ")}
                          </p>
                          <p style={{ color: "#666" }} className="text-sm">
                            {new Date(report.generated_date).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Goals Tab */}
            {activeTab === "goals" && (
              <div>
                <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-6">
                  Monthly Learning Goals
                </h2>

                <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 border border-gray-200 mb-8">
                  <h3 style={{ color: COLORS.dark }} className="font-semibold mb-4">
                    Add Goal
                  </h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Subject (e.g., Math)"
                      id="goalSubject"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      style={{ color: "#1a1a2e" }}
                    />
                    <input
                      type="number"
                      placeholder="Monthly hours"
                      id="goalHours"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      style={{ color: "#1a1a2e" }}
                    />
                    <button
                      onClick={() => {
                        const subject = (document.getElementById("goalSubject") as HTMLInputElement).value;
                        const hours = parseInt((document.getElementById("goalHours") as HTMLInputElement).value);
                        if (subject && hours > 0) {
                          addGoal(subject, hours);
                          (document.getElementById("goalSubject") as HTMLInputElement).value = "";
                          (document.getElementById("goalHours") as HTMLInputElement).value = "";
                        }
                      }}
                      style={{ backgroundColor: COLORS.primary }}
                      className="w-full px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90"
                    >
                      Add Goal
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {childGoals.map((goal) => (
                    <div
                      key={goal.id}
                      style={{ backgroundColor: "white", borderRadius: "12px" }}
                      className="p-6 border border-gray-200"
                    >
                      <h4 style={{ color: COLORS.dark }} className="font-semibold mb-2">
                        {goal.subject}
                      </h4>
                      <p style={{ color: "#666" }} className="text-sm mb-4">
                        Target: {goal.monthly_hours} hours
                      </p>
                      <div style={{ backgroundColor: COLORS.light }} className="h-2 rounded-full overflow-hidden">
                        <div style={{ backgroundColor: COLORS.primary, width: "45%" }} className="h-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compliance Tab */}
            {activeTab === "compliance" && (
              <div>
                <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-6">
                  Compliance Tracking
                </h2>

                <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 border border-gray-200 mb-8">
                  <label style={{ color: COLORS.dark }} className="font-semibold block mb-3">
                    Select State
                  </label>
                  <select
                    value={state}
                    onChange={(e) => {
                      setState(e.target.value);
                      localStorage.setItem("state", e.target.value);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                    style={{ color: "#1a1a2e" }}
                  >
                    {Object.keys(STATE_REQUIREMENTS).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

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
                      <div style={{ backgroundColor: COLORS.light }} className="h-2 rounded-full overflow-hidden">
                        <div style={{ backgroundColor: "#ff6b6b", width: "30%" }} className="h-full" />
                      </div>
                      <p style={{ color: "#666" }} className="text-xs mt-2">
                        30% complete
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Log Modal */}
      {showQuickLog && (
        <div style={{ backgroundColor: "rgba(0,0,0,0.5)" }} className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-8 max-w-md w-full">
            <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-6">
              ⚡ Quick Log
            </h2>

            <div className="space-y-4 mb-6">
              <input
                type="text"
                placeholder="Subject"
                id="quickLogSubject"
                style={{ color: "#1a1a2e" }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="number"
                placeholder="Hours"
                id="quickLogHours"
                step="0.5"
                style={{ color: "#1a1a2e" }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <textarea
                placeholder="Notes (optional)"
                id="quickLogNotes"
                style={{ color: "#1a1a2e" }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  const subject = (document.getElementById("quickLogSubject") as HTMLInputElement).value;
                  const hours = parseFloat((document.getElementById("quickLogHours") as HTMLInputElement).value);
                  const notes = (document.getElementById("quickLogNotes") as HTMLTextAreaElement).value;
                  if (subject && hours > 0) {
                    handleQuickLogSave(subject, hours, notes);
                  }
                }}
                style={{ backgroundColor: COLORS.primary }}
                className="flex-1 px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90"
              >
                Save
              </button>
              <button
                onClick={() => setShowQuickLog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Kid Modal */}
      {showEditKid && (
        <div style={{ backgroundColor: "rgba(0,0,0,0.5)" }} className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-8 max-w-md w-full">
            <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-6">
              Edit {kid.name}
            </h2>

            <div className="space-y-4 mb-6">
              <input
                type="text"
                placeholder="Kid's name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={{ color: "#1a1a2e" }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="number"
                placeholder="Age"
                value={editAge}
                onChange={(e) => setEditAge(e.target.value)}
                style={{ color: "#1a1a2e" }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="text"
                placeholder="Grade"
                value={editGrade}
                onChange={(e) => setEditGrade(e.target.value)}
                style={{ color: "#1a1a2e" }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleEditKid}
                style={{ backgroundColor: COLORS.primary }}
                className="flex-1 px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90"
              >
                Save
              </button>
              <button
                onClick={() => setShowEditKid(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{ backgroundColor: "rgba(0,0,0,0.5)" }} className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-8 max-w-md w-full">
            <h2 style={{ color: "#ff6b6b" }} className="text-2xl font-bold mb-4">
              Delete {kid.name}?
            </h2>
            <p style={{ color: "#666" }} className="mb-6">
              This will permanently delete {kid.name} and all their reports and goals. This cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleDeleteKid}
                style={{ backgroundColor: "#ff6b6b" }}
                className="flex-1 px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
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
