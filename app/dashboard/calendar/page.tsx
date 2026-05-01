"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import Navbar from "@/components/Navbar";
import MonthCalendar from "@/components/MonthCalendar";

export const dynamic = "force-dynamic";

interface Kid {
  id: string;
  name: string;
  age?: number;
  grade?: string;
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

export default function ParentCalendarPage() {
  const [userId, setUserId] = useState("");
  const [kids, setKids] = useState<Kid[]>([]);
  const [loading, setLoading] = useState(true);
  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null);
  const router = useRouter();

  // Quick Log states (shared with calendar)
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
  const [logActivityType, setLogActivityType] = useState("Core Subject");
  const [logActivityName, setLogActivityName] = useState("");
  const [logTripName, setLogTripName] = useState("");
  const [logDestination, setLogDestination] = useState("");

  useEffect(() => {
    const initUser = async () => {
      try {
        console.log("📅 Parent Calendar loading...");
        
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

        try {
          console.log("📚 Loading kids...");
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
          }
        } catch (e: any) {
          console.log(`❌ Kids failed: ${e?.message}`);
          throw e;
        }

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
          }
        } catch (e: any) {
          console.log(`⚠️ Could not load parent profile: ${e?.message}`);
        }

        console.log("🎉 Parent Calendar ready!");
        setLoading(false);
      } catch (error: any) {
        const errorMsg = error?.message || JSON.stringify(error) || "Unknown error";
        console.log(`❌ CRASH: ${errorMsg}`);
        console.error("Error initializing user:", error);
        console.log("⏳ Redirecting to dashboard in 3s...");
        setTimeout(() => router.push("/dashboard"), 3000);
      }
    };

    initUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#f0f7ff" }}>
        <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px", maxWidth: "400px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <h2 style={{ color: "#0066cc", marginBottom: "16px" }}>Loading Calendar...</h2>
          <p style={{ color: "#999", fontSize: "11px", marginTop: "12px", textAlign: "center" }}>
            Please wait...
          </p>
        </div>
      </div>
    );
  }

  // Handle Quick Log Save
  const handleQuickLogSave = async () => {
    if (!logDate || selectedKidsForLog.length === 0) {
      alert("Please select at least one kid and a date");
      return;
    }

    try {
      const selectedKidObjects = kids.filter((k) => selectedKidsForLog.includes(k.id));

      if (logActivityType === "Core Subject") {
        if (!logSubject || !logDuration) {
          alert("Please fill in subject and duration");
          return;
        }
      } else if (logActivityType === "Extracurricular") {
        if (!logActivityName) {
          alert("Please enter activity name");
          return;
        }
      } else if (logActivityType === "Field Trip / Enrichment") {
        if (!logTripName) {
          alert("Please enter trip name");
          return;
        }
      }

      let totalCreated = 0;

      // Save to appropriate table for each selected kid
      if (logActivityType === "Core Subject") {
        for (const kid of selectedKidObjects) {
          const activityData: any = {
            user_id: userId,
            child_name: kid.name,
            date: logDate,
            activity_type: logActivityType,
            notes: logNotes,
            subject: logSubject,
            duration: parseFloat(logDuration),
            curriculum: logCurriculum,
          };

          const { error } = await supabase
            .from("activities")
            .insert([activityData]);
          if (error) throw error;
          totalCreated++;
        }
      } else if (logActivityType === "Extracurricular") {
        for (const kid of selectedKidObjects) {
          const { error } = await supabase
            .from("extracurricular_activities")
            .insert([{
              user_id: userId,
              kid_id: kid.id,
              activity_name: logActivityName,
              date: logDate,
              notes: logNotes,
            }]);
          if (error) throw error;
          totalCreated++;
        }
      } else if (logActivityType === "Field Trip / Enrichment") {
        for (const kid of selectedKidObjects) {
          const { error } = await supabase
            .from("field_trips")
            .insert([{
              user_id: userId,
              kid_id: kid.id,
              trip_name: logTripName,
              destination: logDestination,
              date: logDate,
              notes: logNotes,
            }]);
          if (error) throw error;
          totalCreated++;
        }
      }

      const kidNames = selectedKidObjects.map((k) => k.name).join(", ");
      alert(`Activity created for ${selectedKidObjects.length} kid${selectedKidObjects.length > 1 ? "s" : ""}: ${kidNames}`);

      // Reset form and close modal
      setShowQuickLog(false);
      setLogSubject("");
      setLogDuration("");
      setLogNotes("");
      setLogCurriculum("");
      setLogActivityType("Core Subject");
      setLogActivityName("");
      setLogTripName("");
      setLogDestination("");
      setSelectedKidsForLog([]);
    } catch (error: any) {
      console.error("Error saving activity:", error);
      alert(`Failed to save activity: ${error?.message || "Unknown error"}`);
    }
  };

  // Handle opening Quick Log from calendar date
  const handleOpenQuickLogForDate = (dateStr: string) => {
    setLogDate(dateStr);
    if (kids.length > 0) {
      setQuickLogKid(kids[0]);
      setSelectedKidsForLog([kids[0].id]);
    }
    setShowQuickLog(true);
  };

  if (kids.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        <Navbar />
        <main style={{ backgroundColor: COLORS.light, flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }} className="p-4">
          <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "32px", maxWidth: "500px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <h2 style={{ color: COLORS.dark, marginBottom: "12px" }} className="text-lg sm:text-xl font-bold">
              No Kids Added Yet
            </h2>
            <p style={{ color: "#555", marginBottom: "24px" }} className="text-sm">
              Add a kid to your dashboard to see their calendar activities.
            </p>
            <Link
              href="/dashboard"
              style={{ backgroundColor: COLORS.primary }}
              className="inline-block px-6 py-2.5 text-white rounded-lg hover:opacity-90 font-medium text-sm"
            >
              Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Navbar />

      {/* Header */}
      <div style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}>
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 style={{ color: COLORS.dark }} className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
              📅 Family Calendar
            </h1>
            <p style={{ color: "#333" }} className="text-xs sm:text-sm mt-1">
              All {kids.length} kid{kids.length > 1 ? "s'" : "'s"} activities aggregated
            </p>
          </div>
          <Link
            href="/dashboard"
            style={{ color: COLORS.primary, borderColor: COLORS.primary }}
            className="px-4 sm:px-6 py-2 border rounded-lg hover:bg-gray-50 font-medium text-xs sm:text-sm whitespace-nowrap"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Calendar */}
      <main style={{ backgroundColor: COLORS.light, flex: 1, display: "flex", overflow: "hidden" }} className="relative">
        <div className="w-full overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 w-full">
            <MonthCalendar userId={userId} kids={kids} onOpenQuickLog={handleOpenQuickLogForDate} />
          </div>
        </div>
      </main>

      {/* Quick Log Modal */}
      {showQuickLog && (
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
                <div className="border rounded-lg p-3 space-y-2 bg-gray-50">
                  {kids.map((k) => (
                    <label key={k.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedKidsForLog.includes(k.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedKidsForLog([...selectedKidsForLog, k.id]);
                          } else {
                            setSelectedKidsForLog(selectedKidsForLog.filter((id) => id !== k.id));
                          }
                        }}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span style={{ color: "#1a1a2e" }} className="text-sm font-medium">
                        {k.name}
                      </span>
                    </label>
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
                  onChange={(e) => setLogActivityType(e.target.value)}
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
    </div>
  );
}
