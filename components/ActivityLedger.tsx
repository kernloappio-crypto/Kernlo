"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import { useReport } from "@/context/ReportContext";
import { useActivityActions } from "@/context/ActivityActionsContext";
import KidFilterButtons from "@/components/KidFilterButtons";
import ChildStatsBar from "@/components/ChildStatsBar";
import TotalsCounter from "@/components/TotalsCounter";
import ActivityActionSheet from "@/components/ActivityActionSheet";

interface Kid {
  id: string;
  name: string;
}

interface Activity {
  id: string;
  child_name: string;
  child_id?: string;
  subject: string;
  duration: number;
  platform: string;
  date: string;
  notes?: string;
  curriculum?: string;
  activity_type?: string;
  status?: string;
}

interface ActivityLedgerProps {
  userId: string;
  kids: Kid[];
  activities: Activity[];
  isMobile: boolean;
  refreshCounter: number;
  onActivityEdited: () => void;
}

interface CombinedActivity {
  id: string;
  child_id: string;
  child_name: string;
  subject?: string;
  activity_name?: string;
  trip_name?: string;
  destination?: string;
  date: string;
  notes?: string;
  type: "Activity" | "Field Trip" | "Extracurricular";
  duration: number;
  duration_hours: string;
}

interface GroupedActivities {
  [childId: string]: {
    child: Kid;
    activities: CombinedActivity[];
    fieldTripCount: number;
    extracurricularCount: number;
  };
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

const SUBJECT_ICONS: { [key: string]: string } = {
  Math: "🔢",
  English: "📖",
  Science: "🔬",
  History: "📚",
  "Social Studies": "🌍",
  Arts: "🎨",
  "Physical Education": "⚽",
  Other: "📝",
};

export default function ActivityLedger({
  userId,
  kids,
  activities,
  isMobile,
  refreshCounter,
  onActivityEdited,
}: ActivityLedgerProps) {
  const { selectedKid, setSelectedKid } = useReport();
  const { editActivity, deleteActivity, isLoading: isActionLoading } = useActivityActions();
  const [ledgerTab, setLedgerTab] = useState<"all" | "field-trips" | "extracurricular">("all");
  const [groupedActivities, setGroupedActivities] = useState<GroupedActivities>({});
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [editingActivity, setEditingActivity] = useState<CombinedActivity | null>(null);
  const [editDuration, setEditDuration] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [mobileActionSheetActivity, setMobileActionSheetActivity] = useState<CombinedActivity | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);

  // Load and group all activities
  useEffect(() => {
    loadAndGroupActivities();
  }, [refreshCounter, ledgerTab, sortOrder]);

  const loadAndGroupActivities = async () => {
    try {
      let combined: CombinedActivity[] = [];

      // Get core activities
      const coreActivities = activities.map((a) => ({
        ...a,
        child_id: kids.find(k => k.name === a.child_name)?.id || "",
        type: "Activity" as const,
        duration_hours: (a.duration / 60).toFixed(1),
      }));

      combined.push(...coreActivities);

      // Get field trips if needed
      if (ledgerTab === "all" || ledgerTab === "field-trips") {
        try {
          const { data: fieldTripsData, error } = await supabase
            .from("field_trips")
            .select("*")
            .order("date", { ascending: false });

          if (!error && fieldTripsData) {
            const fieldTrips = fieldTripsData.map((ft: any) => {
              const kid = kids.find((k) => k.id === ft.kid_id);
              return {
                id: ft.id,
                child_id: ft.kid_id,
                child_name: kid?.name || "Unknown",
                trip_name: ft.trip_name,
                destination: ft.destination,
                date: ft.date,
                notes: ft.notes,
                type: "Field Trip" as const,
                duration: 0,
                duration_hours: "-",
              };
            });
            combined.push(...fieldTrips);
          }
        } catch (e) {
          console.log("Could not fetch field trips");
        }
      }

      // Get extracurricular if needed
      if (ledgerTab === "all" || ledgerTab === "extracurricular") {
        try {
          const { data: extracurrData, error } = await supabase
            .from("extracurricular_activities")
            .select("*")
            .order("date", { ascending: false });

          if (!error && extracurrData) {
            const extracurr = extracurrData.map((ea: any) => {
              const kid = kids.find((k) => k.id === ea.kid_id);
              return {
                id: ea.id,
                child_id: ea.kid_id,
                child_name: kid?.name || "Unknown",
                activity_name: ea.activity_name,
                date: ea.date,
                notes: ea.notes,
                type: "Extracurricular" as const,
                duration: 0,
                duration_hours: "-",
              };
            });
            combined.push(...extracurr);
          }
        } catch (e) {
          console.log("Could not fetch extracurricular");
        }
      }

      // Sort by date
      combined.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
      });

