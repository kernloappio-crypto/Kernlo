"use client";

import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { Kid, ActivityTemplate } from "@/lib/types";

const COLORS = {
  primary: "#0066cc",
  dark: "#1a1a2e",
};

interface QuickLogProps {
  isOpen: boolean;
  onClose: () => void;
  kids: Kid[];
  templates: ActivityTemplate[];
}

export function QuickLogModal({ isOpen, onClose, kids, templates }: QuickLogProps) {
  const { supabase, user } = useAuth();
  const [selectedKid, setSelectedKid] = useState(kids[0]?.id || "");
  const [subject, setSubject] = useState("");
  const [hours, setHours] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!user || !selectedKid || !subject || hours === 0) return;

    setLoading(true);

    try {
      const { data: workspace } = await supabase
        .from("workspaces")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!workspace) return;

      // Create a quick report
      const kidName = kids.find(k => k.id === selectedKid)?.name || "Unknown";
      const newReport = {
        workspace_id: workspace.id,
        kid_id: selectedKid,
        child_name: kidName,
        report_type: "daily" as const,
        generated_date: new Date().toISOString().split("T")[0],
        subjects: [{
          id: Math.random().toString(36).substr(2, 9),
          date: new Date().toISOString().split("T")[0],
          subject,
          platform: "Quick Log",
          topics: notes,
          duration: (hours * 60).toString(),
        }],
        report_content: `${kidName} spent ${hours} hours on ${subject}.`,
        created_by: user.id,
      };

      const { error } = await supabase
        .from("reports")
        .insert([newReport]);

      if (!error) {
        setSubject("");
        setHours(0);
        setNotes("");
        onClose();
      }
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div style={{ backgroundColor: "rgba(0,0,0,0.5)" }} className="fixed inset-0 flex items-center justify-center p-4 z-50">
      <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-8 max-w-md w-full">
        <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-6">
          ⚡ Quick Log
        </h2>

        {/* Kid Selector */}
        <div className="mb-4">
          <label style={{ color: "#666" }} className="text-sm font-medium block mb-2">
            Kid
          </label>
          <select
            value={selectedKid}
            onChange={(e) => setSelectedKid(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {kids.map((kid) => (
              <option key={kid.id} value={kid.id}>
                {kid.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subject with Template Suggestions */}
        <div className="mb-4">
          <label style={{ color: "#666" }} className="text-sm font-medium block mb-2">
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g., Math"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          {templates.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {templates.slice(0, 3).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSubject(t.name)}
                  className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Hours */}
        <div className="mb-4">
          <label style={{ color: "#666" }} className="text-sm font-medium block mb-2">
            Hours
          </label>
          <input
            type="number"
            step="0.5"
            value={hours}
            onChange={(e) => setHours(parseFloat(e.target.value))}
            placeholder="e.g., 1.5"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label style={{ color: "#666" }} className="text-sm font-medium block mb-2">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Worked on fractions"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            rows={3}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ backgroundColor: COLORS.primary }}
            className="flex-1 px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
