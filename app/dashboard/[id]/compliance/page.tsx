"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Kid {
  id: string;
  name: string;
  age?: number;
  grade?: string;
}

interface Report {
  id: string;
  child_name: string;
  report_type: "daily" | "weekly";
  generated_date: string;
  subjects: Array<{
    id: string;
    date: string;
    subject: string;
    platform: string;
    topics: string;
    duration: string;
  }>;
  report_content: string;
  notes?: string;
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

const STATE_REQUIREMENTS: { [key: string]: { [subject: string]: number } } = {
  CA: { Math: 180, "Language Arts": 180, Science: 180, History: 180 },
  TX: { Math: 180, "Language Arts": 180, Science: 90, History: 90 },
  FL: { Math: 180, "Language Arts": 180, Science: 90, History: 90 },
  NY: { Math: 120, "Language Arts": 120, Science: 120, History: 120 },
};

export default function CompliancePage() {
  const params = useParams();
  const kidId = params?.id as string;
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [kid, setKid] = useState<Kid | null>(null);
  const [childReports, setChildReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState("CA");

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const userEmail = localStorage.getItem("user_email");

    if (!token || !userEmail) {
      router.push("/auth/login");
      return;
    }

    setEmail(userEmail);
    loadData(userEmail, kidId);

    const savedState = localStorage.getItem("state");
    if (savedState) setState(savedState);
  }, [kidId, router]);

  function loadData(userEmail: string, id: string) {
    const allKidsData = JSON.parse(localStorage.getItem("kids") || "{}");
    const userKids = (allKidsData[userEmail] || []) as Kid[];
    const foundKid = userKids.find(k => k.id === id);

    if (!foundKid) {
      router.push("/dashboard");
      return;
    }

    setKid(foundKid);

    const allReportsData = JSON.parse(localStorage.getItem("reports") || "{}");
    const userReports = (allReportsData[userEmail] || []) as Report[];
    const kidReports = userReports.filter(r => r.child_name === foundKid.name);
    setChildReports(kidReports);

    setLoading(false);
  }

  if (loading || !kid) {
    return (
      <main style={{ backgroundColor: COLORS.light, minHeight: "100vh" }}>
        <div className="flex items-center justify-center min-h-screen">
          <div style={{ color: COLORS.primary }}>Loading...</div>
        </div>
      </main>
    );
  }

  const requirements = STATE_REQUIREMENTS[state] || {};

  // Calculate hours logged per subject
  function getSubjectHours(subject: string): number {
    return childReports.reduce(
      (sum, report) =>
        sum +
        report.subjects
          .filter(s => s.subject === subject)
          .reduce((subSum, s) => subSum + (parseInt(s.duration) || 0) / 60, 0),
      0
    );
  }

  return (
    <main style={{ backgroundColor: COLORS.light, minHeight: "100vh" }}>
      <div style={{ backgroundColor: "white", borderBottom: `1px solid #e5e7eb` }} className="sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href={`/dashboard/${kid.id}`} style={{ color: COLORS.primary }} className="text-sm hover:opacity-70">
            ← Back to {kid.name}
          </Link>
          <h1 style={{ color: COLORS.dark }} className="text-2xl font-bold">
            Compliance Tracking
          </h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* State Selector */}
        <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 border border-gray-200 mb-8">
          <label style={{ color: COLORS.dark }} className="block font-semibold mb-3">
            Select State
          </label>
          <select
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              localStorage.setItem("state", e.target.value);
            }}
            style={{ color: "#1a1a2e" }}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            {Object.keys(STATE_REQUIREMENTS).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Requirements Grid */}
        <div className="grid grid-cols-2 gap-6">
          {Object.entries(requirements).map(([subject, hoursRequired]) => {
            const hoursLogged = getSubjectHours(subject);
            const percentage = Math.round((hoursLogged / hoursRequired) * 100);
            const isOnTrack = percentage >= 100;

            return (
              <div
                key={subject}
                style={{ backgroundColor: "white", borderRadius: "12px" }}
                className="p-6 border border-gray-200"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 style={{ color: COLORS.dark }} className="text-lg font-bold">
                    {subject}
                  </h3>
                  <p
                    style={{
                      backgroundColor: isOnTrack ? "#d4edda" : "#fff3cd",
                      color: isOnTrack ? "#155724" : "#856404",
                    }}
                    className="px-2 py-1 rounded text-xs font-bold"
                  >
                    {percentage}%
                  </p>
                </div>

                <p style={{ color: "#666" }} className="text-sm mb-4">
                  {hoursLogged.toFixed(1)}h / {hoursRequired}h
                </p>

                <div className="mb-4">
                  <div style={{ backgroundColor: COLORS.light }} className="h-3 rounded-full overflow-hidden">
                    <div
                      style={{
                        backgroundColor: isOnTrack ? COLORS.accent3 : COLORS.accent2,
                        width: `${Math.min(percentage, 100)}%`,
                      }}
                      className="h-full transition-all"
                    />
                  </div>
                </div>

                <p style={{ color: "#666" }} className="text-xs">
                  {isOnTrack ? "✓ Requirement met" : `${hoursRequired - Math.round(hoursLogged)} hours remaining`}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
