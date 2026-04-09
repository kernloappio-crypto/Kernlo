"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [activeChild, setActiveChild] = useState("");
  const [email, setEmail] = useState("");
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [allGoals, setAllGoals] = useState<Goal[]>([]);
  const [kids, setKids] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [state, setState] = useState("CA");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const userEmail = localStorage.getItem("user_email");

    if (!token || !userEmail) {
      router.push("/auth/login");
      return;
    }

    setEmail(userEmail);
    loadData(userEmail);
  }, [router]);

  function loadData(userEmail: string) {
    const allReportsData = JSON.parse(localStorage.getItem("reports") || "{}");
    const userReports = (allReportsData[userEmail] || []) as Report[];
    setAllReports(userReports);

    const allGoalsData = JSON.parse(localStorage.getItem("goals") || "{}");
    const userGoals = (allGoalsData[userEmail] || []) as Goal[];
    setAllGoals(userGoals);

    // Extract unique kids
    const uniqueKids = [...new Set(userReports.map(r => r.child_name))].sort();
    setKids(uniqueKids);
    if (uniqueKids.length > 0) {
      setActiveChild(uniqueKids[0]);
    }

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

  function handleQuickLogSave(childName: string, subject: string, hours: number, notes: string) {
    const newReport: Report = {
      id: Math.random().toString(36).substr(2, 9),
      child_name: childName || "Quick Log",
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

    setAllReports([...allReports, newReport]);
    
    // Add to kids list if new
    if (!kids.includes(newReport.child_name)) {
      setKids([...kids, newReport.child_name].sort());
    }
    
    setShowQuickLog(false);
  }

  function addGoal(childName: string, subject: string, hours: number) {
    const newGoal: Goal = {
      id: Math.random().toString(36).substr(2, 9),
      child_name: childName,
      subject,
      monthly_hours: hours,
    };

    const allGoalsData = JSON.parse(localStorage.getItem("goals") || "{}");
    if (!allGoalsData[email]) allGoalsData[email] = [];
    allGoalsData[email].push(newGoal);
    localStorage.setItem("goals", JSON.stringify(allGoalsData));

    setAllGoals([...allGoals, newGoal]);
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

  // Filter data by active child
  const childReports = allReports.filter(r => r.child_name === activeChild);
  const childGoals = allGoals.filter(g => g.child_name === activeChild);

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
        <div className="mb-8">
          <h2 style={{ color: COLORS.primary }} className="text-2xl font-bold">
            kernlo
          </h2>
        </div>

        <nav className="space-y-2 mb-8">
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
                No kids yet. Create a report to add one.
              </p>
            ) : (
              kids.map((kid) => (
                <button
                  key={kid}
                  onClick={() => setActiveChild(kid)}
                  style={{
                    backgroundColor: activeChild === kid ? COLORS.primary : "transparent",
                    color: activeChild === kid ? "white" : COLORS.dark,
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition hover:opacity-80"
                >
                  {kid}
                </button>
              ))
            )}
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
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between w-full">
            <h1 style={{ color: COLORS.dark }} className="text-2xl font-bold">
              {activeChild || "Dashboard"}
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowQuickLog(true)}
                style={{ backgroundColor: COLORS.primary }}
                className="px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90"
              >
                ⚡ Quick Log
              </button>
            </div>
          </div>
        </nav>

        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">
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
                        <p style={{ color: "#999" }}>No reports for {activeChild} yet.</p>
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
                          addGoal(activeChild, subject, hours);
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
              <div>
                <label style={{ color: "#666" }} className="text-sm font-medium block mb-2">
                  Kid
                </label>
                <select
                  id="quickLogKid"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                  style={{ color: "#1a1a2e" }}
                >
                  <option value={activeChild}>{activeChild}</option>
                  {kids.filter(k => k !== activeChild).map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
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
                  const kidSelect = document.getElementById("quickLogKid") as HTMLSelectElement;
                  const subject = (document.getElementById("quickLogSubject") as HTMLInputElement).value;
                  const hours = parseFloat((document.getElementById("quickLogHours") as HTMLInputElement).value);
                  const notes = (document.getElementById("quickLogNotes") as HTMLTextAreaElement).value;
                  if (subject && hours > 0) {
                    handleQuickLogSave(kidSelect.value, subject, hours, notes);
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
    </main>
  );
}
