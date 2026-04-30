"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import Navbar from "@/components/Navbar";
import {
  getActivities,
  addActivity,
  getExtracurricularActivities,
  addExtracurricularActivity,
  getFieldTrips,
  addFieldTrip,
} from "@/lib/supabase-data";

export const dynamic = "force-dynamic";

interface Kid {
  id: string;
  name: string;
  age?: number;
  grade?: string;
}

interface CalendarEvent {
  date: string;
  type: "activity" | "extracurricular" | "field-trip";
  name: string;
  details?: string;
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

export default function CalendarPage() {
  const params = useParams();
  const router = useRouter();
  const kidId = params.id as string;

  const [userId, setUserId] = useState("");
  const [kid, setKid] = useState<Kid | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"activity" | "extracurricular" | "field-trip">("activity");
  const [formData, setFormData] = useState({
    subject: "",
    duration: "",
    platform: "",
    notes: "",
    activityName: "",
    destination: "",
    tripName: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
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
          await loadEvents(user.id);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error initializing:", err);
        setLoading(false);
      }
    };

    init();
  }, [kidId, router]);

  const loadEvents = async (uid: string) => {
    try {
      const activities = await getActivities(uid);
      const extracurricular = await getExtracurricularActivities(uid, kidId);
      const fieldTrips = await getFieldTrips(uid, kidId);

      const calendarEvents: CalendarEvent[] = [];

      // Add school activities
      activities.forEach((a) => {
        if (a.child_name === kid?.name) {
          calendarEvents.push({
            date: a.date,
            type: "activity",
            name: a.subject,
            details: `${a.duration}h - ${a.platform}`,
          });
        }
      });

      // Add extracurricular
      extracurricular.forEach((e) => {
        calendarEvents.push({
          date: e.date,
          type: "extracurricular",
          name: e.activity_name,
          details: e.notes,
        });
      });

      // Add field trips
      fieldTrips.forEach((f) => {
        calendarEvents.push({
          date: f.date,
          type: "field-trip",
          name: f.trip_name,
          details: f.destination,
        });
      });

      setEvents(calendarEvents);
    } catch (err) {
      console.error("Error loading events:", err);
    }
  };

  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setShowModal(true);
  };

  const handleSubmitEvent = async () => {
    if (!selectedDate) return;

    try {
      if (modalType === "activity") {
        if (!formData.subject || !formData.duration || !formData.platform) {
          alert("Subject, duration, and platform are required");
          return;
        }
        await addActivity(
          userId,
          kid!.name,
          formData.subject,
          parseFloat(formData.duration),
          formData.platform,
          selectedDate,
          formData.notes || undefined
        );
      } else if (modalType === "extracurricular") {
        if (!formData.activityName) {
          alert("Activity name is required");
          return;
        }
        await addExtracurricularActivity(userId, kidId, formData.activityName, selectedDate, formData.notes || undefined);
      } else if (modalType === "field-trip") {
        if (!formData.tripName || !formData.destination) {
          alert("Trip name and destination are required");
          return;
        }
        await addFieldTrip(userId, kidId, formData.tripName, formData.destination, selectedDate, formData.notes || undefined);
      }

      await loadEvents(userId);
      setShowModal(false);
      setSelectedDate(null);
      setFormData({
        subject: "",
        duration: "",
        platform: "",
        notes: "",
        activityName: "",
        destination: "",
        tripName: "",
      });
      setModalType("activity");
    } catch (err) {
      console.error("Error saving event:", err);
      alert("Failed to save event");
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const hasEvents = (dateStr: string) => {
    return events.some((e) => e.date === dateStr);
  };

  const getEventsForDate = (dateStr: string) => {
    return events.filter((e) => e.date === dateStr);
  };

  const monthStr = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
    const day = String(i).padStart(2, "0");
    days.push(`${year}-${month}-${day}`);
  }

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  return (
    <>
      <Navbar />
      <main style={{ backgroundColor: COLORS.light, minHeight: "100vh" }}>
        {/* Header */}
        <div style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb" }} className="sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <Link href={`/dashboard/${kidId}`} style={{ color: COLORS.primary }} className="text-sm font-medium mb-2 block">
              ← Back to {kid?.name || "Kid"}
            </Link>
            <h1 style={{ color: COLORS.dark }} className="text-2xl font-bold">
              📅 {kid?.name}'s Calendar
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          {loading ? (
            <div className="text-center py-12">
              <p style={{ color: "#555" }}>Loading calendar...</p>
            </div>
          ) : (
            <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 border border-gray-200">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <button onClick={prevMonth} style={{ color: COLORS.primary }} className="text-lg font-bold hover:opacity-70 min-h-10 min-w-10 flex items-center justify-center rounded">
                  ←
                </button>
                <h2 style={{ color: COLORS.dark }} className="text-lg sm:text-xl font-bold">
                  {monthStr}
                </h2>
                <button onClick={nextMonth} style={{ color: COLORS.primary }} className="text-lg font-bold hover:opacity-70 min-h-10 min-w-10 flex items-center justify-center rounded">
                  →
                </button>
              </div>

              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} style={{ color: COLORS.dark }} className="text-center font-bold text-xs sm:text-sm py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {days.map((dateStr, idx) => {
                  const isSelected = dateStr === selectedDate;
                  const hasEvent = dateStr && hasEvents(dateStr);
                  const daysEvents = dateStr ? getEventsForDate(dateStr) : [];

                  return (
                    <div
                      key={idx}
                      onClick={() => dateStr && handleDateClick(dateStr)}
                      style={{
                        backgroundColor: isSelected ? COLORS.primary : hasEvent ? "#f0f7ff" : "#f9fafb",
                        borderColor: isSelected ? COLORS.primary : hasEvent ? COLORS.primary : "#e5e7eb",
                        cursor: dateStr ? "pointer" : "default",
                      }}
                      className="aspect-square border rounded-lg p-1 hover:shadow-md transition-all flex flex-col overflow-hidden"
                    >
                      {dateStr && (
                        <>
                          <span style={{ color: isSelected ? "white" : COLORS.dark }} className="text-xs sm:text-sm font-bold flex-shrink-0">
                            {new Date(dateStr).getDate()}
                          </span>
                          {daysEvents.length > 0 && (
                            <div className="flex-1 flex flex-col overflow-hidden mt-0.5 min-w-0">
                              {daysEvents.slice(0, 2).map((evt, i) => (
                                <div
                                  key={i}
                                  style={{
                                    backgroundColor:
                                      evt.type === "activity"
                                        ? COLORS.primary
                                        : evt.type === "extracurricular"
                                          ? COLORS.accent3
                                          : COLORS.accent1,
                                    color: "white",
                                  }}
                                  className="text-xs rounded px-0.5 py-0.5 truncate flex-shrink-0 mb-0.5 line-clamp-1 leading-tight"
                                  title={evt.name}
                                >
                                  {evt.name}
                                </div>
                              ))}
                              {daysEvents.length > 2 && (
                                <span
                                  style={{
                                    color: isSelected ? "white" : "#666",
                                    fontSize: "9px",
                                  }}
                                  className="text-center flex-shrink-0"
                                >
                                  +{daysEvents.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p style={{ color: COLORS.dark }} className="text-sm font-bold mb-3">
                  Legend:
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div style={{ backgroundColor: COLORS.primary }} className="w-3 h-3 rounded-full" />
                    <span style={{ color: "#555" }}>School Activity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div style={{ backgroundColor: COLORS.accent3 }} className="w-3 h-3 rounded-full" />
                    <span style={{ color: "#555" }}>Extracurricular</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div style={{ backgroundColor: COLORS.accent1 }} className="w-3 h-3 rounded-full" />
                    <span style={{ color: "#555" }}>Field Trip</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Event Modal */}
        {showModal && selectedDate && (
          <div style={{ backgroundColor: "rgba(0,0,0,0.5)" }} className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 sm:p-8 max-w-md w-full my-4 sm:my-8 max-h-[90vh] overflow-y-auto">
              <h2 style={{ color: COLORS.dark }} className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">
                Log Activity for {new Date(selectedDate).toLocaleDateString()}
              </h2>

              {/* Type Selector */}
              <div className="mb-6">
                <label style={{ color: "#333" }} className="block text-sm font-medium mb-3">
                  Activity Type
                </label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded hover:bg-gray-50 -mx-3">
                    <input
                      type="radio"
                      name="type"
                      value="activity"
                      checked={modalType === "activity"}
                      onChange={() => setModalType("activity")}
                      className="w-5 h-5 cursor-pointer"
                    />
                    <span style={{ color: "#333" }} className="text-sm font-medium flex-1">
                      School Subject
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded hover:bg-gray-50 -mx-3">
                    <input
                      type="radio"
                      name="type"
                      value="extracurricular"
                      checked={modalType === "extracurricular"}
                      onChange={() => setModalType("extracurricular")}
                      className="w-5 h-5 cursor-pointer"
                    />
                    <span style={{ color: "#333" }} className="text-sm font-medium flex-1">
                      Extracurricular
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded hover:bg-gray-50 -mx-3">
                    <input
                      type="radio"
                      name="type"
                      value="field-trip"
                      checked={modalType === "field-trip"}
                      onChange={() => setModalType("field-trip")}
                      className="w-5 h-5 cursor-pointer"
                    />
                    <span style={{ color: "#333" }} className="text-sm font-medium flex-1">
                      Field Trip
                    </span>
                  </label>
                </div>
              </div>

              {/* Dynamic Form Fields */}
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {modalType === "activity" && (
                  <>
                    <div>
                      <label style={{ color: "#333" }} className="block text-sm font-medium mb-2">
                        Subject *
                      </label>
                      <select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        style={{ color: "#1a1a2e" }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select subject...</option>
                        {SUBJECTS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ color: "#333" }} className="block text-sm font-medium mb-2">
                        Duration (hours) *
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        placeholder="1.5"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        style={{ color: "#1a1a2e" }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label style={{ color: "#333" }} className="block text-sm font-medium mb-2">
                        Platform *
                      </label>
                      <input
                        type="text"
                        placeholder="Khan Academy, IXL, Outschool..."
                        value={formData.platform}
                        onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                        style={{ color: "#1a1a2e" }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                {modalType === "extracurricular" && (
                  <>
                    <div>
                      <label style={{ color: "#333" }} className="block text-sm font-medium mb-2">
                        Activity Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Soccer Practice, Piano Lessons"
                        value={formData.activityName}
                        onChange={(e) => setFormData({ ...formData, activityName: e.target.value })}
                        style={{ color: "#1a1a2e" }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                {modalType === "field-trip" && (
                  <>
                    <div>
                      <label style={{ color: "#333" }} className="block text-sm font-medium mb-2">
                        Trip Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Science Museum Visit"
                        value={formData.tripName}
                        onChange={(e) => setFormData({ ...formData, tripName: e.target.value })}
                        style={{ color: "#1a1a2e" }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label style={{ color: "#333" }} className="block text-sm font-medium mb-2">
                        Destination *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Local Museum"
                        value={formData.destination}
                        onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                        style={{ color: "#1a1a2e" }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label style={{ color: "#333" }} className="block text-sm font-medium mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    placeholder="Any additional details..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    style={{ color: "#1a1a2e" }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex gap-3 flex-col">
                <button
                  onClick={handleSubmitEvent}
                  style={{ backgroundColor: COLORS.primary }}
                  className="w-full px-4 py-3 text-white font-semibold rounded-lg hover:opacity-90 text-sm sm:text-base min-h-12"
                >
                  Save Event
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedDate(null);
                    setFormData({
                      subject: "",
                      duration: "",
                      platform: "",
                      notes: "",
                      activityName: "",
                      destination: "",
                      tripName: "",
                    });
                    setModalType("activity");
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
