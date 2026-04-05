"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Report {
  id: string;
  child_name: string;
  report_type: string;
  generated_date: string;
  subjects: any[];
  report_content: string;
  notes?: string;
}

export default function DashboardPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const userEmail = localStorage.getItem("user_email");

      if (!userEmail) {
        router.push("/auth/login");
        return;
      }

      setEmail(userEmail);
      loadReports(userEmail);
    };

    checkAuth();
  }, [router]);

  function loadReports(userEmail: string) {
    const allReports = JSON.parse(
      localStorage.getItem("reports") || "{}"
    );
    const userReports = (allReports[userEmail] || []).sort(
      (a: Report, b: Report) =>
        new Date(b.generated_date).getTime() -
        new Date(a.generated_date).getTime()
    );

    setReports(userReports);
    setLoading(false);
  }

  function handleLogout() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_email");
    router.push("/");
  }

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
      link.download = `${report.child_name}-progress-report.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      alert("Error downloading report");
    }
  }

  const usageCount = reports.length;
  const freeReportsLeft = Math.max(0, 3 - usageCount);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black">kernlo</h1>
            <p className="text-xs text-gray-600 mt-1">{email}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/generator"
              className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-900 transition"
            >
              New Report
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Usage Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-black mb-2">
                Monthly Reports
              </h2>
              <p className="text-sm text-gray-600">
                You have <span className="font-semibold text-black">{freeReportsLeft}</span> free reports remaining this month
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-black">
                {usageCount}/3
              </div>
              <p className="text-xs text-gray-600 mt-1">Reports used</p>
            </div>
          </div>

          {usageCount >= 3 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
              You've reached your free limit. Upgrade to Premium for unlimited reports.
            </div>
          )}
        </div>

        {/* Reports List */}
        <div>
          <h2 className="text-lg font-semibold text-black mb-4">
            Your Reports
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-600">Loading reports...</div>
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-5xl mb-4">📄</div>
              <h3 className="text-lg font-semibold text-black mb-2">
                No reports yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first progress report to get started
              </p>
              <Link
                href="/generator"
                className="inline-block px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition"
              >
                Create Report
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-black">
                          {report.child_name}
                        </h3>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-medium">
                          {report.report_type === "weekly"
                            ? "Weekly"
                            : "Daily"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {report.subjects.length} subject
                        {report.subjects.length > 1 ? "s" : ""} •{" "}
                        {new Date(report.generated_date).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" }
                        )}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleDownloadReport(report)}
                      className="px-3 py-1 text-sm bg-black text-white rounded hover:bg-gray-900 transition font-medium"
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
