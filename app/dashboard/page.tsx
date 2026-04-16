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

interface Goal {
  id: string;
  subject: string;
  monthly_hours: number;
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

const SUBJECTS = [
  "Math",
  "English",
  "Science",
  "History",
  "Social Studies",
  "Arts",
  "Physical Education",
  "Other",
];

export default function DashboardPage() {
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [kids, setKids] = useState<Kid[]>([]);
  const [activeKid, setActiveKid] = useState<Kid | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddKid, setShowAddKid] = useState(false);
  const [newKidName, setNewKidName] = useState("");
  const [newKidAge, setNewKidAge] = useState("");
  const [newKidGrade, setNewKidGrade] = useState("");
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [logSubject, setLogSubject] = useState("");
  const [logDuration, setLogDuration] = useState("");
  const [logPlatform, setLogPlatform] = useState("");
  const [logNotes, setLogNotes] = useState("");
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [goalSubject, setGoalSubject] = useState("");
  const [goalHours, setGoalHours] = useState("");
  const [state, setState] = useState("CA");
  const [showReportGen, setShowReportGen] = useState(false);
  const [reportChildName, setReportChildName] = useState("");
  const [reportType, setReportType] = useState<"daily" | "weekly">("daily");
  const [reportSubjects, setReportSubjects] = useState<string[]>([]);
  const [reportNotes, setReportNotes] = useState("");
  const router = useRouter();

