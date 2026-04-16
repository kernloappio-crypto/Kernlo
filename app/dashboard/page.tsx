"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import Navbar from "@/components/Navbar";
import { signOut } from "@/lib/supabase-auth";

export const dynamic = "force-dynamic";

interface Kid {
  id: string;
  name: string;
  age?: number;
  grade?: string;
}

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

export default function DashboardHomePage() {
  const [email, setEmail] = useState("");
  const [kids, setKids] = useState<Kid[]>([]);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddKid, setShowAddKid] = useState(false);
  const [newKidName, setNewKidName] = useState("");
  const [newKidAge, setNewKidAge] = useState("");
  const [newKidGrade, setNewKidGrade] = useState("");
  const router = useRouter();

  useEffect(() => {
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const email = user.email || user.id;
      setEmail(email);
      loadData(email);
    };
    
    initUser();
  }, [router]);

  function loadData(userEmail: string) {
    const allKidsData = JSON.parse(localStorage.getItem("kids") || "{}");
    const userKids = (allKidsData[userEmail] || []) as Kid[];
    setKids(userKids);

    const allReportsData = JSON.parse(localStorage.getItem("reports") || "{}");
    const userReports = (allReportsData[userEmail] || []) as Report[];
    setAllReports(userReports);

    setLoading(false);
  }

  function handleAddKid() {
    if (!newKidName) return;

    const newKid: Kid = {
      id: Math.random().toString(36).substr(2, 9),
      name: newKidName,
      age: newKidAge ? parseInt(newKidAge) : undefined,
      grade: newKidGrade || undefined,
    };

    const allKidsData = JSON.parse(localStorage.getItem("kids") || "{}");
    if (!allKidsData[email]) allKidsData[email] = [];
    allKidsData[email].push(newKid);
    localStorage.setItem("kids", JSON.stringify(allKidsData));

    setKids([...kids, newKid]);
    setNewKidName("");
    setNewKidAge("");
    setNewKidGrade("");
    setShowAddKid(false);
  }

  async function handleLogout() {
    await signOut();
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

  // Calculate stats across all kids
  const totalHours = allReports.reduce(
    (sum, report) =>
      sum +
      report.subjects.reduce(
        (subSum, subject) => subSum + (parseInt(subject.duration) || 0) / 60,
        0
      ),
    0
  );

  const uniqueSubjects = new Set(allReports.flatMap(r => r.subjects.map(s => s.subject))).size;

  // Get stats per kid
  function getKidStats(kidName: string) {
    const kidReports = allReports.filter(r => r.child_name === kidName);
    const hours = kidReports.reduce(
      (sum, report) =>
        sum +
        report.subjects.reduce(
          (subSum, subject) => subSum + (parseInt(subject.duration) || 0) / 60,
          0
        ),
      0
    );

    const subjects = [...new Set(kidReports.flatMap(r => r.subjects.map(s => s.subject)))];
    const topSubjects = subjects.slice(0, 2).join(", ");

    return { hours, subjects: subjects.length, topSubjects };
  }

  // Get recent activity
  const recentActivity = allReports.slice(0, 5);

  return (
    <>
      <Navbar />
      <main style={{ backgroundColor: COLORS.light, minHeight: "100vh" }} className="flex">
      {/* Left Sidebar */}
      <div style={{ backgroundColor: "white", borderRight: `1px solid #e5e7eb` }} className="w-64 min-h-screen p-6 flex flex-col">
        <div className="mb-8">
          <h2 style={{ color: COLORS.primary }} className="text-2xl font-bold">
            kernlo
          </h2>
        </div>

        <nav className="space-y-2 mb-8">
          <Link
            href="/dashboard"
            style={{ backgroundColor: COLORS.primary, color: "white" }}
            className="block px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            🏠 Home
          </Link>
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
            {kids.length === 0 ? (
              <p style={{ color: "#999" }} className="text-xs">
                No kids yet.
              </p>
            ) : (
              kids.map((kid) => (
                <Link
                  key={kid.id}
                  href={`/dashboard/${kid.id}`}
                  style={{ color: COLORS.dark }}
                  className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
                >
                  {kid.name}
                </Link>
              ))
            )}
          </div>

          <button
            onClick={() => setShowAddKid(true)}
            style={{ color: COLORS.primary, borderColor: COLORS.primary }}
            className="w-full mt-3 px-3 py-2 border rounded-lg text-sm font-medium hover:bg-blue-50 transition"
          >
            + Add Kid
          </button>
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
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <nav style={{ backgroundColor: "white", borderBottom: `1px solid #e5e7eb` }} className="sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between w-full">
            <h1 style={{ color: COLORS.dark }} className="text-2xl font-bold">
              Dashboard
            </h1>
          </div>
        </nav>

        <div className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto px-6 py-8">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 border border-gray-200">
                <p style={{ color: "#666" }} className="text-sm font-medium mb-2">
                  Total Hours
                </p>
                <p className="text-4xl font-bold" style={{ color: COLORS.primary }}>
                  {totalHours.toFixed(1)}h
                </p>
              </div>

              <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 border border-gray-200">
                <p style={{ color: "#666" }} className="text-sm font-medium mb-2">
                  Subjects Tracked
                </p>
                <p className="text-4xl font-bold" style={{ color: COLORS.secondary }}>
                  {uniqueSubjects}
                </p>
              </div>

              <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 border border-gray-200">
                <p style={{ color: "#666" }} className="text-sm font-medium mb-2">
                  Kids
                </p>
                <p className="text-4xl font-bold" style={{ color: COLORS.accent1 }}>
                  {kids.length}
                </p>
              </div>
            </div>

            {/* Kid Cards */}
            <div className="mb-8">
              <h2 style={{ color: COLORS.dark }} className="text-xl font-bold mb-4">
                Kids
              </h2>
              {kids.length === 0 ? (
                <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-12 border border-gray-200 text-center">
                  <p style={{ color: "#999" }} className="mb-4">
                    No kids yet. Add one to get started.
                  </p>
                  <button
                    onClick={() => setShowAddKid(true)}
                    style={{ backgroundColor: COLORS.primary }}
                    className="px-6 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90"
                  >
                    + Add Kid
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  {kids.map((kid) => {
                    const stats = getKidStats(kid.name);
                    return (
                      <Link
                        key={kid.id}
                        href={`/dashboard/${kid.id}`}
                        style={{ backgroundColor: "white", borderRadius: "12px" }}
                        className="p-6 border border-gray-200 hover:shadow-lg transition cursor-pointer"
                      >
                        <h3 style={{ color: COLORS.dark }} className="text-lg font-bold mb-2">
                          {kid.name}
                        </h3>
                        {kid.age && <p style={{ color: "#666" }} className="text-sm mb-1">Age: {kid.age}</p>}
                        {kid.grade && <p style={{ color: "#666" }} className="text-sm mb-4">Grade: {kid.grade}</p>}
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span style={{ color: "#666" }} className="text-sm">
                              Hours
                            </span>
                            <span style={{ color: COLORS.primary }} className="font-bold">
                              {stats.hours.toFixed(1)}h
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ color: "#666" }} className="text-sm">
                              Subjects
                            </span>
                            <span style={{ color: COLORS.secondary }} className="font-bold">
                              {stats.subjects}
                            </span>
                          </div>
                          {stats.topSubjects && (
                            <div className="flex justify-between">
                              <span style={{ color: "#666" }} className="text-sm">
                                Top
                              </span>
                              <span style={{ color: COLORS.accent3 }} className="text-sm font-medium">
                                {stats.topSubjects}
                              </span>
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            {recentActivity.length > 0 && (
              <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="border border-gray-200 overflow-hidden">
                <div style={{ backgroundColor: "#f9fafb" }} className="px-6 py-4 border-b border-gray-200">
                  <h3 style={{ color: COLORS.dark }} className="font-semibold">
                    Recent Activity
                  </h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {recentActivity.map((report) => (
                    <div key={report.id} className="px-6 py-4 hover:bg-gray-50">
                      <p style={{ color: COLORS.dark }} className="font-semibold">
                        {report.child_name}
                      </p>
                      <p style={{ color: "#666" }} className="text-sm">
                        {report.subjects.map(s => s.subject).join(", ")} • {new Date(report.generated_date).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Kid Modal */}
      {showAddKid && (
        <div style={{ backgroundColor: "rgba(0,0,0,0.5)" }} className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-8 max-w-md w-full">
            <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-6">
              Add Kid
            </h2>

            <div className="space-y-4 mb-6">
              <input
                type="text"
                placeholder="Kid's name"
                value={newKidName}
                onChange={(e) => setNewKidName(e.target.value)}
                style={{ color: "#1a1a2e" }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="number"
                placeholder="Age (optional)"
                value={newKidAge}
                onChange={(e) => setNewKidAge(e.target.value)}
                style={{ color: "#1a1a2e" }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="text"
                placeholder="Grade (optional)"
                value={newKidGrade}
                onChange={(e) => setNewKidGrade(e.target.value)}
                style={{ color: "#1a1a2e" }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddKid}
                style={{ backgroundColor: COLORS.primary }}
                className="flex-1 px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddKid(false);
                  setNewKidName("");
                  setNewKidAge("");
                  setNewKidGrade("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
    </>
  );
}
