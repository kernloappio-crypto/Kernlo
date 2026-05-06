"use client";

import { useState } from "react";
import { useActivityActions } from "@/context/ActivityActionsContext";

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

interface ActivityActionSheetProps {
  activity: CombinedActivity | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (activity: CombinedActivity) => void;
  onRefresh: () => void;
}

const COLORS = {
  primary: "#0066cc",
  dark: "#1a1a2e",
};

export default function ActivityActionSheet({
  activity,
  isOpen,
  onClose,
  onEdit,
  onRefresh,
}: ActivityActionSheetProps) {
  const { markComplete, deleteActivity, isLoading } = useActivityActions();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleMarkComplete = async () => {
    if (!activity) return;
    try {
      await markComplete(activity);
      onRefresh();
      onClose();
    } catch (e) {
      alert("Failed to mark activity complete");
    }
  };

  const handleEdit = () => {
    if (activity) {
      onEdit(activity);
      onClose();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!activity) return;
    try {
      await deleteActivity(activity);
      onRefresh();
      onClose();
      setShowDeleteConfirm(false);
    } catch (e) {
      alert("Failed to delete activity");
    }
  };

  if (!isOpen || !activity) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        className="fixed inset-0 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Action Sheet */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "white",
          borderRadius: "16px 16px 0 0",
          padding: "16px",
          maxHeight: "50vh",
          zIndex: 50,
          animation: "slideUp 0.3s ease-out",
        }}
        className="overflow-y-auto"
      >
        {/* Close Handle */}
        <div className="flex justify-center mb-3">
          <div
            style={{
              width: "36px",
              height: "4px",
              backgroundColor: "#ccc",
              borderRadius: "2px",
            }}
          />
        </div>

        {/* Activity Info */}
        <div className="mb-4 pb-4 border-b border-gray-200">
          <h3 style={{ color: COLORS.dark, fontSize: "14px", fontWeight: "600", marginBottom: "4px" }}>
            {activity.subject || activity.activity_name || activity.trip_name || "Activity"}
          </h3>
          <p style={{ color: "#666", fontSize: "12px" }}>
            {new Date(activity.date).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <p style={{ color: "#dc2626", fontSize: "12px", fontWeight: "500", marginBottom: "8px" }}>
              Are you sure? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteConfirm}
                disabled={isLoading}
                style={{
                  flex: 1,
                  backgroundColor: "#dc2626",
                  color: "white",
                  padding: "8px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "600",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {isLoading ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  flex: 1,
                  backgroundColor: "#f3f4f6",
                  color: COLORS.dark,
                  padding: "8px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "600",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!showDeleteConfirm && (
          <div className="space-y-2">
            <button
              onClick={handleMarkComplete}
              disabled={isLoading}
              style={{
                width: "100%",
                backgroundColor: COLORS.primary,
                color: "white",
                padding: "14px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "600",
                border: "none",
                cursor: "pointer",
                minHeight: "50px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✓ Mark Complete
            </button>

            <button
              onClick={handleEdit}
              disabled={isLoading}
              style={{
                width: "100%",
                backgroundColor: "#f3f4f6",
                color: COLORS.dark,
                padding: "14px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "600",
                border: "none",
                cursor: "pointer",
                minHeight: "50px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✏️ Edit
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isLoading}
              style={{
                width: "100%",
                backgroundColor: "#fee2e2",
                color: "#dc2626",
                padding: "14px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "600",
                border: "none",
                cursor: "pointer",
                minHeight: "50px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              🗑️ Delete
            </button>

            <button
              onClick={onClose}
              style={{
                width: "100%",
                backgroundColor: "white",
                color: COLORS.dark,
                padding: "12px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "600",
                border: `1px solid #e5e7eb`,
                cursor: "pointer",
                minHeight: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
