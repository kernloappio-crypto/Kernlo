"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import Navbar from "@/components/Navbar";
import { 
  getActivities, 
  getComplianceState, 
  setComplianceState,
  getAttendanceDaysYearly,
  getAttendanceDaysMonthly,
  getLastAttendanceDates,
  logAttendance
} from "@/lib/supabase-data";

export const dynamic = "force-dynamic";

interface Activity {
  id: string;
  child_name: string;
  subject: string;
  duration: number;
  date: string;
  activity_type?: string;
}

interface AttendanceRecord {
  id: string;
  child_name: string;
  schooling_date: string;
  schooled_today: boolean;
}

interface Kid {
  id: string;
  name: string;
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

const STATE_REQUIREMENTS: { [key: string]: any } = {
  CA: {
    name: "California",
    description: "175 instructional days OR equivalent hours per school year",
    totalHours: 900,
    subjects: {
      Math: 240,
      English: 240,
      Science: 120,
      History: 120,
      "Physical Education": 120,
    },
    notes: "Must include instruction in reading, language arts, mathematics, science, and social studies",
  },
  TX: {
    name: "Texas",
    description: "Bona fide curriculum requirement (NO hour minimums)",
    totalHours: 0,
    subjects: {
      "Reading/Language Arts": 0,
      Mathematics: 0,
      Science: 0,
      "Social Studies": 0,
    },
    notes: "Requires a bona fide curriculum with reading, language arts, mathematics, science, and social studies. No hour requirements.",
  },
  FL: {
    name: "Florida",
    description: "1,000 instructional hours per school year",
    totalHours: 1000,
    subjects: {
      Math: 180,
      English: 180,
      Science: 90,
      History: 90,
    },
    notes: "Must include core subjects: English Language Arts, Mathematics, Science, and Social Studies",
  },
  NY: {
    name: "New York",
    description: "900 instructional hours per school year",
    totalHours: 900,
    subjects: {
      Math: 200,
      English: 200,
      Science: 100,
      History: 100,
      "Physical Education": 90,
    },
    notes: "Must include English Language Arts, Mathematics, Science, and Social Studies",
  },
};

export default function CompliancePage() {
  const params = useParams();
  const router = useRouter();
  const kidId = params.id as string;

  const [userId, setUserId] = useState("");
  const [kid, setKid] = useState<Kid | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedState, setSelectedState] = useState("CA");
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [schooledToday, setSchooledToday] = useState(true);
  const [attendanceDaysYear, setAttendanceDaysYear] = useState(0);
  const [attendanceDaysMonth, setAttendanceDaysMonth] = useState(0);
  const [lastAttendanceDates, setLastAttendanceDates] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[class*="relative"]')) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [dropdownOpen]);

