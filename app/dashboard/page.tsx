"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Subject {
  id: string;
  date: string;
  subject: string;
  platform: string;
  topics: string;
  duration: string;
}

interface Report {
  id: string;
  child_name: string;
  report_type: "daily" | "weekly";
  generated_date: string;
  subjects: Subject[];
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

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "goals" | "compliance">("overview");
  const [email, setEmail] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const userEmail = localStorage.getItem("user_email");

    if (!token || !userEmail) {
      router.push("/auth/login");
      return;
    }

    setEmail(userEmail);
    loadReports(userEmail);
  }, [router]);

  function loadReports(userEmail: string) {
    const allReports = JSON.parse(localStorage.getItem("reports") || "{}");
    const userReports = (allReports[userEmail] || []) as Report[];
    setReports(userReports);
    setLoading(false);
  }

  function handleLogout() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_email");
    router.push("/");
  }

  if (loading) {
    return (
      <main style={{ backgroundColor: COLORS.light, minHeight: "100vh" }}>
        <div className="flex items-center justify-center min-h-screen">
          <div style={{ color: COLORS.primary }}>Loading...</div>
        </div>
      </main>
    );
  }

  const totalReports = reports.length;
  const totalHours = reports.reduce(
    (sum, report) =>
      sum +
      report.subjects.reduce(
        (subSum, subject) => subSum + (parseInt(subject.duration) || 0) / 60,
        0
      ),
    0
  );

  return (
    <main style={{ backgroundColor: COLORS.light, minHeight: "100vh" }}>
      {/* Top Navigation */}
      <nav style={{ backgroundColor: "white", borderBottom: `1px solid #e5e7eb` }} className="sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div style={{ color: COLORS.primary }} className="text-2xl font-bold">
            kernlo
          </div>
          <div className="flex items-center gap-6">
            <Link href="/generator" style={{ color: COLORS.dark }} className="text-sm font-medium hover:opacity-70">
              New Report
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Log Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="mb-8 border-b border-gray-200 flex gap-8">
          {[
            { id: "overview", label: "Overview" },
            { id: "goals", label: "Goals" },
            { id: "compliance", label: "Compliance" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                color: activeTab === tab.id ? COLORS.primary : "#999",
                borderBottom: activeTab === tab.id ? `2px solid ${COLORS.primary}` : "none",
              }}
              className="pb-4 font-medium text-sm capitalize transition"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div>
            <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-6">
              Dashboard
            </h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 border border-gray-200">
                <p style={{ color: "#666" }} className="text-sm font-medium mb-2">
                  Total Reports
                </p>
                <p className="text-4xl font-bold" style={{ color: COLORS.primary }}>
                  {totalReports}
                </p>
              </div>

              <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 border border-gray-200">
                <p style={{ color: "#666" }} className="text-sm font-medium mb-2">
                  Total Hours
                </p>
                <p className="text-4xl font-bold" style={{ color: COLORS.secondary }}>
                  {totalHours.toFixed(1)}h
                </p>
              </div>

              <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 border border-gray-200">
                <p style={{ color: "#666" }} className="text-sm font-medium mb-2">
                  Subjects Tracked
                </p>
                <p className="text-4xl font-bold" style={{ color: COLORS.accent1 }}>
                  {new Set(reports.flatMap(r => r.subjects.map(s => s.subject))).size}
                </p>
              </div>
            </div>

            {/* Recent Reports */}
            <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="border border-gray-200 overflow-hidden">
              <div style={{ backgroundColor: "#f9fafb" }} className="px-6 py-4 border-b border-gray-200">
                <h3 style={{ color: COLORS.dark }} className="font-semibold">
                  Recent Reports
                </h3>
              </div>
              <div className="divide-y divide-gray-200">
                {reports.length === 0 ? (
                  <div className="p-6 text-center">
                    <p style={{ color: "#999" }}>No reports yet. Create one to get started!</p>
                    <Link href="/generator" style={{ color: COLORS.primary }} className="text-sm font-medium hover:underline mt-2 inline-block">
                      Create Report →
                    </Link>
                  </div>
                ) : (
                  reports.slice(0, 10).map((report) => (
                    <div key={report.id} className="px-6 py-4 hover:bg-gray-50 transition">
                      <p style={{ color: COLORS.dark }} className="font-semibold">
                        {report.child_name}
                      </p>
                      <p style={{ color: "#666" }} className="text-sm">
                        {report.subjects.map(s => s.subject).join(", ")} • {new Date(report.generated_date).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Goals Tab */}
        {activeTab === "goals" && (
          <div>
            <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-6">
              Learning Goals
            </h2>
            <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 border border-gray-200">
              <p style={{ color: "#666" }}>Goals tracking coming soon. Track monthly hour targets per subject.</p>
            </div>
          </div>
        )}

        {/* Compliance Tab */}
        {activeTab === "compliance" && (
          <div>
            <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-6">
              Compliance Tracking
            </h2>
            <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 border border-gray-200">
              <p style={{ color: "#666" }}>Compliance tracking coming soon. Track state requirements and hour minimums.</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
