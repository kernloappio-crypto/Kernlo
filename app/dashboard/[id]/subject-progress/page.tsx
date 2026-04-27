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
              <div className="space-y-6">
                {subjectGroups.map((group) => (
                  <div
                    key={group.subject}
                    style={{ backgroundColor: "white", borderRadius: "12px" }}
                    className="border border-gray-200 overflow-hidden w-fit max-w-2xl"
                  >
                    {/* Subject Header */}
                    <div
                      style={{
                        backgroundColor: COLORS.light,
                        borderBottom: "1px solid #e5e7eb",
                      }}
                      className="p-3 sm:p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <h2
                            style={{ color: COLORS.dark }}
                            className="text-lg sm:text-xl font-bold"
                          >
                            {group.subject}
                          </h2>
                          <p style={{ color: "#555" }} className="text-xs mt-1">
                            {group.totalActivities} activities • {group.totalHours.toFixed(1)} hours
                          </p>
                        </div>
                        {group.lastActivity && (
                          <div className="text-right">
                            <p style={{ color: "#555" }} className="text-xs">
                              Last activity
                            </p>
                            <p
                              style={{ color: COLORS.primary }}
                              className="text-sm font-semibold"
                            >
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
                    <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                      {group.activities.map((activity, index) => (
                        <div
                          key={activity.id}
                          className="flex gap-2 sm:gap-3 pb-2 sm:pb-3"
                          style={{
                            borderBottom:
                              index < group.activities.length - 1
                                ? "1px solid #e5e7eb"
                                : "none",
                          }}
                        >
                          {/* Timeline Marker */}
                          <div className="flex flex-col items-center flex-shrink-0 mt-1">
                            <div
                              style={{ backgroundColor: COLORS.primary }}
                              className="w-3 h-3 rounded-full"
                            />
                            {index < group.activities.length - 1 && (
                              <div
                                style={{
                                  backgroundColor: "#e5e7eb",
                                  width: "2px",
                                  height: "40px",
                                  marginTop: "8px",
                                }}
                              />
                            )}
                          </div>

                          {/* Activity Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span
                                style={{
                                  backgroundColor: COLORS.light,
                                  color: COLORS.primary,
                                }}
                                className="px-2 py-1 rounded text-xs font-semibold flex-shrink-0"
                              >
                                {formatFullDate(activity.date)}
                              </span>
                              <span
                                style={{ color: "#333" }}
                                className="text-sm font-semibold flex-shrink-0"
                              >
                                {activity.duration}h
                              </span>
                              {activity.activity_type &&
                                activity.activity_type !== "Core Subject" && (
                                  <span
                                    style={{
                                      backgroundColor: "#fff3cd",
                                      color: "#856404",
                                    }}
                                    className="px-2 py-1 rounded text-xs font-medium flex-shrink-0"
                                  >
                                    {activity.activity_type}
                                  </span>
                                )}
                            </div>

                            {activity.platform && (
                              <p style={{ color: "#555" }} className="text-xs sm:text-sm mb-1">
                                <span className="font-medium">Platform:</span>{" "}
                                {activity.platform}
                              </p>
                            )}

                            {activity.curriculum && (
                              <p style={{ color: "#555" }} className="text-xs sm:text-sm mb-1">
                                <span className="font-medium">Curriculum:</span>{" "}
                                {activity.curriculum}
                              </p>
                            )}

                            {activity.notes && (
                              <p style={{ color: "#333" }} className="text-xs sm:text-sm italic mt-2">
                                "{activity.notes}"
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
