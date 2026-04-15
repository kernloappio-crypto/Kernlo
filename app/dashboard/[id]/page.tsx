"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";

export const dynamic = "force-dynamic";
import { getActivities, addActivity, deleteActivity } from "@/lib/supabase-data";

interface Activity {
  id: string;
  child_name: string;
  subject: string;
  duration: number;
  platform: string;
  date: string;
  notes?: string;
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

export default function KidDetailPage() {
  const params = useParams();
  const router = useRouter();
  const kidId = params.id as string;

  const [userId, setUserId] = useState("");
  const [kid, setKid] = useState<Kid | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [logSubject, setLogSubject] = useState("");
  const [logDuration, setLogDuration] = useState("");
  const [logPlatform, setLogPlatform] = useState("");
  const [logNotes, setLogNotes] = useState("");

  useEffect(() => {
    const initializeUser = async () => {
      try {
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
        );
        setActivities(kidActivities as Activity[]);

        setLoading(false);
      } catch (err) {
        console.error("Error initializing:", err);
        setLoading(false);
      }
    };

    initializeUser();
  }, [kidId, router]);

  async function handleQuickLog() {
    if (!logSubject || !logDuration || !logPlatform) {
      alert("Subject, duration, and platform are required");
      return;
    }

    try {
      await addActivity(
        userId,
        kid!.name,
        logSubject,
        parseFloat(logDuration),
        logPlatform,
        logDate,
        logNotes || undefined
      );

      // Reload activities
      const activitiesData = await getActivities(userId);
      const kidActivities = activitiesData.filter((a: any) => a.child_name === kid!.name);
      setActivities(kidActivities as Activity[]);

      // Reset form
      setLogDate(new Date().toISOString().split("T")[0]);
      setLogSubject("");
      setLogDuration("");
      setLogPlatform("");
      setLogNotes("");
      setShowQuickLog(false);
    } catch (err) {
      console.error("Error logging activity:", err);
      alert("Failed to log activity");
    }
  }

  async function handleDeleteActivity(activityId: string) {
    if (!confirm("Delete this activity?")) return;

    try {
      await deleteActivity(activityId);
      setActivities(activities.filter((a) => a.id !== activityId));
    } catch (err) {
      console.error("Error deleting activity:", err);
      alert("Failed to delete activity");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!kid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Child not found</p>
      </div>
    );
  }

  return (
    <main style={{ backgroundColor: COLORS.light, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb" }} className="p-6">
        <div className="max-w-7xl mx-auto">
          <Link href="/dashboard" style={{ color: COLORS.primary }} className="text-sm font-medium mb-4 block">
            ← Back to Dashboard
          </Link>
          <h1 style={{ color: COLORS.dark }} className="text-3xl font-bold">
            {kid.name}
          </h1>
          {kid.age && (
            <p style={{ color: "#666" }} className="text-sm mt-2">
              Age {kid.age}
              {kid.grade && ` • Grade ${kid.grade}`}
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Quick Log Button */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowQuickLog(!showQuickLog)}
            style={{ backgroundColor: COLORS.primary }}
            className="px-6 py-3 text-white font-medium rounded-lg hover:opacity-90"
          >
            {showQuickLog ? "Cancel" : "+ Log Activity"}
          </button>
          <Link
            href={`/dashboard/${kid.id}/goals`}
            style={{ borderColor: COLORS.primary, color: COLORS.primary }}
            className="px-6 py-3 font-medium rounded-lg border hover:bg-gray-50"
          >
            Goals
          </Link>
          <Link
            href={`/dashboard/${kid.id}/compliance`}
            style={{ borderColor: COLORS.primary, color: COLORS.primary }}
            className="px-6 py-3 font-medium rounded-lg border hover:bg-gray-50"
          >
            Compliance
          </Link>
        </div>

        {/* Quick Log Form */}
        {showQuickLog && (
          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 border border-gray-200">
            <h2 style={{ color: COLORS.dark }} className="text-lg font-bold mb-4">
              Log Activity
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label style={{ color: "#666" }} className="text-sm font-medium block mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  style={{ color: "#1a1a2e" }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label style={{ color: "#666" }} className="text-sm font-medium block mb-2">
                  Subject
                </label>
                <select
                  value={logSubject}
                  onChange={(e) => setLogSubject(e.target.value)}
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
                <label style={{ color: "#666" }} className="text-sm font-medium block mb-2">
                  Duration (hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="1.5"
                  value={logDuration}
                  onChange={(e) => setLogDuration(e.target.value)}
                  style={{ color: "#1a1a2e" }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label style={{ color: "#666" }} className="text-sm font-medium block mb-2">
                  Platform
                </label>
                <input
                  type="text"
                  placeholder="Khan Academy, IXL, Outschool..."
                  value={logPlatform}
                  onChange={(e) => setLogPlatform(e.target.value)}
                  style={{ color: "#1a1a2e" }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label style={{ color: "#666" }} className="text-sm font-medium block mb-2">
                  Notes (optional)
                </label>
                <textarea
                  placeholder="What did they learn?"
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  style={{ color: "#1a1a2e" }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>

            <button
              onClick={handleQuickLog}
              style={{ backgroundColor: COLORS.primary }}
              className="w-full px-4 py-2 text-white font-medium rounded-lg hover:opacity-90"
            >
              Log Activity
            </button>
          </div>
        )}

        {/* Activities List */}
        <div>
          <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-4">
            Activity Log
          </h2>

          {activities.length === 0 ? (
            <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-8 text-center border border-gray-200">
              <p style={{ color: "#666" }}>No activities logged yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  style={{ backgroundColor: "white", borderRadius: "12px" }}
                  className="p-4 border border-gray-200 flex items-start justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span style={{ backgroundColor: COLORS.light, color: COLORS.primary }} className="px-2 py-1 rounded text-xs font-medium">
                        {activity.subject}
                      </span>
                      <span style={{ color: "#666" }} className="text-sm">
                        {activity.duration}h • {activity.platform}
                      </span>
                    </div>
                    {activity.notes && (
                      <p style={{ color: "#666" }} className="text-sm">
                        {activity.notes}
                      </p>
                    )}
                    <p style={{ color: "#999" }} className="text-xs mt-2">
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteActivity(activity.id)}
                    style={{ color: "#ff6b6b" }}
                    className="text-sm font-medium hover:opacity-70"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
