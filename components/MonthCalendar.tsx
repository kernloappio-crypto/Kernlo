"use client";

import { useEffect, useState } from "react";
import { getActivities, getExtracurricularActivities, getFieldTrips, deleteActivity, deleteExtracurricularActivity, deleteFieldTrip, updateExtracurricularActivity, updateFieldTrip, logAttendance } from "@/lib/supabase-data";
import { supabase } from "@/lib/supabase-client";

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
  activity: "#0066cc",     // blue
  extracurricular: "#6bcf7f", // green
  "field-trip": "#ff9900", // orange
};

interface MonthCalendarProps {
  userId: string;
  kids: Kid[];
}

export default function MonthCalendar({ userId, kids }: MonthCalendarProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDayActivities, setSelectedDayActivities] = useState<Activity[]>([]);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editingActivityData, setEditingActivityData] = useState<Partial<Activity> | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQuickLogModal, setShowQuickLogModal] = useState(false);
  const [completedActivities, setCompletedActivities] = useState<Set<string>>(new Set());

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
  }, [userId, kids]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getActivitiesForDate = (dateStr: string) => {
    return activities.filter((a) => a.date === dateStr);
  };

  const monthStr = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(i).padStart(2, "0");
    days.push(`${year}-${month}-${day}`);
  }

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const handleDateClick = (dateStr: string | null) => {
    if (!dateStr) return;
    setSelectedDate(dateStr);
    setSelectedDayActivities(getActivitiesForDate(dateStr));
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivityId(activity.id);
    setEditingActivityData({ ...activity });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingActivityId || !editingActivityData) return;

    try {
      const activity = activities.find((a) => a.id === editingActivityId);
      if (!activity) return;

      if (activity.type === "activity") {
        const { error } = await supabase
          .from("activities")
          .update({
            subject: editingActivityData.name,
          })
          .eq("id", editingActivityId);

        if (error) throw error;
      } else if (activity.type === "extracurricular") {
        await updateExtracurricularActivity(editingActivityId, {
          activity_name: editingActivityData.name,
        });
      } else if (activity.type === "field-trip") {
        await updateFieldTrip(editingActivityId, {
          trip_name: editingActivityData.name,
        });
      }

      setActivities(
        activities.map((a) =>
          a.id === editingActivityId
            ? { ...a, name: editingActivityData.name || a.name }
            : a
        )
      );
      setSelectedDayActivities(
        selectedDayActivities.map((a) =>
          a.id === editingActivityId
            ? { ...a, name: editingActivityData.name || a.name }
            : a
        )
      );
      setShowEditModal(false);
      setEditingActivityId(null);
      setEditingActivityData(null);
    } catch (error) {
      console.error("Error saving activity:", error);
      alert("Failed to save activity");
    }
  };

  const handleCompleteActivity = async (activity: Activity) => {
    try {
      // Log attendance for the kid on that date
      if (activity.childId) {
        await logAttendance(userId, activity.childName, activity.date);
      }

      // Mark activity as completed
      setCompletedActivities((prev) => new Set(prev).add(activity.id));
    } catch (error) {
      console.error("Error completing activity:", error);
      alert("Failed to mark activity as completed");
    }
  };

  const handleDeleteActivity = async (activity: Activity) => {
    if (!confirm(`Delete ${activity.name}?`)) return;

    try {
      if (activity.type === "activity") {
        await deleteActivity(activity.id);
      } else if (activity.type === "extracurricular") {
        await deleteExtracurricularActivity(activity.id);
      } else if (activity.type === "field-trip") {
        await deleteFieldTrip(activity.id);
      }

      const updatedActivities = activities.filter((a) => a.id !== activity.id);
      setActivities(updatedActivities);
      setSelectedDayActivities(
        selectedDayActivities.filter((a) => a.id !== activity.id)
      );
    } catch (error) {
      console.error("Error deleting activity:", error);
      alert("Failed to delete activity");
    }
  };

  const handleOpenQuickLog = () => {
    setShowQuickLogModal(true);
  };

  return (
    <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-4 sm:p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 style={{ color: COLORS.dark }} className="text-xl sm:text-2xl font-bold">
          📅 Monthly Calendar - All Kids
        </h2>
      </div>

      {loading ? (
        <p style={{ color: "#555" }} className="text-sm">
          Loading calendar...
        </p>
      ) : (
        <div>
          {/* Calendar Header with Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevMonth}
              style={{ color: COLORS.primary }}
              className="text-lg font-bold hover:opacity-70 min-h-10 min-w-10 flex items-center justify-center rounded"
            >
              ←
            </button>
            <h3 style={{ color: COLORS.dark }} className="text-lg sm:text-xl font-bold">
              {monthStr}
            </h3>
            <button
              onClick={nextMonth}
              style={{ color: COLORS.primary }}
              className="text-lg font-bold hover:opacity-70 min-h-10 min-w-10 flex items-center justify-center rounded"
            >
              →
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                style={{ color: COLORS.dark }}
                className="text-center font-bold text-xs sm:text-sm py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid with Activity Previews */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-6">
            {days.map((dateStr, idx) => {
              const isSelected = dateStr === selectedDate;
              const dayActivities = dateStr ? getActivitiesForDate(dateStr) : [];
              const hasEvents = dayActivities.length > 0;

              return (
                <div
                  key={idx}
                  onClick={() => handleDateClick(dateStr)}
                  style={{
                    backgroundColor: isSelected
                      ? COLORS.primary
                      : hasEvents
                        ? "#f0f7ff"
                        : "#f9fafb",
                    borderColor: isSelected
                      ? COLORS.primary
                      : hasEvents
                        ? COLORS.primary
                        : "#e5e7eb",
                    cursor: dateStr ? "pointer" : "default",
                  }}
                  className="aspect-square border rounded-lg p-1 sm:p-2 hover:shadow-md transition-all flex flex-col overflow-hidden"
                >
                  {dateStr && (
                    <>
                      <span
                        style={{
                          color: isSelected ? "white" : COLORS.dark,
                        }}
                        className="text-xs sm:text-sm font-bold flex-shrink-0"
                      >
                        {new Date(dateStr).getDate()}
                      </span>
                      
                      {/* Activity previews */}
                      {dayActivities.length > 0 && (
                        <div className="flex-1 flex flex-col overflow-hidden mt-1 min-w-0">
                          {dayActivities.slice(0, 2).map((evt, i) => (
                            <div
                              key={i}
                              style={{
                                backgroundColor: ACTIVITY_COLORS[evt.type],
                                color: "white",
                              }}
                              className="text-xs rounded px-1 py-0.5 truncate flex-shrink-0 mb-0.5 line-clamp-1 leading-tight"
                              title={evt.name}
                            >
                              {evt.type === "activity"
                                ? `${evt.subject || evt.name}`
                                : evt.name}
                            </div>
                          ))}
                          {dayActivities.length > 2 && (
                            <span
                              style={{
                                color: isSelected ? "white" : "#666",
                                fontSize: "9px",
                              }}
                              className="text-center flex-shrink-0"
                            >
                              +{dayActivities.length - 2} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Activity dots (legacy view) */}
                      {dayActivities.length > 0 && dayActivities.length <= 2 && (
                        <div className="flex gap-0.5 flex-wrap mt-1">
                          {dayActivities.map((evt, i) => (
                            <div
                              key={i}
                              style={{
                                backgroundColor: ACTIVITY_COLORS[evt.type],
                              }}
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ borderTop: "1px solid #e5e7eb" }} className="pt-4">
            <p style={{ color: COLORS.dark }} className="text-sm font-bold mb-3">
              Legend:
            </p>
            <div className="flex flex-wrap gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <div style={{ backgroundColor: ACTIVITY_COLORS.activity }} className="w-3 h-3 rounded-full" />
                <span style={{ color: "#555" }}>School Activity</span>
              </div>
              <div className="flex items-center gap-2">
                <div style={{ backgroundColor: ACTIVITY_COLORS.extracurricular }} className="w-3 h-3 rounded-full" />
                <span style={{ color: "#555" }}>Extracurricular</span>
              </div>
              <div className="flex items-center gap-2">
                <div style={{ backgroundColor: ACTIVITY_COLORS["field-trip"] }} className="w-3 h-3 rounded-full" />
                <span style={{ color: "#555" }}>Field Trip</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Day Details Popup Modal */}
      {selectedDate && (
        <div style={{ backgroundColor: "rgba(0,0,0,0.5)" }} className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 sm:p-8 max-w-md w-full my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 style={{ color: COLORS.dark }} className="text-lg sm:text-xl font-bold">
                {new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </h2>
              <button
                onClick={() => {
                  setSelectedDate(null);
                  setSelectedDayActivities([]);
                }}
                style={{ color: COLORS.dark }}
                className="text-2xl hover:opacity-70 font-bold"
              >
                ✕
              </button>
            </div>

            {selectedDayActivities.length === 0 ? (
              <p style={{ color: "#555" }} className="text-sm mb-6">
                No activities logged for this day.
              </p>
            ) : (
              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                {selectedDayActivities.map((activity, idx) => {
                  const isCompleted = completedActivities.has(activity.id);
                  return (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: isCompleted ? "#e8f5e9" : "#f9fafb",
                        borderLeft: `4px solid ${ACTIVITY_COLORS[activity.type]}`,
                      }}
                      className="p-3 rounded text-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p style={{ color: COLORS.dark }} className="font-semibold">
                            {activity.childName}
                          </p>
                          <p style={{ color: "#555" }}>
                            {activity.type === "activity"
                              ? `${activity.subject} (${activity.duration}h)`
                              : activity.name}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                          <button
                            onClick={() => handleCompleteActivity(activity)}
                            style={{
                              color: isCompleted ? "#2e7d32" : "#0066cc",
                              borderColor: isCompleted ? "#2e7d32" : "#0066cc",
                              backgroundColor: isCompleted ? "#c8e6c9" : "transparent",
                            }}
                            className="px-2 py-1 border rounded text-xs hover:opacity-80 font-medium"
                            title="Mark as completed"
                          >
                            {isCompleted ? "✓ Done" : "✓"}
                          </button>
                          <button
                            onClick={() => handleEditActivity(activity)}
                            style={{ color: "#0066cc", borderColor: "#0066cc" }}
                            className="px-2 py-1 border rounded text-xs hover:bg-blue-50 font-medium"
                            title="Edit activity"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => handleDeleteActivity(activity)}
                            style={{ color: "#dc2626", borderColor: "#dc2626" }}
                            className="px-2 py-1 border rounded text-xs hover:bg-red-50 font-medium"
                            title="Delete activity"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-2 sm:gap-3 flex-col">
              <button
                onClick={handleOpenQuickLog}
                style={{ backgroundColor: COLORS.primary }}
                className="w-full px-4 py-2.5 text-white font-semibold rounded-lg hover:opacity-90 text-sm"
              >
                + Add Activity
              </button>
              <button
                onClick={() => {
                  setSelectedDate(null);
                  setSelectedDayActivities([]);
                }}
                style={{ color: COLORS.dark, borderColor: "#d1d5db" }}
                className="w-full px-4 py-2.5 border font-semibold rounded-lg hover:bg-gray-50 text-sm"
              >
                Close
              </button>
            </div>

            {/* Edit Modal */}
            {showEditModal && editingActivityData && (
              <div style={{ backgroundColor: "rgba(0,0,0,0.5)" }} className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-y-auto">
                <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 sm:p-8 max-w-md w-full my-8">
                  <h2 style={{ color: COLORS.dark }} className="text-lg sm:text-xl font-bold mb-4">
                    Edit Activity
                  </h2>

                  <div className="space-y-4 mb-6">
                    <div>
                      <label style={{ color: COLORS.dark }} className="block text-sm font-semibold mb-2">
                        Activity Name
                      </label>
                      <input
                        type="text"
                        value={editingActivityData.name || ""}
                        onChange={(e) =>
                          setEditingActivityData({
                            ...editingActivityData,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        placeholder="Activity name"
                      />
                    </div>

                    <div>
                      <label style={{ color: COLORS.dark }} className="block text-sm font-semibold mb-2">
                        Child
                      </label>
                      <input
                        type="text"
                        value={editingActivityData.childName || ""}
                        disabled
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-100"
                      />
                    </div>

                    <div>
                      <label style={{ color: COLORS.dark }} className="block text-sm font-semibold mb-2">
                        Date
                      </label>
                      <input
                        type="date"
                        value={editingActivityData.date || ""}
                        disabled
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-100"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 flex-col">
                    <button
                      onClick={handleSaveEdit}
                      style={{ backgroundColor: COLORS.primary }}
                      className="w-full px-4 py-2.5 text-white font-semibold rounded-lg hover:opacity-90 text-sm"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingActivityId(null);
                        setEditingActivityData(null);
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

            {/* Quick Log Modal */}
            {showQuickLogModal && (
              <div style={{ backgroundColor: "rgba(0,0,0,0.5)" }} className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-y-auto">
                <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 sm:p-8 max-w-md w-full my-8">
                  <h2 style={{ color: COLORS.dark }} className="text-lg sm:text-xl font-bold mb-4">
                    Add Activity for {selectedDate ? new Date(selectedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Selected Date"}
                  </h2>
                  <p style={{ color: "#555" }} className="text-sm mb-4">
                    Quick log form - navigate to the child's dashboard for full activity logging.
                  </p>

                  <div className="flex gap-2 flex-col">
                    <button
                      onClick={() => setShowQuickLogModal(false)}
                      style={{ backgroundColor: COLORS.primary }}
                      className="w-full px-4 py-2.5 text-white font-semibold rounded-lg hover:opacity-90 text-sm"
                    >
                      Open Activity Logger
                    </button>
                    <button
                      onClick={() => setShowQuickLogModal(false)}
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
        </div>
      )}
    </div>
  );
}
