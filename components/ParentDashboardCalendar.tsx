"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import Link from "next/link";
import {
  getActivities,
  getExtracurricularActivities,
  getFieldTrips,
} from "@/lib/supabase-data";

interface Activity {
  id: string;
  date: string;
  type: "activity" | "extracurricular" | "field-trip";
  childName: string;
  childId?: string;
  name: string;
  subject?: string;
  duration?: number;
  platform?: string;
  details?: string;
}

interface Kid {
  id: string;
  name: string;
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

const ACTIVITY_COLORS = {
  subject: "#0066cc", // blue
  extracurricular: "#66bb6a", // green
  "field-trip": "#ff9900", // orange
};

interface ParentDashboardCalendarProps {
  userId: string;
  kids: Kid[];
  refreshCounter?: number;
}

export default function ParentDashboardCalendar({ userId, kids, refreshCounter = 0 }: ParentDashboardCalendarProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editActivityId, setEditActivityId] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [selectedLogDate, setSelectedLogDate] = useState("");
  const [selectedLogKid, setSelectedLogKid] = useState<Kid | null>(null);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        if (!userId || !kids.length) {
          setLoading(false);
          return;
        }

        const allActivities: Activity[] = [];

        // Load school activities
        try {
          const schoolActivities = await getActivities(userId);
          schoolActivities.forEach((a: any) => {
            const kid = kids.find((k) => k.name === a.child_name);
            allActivities.push({
              id: a.id,
              date: a.date,
              type: "activity",
              childName: a.child_name,
              childId: kid?.id,
              name: a.subject,
              subject: a.subject,
              duration: a.duration,
              platform: a.platform,
              details: `${(a.duration / 60).toFixed(1)}h via ${a.platform}`,
            });
          });
        } catch (err) {
          console.error("Error loading school activities:", err);
        }

        // Load extracurricular for each kid
        for (const kid of kids) {
          try {
            const extraActivities = await getExtracurricularActivities(userId, kid.id);
            extraActivities.forEach((a: any) => {
              allActivities.push({
                id: a.id,
                date: a.date,
                type: "extracurricular",
                childName: kid.name,
                childId: kid.id,
                name: a.activity_name,
                details: a.notes,
              });
            });
          } catch (err) {
            console.error(`Error loading extracurricular for ${kid.name}:`, err);
          }
        }

        // Load field trips for each kid
        for (const kid of kids) {
          try {
            const trips = await getFieldTrips(userId, kid.id);
            trips.forEach((t: any) => {
              allActivities.push({
                id: t.id,
                date: t.date,
                type: "field-trip",
                childName: kid.name,
                childId: kid.id,
                name: t.trip_name,
                details: t.destination,
              });
            });
          } catch (err) {
            console.error(`Error loading field trips for ${kid.name}:`, err);
          }
        }

