"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import Navbar from "@/components/Navbar";
import { getActivities, getGoals, getExtracurricularActivities, getFieldTrips } from "@/lib/supabase-data";

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

interface Goal {
  id: string;
  child_name: string;
  subject: string;
  monthly_hours: number;
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

const ACTIVITY_COLORS = {
  subject: "#0066cc", // blue
  extracurricular: "#66bb6a", // green
  "field-trip": "#ff9900", // orange
};

export default function Kid30DayCalendarPage() {
  const params = useParams();
  const router = useRouter();
  const kidId = params.id as string;

  const [userId, setUserId] = useState("");
  const [kid, setKid] = useState<Kid | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [extracurricularActivities, setExtracurricularActivities] = useState<any[]>([]);
  const [fieldTrips, setFieldTrips] = useState<any[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modal states
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [logSubject, setLogSubject] = useState("");
  const [logDuration, setLogDuration] = useState("");
  const [logPlatform, setLogPlatform] = useState("");
  const [logNotes, setLogNotes] = useState("");
  const [logCurriculum, setLogCurriculum] = useState("");
  const [logActivityType, setLogActivityType] = useState("Core Subject");

  const [showEditModal, setShowEditModal] = useState(false);
  const [editActivityId, setEditActivityId] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  useEffect(() => {
    const initializeUser = async () => {
      try {
        // Restore auth context
        const sessionStr = localStorage.getItem("kernlo_session");
        if (sessionStr) {
          try {
            const session = JSON.parse(sessionStr);
            await supabase.auth.setSession(session);
          } catch (e) {
            console.log("Could not restore session");
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
        }

        // Load activities
        try {
          const activitiesData = await getActivities(user.id);
          const kidActivities = activitiesData.filter(
            (a: any) => a.child_name === kidData?.name
          );
          setActivities(kidActivities as Activity[]);
        } catch (err) {
          console.error("Error loading activities:", err);
          setActivities([]);
        }

        // Load extracurricular activities
        try {
          const extraData = await getExtracurricularActivities(user.id, kidId);
          setExtracurricularActivities(extraData || []);
        } catch (err) {
          console.error("Error loading extracurricular activities:", err);
          setExtracurricularActivities([]);
        }

        // Load field trips
        try {
          const tripsData = await getFieldTrips(user.id, kidId);
          setFieldTrips(tripsData || []);
        } catch (err) {
          console.error("Error loading field trips:", err);
          setFieldTrips([]);
        }

        // Load goals
        try {
          const goalsData = await getGoals(user.id, kidData?.name);
          setGoals(goalsData || []);
        } catch (err) {
          console.error("Error loading goals:", err);
          setGoals([]);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error initializing:", err);
        setLoading(false);
      }
    };

    initializeUser();
  }, [kidId, router]);

  const get30Days = () => {
    const days = [];
    const startDate = new Date(currentDate);
    startDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      days.push(`${year}-${month}-${day}`);
    }
    return days;
  };

  const getActivitiesForDate = (dateStr: string) => {
    const schoolActivities = activities.filter((a) => a.date === dateStr && a.child_name === kid?.name);
    const extraActivities = extracurricularActivities.filter((a) => a.date === dateStr);
    const trips = fieldTrips.filter((t) => t.date === dateStr);
    
    const combined = [
      ...schoolActivities.map((a) => ({
        ...a,
        type: 'school',
        displayName: a.subject,
        duration: a.duration,
      })),
      ...extraActivities.map((e) => ({
        ...e,
        type: 'extracurricular',
        displayName: e.activity_name,
        duration: e.duration || 0,
      })),
      ...trips.map((t) => ({
        ...t,
        type: 'field-trip',
        displayName: t.trip_name,
        duration: t.duration || 0,
      })),
    ];
    
    return combined;
  };

  const getTotalHoursForDate = (dateStr: string) => {
    return getActivitiesForDate(dateStr).reduce((sum, a) => sum + (a.duration || 0), 0);
  };

  const getActivityTypeColor = (activityType?: string) => {
    if (!activityType || activityType === "Core Subject") {
      return ACTIVITY_COLORS.subject;
    } else if (activityType === "Extracurricular") {
      return ACTIVITY_COLORS.extracurricular;
    } else if (activityType === "Field Trip / Enrichment") {
      return ACTIVITY_COLORS["field-trip"];
    }
    return COLORS.dark;
  };

  async function handleLogActivity() {
    if (!logSubject || !logDuration || !selectedDate || !kid) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      // Log the activity
      const { data, error } = await supabase
        .from("activities")
        .insert({
          user_id: userId,
          child_name: kid.name,
          subject: logSubject,
          duration: parseFloat(logDuration),
          platform: logPlatform || "Other",
          curriculum: logCurriculum || null,
          activity_type: logActivityType,
          date: selectedDate,
          notes: logNotes,
        })
        .select();

      if (error) {
        alert("Error: " + error.message);
        return;
      }

      if (data) {
        setActivities([...activities, ...data]);
      }

      // Log attendance for this date
      try {
        const { data: existingAttendance } = await supabase
          .from("attendance")
          .select("id")
          .eq("user_id", userId)
          .eq("child_name", kid.name)
          .eq("schooling_date", selectedDate)
          .single();

        if (!existingAttendance) {
          await supabase.from("attendance").insert({
            user_id: userId,
            child_name: kid.name,
            schooling_date: selectedDate,
          });
        }
      } catch (err) {
        // Attendance might already exist or other error
        console.log("Attendance logging handled");
      }

      // Reset form
      setLogSubject("");
      setLogDuration("");
      setLogPlatform("");
      setLogNotes("");
      setLogCurriculum("");
      setLogActivityType("Core Subject");
      setSelectedDate("");
      setShowLogModal(false);
      alert("Activity logged and attendance marked!");
    } catch (err) {
      console.error("Error logging activity:", err);
      alert("Failed to log activity");
    }
  }

  async function handleDeleteActivity(activityId: string) {
    if (!confirm("Delete this activity?")) return;

    try {
      const { error } = await supabase
        .from("activities")
        .delete()
        .eq("id", activityId);

      if (error) {
        alert("Error: " + error.message);
        return;
      }

      setActivities(activities.filter((a) => a.id !== activityId));
      setShowEditModal(false);
      alert("Activity deleted!");
    } catch (err) {
      alert("Failed to delete activity");
    }
  }

  async function handleEditNotes() {
    if (!editActivityId) return;

    try {
      const { error } = await supabase
        .from("activities")
        .update({ notes: editNotes })
        .eq("id", editActivityId);

      if (error) {
        alert("Error: " + error.message);
        return;
      }

      setActivities(
        activities.map((a) =>
          a.id === editActivityId ? { ...a, notes: editNotes } : a
        )
      );
      setShowEditModal(false);
      alert("Activity updated!");
    } catch (err) {
      alert("Failed to update activity");
    }
  }

  const days = get30Days();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: COLORS.light }}>
        <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px" }}>
          <p style={{ color: COLORS.dark }}>Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (!kid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: COLORS.light }}>
        <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px" }}>
          <p style={{ color: COLORS.dark }}>Kid not found</p>
          <Link href="/dashboard" style={{ color: COLORS.primary }} className="text-sm mt-4 block">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Navbar />

      {/* Header */}
      <div style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb" }} className="sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Link href={`/dashboard/${kid.id}`} style={{ color: COLORS.primary }} className="text-sm font-medium mb-2 block">
              ← Back to {kid.name}
            </Link>
            <h1 style={{ color: COLORS.dark }} className="text-2xl sm:text-3xl font-bold">
              📅 {kid.name}'s 30-Day Calendar
            </h1>
          </div>
          <button
            onClick={() => {
              setSelectedDate(new Date().toISOString().split("T")[0]);
              setShowLogModal(true);
            }}
            style={{ backgroundColor: COLORS.primary }}
            className="px-4 sm:px-6 py-2.5 text-white font-medium rounded-lg hover:opacity-90 text-sm whitespace-nowrap min-h-11"
          >
            + Log Activity
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main style={{ backgroundColor: COLORS.light, flex: 1, overflow: "y-auto" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {activities.length === 0 ? (
            <div
              style={{ backgroundColor: "white", borderRadius: "12px" }}
              className="p-8 text-center border border-gray-200"
            >
              <p style={{ color: "#555" }} className="text-sm">
                No activities logged yet. Click "+ Log Activity" to start!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {days.map((dateStr) => {
                const dateActivities = getActivitiesForDate(dateStr);
                if (dateActivities.length === 0) return null;

                // TIMEZONE FIX: Parse date string directly to avoid UTC conversion
                const [year, month, day] = dateStr.split('-').map(Number);
                // Create date object from parts (no timezone parsing)
                const dateObj = new Date(year, month - 1, day);
                const dateDisplay = dateObj.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                });

                const totalHours = getTotalHoursForDate(dateStr);

                return (
                  <div
                    key={dateStr}
                    style={{ backgroundColor: "white", borderRadius: "12px" }}
                    className="p-4 sm:p-6 border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 style={{ color: COLORS.dark }} className="text-lg sm:text-xl font-bold">
                          {dateDisplay}
                        </h3>
                        <p style={{ color: "#666" }} className="text-sm mt-1">
                          Total: <span style={{ color: COLORS.primary }} className="font-semibold">{totalHours}h</span>
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedDate(dateStr);
                          setShowLogModal(true);
                        }}
                        style={{ backgroundColor: COLORS.secondary }}
                        className="px-3 py-2 text-white rounded-lg hover:opacity-90 font-medium text-xs sm:text-sm whitespace-nowrap"
                      >
                        + Add
                      </button>
                    </div>

                    <div className="space-y-2">
                      {dateActivities.map((activity) => {
                        // Determine color and icon based on activity type
                        let typeColor = ACTIVITY_COLORS.subject;
                        let typeIcon = "📖";
                        let typeLabel = "School";
                        
                        if (activity.type === 'extracurricular') {
                          typeColor = ACTIVITY_COLORS.extracurricular;
                          typeIcon = "🎭";
                          typeLabel = "Extracurricular";
                        } else if (activity.type === 'field-trip') {
                          typeColor = ACTIVITY_COLORS["field-trip"];
                          typeIcon = "🚌";
                          typeLabel = "Field Trip";
                        }

                        return (
                          <div
                            key={activity.id}
                            style={{
                              backgroundColor: "#f9fafb",
                              borderLeft: `4px solid ${typeColor}`,
                            }}
                            className="p-3 sm:p-4 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow cursor-pointer"
                            onClick={() => {
                              setSelectedActivity(activity);
                              setEditActivityId(activity.id);
                              setEditNotes(activity.notes || "");
                              setShowEditModal(true);
                            }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p style={{ color: COLORS.dark }} className="text-sm sm:text-base font-semibold">
                                  {activity.displayName || activity.subject}
                                </p>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1 text-xs text-gray-600">
                                  {activity.duration > 0 && <span>⏱️ {activity.duration}m</span>}
                                  {activity.platform && <span>💻 {activity.platform}</span>}
                                  {activity.curriculum && <span>📚 {activity.curriculum}</span>}
                                  {activity.destination && <span>📍 {activity.destination}</span>}
                                </div>
                                {activity.notes && (
                                  <p style={{ color: "#666" }} className="text-xs mt-2 italic">
                                    {activity.notes}
                                  </p>
                                )}
                              </div>
                              <div
                                style={{
                                  backgroundColor: typeColor,
                                  color: "white",
                                }}
                                className="ml-2 px-2 py-1 rounded text-xs font-semibold flex-shrink-0"
                              >
                                {typeIcon}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Log Activity Modal */}
      {showLogModal && (
        <div style={{ backgroundColor: "rgba(0,0,0,0.5)" }} className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 max-w-md w-full my-8">
            <h2 style={{ color: COLORS.dark }} className="text-lg sm:text-xl font-bold mb-6">
              Log Activity for {kid.name}
            </h2>

            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              <div>
                <label style={{ color: COLORS.dark }} className="block text-sm font-semibold mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label style={{ color: COLORS.dark }} className="block text-sm font-semibold mb-2">
                  Subject *
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
                  Duration (hours) *
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
                  Curriculum/Resource (optional)
                </label>
                <input
                  type="text"
                  value={logCurriculum}
                  onChange={(e) => setLogCurriculum(e.target.value)}
                  placeholder="e.g., Math Mammoth, Khan Academy, Outschool"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label style={{ color: COLORS.dark }} className="block text-sm font-semibold mb-2">
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

            <div className="flex gap-2 flex-col">
              <button
                onClick={handleLogActivity}
                style={{ backgroundColor: COLORS.primary }}
                className="w-full px-4 py-2.5 text-white font-semibold rounded-lg hover:opacity-90 text-sm"
              >
                Save Activity
              </button>
              <button
                onClick={() => {
                  setShowLogModal(false);
                  setLogSubject("");
                  setLogDuration("");
                  setLogPlatform("");
                  setLogNotes("");
                  setLogCurriculum("");
                  setLogActivityType("Core Subject");
                  setSelectedDate("");
                }}
                style={{ color: COLORS.dark, borderColor: "#d1d5db" }}
                className="w-full px-4 py-2.5 border font-semibold rounded-lg hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Activity Modal */}
      {showEditModal && selectedActivity && (
        <div style={{ backgroundColor: "rgba(0,0,0,0.5)" }} className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 max-w-md w-full">
            <h2 style={{ color: COLORS.dark }} className="text-lg font-bold mb-4">
              Edit Activity
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label style={{ color: COLORS.dark }} className="block text-sm font-semibold mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={selectedActivity.subject}
                  disabled
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-100"
                />
              </div>

              <div>
                <label style={{ color: COLORS.dark }} className="block text-sm font-semibold mb-2">
                  Duration
                </label>
                <input
                  type="text"
                  value={`${(selectedActivity.duration / 60).toFixed(1)}h (${selectedActivity.duration}m)`}
                  disabled
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-100"
                />
              </div>

              <div>
                <label style={{ color: COLORS.dark }} className="block text-sm font-semibold mb-2">
                  Notes
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2 flex-col">
              <button
                onClick={handleEditNotes}
                style={{ backgroundColor: COLORS.primary }}
                className="w-full px-4 py-2.5 text-white font-semibold rounded-lg hover:opacity-90 text-sm"
              >
                Save Notes
              </button>
              <button
                onClick={() => handleDeleteActivity(selectedActivity.id)}
                style={{ backgroundColor: "#ff6b6b" }}
                className="w-full px-4 py-2.5 text-white font-semibold rounded-lg hover:opacity-90 text-sm"
              >
                Delete Activity
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                style={{ color: COLORS.dark, borderColor: "#d1d5db" }}
                className="w-full px-4 py-2.5 border font-semibold rounded-lg hover:bg-gray-50 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
