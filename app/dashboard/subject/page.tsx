"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export const dynamic = "force-dynamic";
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

  useEffect(() => {
    if (!childName || !subjectName) return;

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

  return (
    <main style={{ backgroundColor: COLORS.light, minHeight: "100vh" }} className="flex">
      {/* Sidebar */}
      <div style={{ backgroundColor: "white", borderRight: `1px solid #e5e7eb` }} className="w-64 min-h-screen p-6">
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
          <p style={{ color: COLORS.primary }} className="text-xs font-semibold uppercase tracking-wide mb-2">
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
        <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 border border-gray-200 mb-8">
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
                {reports.length} report{reports.length !== 1 ? "s" : ""} • {totalHours.toFixed(1)} hours
              </p>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div>
          <h2 style={{ color: COLORS.dark }} className="text-lg font-semibold mb-4">
            All Reports
          </h2>
          <div className="space-y-3">
            {reports.map((report) => {
              const subjectData = report.subjects.find((s) => s.subject === subjectName);
              if (!subjectData) return null;

              return (
                <div
                  key={report.id}
                  style={{ backgroundColor: "white", borderRadius: "12px" }}
                  className="p-4 border border-gray-200 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p style={{ color: COLORS.dark }} className="font-semibold">
                        {report.report_type === "weekly" ? "Weekly" : "Daily"} Report
                      </p>
                      <p style={{ color: "#999" }} className="text-sm">
                        {new Date(report.generated_date).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDownloadReport(report)}
                      style={{ backgroundColor: bgColor }}
                      className="px-4 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 transition"
                    >
                      Download
                    </button>
                  </div>

                  <div className="space-y-2 mb-3">
                    <p style={{ color: "#666" }} className="text-sm">
                      <strong>Platform:</strong> {subjectData.platform}
                    </p>
                    <p style={{ color: "#666" }} className="text-sm">
                      <strong>Topics:</strong> {subjectData.topics}
                    </p>
                    <p style={{ color: "#666" }} className="text-sm">
                      <strong>Duration:</strong> {subjectData.duration} minutes
                    </p>
                  </div>

                  <div style={{ backgroundColor: COLORS.light, borderRadius: "8px" }} className="p-3 border border-gray-200 mt-4">
                    <p style={{ color: "#666" }} className="text-sm leading-relaxed">
                      {report.report_content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