        setActivities(allActivities);
        setLoading(false);
      } catch (err) {
        console.error("Error loading activities:", err);
        setLoading(false);
      }
    };

    loadActivities();
  }, [userId, kids, refreshCounter]);

  // Subscribe to real-time activity changes
  useEffect(() => {
    if (!userId || !kids.length) return;

    console.log('📡 ParentCalendar: Setting up real-time activity subscription...');

    const reloadActivities = async () => {
      try {
        if (!userId || !kids.length) {
          return;
        }

        const allActivities: Activity[] = [];

        // Load school activities
        try {
          const schoolActivities = await getActivities(userId);
          schoolActivities.forEach((a: any) => {
            const kid = kids.find((k) => k.name === a.child_name);
            allActivities.push({
              id: a.id,
              date: a.date,
              type: "activity",
              childName: a.child_name,
              childId: kid?.id,
              name: a.subject,
              subject: a.subject,
              duration: a.duration,
              platform: a.platform,
              details: `${(a.duration / 60).toFixed(1)}h via ${a.platform}`,
            });
          });
        } catch (err) {
          console.error("Error loading school activities:", err);
        }

        // Load extracurricular for each kid
        for (const kid of kids) {
          try {
            const extraActivities = await getExtracurricularActivities(userId, kid.id);
            extraActivities.forEach((a: any) => {
              allActivities.push({
                id: a.id,
                date: a.date,
                type: "extracurricular",
                childName: kid.name,
                childId: kid.id,
                name: a.activity_name,
                details: a.notes,
              });
            });
          } catch (err) {
            console.error(`Error loading extracurricular for ${kid.name}:`, err);
          }
        }

        // Load field trips for each kid
        for (const kid of kids) {
          try {
            const trips = await getFieldTrips(userId, kid.id);
            trips.forEach((t: any) => {
              allActivities.push({
                id: t.id,
                date: t.date,
                type: "field-trip",
                childName: kid.name,
                childId: kid.id,
                name: t.trip_name,
                details: t.destination,
              });
            });
          } catch (err) {
            console.error(`Error loading field trips for ${kid.name}:`, err);
          }
        }

        setActivities(allActivities);
        console.log('✅ ParentCalendar: Activities reloaded via real-time event');
      } catch (err) {
        console.error("Error reloading activities on real-time event:", err);
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
          // Check if status changed to 'confirmed' (activity approved)
          if (payload.new?.status === 'confirmed' && payload.old?.status === 'pending') {
            console.log('📡 ParentCalendar: Activity approved (status changed to confirmed)');
            reloadActivities();
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId, kids]);

  // Get 30 days starting from today
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
    return activities.filter((a) => a.date === dateStr);
  };

  const getKidsWithActivitiesOnDate = (dateStr: string) => {
    const dateActivities = getActivitiesForDate(dateStr);
    const uniqueKids = new Set(dateActivities.map((a) => a.childName));
    return Array.from(uniqueKids);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "activity":
        return ACTIVITY_COLORS.subject;
      case "extracurricular":
        return ACTIVITY_COLORS.extracurricular;
      case "field-trip":
        return ACTIVITY_COLORS["field-trip"];
      default:
        return COLORS.dark;
    }
  };

  const getTypeEmoji = (type: string) => {
    switch (type) {
      case "activity":
        return "📚";
      case "extracurricular":
        return "🎭";
      case "field-trip":
        return "🚌";
      default:
        return "📝";
    }
  };

  const getActivityDisplayName = (activity: Activity) => {
    if (activity.type === "activity") {
      return `${activity.subject} (${activity.duration ? (activity.duration / 60).toFixed(1) : "0"}h)`;
    }
    return activity.name;
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm("Delete this activity?")) return;

    try {
      const { error } = await supabase
        .from("activities")
        .delete()
        .eq("id", activityId);

      if (error) {
        alert("Error deleting activity: " + error.message);
        return;
      }

      setActivities(activities.filter((a) => a.id !== activityId));
      setShowEditModal(false);
      alert("Activity deleted!");
    } catch (err) {
      alert("Failed to delete activity");
    }
  };

  const handleEditNotes = async () => {
    if (!editActivityId) return;

    try {
      const { error } = await supabase
        .from("activities")
        .update({ notes: editNotes })
        .eq("id", editActivityId);

      if (error) {
        alert("Error updating activity: " + error.message);
        return;
      }

      setActivities(
        activities.map((a) =>
          a.id === editActivityId ? { ...a, details: editNotes } : a
        )
      );
      setShowEditModal(false);
      alert("Activity updated!");
    } catch (err) {
      alert("Failed to update activity");
    }
  };

  const days = get30Days();

  return (
    <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-4 sm:p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 style={{ color: COLORS.dark }} className="text-xl sm:text-2xl font-bold">
          📅 30-Day Calendar
        </h2>
        <button
          onClick={() => {
            setSelectedLogKid(kids[0] || null);
            setSelectedLogDate("");
            setShowQuickLog(true);
          }}
          style={{ backgroundColor: COLORS.primary }}
          className="px-3 sm:px-4 py-2 text-white rounded-lg hover:opacity-90 font-medium text-xs sm:text-sm whitespace-nowrap"
        >
          + Log Activity
        </button>
      </div>

      {loading ? (
        <p style={{ color: "#555" }} className="text-sm">
          Loading activities...
        </p>
      ) : activities.length === 0 ? (
        <p style={{ color: "#555" }} className="text-sm">
          No activities logged yet. Click "+ Log Activity" to get started!
        </p>
      ) : (
        <div className="space-y-3">
          {days.map((dateStr) => {
            const dateActivities = getActivitiesForDate(dateStr);
            if (dateActivities.length === 0) return null;

            const dateObj = new Date(dateStr);
            const dateDisplay = dateObj.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            });

            return (
              <div
                key={dateStr}
                style={{ backgroundColor: "#f9fafb", borderRadius: "8px" }}
                className="p-4 border border-gray-200"
              >
                <h3 style={{ color: COLORS.dark }} className="text-sm font-bold mb-3">
                  {dateDisplay}
                </h3>
                <div className="space-y-2">
                  {dateActivities.map((activity) => (
                    <div
                      key={activity.id}
                      style={{
                        backgroundColor: "white",
                        borderLeft: `4px solid ${getTypeColor(activity.type)}`,
                      }}
                      className="p-3 rounded text-sm flex items-start justify-between hover:shadow-sm transition-shadow cursor-pointer"
                      onClick={() => {
                        setSelectedActivity(activity);
                        setEditActivityId(activity.id);
                        setEditNotes(activity.details || "");
                        setShowEditModal(true);
                      }}
                    >
                      <div className="flex items-start gap-2 flex-1">
                        <span className="text-lg flex-shrink-0">{getTypeEmoji(activity.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p style={{ color: COLORS.dark }} className="font-semibold">
                            {activity.childName}
                          </p>
                          <p style={{ color: "#555" }} className="text-xs truncate">
                            {getActivityDisplayName(activity)}
                          </p>
                          {activity.details && activity.type !== "activity" && (
                            <p style={{ color: "#999" }} className="text-xs mt-1 truncate">
                              {activity.details}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
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
                  Child
                </label>
                <input
                  type="text"
                  value={selectedActivity.childName}
                  disabled
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-100"
                />
              </div>

              <div>
                <label style={{ color: COLORS.dark }} className="block text-sm font-semibold mb-2">
                  Activity
                </label>
                <input
                  type="text"
                  value={getActivityDisplayName(selectedActivity)}
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

      {/* Quick Log Modal */}
      {showQuickLog && (
        <div style={{ backgroundColor: "rgba(0,0,0,0.5)" }} className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 max-w-md w-full my-8">
            <h2 style={{ color: COLORS.dark }} className="text-lg font-bold mb-4">
              Log Activity
            </h2>

            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              <div>
                <label style={{ color: COLORS.dark }} className="block text-sm font-semibold mb-2">
                  Child
                </label>
                <select
                  value={selectedLogKid?.id || ""}
                  onChange={(e) => {
                    const kid = kids.find((k) => k.id === e.target.value);
                    setSelectedLogKid(kid || null);
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
                <label style={{ color: COLORS.dark }} className="block text-sm font-semibold mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={selectedLogDate}
                  onChange={(e) => setSelectedLogDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label style={{ color: COLORS.dark }} className="block text-sm font-semibold mb-2">
                  Subject
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">Select subject</option>
                  {[
                    "Math",
                    "English",
                    "Science",
                    "History",
                    "Social Studies",
                    "Arts",
                    "Physical Education",
                    "Other",
                  ].map((s) => (
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
                  placeholder="Khan Academy, IXL, etc."
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label style={{ color: COLORS.dark }} className="block text-sm font-semibold mb-2">
                  Activity Type
                </label>
                <select className="w-full px-3 py-2 border rounded-lg text-sm">
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
                  placeholder="Lesson details..."
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2 flex-col">
              <button
                onClick={() => setShowQuickLog(false)}
                style={{ backgroundColor: COLORS.primary }}
                className="w-full px-4 py-2.5 text-white font-semibold rounded-lg hover:opacity-90 text-sm"
              >
                Save Activity
              </button>
              <button
                onClick={() => setShowQuickLog(false)}
                style={{ color: COLORS.dark, borderColor: "#d1d5db" }}
                className="w-full px-4 py-2.5 border font-semibold rounded-lg hover:bg-gray-50 text-sm"
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

