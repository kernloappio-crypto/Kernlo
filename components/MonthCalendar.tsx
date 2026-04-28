"use client";

import { useEffect, useState } from "react";
import { getActivities, getExtracurricularActivities, getFieldTrips } from "@/lib/supabase-data";

interface Activity {
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

          {/* Calendar Grid */}
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
                  className="aspect-square border rounded-lg p-1 sm:p-2 hover:shadow-md transition-all"
                >
                  {dateStr && (
                    <div className="h-full flex flex-col">
                      <span
                        style={{
                          color: isSelected ? "white" : COLORS.dark,
                        }}
                        className="text-xs sm:text-sm font-bold"
                      >
                        {new Date(dateStr).getDate()}
                      </span>
                      {dayActivities.length > 0 && (
                        <div className="flex-1 flex items-end">
                          <div className="flex gap-0.5 flex-wrap">
                            {dayActivities.slice(0, 4).map((evt, i) => (
                              <div
                                key={i}
                                style={{
                                  backgroundColor:
                                    ACTIVITY_COLORS[evt.type],
                                }}
                                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              />
                            ))}
                            {dayActivities.length > 4 && (
                              <span
                                style={{
                                  color: isSelected ? "white" : "#999",
                                  fontSize: "9px",
                                }}
                                className="text-center"
                              >
                                +{dayActivities.length - 4}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
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

          {/* Selected Day Details */}
          {selectedDate && selectedDayActivities.length > 0 && (
            <div style={{ borderTop: "1px solid #e5e7eb", marginTop: "24px", paddingTop: "24px" }}>
              <p style={{ color: COLORS.dark }} className="text-sm font-bold mb-3">
                Activities for {new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}:
              </p>
              <div className="space-y-2">
                {selectedDayActivities.map((activity, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: "#f9fafb",
                      borderLeft: `4px solid ${ACTIVITY_COLORS[activity.type]}`,
                    }}
                    className="p-3 rounded text-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p style={{ color: COLORS.dark }} className="font-semibold">
                          {activity.childName}
                        </p>
                        <p style={{ color: "#555" }}>
                          {activity.type === "activity"
                            ? `${activity.subject} (${activity.duration}h)`
                            : activity.name}
                        </p>
                      </div>
                      <span
                        style={{
                          backgroundColor: ACTIVITY_COLORS[activity.type],
                          color: "white",
                        }}
                        className="text-xs px-2 py-1 rounded"
                      >
                        {activity.type === "activity"
                          ? "📚"
                          : activity.type === "extracurricular"
                            ? "🎭"
                            : "🚌"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
