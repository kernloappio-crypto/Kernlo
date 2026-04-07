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
    const allReports = JSON.parse(localStorage.getItem("reports") || "{}");
    const userReports = (allReports[userEmail] || []) as Report[];

    const organized: DashboardData = {};
    userReports.forEach((report) => {
      const childName = report.child_name;
      if (!organized[childName]) {
        organized[childName] = {};
      }
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
      alert("Error downloading report");
    }
  }

  const activeChildData = dashboardData[activeChild] || {};
  const allReports = Object.values(dashboardData)
    .flatMap((child) =>
      Object.values(child).flatMap((subject) =>
        Object.values(subject).flat()
      )
    )
    .sort((a, b) => new Date(b.generated_date).getTime() - new Date(a.generated_date).getTime());

  const totalReports = allReports.length;
  const totalHours = allReports.reduce(
    (sum, report) =>
      sum +
      report.subjects.reduce(
        (subSum, subject) => subSum + (parseInt(subject.duration) || 0),
        0
      ),
    0
  );

  const subjectsTracked = new Set(
    allReports.flatMap((r) => r.subjects.map((s) => s.subject))
  ).size;

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-600">Loading...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 min-h-screen p-6">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-black">kernlo</h2>
          </div>

          <nav className="space-y-2">
            <Link
              href="/generator"
              className="block px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
            >
              New Report
            </Link>
            <Link
              href="/dashboard"
              className="block px-4 py-2 rounded-lg text-sm font-medium bg-black text-white"
            >
              Dashboard
            </Link>
          </nav>

          <div className="mt-12 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-600 mb-4">{email}</p>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-black to-gray-900 text-white p-8 mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
            <p className="text-gray-300">
              Here's your learning progress at a glance
            </p>
          </div>

          <div className="px-8 pb-12">
            {children.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
                <div className="text-5xl mb-4">📚</div>
                <h3 className="text-lg font-semibold text-black mb-2">
                  No reports yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Create your first progress report
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
                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="text-gray-600 text-sm font-medium mb-2">
                      Total Reports
                    </div>
                    <div className="text-4xl font-bold text-black">
                      {totalReports}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="text-gray-600 text-sm font-medium mb-2">
                      Total Hours
                    </div>
                    <div className="text-4xl font-bold text-black">
                      {totalHours}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="text-gray-600 text-sm font-medium mb-2">
                      Subjects
                    </div>
                    <div className="text-4xl font-bold text-black">
                      {subjectsTracked}
                    </div>
                  </div>
                </div>

                {/* Child Tabs */}
                <div className="mb-8 border-b border-gray-200">
                  <div className="flex gap-2">
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

                {/* Subject Cards Grid */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                  {Object.entries(activeChildData).map(([subject, platforms]) => {
                    const reports = Object.values(platforms).flat();
                    const subjectHours = reports.reduce(
                      (sum, r) =>
                        sum +
                        r.subjects.reduce(
                          (s, sub) => s + (parseInt(sub.duration) || 0),
                          0
                        ),
                      0
                    );

                    return (
                      <div
                        key={subject}
                        className="bg-white rounded-lg p-6 border border-gray-200"
                      >
                        <h3 className="font-semibold text-black mb-2">
                          {subject}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          {reports.length} report{reports.length > 1 ? "s" : ""} •{" "}
                          {subjectHours} hours
                        </p>

                        {/* Platforms */}
                        <div className="space-y-2 mb-4">
                          {Object.entries(platforms).map(([platform]) => (
                            <div
                              key={platform}
                              className="text-xs text-gray-700 bg-gray-50 px-3 py-2 rounded"
                            >
                              {platform}
                            </div>
                          ))}
                        </div>

                        <button
                          className="text-sm text-black font-medium hover:underline"
                        >
                          View Details →
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Recent Reports */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="font-semibold text-black">Recent Reports</h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {allReports.slice(0, 10).map((report) => (
                      <div
                        key={report.id}
                        className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                      >
                        <div>
                          <p className="font-medium text-black">
                            {report.child_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {report.subjects.map((s) => s.subject).join(", ")} •{" "}
                            {new Date(report.generated_date).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" }
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDownloadReport(report)}
                          className="text-sm px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 transition"
                        >
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