  useEffect(() => {
    const initializeUser = async () => {
      try {
        // Restore auth context for RLS policies to work
        const sessionStr = localStorage.getItem('kernlo_session');
        if (sessionStr) {
          try {
            const session = JSON.parse(sessionStr);
            await supabase.auth.setSession(session);
          } catch (e) {
            console.log('Could not restore session');
          }
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/auth/login");
          return;
        }

        setUserId(user.id);

        // Load kid
        const { data: kidData } = await supabase
          .from("kids")
          .select("*")
          .eq("id", kidId)
          .eq("user_id", user.id)
          .single();

        if (kidData) {
          setKid(kidData as Kid);
        }

        // Load compliance state
        if (kidData?.name) {
          const complianceData = await getComplianceState(user.id, kidData.name);
          if (complianceData?.state) {
            setSelectedState(complianceData.state);
          }
        }

        // Load activities
        const activitiesData = await getActivities(user.id);
        const kidActivities = activitiesData.filter((a: any) => a.child_name === kidData?.name);
        setActivities(kidActivities as Activity[]);

        // Load attendance records
        const { data: attendanceData } = await supabase
          .from("attendance")
          .select("*")
          .eq("user_id", user.id)
          .eq("child_name", kidData?.name)
          .order("date", { ascending: false });
        setAttendanceRecords((attendanceData as AttendanceRecord[]) || []);

        // Load attendance statistics
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        if (kidData?.name) {
          const yearlyDays = await getAttendanceDaysYearly(user.id, kidData.name, currentYear);
          setAttendanceDaysYear(yearlyDays);

          const monthlyDays = await getAttendanceDaysMonthly(user.id, kidData.name, currentYear, currentMonth);
          setAttendanceDaysMonth(monthlyDays);

          const lastDates = await getLastAttendanceDates(user.id, kidData.name, 10);
          setLastAttendanceDates(lastDates);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error initializing:", err);
        setLoading(false);
      }
    };

    initializeUser();
  }, [kidId, router]);

  async function handleStateChange(state: string) {
    setSelectedState(state);
    try {
      if (kid && userId) {
        const result = await setComplianceState(userId, state, kid.name);
        if (result) {
          console.log("State saved successfully:", state);
        }
      } else {
        console.warn("Missing kid or userId:", { kid, userId });
      }
    } catch (err) {
      console.error("Error setting state:", err);
      alert("Failed to save state. Please try again.");
    }
  }

  async function handleSaveAttendance() {
    if (!kid || !attendanceDate) {
      alert("Date is required");
      return;
    }

    try {
      // Only log if schooled_today is true
      if (schooledToday) {
        await logAttendance(userId, kid.name, attendanceDate);
      }

      // Reload attendance data
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      const yearlyDays = await getAttendanceDaysYearly(userId, kid.name, currentYear);
      setAttendanceDaysYear(yearlyDays);

      const monthlyDays = await getAttendanceDaysMonthly(userId, kid.name, currentYear, currentMonth);
      setAttendanceDaysMonth(monthlyDays);

      const lastDates = await getLastAttendanceDates(userId, kid.name, 10);
      setLastAttendanceDates(lastDates);

      // Reload all records
      const { data: attendanceData } = await supabase
        .from("attendance")
        .select("*")
        .eq("user_id", userId)
        .eq("child_name", kid.name)
        .order("date", { ascending: false });
      setAttendanceRecords((attendanceData as AttendanceRecord[]) || []);

      setAttendanceDate(new Date().toISOString().split("T")[0]);
      setSchooledToday(true);
      alert("Attendance recorded!");
    } catch (err) {
      console.error("Error saving attendance:", err);
      alert("Failed to save attendance");
    }
  }

  function calculateCompliance(): { [key: string]: { hours: number; required: number; met: boolean } } {
    const stateReq = STATE_REQUIREMENTS[selectedState] || {};
    const subjects = stateReq.subjects || {};
    const compliance: { [key: string]: { hours: number; required: number; met: boolean } } = {};

    Object.keys(subjects).forEach((subject) => {
      const subjectActivities = activities.filter((a) => a.subject === subject);
      const hours = subjectActivities.reduce((sum, a) => sum + a.duration, 0);
      const required = subjects[subject] || 0;
      compliance[subject] = {
        hours,
        required,
        met: hours >= required,
      };
    });

    return compliance;
  }

  const compliance = calculateCompliance();
  const allMet = Object.values(compliance).every((c) => c.met);

  return (
    <>
      <Navbar />
      <main style={{ backgroundColor: COLORS.light, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb" }} className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <Link href={`/dashboard/${kidId}`} style={{ color: COLORS.primary }} className="text-sm font-medium mb-4 block">
            ← Back to {kid?.name || "Child"}
          </Link>
          <div className="flex items-center justify-between">
            <h1 style={{ color: COLORS.dark }} className="text-3xl font-bold">
              State Compliance
            </h1>
            
            {/* State Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  borderColor: COLORS.primary,
                  color: COLORS.primary,
                  backgroundColor: "white",
                }}
                className="px-4 py-2 border-2 rounded-lg font-semibold text-sm sm:text-base hover:bg-blue-50 transition-colors whitespace-nowrap"
              >
                {STATE_REQUIREMENTS[selectedState]?.name} ▼
              </button>
              
              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div
                  style={{
                    backgroundColor: "white",
                    borderColor: COLORS.primary,
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  }}
                  className="absolute right-0 mt-2 w-56 border-2 rounded-lg overflow-hidden z-50"
                >
                  {Object.entries(STATE_REQUIREMENTS).map(([stateCode, stateData]) => (
                    <button
                      key={stateCode}
                      onClick={() => {
                        handleStateChange(stateCode);
                        setDropdownOpen(false);
                      }}
                      style={{
                        backgroundColor:
                          selectedState === stateCode ? "#e3f2fd" : "white",
                        color: COLORS.dark,
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors text-sm font-medium"
                    >
                      {stateData.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Attendance Tracking */}
        <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-3 sm:p-4 border border-gray-200">
          <h2 style={{ color: COLORS.dark }} className="text-lg font-bold mb-4">
            📅 Attendance Summary
          </h2>

          {/* Year and Month Summary */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div style={{ backgroundColor: COLORS.light, borderRadius: "8px" }} className="p-4">
              <p style={{ color: "#555" }} className="text-xs font-semibold mb-1">THIS MONTH</p>
              <p style={{ color: COLORS.primary }} className="text-2xl font-bold">{attendanceDaysMonth}</p>
              <p style={{ color: "#555" }} className="text-xs mt-1">days logged</p>
            </div>
            <div style={{ backgroundColor: COLORS.light, borderRadius: "8px" }} className="p-4">
              <p style={{ color: "#555" }} className="text-xs font-semibold mb-1">THIS YEAR</p>
              <p style={{ color: COLORS.primary }} className="text-2xl font-bold">{attendanceDaysYear}</p>
              <p style={{ color: "#555" }} className="text-xs mt-1">days logged</p>
            </div>
          </div>

          {/* State Requirement Progress */}
          {selectedState === "CA" && (
            <div className="mb-6 pb-6 border-b border-gray-200">
              <p style={{ color: "#333" }} className="text-sm font-semibold mb-3">
                California Requirement: 175 days/year
              </p>
              <div style={{ backgroundColor: "#e5e7eb", borderRadius: "4px" }} className="h-4 overflow-hidden">
                <div
                  style={{
                    backgroundColor: COLORS.accent3,
                    width: `${Math.min((attendanceDaysYear / 175) * 100, 100)}%`,
                    transition: "width 0.3s ease",
                  }}
                  className="h-full"
                />
              </div>
              <p style={{ color: "#555" }} className="text-xs mt-2">
                {attendanceDaysYear} / 175 days ({Math.round((attendanceDaysYear / 175) * 100)}%)
              </p>
            </div>
          )}

          {selectedState === "FL" && (
            <div className="mb-6 pb-6 border-b border-gray-200">
              <p style={{ color: "#333" }} className="text-sm font-semibold mb-3">
                Florida Requirement: 1,000 hours/year
              </p>
              <div style={{ backgroundColor: "#e5e7eb", borderRadius: "4px" }} className="h-4 overflow-hidden">
                <div
                  style={{
                    backgroundColor: COLORS.accent3,
                    width: `${Math.min((attendanceDaysYear / 200) * 100, 100)}%`,
                    transition: "width 0.3s ease",
                  }}
                  className="h-full"
                />
              </div>
              <p style={{ color: "#555" }} className="text-xs mt-2">
                Note: Use logged activities for hour tracking
              </p>
            </div>
          )}

          {selectedState === "NY" && (
            <div className="mb-6 pb-6 border-b border-gray-200">
              <p style={{ color: "#333" }} className="text-sm font-semibold mb-3">
                New York Requirement: 900 hours/year
              </p>
              <div style={{ backgroundColor: "#e5e7eb", borderRadius: "4px" }} className="h-4 overflow-hidden">
                <div
                  style={{
                    backgroundColor: COLORS.accent3,
                    width: `${Math.min((attendanceDaysYear / 180) * 100, 100)}%`,
                    transition: "width 0.3s ease",
                  }}
                  className="h-full"
                />
              </div>
              <p style={{ color: "#555" }} className="text-xs mt-2">
                Note: Use logged activities for hour tracking
              </p>
            </div>
          )}

          {/* Last 10 Attendance Dates */}
          {lastAttendanceDates.length > 0 && (
            <div className="mb-6">
              <h3 style={{ color: COLORS.dark }} className="text-sm font-bold mb-3">
                Last 10 Attendance Dates
              </h3>
              <div className="flex flex-wrap gap-2">
                {lastAttendanceDates.map((date) => (
                  <div
                    key={date}
                    style={{ backgroundColor: COLORS.light, borderRadius: "6px" }}
                    className="px-3 py-2"
                  >
                    <p style={{ color: COLORS.primary }} className="text-xs font-semibold">
                      {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Log New Attendance */}
          <div className="pt-6 border-t border-gray-200">
            <h3 style={{ color: COLORS.dark }} className="text-sm font-bold mb-4">
              Log Attendance
            </h3>
            <div className="space-y-4">
              <div>
                <label style={{ color: "#333" }} className="text-sm font-medium block mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  style={{ color: "#1a1a2e" }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleSaveAttendance}
                style={{ backgroundColor: COLORS.primary }}
                className="w-full px-4 py-2.5 text-white font-semibold rounded-lg hover:opacity-90 text-sm"
              >
                ✓ Log as Attendance Day
              </button>
            </div>
          </div>
        </div>

        {/* Compliance Status */}
        <div>
          {allMet ? (
            <div style={{ backgroundColor: "#e8f5e9", borderRadius: "12px" }} className="p-6 border border-green-200">
              <p style={{ color: "#2e7d32" }} className="text-lg font-bold">
                ✓ All requirements met!
              </p>
            </div>
          ) : (
            <div style={{ backgroundColor: "#fff3e0", borderRadius: "12px" }} className="p-6 border border-orange-200">
              <p style={{ color: "#e65100" }} className="text-lg font-bold">
                ⚠ Not all requirements met. Keep logging activities.
              </p>
            </div>
          )}
        </div>

        {/* State Requirements Header */}
        <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-3 sm:p-4 border border-gray-200 mb-6">
          <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-2">
            {STATE_REQUIREMENTS[selectedState]?.name} Requirements
          </h2>
          <p style={{ color: "#333" }} className="text-sm mb-4">
            {STATE_REQUIREMENTS[selectedState]?.description}
          </p>
          {STATE_REQUIREMENTS[selectedState]?.notes && (
            <div style={{ backgroundColor: "#f0f7ff", borderLeft: `4px solid ${COLORS.primary}` }} className="p-3 rounded text-sm">
              <p style={{ color: COLORS.dark }} className="font-medium mb-1">
                Important Note:
              </p>
              <p style={{ color: "#333" }}>
                {STATE_REQUIREMENTS[selectedState]?.notes}
              </p>
            </div>
          )}
        </div>

        {/* Subject Requirements */}
        {STATE_REQUIREMENTS[selectedState]?.totalHours > 0 ? (
          <div>
            <h3 style={{ color: COLORS.dark }} className="text-lg font-bold mb-4">
              Subject Hour Requirements
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {Object.entries(compliance).map(([subject, data]) => {
                const percentage = Math.round((data.hours / data.required) * 100);
                const isMet = data.met;

                return (
                  <div
                    key={subject}
                    style={{ backgroundColor: "white", borderRadius: "12px" }}
                    className="p-3 sm:p-4 border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 style={{ color: COLORS.dark }} className="text-lg font-bold">
                          {subject}
                        </h3>
                        <p style={{ color: "#333" }} className="text-sm">
                          {data.hours.toFixed(1)} / {data.required} hours
                        </p>
                      </div>
                      <span
                        style={{
                          backgroundColor: isMet ? "#e8f5e9" : "#ffebee",
                          color: isMet ? "#2e7d32" : "#c62828",
                        }}
                        className="px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {isMet ? "✓ Met" : "✗ Not Met"}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ backgroundColor: "#e5e7eb", borderRadius: "4px" }} className="h-3 overflow-hidden">
                      <div
                        style={{
                          backgroundColor: isMet ? COLORS.accent3 : COLORS.accent1,
                          width: `${Math.min(percentage, 100)}%`,
                          transition: "width 0.3s ease",
                        }}
                        className="h-full"
                      />
                    </div>

                    <p style={{ color: "#333" }} className="text-sm mt-2">
                      {percentage}% complete
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ backgroundColor: "#fff3e0", borderRadius: "12px" }} className="p-6 border border-orange-200">
            <p style={{ color: "#e65100" }} className="font-semibold mb-2">
              Curriculum-Based State
            </p>
            <p style={{ color: "#333" }} className="text-sm">
              {selectedState} requires a bona fide curriculum with core subjects. While there are no specific hour minimums, logging your activities helps demonstrate a comprehensive educational program.
            </p>
          </div>
        )}
      </div>

    </main>
    </>
  );
}
