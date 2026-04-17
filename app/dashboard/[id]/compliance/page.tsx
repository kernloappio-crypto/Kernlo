"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import Navbar from "@/components/Navbar";
import { getActivities, getComplianceState, setComplianceState } from "@/lib/supabase-data";

export const dynamic = "force-dynamic";

interface Activity {
  id: string;
  child_name: string;
  subject: string;
  duration: number;
  date: string;
}

interface Kid {
  id: string;
  name: string;
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

const STATE_REQUIREMENTS: { [key: string]: { [key: string]: number } } = {
  CA: {
    Math: 240,
    English: 240,
    Science: 120,
    History: 120,
    "Physical Education": 120,
  },
  TX: {
    Math: 180,
    English: 180,
    Science: 120,
    History: 120,
  },
  FL: {
    Math: 180,
    English: 180,
    Science: 90,
    History: 90,
  },
  NY: {
    Math: 200,
    English: 200,
    Science: 100,
    History: 100,
  },
};

export default function CompliancePage() {
  const params = useParams();
  const router = useRouter();
  const kidId = params.id as string;

  const [userId, setUserId] = useState("");
  const [kid, setKid] = useState<Kid | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedState, setSelectedState] = useState("CA");
  const [loading, setLoading] = useState(true);

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

        // Load kid
        const { data: kidData } = await supabase
          .from("kids")
          .select("*")
          .eq("id", kidId)
          .eq("user_id", user.id)
          .single();

        if (kidData) {
          setKid(kidData as Kid);
        }

        // Load compliance state
        if (kidData?.name) {
          const complianceData = await getComplianceState(user.id, kidData.name);
          if (complianceData?.state) {
            setSelectedState(complianceData.state);
          }
        }

        // Load activities
        const activitiesData = await getActivities(user.id);
        const kidActivities = activitiesData.filter((a: any) => a.child_name === kidData?.name);
        setActivities(kidActivities as Activity[]);

        setLoading(false);
      } catch (err) {
        console.error("Error initializing:", err);
        setLoading(false);
      }
    };

    initializeUser();
  }, [kidId, router]);

  async function handleStateChange(state: string) {
    setSelectedState(state);
    try {
      if (kid && userId) {
        const result = await setComplianceState(userId, state, kid.name);
        if (result) {
          console.log("State saved successfully:", state);
        }
      } else {
        console.warn("Missing kid or userId:", { kid, userId });
      }
    } catch (err) {
      console.error("Error setting state:", err);
      alert("Failed to save state. Please try again.");
    }
  }

  function calculateCompliance(): { [key: string]: { hours: number; required: number; met: boolean } } {
    const requirements = STATE_REQUIREMENTS[selectedState] || {};
    const compliance: { [key: string]: { hours: number; required: number; met: boolean } } = {};

    Object.keys(requirements).forEach((subject) => {
      const subjectActivities = activities.filter((a) => a.subject === subject);
      const hours = subjectActivities.reduce((sum, a) => sum + a.duration, 0);
      const required = requirements[subject];
      compliance[subject] = {
        hours,
        required,
        met: hours >= required,
      };
    });

    return compliance;
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

  const compliance = calculateCompliance();
  const allMet = Object.values(compliance).every((c) => c.met);

  return (
    <>
      <Navbar />
      <main style={{ backgroundColor: COLORS.light, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb" }} className="p-6">
        <div className="max-w-7xl mx-auto">
          <Link href={`/dashboard/${kidId}`} style={{ color: COLORS.primary }} className="text-sm font-medium mb-4 block">
            ← Back to {kid.name}
          </Link>
          <h1 style={{ color: COLORS.dark }} className="text-3xl font-bold">
            State Compliance
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* State Selection */}
        <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 border border-gray-200">
          <h2 style={{ color: COLORS.dark }} className="text-lg font-bold mb-4">
            Select Your State
          </h2>

          <select
            value={selectedState}
            onChange={(e) => handleStateChange(e.target.value)}
            style={{ borderColor: COLORS.primary, color: COLORS.dark }}
            className="w-full px-4 py-3 border rounded-lg font-medium text-base"
          >
            {Object.keys(STATE_REQUIREMENTS).map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        {/* Compliance Status */}
        <div>
          {allMet ? (
            <div style={{ backgroundColor: "#e8f5e9", borderRadius: "12px" }} className="p-6 border border-green-200">
              <p style={{ color: "#2e7d32" }} className="text-lg font-bold">
                ✓ All requirements met!
              </p>
            </div>
          ) : (
            <div style={{ backgroundColor: "#fff3e0", borderRadius: "12px" }} className="p-6 border border-orange-200">
              <p style={{ color: "#e65100" }} className="text-lg font-bold">
                ⚠ Not all requirements met. Keep logging activities.
              </p>
            </div>
          )}
        </div>

        {/* Requirements Table */}
        <div>
          <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-4">
            {selectedState} Requirements
          </h2>

          <div className="space-y-4">
            {Object.entries(compliance).map(([subject, data]) => {
              const percentage = Math.round((data.hours / data.required) * 100);
              const isMet = data.met;

              return (
                <div
                  key={subject}
                  style={{ backgroundColor: "white", borderRadius: "12px" }}
                  className="p-6 border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 style={{ color: COLORS.dark }} className="text-lg font-bold">
                        {subject}
                      </h3>
                      <p style={{ color: "#666" }} className="text-sm">
                        {data.hours.toFixed(1)} / {data.required} hours
                      </p>
                    </div>
                    <span
                      style={{
                        backgroundColor: isMet ? "#e8f5e9" : "#ffebee",
                        color: isMet ? "#2e7d32" : "#c62828",
                      }}
                      className="px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {isMet ? "✓ Met" : "✗ Not Met"}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ backgroundColor: "#e5e7eb", borderRadius: "4px" }} className="h-3 overflow-hidden">
                    <div
                      style={{
                        backgroundColor: isMet ? COLORS.accent3 : COLORS.accent1,
                        width: `${Math.min(percentage, 100)}%`,
                        transition: "width 0.3s ease",
                      }}
                      className="h-full"
                    />
                  </div>

                  <p style={{ color: "#666" }} className="text-sm mt-2">
                    {percentage}% complete
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
    </>
  );
}
