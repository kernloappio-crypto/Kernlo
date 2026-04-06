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
  report_type: string;
  generated_date: string;
  subjects: Subject[];
  report_content: string;
  notes?: string;
}

interface DashboardData {
  [childName: string]: {
    [subject: string]: {
      [platform: string]: Report[];
    };
  };
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({});
  const [children, setChildren] = useState<string[]>([]);
  const [activeChild, setActiveChild] = useState<string>("");
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
    const userReports = (allReports[userEmail] || []) as Report[];

    // Organize by child → subject → platform
    const organized: DashboardData = {};

    userReports.forEach((report) => {
      const childName = report.child_name;

      if (!organized[childName]) {
        organized[childName] = {};
      }

      // Group subjects from this report
      report.subjects.forEach((subject) => {
        if (!organized[childName][subject.subject]) {
          organized[childName][subject.subject] = {};
        }

        if (!organized[childName][subject.subject][subject.platform]) {
          organized[childName][subject.subject][subject.platform] = [];
        }

        organized[childName][subject.subject][subject.platform].push(report);
      });
    });

    setDashboardData(organized);
    const childrenList = Object.keys(organized).sort();
    setChildren(childrenList);
    if (childrenList.length > 0) {
      setActiveChild(childrenList[0]);
    }

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

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-600">Loading dashboard...</div>
        </div>
      </main>
    );
  }

  const activeChildData = dashboardData[activeChild] || {};

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
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
      <div className="max-w-7xl mx-auto px-6 py-12">
        {children.length === 0 ? (
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
          <>
            {/* Child Tabs */}
            <div className="mb-8 border-b border-gray-200">
              <div className="flex gap-2 overflow-x-auto">
                {children.map((child) => (
                  <button
                    key={child}
                    onClick={() => setActiveChild(child)}
                    className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-all border-b-2 ${
                      activeChild === child
                        ? "border-black text-black"
                        : "border-transparent text-gray-600 hover:text-black"
                    }`}
                  >
                    {child}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject Sections */}
            <div className="space-y-8">
              {Object.entries(activeChildData).map(([subject, platforms]) => (
                <div key={subject} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {/* Subject Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-black">{subject}</h2>
                  </div>

                  {/* Platform Subsections */}
                  <div className="divide-y divide-gray-200">
                    {Object.entries(platforms).map(([platform, reports]) => (
                      <div key={platform} className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {platform}
                            </h3>
                            <p className="text-xs text-gray-600 mt-1">
                              {reports.length} report{reports.length > 1 ? "s" : ""} • Last updated{" "}
                              {new Date(
                                Math.max(
                                  ...reports.map((r) =>
                                    new Date(r.generated_date).getTime()
                                  )
                                )
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Reports List for this Platform */}
                        <div className="space-y-2">
                          {reports
                            .sort(
                              (a, b) =>
                                new Date(b.generated_date).getTime() -
                                new Date(a.generated_date).getTime()
                            )
                            .map((report) => (
                              <div
                                key={report.id}
                                className="flex items-center justify-between bg-gray-50 rounded p-3"
                              >
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">
                                    {report.report_type === "weekly"
                                      ? "Weekly"
                                      : "Daily"}{" "}
                                    Report
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {new Date(report.generated_date).toLocaleDateString(
                                      "en-US",
                                      {
                                        weekday: "short",
                                        month: "short",
                                        day: "numeric",
                                      }
                                    )}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleDownloadReport(report)}
                                  className="px-3 py-1 text-xs bg-black text-white rounded hover:bg-gray-900 transition font-medium"
                                >
                                  Download
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
