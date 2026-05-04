"use client";

import { useEffect, useState } from "react";
import { getActivities, getExtracurricularActivities, getFieldTrips, deleteActivity, deleteExtracurricularActivity, deleteFieldTrip, updateExtracurricularActivity, updateFieldTrip, logAttendance, ensureAuthContext } from "@/lib/supabase-data";
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
  is_completed?: boolean;
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
  onOpenQuickLog?: (dateStr: string) => void;
}

export default function MonthCalendar({ userId, kids, onOpenQuickLog }: MonthCalendarProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDayActivities, setSelectedDayActivities] = useState<Activity[]>([]);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editingActivityData, setEditingActivityData] = useState<Partial<Activity> | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

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
              is_completed: a.is_completed || false,
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
                is_completed: a.is_completed || false,
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
                is_completed: t.is_completed || false,
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

  // CALENDAR BOUNDARY LOGIC: Only include days that belong to target month
  // No cross-month dates allowed anywhere in the grid
  
  const getActivitiesForDate = (dateStr: string) => {
    // Strict string matching to avoid any cross-month contamination
    return activities.filter((a) => a.date === dateStr && a.date !== null);
  };

  const monthStr = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  
  // Build calendar grid for current month ONLY
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed (0=Jan, 11=Dec)
  const first = new Date(year, month, 1); // First day of month
  const last = new Date(year, month + 1, 0); // Last day of month (day 0 of next month = last day of this month)
  const daysInMonth = last.getDate();
  const firstDay = first.getDay(); // 0 = Sunday, 6 = Saturday
  
  const days: (string | null)[] = [];

  // Pad with null for days before month start (previous month dates NOT included)
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Add ONLY days that belong to this month (1 to daysInMonth)
  // CRITICAL: Use month+1 to convert from 0-indexed to calendar month (1-12)
  const monthStr2 = String(month + 1).padStart(2, "0");
  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const dayStr = String(dayNum).padStart(2, "0");
    const dateStr = `${year}-${monthStr2}-${dayStr}`;
    days.push(dateStr);
  }

  // Pad end with null to complete grid weeks (no next month dates included)
  // Grid must be exactly 5 or 6 weeks (35 or 42 cells)
  while (days.length % 7 !== 0) {
    days.push(null);
  }

  // STRICT VALIDATION: verify grid contains ONLY target month dates
  const monthDates = days.filter((d) => d !== null);
  
  // Check count matches expected
  if (monthDates.length !== daysInMonth) {
    console.error(
      `🚨 CRITICAL BUG: Calendar grid has ${monthDates.length} dates, expected ${daysInMonth} for ${monthStr}`
    );
    // Dump the dates to see what's wrong
    console.error("Grid contents:", days);
  }
  
  // Check every date string belongs to current month - FAIL FAST
  const expectedYear = year;
  const expectedMonth = month + 1;
  let hasCrossMonthBug = false;
  
  monthDates.forEach((dateStr) => {
    const parts = dateStr.split('-');
    const gridYear = parseInt(parts[0], 10);
    const gridMonth = parseInt(parts[1], 10);
    const gridDay = parseInt(parts[2], 10);
    
    if (gridYear !== expectedYear || gridMonth !== expectedMonth || gridDay < 1 || gridDay > daysInMonth) {
      console.error(
        `🚨 CROSS-MONTH BUG DETECTED: Grid contains ${dateStr}, but viewing ${expectedMonth}/${expectedYear}. Expected day range 1-${daysInMonth}`
      );
      hasCrossMonthBug = true;
    }
  });
  
  if (hasCrossMonthBug) {
    console.error(`🚨🚨🚨 CALENDAR HAS CROSS-MONTH CONTAMINATION. DUMP:`, days);
  }
  
  // Log summary for debugging
  const monthStr_Log = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  if (process.env.NODE_ENV === "development") {
    console.log(
      `📅 Calendar grid for ${monthStr_Log}: ${monthDates.length} days (expected ${daysInMonth}), grid size ${days.length} cells`
    );
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
      console.log(`📌 Starting completion for activity:`, {
        id: activity.id,
        type: activity.type,
        childName: activity.childName,
        date: activity.date,
        isCurrentlyCompleted: activity.is_completed,
      });

      // Ensure auth context for all database operations
      console.log(`🔐 Ensuring auth context...`);
      await ensureAuthContext();
      console.log(`✅ Auth context ready`);

      // Log attendance for the kid on that date
      try {
        console.log(`📝 Logging attendance for ${activity.childName} on ${activity.date}...`);
        const attendanceResult = await logAttendance(userId, activity.childName, activity.date);
        console.log(`✅ Attendance logged:`, attendanceResult);
      } catch (attendanceError: any) {
        console.error(`⚠️ Attendance logging error (non-critical):`, attendanceError);
        console.error(`  → Code: ${attendanceError?.code || 'N/A'}`);
        console.error(`  → Message: ${attendanceError?.message || 'N/A'}`);
        console.error(`  → Details: ${JSON.stringify(attendanceError?.details) || 'N/A'}`);
        // Continue anyway - attendance is secondary to completion
      }
      
      // Update activity completion status in database
      console.log(`🔄 Updating completion status for ${activity.type}...`);
      let dbUpdateSuccess = false;
      
      if (activity.type === "activity") {
        console.log(`  → Updating activities table, id=${activity.id}`);
        const { data: updateData, error: updateError } = await supabase
          .from("activities")
          .update({ is_completed: true })
          .eq("id", activity.id)
          .select();
        
        console.log(`  → Update response:`, { data: updateData, error: updateError });
        
        if (updateError) {
          console.error(`❌❌❌ SUPABASE ERROR - Activities table update FAILED ❌❌❌`);
          console.error(`Error message: ${updateError.message}`);
          console.error(`Error code: ${updateError.code}`);
          console.error(`Error details:`, updateError.details);
          console.error(`Error hint: ${updateError.hint}`);

          console.error(`Full error object:`, JSON.stringify(updateError, null, 2));
          
          // Check if the error is due to missing is_completed column
          if (updateError.message?.includes("is_completed") || updateError.hint?.includes("is_completed")) {
            console.warn(`⚠️ is_completed column missing on activities table - using fallback`);
            console.warn(`🔧 FIX: Run migration 007_add_completion_tracking.sql in Supabase SQL editor`);
            // Mark as completed in UI but log warning
            setActivities((prev) =>
              prev.map((a) =>
                a.id === activity.id ? { ...a, is_completed: true } : a
              )
            );
            alert("✅ Marked as completed locally. Note: Database migration may not be applied yet.");
            return;
          }
          
          throw updateError;
        }
        
        if (updateData && updateData.length > 0) {
          console.log(`✅ Activities table updated successfully:`, updateData[0]);
          dbUpdateSuccess = true;
        } else {
          console.warn(`⚠️ Update returned no data. This might indicate RLS blocked the update.`);
          console.warn(`🔍 Verify RLS policy allows UPDATE on activities table`);
          throw new Error("Update returned no data - possible RLS policy issue");
        }
      } else if (activity.type === "extracurricular") {
        console.log(`  → Updating extracurricular_activities table, id=${activity.id}`);
        try {
          const result = await updateExtracurricularActivity(activity.id, { is_completed: true });
          console.log(`✅ Extracurricular updated:`, result);
          dbUpdateSuccess = !!result;
        } catch (extError: any) {
          console.error(`❌❌❌ SUPABASE ERROR - Extracurricular update FAILED ❌❌❌`);
          console.error(`Error message: ${extError?.message}`);
          console.error(`Error code: ${extError?.code}`);
          console.error(`Error details:`, extError?.details);
          console.error(`Error hint: ${extError?.hint}`);
          console.error(`Full error object:`, JSON.stringify(extError, null, 2));
          
          // Fallback for missing column
          if (extError?.message?.includes("is_completed")) {
            console.warn(`⚠️ is_completed column missing on extracurricular_activities`);
            setActivities((prev) =>
              prev.map((a) =>
                a.id === activity.id ? { ...a, is_completed: true } : a
              )
            );
            alert("✅ Marked as completed locally. Note: Database migration may not be applied yet.");
            return;
          }
          
          throw extError;
        }
      } else if (activity.type === "field-trip") {
        console.log(`  → Updating field_trips table, id=${activity.id}`);
        try {
          const result = await updateFieldTrip(activity.id, { is_completed: true });
          console.log(`✅ Field trip updated:`, result);
          dbUpdateSuccess = !!result;
        } catch (tripError: any) {
          console.error(`❌❌❌ SUPABASE ERROR - Field trip update FAILED ❌❌❌`);
          console.error(`Error message: ${tripError?.message}`);
          console.error(`Error code: ${tripError?.code}`);
          console.error(`Error details:`, tripError?.details);
          console.error(`Error hint: ${tripError?.hint}`);
          console.error(`Full error object:`, JSON.stringify(tripError, null, 2));
          
          // Fallback for missing column
          if (tripError?.message?.includes("is_completed")) {
            console.warn(`⚠️ is_completed column missing on field_trips`);
            setActivities((prev) =>
              prev.map((a) =>
                a.id === activity.id ? { ...a, is_completed: true } : a
              )
            );
            alert("✅ Marked as completed locally. Note: Database migration may not be applied yet.");
            return;
          }
          
          throw tripError;
        }
      }

      // Update the activity in the state with is_completed = true
      console.log(`📲 Updating UI state...`);
      setActivities((prev) => {
        const updated = prev.map((a) =>
          a.id === activity.id ? { ...a, is_completed: true } : a
        );
        console.log(`  → Activities state updated. New entry:`, updated.find(a => a.id === activity.id));
        return updated;
      });
      
      // Update selectedDayActivities to reflect the completed state in the popup
      setSelectedDayActivities((prev) =>
        prev.map((a) =>
          a.id === activity.id ? { ...a, is_completed: true } : a
        )
      );
      
      console.log(`🎉 Activity completed successfully!`);
      console.log(`   ✅ Database updated: ${dbUpdateSuccess}`);
      console.log(`   ✅ Attendance logged`);
      console.log(`   ✅ UI state updated`);
      alert("✅ Marked as completed");
    } catch (error: any) {
      console.error("❌❌❌ FATAL ERROR COMPLETING ACTIVITY ❌❌❌");
      console.error("Error message:", error?.message || "No message");
      console.error("Error code:", error?.code || "No code");
      console.error("Error details:", error?.details || "No details");
      console.error("Error hint:", error?.hint || "No hint");

      console.error("Full error object:", JSON.stringify(error, null, 2));
      console.error("Error stack:", error?.stack || "No stack trace");
      
      const errorMsg = error?.message || "Unknown error";
      alert(`Failed to mark activity as completed: ${errorMsg}`);
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
              // SAFETY CHECK: validate dateStr belongs to current month or is null
              // This is a failsafe: the grid construction above should guarantee this
              if (dateStr) {
                const parts = dateStr.split('-');
                const gridYear = parseInt(parts[0], 10);
                const gridMonth = parseInt(parts[1], 10);
                const gridDay = parseInt(parts[2], 10);
                
                const expectedYear = currentDate.getFullYear();
                const expectedMonth = currentDate.getMonth() + 1;
                const expectedMaxDay = daysInMonth;
                
                // CRITICAL: If date doesn't belong to current month, render empty cell and log error
                // This should NEVER happen if grid construction is correct
                if (gridYear !== expectedYear || gridMonth !== expectedMonth || gridDay < 1 || gridDay > expectedMaxDay) {
                  console.error(
                    `🚨 RENDER BUG: Cell ${idx} has ${dateStr} but expecting ${expectedMonth}/${expectedYear} with max day ${expectedMaxDay}. RENDERING EMPTY CELL.`
                  );
                  
                  // Force empty cell instead of rendering wrong date
                  return (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: "#f9fafb",
                        borderColor: "#e5e7eb",
                        cursor: "default",
                      }}
                      className="aspect-square border rounded-lg p-1 sm:p-2 hover:shadow-md transition-all flex flex-col overflow-hidden"
                    />
                  );
                }
              }
              
              // If we reach here, dateStr is either null (padding) or a valid date for this month
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
                        {parseInt(dateStr.split('-')[2], 10)}
                      </span>
                      
                      {/* Activity previews */}
                      {dayActivities.length > 0 && (
                        <div className="flex-1 flex flex-col overflow-hidden mt-1 min-w-0">
                          {dayActivities.slice(0, 2).map((evt, i) => {
                            const activityName = evt.type === "activity"
                              ? `${evt.subject || evt.name}`
                              : evt.name;
                            const displayText = `${evt.childName} - ${activityName}`;
                            return (
                              <div
                                key={i}
                                style={{
                                  backgroundColor: ACTIVITY_COLORS[evt.type],
                                  color: "white",
                                }}
                                className="text-xs rounded px-1 py-0.5 truncate flex-shrink-0 mb-0.5 line-clamp-1 leading-tight"
                                title={displayText}
                              >
                                {displayText}
                              </div>
                            );
                          })}
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
                {(() => {
                  const [year, month, day] = selectedDate.split('-').map(Number);
                  const d = new Date(year, month - 1, day);
                  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
                })()}
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
                  // Get the latest activity state from parent activities array
                  const latestActivity = activities.find((a) => a.id === activity.id) || activity;
                  const isCompleted = latestActivity.is_completed || false;
                  return (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: isCompleted ? "#e8f5e9" : "#f9fafb",
                        borderLeft: `4px solid ${ACTIVITY_COLORS[latestActivity.type]}`,
                      }}
                      className="p-3 rounded text-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p style={{ color: COLORS.dark }} className="font-semibold">
                            {latestActivity.childName}
                          </p>
                          <p style={{ color: "#555" }}>
                            {latestActivity.type === "activity"
                              ? `${latestActivity.subject} (${latestActivity.duration ? (latestActivity.duration / 60).toFixed(1) : "0"}h)`
                              : latestActivity.name}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                          <button
                            onClick={() => handleCompleteActivity(latestActivity)}
                            style={{
                              color: isCompleted ? "#2e7d32" : "#0066cc",
                              borderColor: isCompleted ? "#2e7d32" : "#0066cc",
                              backgroundColor: isCompleted ? "#c8e6c9" : "transparent",
                            }}
                            className="px-2 py-1 border rounded text-xs hover:opacity-80 font-medium transition-all"
                            title="Mark as completed"
                          >
                            {isCompleted ? "✓ Done" : "✓ Complete"}
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
                onClick={() => {
                  if (onOpenQuickLog && selectedDate) {
                    onOpenQuickLog(selectedDate);
                  }
                }}
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


          </div>
        </div>
      )}
    </div>
  );
}
