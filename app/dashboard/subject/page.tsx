"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  report_type: string;
  generated_date: string;
  subjects: Subject[];
  report_content: string;
  notes?: string;
}

const COLORS = {
  primary: "#0066cc",
  secondary: "#00d4ff",
  accent1: "#ff6b6b",
  dark: "#1a1a2e",
  light: "#f0f7ff",
};

const SUBJECT_COLORS: { [key: string]: string } = {
  Math: "#ff6b6b",
  Reading: "#ffd93d",
  Science: "#6bcf7f",
  History: "#a78bfa",
  "Language Arts": "#00d4ff",
  Other: "#ff9999",
};

export default function SubjectDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const childName = searchParams.get("child") || "";
  const subjectName = searchParams.get("subject") || "";
  const [reports, setReports] = useState<Report[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDateRange, setShowDateRange] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  useEffect(() => {
    const userEmail = localStorage.getItem("user_email");
    if (!userEmail) {
      router.push("/auth/login");
      return;
    }

    setEmail(userEmail);

    const allReports = JSON.parse(localStorage.getItem("reports") || "{}");
    const userReports = (allReports[userEmail] || []) as Report[];

    const filtered = userReports
      .filter(
        (r) =>
          r.child_name === childName &&
          r.subjects.some((s) => s.subject === subjectName)
      )
      .sort(
        (a, b) =>
          new Date(b.generated_date).getTime() -
          new Date(a.generated_date).getTime()
      );

    setReports(filtered);
    setLoading(false);
  }, [childName, subjectName, router]);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === reports.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(reports.map((r) => r.id)));
    }
  };

  async function handleDownloadReport(report: Report) {
    try {
      const pdfRes = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childName: report.child_name,
          reportType: report.report_type,
          subjects: report.subjects,
          notes: report.notes,
          reportContent: report.report_content,
          generatedDate: new Date(report.generated_date).toLocaleDateString(
            "en-US",
            { year: "numeric", month: "long", day: "numeric" }
          ),
        }),
      });

      if (!pdfRes.ok) throw new Error("PDF generation failed");
      const blob = await pdfRes.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${report.child_name}-${subjectName}-report.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert("Error downloading report");
    }
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

  const bgColor = SUBJECT_COLORS[subjectName] || COLORS.primary;
  const totalHours = reports.reduce(
    (sum, r) =>
      sum +
      r.subjects
        .filter((s) => s.subject === subjectName)
        .reduce((s, sub) => s + (parseInt(sub.duration) || 0) / 60, 0),
    0
  );

  return (
    <main style={{ backgroundColor: COLORS.light, minHeight: "100vh" }} className="flex">
      {/* Sidebar */}
      <div
        style={{ backgroundColor: "white", borderRight: `1px solid #e5e7eb` }}
        className="w-64 min-h-screen p-6"
      >
        <div className="mb-8">
          <h2 style={{ color: COLORS.primary }} className="text-2xl font-bold">
            kernlo
          </h2>
        </div>

        <Link
          href="/dashboard"
          style={{ color: COLORS.primary }}
          className="block px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition mb-8"
        >
          ← Back to Dashboard
        </Link>

        <div>
          <p
            style={{ color: COLORS.primary }}
            className="text-xs font-semibold uppercase tracking-wide mb-2"
          >
            Current View
          </p>
          <p style={{ color: COLORS.dark }} className="font-semibold">
            {childName}
          </p>
          <p style={{ color: bgColor }} className="font-semibold text-lg">
            {subjectName}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Header */}
        <div
          style={{ backgroundColor: "white", borderRadius: "12px" }}
          className="p-6 border border-gray-200 mb-8"
        >
          <div className="flex items-center gap-4">
            <div
              style={{ backgroundColor: bgColor, width: "60px", height: "60px" }}
              className="rounded-lg flex items-center justify-center text-white text-2xl font-bold"
            >
              {subjectName.charAt(0)}
            </div>
            <div>
              <p style={{ color: "#999" }} className="text-sm">
                {childName}
              </p>
              <h1 style={{ color: COLORS.dark }} className="text-3xl font-bold">
                {subjectName}
              </h1>
              <p style={{ color: bgColor }} className="text-sm font-semibold mt-1">
                {reports.length} report{reports.length !== 1 ? "s" : ""} •{" "}
                {totalHours.toFixed(1)} hours
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setShowDateRange(!showDateRange)}
            style={{ backgroundColor: COLORS.primary }}
            className="px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 transition"
          >
            📊 Comprehensive Report
          </button>
        </div>

        {/* Date Range Popup */}
        {showDateRange && (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              border: `2px solid ${COLORS.primary}`,
            }}
            className="p-6 mb-6"
          >
            <h3 style={{ color: COLORS.dark }} className="font-semibold mb-4">
              Generate Comprehensive Report
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label
                  style={{ color: "#666" }}
                  className="text-sm font-medium block mb-1"
                >
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, start: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label
                  style={{ color: "#666" }}
                  className="text-sm font-medium block mb-1"
                >
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, end: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  // Generate comprehensive report logic here
                  alert(
                    `Generating report from ${dateRange.start} to ${dateRange.end}`
                  );
                  setShowDateRange(false);
                }}
                style={{ backgroundColor: COLORS.primary }}
                className="px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 transition"
              >
                Generate & Download
              </button>
              <button
                onClick={() => setShowDateRange(false)}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Reports List */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
          }}
        >
          {/* List Header with Select All */}
          <div className="p-4 border-b border-gray-200 flex items-center gap-3">
            <input
              type="checkbox"
              checked={
                reports.length > 0 && selectedIds.size === reports.length
              }
              onChange={toggleSelectAll}
              className="w-5 h-5 cursor-pointer"
            />
            <h2 style={{ color: COLORS.dark }} className="text-lg font-semibold flex-1">
              Reports ({selectedIds.size} selected)
            </h2>
            {selectedIds.size > 0 && (
              <button
                style={{ backgroundColor: bgColor }}
                className="px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 transition"
              >
                Download Selected ({selectedIds.size})
              </button>
            )}
          </div>

          {/* Reports List Items */}
          <div className="divide-y divide-gray-200">
            {reports.map((report) => {
              const subjectData = report.subjects.find(
                (s) => s.subject === subjectName
              );
              if (!subjectData) return null;

              const isSelected = selectedIds.has(report.id);

              return (
                <div
                  key={report.id}
                  style={{
                    backgroundColor: isSelected ? `${COLORS.light}` : "white",
                  }}
                  className="p-4 hover:bg-gray-50 transition flex items-center gap-3"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(report.id)}
                    className="w-5 h-5 cursor-pointer"
                  />

                  <div className="flex-1">
                    <p style={{ color: COLORS.dark }} className="font-semibold">
                      {report.report_type === "weekly" ? "📅 Weekly" : "📝 Daily"}{" "}
                      Report
                    </p>
                    <p style={{ color: "#999" }} className="text-sm">
                      {new Date(report.generated_date).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </p>
                    <p style={{ color: "#666" }} className="text-xs mt-1">
                      {subjectData.platform} • {subjectData.duration} min
                    </p>
                  </div>

                  <button
                    onClick={() => handleDownloadReport(report)}
                    style={{ backgroundColor: bgColor }}
                    className="px-4 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 transition whitespace-nowrap"
                  >
                    Download
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}

export const dynamic = "force-dynamic";