      // Group by child_id, preserving kid order
      const grouped: GroupedActivities = {};
      
      kids.forEach((kid) => {
        grouped[kid.id] = {
          child: kid,
          activities: [],
          fieldTripCount: 0,
          extracurricularCount: 0,
        };
      });

      combined.forEach((activity) => {
        if (grouped[activity.child_id]) {
          grouped[activity.child_id].activities.push(activity);
          
          if (activity.type === "Field Trip") {
            grouped[activity.child_id].fieldTripCount += 1;
          } else if (activity.type === "Extracurricular") {
            grouped[activity.child_id].extracurricularCount += 1;
          }
        }
      });

      setGroupedActivities(grouped);
    } catch (e) {
      console.error("Error loading activities:", e);
    }
  };



  const handleMobileActionSheet = (activity: CombinedActivity) => {
    setMobileActionSheetActivity(activity);
    setShowActionSheet(true);
  };

  const handleEditClick = (activity: CombinedActivity) => {
    setEditingActivity(activity);
    setEditDuration(activity.duration_hours || "");
    setEditSubject(activity.subject || "");
    setEditDate(activity.date || "");
    setEditNotes(activity.notes || "");
  };

  const handleSaveEdit = async () => {
    if (!editingActivity) return;

    setIsSaving(true);
    try {
      await editActivity(editingActivity, {
        duration: parseFloat(editDuration),
        subject: editSubject,
        date: editDate,
        notes: editNotes,
      });

      setEditingActivity(null);
      onActivityEdited();
      loadAndGroupActivities();
    } catch (e) {
      console.error("Error saving edit:", e);
      alert("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case "Activity":
        return "#3b82f6";
      case "Field Trip":
        return "#f59e0b";
      case "Extracurricular":
        return "#ec4899";
      default:
        return "#6b7280";
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case "Activity":
        return "📚";
      case "Field Trip":
        return "🚌";
      case "Extracurricular":
        return "🎭";
      default:
        return "📝";
    }
  };

  const filteredGroup = (activities: CombinedActivity[]) => {
    return ledgerTab === "all"
      ? activities
      : ledgerTab === "field-trips"
      ? activities.filter((a) => a.type === "Field Trip")
      : activities.filter((a) => a.type === "Extracurricular");
  };

  // Get current kid's activities
  const currentKidActivities = selectedKid && groupedActivities[selectedKid] 
    ? groupedActivities[selectedKid] 
    : null;
  
  const displayedActivities = currentKidActivities 
    ? filteredGroup(currentKidActivities.activities)
    : [];

  const hasAnyActivities = selectedKid && currentKidActivities
    ? currentKidActivities.activities.length > 0
    : false;

  return (
    <div style={{ backgroundColor: "white", display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }} className="p-4 sm:p-6">
        <h2 style={{ color: COLORS.dark }} className="text-lg sm:text-xl font-bold mb-4">
          📋 Activity Ledger
        </h2>

        {/* Kid Filter Buttons */}
        <div className="mb-4">
          <label style={{ color: "#666" }} className="block text-xs font-medium mb-2">
            Filter by Child:
          </label>
          <KidFilterButtons kids={kids} />
        </div>

        {/* Totals Counter - High Visibility */}
        {selectedKid && (
          <TotalsCounter groupedActivities={groupedActivities} ledgerTab={ledgerTab} />
        )}

        {/* Stats Bar - Only show if kid is selected */}
        {selectedKid && currentKidActivities && (
          <ChildStatsBar
            childName={currentKidActivities.child.name}
            fieldTripCount={currentKidActivities.fieldTripCount}
            extracurricularCount={currentKidActivities.extracurricularCount}
          />
        )}

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {[
            { id: "all", label: "All Activities" },
            { id: "field-trips", label: "Field Trips" },
            { id: "extracurricular", label: "Extracurriculars" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setLedgerTab(tab.id as any)}
              style={{
                backgroundColor: ledgerTab === tab.id ? COLORS.primary : "white",
                color: ledgerTab === tab.id ? "white" : COLORS.dark,
                borderColor: COLORS.primary,
              }}
              className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border transition-all whitespace-nowrap"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort Order */}
        <div className="flex items-center gap-2 mt-3">
          <label style={{ color: "#666" }} className="text-xs font-medium">
            Sort:
          </label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
            style={{ borderColor: "#ccc" }}
            className="px-2 py-1 border rounded text-xs"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto" }} className="px-4 sm:px-6 py-4">
        {!selectedKid ? (
          <div className="text-center py-8">
            <p style={{ color: "#999" }} className="text-sm">
              👆 Select a child above to view their activities
            </p>
          </div>
        ) : !hasAnyActivities ? (
          <div className="text-center py-8">
            <p style={{ color: "#999" }} className="text-sm">
              No activities for {currentKidActivities?.child.name}
            </p>
          </div>
        ) : !isMobile ? (
          // Desktop: Simple table for filtered kid
          <div className="overflow-x-auto">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                  <th style={{ color: COLORS.dark, padding: "10px 12px", textAlign: "left", fontSize: "11px", fontWeight: "600", width: "10%" }}>Date</th>
                  <th style={{ color: COLORS.dark, padding: "10px 12px", textAlign: "left", fontSize: "11px", fontWeight: "600", width: "45%" }}>Subject/Activity</th>
                  <th style={{ color: COLORS.dark, padding: "10px 12px", textAlign: "left", fontSize: "11px", fontWeight: "600", width: "10%" }}>Duration</th>
                  <th style={{ color: COLORS.dark, padding: "10px 12px", textAlign: "left", fontSize: "11px", fontWeight: "600", width: "10%" }}>Type</th>
                  <th style={{ color: COLORS.dark, padding: "10px 12px", textAlign: "center", fontSize: "11px", fontWeight: "600", width: "25%" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedActivities.map((activity, idx) => (
                  <tr
                    key={`${activity.id}-${idx}`}
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      backgroundColor: idx % 2 === 0 ? "white" : "#f9fafb",
                    }}
                  >
                    <td style={{ padding: "10px 12px", fontSize: "11px", color: "#666" }}>
                      {new Date(activity.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: "12px", color: COLORS.dark }}>
                      {activity.subject && (
                        <span>
                          {SUBJECT_ICONS[activity.subject] || "📝"} {activity.subject}
                        </span>
                      )}
                      {activity.activity_name && <span>{activity.activity_name}</span>}
                      {activity.trip_name && (
                        <span>
                          {activity.trip_name}
                          {activity.destination && <span> → {activity.destination}</span>}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: "11px", color: "#666" }}>
                      {activity.duration_hours === "-" ? "-" : `${activity.duration_hours}h`}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span
                        style={{
                          backgroundColor: getTypeColor(activity.type),
                          color: "white",
                          padding: "3px 6px",
                          borderRadius: "3px",
                          fontSize: "10px",
                          fontWeight: "600",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {getTypeIcon(activity.type)} {activity.type}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleEditClick(activity)}
                          style={{ color: COLORS.primary }}
                          className="text-xs font-medium hover:underline"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleMobileActionSheet(activity)}
                          style={{ color: "#10b981" }}
                          className="text-xs font-medium hover:underline"
                          title="Mark Complete"
                        >
                          ✓
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm("Delete this activity?")) {
                              try {
                                await deleteActivity(activity);
                                onActivityEdited();
                                loadAndGroupActivities();
                              } catch (e) {
                                alert("Failed to delete activity");
                              }
                            }
                          }}
                          style={{ color: "#ef4444" }}
                          className="text-xs font-medium hover:underline"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // Mobile: Card layout for filtered kid
          <div className="space-y-2">
            {displayedActivities.map((activity) => (
              <div
                key={activity.id}
                style={{
                  backgroundColor: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  padding: "12px",
                  cursor: "pointer",
                }}
                onClick={() => handleMobileActionSheet(activity)}
              >
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="flex-1">
                    <p style={{ color: "#666", fontSize: "11px" }}>
                      {new Date(activity.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <span
                    style={{
                      backgroundColor: getTypeColor(activity.type),
                      color: "white",
                      padding: "2px 6px",
                      borderRadius: "3px",
                      fontSize: "9px",
                      fontWeight: "600",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {getTypeIcon(activity.type)} {activity.type}
                  </span>
                </div>

                <div className="mb-2">
                  {activity.subject && (
                    <p style={{ color: COLORS.dark, fontSize: "12px", fontWeight: "600" }}>
                      {SUBJECT_ICONS[activity.subject] || "📝"} {activity.subject}
                    </p>
                  )}
                  {activity.activity_name && (
                    <p style={{ color: COLORS.dark, fontSize: "12px", fontWeight: "600" }}>
                      {activity.activity_name}
                    </p>
                  )}
                  {activity.trip_name && (
                    <p style={{ color: COLORS.dark, fontSize: "12px", fontWeight: "600" }}>
                      {activity.trip_name}
                      {activity.destination && <span> → {activity.destination}</span>}
                    </p>
                  )}
                </div>

                {activity.duration_hours !== "-" && (
                  <p style={{ color: "#666", fontSize: "11px", marginBottom: "8px" }}>
                    ⏱️ {activity.duration_hours}h
                  </p>
                )}

                <p style={{ color: COLORS.primary, fontSize: "11px", fontWeight: "600" }}>
                  👆 Tap to view options
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Action Sheet */}
      {isMobile && (
        <ActivityActionSheet
          activity={mobileActionSheetActivity}
          isOpen={showActionSheet}
          onClose={() => setShowActionSheet(false)}
          onEdit={(activity) => {
            handleEditClick(activity);
            setShowActionSheet(false);
          }}
          onRefresh={() => {
            loadAndGroupActivities();
            onActivityEdited();
          }}
        />
      )}

      {/* Edit Modal */}
      {editingActivity && (
        <div style={{ backgroundColor: "rgba(0,0,0,0.5)" }} className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px", maxWidth: "400px", width: "100%", margin: "auto" }}>
            <h3 style={{ color: COLORS.dark }} className="text-lg font-bold mb-4">
              ✏️ Edit Activity
            </h3>

            <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
              <div>
                <label style={{ color: COLORS.dark }} className="block text-sm font-semibold mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded text-sm"
                  style={{ borderColor: "#ccc" }}
                />
              </div>

              {editingActivity.type === "Activity" && (
                <>
                  <div>
                    <label style={{ color: COLORS.dark }} className="block text-sm font-semibold mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      className="w-full px-3 py-2 border rounded text-sm"
                      style={{ borderColor: "#ccc" }}
                    />
                  </div>

                  <div>
                    <label style={{ color: COLORS.dark }} className="block text-sm font-semibold mb-1">
                      Duration (hours)
                    </label>
                    <input
                      type="number"
                      value={editDuration}
                      onChange={(e) => setEditDuration(e.target.value)}
                      step="0.5"
                      min="0"
                      className="w-full px-3 py-2 border rounded text-sm"
                      style={{ borderColor: "#ccc" }}
                    />
                  </div>
                </>
              )}

              <div>
                <label style={{ color: COLORS.dark }} className="block text-sm font-semibold mb-1">
                  Notes
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add notes..."
                  className="w-full px-3 py-2 border rounded text-sm"
                  style={{ borderColor: "#ccc" }}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                style={{ backgroundColor: COLORS.primary, color: "white", minHeight: "44px" }}
                className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center hover:opacity-90 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setEditingActivity(null)}
                style={{ borderColor: "#ccc", color: COLORS.dark, minHeight: "44px" }}
                className="flex-1 px-4 py-2.5 border rounded-lg font-semibold text-sm flex items-center justify-center hover:bg-gray-50"
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
