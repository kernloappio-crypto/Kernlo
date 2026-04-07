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

const COLORS = {
  primary: "#0066cc",
  secondary: "#00d4ff",
  accent1: "#ff6b6b",
  accent2: "#ffd93d",
  accent3: "#6bcf7f",
  accent4: "#a78bfa",
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
        (subSum, subject) => subSum + (parseInt(subject.duration) || 0) / 60,
        0
      ),
    0
  );

  const getWeeklyData = () => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weekData = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);

    allReports.forEach((report) => {
      const reportDate = new Date(report.generated_date);
      const dayOfWeek = reportDate.getDay();
      const dayName = days[dayOfWeek === 0 ? 6 : dayOfWeek - 1];

      report.subjects.forEach((subject) => {
        weekData[dayName as keyof typeof weekData] += parseInt(subject.duration) || 0;
      });
    });

    return days.map((day) => ({
      day,
      hours: Number((weekData[day as keyof typeof weekData] / 60).toFixed(1)),
    }));
  };

  const weeklyData = getWeeklyData();
  const maxHours = Math.max(...weeklyData.map((d) => d.hours), 1);

  if (loading) {
    return (
      <main style={{ backgroundColor: COLORS.light, minHeight: "100vh" }}>
        <div className="flex items-center justify-center min-h-screen">
          <div style={{ color: COLORS.primary }}>Loading...</div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ backgroundColor: COLORS.light, minHeight: "100vh" }} className="flex">
      {/* Sidebar */}
      <div style={{ backgroundColor: "white", borderRight: `1px solid #e5e7eb` }} className="w-64 min-h-screen p-6 flex flex-col">
        <div className="mb-8">
          <h2 style={{ color: COLORS.primary }} className="text-2xl font-bold">
            kernlo
          </h2>
        </div>

        <nav className="space-y-2 mb-8">
          <Link
            href="/generator"
            style={{ color: COLORS.dark }}
            className="block px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
          >
            📝 New Report
          </Link>
        </nav>

        <div className="mb-8">
          <p style={{ color: COLORS.primary }} className="text-xs font-semibold uppercase tracking-wide mb-3">
            Kids
          </p>
          <div className="space-y-2">
            {children.map((child) => (
              <button
                key={child}
                onClick={() => setActiveChild(child)}
                style={{
                  backgroundColor: activeChild === child ? COLORS.primary : "transparent",
                  color: activeChild === child ? "white" : COLORS.dark,
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition hover:opacity-80"
              >
                {child}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-gray-200">
          <p style={{ color: "#999" }} className="text-xs mb-4">
            {email}
          </p>
          <button
            onClick={handleLogout}
            style={{ color: COLORS.primary, borderColor: COLORS.primary }}
            className="w-full px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {children.length === 0 ? (
          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-12 text-center border border-gray-200">
            <div className="text-5xl mb-4">📚</div>
            <h3 style={{ color: COLORS.dark }} className="text-lg font-semibold mb-2">
              No reports yet
            </h3>
            <p className="text-gray-600 mb-6">Create your first progress report</p>
            <Link
              href="/generator"
              style={{ backgroundColor: COLORS.primary }}
              className="inline-block px-6 py-2 text-white rounded-lg font-medium hover:opacity-90 transition"
            >
              Create Report
            </Link>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 border border-gray-200">
                <p style={{ color: "#666" }} className="text-sm font-medium mb-4">
                  Total Courses
                </p>
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold" style={{ color: COLORS.primary }}>
                    {Object.keys(activeChildData).length}
                  </div>
                  <div style={{ width: "80px", height: "80px", backgroundColor: `${COLORS.primary}20` }} className="rounded-full flex items-center justify-center">
                    <svg width="60" height="60" viewBox="0 0 60 60">
                      <circle cx="30" cy="30" r="25" fill="none" stroke={COLORS.primary} strokeWidth="3" opacity="0.3" />
                      <circle
                        cx="30"
                        cy="30"
                        r="25"
                        fill="none"
                        stroke={COLORS.primary}
                        strokeWidth="3"
                        strokeDasharray={`${(Object.keys(activeChildData).length / 10) * 157} 157`}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 border border-gray-200">
                <p style={{ color: "#666" }} className="text-sm font-medium mb-4">
                  Time Spent
                </p>
                <p className="text-4xl font-bold mb-2" style={{ color: COLORS.secondary }}>
                  {totalHours.toFixed(1)}h
                </p>
                <p style={{ color: "#999" }} className="text-xs">
                  This week
                </p>
              </div>
            </div>

            {/* Weekly Graph */}
            <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 border border-gray-200 mb-8">
              <h3 style={{ color: COLORS.dark }} className="font-semibold mb-6">
                Weekly Progress
              </h3>
              <div className="flex items-end gap-3 h-40">
                {weeklyData.map((data, idx) => (
                  <div key={data.day} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex items-end justify-center" style={{ height: "120px" }}>
                      <div
                        style={{
                          backgroundColor: [COLORS.accent1, COLORS.accent2, COLORS.accent3, COLORS.accent4, COLORS.secondary, COLORS.primary, COLORS.accent1][idx],
                          height: `${(data.hours / maxHours) * 100}%`,
                          width: "24px",
                          borderRadius: "6px",
                          minHeight: data.hours > 0 ? "8px" : "0px",
                        }}
                      />
                    </div>
                    <p style={{ color: "#666" }} className="text-xs mt-2 font-medium">
                      {data.day}
                    </p>
                    <p style={{ color: COLORS.primary }} className="text-xs font-semibold">
                      {data.hours}h
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Subject Cards Grid */}
            <div className="grid grid-cols-2 gap-6">
              {Object.entries(activeChildData).map(([subject]) => {
                const reports = Object.values(activeChildData[subject]).flat();
                const subjectHours = reports.reduce(
                  (sum, r) =>
                    sum +
                    r.subjects.reduce(
                      (s, sub) => s + (parseInt(sub.duration) || 0) / 60,
                      0
                    ),
                  0
                );
                const bgColor = SUBJECT_COLORS[subject] || COLORS.primary;

                return (
                  <Link
                    key={subject}
                    href={`/dashboard/subject?child=${activeChild}&subject=${subject}`}
                    style={{ backgroundColor: "white", borderRadius: "12px" }}
                    className="p-6 border border-gray-200 hover:shadow-lg transition cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div
                        style={{ backgroundColor: bgColor, width: "40px", height: "40px" }}
                        className="rounded-lg flex items-center justify-center text-white font-bold"
                      >
                        {subject.charAt(0)}
                      </div>
                    </div>
                    <h3 style={{ color: COLORS.dark }} className="font-semibold mb-1">
                      {subject}
                    </h3>
                    <p style={{ color: "#999" }} className="text-sm mb-4">
                      {reports.length} report{reports.length > 1 ? "s" : ""} • {subjectHours.toFixed(1)}h
                    </p>
                    <p style={{ color: bgColor }} className="text-sm font-medium">
                      View Details →
                    </p>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
