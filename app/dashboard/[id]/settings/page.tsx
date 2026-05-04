"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const COLORS = {
  primary: "#0066cc",
  primaryLight: "#e6f0ff",
  dark: "#1a1a2e",
  gray: "#6b7280",
  lightGray: "#f3f4f6",
  success: "#10b981",
  error: "#ef4444",
};

interface SettingsProfile {
  phone_number?: string;
  sms_notifications_enabled?: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const params = useParams();
  const kidId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [phoneNumber, setPhoneNumber] = useState("");
  const [smsNotificationsEnabled, setSmsNotificationsEnabled] = useState(false);

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError("");

        // Get auth token
        const token = localStorage.getItem("kernlo_access_token");
        if (!token) {
          router.push("/auth/login");
          return;
        }

        // Fetch user profile
        const response = await fetch("/api/profile/get", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setPhoneNumber(data.phone_number || "");
          setSmsNotificationsEnabled(data.sms_notifications_enabled || false);
        } else if (response.status === 401) {
          router.push("/auth/login");
        }
      } catch (err: any) {
        console.error("Error fetching settings:", err);
        // Don't error on initial load - user might not have settings yet
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [router]);

  async function handleSave() {
    try {
      setError("");
      setSuccess(false);

      // Validation
      if (smsNotificationsEnabled && !phoneNumber.trim()) {
        setError("Phone number is required when SMS notifications are enabled");
        return;
      }

      if (phoneNumber && phoneNumber.trim()) {
        // Basic phone validation
        const digitsOnly = phoneNumber.replace(/\D/g, "");
        if (digitsOnly.length < 10) {
          setError("Phone number must have at least 10 digits");
          return;
        }
      }

      setSaving(true);

      const token = localStorage.getItem("kernlo_access_token");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const response = await fetch("/api/profile/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone_number: phoneNumber.trim() || null,
          sms_notifications_enabled: smsNotificationsEnabled,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setSuccessMessage("Settings saved ✅");
        setTimeout(() => {
          setSuccess(false);
          setSuccessMessage("");
        }, 3000);
      } else {
        setError(data.error || "Failed to save settings");
      }
    } catch (err: any) {
      console.error("Error saving settings:", err);
      setError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Navbar />
      <div style={{ backgroundColor: COLORS.lightGray, minHeight: "100vh" }} className="py-8">
        <div className="max-w-md mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <Link
              href={`/dashboard/${kidId}`}
              style={{ color: COLORS.primary }}
              className="text-sm font-medium hover:underline mb-4 inline-block"
            >
              ← Back to Dashboard
            </Link>
            <h1 style={{ color: COLORS.dark }} className="text-3xl font-bold">
              Settings
            </h1>
            <p style={{ color: COLORS.gray }} className="text-sm mt-2">
              Manage your notification preferences
            </p>
          </div>

          {/* Settings Card */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            }}
            className="p-6 space-y-6"
          >
            {/* Error Alert */}
            {error && (
              <div
                style={{
                  backgroundColor: "#fee2e2",
                  borderColor: "#fecaca",
                  borderLeft: `4px solid ${COLORS.error}`,
                }}
                className="p-4 rounded-lg border text-sm"
              >
                <p style={{ color: "#991b1b" }} className="font-medium">
                  ❌ {error}
                </p>
              </div>
            )}

            {/* Success Alert */}
            {success && (
              <div
                style={{
                  backgroundColor: "#dcfce7",
                  borderColor: "#bbf7d0",
                  borderLeft: `4px solid ${COLORS.success}`,
                }}
                className="p-4 rounded-lg border text-sm"
              >
                <p style={{ color: "#166534" }} className="font-medium">
                  {successMessage}
                </p>
              </div>
            )}

            {/* Phone Number Field */}
            <div>
              <label
                htmlFor="phone"
                style={{ color: COLORS.dark }}
                className="block text-sm font-medium mb-2"
              >
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={loading || saving}
                style={{
                  borderColor: error ? COLORS.error : "#d1d5db",
                  color: COLORS.dark,
                }}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0"
                onFocus={(e) =>
                  (e.target.style.boxShadow = `0 0 0 3px ${COLORS.primaryLight}`)
                }
                onBlur={(e) => (e.target.style.boxShadow = "none")}
              />
              <p style={{ color: COLORS.gray }} className="text-xs mt-1">
                Optional. Enter in any format, e.g., (555) 123-4567 or +1-555-123-4567
              </p>
            </div>

            {/* SMS Notifications Toggle */}
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <label
                    htmlFor="sms-toggle"
                    style={{ color: COLORS.dark }}
                    className="block text-sm font-medium mb-1"
                  >
                    SMS Notifications
                  </label>
                  <p style={{ color: COLORS.gray }} className="text-xs">
                    Receive activity confirmations via text
                  </p>
                </div>

                {/* Toggle Switch */}
                <button
                  id="sms-toggle"
                  onClick={() => setSmsNotificationsEnabled(!smsNotificationsEnabled)}
                  disabled={loading || saving}
                  style={{
                    backgroundColor: smsNotificationsEnabled ? COLORS.primary : "#d1d5db",
                    opacity: loading || saving ? 0.5 : 1,
                  }}
                  className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none cursor-pointer"
                >
                  <span
                    style={{
                      transform: smsNotificationsEnabled ? "translateX(28px)" : "translateX(2px)",
                    }}
                    className="inline-block h-6 w-6 transform rounded-full bg-white transition-transform"
                  />
                </button>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={loading || saving}
              style={{
                backgroundColor: COLORS.primary,
                opacity: loading || saving ? 0.7 : 1,
                cursor: loading || saving ? "not-allowed" : "pointer",
              }}
              className="w-full py-3 rounded-lg text-white font-medium transition-opacity"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>

          {/* Info Box */}
          <div
            style={{
              backgroundColor: COLORS.primaryLight,
              borderColor: COLORS.primary,
            }}
            className="mt-6 p-4 rounded-lg border border-dashed text-sm"
          >
            <p style={{ color: COLORS.dark }} className="font-medium mb-2">
              💡 About SMS Notifications
            </p>
            <p style={{ color: COLORS.gray }} className="text-xs">
              When enabled, you'll receive text confirmations when activities are logged. A valid
              phone number is required.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
