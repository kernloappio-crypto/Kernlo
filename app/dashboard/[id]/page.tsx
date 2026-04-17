"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import Navbar from "@/components/Navbar";
import { getActivities, addActivity, deleteActivity, getGoals, getComplianceState } from "@/lib/supabase-data";

export const dynamic = "force-dynamic";

interface Activity {
  id: string;
  child_name: string;
  subject: string;
  duration: number;
  platform: string;
  date: string;
  notes?: string;
}

interface Report {
  id: string;
  child_name: string;
  generated_date: string;
  start_date: string;
  end_date: string;
  pdf_data?: string;
}

interface Kid {
  id: string;
  name: string;
  age?: number;
  grade?: string;
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

const STATE_REQUIREMENTS: { [key: string]: any } = {
  CA: {
    name: "California",
    description: "175 instructional days OR equivalent hours per school year",
    totalHours: 900,
    subjects: {
      Math: 240,
      English: 240,
      Science: 120,
      History: 120,
      "Physical Education": 120,
    },
  },
  TX: {
    name: "Texas",
    description: "Bona fide curriculum requirement (NO hour minimums)",
    totalHours: 0,
    subjects: {
      "Reading/Language Arts": 0,
      Mathematics: 0,
      Science: 0,
      "Social Studies": 0,
    },
  },
  FL: {
    name: "Florida",
    description: "1,000 instructional hours per school year",
    totalHours: 1000,
    subjects: {
      Math: 180,
      English: 180,
      Science: 90,
      History: 90,
    },
  },
  NY: {
    name: "New York",
    description: "900 instructional hours per school year",
    totalHours: 900,
    subjects: {
      Math: 200,
      English: 200,
      Science: 100,
      History: 100,
      "Physical Education": 90,
    },
  },
};

export default function KidDetailPage() {
  const params = useParams();
  const router = useRouter();
  const kidId = params.id as string;

  const [userId, setUserId] = useState("");
  const [kid, setKid] = useState<Kid | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [logSubject, setLogSubject] = useState("");
  const [logDuration, setLogDuration] = useState("");
  const [logPlatform, setLogPlatform] = useState("");
  const [logNotes, setLogNotes] = useState("");
  const [showComprehensiveReport, setShowComprehensiveReport] = useState(false);
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [complianceState, setComplianceState] = useState("CA");

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

        // Load kid data
        const { data: kidData } = await supabase
          .from("kids")
          .select("*")
          .eq("id", kidId)
          .eq("user_id", user.id)
          .single();

        if (kidData) {
          setKid(kidData as Kid);
        }

        // Load activities
        const activitiesData = await getActivities(user.id);
        const kidActivities = activitiesData.filter(
          (a: any) => a.child_name === kidData?.name
        );
        setActivities(kidActivities as Activity[]);

        // Load reports
        const { data: reportsData } = await supabase
          .from("reports")
          .select("*")
          .eq("user_id", user.id)
          .eq("child_name", kidData?.name);
        setReports((reportsData as Report[]) || []);

        // Load goals
        const goalsData = await getGoals(user.id, kidData?.name);
        setGoals(goalsData || []);

        // Load compliance state
        if (kidData?.name) {
          const complianceData = await getComplianceState(user.id, kidData.name);
          if (complianceData?.state) {
            setComplianceState(complianceData.state);
          } else {
            // Default to CA if no state saved yet
            setComplianceState("CA");
          }
        }

        // Initialize date range (last 30 days)
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        setReportEndDate(today.toISOString().split("T")[0]);
        setReportStartDate(thirtyDaysAgo.toISOString().split("T")[0]);

        setLoading(false);
      } catch (err) {
        console.error("Error initializing:", err);
        setLoading(false);
      }
    };

    initializeUser();
  }, [kidId, router]);

  async function handleQuickLog() {
    if (!logSubject || !logDuration || !logPlatform) {
      alert("Subject, duration, and platform are required");
      return;
    }

    try {
      await addActivity(
        userId,
        kid!.name,
        logSubject,
        parseFloat(logDuration),
        logPlatform,
        logDate,
        logNotes || undefined
      );

      // Reload activities
      const activitiesData = await getActivities(userId);
      const kidActivities = activitiesData.filter((a: any) => a.child_name === kid!.name);
      setActivities(kidActivities as Activity[]);

      // Reset form
      setLogDate(new Date().toISOString().split("T")[0]);
      setLogSubject("");
      setLogDuration("");
      setLogPlatform("");
      setLogNotes("");
      setShowQuickLog(false);
    } catch (err) {
      console.error("Error logging activity:", err);
      alert("Failed to log activity");
    }
  }

  async function handleDeleteActivity(activityId: string) {
    if (!confirm("Delete this activity?")) return;

    try {
      await deleteActivity(activityId);
      setActivities(activities.filter((a) => a.id !== activityId));
    } catch (err) {
      console.error("Error deleting activity:", err);
      alert("Failed to delete activity");
    }
  }

  const handleGenerateComprehensiveReport = () => {
    if (!kid || selectedSubjects.length === 0 || !activities.length) {
      alert("Need activities and selected subjects to generate report");
      return;
    }

    const filteredActivities = activities.filter(
      (a) =>
        new Date(a.date) >= new Date(reportStartDate) &&
        new Date(a.date) <= new Date(reportEndDate) &&
        selectedSubjects.includes(a.subject)
    );

    if (!filteredActivities.length) {
      alert("No activities found for selected criteria");
      return;
    }

    const reportContent = `
=====================================
  COMPREHENSIVE REPORT
=====================================

Student: ${kid.name}
Period: ${reportStartDate} to ${reportEndDate}
Generated: ${new Date().toLocaleDateString()}

SUBJECTS COVERED:
${selectedSubjects.map((s) => `  • ${s}`).join("\n")}

DETAILED ACTIVITIES:
${filteredActivities
  .map(
    (a) => `
  ${a.date} - ${a.subject}
    Duration: ${a.duration} hours
    Platform: ${a.platform}
    ${a.notes ? `Notes: ${a.notes}` : ""}
`
  )
  .join("\n")}

SUMMARY:
  Total Activities: ${filteredActivities.length}
  Total Hours: ${filteredActivities.reduce((sum, a) => sum + a.duration, 0).toFixed(1)}

=====================================
    `;

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(reportContent)
    );
    element.setAttribute("download", `${kid.name}-report-${reportStartDate}-${reportEndDate}.txt`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    setShowComprehensiveReport(false);
  };

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
      {/* Header with Buttons */}
      <div style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb" }} className="sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <Link href="/dashboard" style={{ color: COLORS.primary }} className="text-sm font-medium mb-2 block">
              ← Back to Dashboard
            </Link>
            <h1 style={{ color: COLORS.dark }} className="text-2xl font-bold">
              {kid.name}
            </h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowQuickLog(!showQuickLog)}
              style={{ backgroundColor: COLORS.primary }}
              className="px-6 py-2 text-white font-medium rounded-lg hover:opacity-90 text-sm"
            >
              {showQuickLog ? "Cancel" : "+ Log Activity"}
            </button>
            <button
              onClick={() => setShowComprehensiveReport(!showComprehensiveReport)}
              style={{ backgroundColor: COLORS.secondary }}
              className="px-6 py-2 text-white font-medium rounded-lg hover:opacity-90 text-sm"
            >
              {showComprehensiveReport ? "Cancel" : "📄 Report"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Navigation Links */}
        <div className="flex gap-3">
          <Link
            href={`/dashboard/${kid.id}/goals`}
            style={{ borderColor: COLORS.primary, color: COLORS.primary }}
            className="px-6 py-3 font-medium rounded-lg border hover:bg-gray-50"
          >
            Goals
          </Link>
          <Link
            href={`/dashboard/${kid.id}/compliance`}
            style={{ borderColor: COLORS.primary, color: COLORS.primary }}
            className="px-6 py-3 font-medium rounded-lg border hover:bg-gray-50"
          >
            Compliance
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Subjects & Compliance Card */}
          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ color: COLORS.dark }} className="text-lg font-bold">
                Subject Progress ({complianceState})
              </h3>
              <Link
                href={`/dashboard/${kid.id}/compliance`}
                style={{ color: COLORS.primary }}
                className="text-xs font-medium hover:underline"
              >
                View All →
              </Link>
            </div>
            
            <div className="space-y-3">
              {STATE_REQUIREMENTS[complianceState]?.totalHours > 0 ? (
                (() => {
                  const stateReqs = STATE_REQUIREMENTS[complianceState];
                  const subjects = Object.keys(stateReqs.subjects).slice(0, 4); // Show top 4
                  
                  return subjects.map((subject) => {
                    const subjectActivities = activities.filter((a) => a.subject === subject);
                    const hours = subjectActivities.reduce((sum, a) => sum + a.duration, 0);
                    const required = stateReqs.subjects[subject] || 0;
                    const percentage = required > 0 ? Math.min(100, (hours / required) * 100) : 0;
                    const met = hours >= required;

                    return (
                      <div key={subject}>
                        <div className="flex items-center justify-between mb-1">
                          <span style={{ color: COLORS.dark }} className="text-sm font-medium">
                            {subject}
                          </span>
                          <span style={{ color: met ? COLORS.accent3 : "#999" }} className="text-xs font-bold">
                            {hours}h / {required}h
                          </span>
                        </div>
                        <div style={{ backgroundColor: "#e5e7eb", height: "6px", borderRadius: "3px" }}>
                          <div
                            style={{
                              backgroundColor: met ? COLORS.accent3 : COLORS.primary,
                              height: "100%",
                              borderRadius: "3px",
                              width: `${percentage}%`,
                              transition: "width 0.3s ease",
                            }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()
              ) : (
                <p style={{ color: "#555" }} className="text-xs italic">
                  {complianceState} is curriculum-based (no specific hour requirements). Continue logging activities to demonstrate a comprehensive program.
                </p>
              )}
            </div>
          </div>

          {/* Goals Card */}
          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 border border-gray-200">
            <h3 style={{ color: COLORS.dark }} className="text-lg font-bold mb-4">
              Monthly Goals
            </h3>
            {goals.length === 0 ? (
              <p style={{ color: "#555" }} className="text-sm mb-4">
                No goals set
              </p>
            ) : (
              <div className="space-y-3 mb-4">
                {goals.slice(0, 3).map((g) => (
                  <div key={g.id} className="flex justify-between items-center">
                    <span style={{ color: COLORS.dark }} className="text-sm font-medium">
                      {g.subject}
                    </span>
                    <span style={{ color: COLORS.primary }} className="text-sm font-bold">
                      {g.monthly_hours}h
                    </span>
                  </div>
                ))}
                {goals.length > 3 && (
                  <p style={{ color: "#555" }} className="text-xs italic">
                    +{goals.length - 3} more
                  </p>
                )}
              </div>
            )}
            <Link
              href={`/dashboard/${kid.id}/goals`}
              style={{ color: COLORS.primary }}
              className="text-xs font-medium hover:underline block"
            >
              Manage Goals →
            </Link>
          </div>
        </div>

        {/* Quick Log Form */}
        {showQuickLog && (
          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 border border-gray-200">
            <h2 style={{ color: COLORS.dark }} className="text-lg font-bold mb-4">
              Log Activity
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label style={{ color: "#333" }} className="text-sm font-medium block mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  style={{ color: "#1a1a2e" }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label style={{ color: "#333" }} className="text-sm font-medium block mb-2">
                  Subject
                </label>
                <select
                  value={logSubject}
                  onChange={(e) => setLogSubject(e.target.value)}
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
                <label style={{ color: "#333" }} className="text-sm font-medium block mb-2">
                  Duration (hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="1.5"
                  value={logDuration}
                  onChange={(e) => setLogDuration(e.target.value)}
                  style={{ color: "#1a1a2e" }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label style={{ color: "#333" }} className="text-sm font-medium block mb-2">
                  Platform
                </label>
                <input
                  type="text"
                  placeholder="Khan Academy, IXL, Outschool..."
                  value={logPlatform}
                  onChange={(e) => setLogPlatform(e.target.value)}
                  style={{ color: "#1a1a2e" }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label style={{ color: "#333" }} className="text-sm font-medium block mb-2">
                  Notes (optional)
                </label>
                <textarea
                  placeholder="What did they learn?"
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  style={{ color: "#1a1a2e" }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>

            <button
              onClick={handleQuickLog}
              style={{ backgroundColor: COLORS.primary }}
              className="w-full px-4 py-2 text-white font-medium rounded-lg hover:opacity-90"
            >
              Log Activity
            </button>
          </div>
        )}

        {/* Activities List */}
        <div>
          <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-4">
            Activity Log
          </h2>

          {activities.length === 0 ? (
            <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-8 text-center border border-gray-200">
              <p style={{ color: "#333" }}>No activities logged yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  style={{ backgroundColor: "white", borderBottom: `1px solid #e5e7eb` }}
                  className="p-3 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex-1 flex items-center gap-4">
                    <span style={{ color: "#555" }} className="text-xs w-24 flex-shrink-0">
                      {new Date(activity.date).toLocaleDateString()}
                    </span>
                    <span style={{ backgroundColor: COLORS.light, color: COLORS.primary }} className="px-2 py-1 rounded text-xs font-medium flex-shrink-0">
                      {activity.subject}
                    </span>
                    <span style={{ color: "#333" }} className="text-sm">
                      {activity.duration}h
                    </span>
                    <span style={{ color: "#555" }} className="text-xs">
                      {activity.platform}
                    </span>
                    {activity.notes && (
                      <span style={{ color: "#333" }} className="text-xs italic truncate">
                        {activity.notes}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteActivity(activity.id)}
                    style={{ color: "#ff6b6b" }}
                    className="text-xs font-medium hover:opacity-70 flex-shrink-0 ml-2"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Generated Reports Section */}
        <div className="mt-8">
          <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-4">
            Generated Reports
          </h2>

          {reports.length === 0 ? (
            <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-8 text-center border border-gray-200">
              <p style={{ color: "#333" }}>No reports generated yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {reports
                .sort((a, b) => new Date(b.generated_date).getTime() - new Date(a.generated_date).getTime())
                .map((report) => (
                  <div
                    key={report.id}
                    style={{ backgroundColor: "white", borderBottom: `1px solid #e5e7eb` }}
                    className="p-3 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="flex-1 flex items-center gap-4">
                      <span style={{ color: "#555" }} className="text-xs w-24 flex-shrink-0">
                        {new Date(report.generated_date).toLocaleDateString()}
                      </span>
                      <span style={{ backgroundColor: COLORS.light, color: COLORS.secondary }} className="px-2 py-1 rounded text-xs font-medium flex-shrink-0">
                        Report
                      </span>
                      <span style={{ color: "#333" }} className="text-sm">
                        {report.start_date} to {report.end_date}
                      </span>
                      {report.subjects && (
                        <span style={{ color: "#555" }} className="text-xs">
                          {report.subjects.split(",").length} subjects
                        </span>
                      )}
                    </div>
                    <a
                      href={`/api/download-report/${report.id}`}
                      download={`${kid?.name}-report-${report.start_date}-${report.end_date}.pdf`}
                      style={{ color: COLORS.primary }}
                      className="text-xs font-medium hover:opacity-70 flex-shrink-0 ml-2"
                    >
                      Download
                    </a>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Comprehensive Report Modal */}
      {showComprehensiveReport && kid && (
        <div style={{ backgroundColor: "rgba(0,0,0,0.5)" }} className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-8 max-w-md w-full my-8">
            <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-6">
              📄 Comprehensive Report
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label style={{ color: "#1a1a2e" }} className="block text-sm font-semibold mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                  style={{ color: "#1a1a2e", borderColor: "#333" }}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label style={{ color: "#1a1a2e" }} className="block text-sm font-semibold mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                  style={{ color: "#1a1a2e", borderColor: "#333" }}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label style={{ color: COLORS.dark }} className="block text-sm font-semibold mb-3">
                  Subjects
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {Array.from(new Set(activities.map((a) => a.subject))).length === 0 ? (
                    <p style={{ color: "#555" }} className="text-sm">
                      No subjects found. Log activities first.
                    </p>
                  ) : (
                    Array.from(new Set(activities.map((a) => a.subject))).map((subject) => (
                      <label key={subject} className="flex items-center gap-2 cursor-pointer">
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
                          className="w-4 h-4"
                        />
                        <span style={{ color: "#1a1a2e" }} className="text-sm">
                          {subject}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleGenerateComprehensiveReport}
                disabled={selectedSubjects.length === 0}
                style={{
                  backgroundColor: selectedSubjects.length === 0 ? "#ccc" : COLORS.primary,
                }}
                className="flex-1 px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:cursor-not-allowed"
              >
                Download Report
              </button>
              <button
                onClick={() => setShowComprehensiveReport(false)}
                style={{ color: "#1a1a2e", borderColor: "#333" }}
                className="flex-1 px-4 py-2 border text-sm font-medium rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
    </>
  );
}
