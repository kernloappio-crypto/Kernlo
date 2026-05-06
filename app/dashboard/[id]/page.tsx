"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import Navbar from "@/components/Navbar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import TranscriptCard from "@/components/TranscriptCard";
import SubjectProgressBars from "@/components/SubjectProgressBars";
import { 
  getActivities, 
  addActivity, 
  deleteActivity, 
  getGoals, 
  getComplianceState,
  getAttendanceDaysYearly,
  getAttendanceDaysMonthly,
  getExtracurricularActivities,
  getFieldTrips
} from "@/lib/supabase-data";

export const dynamic = "force-dynamic";

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
  const [extracurricularActivities, setExtracurricularActivities] = useState<any[]>([]);
  const [fieldTrips, setFieldTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [logActivityType, setLogActivityType] = useState("Core Subject");
  // Core Subject fields
  const [logSubject, setLogSubject] = useState("");
  const [logDuration, setLogDuration] = useState("");
  const [logPlatform, setLogPlatform] = useState("");
  const [logCurriculum, setLogCurriculum] = useState("");
  const [logTopic, setLogTopic] = useState("");
  // Extracurricular fields
  const [logActivityName, setLogActivityName] = useState("");
  // Field Trip fields
  const [logTripName, setLogTripName] = useState("");
  const [logDestination, setLogDestination] = useState("");
  // Common field
  const [logNotes, setLogNotes] = useState("");

  const [goals, setGoals] = useState<any[]>([]);
  const [complianceState, setComplianceState] = useState("CA");
  const [attendanceDaysYear, setAttendanceDaysYear] = useState(0);
  const [attendanceDaysMonth, setAttendanceDaysMonth] = useState(0);
  const [showEditKid, setShowEditKid] = useState(false);
  const [editKidName, setEditKidName] = useState("");
  const [editKidAge, setEditKidAge] = useState("");
  const [editKidGrade, setEditKidGrade] = useState("");

  useEffect(() => {
    const initializeUser = async () => {
      try {
        // Restore auth context for RLS policies to work
        const sessionStr = localStorage.getItem('kernlo_session');
        if (sessionStr) {
          try {
            const session = JSON.parse(sessionStr);
            await supabase.auth.setSession(session);
          } catch (e) {
            console.log('Could not restore session');
          }
        }

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
          // Initialize edit form fields
          setEditKidName(kidData.name);
          setEditKidAge(kidData.age?.toString() || "");
          setEditKidGrade(kidData.grade || "");
        }

        // Load activities
        try {
          console.log("🔄 KidDetail: Loading activities for user:", user.id, "kid name:", kidData?.name);
          const activitiesData = await getActivities(user.id);
          console.log("🔄 KidDetail: Got activitiesData count:", activitiesData.length, "data:", activitiesData);
          
          const kidActivities = activitiesData.filter(
            (a: any) => {
              const matches = a.child_name === kidData?.name;
              if (!matches) {
                console.log(`  ⚠️  Activity skipped - child_name mismatch: "${a.child_name}" !== "${kidData?.name}"`);
              }
              return matches;
            }
          );
          
          console.log("🔄 KidDetail: Filtered to kid activities count:", kidActivities.length, "data:", kidActivities);
          setActivities(kidActivities as Activity[]);
        } catch (err) {
          console.error("Error loading activities:", err);
          setActivities([]);
        }



        // Load goals
        try {
          const goalsData = await getGoals(user.id, kidData?.name);
          setGoals(goalsData || []);
        } catch (err) {
          console.error("Error loading goals:", err);
          setGoals([]);
        }

        // Load extracurricular activities
        try {
          const extracurricularData = await getExtracurricularActivities(user.id, kidId);
          setExtracurricularActivities(extracurricularData || []);
        } catch (err) {
          console.error("Error loading extracurricular activities:", err);
          setExtracurricularActivities([]);
        }

        // Load field trips
        try {
          const fieldTripsData = await getFieldTrips(user.id, kidId);
          setFieldTrips(fieldTripsData || []);
        } catch (err) {
          console.error("Error loading field trips:", err);
          setFieldTrips([]);
        }

        // Load compliance state
        if (kidData?.name) {
          try {
            const complianceData = await getComplianceState(user.id, kidData.name);
            if (complianceData?.state) {
              setComplianceState(complianceData.state);
            } else {
              // Default to CA if no state saved yet
              setComplianceState("CA");
            }
          } catch (err) {
            console.error("Error loading compliance state:", err);
            setComplianceState("CA");
          }
        }

        // Load attendance statistics
        if (kidData?.name) {
          try {
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1;

            const yearlyDays = await getAttendanceDaysYearly(user.id, kidData.name, currentYear);
            setAttendanceDaysYear(yearlyDays);

            const monthlyDays = await getAttendanceDaysMonthly(user.id, kidData.name, currentYear, currentMonth);
            setAttendanceDaysMonth(monthlyDays);
          } catch (err) {
            console.error("Error loading attendance statistics:", err);
            setAttendanceDaysYear(0);
            setAttendanceDaysMonth(0);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Error initializing:", err);
        setLoading(false);
      }
    };

    initializeUser();
  }, [kidId, router]);

  // Refetch attendance and generated reports when arriving at this page (triggers on route/kidId change)
  useEffect(() => {
    if (!kid?.name || !userId) return;

    const refreshAttendance = async () => {
      console.log("🔄 Navigated to kid detail page - refreshing attendance and reports...");
      try {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        const yearlyDays = await getAttendanceDaysYearly(userId, kid.name, currentYear);
        setAttendanceDaysYear(yearlyDays);

        const monthlyDays = await getAttendanceDaysMonthly(userId, kid.name, currentYear, currentMonth);
        setAttendanceDaysMonth(monthlyDays);


      } catch (err) {
        console.error("Error refreshing attendance:", err);
      }
    };

    refreshAttendance();
  }, [kidId, userId, kid?.name]);

  // Subscribe to real-time activity changes (for compliance card to update when activity is approved)
  useEffect(() => {
    if (!userId || !kid?.name) return;

    console.log('📡 KidDetail: Setting up real-time activity subscription...');

    const reloadActivities = async () => {
      try {
        const activitiesData = await getActivities(userId);
        const kidActivities = activitiesData.filter((a: any) => a.child_name === kid.name);
        setActivities(kidActivities as Activity[]);
        console.log('✅ KidDetail: Activities reloaded via real-time event');
      } catch (err) {
        console.error('❌ Error reloading activities on real-time event:', err);
      }
    };

    // Subscribe to updates on activities table using Supabase channels
    const channel = supabase.channel(`activities-${userId}`)
      .on(
        'postgres_changes' as any,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'activities',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          // Check if this activity belongs to current child
          if (payload.new?.child_name === kid.name) {
            // Reload if status changed to 'confirmed' (activity approved)
            if (payload.new?.status === 'confirmed' && payload.old?.status === 'pending') {
              console.log('📡 KidDetail: Activity approved (status changed to confirmed)');
              reloadActivities();
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId, kid?.name]);

  async function handleQuickLog() {
    // Validate based on activity type
    if (logActivityType === "Core Subject") {
      if (!logSubject || !logDuration || !logCurriculum) {
        alert("Please fill in all required fields (Date, Activity Type, Subject, Duration, Curriculum)");
        return;
      }
    } else if (logActivityType === "Extracurricular") {
      if (!logActivityName) {
        alert("Please fill in all required fields (Date, Activity Type, Activity Name)");
        return;
      }
    } else if (logActivityType === "Field Trip / Enrichment") {
      if (!logTripName || !logDestination) {
        alert("Please fill in all required fields (Date, Activity Type, Trip Name, Destination)");
        return;
      }
    }

    try {
      // Route to correct table based on activity type
      if (logActivityType === "Core Subject") {
        // Core Subject → activities table
        const { error } = await supabase
          .from("activities")
          .insert({
            user_id: userId,
            child_name: kid!.name,
            subject: logSubject,
            // Convert hours to minutes for storage
            duration: parseFloat(logDuration) * 60,
            platform: logPlatform || null,
            curriculum: logCurriculum || null,
            topic: logTopic || null,
            activity_type: logActivityType,
            date: logDate,
            notes: logNotes || null,
          })
          .select();

        if (error) {
          alert("Error: " + error.message);
          return;
        }
      } else if (logActivityType === "Extracurricular") {
        // Extracurricular → extracurricular_activities table
        const { error } = await supabase
          .from("extracurricular_activities")
          .insert({
            user_id: userId,
            kid_id: kid!.id,
            activity_name: logActivityName,
            date: logDate,
            notes: logNotes || null,
          })
          .select();

        if (error) {
          alert("Error: " + error.message);
          return;
        }
      } else if (logActivityType === "Field Trip / Enrichment") {
        // Field Trip → field_trips table
        const { error } = await supabase
          .from("field_trips")
          .insert({
            user_id: userId,
            kid_id: kid!.id,
            trip_name: logTripName,
            destination: logDestination,
            date: logDate,
            notes: logNotes || null,
          })
          .select();

        if (error) {
          alert("Error: " + error.message);
          return;
        }
      }

      // Reload activities
      const activitiesData = await getActivities(userId);
      const kidActivities = activitiesData.filter((a: any) => a.child_name === kid!.name);
      setActivities(kidActivities as Activity[]);

      // Reload extracurricular and field trips
      const extracurricularData = await getExtracurricularActivities(userId, kid!.id);
      setExtracurricularActivities(extracurricularData || []);

      const fieldTripsData = await getFieldTrips(userId, kid!.id);
      setFieldTrips(fieldTripsData || []);

      // Reset form
      setLogDate(new Date().toISOString().split("T")[0]);
      setLogActivityType("Core Subject");
      setLogSubject("");
      setLogDuration("");
      setLogPlatform("");
      setLogCurriculum("");
      setLogTopic("");
      setLogActivityName("");
      setLogTripName("");
      setLogDestination("");
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

  async function handleEditKid() {
    if (!kid || !editKidName.trim()) {
      alert("Kid name is required");
      return;
    }

    try {
      const { error } = await supabase
        .from("kids")
        .update({
          name: editKidName,
          age: editKidAge ? parseInt(editKidAge) : null,
          grade: editKidGrade || null,
        })
        .eq("id", kid.id);

      if (error) {
        alert("Error: " + error.message);
        return;
      }

      // Update local state
      const updatedKid = {
        ...kid,
        name: editKidName,
        age: editKidAge ? parseInt(editKidAge) : undefined,
        grade: editKidGrade || undefined,
      };
      setKid(updatedKid);
      setShowEditKid(false);
      alert("Kid updated successfully!");
    } catch (err) {
      alert("Failed to update kid");
    }
  }



  return (
    <>
      <Navbar />
      <main style={{ backgroundColor: COLORS.light, minHeight: "100vh" }}>
      {/* Header with Buttons */}
      <div style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb" }} className="sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Link href="/dashboard" style={{ color: COLORS.primary }} className="text-sm font-medium mb-2 block">
              ← Back to Dashboard
            </Link>
            <div className="flex items-center gap-2">
              <h1 style={{ color: COLORS.dark }} className="text-2xl font-bold">
                {kid?.name || "Loading..."}
              </h1>
              {kid?.grade && (
                <span style={{ color: "#666", fontSize: "14px" }}>
                  ({kid.grade === "K" ? "K" : kid.grade === "13" ? "College" : `${kid.grade}th`} Grade)
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto flex-col sm:flex-row">
            <button
              onClick={() => {
                setShowEditKid(true);
              }}
              style={{ backgroundColor: "#666" }}
              className="px-4 sm:px-6 py-2.5 text-white font-medium rounded-lg hover:opacity-90 text-xs sm:text-sm flex-1 sm:flex-initial min-h-11"
            >
              ✏️ Edit
            </button>
            <button
              onClick={() => setShowQuickLog(!showQuickLog)}
              style={{ backgroundColor: COLORS.primary }}
              className="px-4 sm:px-6 py-2.5 text-white font-medium rounded-lg hover:opacity-90 text-xs sm:text-sm flex-1 sm:flex-initial min-h-11"
            >
              {showQuickLog ? "Cancel" : "+ Log Activity"}
            </button>
            <Link
              href={`/dashboard/${kid?.id}/calendar`}
              style={{ backgroundColor: COLORS.accent3 }}
              className="px-4 sm:px-6 py-2.5 text-white font-medium rounded-lg hover:opacity-90 text-xs sm:text-sm flex-1 sm:flex-initial text-center min-h-11 flex items-center justify-center"
            >
              📅 Calendar
            </Link>

          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">

        {/* Summary Cards */}
        {kid && (() => {
          // Determine if TranscriptCard should be visible
          const showTranscript = !kid.grade || parseInt(kid.grade, 10) >= 9;
          // Card grid: 1 col mobile, 2 col tablet, 4 col desktop
          return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* State Compliance Card (Combined) */}
          <div
            onClick={() => router.push(`/dashboard/${kid.id}/compliance`)}
            style={{ backgroundColor: "white", borderRadius: "12px", cursor: "pointer" }}
            className="p-4 sm:p-6 border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all"
          >
            <h3 style={{ color: COLORS.dark }} className="text-lg font-bold mb-4">
              📋 {complianceState} Compliance
            </h3>
            
            {/* Attendance Section */}
            <div className="mb-3 pb-2">
              <p style={{ color: "#555" }} className="text-xs font-medium mb-3">Attendance</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span style={{ color: "#555" }} className="text-xs">This Month</span>
                  <span style={{ color: COLORS.primary }} className="text-sm font-bold">{attendanceDaysMonth}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span style={{ color: "#555" }} className="text-xs">This Year</span>
                  <span style={{ color: COLORS.primary }} className="text-sm font-bold">{attendanceDaysYear}</span>
                </div>
              </div>
            </div>
            
            {/* State Requirements Section */}
            <div className="mt-3 pt-2">
              <p style={{ color: "#555" }} className="text-xs font-medium mb-4">State: {complianceState}</p>
              {STATE_REQUIREMENTS[complianceState]?.totalHours > 0 ? (
                (() => {
                  const stateReqs = STATE_REQUIREMENTS[complianceState];
                  const subjects = Object.keys(stateReqs.subjects).slice(0, 3);
                  
                  console.log("📋 Dashboard Compliance Card: Processing", {
                    complianceState: complianceState,
                    subjectsToCheck: subjects,
                    activitiesCount: activities.length,
                  });
                  
                  const subjectHours = subjects.map((subject) => {
                    const subjectActivities = activities.filter((a) => a.subject === subject);
                    // Convert minutes to hours: divide by 60
                    const hours = subjectActivities.reduce((sum, a) => sum + a.duration, 0) / 60;
                    const required = stateReqs.subjects[subject] || 0;
                    
                    console.log(`  → ${subject}: ${subjectActivities.length} activities = ${hours} hours (target: ${required})`);
                    
                    return {
                      subject,
                      hours,
                      target: required,
                    };
                  });
                  
                  console.log("📋 Dashboard Compliance Card: Final subjectHours:", subjectHours);
                  
                  return (
                    <SubjectProgressBars 
                      subjects={subjectHours}
                    />
                  );
                })()
              ) : (
                <p style={{ color: "#555" }} className="text-xs italic">
                  {complianceState} is curriculum-based (no hour requirements).
                </p>
              )}
            </div>
          </div>

          {/* Subject Progress Card */}
          <div
            onClick={() => router.push(`/dashboard/${kid.id}/subject-progress`)}
            style={{ backgroundColor: "white", borderRadius: "12px", cursor: "pointer" }}
            className="p-4 sm:p-6 border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all"
          >
            <h3 style={{ color: COLORS.dark }} className="text-lg font-bold mb-4">
              📚 Subjects by Hours
            </h3>
            
            {activities.length === 0 ? (
              <p style={{ color: "#555" }} className="text-sm">
                No activities logged yet
              </p>
            ) : (
              (() => {
                // Calculate total hours per subject
                const subjectHoursMap = new Map<string, number>();
                
                console.log("📊 Dashboard Subject Progress: Processing activities:", {
                  activitiesCount: activities.length,
                  activities: activities,
                });

                activities.forEach((activity) => {
                  const current = subjectHoursMap.get(activity.subject) || 0;
                  // Convert minutes to hours: divide by 60
                  const hours = activity.duration / 60;
                  console.log(`  → ${activity.subject}: ${activity.duration} min = ${hours} hours`);
                  subjectHoursMap.set(activity.subject, current + hours);
                });

                const subjectHours = Array.from(subjectHoursMap.entries())
                  .map(([subject, hours]) => ({
                    subject,
                    hours,
                  }))
                  .sort((a, b) => b.hours - a.hours)
                  .slice(0, 4);

                console.log("📊 Dashboard Subject Progress: Final subjectHours array:", subjectHours);

                return (
                  <div>
                    <SubjectProgressBars subjects={subjectHours} />
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <a
                        href={`/dashboard/${kid.id}/subject-progress`}
                        style={{ color: COLORS.primary }}
                        className="text-xs font-medium hover:opacity-70"
                      >
                        View All →
                      </a>
                    </div>
                  </div>
                );
              })()
            )}
          </div>

          {/* Goals Card */}
          <div
            onClick={() => router.push(`/dashboard/${kid.id}/goals`)}
            style={{ backgroundColor: "white", borderRadius: "12px", cursor: "pointer" }}
            className="p-4 sm:p-6 border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all"
          >
            <h3 style={{ color: COLORS.dark }} className="text-lg font-bold mb-4">
              🎯 Goals
            </h3>
            {goals.length === 0 ? (
              <p style={{ color: "#555" }} className="text-sm">
                No goals set
              </p>
            ) : (
              <div className="space-y-2">
                {goals.slice(0, 3).map((g) => (
                  <div key={g.id} className="flex justify-between items-center text-sm">
                    <span style={{ color: COLORS.dark }} className="font-medium">
                      {g.subject}
                    </span>
                    <span style={{ color: COLORS.primary }} className="font-bold">
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
          </div>

          {/* Extracurricular Activities Card */}
          <div
            onClick={() => router.push(`/dashboard/${kid.id}/extracurricular`)}
            style={{ backgroundColor: "white", borderRadius: "12px", cursor: "pointer" }}
            className="p-4 sm:p-6 border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all"
          >
            <h3 style={{ color: COLORS.dark }} className="text-lg font-bold mb-4">
              🎭 Extracurricular
            </h3>
            <p style={{ color: "#555" }} className="text-sm mb-3">
              Track music, sports, clubs & hobbies
            </p>
            <div className="flex items-center justify-between">
              <span style={{ color: "#999" }} className="text-xs">This month</span>
              <span style={{ color: COLORS.primary }} className="text-lg font-bold">
                {(() => {
                  const now = new Date();
                  const currentMonth = now.getMonth() + 1;
                  const currentYear = now.getFullYear();
                  return extracurricularActivities.filter((a: any) => {
                    // TIMEZONE FIX: Parse date string directly without UTC conversion
                    const parts = a.date.split('-');
                    const aYear = parseInt(parts[0], 10);
                    const aMonth = parseInt(parts[1], 10);
                    return aMonth === currentMonth && aYear === currentYear;
                  }).length;
                })()}
              </span>
            </div>
          </div>



          {/* Transcript Card */}
          <ErrorBoundary>
            <TranscriptCard
              kidId={kid.id}
              kidName={kid.name}
              onClick={() => router.push(`/dashboard/${kid.id}/transcript`)}
              minGrade={9}
              kidGrade={kid.grade}
            />
          </ErrorBoundary>
        </div>
          );
        })()}

        {/* Quick Log Modal - Mirrors parent dashboard behavior */}
        {showQuickLog && kid && (
          <div style={{ backgroundColor: "rgba(0,0,0,0.5)" }} className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 sm:p-8 max-w-md w-full my-8">
              <h2 style={{ color: COLORS.dark }} className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">
                Log Activity - {kid.name}
              </h2>

              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {/* Date field */}
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

                {/* Activity Type field - MOVED HERE, right after Date */}
                <div>
                  <label style={{ color: "#1a1a2e" }} className="block text-sm font-semibold mb-2">
                    Activity Type
                  </label>
                  <select
                    value={logActivityType}
                    onChange={(e) => {
                      setLogActivityType(e.target.value);
                      // Clear duration when activity type changes
                      setLogDuration("");
                    }}
                    style={{ color: "#1a1a2e", borderColor: "#333" }}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="Core Subject">Core Subject</option>
                    <option value="Extracurricular">Extracurricular (Music, Sports, Clubs)</option>
                    <option value="Field Trip / Enrichment">Field Trip / Enrichment</option>
                  </select>
                </div>

                {/* Core Subject Fields */}
                {logActivityType === "Core Subject" && (
                  <>
                    <div>
                      <label style={{ color: "#1a1a2e" }} className="block text-sm font-semibold mb-2">
                        Subject
                      </label>
                      <select
                        value={logSubject}
                        onChange={(e) => setLogSubject(e.target.value)}
                        style={{ color: "#1a1a2e", borderColor: "#333" }}
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
                        Duration (hours) *
                      </label>
                      <input
                        type="number"
                        value={logDuration}
                        onChange={(e) => setLogDuration(e.target.value)}
                        placeholder="Hours (e.g., 2.5)"
                        step="0.5"
                        min="0"
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
                        placeholder="Khan Academy, IXL, Outschool..."
                        style={{ color: "#1a1a2e", borderColor: "#333" }}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label style={{ color: "#1a1a2e" }} className="block text-sm font-semibold mb-2">
                        Lesson Topic
                      </label>
                      <input
                        type="text"
                        value={logTopic}
                        onChange={(e) => setLogTopic(e.target.value)}
                        placeholder="e.g., Colonial America, Cell Division"
                        style={{ color: "#1a1a2e", borderColor: "#333" }}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label style={{ color: "#1a1a2e" }} className="block text-sm font-semibold mb-2">
                        Curriculum/Resource
                      </label>
                      <input
                        type="text"
                        value={logCurriculum}
                        onChange={(e) => setLogCurriculum(e.target.value)}
                        placeholder="e.g., Math Mammoth, Khan Academy, Outschool, IXL, Textbook"
                        style={{ color: "#1a1a2e", borderColor: "#333" }}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                  </>
                )}

                {/* Extracurricular Fields */}
                {logActivityType === "Extracurricular" && (
                  <>
                    <div>
                      <label style={{ color: "#1a1a2e" }} className="block text-sm font-semibold mb-2">
                        Activity Name
                      </label>
                      <input
                        type="text"
                        value={logActivityName}
                        onChange={(e) => setLogActivityName(e.target.value)}
                        placeholder="e.g., Piano Lesson, Basketball Practice"
                        style={{ color: "#1a1a2e", borderColor: "#333" }}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                  </>
                )}

                {/* Field Trip Fields */}
                {logActivityType === "Field Trip / Enrichment" && (
                  <>
                    <div>
                      <label style={{ color: "#1a1a2e" }} className="block text-sm font-semibold mb-2">
                        Trip Name
                      </label>
                      <input
                        type="text"
                        value={logTripName}
                        onChange={(e) => setLogTripName(e.target.value)}
                        placeholder="e.g., Science Museum Visit"
                        style={{ color: "#1a1a2e", borderColor: "#333" }}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label style={{ color: "#1a1a2e" }} className="block text-sm font-semibold mb-2">
                        Destination
                      </label>
                      <input
                        type="text"
                        value={logDestination}
                        onChange={(e) => setLogDestination(e.target.value)}
                        placeholder="e.g., Science Museum"
                        style={{ color: "#1a1a2e", borderColor: "#333" }}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                  </>
                )}

                {/* Notes (for all types) */}
                <div>
                  <label style={{ color: "#1a1a2e" }} className="block text-sm font-semibold mb-2">
                    Notes
                  </label>
                  <textarea
                    value={logNotes}
                    onChange={(e) => setLogNotes(e.target.value)}
                    placeholder="Lesson details..."
                    style={{ color: "#1a1a2e", borderColor: "#333" }}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-2 sm:gap-3 flex-col sm:flex-row">
                <button
                  onClick={handleQuickLog}
                  style={{ backgroundColor: COLORS.primary, minHeight: "44px" }}
                  className="flex-1 px-4 py-2.5 text-white font-semibold rounded-lg hover:opacity-90 text-sm sm:text-base flex items-center justify-center"
                >
                  Save Activity
                </button>
                <button
                  onClick={() => setShowQuickLog(false)}
                  style={{ color: "#1a1a2e", borderColor: "#333", minHeight: "44px" }}
                  className="flex-1 px-4 py-2.5 border font-semibold rounded-lg hover:bg-gray-50 text-sm sm:text-base flex items-center justify-center"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </div>



      {/* Edit Kid Modal */}
      {showEditKid && kid && (
        <div style={{ backgroundColor: "rgba(0,0,0,0.5)" }} className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 sm:p-8 max-w-md w-full my-4 sm:my-8 max-h-[90vh] overflow-y-auto">
            <h2 style={{ color: "#1a1a2e" }} className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 sm:mb-6">
              Edit {kid.name}
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label style={{ color: "#1a1a2e" }} className="block text-sm font-semibold mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={editKidName}
                  onChange={(e) => setEditKidName(e.target.value)}
                  placeholder="e.g., Sarah"
                  style={{ color: "#1a1a2e", borderColor: "#333" }}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label style={{ color: "#1a1a2e" }} className="block text-sm font-semibold mb-2">
                  Age (optional)
                </label>
                <input
                  type="number"
                  value={editKidAge}
                  onChange={(e) => setEditKidAge(e.target.value)}
                  placeholder="e.g., 14"
                  min="1"
                  max="25"
                  style={{ color: "#1a1a2e", borderColor: "#333" }}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label style={{ color: "#1a1a2e" }} className="block text-sm font-semibold mb-2">
                  Grade (optional)
                </label>
                <select
                  value={editKidGrade}
                  onChange={(e) => setEditKidGrade(e.target.value)}
                  style={{ color: "#1a1a2e", borderColor: "#333" }}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">Select grade</option>
                  <option value="K">Kindergarten</option>
                  <option value="1">1st Grade</option>
                  <option value="2">2nd Grade</option>
                  <option value="3">3rd Grade</option>
                  <option value="4">4th Grade</option>
                  <option value="5">5th Grade</option>
                  <option value="6">6th Grade</option>
                  <option value="7">7th Grade</option>
                  <option value="8">8th Grade</option>
                  <option value="9">9th Grade</option>
                  <option value="10">10th Grade</option>
                  <option value="11">11th Grade</option>
                  <option value="12">12th Grade</option>
                  <option value="13">College/University</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 flex-col">
              <button
                onClick={handleEditKid}
                style={{ backgroundColor: COLORS.primary }}
                className="w-full px-4 py-3 text-white font-semibold rounded-lg hover:opacity-90 text-sm sm:text-base min-h-12"
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  setShowEditKid(false);
                  // Reset to current values
                  if (kid) {
                    setEditKidName(kid.name);
                    setEditKidAge(kid.age?.toString() || "");
                    setEditKidGrade(kid.grade || "");
                  }
                }}
                style={{ color: "#1a1a2e", borderColor: "#333" }}
                className="w-full px-4 py-3 border font-semibold rounded-lg hover:bg-gray-50 text-sm sm:text-base min-h-12"
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
