"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import Navbar from "@/components/Navbar";
import { signOut } from "@/lib/supabase-auth";
import { getAttendanceDaysMonthly } from "@/lib/supabase-data";

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
  curriculum?: string;
  activity_type?: string;
}

interface Goal {
  id: string;
  child_name: string;
  subject: string;
  monthly_hours: number;
}

interface ParentProfile {
  id?: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
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
  const [attendanceMonthlyByKid, setAttendanceMonthlyByKid] = useState<{ [kidName: string]: number }>({});
  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null);

  // Quick Log states
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [quickLogKid, setQuickLogKid] = useState<Kid | null>(null);
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [logSubject, setLogSubject] = useState("");
  const [logDuration, setLogDuration] = useState("");
  const [logPlatform, setLogPlatform] = useState("");
  const [logNotes, setLogNotes] = useState("");
  const [logCurriculum, setLogCurriculum] = useState("");
  const [logActivityType, setLogActivityType] = useState("Core Subject");

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

  // Attendance Log states
  const [showAttendanceLog, setShowAttendanceLog] = useState(false);
  const [selectedKidsForAttendance, setSelectedKidsForAttendance] = useState<string[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);

  const router = useRouter();

  useEffect(() => {
    const initUser = async () => {
      try {
        console.log("📱 Dashboard loading...");
        
        let user = null;
        let accessToken = null;
        let fullSession = null;
        
        // Source of truth: Check for full session first, fall back to tokens
        if (typeof window !== 'undefined') {
          // Try to load full session first
          const sessionStr = localStorage.getItem('kernlo_session');
          if (sessionStr) {
            try {
              fullSession = JSON.parse(sessionStr);
              accessToken = fullSession.access_token;
              user = fullSession.user;
              console.log(`✅ Full session found in localStorage`);
            } catch (e) {
              console.log(`⚠️ Could not parse stored session`);
              fullSession = null;
            }
          }
          
          // Fallback: Use JWT token if no full session
          if (!fullSession && !accessToken) {
            accessToken = localStorage.getItem('kernlo_access_token');
            if (accessToken) {
              console.log(`🔑 JWT access token found (no session)`);
              
              // Decode JWT to extract user info
              try {
                const parts = accessToken.split('.');
                if (parts.length === 3) {
                  const decoded = JSON.parse(atob(parts[1]));
                  
                  // Check if token is expired
                  const now = Math.floor(Date.now() / 1000);
                  if (decoded.exp && decoded.exp < now) {
                    console.log(`⚠️ Token expired`);
                    accessToken = null;
                  } else {
                    user = {
                      id: decoded.sub,
                      email: decoded.email,
                    };
                    console.log(`✅ User from JWT: ${user.id}`);
                  }
                }
              } catch (e) {
                console.log(`⚠️ Failed to decode token`);
                accessToken = null;
              }
            }
          }
        }
        
        if (!user || !accessToken) {
          console.log("❌ Not authenticated");
          console.log("→ Redirecting to login");
          await new Promise(resolve => setTimeout(resolve, 1000));
          router.push("/auth/login");
          return;
        }
        
        // CRITICAL: Restore Supabase auth context
        // This makes auth.uid() return the correct user ID for RLS policies
        try {
          console.log("🔑 Restoring auth context...");
          
          let setSessionData: any = null;
          let setSessionError: any = null;
          
          if (fullSession) {
            // Use the full session object if available
            console.log("📦 Using full session object");
            const result = await supabase.auth.setSession(fullSession);
            setSessionData = result.data;
            setSessionError = result.error;
          } else {
            // Fallback: construct session from tokens
            console.log("🔑 Using tokens to construct session");
            const result = await supabase.auth.setSession({
              access_token: accessToken!,
              refresh_token: localStorage.getItem('kernlo_refresh_token') || '',
            });
            setSessionData = result.data;
            setSessionError = result.error;
          }
          
          if (setSessionError) {
            console.log(`⚠️ setSession error: ${setSessionError.message}`);
          } else if (setSessionData?.session) {
            console.log(`✅ Auth context restored, user: ${setSessionData.session.user?.id}`);
          } else {
            console.log(`⚠️ setSession returned no data`);
          }
          
          // Give Supabase a moment to register the auth context
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (e: any) {
          console.log(`⚠️ Could not restore auth context: ${e?.message}`);
          // Continue anyway - we have the token
        }
        
        setUserId(user.id);
        setEmail(user.email || "");

        try {
          console.log("📚 Loading kids...");
          // Use server-side endpoint for better auth handling
          const kidsResponse = await fetch('/api/kids', {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });

          if (!kidsResponse.ok) {
            const errorData = await kidsResponse.json();
            console.log(`❌ Kids error: ${errorData.error}`);
            throw new Error(errorData.error || 'Kids query failed');
          }

          const { kids: kidsData } = await kidsResponse.json();
          
          console.log(`✅ Kids: ${kidsData?.length || 0}`);
          if (kidsData) {
            setKids(kidsData);
            if (kidsData.length > 0) {
              setQuickLogKid(kidsData[0]);
              setReportKid(kidsData[0]);
            }
          }
        } catch (e: any) {
          console.log(`❌ Kids failed: ${e?.message}`);
          throw e;
        }

        try {
          console.log("📊 Loading activities...");
          // Use server-side endpoint to avoid client-side auth issues
          const activitiesResponse = await fetch('/api/activities', {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });

          if (!activitiesResponse.ok) {
            const errorData = await activitiesResponse.json();
            console.log(`❌ Activities error: ${errorData.error}`);
            console.log(`Code: ${errorData.code || 'unknown'}`);
            console.log(`Details: ${errorData.details || 'none'}`);
            console.log(`Hint: ${errorData.hint || 'none'}`);
            throw new Error(errorData.error || 'Activities query failed');
          }

          const { activities: activitiesData } = await activitiesResponse.json();
          
          console.log(`✅ Activities: ${activitiesData?.length || 0}`);
          if (activitiesData) {
            setActivities(activitiesData);
          }
        } catch (e: any) {
          console.log(`❌ Activities THROW: ${e?.message}`);
          console.log(`Full error: ${JSON.stringify(e)}`);
          throw e;
        }

        try {
          console.log("🎯 Loading goals...");
          // Use server-side endpoint for better auth handling
          const goalsResponse = await fetch('/api/goals', {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });

          if (!goalsResponse.ok) {
            const errorData = await goalsResponse.json();
            console.log(`❌ Goals error: ${errorData.error}`);
            throw new Error(errorData.error || 'Goals query failed');
          }

          const { goals: goalsData } = await goalsResponse.json();
          
          console.log(`✅ Goals: ${goalsData?.length || 0}`);
          if (goalsData) {
            setGoals(goalsData);
          }
        } catch (e: any) {
          console.log(`❌ Goals failed: ${e?.message}`);
          throw e;
        }

        // Attendance will be loaded in useEffect after kids are set
        // See the attendance loading section below

        // Load parent profile
        try {
          console.log("👤 Loading parent profile...");
          const { data: profileData, error: profileError } = await supabase
            .from("parent_profiles")
            .select("*")
            .eq("user_id", user.id)
            .single();

          if (profileError && profileError.code !== "PGRST116") {
            console.log(`⚠️ Profile error: ${profileError.message}`);
          } else if (profileData) {
            console.log(`✅ Parent profile loaded: ${profileData.first_name} ${profileData.last_name}`);
            setParentProfile(profileData);
          } else {
            console.log("ℹ️ No profile yet - user can create one");
          }
        } catch (e: any) {
          console.log(`⚠️ Could not load parent profile: ${e?.message}`);
        }

        console.log("⏰ Initializing date range...");
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        setReportEndDate(today.toISOString().split("T")[0]);
        setReportStartDate(thirtyDaysAgo.toISOString().split("T")[0]);

        console.log("🎉 Dashboard ready!");
        setLoading(false);
      } catch (error: any) {
        const errorMsg = error?.message || JSON.stringify(error) || "Unknown error";
        console.log(`❌ CRASH: ${errorMsg}`);
        console.error("Error initializing user:", error);
        console.log("⏳ Redirecting to home in 3s...");
        setTimeout(() => router.push("/"), 3000);
      }
    };

    initUser();
  }, [router]);

  // Load attendance data for all kids
  useEffect(() => {
    if (kids.length === 0 || !userId) return;

    const loadAttendance = async () => {
      try {
        console.log("📅 Loading attendance for all kids...");
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        
        const attendanceMap: { [kidName: string]: number } = {};
        for (const kid of kids) {
          try {
            const monthlyDays = await getAttendanceDaysMonthly(userId, kid.name, currentYear, currentMonth);
            attendanceMap[kid.name] = monthlyDays;
          } catch (e) {
            console.log(`⚠️ Could not load attendance for ${kid.name}`);
            attendanceMap[kid.name] = 0;
          }
        }
        setAttendanceMonthlyByKid(attendanceMap);
        console.log(`✅ Attendance loaded: ${JSON.stringify(attendanceMap)}`);
      } catch (e) {
        console.log(`⚠️ Error loading attendance: ${e}`);
      }
    };

    loadAttendance();
  }, [kids, userId]);


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
          curriculum: logCurriculum || null,
          activity_type: logActivityType,
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
      setLogCurriculum("");
      setLogActivityType("Core Subject");
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
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#f0f7ff" }}>
        <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px", maxWidth: "400px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <h2 style={{ color: "#0066cc", marginBottom: "16px" }}>Loading Dashboard...</h2>
          <p style={{ color: "#999", fontSize: "11px", marginTop: "12px", textAlign: "center" }}>
            Please wait...
          </p>
        </div>
      </div>
    );
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
      <div style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}>
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 style={{ color: "#1a1a2e" }} className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
              {parentProfile?.first_name ? `${parentProfile.first_name}'s Dashboard` : "Parent Dashboard"}
            </h1>
            <p style={{ color: "#333" }} className="text-xs sm:text-sm mt-1">
              Manage all your kids' homeschool progress
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto flex-col sm:flex-row">
            <button
              onClick={() => {
                if (kids.length === 0) {
                  alert("Please add a kid first");
                  return;
                }
                setShowAttendanceLog(true);
              }}
              style={{ backgroundColor: COLORS.secondary }}
              className="px-4 sm:px-6 py-2 text-white rounded-lg hover:opacity-90 font-medium text-xs sm:text-sm whitespace-nowrap"
            >
              📅 Attendance
            </button>
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
              className="px-4 sm:px-6 py-2 text-white rounded-lg hover:opacity-90 font-medium text-xs sm:text-sm whitespace-nowrap"
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
              className="px-4 sm:px-6 py-2 text-white rounded-lg hover:opacity-90 font-medium text-xs sm:text-sm whitespace-nowrap"
            >
              📄 Report
            </button>
          </div>
        </div>
      </div>

      <main style={{ backgroundColor: COLORS.light, flex: 1, display: "flex", overflow: "hidden" }} className="relative">

        {/* Right Content - Kid Cards */}
        <div className="w-full overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 w-full flex flex-col">
            {kids.length === 0 ? (
              <p style={{ color: "#555" }} className="text-sm">No kids added yet. Add a kid to get started!</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
                {kids.map((kid) => {
                  const stats = getKidStats(kid.name);
                  const kidGoals = stats.goals;
                  const kidActivities = activities.filter((a) => a.child_name === kid.name);
                  const totalGoalHours = kidGoals.reduce((sum, g) => sum + g.monthly_hours, 0);
                  const loggedHours = kidActivities.reduce((sum, a) => sum + a.duration, 0);
                  const progressPercent = totalGoalHours > 0 ? Math.min(100, (loggedHours / totalGoalHours) * 100) : 0;

                  return (
                    <div key={kid.id} style={{ backgroundColor: "white", borderLeft: `4px solid ${COLORS.primary}` }} className="p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
                      {/* Kid Header */}
                      <h3 style={{ color: "#1a1a2e" }} className="text-lg sm:text-xl font-bold mb-3">
                        {kid.name}
                      </h3>

                      {/* Subjects Breakdown */}
                      {kidActivities.length > 0 && (
                        <div className="mb-3 pb-3 border-b border-gray-200">
                          <p style={{ color: "#333" }} className="text-xs font-semibold mb-1">
                            SUBJECTS BY HOURS
                          </p>
                          <div className="space-y-1">
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
                      {kidGoals.length > 0 && (
                      <div className="mb-3 pb-3 border-b border-gray-200">
                        <p style={{ color: "#333" }} className="text-xs font-semibold mb-1">
                          MONTHLY GOALS: {kidGoals.length}
                        </p>
                        {kidGoals.length > 0 ? (
                          <div className="space-y-1">
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
                      )}

                      {/* Activity Type Breakdown */}
                      {kidActivities.length > 0 && (
                        <div className="mb-3 pb-3 border-b border-gray-200">
                          <p style={{ color: "#333" }} className="text-xs font-semibold mb-1">
                            ACTIVITY BREAKDOWN
                          </p>
                          <div className="space-y-0.5 text-xs">
                            {(() => {
                              const coreHours = kidActivities
                                .filter((a) => !a.activity_type || a.activity_type === "Core Subject")
                                .reduce((sum, a) => sum + a.duration, 0);
                              const extracurricularHours = kidActivities
                                .filter((a) => a.activity_type === "Extracurricular")
                                .reduce((sum, a) => sum + a.duration, 0);
                              const enrichmentHours = kidActivities
                                .filter((a) => a.activity_type === "Field Trip / Enrichment")
                                .reduce((sum, a) => sum + a.duration, 0);
                              
                              return (
                                <>
                                  {coreHours > 0 && (
                                    <div className="flex justify-between">
                                      <span style={{ color: "#1a1a2e" }}>Core Subjects</span>
                                      <span style={{ color: COLORS.primary }} className="font-semibold">{coreHours.toFixed(1)}h</span>
                                    </div>
                                  )}
                                  {extracurricularHours > 0 && (
                                    <div className="flex justify-between">
                                      <span style={{ color: "#1a1a2e" }}>Extracurricular</span>
                                      <span style={{ color: "#ff9900" }} className="font-semibold">{extracurricularHours.toFixed(1)}h</span>
                                    </div>
                                  )}
                                  {enrichmentHours > 0 && (
                                    <div className="flex justify-between">
                                      <span style={{ color: "#1a1a2e" }}>Enrichment</span>
                                      <span style={{ color: "#66bb6a" }} className="font-semibold">{enrichmentHours.toFixed(1)}h</span>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Attendance Badge */}
                      <div className="mb-3 pb-3 border-b border-gray-200">
                        <div style={{ backgroundColor: COLORS.light, borderRadius: "8px" }} className="p-2 flex items-center justify-between">
                          <span style={{ color: "#555" }} className="text-xs font-medium">
                            📅 This Month
                          </span>
                          <span style={{ color: COLORS.primary }} className="text-sm font-bold">
                            {attendanceMonthlyByKid[kid.name] || 0} days
                          </span>
                        </div>
                      </div>

                      {/* Compliance Quick View */}
                      <div className="mb-3">
                        <p style={{ color: "#333" }} className="text-xs font-semibold mb-1">
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
          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 sm:p-8 max-w-md w-full my-8">
            <h2 style={{ color: "#1a1a2e" }} className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 sm:mb-6">
              Quick Log - {quickLogKid.name}
            </h2>

            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
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
                  Curriculum/Resource (optional)
                </label>
                <input
                  type="text"
                  value={logCurriculum}
                  onChange={(e) => setLogCurriculum(e.target.value)}
                  placeholder="e.g., Math Mammoth, Khan Academy, Outschool, IXL, Textbook"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label style={{ color: "#1a1a2e" }} className="block text-sm font-semibold mb-2">
                  Activity Type
                </label>
                <select
                  value={logActivityType}
                  onChange={(e) => setLogActivityType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="Core Subject">Core Subject</option>
                  <option value="Extracurricular">Extracurricular (Music, Sports, Clubs)</option>
                  <option value="Field Trip / Enrichment">Field Trip / Enrichment</option>
                </select>
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

            <div className="flex gap-2 sm:gap-3 flex-col sm:flex-row">
              <button
                onClick={handleQuickLogSave}
                style={{ backgroundColor: COLORS.primary }}
                className="flex-1 px-4 py-2.5 text-white font-semibold rounded-lg hover:opacity-90 text-sm sm:text-base"
              >
                Save Activity
              </button>
              <button
                onClick={() => setShowQuickLog(false)}
                style={{ color: "#1a1a2e", borderColor: "#333" }}
                className="flex-1 px-4 py-2.5 border font-semibold rounded-lg hover:bg-gray-50 text-sm sm:text-base"
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
          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 sm:p-8 max-w-md w-full my-8">
            <h2 style={{ color: "#1a1a2e" }} className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 sm:mb-6">
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

            <div className="flex gap-2 sm:gap-3 flex-col sm:flex-row">
              <button
                onClick={handleGenerateReport}
                disabled={selectedSubjects.length === 0}
                style={{
                  backgroundColor: selectedSubjects.length === 0 ? "#ccc" : COLORS.primary,
                }}
                className="flex-1 px-4 py-2.5 text-white font-semibold rounded-lg hover:opacity-90 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                Download Report
              </button>
              <button
                onClick={() => setShowReportGen(false)}
                style={{ color: "#1a1a2e", borderColor: "#333" }}
                className="flex-1 px-4 py-2.5 border font-semibold rounded-lg hover:bg-gray-50 text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Log Modal */}
      {showAttendanceLog && (
        <div style={{ backgroundColor: "rgba(0,0,0,0.5)" }} className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="w-full max-w-md sm:max-w-lg my-8 p-6 sm:p-8">
            <h2 style={{ color: "#1a1a2e" }} className="text-xl sm:text-2xl font-bold mb-6">
              Log Attendance
            </h2>

            {/* Date */}
            <div className="mb-6">
              <label style={{ color: "#1a1a2e" }} className="block text-sm font-semibold mb-2">
                Date
              </label>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                style={{ borderColor: "#d1d5db" }}
                className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Kid Selection */}
            <div className="mb-6">
              <label style={{ color: "#1a1a2e" }} className="block text-sm font-semibold mb-3">
                Select Kids
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {kids.map((kid) => (
                  <label key={kid.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedKidsForAttendance.includes(kid.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedKidsForAttendance([...selectedKidsForAttendance, kid.id]);
                        } else {
                          setSelectedKidsForAttendance(
                            selectedKidsForAttendance.filter((id) => id !== kid.id)
                          );
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span style={{ color: "#1a1a2e" }} className="text-sm font-medium">
                      {kid.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 sm:gap-3 flex-col sm:flex-row">
              <button
                onClick={async () => {
                  if (selectedKidsForAttendance.length === 0) {
                    alert("Please select at least one kid");
                    return;
                  }

                  try {
                    // Log attendance for selected kids
                    for (const kidId of selectedKidsForAttendance) {
                      const kidName = kids.find((k) => k.id === kidId)?.name;
                      if (kidName) {
                        const { error } = await supabase.from("attendance").insert({
                          user_id: userId,
                          child_name: kidName,
                          date: attendanceDate,
                        });

                        if (error) {
                          console.error("Error logging attendance:", error);
                        }
                      }
                    }

                    alert("Attendance logged successfully!");
                    setShowAttendanceLog(false);
                    setSelectedKidsForAttendance([]);
                    setAttendanceDate(new Date().toISOString().split("T")[0]);
                  } catch (err) {
                    console.error("Error:", err);
                    alert("Failed to log attendance");
                  }
                }}
                style={{ backgroundColor: COLORS.primary }}
                className="flex-1 px-4 py-2.5 text-white font-semibold rounded-lg hover:opacity-90 text-sm sm:text-base"
              >
                Log Attendance
              </button>
              <button
                onClick={() => {
                  setShowAttendanceLog(false);
                  setSelectedKidsForAttendance([]);
                }}
                style={{ color: "#1a1a2e", borderColor: "#333" }}
                className="flex-1 px-4 py-2.5 border font-semibold rounded-lg hover:bg-gray-50 text-sm sm:text-base"
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
