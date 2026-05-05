"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import Navbar from "@/components/Navbar";
import { signOut } from "@/lib/supabase-auth";
import { getAttendanceDaysMonthly } from "@/lib/supabase-data";
import ParentDashboardCalendar from "@/components/ParentDashboardCalendar";
import CommandBar from "@/components/CommandBar";
import ReviewQueue from "@/components/ReviewQueue";
import MomentumGrid from "@/components/MomentumGrid";
import ConsistencyRing from "@/components/ConsistencyRing";
import SubjectProgressBars from "@/components/SubjectProgressBars";

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

interface ComplianceState {
  id: string;
  user_id: string;
  state: string;
  child_name?: string;
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
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [userState, setUserState] = useState<string | null>(null);

  // Quick Log states
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [quickLogKid, setQuickLogKid] = useState<Kid | null>(null);
  const [selectedKidsForLog, setSelectedKidsForLog] = useState<string[]>([]);
  const [logDate, setLogDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [logSubject, setLogSubject] = useState("");
  const [logDuration, setLogDuration] = useState("");
  const [logNotes, setLogNotes] = useState("");
  const [logCurriculum, setLogCurriculum] = useState("");
  const [logTopic, setLogTopic] = useState("");
  const [logActivityType, setLogActivityType] = useState("Core Subject");
  const [logActivityName, setLogActivityName] = useState("");
  const [logTripName, setLogTripName] = useState("");
  const [logDestination, setLogDestination] = useState("");

  // Report Generator states
  const [showReportGen, setShowReportGen] = useState(false);
  const [reportKid, setReportKid] = useState<Kid | null>(null);
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedActivityTypes, setSelectedActivityTypes] = useState<string[]>(["Core Subject"]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  // Add kid states
  const [showAddKid, setShowAddKid] = useState(false);
  const [newKidName, setNewKidName] = useState("");
  const [newKidAge, setNewKidAge] = useState("");
  const [newKidGrade, setNewKidGrade] = useState("");



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

        // Load compliance state
        try {
          console.log("🏛️ Loading compliance state...");
          const { data: stateData, error: stateError } = await supabase
            .from("compliance_state")
            .select("*")
            .eq("user_id", user.id)
            .is("child_name", null)
            .single();

          if (stateError && stateError.code !== "PGRST116") {
            console.log(`⚠️ State error: ${stateError.message}`);
          } else if (stateData) {
            console.log(`✅ Compliance state loaded: ${stateData.state}`);
            setUserState(stateData.state);
          } else {
            console.log("ℹ️ No compliance state set yet");
          }
        } catch (e: any) {
          console.log(`⚠️ Could not load compliance state: ${e?.message}`);
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

  // Load attendance data for all kids - refetch whenever dashboard is viewed
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

  // Real-time refresh: Reload activities when approval/logging happens
  useEffect(() => {
    if (!userId || kids.length === 0) return;

    const reloadActivities = async () => {
      try {
        console.log("🔄 Refreshing activities (approval/logging triggered)...");
        const sessionStr = localStorage.getItem('kernlo_session');
        let accessToken = '';
        if (sessionStr) {
          try {
            const session = JSON.parse(sessionStr);
            accessToken = session.access_token;
          } catch (e) {
            accessToken = localStorage.getItem('kernlo_access_token') || '';
          }
        } else {
          accessToken = localStorage.getItem('kernlo_access_token') || '';
        }

        if (!accessToken) return;

        const response = await fetch('/api/activities', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const { activities: activitiesData } = await response.json();
          setActivities(activitiesData || []);
          console.log(`✅ Activities refreshed: ${activitiesData?.length}`);
        }
      } catch (e) {
        console.log(`⚠️ Error reloading activities: ${e}`);
      }
    };

    reloadActivities();
  }, [refreshCounter, userId, kids.length]);

  // Fetch pending activities count
  useEffect(() => {
    if (!userId) return;

    const fetchPendingCount = async () => {
      try {
        const sessionStr = localStorage.getItem('kernlo_session');
        let accessToken = '';
        if (sessionStr) {
          try {
            const session = JSON.parse(sessionStr);
            accessToken = session.access_token;
          } catch (e) {
            accessToken = localStorage.getItem('kernlo_access_token') || '';
          }
        } else {
          accessToken = localStorage.getItem('kernlo_access_token') || '';
        }

        if (!accessToken) return;

        const response = await fetch('/api/activities/pending', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const count = data.activities?.length || 0;
          setPendingCount(count);
          console.log(`📋 Dashboard: Pending count fetched = ${count}`);
        }
      } catch (e) {
        console.log(`⚠️ Error fetching pending count: ${e}`);
      }
    };

    // Fetch immediately
    fetchPendingCount();

    // For refreshCounter changes, add a small delay to ensure API is updated
    if (refreshCounter > 0) {
      console.log(`📊 Dashboard: refreshCounter updated, re-fetching pending count...`);
      const timer = setTimeout(() => {
        fetchPendingCount();
      }, 200); // Small delay for DB consistency
      return () => clearTimeout(timer);
    }
  }, [userId, refreshCounter]);


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

    if (selectedKidsForLog.length === 0) {
      alert("Please select at least one kid");
      return;
    }

    try {
      const selectedKidObjects = kids.filter((k) => selectedKidsForLog.includes(k.id));
      let totalCreated = 0;

      // Route to correct table based on activity type
      if (logActivityType === "Core Subject") {
        // Core Subject → activities table (with duration)
        for (const kid of selectedKidObjects) {
          const insertData = {
            user_id: userId,
            child_name: kid.name,
            activity_type: logActivityType,
            date: logDate,
            notes: logNotes,
            curriculum: logCurriculum || null,
            subject: logSubject,
            // Convert hours to minutes for storage
            duration: parseFloat(logDuration) * 60,
            topic: logTopic || null,
          };

          const { error } = await supabase
            .from("activities")
            .insert(insertData)
            .select();

          if (error) {
            alert("Error: " + error.message);
            return;
          }
          totalCreated++;
        }
      } else if (logActivityType === "Extracurricular") {
        // Extracurricular → extracurricular_activities table (no duration)
        for (const kid of selectedKidObjects) {
          const insertData = {
            user_id: userId,
            kid_id: kid.id,
            activity_name: logActivityName,
            date: logDate,
            notes: logNotes,
          };

          const { error } = await supabase
            .from("extracurricular_activities")
            .insert(insertData)
            .select();

          if (error) {
            alert("Error: " + error.message);
            return;
          }
          totalCreated++;
        }
      } else if (logActivityType === "Field Trip / Enrichment") {
        // Field Trip → field_trips table (no duration)
        for (const kid of selectedKidObjects) {
          const insertData = {
            user_id: userId,
            kid_id: kid.id,
            trip_name: logTripName,
            destination: logDestination,
            date: logDate,
            notes: logNotes,
          };

          const { error } = await supabase
            .from("field_trips")
            .insert(insertData)
            .select();

          if (error) {
            alert("Error: " + error.message);
            return;
          }
          totalCreated++;
        }
      }

      // Success message
      const kidNames = selectedKidObjects.map((k) => k.name).join(", ");
      alert(`Activity created for ${selectedKidObjects.length} kid${selectedKidObjects.length > 1 ? "s" : ""}: ${kidNames}`);

      // Reset form
      setLogSubject("");
      setLogDuration("");
      setLogNotes("");
      setLogCurriculum("");
      setLogTopic("");
      setLogActivityType("Core Subject");
      setLogActivityName("");
      setLogTripName("");
      setLogDestination("");
      setSelectedKidsForLog([]);
      const d = new Date();
      setLogDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
      setShowQuickLog(false);
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save activity");
    }
  }

  async function handleGenerateReport() {
    if (!reportKid || selectedActivityTypes.length === 0) {
      alert("Please select a kid and at least one activity type");
      return;
    }

    // For Core Subjects, require subject selection
    if (selectedActivityTypes.includes("Core Subject") && selectedSubjects.length === 0) {
      alert("Please select at least one subject for Core Subjects");
      return;
    }

    setIsGeneratingReport(true);
    try {
      // Fetch all activity types data
      let coreSubjectActivities: any[] = [];
      let extracurricularActivities: any[] = [];
      let fieldTripActivities: any[] = [];

      // Fetch Core Subject activities
      if (selectedActivityTypes.includes("Core Subject")) {
        const filteredCore = activities.filter(
          (a) =>
            a.child_name === reportKid.name &&
            new Date(a.date) >= new Date(reportStartDate) &&
            new Date(a.date) <= new Date(reportEndDate) &&
            selectedSubjects.includes(a.subject)
        );
        coreSubjectActivities = filteredCore;
      }

      // Get auth token for API calls
      let accessToken = "";
      if (typeof window !== "undefined") {
        const sessionStr = localStorage.getItem("kernlo_session");
        if (sessionStr) {
          try {
            const session = JSON.parse(sessionStr);
            accessToken = session.access_token;
          } catch (e) {
            accessToken = localStorage.getItem("kernlo_access_token") || "";
          }
        } else {
          accessToken = localStorage.getItem("kernlo_access_token") || "";
        }
      }

      // Fetch Extracurricular activities from API
      if (selectedActivityTypes.includes("Extracurricular")) {
        try {
          const response = await fetch(`/api/extracurricular?childId=${reportKid.id}&startDate=${reportStartDate}&endDate=${reportEndDate}`, {
            headers: {
              "Authorization": `Bearer ${accessToken}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            extracurricularActivities = data.activities || [];
          }
        } catch (err) {
          console.log("Could not fetch extracurricular activities");
        }
      }

      // Fetch Field Trip activities from API
      if (selectedActivityTypes.includes("Field Trips")) {
        try {
          const response = await fetch(`/api/field-trips?childId=${reportKid.id}&startDate=${reportStartDate}&endDate=${reportEndDate}`, {
            headers: {
              "Authorization": `Bearer ${accessToken}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            fieldTripActivities = data.activities || [];
          }
        } catch (err) {
          console.log("Could not fetch field trip activities");
        }
      }

      // Check if we have any activities
      const totalActivities = coreSubjectActivities.length + extracurricularActivities.length + fieldTripActivities.length;
      if (totalActivities === 0) {
        alert("No activities found for selected criteria");
        return;
      }

      // Prepare activity summary for AI
      let activitySummary = "";
      let activityDetails = "";

      if (coreSubjectActivities.length > 0) {
        activitySummary += `CORE SUBJECTS (${coreSubjectActivities.length} activities, ${(coreSubjectActivities.reduce((sum, a) => sum + a.duration, 0) / 60).toFixed(1)} hours):\n`;
        activityDetails += "Core Subjects:\n";
        coreSubjectActivities.forEach((a) => {
          activitySummary += `- ${a.date}: ${a.subject} (${a.duration}m via ${a.platform})${a.notes ? ` - ${a.notes}` : ""}\n`;
          activityDetails += `- ${a.date}: ${a.subject} (${a.duration}m via ${a.platform})\n`;
        });
        activitySummary += "\n";
      }

      if (extracurricularActivities.length > 0) {
        activitySummary += `EXTRACURRICULAR (${extracurricularActivities.length} activities):\n`;
        activityDetails += "\nExtracurricular Activities:\n";
        extracurricularActivities.forEach((a) => {
          activitySummary += `- ${a.date}: ${a.activity_name}${a.notes ? ` - ${a.notes}` : ""}\n`;
          activityDetails += `- ${a.date}: ${a.activity_name}\n`;
        });
        activitySummary += "\n";
      }

      if (fieldTripActivities.length > 0) {
        activitySummary += `FIELD TRIPS & ENRICHMENT (${fieldTripActivities.length} activities):\n`;
        activityDetails += "\nField Trips & Enrichment:\n";
        fieldTripActivities.forEach((a) => {
          activitySummary += `- ${a.date}: ${a.trip_name} (${a.destination})${a.notes ? ` - ${a.notes}` : ""}\n`;
          activityDetails += `- ${a.date}: ${a.trip_name} at ${a.destination}\n`;
        });
        activitySummary += "\n";
      }

      const prompt = `Generate a professional, comprehensive homeschool progress report for ${reportKid.name} covering the period from ${reportStartDate} to ${reportEndDate}.

Activity Types Included: ${selectedActivityTypes.join(", ")}
${selectedActivityTypes.includes("Core Subject") ? `Subjects: ${selectedSubjects.join(", ")}` : ""}
Total activities logged: ${totalActivities}

Activity log:
${activitySummary}

Create a narrative-style report that:
1. Opens with a summary of learning progress and engagement
2. Details accomplishments in each category (Core Subjects, Extracurricular, Field Trips)
3. Highlights academic achievement and skill development
4. Notes participation in enrichment and extracurricular activities
5. Concludes with recommendations for continued learning and growth

Format as professional homeschool compliance documentation.`;

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

      // Activity Summary by Type
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

      if (coreSubjectActivities.length > 0) {
        doc.text(`Core Subjects: ${coreSubjectActivities.length} activities, ${(coreSubjectActivities.reduce((sum, a) => sum + a.duration, 0) / 60).toFixed(1)} hours`, marginLeft, yPosition);
        yPosition += 6;
      }

      if (extracurricularActivities.length > 0) {
        doc.text(`Extracurricular: ${extracurricularActivities.length} activities`, marginLeft, yPosition);
        yPosition += 6;
      }

      if (fieldTripActivities.length > 0) {
        doc.text(`Field Trips & Enrichment: ${fieldTripActivities.length} activities`, marginLeft, yPosition);
        yPosition += 6;
      }

      yPosition += 6;

      // Activity Details Section
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = marginTop;
      }

      doc.setFont("helvetica", "bold");
      doc.text("DETAILED ACTIVITY LOG", marginLeft, yPosition);
      yPosition += 8;
      doc.setFont("helvetica", "normal");

      if (coreSubjectActivities.length > 0) {
        doc.text("Core Subjects:", marginLeft, yPosition);
        yPosition += 6;
        coreSubjectActivities.forEach((a) => {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = marginTop;
          }
          doc.text(`  • ${a.date}: ${a.subject} (${a.duration}m via ${a.platform})`, marginLeft + 5, yPosition);
          yPosition += 5;
        });
        yPosition += 2;
      }

      if (extracurricularActivities.length > 0) {
        doc.text("Extracurricular Activities:", marginLeft, yPosition);
        yPosition += 6;
        extracurricularActivities.forEach((a) => {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = marginTop;
          }
          doc.text(`  • ${a.date}: ${a.activity_name}`, marginLeft + 5, yPosition);
          yPosition += 5;
        });
        yPosition += 2;
      }

      if (fieldTripActivities.length > 0) {
        doc.text("Field Trips & Enrichment:", marginLeft, yPosition);
        yPosition += 6;
        fieldTripActivities.forEach((a) => {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = marginTop;
          }
          doc.text(`  • ${a.date}: ${a.trip_name} (${a.destination})`, marginLeft + 5, yPosition);
          yPosition += 5;
        });
      }

      // Get PDF bytes for storage upload
      const pdfBytes = doc.output('arraybuffer');
      
      // Download PDF first
      doc.save(`${reportKid.name}-report-${reportStartDate}-${reportEndDate}.pdf`);

      // Ensure auth context before attempting insert
      console.log('🔑 Ensuring auth context before report logging...');
      try {
        const sessionStr = localStorage.getItem('kernlo_session');
        if (sessionStr) {
          try {
            const session = JSON.parse(sessionStr);
            const result = await supabase.auth.setSession(session);
            if (result.error) {
              console.log(`⚠️ setSession error: ${result.error.message}`);
            } else {
              console.log(`✅ Auth context restored for report logging`);
            }
          } catch (e) {
            console.log(`⚠️ Could not restore session from storage`);
          }
        }
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (e: any) {
        console.log(`⚠️ Auth context error: ${e?.message}`);
      }

      // Get fresh user data
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      // Log report to generated_reports table
      const startDate = new Date(reportStartDate);
      const endDate = new Date(reportEndDate);
      const dateRange = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${endDate.getFullYear()}`;
      
      // Generate unique report ID and upload PDF to Supabase Storage
      const reportId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      // Sanitize dateRange: replace spaces with underscores, remove special characters
      const sanitizedDateRange = dateRange
        .replace(/\s+/g, '_')           // spaces → underscores
        .replace(/[^a-zA-Z0-9_-]/g, ''); // remove non-alphanumeric (except _ and -)
      
      const fileName = `${currentUserId}/${reportKid.id}/${reportId}-${sanitizedDateRange}.pdf`;
      let signedUrl: string | null = null;

      console.log('📝 Attempting to log report:', {
        userId: currentUserId,
        kidId: reportKid?.id,
        childName: reportKid?.name,
        dateRange: dateRange,
      });

      // Upload PDF to Supabase Storage
      // Before upload attempt
      console.log('📦 Storage upload starting...', {
        userId: currentUserId,
        kidId: reportKid?.id,
        reportId: reportId,
        dateRange: dateRange,
        sanitizedDateRange: sanitizedDateRange,
        fileName: fileName,
        bucketName: 'reports',
      });

      try {
        // Extract PDF bytes
        console.log('📦 PDF created, size:', pdfBytes.byteLength, 'bytes');

        console.log('📦 Storage path:', fileName);

        // Upload to storage
        console.log('📦 Uploading to Supabase Storage...');
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('Reports')
          .upload(fileName, new Blob([pdfBytes], { type: 'application/pdf' }), {
            contentType: 'application/pdf',
            upsert: true,
          });

        if (uploadError) {
          console.error('❌ STORAGE UPLOAD ERROR:', {
            message: uploadError.message,
            name: uploadError.name,
            fullError: uploadError,
          });
        } else {
          console.log('✅ PDF uploaded successfully');

          // Get signed URL (valid for 1 year: 365 * 24 * 60 * 60 seconds)
          console.log('📦 Generating signed URL (365 days)...');
          const { data: signedData, error: signedError } = await supabase
            .storage
            .from('Reports')
            .createSignedUrl(fileName, 365 * 24 * 60 * 60);

          if (signedError) {
            console.error('❌ SIGNED URL ERROR:', {
              message: signedError.message,
              fullError: signedError,
            });
          } else if (signedData?.signedUrl) {
            console.log('✅ Signed URL created:', signedData.signedUrl.substring(0, 50) + '...');
            signedUrl = signedData.signedUrl;
          } else {
            console.error('❌ No signed URL returned:', signedData);
          }
        }
      } catch (err) {
        console.error('❌ STORAGE EXCEPTION:', {
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : null,
          fullError: err,
        });
        // Don't break the main flow - continue with database insert
      }

      // Save to database
      try {
        console.log('📦 Saving report to database...', {
          user_id: currentUserId,
          kid_id: reportKid.id,
          file_url: signedUrl ? signedUrl.substring(0, 50) + '...' : null,
        });

        const { data, error } = await supabase
          .from('generated_reports')
          .insert({
            user_id: currentUserId,
            kid_id: reportKid.id,
            child_name: reportKid.name,
            report_type: 'comprehensive',
            date_range: dateRange,
            date_generated: new Date().toISOString(),
            start_date: reportStartDate,
            end_date: reportEndDate,
            selected_subjects: selectedSubjects,
            selected_activity_types: selectedActivityTypes,
            file_url: signedUrl,
          });
        
        if (error) {
          console.error('❌ DATABASE INSERT ERROR:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            fullError: error,
          });
        } else {
          console.log('✅ Report logged successfully with file_url:', signedUrl ? signedUrl.substring(0, 50) + '...' : 'NULL');
          console.log('📊 Full report record:', data);
        }
      } catch (err) {
        console.error('❌ DATABASE INSERT EXCEPTION:', {
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : null,
          fullError: err,
        });
      }

      setShowReportGen(false);
    } catch (err) {
      console.error("Error generating report:", err);
      alert("Failed to generate report. Please try again.");
    } finally {
      setIsGeneratingReport(false);
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

      {/* Header - With Calendar, Quick Log, Report buttons on right */}
      <div style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}>
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 style={{ color: "#1a1a2e" }} className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
              {parentProfile?.first_name ? `${parentProfile.first_name}'s Dashboard` : "Parent Dashboard"}
            </h1>
            {userState && (
              <div style={{ color: "#9CA3AF", fontSize: "13px" }} className="inline-block mt-2">
                {userState}
              </div>
            )}
            <p style={{ color: "#333" }} className="text-xs sm:text-sm mt-1">
              Manage all your kids' homeschool progress
            </p>
          </div>
          
          {/* Action Buttons - Right side, visible on all screens */}
          <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto justify-start sm:justify-end">
            <Link
              href="/dashboard/calendar"
              style={{ backgroundColor: COLORS.secondary }}
              className="px-3 sm:px-4 py-2 text-white rounded-lg hover:opacity-90 font-medium text-xs sm:text-sm whitespace-nowrap inline-flex items-center justify-center"
            >
              📅 Calendar
            </Link>
            <button
              onClick={() => {
                setQuickLogKid(kids[0] || null);
                setSelectedKidsForLog(kids.length > 0 ? [kids[0].id] : []);
                setShowQuickLog(true);
              }}
              style={{ backgroundColor: COLORS.primary }}
              className="px-3 sm:px-4 py-2 text-white rounded-lg hover:opacity-90 font-medium text-xs sm:text-sm whitespace-nowrap inline-flex items-center justify-center"
            >
              + Quick Log
            </button>
            <button
              onClick={() => {
                setReportKid(reportKid || kids[0]);
                setShowReportGen(true);
              }}
              style={{ backgroundColor: COLORS.secondary }}
              className="px-3 sm:px-4 py-2 text-white rounded-lg hover:opacity-90 font-medium text-xs sm:text-sm whitespace-nowrap inline-flex items-center justify-center"
            >
              📄 Report
            </button>
          </div>
        </div>
      </div>

      <main style={{ backgroundColor: COLORS.light, flex: 1, display: "flex", overflow: "hidden" }} className="relative">

        {/* Right Content - Kid Cards */}
        <div className="w-full overflow-y-auto">
          {/* Command Bar at top */}
          <div style={{ backgroundColor: COLORS.light }} className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-2">
            <CommandBar userId={userId} onActivityLogged={() => {
              // Trigger refresh of review queue to show new pending item
              setRefreshCounter(c => c + 1);
            }} />
          </div>
          {/* Review Queue - Pending Approvals (only render if there are pending items) */}
          {pendingCount > 0 && (
            <div style={{ backgroundColor: COLORS.light }} className="px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4">
              <ReviewQueue 
                userId={userId} 
                onActivityApproved={() => {
                  // Trigger refresh of kid cards after approval (activities changed from pending to confirmed)
                  setRefreshCounter(c => c + 1);
                }}
                onPendingCountChange={(count) => {
                  // Sync dashboard pending count with ReviewQueue's actual pending count
                  console.log(`📊 Dashboard: Pending count updated to ${count}`);
                  setPendingCount(count);
                }}
              />
            </div>
          )}
          {/* Momentum Grid - Activity Heatmap (HIDDEN - Replaced with ConsistencyRing) */}
          {/* <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 w-full">
            <MomentumGrid userId={userId} refreshCounter={refreshCounter} />
          </div> */}
          <div className="px-4 sm:px-6 lg:px-8 pt-0 w-full flex flex-col">
            {kids.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p style={{ color: "#555" }} className="text-sm mb-4">No kids added yet. Add a kid to get started!</p>
                <button
                  onClick={() => setShowAddKid(true)}
                  style={{ backgroundColor: COLORS.primary }}
                  className="px-6 py-2.5 text-white rounded-lg hover:opacity-90 font-medium text-sm"
                >
                  + Add Child
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
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
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <div className="flex-1">
                          <h3 style={{ color: "#1a1a2e" }} className="text-lg sm:text-xl font-bold">
                            {kid.name}
                          </h3>
                          {kid.grade && (
                            <p style={{ color: "#666", fontSize: "12px" }} className="mt-0.5">
                              Grade: {kid.grade}
                            </p>
                          )}
                        </div>
                        <ConsistencyRing 
                          childId={kid.id} 
                          childName={kid.name} 
                          userId={userId}
                          refreshCounter={refreshCounter}
                        />
                      </div>

                      {/* Subjects Breakdown */}
                      {kidActivities.length > 0 && (
                        <div className="mb-3 pb-2">
                          <p style={{ color: "#333" }} className="text-xs font-semibold mb-3">
                            SUBJECTS BY HOURS
                          </p>
                          {(() => {
                            const subjectHoursMap = new Map<string, number>();
                            kidActivities.forEach((a) => {
                              const current = subjectHoursMap.get(a.subject) || 0;
                              subjectHoursMap.set(a.subject, current + a.duration);
                            });
                            const subjectHours = Array.from(subjectHoursMap.entries())
                              .map(([subject, hours]) => ({
                                subject,
                                hours: hours / 60, // Convert to hours
                              }))
                              .sort((a, b) => b.hours - a.hours)
                              .slice(0, 4);
                            
                            return <SubjectProgressBars subjects={subjectHours} />;
                          })()}
                        </div>
                      )}

                      {/* Goals Progress */}
                      {kidGoals.length > 0 && (
                      <div className="mb-3 pb-2">
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
                                  {(loggedHours / 60).toFixed(1)}h / {totalGoalHours}h
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

                      {/* Total Hours Badge */}
                      {kidActivities.length > 0 && (
                        <div className="mb-3 pb-2">
                          {(() => {
                            const totalMinutes = kidActivities.reduce((sum, a) => sum + a.duration, 0);
                            const totalHours = (totalMinutes / 60).toFixed(1);
                            
                            return (
                              <div
                                style={{
                                  backgroundColor: "#e8f0ff",
                                  borderRadius: "8px",
                                  padding: "10px 12px",
                                  border: `2px solid ${COLORS.primary}`,
                                  marginTop: "2px",
                                }}
                                className="flex items-center justify-center"
                              >
                                <span style={{ color: COLORS.primary }} className="text-sm font-bold">
                                  ⏱️ {totalHours}h Total
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Attendance Badge */}
                      <div className="mb-3 pb-2">
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

                      {/* View Dashboard Button */}
                      <div className="flex gap-2">
                        <Link
                          href={`/dashboard/${kid.id}`}
                          style={{ borderColor: COLORS.primary, color: COLORS.primary }}
                          className="flex-1 text-center px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm font-medium"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {kids.length > 0 && kids.length < 5 && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setShowAddKid(true)}
                  style={{ backgroundColor: COLORS.secondary, borderColor: COLORS.secondary }}
                  className="px-6 py-2.5 text-white rounded-lg hover:opacity-90 font-medium text-sm border"
                >
                  + Add Another Child
                </button>
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
              Quick Log
            </h2>

            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              <div>
                <label style={{ color: "#1a1a2e" }} className="block text-sm font-semibold mb-2">
                  Kids (Select Multiple)
                </label>
                <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-gray-50">
                  {kids.map((k) => (
                    <button
                      key={k.id}
                      type="button"
                      onClick={() => {
                        if (selectedKidsForLog.includes(k.id)) {
                          setSelectedKidsForLog(selectedKidsForLog.filter((id) => id !== k.id));
                        } else {
                          setSelectedKidsForLog([...selectedKidsForLog, k.id]);
                        }
                      }}
                      className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 min-h-[44px] flex items-center justify-center cursor-pointer hover:shadow-md active:scale-95 ${
                        selectedKidsForLog.includes(k.id)
                          ? "bg-blue-500 text-white shadow-md"
                          : "bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400"
                      }`}
                      style={
                        selectedKidsForLog.includes(k.id)
                          ? { backgroundColor: "#0066cc", color: "white" }
                          : { color: "#1a1a2e" }
                      }
                    >
                      {k.name}
                    </button>
                  ))}
                </div>
                {selectedKidsForLog.length > 0 && (
                  <p style={{ color: "#0066cc" }} className="text-xs mt-2 font-medium">
                    {selectedKidsForLog.length} kid{selectedKidsForLog.length > 1 ? "s" : ""} selected
                  </p>
                )}
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
                  Activity Type
                </label>
                <select
                  value={logActivityType}
                  onChange={(e) => {
                    setLogActivityType(e.target.value);
                    // Clear duration when activity type changes
                    setLogDuration("");
                  }}
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
                      Lesson Topic
                    </label>
                    <input
                      type="text"
                      value={logTopic}
                      onChange={(e) => setLogTopic(e.target.value)}
                      placeholder="e.g., Fractions and Decimals, Photosynthesis"
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
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3 flex-col sm:flex-row">
              <button
                onClick={handleQuickLogSave}
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
                  Activity Types
                </label>
                <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-gray-50">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedActivityTypes.includes("Core Subject")) {
                        setSelectedActivityTypes(selectedActivityTypes.filter((t) => t !== "Core Subject"));
                      } else {
                        setSelectedActivityTypes([...selectedActivityTypes, "Core Subject"]);
                      }
                    }}
                    className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 min-h-[44px] flex items-center justify-center cursor-pointer hover:shadow-md active:scale-95 ${
                      selectedActivityTypes.includes("Core Subject")
                        ? "bg-blue-500 text-white shadow-md"
                        : "bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400"
                    }`}
                    style={
                      selectedActivityTypes.includes("Core Subject")
                        ? { backgroundColor: "#0066cc", color: "white" }
                        : { color: "#1a1a2e" }
                    }
                  >
                    Core Subjects
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedActivityTypes.includes("Extracurricular")) {
                        setSelectedActivityTypes(selectedActivityTypes.filter((t) => t !== "Extracurricular"));
                      } else {
                        setSelectedActivityTypes([...selectedActivityTypes, "Extracurricular"]);
                      }
                    }}
                    className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 min-h-[44px] flex items-center justify-center cursor-pointer hover:shadow-md active:scale-95 ${
                      selectedActivityTypes.includes("Extracurricular")
                        ? "bg-blue-500 text-white shadow-md"
                        : "bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400"
                    }`}
                    style={
                      selectedActivityTypes.includes("Extracurricular")
                        ? { backgroundColor: "#0066cc", color: "white" }
                        : { color: "#1a1a2e" }
                    }
                  >
                    Extracurricular
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedActivityTypes.includes("Field Trips")) {
                        setSelectedActivityTypes(selectedActivityTypes.filter((t) => t !== "Field Trips"));
                      } else {
                        setSelectedActivityTypes([...selectedActivityTypes, "Field Trips"]);
                      }
                    }}
                    className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 min-h-[44px] flex items-center justify-center cursor-pointer hover:shadow-md active:scale-95 ${
                      selectedActivityTypes.includes("Field Trips")
                        ? "bg-blue-500 text-white shadow-md"
                        : "bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400"
                    }`}
                    style={
                      selectedActivityTypes.includes("Field Trips")
                        ? { backgroundColor: "#0066cc", color: "white" }
                        : { color: "#1a1a2e" }
                    }
                  >
                    Field Trips
                  </button>
                </div>
              </div>

              {selectedActivityTypes.includes("Core Subject") && (
              <div>
                <label style={{ color: "#1a1a2e" }} className="block text-sm font-semibold mb-3">
                  Subjects
                </label>
                <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-gray-50">
                  {Array.from(new Set(activities.filter((a) => a.child_name === reportKid.name).map((a) => a.subject))).length === 0 ? (
                    <p style={{ color: "#555" }} className="text-sm">
                      No subjects found. Log activities first.
                    </p>
                  ) : (
                    Array.from(new Set(activities.filter((a) => a.child_name === reportKid.name).map((a) => a.subject))).map((subject) => (
                      <button
                        key={subject}
                        type="button"
                        onClick={() => {
                          if (selectedSubjects.includes(subject)) {
                            setSelectedSubjects(selectedSubjects.filter((s) => s !== subject));
                          } else {
                            setSelectedSubjects([...selectedSubjects, subject]);
                          }
                        }}
                        className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 min-h-[44px] flex items-center justify-center cursor-pointer hover:shadow-md active:scale-95 ${
                          selectedSubjects.includes(subject)
                            ? "bg-blue-500 text-white shadow-md"
                            : "bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400"
                        }`}
                        style={
                          selectedSubjects.includes(subject)
                            ? { backgroundColor: "#0066cc", color: "white" }
                            : { color: "#1a1a2e" }
                        }
                      >
                        {subject}
                      </button>
                    ))
                  )}
                </div>
              </div>
              )}
            </div>

            <p style={{ color: "#ff6b6b" }} className="text-xs mb-4 p-3 bg-red-50 rounded border border-red-200">
              ⚠️ Report generation takes ~30 seconds. Please click once and wait.
            </p>

            <div className="flex gap-2 sm:gap-3 flex-col sm:flex-row">
              <button
                onClick={handleGenerateReport}
                disabled={isGeneratingReport || selectedActivityTypes.length === 0 || (selectedActivityTypes.includes("Core Subject") && selectedSubjects.length === 0)}
                style={{
                  backgroundColor: isGeneratingReport ? "#999" : (selectedActivityTypes.length === 0 || (selectedActivityTypes.includes("Core Subject") && selectedSubjects.length === 0) ? "#ccc" : COLORS.primary),
                  minHeight: "44px",
                  opacity: isGeneratingReport ? 0.8 : 1
                }}
                className="flex-1 px-4 py-2.5 text-white font-semibold rounded-lg hover:opacity-90 disabled:cursor-not-allowed text-sm sm:text-base flex items-center justify-center"
              >
                {isGeneratingReport ? "Generating Report..." : "Download Report"}
              </button>
              <button
                onClick={() => setShowReportGen(false)}
                style={{ color: "#1a1a2e", borderColor: "#333", minHeight: "44px" }}
                className="flex-1 px-4 py-2.5 border font-semibold rounded-lg hover:bg-gray-50 text-sm sm:text-base flex items-center justify-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Child Modal */}
      {showAddKid && (
        <div style={{ backgroundColor: "rgba(0,0,0,0.5)" }} className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 sm:p-8 max-w-md w-full my-8">
            <h2 style={{ color: "#1a1a2e" }} className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 sm:mb-6">
              Add Child
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label style={{ color: "#1a1a2e" }} className="block text-sm font-semibold mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={newKidName}
                  onChange={(e) => setNewKidName(e.target.value)}
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
                  value={newKidAge}
                  onChange={(e) => setNewKidAge(e.target.value)}
                  placeholder="e.g., 14"
                  min="1"
                  max="25"
                  style={{ color: "#1a1a2e", borderColor: "#333" }}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label style={{ color: "#1a1a2e" }} className="block text-sm font-semibold mb-2">
                  Grade (optional but recommended)
                </label>
                <select
                  value={newKidGrade}
                  onChange={(e) => setNewKidGrade(e.target.value)}
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

            <div className="flex gap-2 sm:gap-3 flex-col sm:flex-row">
              <button
                onClick={handleAddKid}
                style={{ backgroundColor: COLORS.primary, minHeight: "44px" }}
                className="flex-1 px-4 py-2.5 text-white font-semibold rounded-lg hover:opacity-90 text-sm sm:text-base flex items-center justify-center"
              >
                Add Child
              </button>
              <button
                onClick={() => {
                  setShowAddKid(false);
                  setNewKidName("");
                  setNewKidAge("");
                  setNewKidGrade("");
                }}
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
  );
}