  // Initialize user and load all data from Supabase
  useEffect(() => {
    const initUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push("/auth/login");
          return;
        }

        setUserId(user.id);
        setEmail(user.email || "");

        // Load kids from Supabase
        const { data: kidsData } = await supabase
          .from("kids")
          .select("*")
          .eq("user_id", user.id);

        if (kidsData && kidsData.length > 0) {
          setKids(kidsData);
          setActiveKid(kidsData[0]);
        }

        // Load goals from Supabase
        const { data: goalsData } = await supabase
          .from("goals")
          .select("*")
          .eq("user_id", user.id);

        if (goalsData) {
          setGoals(goalsData.map((g: any) => ({
            id: g.id,
            subject: g.subject,
            monthly_hours: g.monthly_hours,
          })));
        }

        // Load reports from Supabase
        const { data: reportsData } = await supabase
          .from("reports")
          .select("*")
          .eq("user_id", user.id);

        if (reportsData) {
          setReports(reportsData.map((r: any) => ({
            id: r.id,
            child_name: r.child_name,
            report_type: r.report_type,
            generated_date: r.generated_date,
            subjects: r.subjects || [],
            report_content: r.report_content,
            notes: r.notes,
          })));
        }

        setLoading(false);
      } catch (err) {
        console.error("Error initializing:", err);
        setLoading(false);
      }
    };

    initUser();
  }, [router]);

  async function handleAddKid() {
    if (!newKidName.trim()) {
      alert("Kid name is required");
      return;
    }

    if (kids.length >= 5) {
      alert("Pro tier limited to 5 children. Upgrade for more.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("kids")
        .insert({
          user_id: userId,
          name: newKidName,
          age: newKidAge ? parseInt(newKidAge) : null,
          grade: newKidGrade || null,
        })
        .select();

      if (error) {
        alert("Error adding kid: " + error.message);
        return;
      }

      if (data && data[0]) {
        const newKid = data[0];
        setKids([...kids, newKid]);
        setActiveKid(newKid);
      }

      setNewKidName("");
      setNewKidAge("");
      setNewKidGrade("");
      setShowAddKid(false);
    } catch (err) {
      console.error("Error:", err);
      alert("Failed to add kid");
    }
  }

  async function handleQuickLogSave() {
    if (!logSubject || !logDuration || !activeKid) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const { error } = await supabase
        .from("activities")
        .insert({
          user_id: userId,
          child_name: activeKid.name,
          subject: logSubject,
          duration: parseFloat(logDuration),
          platform: logPlatform || "Other",
          date: logDate,
          notes: logNotes,
        });

      if (error) {
        alert("Error saving activity: " + error.message);
        return;
      }

      alert("Activity logged!");
      setLogSubject("");
      setLogDuration("");
      setLogPlatform("");
      setLogNotes("");
      setLogDate(new Date().toISOString().split("T")[0]);
      setShowQuickLog(false);

      // Reload reports
      const { data: reportsData } = await supabase
        .from("reports")
        .select("*")
        .eq("user_id", userId);

      if (reportsData) {
        setReports(reportsData);
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Failed to save activity");
    }
  }

  async function handleAddGoal() {
    if (!goalSubject || !goalHours) {
      alert("Please fill in subject and hours");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("goals")
        .insert({
          user_id: userId,
          child_name: activeKid?.name || "General",
          subject: goalSubject,
          monthly_hours: parseFloat(goalHours),
        })
        .select();

      if (error) {
        alert("Error adding goal: " + error.message);
        return;
      }

      if (data && data[0]) {
        setGoals([
          ...goals,
          {
            id: data[0].id,
            subject: data[0].subject,
            monthly_hours: data[0].monthly_hours,
          },
        ]);
      }

      setGoalSubject("");
      setGoalHours("");
      setShowAddGoal(false);
    } catch (err) {
      console.error("Error:", err);
      alert("Failed to add goal");
    }
  }

  async function handleDeleteGoal(goalId: string) {
    try {
      const { error } = await supabase
        .from("goals")
        .delete()
        .eq("id", goalId);

      if (error) {
        alert("Error deleting goal: " + error.message);
        return;
      }

      setGoals(goals.filter((g) => g.id !== goalId));
    } catch (err) {
      console.error("Error:", err);
    }
  }

  async function handleGenerateReport() {
    if (!reportChildName || reportSubjects.length === 0) {
      alert("Please fill in child name and select subjects");
      return;
    }

    try {
      const today = new Date().toISOString().split("T")[0];
      const reportContent = `Generated ${reportType} report for ${reportChildName} covering: ${reportSubjects.join(", ")}. ${reportNotes}`;

      const { data, error } = await supabase
        .from("reports")
        .insert({
          user_id: userId,
          child_name: reportChildName,
          report_type: reportType,
          generated_date: today,
          subjects: reportSubjects,
          report_content: reportContent,
        })
        .select();

      if (error) {
        alert("Error saving report: " + error.message);
        return;
      }

      if (data) {
        setReports([...reports, ...data]);
      }

      // Download PDF
      downloadReportAsPDF(reportChildName, reportType, reportSubjects, reportContent);

      alert("Report generated and saved!");
      setReportChildName("");
      setReportSubjects([]);
      setReportNotes("");
      setShowReportGen(false);
    } catch (err) {
      console.error("Error:", err);
      alert("Failed to generate report");
    }
  }

  const downloadReportAsPDF = (
    childName: string,
    type: string,
    subjects: string[],
    content: string
  ) => {
    const today = new Date().toLocaleDateString();
    const pdfContent = `
${childName}'s ${type.toUpperCase()} REPORT
Generated: ${today}

Subjects: ${subjects.join(", ")}

${content}
    `;

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(pdfContent)
    );
    element.setAttribute("download", `${childName}-report-${today}.txt`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  async function handleLogout() {
    await signOut();
    router.push("/");
  }

  const compliances = [
    {
      state: "CA",
      hours: 175,
      details: "California requires 175 instructional days or hours per school year",
    },
    {
      state: "TX",
      hours: 0,
      details: "Texas requires bona fide curriculum with reading, math, science, social studies",
    },
    {
      state: "FL",
      hours: 1000,
      details: "Florida requires 1000 instructional hours per school year",
    },
    {
      state: "NY",
      hours: 900,
      details: "New York requires 900 instructional hours per school year",
    },
  ];

  const selectedCompliance = compliances.find((c) => c.state === state);
  const kidReports = reports.filter(
    (r) => !activeKid || r.child_name === activeKid.name
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main style={{ backgroundColor: COLORS.light, minHeight: "100vh" }} className="flex">
        {/* Left Sidebar - Kids */}
        <div
          style={{ backgroundColor: "white", borderRight: `1px solid #e5e7eb` }}
          className="w-64 min-h-screen p-6 flex flex-col"
        >
          <div className="mb-8">
            <h2 style={{ color: COLORS.dark }} className="text-lg font-bold mb-4">
              Kids
            </h2>
            <div className="space-y-2 mb-4">
              {kids.map((kid) => (
                <button
                  key={kid.id}
                  onClick={() => setActiveKid(kid)}
                  style={{
                    backgroundColor: activeKid?.id === kid.id ? COLORS.primary : "transparent",
                    color: activeKid?.id === kid.id ? "white" : COLORS.dark,
                  }}
                  className="w-full px-4 py-2 text-left rounded-lg hover:bg-gray-100 transition"
                >
                  {kid.name}
                  {kid.age && <span className="text-xs ml-2">({kid.age})</span>}
                </button>
              ))}
            </div>
            {kids.length < 5 && (
              <button
                onClick={() => setShowAddKid(!showAddKid)}
                style={{ backgroundColor: COLORS.primary }}
                className="w-full px-4 py-2 text-white text-sm rounded-lg hover:opacity-90"
              >
                + Add Kid
              </button>
            )}

            {showAddKid && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <input
                  type="text"
                  value={newKidName}
                  onChange={(e) => setNewKidName(e.target.value)}
                  placeholder="Name"
                  style={{ borderColor: COLORS.primary }}
                  className="w-full px-3 py-2 border rounded mb-2 text-sm"
                />
                <input
                  type="number"
                  value={newKidAge}
                  onChange={(e) => setNewKidAge(e.target.value)}
                  placeholder="Age"
                  style={{ borderColor: COLORS.primary }}
                  className="w-full px-3 py-2 border rounded mb-2 text-sm"
                />
                <input
                  type="text"
                  value={newKidGrade}
                  onChange={(e) => setNewKidGrade(e.target.value)}
                  placeholder="Grade"
                  style={{ borderColor: COLORS.primary }}
                  className="w-full px-3 py-2 border rounded mb-2 text-sm"
                />
                <button
                  onClick={handleAddKid}
                  style={{ backgroundColor: COLORS.primary }}
                  className="w-full px-3 py-2 text-white text-sm rounded hover:opacity-90"
                >
                  Save
                </button>
              </div>
            )}
          </div>

          <div className="mt-auto pt-4 border-t">
            <button
              onClick={handleLogout}
              style={{ color: COLORS.primary }}
              className="w-full text-sm font-medium hover:bg-gray-100 px-3 py-2 rounded text-left"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 p-8">
          <div className="max-w-4xl">
            <div className="mb-8">
              <h1 style={{ color: COLORS.dark }} className="text-3xl font-bold mb-2">
                {activeKid ? `${activeKid.name}'s Dashboard` : "Dashboard"}
              </h1>
              <p style={{ color: "#666" }} className="text-sm">
                Welcome, {email}
              </p>
            </div>

            {/* Quick Log Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold">
                  Quick Log
                </h2>
                <button
                  onClick={() => setShowQuickLog(!showQuickLog)}
                  style={{ backgroundColor: COLORS.primary }}
                  className="px-6 py-2 text-white rounded-lg hover:opacity-90 font-medium"
                >
                  {showQuickLog ? "Cancel" : "Log Activity"}
                </button>
              </div>

              {showQuickLog && (
                <div style={{ backgroundColor: "white", borderLeft: `4px solid ${COLORS.primary}` }} className="p-6 rounded mb-6">
                  <div className="space-y-4">
                    <div>
                      <label style={{ color: COLORS.dark }} className="block font-semibold mb-2">
                        Date
                      </label>
                      <input
                        type="date"
                        value={logDate}
                        onChange={(e) => setLogDate(e.target.value)}
                        style={{ borderColor: COLORS.primary }}
                        className="w-full p-3 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label style={{ color: COLORS.dark }} className="block font-semibold mb-2">
                        Subject
                      </label>
                      <select
                        value={logSubject}
                        onChange={(e) => setLogSubject(e.target.value)}
                        style={{ borderColor: COLORS.primary }}
                        className="w-full p-3 border rounded-lg"
                      >
                        <option value="">Select subject</option>
                        {SUBJECTS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ color: COLORS.dark }} className="block font-semibold mb-2">
                        Duration (hours)
                      </label>
                      <input
                        type="number"
                        value={logDuration}
                        onChange={(e) => setLogDuration(e.target.value)}
                        placeholder="1.5"
                        step="0.5"
                        style={{ borderColor: COLORS.primary }}
                        className="w-full p-3 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label style={{ color: COLORS.dark }} className="block font-semibold mb-2">
                        Platform
                      </label>
                      <input
                        type="text"
                        value={logPlatform}
                        onChange={(e) => setLogPlatform(e.target.value)}
                        placeholder="Khan Academy, IXL, etc."
                        style={{ borderColor: COLORS.primary }}
                        className="w-full p-3 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label style={{ color: COLORS.dark }} className="block font-semibold mb-2">
                        Notes
                      </label>
                      <textarea
                        value={logNotes}
                        onChange={(e) => setLogNotes(e.target.value)}
                        placeholder="Lesson details..."
                        style={{ borderColor: COLORS.primary }}
                        className="w-full p-3 border rounded-lg"
                        rows={3}
                      />
                    </div>
                    <button
                      onClick={handleQuickLogSave}
                      style={{ backgroundColor: COLORS.primary }}
                      className="w-full py-3 text-white font-semibold rounded-lg hover:opacity-90"
                    >
                      Save Activity
                    </button>
                  </div>
                </div>
              )}

              <div>
                <h3 style={{ color: COLORS.dark }} className="text-lg font-bold mb-4">
                  Recent Activities
                </h3>
                {kidReports.length === 0 ? (
                  <p style={{ color: "#999" }}>No activities logged yet</p>
                ) : (
                  <div className="space-y-3">
                    {kidReports.map((report) => (
                      <div
                        key={report.id}
                        style={{ backgroundColor: "white", borderLeft: `4px solid ${COLORS.primary}` }}
                        className="p-4 rounded"
                      >
                        <p style={{ color: COLORS.dark }} className="font-semibold">
                          {report.report_content}
                        </p>
                        <p style={{ color: "#666" }} className="text-sm">
                          {report.generated_date}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Goals Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold">
                  Goals
                </h2>
                <button
                  onClick={() => setShowAddGoal(!showAddGoal)}
                  style={{ backgroundColor: COLORS.primary }}
                  className="px-6 py-2 text-white rounded-lg hover:opacity-90 font-medium"
                >
                  {showAddGoal ? "Cancel" : "+ Add Goal"}
                </button>
              </div>

              {showAddGoal && (
                <div style={{ backgroundColor: "white", borderLeft: `4px solid ${COLORS.primary}` }} className="p-6 rounded mb-6">
                  <div className="space-y-4">
                    <div>
                      <label style={{ color: COLORS.dark }} className="block font-semibold mb-2">
                        Subject
                      </label>
                      <select
                        value={goalSubject}
                        onChange={(e) => setGoalSubject(e.target.value)}
                        style={{ borderColor: COLORS.primary }}
                        className="w-full p-3 border rounded-lg"
                      >
                        <option value="">Select subject</option>
                        {SUBJECTS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ color: COLORS.dark }} className="block font-semibold mb-2">
                        Monthly Hours
                      </label>
                      <input
                        type="number"
                        value={goalHours}
                        onChange={(e) => setGoalHours(e.target.value)}
                        placeholder="20"
                        step="1"
                        style={{ borderColor: COLORS.primary }}
                        className="w-full p-3 border rounded-lg"
                      />
                    </div>
                    <button
                      onClick={handleAddGoal}
                      style={{ backgroundColor: COLORS.primary }}
                      className="w-full py-3 text-white font-semibold rounded-lg hover:opacity-90"
                    >
                      Add Goal
                    </button>
                  </div>
                </div>
              )}

              {goals.length === 0 ? (
                <p style={{ color: "#999" }}>No goals set yet</p>
              ) : (
                <div className="space-y-3">
                  {goals.map((goal) => (
                    <div
                      key={goal.id}
                      style={{ backgroundColor: "white" }}
                      className="p-4 rounded flex items-center justify-between"
                    >
                      <div>
                        <p style={{ color: COLORS.dark }} className="font-semibold">
                          {goal.subject}
                        </p>
                        <p style={{ color: "#666" }} className="text-sm">
                          {goal.monthly_hours} hours/month
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Compliance Section */}
            <div className="mb-8">
              <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-4">
                Compliance Tracker
              </h2>
              <div className="mb-6">
                <label style={{ color: COLORS.dark }} className="block font-semibold mb-2">
                  Select Your State
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  style={{ borderColor: COLORS.primary }}
                  className="w-full p-3 border rounded-lg"
                >
                  {compliances.map((c) => (
                    <option key={c.state} value={c.state}>
                      {c.state}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCompliance && (
                <div style={{ backgroundColor: "white", borderLeft: `4px solid ${COLORS.primary}` }} className="p-6 rounded">
                  <h3 style={{ color: COLORS.dark }} className="text-lg font-bold mb-2">
                    {selectedCompliance.state} Requirements
                  </h3>
                  <p style={{ color: "#666" }} className="mb-4">
                    {selectedCompliance.details}
                  </p>
                  {selectedCompliance.hours > 0 && (
                    <p style={{ color: COLORS.accent3 }} className="font-semibold">
                      Minimum: {selectedCompliance.hours} hours/year
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Report Generator Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold">
                  Generate Report
                </h2>
                <button
                  onClick={() => setShowReportGen(!showReportGen)}
                  style={{ backgroundColor: COLORS.primary }}
                  className="px-6 py-2 text-white rounded-lg hover:opacity-90 font-medium"
                >
                  {showReportGen ? "Cancel" : "New Report"}
                </button>
              </div>

              {showReportGen && (
                <div style={{ backgroundColor: "white", borderLeft: `4px solid ${COLORS.primary}` }} className="p-6 rounded mb-6">
                  <div className="space-y-4">
                    <div>
                      <label style={{ color: COLORS.dark }} className="block font-semibold mb-2">
                        Child Name
                      </label>
                      <input
                        type="text"
                        value={reportChildName}
                        onChange={(e) => setReportChildName(e.target.value)}
                        placeholder="Enter child's name"
                        style={{ borderColor: COLORS.primary }}
                        className="w-full p-3 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label style={{ color: COLORS.dark }} className="block font-semibold mb-2">
                        Report Type
                      </label>
                      <select
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value as "daily" | "weekly")}
                        style={{ borderColor: COLORS.primary }}
                        className="w-full p-3 border rounded-lg"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ color: COLORS.dark }} className="block font-semibold mb-2">
                        Subjects (select all that apply)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {SUBJECTS.map((subject) => (
                          <label key={subject} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={reportSubjects.includes(subject)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setReportSubjects([...reportSubjects, subject]);
                                } else {
                                  setReportSubjects(reportSubjects.filter((s) => s !== subject));
                                }
                              }}
                              className="mr-2"
                            />
                            <span style={{ color: "#666" }} className="text-sm">
                              {subject}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={{ color: COLORS.dark }} className="block font-semibold mb-2">
                        Notes
                      </label>
                      <textarea
                        value={reportNotes}
                        onChange={(e) => setReportNotes(e.target.value)}
                        placeholder="Additional details..."
                        style={{ borderColor: COLORS.primary }}
                        className="w-full p-3 border rounded-lg"
                        rows={3}
                      />
                    </div>
                    <button
                      onClick={handleGenerateReport}
                      style={{ backgroundColor: COLORS.primary }}
                      className="w-full py-3 text-white font-semibold rounded-lg hover:opacity-90"
                    >
                      Generate & Download Report
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
