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

const COMPLIANCE_STATES = [
  { state: "CA", hours: 175 },
  { state: "TX", hours: 0 },
  { state: "FL", hours: 1000 },
  { state: "NY", hours: 900 },
];

export default function DashboardPage() {
  const [userId, setUserId] = useState("");
  const [kids, setKids] = useState<Kid[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const router = useRouter();

  useEffect(() => {
    let unsubscribe: any;
    let sessionChecked = false;

    // Use auth state listener for reliable mobile support
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, !!session);

        if (session?.user) {
          // User is authenticated
          const user = session.user;
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

          // Load all goals
          const { data: goalsData } = await supabase
            .from("goals")
            .select("*")
            .eq("user_id", user.id);

          if (goalsData) {
            setGoals(goalsData);
          }

          // Initialize date range (last 30 days)
          const today = new Date();
          const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          setReportEndDate(today.toISOString().split("T")[0]);
          setReportStartDate(thirtyDaysAgo.toISOString().split("T")[0]);

          setLoading(false);
        } else if (sessionChecked) {
          // No session and we've already checked once - redirect to login
          console.log("No session, redirecting to login");
          router.push("/auth/login");
        }

        sessionChecked = true;
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
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

    // Prepare activity summary for AI
    const activitySummary = filteredActivities
      .map((a) => `${a.date}: ${a.subject} (${a.duration}h via ${a.platform})${a.notes ? ` - ${a.notes}` : ""}`)
      .join("\n");

    const prompt = `Generate a professional, comprehensive homeschool progress report for ${reportKid.name} covering the period from ${reportStartDate} to ${reportEndDate}.

Subjects covered: ${selectedSubjects.join(", ")}
Total activities logged: ${filteredActivities.length}
Total hours: ${filteredActivities.reduce((sum, a) => sum + a.duration, 0).toFixed(1)}

Activity log:
${activitySummary}

Create a narrative-style report that:
1. Opens with a summary of learning progress
2. Details accomplishments in each subject
3. Highlights engagement and effort
4. Notes any challenges or areas for growth
5. Concludes with recommendations for continued learning

Format as professional homeschool compliance documentation.`;

    try {
      const response = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          studentName: reportKid.name,
          startDate: reportStartDate,
          endDate: reportEndDate,
        }),
      });

      if (!response.ok) throw new Error("Report generation failed");
      const data = await response.json();

      // Generate PDF using jsPDF
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginLeft = 15;
      const marginRight = 15;
      const marginTop = 15;
      let yPosition = marginTop;

      // Title
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("COMPREHENSIVE PROGRESS REPORT", marginLeft, yPosition);
      yPosition += 10;

      // Student info
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Student: ${reportKid.name}`, marginLeft, yPosition);
      yPosition += 6;
      doc.text(`Period: ${reportStartDate} to ${reportEndDate}`, marginLeft, yPosition);
      yPosition += 6;
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, marginLeft, yPosition);
      yPosition += 12;

      // Narrative (with text wrapping)
      doc.setFontSize(10);
      const narrativeLines = (doc.splitTextToSize(data.narrative, pageWidth - marginLeft - marginRight)) as string[];
      narrativeLines.forEach((line) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = marginTop;
        }
        doc.text(line, marginLeft, yPosition);
        yPosition += 5;
      });

      yPosition += 8;

      // Activity Summary
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = marginTop;
      }
      doc.text("ACTIVITY SUMMARY", marginLeft, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Subjects: ${selectedSubjects.join(", ")}`, marginLeft, yPosition);
      yPosition += 6;
      doc.text(`Total Activities: ${filteredActivities.length}`, marginLeft, yPosition);
      yPosition += 6;
      doc.text(`Total Hours: ${filteredActivities.reduce((sum, a) => sum + a.duration, 0).toFixed(1)}`, marginLeft, yPosition);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Save report to Supabase (without PDF data for now - just text content)
      try {
        const { data: insertData, error: insertError } = await supabase
          .from("reports")
          .insert([
            {
              user_id: user?.id,
              child_name: reportKid.name,
              report_type: "comprehensive",
              generated_date: new Date().toISOString(),
              subjects: selectedSubjects.join(","),
              report_content: data.narrative,
              start_date: reportStartDate,
              end_date: reportEndDate,
              notes: `Report for ${reportStartDate} to ${reportEndDate}`,
            },
          ]);

        if (insertError) console.error("Error saving report:", insertError);
      } catch (err) {
        console.error("Failed to save report to DB:", err);
      }

      // Download PDF
      doc.save(`${reportKid.name}-report-${reportStartDate}-${reportEndDate}.pdf`);

      setShowReportGen(false);
    } catch (err) {
      console.error("Error generating report:", err);
      alert("Failed to generate report. Please try again.");
    }
  }

  async function handleLogout() {
    await signOut();
    router.push("/");
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Helper functions for kid stats
  const getKidStats = (kidName: string) => {
    const kidActivities = activities.filter((a) => a.child_name === kidName);
    const kidGoals = goals.filter((g) => g.child_name === kidName);
    const totalHours = kidActivities.reduce((sum, a) => sum + a.duration, 0);
    const subjects = new Set(kidActivities.map((a) => a.subject)).size;
    return { activities: kidActivities.length, hours: totalHours, subjects, goals: kidGoals };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Navbar />
      
      {/* Header with Quick Log and Report */}
      <div style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }} className="h-16">
        <div className="h-full px-8 py-4 flex items-center justify-between">
          <div>
            <h1 style={{ color: "#1a1a2e" }} className="text-2xl font-bold">
              Parent Dashboard
            </h1>
            <p style={{ color: "#333" }} className="text-sm">
              Manage all your kids' homeschool progress
            </p>
          </div>
          <div className="flex gap-3">
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
              className="px-6 py-2 text-white rounded-lg hover:opacity-90 font-medium text-sm"
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
              className="px-6 py-2 text-white rounded-lg hover:opacity-90 font-medium text-sm"
            >
              📄 Report
            </button>
          </div>
        </div>
      </div>

      <main style={{ backgroundColor: COLORS.light, flex: 1, display: "flex", overflow: "hidden" }} className="flex">
        {/* Mobile Menu Button - Hide on 1024px+ (lg) */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden absolute top-20 left-4 z-40 p-2"
          style={{ backgroundColor: COLORS.primary, color: "white", borderRadius: "8px" }}
        >
          ☰
        </button>

        {/* Left Sidebar - Kids Navigation */}
        <div
          style={{ 
            backgroundColor: "white", 
            borderRight: `1px solid #e5e7eb`,
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s ease'
          }}
          className="fixed lg:static w-64 h-full p-6 flex flex-col overflow-hidden z-30"
        >
          {/* Kids Section */}
          <div className="mb-8 flex-1 overflow-y-auto">
            <h2 style={{ color: "#1a1a2e" }} className="text-lg font-bold mb-4">
              Your Kids
            </h2>
            <div className="space-y-2 mb-4">
              {kids.map((kid) => (
                <Link
                  key={kid.id}
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
                  style={{ color: "#1a1a2e" }}
                  className="w-full px-3 py-2 border rounded mb-2 text-sm"
                />
                <input
                  type="number"
                  value={newKidAge}
                  onChange={(e) => setNewKidAge(e.target.value)}
                  placeholder="Age"
                  style={{ color: "#1a1a2e", borderColor: "#333" }}
                  className="w-full px-3 py-2 border rounded mb-2 text-sm"
                />
                <input
                  type="text"
                  value={newKidGrade}
                  onChange={(e) => setNewKidGrade(e.target.value)}
                  placeholder="Grade"
                  style={{ color: "#1a1a2e" }}
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

          {/* Logout Section */}
          <div className="mt-auto pt-4 border-t">
            <button
              onClick={handleLogout}
              style={{ color: COLORS.primary }}
              className="w-full text-sm font-medium hover:bg-gray-100 px-3 py-2 rounded text-left"
            >
              Logout
            </button>
            <p style={{ color: "#555" }} className="text-xs mt-3">
              {email}
            </p>
          </div>

          {/* Close button for mobile/tablet */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden mt-4 w-full px-3 py-2 text-sm font-medium text-white rounded"
            style={{ backgroundColor: COLORS.primary }}
          >
            Close Menu
          </button>
        </div>

        {/* Mobile/Tablet Overlay */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 lg:hidden z-20"
          />
        )}

        {/* Right Content - Kid Cards */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl">
            {kids.length === 0 ? (
              <p style={{ color: "#555" }}>No kids added yet. Add a kid to get started!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {kids.map((kid) => {
                  const stats = getKidStats(kid.name);
                  const kidGoals = stats.goals;
                  const kidActivities = activities.filter((a) => a.child_name === kid.name);
                  const totalGoalHours = kidGoals.reduce((sum, g) => sum + g.monthly_hours, 0);
                  const loggedHours = kidActivities.reduce((sum, a) => sum + a.duration, 0);
                  const progressPercent = totalGoalHours > 0 ? Math.min(100, (loggedHours / totalGoalHours) * 100) : 0;

                  return (
                    <div key={kid.id} style={{ backgroundColor: "white", borderLeft: `4px solid ${COLORS.primary}` }} className="p-6 rounded-lg shadow-sm">
                      {/* Kid Header */}
                      <h3 style={{ color: "#1a1a2e" }} className="text-xl font-bold mb-4">
                        {kid.name}
                      </h3>

                      {/* Subjects Breakdown */}
                      {kidActivities.length > 0 && (
                        <div className="mb-4 pb-4 border-b border-gray-200">
                          <p style={{ color: "#333" }} className="text-xs font-semibold mb-2">
                            SUBJECTS BY HOURS
                          </p>
                          <div className="space-y-2">
                            {(() => {
                              const subjectHours: { [key: string]: number } = {};
                              kidActivities.forEach((a) => {
                                subjectHours[a.subject] = (subjectHours[a.subject] || 0) + a.duration;
                              });
                              return Object.entries(subjectHours)
                                .sort(([, a], [, b]) => b - a)
                                .map(([subject, hours]) => (
                                  <div key={subject} className="flex justify-between items-center text-xs">
                                    <span style={{ color: "#1a1a2e" }} className="font-medium">
                                      {subject}
                                    </span>
                                    <span style={{ color: COLORS.primary }} className="font-semibold">
                                      {hours.toFixed(1)}h
                                    </span>
                                  </div>
                                ));
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Goals Progress */}
                      <div className="mb-4 pb-4 border-b border-gray-200">
                        <p style={{ color: "#333" }} className="text-xs font-semibold mb-2">
                          MONTHLY GOALS: {kidGoals.length}
                        </p>
                        {kidGoals.length > 0 ? (
                          <div className="space-y-2">
                            {kidGoals.slice(0, 2).map((g) => (
                              <div key={g.id} className="text-xs">
                                <p style={{ color: "#1a1a2e" }} className="font-medium">
                                  {g.subject}: {g.monthly_hours}h
                                </p>
                              </div>
                            ))}
                            {kidGoals.length > 2 && (
                              <p style={{ color: "#555" }} className="text-xs italic">
                                +{kidGoals.length - 2} more
                              </p>
                            )}
                            {totalGoalHours > 0 && (
                              <div className="mt-2">
                                <div style={{ backgroundColor: "#e5e7eb", height: "6px", borderRadius: "3px" }}>
                                  <div
                                    style={{
                                      backgroundColor: COLORS.accent3,
                                      height: "100%",
                                      borderRadius: "3px",
                                      width: `${progressPercent}%`,
                                    }}
                                  />
                                </div>
                                <p style={{ color: "#555" }} className="text-xs mt-1">
                                  {loggedHours.toFixed(1)}h / {totalGoalHours}h
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p style={{ color: "#555" }} className="text-xs">
                            No goals set
                          </p>
                        )}
                      </div>

                      {/* Compliance Quick View */}
                      <div className="mb-4">
                        <p style={{ color: "#333" }} className="text-xs font-semibold mb-2">
                          COMPLIANCE
                        </p>
                        <p style={{ color: COLORS.primary }} className="text-xs">
                          ✅ Tracking enabled
                        </p>
                      </div>

                      {/* View Dashboard Link */}
                      <Link
                        href={`/dashboard/${kid.id}`}
                        style={{ borderColor: COLORS.primary, color: COLORS.primary }}
                        className="block text-center px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm font-medium"
                      >
                        View Full Dashboard
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Quick Log Modal */}
      {showQuickLog && quickLogKid && (
        <div style={{ backgroundColor: "rgba(0,0,0,0.5)" }} className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-8 max-w-md w-full my-8">
            <h2 style={{ color: "#1a1a2e" }} className="text-2xl font-bold mb-6">
              Quick Log - {quickLogKid.name}
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label style={{ color: "#1a1a2e" }} className="block text-sm font-semibold mb-2">
                  Kid
                </label>
                <select
                  value={quickLogKid.id}
                  onChange={(e) => {
                    const kid = kids.find((k) => k.id === e.target.value);
                    if (kid) setQuickLogKid(kid);
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  {kids.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ color: "#1a1a2e" }} className="block text-sm font-semibold mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  style={{ color: "#1a1a2e", borderColor: "#333" }}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label style={{ color: "#1a1a2e" }} className="block text-sm font-semibold mb-2">
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
                <label style={{ color: "#1a1a2e" }} className="block text-sm font-semibold mb-2">
                  Duration (hours)
                </label>
                <input
                  type="number"
                  value={logDuration}
                  onChange={(e) => setLogDuration(e.target.value)}
                  placeholder="1.5"
                  step="0.5"
                  style={{ color: "#1a1a2e", borderColor: "#333" }}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label style={{ color: "#1a1a2e" }} className="block text-sm font-semibold mb-2">
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
                <label style={{ color: "#1a1a2e" }} className="block text-sm font-semibold mb-2">
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
                style={{ color: "#1a1a2e", borderColor: "#333" }}
                className="flex-1 px-4 py-2 border font-semibold rounded-lg hover:bg-gray-50"
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
            <h2 style={{ color: "#1a1a2e" }} className="text-2xl font-bold mb-6">
              Generate Report
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label style={{ color: "#1a1a2e" }} className="block text-sm font-semibold mb-2">
                  Kid
                </label>
                <select
                  value={reportKid.id}
                  onChange={(e) => {
                    const kid = kids.find((k) => k.id === e.target.value);
                    if (kid) setReportKid(kid);
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  {kids.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name}
                    </option>
                  ))}
                </select>
              </div>

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
                <label style={{ color: "#1a1a2e" }} className="block text-sm font-semibold mb-3">
                  Subjects
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {Array.from(new Set(activities.filter((a) => a.child_name === reportKid.name).map((a) => a.subject))).length === 0 ? (
                    <p style={{ color: "#555" }} className="text-sm">
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

            <p style={{ color: "#ff6b6b" }} className="text-xs mb-4 p-3 bg-red-50 rounded border border-red-200">
              ⚠️ Report generation takes ~30 seconds. Please click once and wait.
            </p>

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
                style={{ color: "#1a1a2e", borderColor: "#333" }}
                className="flex-1 px-4 py-2 border font-semibold rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
