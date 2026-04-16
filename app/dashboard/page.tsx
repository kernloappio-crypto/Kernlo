"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import Navbar from "@/components/Navbar";
import { signOut } from "@/lib/supabase-auth";

export const dynamic = "force-dynamic";

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

export default function DashboardPage() {
  const [userId, setUserId] = useState("");
  const [kids, setKids] = useState<Kid[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  
  // Quick Log states
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [quickLogKid, setQuickLogKid] = useState<Kid | null>(null);
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [logSubject, setLogSubject] = useState("");
  const [logDuration, setLogDuration] = useState("");
  const [logPlatform, setLogPlatform] = useState("");
  const [logNotes, setLogNotes] = useState("");

  // Report Generator states
  const [showReportGen, setShowReportGen] = useState(false);
  const [reportKid, setReportKid] = useState<Kid | null>(null);
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  // Add kid states
  const [showAddKid, setShowAddKid] = useState(false);
  const [newKidName, setNewKidName] = useState("");
  const [newKidAge, setNewKidAge] = useState("");
  const [newKidGrade, setNewKidGrade] = useState("");

  const router = useRouter();

  useEffect(() => {
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/auth/login");
        return;
      }

      setUserId(user.id);
      setEmail(user.email || "");
      
      // Load kids
      const { data: kidsData } = await supabase
        .from("kids")
        .select("*")
        .eq("user_id", user.id);

      if (kidsData) {
        setKids(kidsData);
        if (kidsData.length > 0) {
          setQuickLogKid(kidsData[0]);
          setReportKid(kidsData[0]);
        }
      }

      // Load all activities
      const { data: activitiesData } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (activitiesData) {
        setActivities(activitiesData);
      }

      // Initialize date range (last 30 days)
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      setReportEndDate(today.toISOString().split("T")[0]);
      setReportStartDate(thirtyDaysAgo.toISOString().split("T")[0]);

      setLoading(false);
    };
    
    initUser();
  }, [router]);

  async function handleAddKid() {
    if (!newKidName.trim()) {
      alert("Kid name is required");
      return;
    }

    if (kids.length >= 5) {
      alert("Pro tier limited to 5 children");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("kids")
        .insert({
          user_id: userId,
          name: newKidName,
          age: newKidAge ? parseInt(newKidAge) : null,
          grade: newKidGrade || null,
        })
        .select();

      if (error) {
        alert("Error: " + error.message);
        return;
      }

      if (data) {
        setKids([...kids, ...data]);
        if (!quickLogKid) setQuickLogKid(data[0]);
        if (!reportKid) setReportKid(data[0]);
      }

      setNewKidName("");
      setNewKidAge("");
      setNewKidGrade("");
      setShowAddKid(false);
    } catch (err) {
      alert("Failed to add kid");
    }
  }

  async function handleQuickLogSave() {
    if (!logSubject || !logDuration || !quickLogKid) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("activities")
        .insert({
          user_id: userId,
          child_name: quickLogKid.name,
          subject: logSubject,
          duration: parseFloat(logDuration),
          platform: logPlatform || "Other",
          date: logDate,
          notes: logNotes,
        })
        .select();

      if (error) {
        alert("Error: " + error.message);
        return;
      }

      if (data) {
        setActivities([...data, ...activities]);
      }

      alert("Activity logged!");
      setLogSubject("");
      setLogDuration("");
      setLogPlatform("");
      setLogNotes("");
      setLogDate(new Date().toISOString().split("T")[0]);
      setShowQuickLog(false);
    } catch (err) {
      alert("Failed to save activity");
    }
  }

  async function handleGenerateReport() {
    if (!reportKid || selectedSubjects.length === 0) {
      alert("Please select a kid and subjects");
      return;
    }

    const filteredActivities = activities.filter(
      (a) =>
        a.child_name === reportKid.name &&
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

Student: ${reportKid.name}
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
    element.setAttribute("download", `${reportKid.name}-report-${reportStartDate}-${reportEndDate}.txt`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    setShowReportGen(false);
  }

  async function handleLogout() {
    await signOut();
    router.push("/");
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Calculate overall stats
  const totalHours = activities.reduce((sum, a) => sum + a.duration, 0);
  const totalActivities = activities.length;
  const uniqueSubjects = new Set(activities.map((a) => a.subject)).size;
  const recentActivities = activities.slice(0, 10);

  return (
    <>
      <Navbar />
      <main style={{ backgroundColor: COLORS.light, minHeight: "100vh" }} className="flex">
        {/* Left Sidebar - Kids Navigation */}
        <div
          style={{ backgroundColor: "white", borderRight: `1px solid #e5e7eb` }}
          className="w-72 min-h-screen p-6 flex flex-col"
        >
          <div className="mb-8">
            <h2 style={{ color: COLORS.dark }} className="text-lg font-bold mb-4">
              Your Kids
            </h2>
            <div className="space-y-2 mb-4">
              {kids.map((kid) => (
                <div key={kid.id}>
                  <Link
                    href={`/dashboard/${kid.id}`}
                    style={{
                      backgroundColor: COLORS.primary,
                      color: "white",
                    }}
                    className="block w-full px-4 py-3 text-left rounded-lg hover:opacity-90 transition font-medium text-sm"
                  >
                    {kid.name}
                    {kid.age && <span className="text-xs opacity-90 ml-2">({kid.age})</span>}
                  </Link>
                  <div className="flex gap-2 mt-2 pl-2">
                    <button
                      onClick={() => {
                        setQuickLogKid(kid);
                        setShowQuickLog(true);
                      }}
                      style={{ color: COLORS.primary }}
                      className="text-xs font-medium hover:underline"
                    >
                      + Log
                    </button>
                    <button
                      onClick={() => {
                        setReportKid(kid);
                        setShowReportGen(true);
                      }}
                      style={{ color: COLORS.primary }}
                      className="text-xs font-medium hover:underline"
                    >
                      📄 Report
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {kids.length < 5 && (
              <button
                onClick={() => setShowAddKid(!showAddKid)}
                style={{ backgroundColor: COLORS.primary }}
                className="w-full px-4 py-2 text-white rounded-lg hover:opacity-90 font-medium text-sm"
              >
                + Add Kid
              </button>
            )}

            {showAddKid && (
              <div style={{ backgroundColor: "white", borderLeft: `4px solid ${COLORS.primary}` }} className="p-4 rounded mt-4 bg-gray-50">
                <input
                  type="text"
                  value={newKidName}
                  onChange={(e) => setNewKidName(e.target.value)}
                  placeholder="Name"
                  className="w-full px-3 py-2 border rounded mb-2 text-sm"
                />
                <input
                  type="number"
                  value={newKidAge}
                  onChange={(e) => setNewKidAge(e.target.value)}
                  placeholder="Age"
                  className="w-full px-3 py-2 border rounded mb-2 text-sm"
                />
                <input
                  type="text"
                  value={newKidGrade}
                  onChange={(e) => setNewKidGrade(e.target.value)}
                  placeholder="Grade"
                  className="w-full px-3 py-2 border rounded mb-2 text-sm"
                />
                <button
                  onClick={handleAddKid}
                  style={{ backgroundColor: COLORS.primary }}
                  className="w-full px-3 py-2 text-white rounded text-sm"
                >
                  Save
                </button>
              </div>
            )}
          </div>

          <div className="mt-auto pt-4 border-t">
            <button
              onClick={handleLogout}
              style={{ color: COLORS.primary }}
              className="w-full text-sm font-medium hover:bg-gray-100 px-3 py-2 rounded text-left"
            >
              Logout
            </button>
            <p style={{ color: "#999" }} className="text-xs mt-3">
              {email}
            </p>
          </div>
        </div>

        {/* Right Content - Dashboard Overview */}
        <div className="flex-1 p-8">
          <div className="max-w-6xl">
            <div className="mb-8">
              <h1 style={{ color: COLORS.dark }} className="text-3xl font-bold mb-2">
                Parent Dashboard
              </h1>
              <p style={{ color: "#666" }} className="text-sm">
                Welcome back! Here's an overview of all your kids' progress.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 border border-gray-200">
                <p style={{ color: "#666" }} className="text-sm font-medium mb-2">
                  Total Activities
                </p>
                <p className="text-4xl font-bold" style={{ color: COLORS.primary }}>
                  {totalActivities}
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
                  {uniqueSubjects}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-4 mb-8">
              <button
                onClick={() => {
                  if (kids.length === 0) {
                    alert("Please add a kid first");
                    return;
                  }
                  setQuickLogKid(quickLogKid || kids[0]);
                  setShowQuickLog(true);
                }}
                style={{ backgroundColor: COLORS.primary }}
                className="px-6 py-3 text-white rounded-lg hover:opacity-90 font-medium"
              >
                + Quick Log
              </button>
              <button
                onClick={() => {
                  if (kids.length === 0) {
                    alert("Please add a kid first");
                    return;
                  }
                  setReportKid(reportKid || kids[0]);
                  setShowReportGen(true);
                }}
                style={{ backgroundColor: COLORS.secondary }}
                className="px-6 py-3 text-white rounded-lg hover:opacity-90 font-medium"
              >
                📄 Generate Report
              </button>
            </div>

            {/* Recent Activities */}
            <div>
              <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-4">
                Recent Activities
              </h2>
              {recentActivities.length === 0 ? (
                <p style={{ color: "#999" }}>No activities yet. Start logging!</p>
              ) : (
                <div className="space-y-3">
                  {recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      style={{ backgroundColor: "white", borderLeft: `4px solid ${COLORS.primary}` }}
                      className="p-4 rounded"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p style={{ color: COLORS.dark }} className="font-semibold">
                            {activity.child_name} - {activity.subject}
                          </p>
                          <p style={{ color: "#666" }} className="text-sm">
                            {activity.duration} hours • {activity.platform} • {activity.date}
                          </p>
                          {activity.notes && (
                            <p style={{ color: "#999" }} className="text-sm italic mt-1">
                              {activity.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Quick Log Modal */}
      {showQuickLog && quickLogKid && (
        <div style={{ backgroundColor: "rgba(0,0,0,0.5)" }} className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-8 max-w-md w-full my-8">
            <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-6">
              Quick Log - {quickLogKid.name}
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label style={{ color: COLORS.dark }} className="block text-sm font-semibold mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label style={{ color: COLORS.dark }} className="block text-sm font-semibold mb-2">
                  Subject
                </label>
                <select
                  value={logSubject}
                  onChange={(e) => setLogSubject(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">Select subject</option>
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ color: COLORS.dark }} className="block text-sm font-semibold mb-2">
                  Duration (hours)
                </label>
                <input
                  type="number"
                  value={logDuration}
                  onChange={(e) => setLogDuration(e.target.value)}
                  placeholder="1.5"
                  step="0.5"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label style={{ color: COLORS.dark }} className="block text-sm font-semibold mb-2">
                  Platform
                </label>
                <input
                  type="text"
                  value={logPlatform}
                  onChange={(e) => setLogPlatform(e.target.value)}
                  placeholder="Khan Academy, IXL, etc."
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label style={{ color: COLORS.dark }} className="block text-sm font-semibold mb-2">
                  Notes
                </label>
                <textarea
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  placeholder="Lesson details..."
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleQuickLogSave}
                style={{ backgroundColor: COLORS.primary }}
                className="flex-1 px-4 py-2 text-white font-semibold rounded-lg hover:opacity-90"
              >
                Save Activity
              </button>
              <button
                onClick={() => setShowQuickLog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 font-semibold rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Generator Modal */}
      {showReportGen && reportKid && (
        <div style={{ backgroundColor: "rgba(0,0,0,0.5)" }} className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-8 max-w-md w-full my-8">
            <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-6">
              Generate Report - {reportKid.name}
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label style={{ color: COLORS.dark }} className="block text-sm font-semibold mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label style={{ color: COLORS.dark }} className="block text-sm font-semibold mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label style={{ color: COLORS.dark }} className="block text-sm font-semibold mb-3">
                  Subjects
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {Array.from(new Set(activities.filter((a) => a.child_name === reportKid.name).map((a) => a.subject))).length === 0 ? (
                    <p style={{ color: "#999" }} className="text-sm">
                      No subjects found. Log activities first.
                    </p>
                  ) : (
                    Array.from(new Set(activities.filter((a) => a.child_name === reportKid.name).map((a) => a.subject))).map((subject) => (
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
                onClick={handleGenerateReport}
                disabled={selectedSubjects.length === 0}
                style={{
                  backgroundColor: selectedSubjects.length === 0 ? "#ccc" : COLORS.primary,
                }}
                className="flex-1 px-4 py-2 text-white font-semibold rounded-lg hover:opacity-90 disabled:cursor-not-allowed"
              >
                Download Report
              </button>
              <button
                onClick={() => setShowReportGen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 font-semibold rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
