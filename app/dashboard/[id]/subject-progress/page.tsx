"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import Navbar from "@/components/Navbar";
import { getActivities } from "@/lib/supabase-data";

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

interface SubjectGroup {
  subject: string;
  activities: Activity[];
  totalHours: number;
  totalActivities: number;
  lastActivity?: Activity;
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

export default function SubjectProgressPage() {
  const params = useParams();
  const router = useRouter();
  const kidId = params.id as string;

  const [kid, setKid] = useState<Kid | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [subjectGroups, setSubjectGroups] = useState<SubjectGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

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
        }

        // Load activities
        const activitiesData = await getActivities(user.id);
        const kidActivities = activitiesData.filter(
          (a: any) => a.child_name === kidData?.name
        ) as Activity[];
        
        setActivities(kidActivities);

        // Group activities by subject
        const grouped = groupActivitiesBySubject(kidActivities);
        setSubjectGroups(grouped);

        setLoading(false);
      } catch (err) {
        console.error("Error initializing:", err);
        setLoading(false);
      }
    };

    initializeUser();
  }, [kidId, router]);

  function groupActivitiesBySubject(acts: Activity[]): SubjectGroup[] {
    const groups: { [key: string]: Activity[] } = {};

    acts.forEach((activity) => {
      if (!groups[activity.subject]) {
        groups[activity.subject] = [];
      }
      groups[activity.subject].push(activity);
    });

    // Sort each group by date (newest first) and calculate stats
    return Object.entries(groups)
      .map(([subject, subjectActivities]) => {
        const sorted = subjectActivities.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        return {
          subject,
          activities: sorted,
          totalHours: sorted.reduce((sum, a) => sum + a.duration, 0),
          totalActivities: sorted.length,
          lastActivity: sorted[0],
        };
      })
      .sort((a, b) => {
        // Sort by most recent activity
        const aDate = a.lastActivity ? new Date(a.lastActivity.date).getTime() : 0;
        const bDate = b.lastActivity ? new Date(b.lastActivity.date).getTime() : 0;
        return bDate - aDate;
      });
  }

  const getLastTopic = (activity: Activity | undefined): string => {
    if (!activity) return "";
    // Extract topic from notes or curriculum
    const notes = activity.notes?.trim() || "";
    const curriculum = activity.curriculum?.trim() || "";
    
    if (notes) {
      // Try to extract first meaningful phrase (up to first sentence)
      const match = notes.match(/^([^.!?]*[.!?]?)/);
      return match ? match[1].substring(0, 50) : notes.substring(0, 50);
    }
    return curriculum ? curriculum.substring(0, 50) : "";
  };

  const getPast6MonthsActivities = (acts: Activity[]): Activity[] => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    return acts.filter(
      (activity) => new Date(activity.date).getTime() >= sixMonthsAgo.getTime()
    );
  };

  const getDateRange = (acts: Activity[]): { start: string; end: string } => {
    if (acts.length === 0) return { start: "", end: "" };
    
    const sorted = [...acts].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    return {
      end: formatFullDate(sorted[0].date),
      start: formatFullDate(sorted[sorted.length - 1].date),
    };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main style={{ backgroundColor: COLORS.light, minHeight: "100vh" }}>
          <div className="max-w-7xl mx-auto p-4 sm:p-6 py-12 text-center">
            <p style={{ color: "#555" }}>Loading...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main style={{ backgroundColor: COLORS.light, minHeight: "100vh" }}>
        {/* Header */}
        <div
          style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb" }}
          className="sticky top-0 z-40"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <Link
              href={`/dashboard/${kidId}`}
              style={{ color: COLORS.primary }}
              className="text-sm font-medium mb-2 block"
            >
              ← Back to {kid?.name}
            </Link>
            <h1 style={{ color: COLORS.dark }} className="text-2xl font-bold">
              Subject Progress
            </h1>
            <p style={{ color: "#555" }} className="text-sm mt-1">
              Learning history and timeline for {kid?.name}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
          {subjectGroups.length === 0 ? (
            <div
              style={{ backgroundColor: "white", borderRadius: "12px" }}
              className="p-8 text-center border border-gray-200"
            >
              <p style={{ color: "#333" }} className="mb-4">
                No activities logged yet.
              </p>
              <Link
                href={`/dashboard/${kidId}`}
                style={{ color: COLORS.primary }}
                className="text-sm font-medium hover:underline"
              >
                Log your first activity →
              </Link>
            </div>
          ) : (
            <div className="space-y-6 sm:space-y-8">
              {/* Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div
                  style={{ backgroundColor: "white", borderRadius: "8px" }}
                  className="p-4 border border-gray-200 max-w-xs"
                >
                  <p style={{ color: "#555" }} className="text-xs font-medium mb-1">
                    Subjects Studied
                  </p>
                  <p
                    style={{ color: COLORS.primary }}
                    className="text-2xl sm:text-3xl font-bold"
                  >
                    {subjectGroups.length}
                  </p>
                </div>

                <div
                  style={{ backgroundColor: "white", borderRadius: "8px" }}
                  className="p-4 border border-gray-200 max-w-xs"
                >
                  <p style={{ color: "#555" }} className="text-xs font-medium mb-1">
                    Total Activities
                  </p>
                  <p
                    style={{ color: COLORS.secondary }}
                    className="text-2xl sm:text-3xl font-bold"
                  >
                    {activities.length}
                  </p>
                </div>

                <div
                  style={{ backgroundColor: "white", borderRadius: "8px" }}
                  className="p-4 border border-gray-200 max-w-xs"
                >
                  <p style={{ color: "#555" }} className="text-xs font-medium mb-1">
                    Total Hours
                  </p>
                  <p
                    style={{ color: COLORS.accent3 }}
                    className="text-2xl sm:text-3xl font-bold"
                  >
                    {activities
                      .reduce((sum, a) => sum + a.duration, 0)
                      .toFixed(1)}
                  </p>
                </div>

                <div
                  style={{ backgroundColor: "white", borderRadius: "8px" }}
                  className="p-4 border border-gray-200 max-w-xs"
                >
                  <p style={{ color: "#555" }} className="text-xs font-medium mb-1">
                    Last Activity
                  </p>
                  <p style={{ color: COLORS.dark }} className="text-lg font-semibold">
                    {activities.length > 0
                      ? formatDate(
                          activities.sort(
                            (a, b) =>
                              new Date(b.date).getTime() -
                              new Date(a.date).getTime()
                          )[0].date
                        )
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Subject Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {subjectGroups.map((group) => {
                  const lastTopic = getLastTopic(group.lastActivity);
                  return (
                    <button
                      key={group.subject}
                      onClick={() => setSelectedSubject(group.subject)}
                      style={{ 
                        backgroundColor: "white", 
                        borderRadius: "12px",
                        border: "1px solid #e5e7eb",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = "none";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                      className="text-left overflow-hidden hover:bg-gray-50"
                    >
                      {/* Subject Header */}
                      <div
                        style={{
                          backgroundColor: COLORS.light,
                          borderBottom: "1px solid #e5e7eb",
                        }}
                        className="p-2 sm:p-3"
                      >
                        <div className="flex items-center justify-between mb-2 flex-col gap-1 text-center">
                          <div className="flex-1 w-full">
                            <h2
                              style={{ color: COLORS.dark }}
                              className="text-sm sm:text-base font-bold"
                            >
                              {group.subject}
                            </h2>
                            <p style={{ color: "#555" }} className="text-xs mt-0.5">
                              {group.totalActivities} • {group.totalHours.toFixed(1)}h
                            </p>
                          </div>
                          {lastTopic && (
                            <div className="text-center w-full">
                              <p style={{ color: "#666" }} className="text-xs font-medium mt-1">
                                Last: <span style={{ color: COLORS.primary }}>{lastTopic}</span>
                              </p>
                            </div>
                          )}
                          {group.lastActivity && (
                            <div className="text-center w-full">
                              <p style={{ color: "#555" }} className="text-xs mt-0.5">
                                {formatDate(group.lastActivity.date)}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full">
                          <div
                            style={{
                              backgroundColor: "#e5e7eb",
                              height: "8px",
                              borderRadius: "4px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                backgroundColor: COLORS.primary,
                                height: "100%",
                                width: "100%",
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Activity Timeline */}
                      <div className="p-2 sm:p-3 space-y-1 sm:space-y-2">
                        {group.activities.slice(0, 3).map((activity, index) => (
                          <div
                            key={activity.id}
                            className="flex gap-1 sm:gap-2 pb-1 sm:pb-2 text-xs"
                            style={{
                              borderBottom:
                                index < Math.min(group.activities.length - 1, 2)
                                  ? "1px solid #e5e7eb"
                                  : "none",
                            }}
                          >
                            {/* Timeline Marker */}
                            <div className="flex flex-col items-center flex-shrink-0 mt-1">
                              <div
                                style={{ backgroundColor: COLORS.primary }}
                                className="w-2 h-2 rounded-full flex-shrink-0"
                              />
                              {index < Math.min(group.activities.length - 1, 2) && (
                                <div
                                  style={{
                                    backgroundColor: "#e5e7eb",
                                    width: "1px",
                                    height: "20px",
                                    marginTop: "4px",
                                  }}
                                />
                              )}
                            </div>

                            {/* Activity Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 flex-wrap mb-0.5">
                                <span
                                  style={{ color: COLORS.primary }}
                                  className="font-semibold flex-shrink-0"
                                >
                                  {activity.duration}h
                                </span>
                                <span
                                  style={{ color: "#555" }}
                                  className="flex-shrink-0"
                                >
                                  {formatDate(activity.date)}
                                </span>
                              </div>

                              {activity.platform && (
                                <p style={{ color: "#555" }} className="text-xs mb-0.5">
                                  {activity.platform}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Modal */}
              {selectedSubject && (
                <div
                  style={{
                    position: "fixed",
                    inset: 0,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 50,
                  }}
                  onClick={() => setSelectedSubject(null)}
                >
                  <div
                    style={{
                      backgroundColor: "white",
                      borderRadius: "16px",
                      width: "90%",
                      maxWidth: "600px",
                      maxHeight: "85vh",
                      overflow: "auto",
                      boxShadow: "0 20px 25px rgba(0,0,0,0.15)",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Modal Header */}
                    <div
                      style={{
                        backgroundColor: COLORS.light,
                        borderBottom: "1px solid #e5e7eb",
                        padding: "1.5rem",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                      }}
                    >
                      <div>
                        <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-1">
                          {selectedSubject}
                        </h2>
                        <p style={{ color: "#555" }} className="text-sm">
                          Learning timeline &amp; progress
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedSubject(null)}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: "24px",
                          cursor: "pointer",
                          color: "#555",
                          padding: "0",
                          width: "32px",
                          height: "32px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Summary Stats */}
                    {(() => {
                      const group = subjectGroups.find((g) => g.subject === selectedSubject);
                      if (!group) return null;

                      const past6Months = getPast6MonthsActivities(group.activities);
                      const dateRange = getDateRange(past6Months);

                      return (
                        <div style={{ padding: "1.5rem" }}>
                          {/* Stats Grid */}
                          <div className="grid grid-cols-3 gap-3 mb-6">
                            <div style={{ backgroundColor: COLORS.light, borderRadius: "8px" }} className="p-4 text-center">
                              <p style={{ color: "#555" }} className="text-xs font-medium mb-1">
                                Total Hours
                              </p>
                              <p style={{ color: COLORS.primary }} className="text-2xl font-bold">
                                {past6Months.reduce((sum, a) => sum + a.duration, 0).toFixed(1)}
                              </p>
                            </div>

                            <div style={{ backgroundColor: COLORS.light, borderRadius: "8px" }} className="p-4 text-center">
                              <p style={{ color: "#555" }} className="text-xs font-medium mb-1">
                                Activities
                              </p>
                              <p style={{ color: COLORS.secondary }} className="text-2xl font-bold">
                                {past6Months.length}
                              </p>
                            </div>

                            <div style={{ backgroundColor: COLORS.light, borderRadius: "8px" }} className="p-4 text-center">
                              <p style={{ color: "#555" }} className="text-xs font-medium mb-1">
                                Avg/Activity
                              </p>
                              <p style={{ color: COLORS.accent3 }} className="text-2xl font-bold">
                                {past6Months.length > 0
                                  ? (past6Months.reduce((sum, a) => sum + a.duration, 0) / past6Months.length).toFixed(1)
                                  : "0"}
                              </p>
                            </div>
                          </div>

                          {/* Date Range */}
                          {dateRange.start && dateRange.end && (
                            <div style={{ marginBottom: "1.5rem", padding: "1rem", backgroundColor: COLORS.light, borderRadius: "8px" }}>
                              <p style={{ color: "#555" }} className="text-xs font-medium mb-1">
                                Period
                              </p>
                              <p style={{ color: COLORS.dark }} className="text-sm font-semibold">
                                {dateRange.start} → {dateRange.end}
                              </p>
                            </div>
                          )}

                          {/* Full Timeline */}
                          <div>
                            <h3 style={{ color: COLORS.dark }} className="text-lg font-bold mb-4">
                              Timeline
                            </h3>

                            <div className="space-y-4">
                              {past6Months.length === 0 ? (
                                <p style={{ color: "#555" }} className="text-sm text-center py-4">
                                  No activities in the past 6 months.
                                </p>
                              ) : (
                                past6Months.map((activity, index) => (
                                  <div
                                    key={activity.id}
                                    className="flex gap-4"
                                  >
                                    {/* Timeline Marker */}
                                    <div className="flex flex-col items-center flex-shrink-0">
                                      <div
                                        style={{ backgroundColor: COLORS.primary }}
                                        className="w-3 h-3 rounded-full"
                                      />
                                      {index < past6Months.length - 1 && (
                                        <div
                                          style={{
                                            backgroundColor: "#e5e7eb",
                                            width: "2px",
                                            height: "60px",
                                            marginTop: "8px",
                                          }}
                                        />
                                      )}
                                    </div>

                                    {/* Activity Card */}
                                    <div
                                      style={{
                                        backgroundColor: COLORS.light,
                                        borderRadius: "8px",
                                        border: "1px solid #e5e7eb",
                                        padding: "1rem",
                                        flex: 1,
                                      }}
                                    >
                                      <div className="flex items-start justify-between mb-2 gap-2">
                                        <div>
                                          <p style={{ color: COLORS.dark }} className="font-bold text-sm">
                                            {formatFullDate(activity.date)}
                                          </p>
                                          <p style={{ color: "#555" }} className="text-xs mt-1">
                                            <span className="font-semibold">{activity.duration}h</span>
                                          </p>
                                        </div>
                                      </div>

                                      {activity.platform && (
                                        <p style={{ color: "#666" }} className="text-xs mb-2">
                                          <strong>Platform:</strong> {activity.platform}
                                        </p>
                                      )}

                                      {activity.curriculum && (
                                        <p style={{ color: "#666" }} className="text-xs mb-2">
                                          <strong>Curriculum:</strong> {activity.curriculum}
                                        </p>
                                      )}

                                      {activity.notes && (
                                        <p style={{ color: "#666" }} className="text-xs">
                                          <strong>Notes:</strong> {activity.notes}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
