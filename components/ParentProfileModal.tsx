"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";

interface ParentProfile {
  id?: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  address?: string;
  phone?: string;
  home_school_name?: string;
  website?: string;
  created_at?: string;
  updated_at?: string;
}

interface ParentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  onProfileUpdate?: (profile: ParentProfile) => void;
}

const COLORS = {
  primary: "#0066cc",
  dark: "#1a1a2e",
};

export default function ParentProfileModal({
  isOpen,
  onClose,
  userId,
  userEmail,
  onProfileUpdate,
}: ParentProfileModalProps) {
  const [profile, setProfile] = useState<ParentProfile>({
    user_id: userId,
    first_name: "",
    last_name: "",
    email: userEmail,
    address: "",
    phone: "",
    home_school_name: "",
    website: "",
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Fetch existing profile on open
  useEffect(() => {
    if (isOpen && userId) {
      fetchProfile();
    }
  }, [isOpen, userId]);

  async function fetchProfile() {
    setLoading(true);
    setError("");
    try {
      const { data, error: fetchError } = await supabase
        .from("parent_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116 = not found, which is OK for new users
        console.error("Error fetching profile:", fetchError);
        setError("Failed to load profile");
        return;
      }

      if (data) {
        setProfile({
          ...profile,
          ...data,
          email: userEmail, // Always use current auth email
        });
      } else {
        // New profile - just set email
        setProfile((prev) => ({
          ...prev,
          email: userEmail,
        }));
      }
    } catch (err: any) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    // Validate required fields
    if (!profile.first_name.trim() || !profile.last_name.trim()) {
      setError("First name and last name are required");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      // Try to update existing profile, or insert new one
      const { data, error: upsertError } = await supabase
        .from("parent_profiles")
        .upsert(
          {
            user_id: userId,
            first_name: profile.first_name.trim(),
            last_name: profile.last_name.trim(),
            email: userEmail,
            address: profile.address?.trim() || null,
            phone: profile.phone?.trim() || null,
            home_school_name: profile.home_school_name?.trim() || null,
            website: profile.website?.trim() || null,
          },
          { onConflict: "user_id" }
        )
        .select();

      if (upsertError) {
        console.error("Error saving profile:", upsertError);
        setError("Failed to save profile: " + upsertError.message);
        return;
      }

      if (data && data[0]) {
        setProfile(data[0]);
        setSuccess(true);
        if (onProfileUpdate) {
          onProfileUpdate(data[0]);
        }

        // Close modal after 1.5 seconds
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      console.error("Error saving profile:", err);
      setError("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-y-auto"
    >
      <div
        style={{ backgroundColor: "white", borderRadius: "12px" }}
        className="p-6 sm:p-8 max-w-md w-full my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 style={{ color: COLORS.dark }} className="text-xl sm:text-2xl font-bold">
            👤 Parent Profile
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div
            style={{ backgroundColor: "#d4edda", borderColor: "#c3e6cb", color: "#155724" }}
            className="p-3 rounded-lg mb-4 border text-sm font-medium"
          >
            ✅ Profile saved successfully!
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            style={{ backgroundColor: "#f8d7da", borderColor: "#f5c6cb", color: "#721c24" }}
            className="p-3 rounded-lg mb-4 border text-sm font-medium"
          >
            ❌ {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div style={{ color: "#666" }} className="text-center py-6">
            Loading profile...
          </div>
        ) : (
          <>
            {/* Form Fields */}
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {/* First Name */}
              <div>
                <label style={{ color: COLORS.dark }} className="block text-sm font-semibold mb-2">
                  First Name <span style={{ color: "#ff6b6b" }}>*</span>
                </label>
                <input
                  type="text"
                  value={profile.first_name}
                  onChange={(e) =>
                    setProfile({ ...profile, first_name: e.target.value })
                  }
                  placeholder="e.g., John"
                  style={{
                    color: COLORS.dark,
                    borderColor: "#ddd",
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Last Name */}
              <div>
                <label style={{ color: COLORS.dark }} className="block text-sm font-semibold mb-2">
                  Last Name <span style={{ color: "#ff6b6b" }}>*</span>
                </label>
                <input
                  type="text"
                  value={profile.last_name}
                  onChange={(e) =>
                    setProfile({ ...profile, last_name: e.target.value })
                  }
                  placeholder="e.g., Doe"
                  style={{
                    color: COLORS.dark,
                    borderColor: "#ddd",
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Email (Read-only) */}
              <div>
                <label style={{ color: COLORS.dark }} className="block text-sm font-semibold mb-2">
                  Email (Read-only)
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  style={{
                    color: "#999",
                    backgroundColor: "#f9f9f9",
                    borderColor: "#ddd",
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 cursor-not-allowed"
                />
              </div>

              {/* Address */}
              <div>
                <label style={{ color: COLORS.dark }} className="block text-sm font-semibold mb-2">
                  Address (Optional)
                </label>
                <input
                  type="text"
                  value={profile.address || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, address: e.target.value })
                  }
                  placeholder="e.g., 123 Main St, City, State"
                  style={{
                    color: COLORS.dark,
                    borderColor: "#ddd",
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label style={{ color: COLORS.dark }} className="block text-sm font-semibold mb-2">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={profile.phone || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, phone: e.target.value })
                  }
                  placeholder="e.g., (555) 123-4567"
                  style={{
                    color: COLORS.dark,
                    borderColor: "#ddd",
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Home School Name */}
              <div>
                <label style={{ color: COLORS.dark }} className="block text-sm font-semibold mb-2">
                  Home School Name (Optional)
                </label>
                <input
                  type="text"
                  value={profile.home_school_name || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, home_school_name: e.target.value })
                  }
                  placeholder="e.g., Doe Family Academy"
                  style={{
                    color: COLORS.dark,
                    borderColor: "#ddd",
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Website/Social */}
              <div>
                <label style={{ color: COLORS.dark }} className="block text-sm font-semibold mb-2">
                  Website/Social (Optional)
                </label>
                <input
                  type="text"
                  value={profile.website || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, website: e.target.value })
                  }
                  placeholder="e.g., www.example.com"
                  style={{
                    color: COLORS.dark,
                    borderColor: "#ddd",
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 sm:gap-3 flex-col sm:flex-row">
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  backgroundColor: saving ? "#ccc" : COLORS.primary,
                }}
                className="flex-1 px-4 py-2.5 text-white font-semibold rounded-lg hover:opacity-90 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>
              <button
                onClick={onClose}
                disabled={saving}
                style={{
                  color: COLORS.dark,
                  borderColor: "#ddd",
                }}
                className="flex-1 px-4 py-2.5 border font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
