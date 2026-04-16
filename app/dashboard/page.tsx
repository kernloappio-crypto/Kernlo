"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import Navbar from "@/components/Navbar";
import { signOut } from "@/lib/supabase-auth";

export const dynamic = "force-dynamic";

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

type TabType = "overview" | "goals" | "compliance" | "reports";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [state, setState] = useState("CA");
  const router = useRouter();

  // Load user and data from Supabase
  useEffect(() => {
    const initUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push("/auth/login");
          return;
        }

        setUserId(user.id);
        setEmail(user.email || "");

        // Load goals from Supabase
        const { data: goalsData } = await supabase
          .from("goals")
          .select("*")
          .eq("user_id", user.id);

        if (goalsData) {
          setGoals(goalsData.map((g: any) => ({
            id: g.id,
            subject: g.subject,
            monthly_hours: g.monthly_hours,
          })));
        }

        // Load state from localStorage
        const savedState = localStorage.getItem(`state_${user.id}`);
        if (savedState) setState(savedState);

        setLoading(false);
      } catch (err) {
        console.error("Error initializing:", err);
        setLoading(false);
      }
    };

    initUser();
  }, [router]);

  async function handleLogout() {
    await signOut();
    router.push("/");
  }

  async function handleQuickLogSave(subject: string, hours: number, notes: string) {
    if (!userId) return;

    try {
      const today = new Date().toISOString().split("T")[0];
      
      const { error } = await supabase
        .from("activities")
        .insert({
          user_id: userId,
          child_name: "Default", // For now, single child
          subject,
          duration: hours,
          platform: "Quick Log",
          date: today,
          notes,
        });

      if (error) {
        alert("Error saving activity: " + error.message);
        return;
      }

      alert("Activity logged successfully!");
      setShowQuickLog(false);
      
      // Reload data
      const { data: reportsData } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", userId);

      if (reportsData) {
        // Convert to report format for display
        setReports(reportsData.map((a: any) => ({
          id: a.id,
          child_name: a.child_name,
          report_type: "daily",
          generated_date: a.date,
          subjects: [{
            id: a.id,
            date: a.date,
            subject: a.subject,
            platform: a.platform,
            topics: a.notes || "",
            duration: a.duration.toString(),
          }],
          report_content: "",
          notes: a.notes,
        })));
      }
    } catch (err) {
      console.error("Error saving quick log:", err);
      alert("Failed to save activity");
    }
  }

  async function addGoal(subject: string, monthlyHours: number) {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from("goals")
        .insert({
          user_id: userId,
          child_name: "Default",
          subject,
          monthly_hours: monthlyHours,
        });

      if (error) {
        alert("Error adding goal: " + error.message);
        return;
      }

      // Reload goals
      const { data: goalsData } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", userId);

      if (goalsData) {
        setGoals(goalsData.map((g: any) => ({
          id: g.id,
          subject: g.subject,
          monthly_hours: g.monthly_hours,
        })));
      }

      alert("Goal added!");
    } catch (err) {
      console.error("Error adding goal:", err);
      alert("Failed to add goal");
    }
  }

  async function deleteGoal(goalId: string) {
    try {
      const { error } = await supabase
        .from("goals")
        .delete()
        .eq("id", goalId);

      if (error) {
        alert("Error deleting goal: " + error.message);
        return;
      }

      setGoals(goals.filter((g) => g.id !== goalId));
    } catch (err) {
      console.error("Error deleting goal:", err);
    }
  }

  async function saveState(newState: string) {
    setState(newState);
    localStorage.setItem(`state_${userId}`, newState);
  }

  const compliances = [
    {
      state: "CA",
      hours: 175,
      details: "California requires 175 instructional days or hours per school year",
    },
    {
      state: "TX",
      hours: 0,
      details: "Texas requires bona fide curriculum with reading, math, science, social studies",
    },
    {
      state: "FL",
      hours: 1000,
      details: "Florida requires 1000 instructional hours per school year",
    },
    {
      state: "NY",
      hours: 900,
      details: "New York requires 900 instructional hours per school year",
    },
  ];

  const selectedCompliance = compliances.find((c) => c.state === state);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main style={{ backgroundColor: COLORS.light, minHeight: "100vh" }}>
        {/* Header */}
        <div style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb" }} className="p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 style={{ color: COLORS.dark }} className="text-3xl font-bold">
                Dashboard
              </h1>
              <p style={{ color: "#666" }} className="text-sm">
                Welcome, {email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              style={{ color: COLORS.primary, borderColor: COLORS.primary }}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb" }} className="p-6">
          <div className="max-w-7xl mx-auto flex gap-6">
            {(["overview", "goals", "compliance", "reports"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  borderBottom: activeTab === tab ? `3px solid ${COLORS.primary}` : "none",
                  color: activeTab === tab ? COLORS.primary : "#666",
                }}
                className="pb-2 font-medium capitalize transition hover:text-black"
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto p-6">
          {activeTab === "overview" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold">
                  Quick Log
                </h2>
                <button
                  onClick={() => setShowQuickLog(!showQuickLog)}
                  style={{ backgroundColor: COLORS.primary }}
                  className="px-6 py-2 text-white rounded-lg hover:opacity-90 font-medium"
                >
                  {showQuickLog ? "Cancel" : "Log Activity"}
                </button>
              </div>

              {showQuickLog && (
                <QuickLogForm onSave={handleQuickLogSave} colors={COLORS} />
              )}

              <div className="mt-8">
                <h3 style={{ color: COLORS.dark }} className="text-lg font-bold mb-4">
                  Recent Activities
                </h3>
                {reports.length === 0 ? (
                  <p style={{ color: "#999" }}>No activities logged yet</p>
                ) : (
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div key={report.id} style={{ backgroundColor: "white", borderLeft: `4px solid ${COLORS.primary}` }} className="p-4 rounded">
                        <p style={{ color: COLORS.dark }} className="font-semibold">
                          {report.subjects[0]?.subject}
                        </p>
                        <p style={{ color: "#666" }} className="text-sm">
                          {report.subjects[0]?.duration} hours • {report.generated_date}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "goals" && (
            <div>
              <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-6">
                Goals
              </h2>
              <GoalsForm onAddGoal={addGoal} colors={COLORS} />
              <div className="mt-8">
                <h3 style={{ color: COLORS.dark }} className="text-lg font-bold mb-4">
                  Your Goals
                </h3>
                {goals.length === 0 ? (
                  <p style={{ color: "#999" }}>No goals set yet</p>
                ) : (
                  <div className="space-y-3">
                    {goals.map((goal) => (
                      <div key={goal.id} style={{ backgroundColor: "white" }} className="p-4 rounded flex items-center justify-between">
                        <div>
                          <p style={{ color: COLORS.dark }} className="font-semibold">
                            {goal.subject}
                          </p>
                          <p style={{ color: "#666" }} className="text-sm">
                            {goal.monthly_hours} hours/month
                          </p>
                        </div>
                        <button
                          onClick={() => deleteGoal(goal.id)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "compliance" && (
            <div>
              <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-6">
                Compliance Tracker
              </h2>
              <div className="mb-6">
                <label style={{ color: COLORS.dark }} className="block font-semibold mb-2">
                  Select Your State
                </label>
                <select
                  value={state}
                  onChange={(e) => saveState(e.target.value)}
                  style={{ borderColor: COLORS.primary }}
                  className="w-full p-3 border rounded-lg"
                >
                  {compliances.map((c) => (
                    <option key={c.state} value={c.state}>
                      {c.state}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCompliance && (
                <div style={{ backgroundColor: "white", borderLeft: `4px solid ${COLORS.primary}` }} className="p-6 rounded">
                  <h3 style={{ color: COLORS.dark }} className="text-lg font-bold mb-2">
                    {selectedCompliance.state} Requirements
                  </h3>
                  <p style={{ color: "#666" }} className="mb-4">
                    {selectedCompliance.details}
                  </p>
                  {selectedCompliance.hours > 0 && (
                    <p style={{ color: COLORS.accent3 }} className="font-semibold">
                      Minimum: {selectedCompliance.hours} hours/year
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "reports" && (
            <div>
              <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-6">
                Generate Report
              </h2>
              <ReportGenerator colors={COLORS} userId={userId} />
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function QuickLogForm({ onSave, colors }: { onSave: (subject: string, hours: number, notes: string) => void; colors: typeof COLORS }) {
  const [subject, setSubject] = useState("");
  const [hours, setHours] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    if (!subject || !hours) {
      alert("Please fill in subject and hours");
      return;
    }
    onSave(subject, parseFloat(hours), notes);
    setSubject("");
    setHours("");
    setNotes("");
  };

  return (
    <div style={{ backgroundColor: "white", borderLeft: `4px solid ${colors.primary}` }} className="p-6 rounded mb-6">
      <div className="space-y-4">
        <div>
          <label style={{ color: colors.dark }} className="block font-semibold mb-2">
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Math, Science, English, etc."
            style={{ borderColor: colors.primary }}
            className="w-full p-3 border rounded-lg"
          />
        </div>
        <div>
          <label style={{ color: colors.dark }} className="block font-semibold mb-2">
            Hours
          </label>
          <input
            type="number"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="1.5"
            step="0.5"
            style={{ borderColor: colors.primary }}
            className="w-full p-3 border rounded-lg"
          />
        </div>
        <div>
          <label style={{ color: colors.dark }} className="block font-semibold mb-2">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Details about the lesson..."
            style={{ borderColor: colors.primary }}
            className="w-full p-3 border rounded-lg"
            rows={3}
          />
        </div>
        <button
          onClick={handleSubmit}
          style={{ backgroundColor: colors.primary }}
          className="w-full py-3 text-white font-semibold rounded-lg hover:opacity-90"
        >
          Save Activity
        </button>
      </div>
    </div>
  );
}

function GoalsForm({ onAddGoal, colors }: { onAddGoal: (subject: string, hours: number) => void; colors: typeof COLORS }) {
  const [subject, setSubject] = useState("");
  const [hours, setHours] = useState("");

  const handleSubmit = () => {
    if (!subject || !hours) {
      alert("Please fill in subject and hours");
      return;
    }
    onAddGoal(subject, parseFloat(hours));
    setSubject("");
    setHours("");
  };

  return (
    <div style={{ backgroundColor: "white", borderLeft: `4px solid ${colors.primary}` }} className="p-6 rounded mb-6">
      <div className="space-y-4">
        <div>
          <label style={{ color: colors.dark }} className="block font-semibold mb-2">
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Math, Science, etc."
            style={{ borderColor: colors.primary }}
            className="w-full p-3 border rounded-lg"
          />
        </div>
        <div>
          <label style={{ color: colors.dark }} className="block font-semibold mb-2">
            Monthly Hours Goal
          </label>
          <input
            type="number"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="20"
            step="1"
            style={{ borderColor: colors.primary }}
            className="w-full p-3 border rounded-lg"
          />
        </div>
        <button
          onClick={handleSubmit}
          style={{ backgroundColor: colors.primary }}
          className="w-full py-3 text-white font-semibold rounded-lg hover:opacity-90"
        >
          Add Goal
        </button>
      </div>
    </div>
  );
}

function ReportGenerator({ colors, userId }: { colors: typeof COLORS; userId: string }) {
  const [childName, setChildName] = useState("");
  const [reportType, setReportType] = useState<"daily" | "weekly">("daily");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [generating, setGenerating] = useState(false);

  const subjects = ["Math", "English", "Science", "History", "Social Studies", "Arts", "Physical Education", "Other"];

  const handleGenerateReport = async () => {
    if (!childName || selectedSubjects.length === 0) {
      alert("Please fill in child name and select subjects");
      return;
    }

    setGenerating(true);

    try {
      const today = new Date().toISOString().split("T")[0];
      const reportContent = `Generated ${reportType} report for ${childName} covering: ${selectedSubjects.join(", ")}. ${notes}`;

      const { error } = await supabase
        .from("reports")
        .insert({
          user_id: userId,
          child_name: childName,
          report_type: reportType,
          generated_date: today,
          subjects: selectedSubjects,
          report_content: reportContent,
        });

      if (error) {
        alert("Error saving report: " + error.message);
        return;
      }

      // Generate PDF
      downloadReportAsPDF(childName, reportType, selectedSubjects, reportContent);

      alert("Report generated and saved!");
      setChildName("");
      setSelectedSubjects([]);
      setNotes("");
    } catch (err) {
      console.error("Error:", err);
      alert("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  const downloadReportAsPDF = (childName: string, type: string, subjects: string[], content: string) => {
    const today = new Date().toLocaleDateString();
    const pdfContent = `
${childName}'s ${type.toUpperCase()} REPORT
Generated: ${today}

Subjects: ${subjects.join(", ")}

${content}
    `;

    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(pdfContent));
    element.setAttribute("download", `${childName}-report-${today}.txt`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div style={{ backgroundColor: "white", borderLeft: `4px solid ${colors.primary}` }} className="p-6 rounded mb-6">
      <div className="space-y-4">
        <div>
          <label style={{ color: colors.dark }} className="block font-semibold mb-2">
            Child Name
          </label>
          <input
            type="text"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder="Enter child's name"
            style={{ borderColor: colors.primary }}
            className="w-full p-3 border rounded-lg"
          />
        </div>

        <div>
          <label style={{ color: colors.dark }} className="block font-semibold mb-2">
            Report Type
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as "daily" | "weekly")}
            style={{ borderColor: colors.primary }}
            className="w-full p-3 border rounded-lg"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>

        <div>
          <label style={{ color: colors.dark }} className="block font-semibold mb-2">
            Subjects (select all that apply)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {subjects.map((subject) => (
              <label key={subject} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedSubjects.includes(subject)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedSubjects([...selectedSubjects, subject]);
                    } else {
                      setSelectedSubjects(selectedSubjects.filter((s) => s !== subject));
                    }
                  }}
                  className="mr-2"
                />
                <span style={{ color: "#666" }} className="text-sm">
                  {subject}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label style={{ color: colors.dark }} className="block font-semibold mb-2">
            Additional Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional details..."
            style={{ borderColor: colors.primary }}
            className="w-full p-3 border rounded-lg"
            rows={3}
          />
        </div>

        <button
          onClick={handleGenerateReport}
          disabled={generating}
          style={{ backgroundColor: generating ? "#ccc" : colors.primary }}
          className="w-full py-3 text-white font-semibold rounded-lg hover:opacity-90"
        >
          {generating ? "Generating..." : "Generate & Download Report"}
        </button>
      </div>
    </div>
  );
}
