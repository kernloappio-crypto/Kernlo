"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import Navbar from "@/components/Navbar";
import {
  getExtracurricularActivities,
  addExtracurricularActivity,
  deleteExtracurricularActivity,
  updateExtracurricularActivity,
} from "@/lib/supabase-data";

export const dynamic = "force-dynamic";

interface ExtracurricularActivity {
  id: string;
  kid_id: string;
  activity_name: string;
  date: string;
  notes?: string;
  created_at?: string;
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

export default function ExtracurricularPage() {
  const params = useParams();
  const router = useRouter();
  const kidId = params.id as string;

  const [userId, setUserId] = useState("");
  const [kid, setKid] = useState<Kid | null>(null);
  const [activities, setActivities] = useState<ExtracurricularActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formActivityName, setFormActivityName] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

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

          // Load activities
          try {
            const activitiesData = await getExtracurricularActivities(user.id, kidId);
            setActivities(activitiesData as ExtracurricularActivity[]);
          } catch (err) {
            console.error("Error loading activities:", err);
            setActivities([]);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Error initializing:", err);
        setLoading(false);
      }
    };

    init();
  }, [kidId, router]);

  const handleSubmit = async () => {
    if (!formActivityName.trim() || !formDate) {
      alert("Activity name and date are required");
      return;
    }

    try {
      if (editingId) {
        // Update
        await updateExtracurricularActivity(editingId, {
          activity_name: formActivityName,
          date: formDate,
          notes: formNotes || undefined,
        });
      } else {
        // Add new
        await addExtracurricularActivity(userId, kidId, formActivityName, formDate, formNotes);
      }

      // Reload activities
      const activitiesData = await getExtracurricularActivities(userId, kidId);
      setActivities(activitiesData as ExtracurricularActivity[]);

      // Reset form
      setFormActivityName("");
      setFormDate(new Date().toISOString().split("T")[0]);
      setFormNotes("");
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      console.error("Error saving activity:", err);
      alert("Failed to save activity");
    }
  };

  const handleDelete = async (activityId: string) => {
    if (!confirm("Delete this activity?")) return;

    try {
      await deleteExtracurricularActivity(activityId);
      setActivities(activities.filter((a) => a.id !== activityId));
    } catch (err) {
      console.error("Error deleting activity:", err);
      alert("Failed to delete activity");
    }
  };

  const handleEdit = (activity: ExtracurricularActivity) => {
    setEditingId(activity.id);
    setFormActivityName(activity.activity_name);
    setFormDate(activity.date);
    setFormNotes(activity.notes || "");
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormActivityName("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormNotes("");
  };

  return (
    <>
      <Navbar />
      <main style={{ backgroundColor: COLORS.light, minHeight: "100vh" }}>
        {/* Header */}
        <div style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb" }} className="sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <Link href={`/dashboard/${kidId}`} style={{ color: COLORS.primary }} className="text-sm font-medium mb-2 block">
                ← Back to {kid?.name || "Kid"}
              </Link>
              <h1 style={{ color: COLORS.dark }} className="text-2xl font-bold">
                🎭 Extracurricular Activities
              </h1>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              style={{ backgroundColor: COLORS.primary }}
              className="px-4 sm:px-6 py-2.5 text-white font-medium rounded-lg hover:opacity-90 text-sm min-h-12 sm:min-h-auto"
            >
              {showForm ? "Cancel" : "+ Add Activity"}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          {/* Add/Edit Form */}
          {showForm && (
            <div style={{ backgroundColor: "white", borderRadius: "12px", borderLeft: `4px solid ${COLORS.primary}` }} className="p-6 mb-6">
              <h2 style={{ color: COLORS.dark }} className="text-lg font-bold mb-4">
                {editingId ? "Edit Activity" : "Add New Activity"}
              </h2>
              <div className="space-y-4 mb-6">
                <div>
                  <label style={{ color: "#333" }} className="block text-sm font-medium mb-2">
                    Activity Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Soccer Practice, Piano Lessons, Art Class"
                    value={formActivityName}
                    onChange={(e) => setFormActivityName(e.target.value)}
                    style={{ color: "#1a1a2e" }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label style={{ color: "#333" }} className="block text-sm font-medium mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    style={{ color: "#1a1a2e" }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label style={{ color: "#333" }} className="block text-sm font-medium mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    placeholder="How did it go? Any progress to note?"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    style={{ color: "#1a1a2e" }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3 flex-col">
                <button
                  onClick={handleSubmit}
                  style={{ backgroundColor: COLORS.primary }}
                  className="w-full px-4 py-3 text-white font-semibold rounded-lg hover:opacity-90 text-sm min-h-12"
                >
                  {editingId ? "Update Activity" : "Add Activity"}
                </button>
                <button
                  onClick={handleCancel}
                  style={{ color: COLORS.dark, borderColor: "#333" }}
                  className="w-full px-4 py-3 border font-semibold rounded-lg hover:bg-gray-50 text-sm min-h-12"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Activities List */}
          {loading ? (
            <div className="text-center py-12">
              <p style={{ color: "#555" }}>Loading...</p>
            </div>
          ) : activities.length === 0 ? (
            <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 sm:p-8 text-center border border-gray-200">
              <p style={{ color: "#555" }} className="mb-4">
                No extracurricular activities logged yet.
              </p>
              <button
                onClick={() => setShowForm(true)}
                style={{ backgroundColor: COLORS.primary }}
                className="px-6 py-3 text-white font-medium rounded-lg hover:opacity-90 min-h-12"
              >
                + Add First Activity
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  style={{ backgroundColor: "white", borderRadius: "12px" }}
                  className="p-4 border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 style={{ color: COLORS.dark }} className="text-lg font-bold">
                          {activity.activity_name}
                        </h3>
                        <span style={{ backgroundColor: "#f0f7ff", color: COLORS.primary }} className="px-2 py-1 rounded text-xs font-medium">
                          {(() => {
                            // TIMEZONE FIX: Parse string directly without UTC conversion
                            const parts = activity.date.split('-');
                            const year = parseInt(parts[0], 10);
                            const month = parseInt(parts[1], 10);
                            const day = parseInt(parts[2], 10);
                            const d = new Date(year, month - 1, day);
                            return d.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            });
                          })()}
                        </span>
                      </div>
                      {activity.notes && (
                        <p style={{ color: "#666" }} className="text-sm">
                          {activity.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0 flex-wrap sm:flex-nowrap">
                      <button
                        onClick={() => handleEdit(activity)}
                        style={{ color: COLORS.primary }}
                        className="px-4 py-2 text-sm font-medium hover:opacity-70 min-h-10 active:bg-blue-50 rounded"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(activity.id)}
                        style={{ color: COLORS.accent1 }}
                        className="px-4 py-2 text-sm font-medium hover:opacity-70 min-h-10 active:bg-red-50 rounded"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
