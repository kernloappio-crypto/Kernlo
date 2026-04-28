"use client";

import { useEffect, useState } from "react";
import {
  getActivities,
  getExtracurricularActivities,
  getFieldTrips,
} from "@/lib/supabase-data";

interface Activity {
  date: string;
  type: "activity" | "extracurricular" | "field-trip";
  childName: string;
  name: string;
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

interface ParentDashboardCalendarProps {
  userId: string;
  kids: Kid[];
}

export default function ParentDashboardCalendar({ userId, kids }: ParentDashboardCalendarProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

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
            allActivities.push({
              date: a.date,
              type: "activity",
              childName: a.child_name,
              name: a.subject,
              details: `${a.duration}h via ${a.platform}`,
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
                date: t.date,
                type: "field-trip",
                childName: kid.name,
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
  }, [userId, kids]);

  const getActivitiesForDate = (dateStr: string) => {
    return activities.filter((a) => a.date === dateStr);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "activity":
        return COLORS.primary;
      case "extracurricular":
        return COLORS.accent3;
      case "field-trip":
        return COLORS.accent1;
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

  // Get last 7 days of activities
  const today = new Date(currentDate);
  const lastWeek = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    lastWeek.push(`${year}-${month}-${day}`);
  }

  return (
    <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 style={{ color: COLORS.dark }} className="text-xl font-bold">
          📅 Recent Activities (Last 7 Days)
        </h2>
      </div>

      {loading ? (
        <p style={{ color: "#555" }} className="text-sm">
          Loading activities...
        </p>
      ) : activities.length === 0 ? (
        <p style={{ color: "#555" }} className="text-sm">
          No activities logged yet.
        </p>
      ) : (
        <div className="space-y-4">
          {lastWeek.map((dateStr) => {
            const dateActivities = getActivitiesForDate(dateStr);
            if (dateActivities.length === 0) return null;

            const dateObj = new Date(dateStr);
            const dateDisplay = dateObj.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            });

            return (
              <div key={dateStr} className="border-b border-gray-100 pb-4 last:border-0">
                <h3 style={{ color: COLORS.dark }} className="text-sm font-bold mb-2">
                  {dateDisplay}
                </h3>
                <div className="space-y-2">
                  {dateActivities.map((activity, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: "#f9fafb",
                        borderLeft: `3px solid ${getTypeColor(activity.type)}`,
                      }}
                      className="p-3 rounded text-sm"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg flex-shrink-0">{getTypeEmoji(activity.type)}</span>
                        <div className="flex-1">
                          <p style={{ color: COLORS.dark }} className="font-semibold">
                            {activity.childName}
                          </p>
                          <p style={{ color: "#555" }} className="text-xs">
                            {activity.name}
                          </p>
                          {activity.details && (
                            <p style={{ color: "#999" }} className="text-xs mt-1">
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

      <div style={{ color: COLORS.primary }} className="text-xs font-medium mt-4 pt-4 border-t border-gray-200">
        💡 Tip: Click on any child's name to view their detailed calendar and add more activities.
      </div>
    </div>
  );
}
