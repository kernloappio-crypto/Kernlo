"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";

interface Kid {
  id: string;
  name: string;
  age?: number;
  grade?: string;
}

interface Activity {
  id: string;
  child_name: string;
  subject: string;
  duration: number;
  platform: string;
  date: string;
  notes?: string;
  curriculum?: string;
  activity_type?: string;
}

interface ReportsHubProps {
  userId: string;
  kids: Kid[];
  activities: Activity[];
  isOpen: boolean;
  onClose: () => void;
  preselectedKidId?: string;
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

const SUBJECT_COLORS: { [key: string]: string } = {
  Math: "#3b82f6",
  English: "#8b5cf6",
  Science: "#10b981",
  History: "#f59e0b",
  "Social Studies": "#ef4444",
  Arts: "#ec4899",
  "Physical Education": "#14b8a6",
  Other: "#6b7280",
};

const SUBJECT_ICONS: { [key: string]: string } = {
  Math: "🔢",
  English: "📖",
  Science: "🔬",
  History: "📚",
  "Social Studies": "🌍",
  Arts: "🎨",
  "Physical Education": "⚽",
  Other: "📝",
};

const DATE_PRESETS = [
  { label: "Last 7 Days", days: 7 },
  { label: "This Month", days: null, preset: "month" },
  { label: "Current Semester", days: null, preset: "semester" },
];

// State-to-full name mapping for compliance reports
const STATE_NAMES: { [key: string]: string } = {
  "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
  "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "FL": "Florida", "GA": "Georgia",
  "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa",
  "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
  "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri",
  "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey",
  "NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio",
  "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
  "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont",
  "VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming", "DC": "District of Columbia",
};

// State-specific core subjects for compliance reporting
const STATE_CORE_SUBJECTS: { [key: string]: string[] } = {
  "TX": ["Reading", "Spelling", "Grammar", "Math", "Good Citizenship"],
  "CA": ["English", "Math", "Social Studies", "Science", "Physical Education"],
  "FL": ["English Language Arts", "Mathematics", "Science", "Social Studies"],
  "NY": ["English Language Arts", "Mathematics", "Science", "Social Studies"],
  "PA": ["Reading", "Mathematics", "Science", "Social Studies"],
  "IL": ["English Language Arts", "Mathematics", "Science", "Social Studies"],
  "OH": ["English Language Arts", "Mathematics", "Science", "Social Studies"],
  "MI": ["English Language Arts", "Mathematics", "Science", "Social Studies"],
  "GA": ["English Language Arts", "Mathematics", "Science", "Social Studies"],
  "NC": ["English Language Arts", "Mathematics", "Science", "Social Studies"],
  "VA": ["English", "Mathematics", "Science", "History & Social Science"],
  "MA": ["English Language Arts", "Mathematics", "Science and Technology", "Social Studies"],
  "WA": ["English Language Arts", "Mathematics", "Science", "Social Studies"],
  "CO": ["English Language Arts", "Mathematics", "Science", "Social Studies"],
  "OR": ["English Language Arts", "Mathematics", "Science", "Social Studies"],
  "default": ["English", "Math", "Science", "Social Studies", "Reading"],
};

export default function ReportsHub({
  userId,
  kids,
  activities,
  isOpen,
  onClose,
  preselectedKidId,
}: ReportsHubProps) {
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [reportType, setReportType] = useState<"progress" | "comprehensive" | "portfolio">("comprehensive");
  const [complianceMode, setComplianceMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationTimeLeft, setGenerationTimeLeft] = useState(0);
  const [extracurricularActivities, setExtracurricularActivities] = useState<any[]>([]);
  const [fieldTripActivities, setFieldTripActivities] = useState<any[]>([]);
  const [parentState, setParentState] = useState<string>("");

  // Initialize dates on mount and fetch parent state
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    setEndDate(today.toISOString().split("T")[0]);
    setStartDate(thirtyDaysAgo.toISOString().split("T")[0]);

    // Pre-select kid if provided
    if (preselectedKidId) {
      setSelectedChildren([preselectedKidId]);
    }

    // Fetch parent's state from profile
    fetchParentState();
  }, [preselectedKidId]);

  const fetchParentState = async () => {
    try {
      const { data, error } = await supabase
        .from("parent_profiles")
        .select("compliance_state")
        .eq("user_id", userId)
        .single();

      if (!error && data?.compliance_state) {
        setParentState(data.compliance_state);
      }
    } catch (err) {
      console.log("Could not fetch parent state");
    }
  };

  const applyDatePreset = (days: number | null, preset?: string) => {
    const today = new Date();
    let newStartDate: Date;

    if (preset === "month") {
      newStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (preset === "semester") {
      // Assume semester starts in Jan/Aug
      const month = today.getMonth();
      newStartDate = month >= 7 ? new Date(today.getFullYear(), 7, 1) : new Date(today.getFullYear(), 0, 1);
    } else if (days) {
      newStartDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
    } else {
      return;
    }

    setStartDate(newStartDate.toISOString().split("T")[0]);
    setEndDate(today.toISOString().split("T")[0]);
  };

  const toggleChildSelection = (kidId: string) => {
    setSelectedChildren((prev) =>
      prev.includes(kidId) ? prev.filter((id) => id !== kidId) : [...prev, kidId]
    );
  };

  const toggleSubjectSelection = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  const selectAllChildren = () => {
    setSelectedChildren(kids.map((k) => k.id));
  };

  const clearAllChildren = () => {
    setSelectedChildren([]);
  };

  const getCoreSubjectsForState = (): string[] => {
    if (!parentState) return STATE_CORE_SUBJECTS["default"];
    return STATE_CORE_SUBJECTS[parentState] || STATE_CORE_SUBJECTS["default"];
  };

  const getAvailableSubjects = (): string[] => {
    let subjects = new Set<string>();
    selectedChildren.forEach((childId) => {
      const child = kids.find((k) => k.id === childId);
      if (child) {
        activities
          .filter((a) => a.child_name === child.name && a.subject)
          .forEach((a) => subjects.add(a.subject));
      }
    });

    // If compliance mode is on, filter to only state's core subjects
    if (complianceMode) {
      const coreSubjects = getCoreSubjectsForState();
      subjects = new Set(
        Array.from(subjects).filter((s) => 
          coreSubjects.some(cs => cs.toLowerCase() === s.toLowerCase())
        )
      );
    }

    return Array.from(subjects).sort();
  };

  const handleGenerateReport = async () => {
    if (selectedChildren.length === 0) {
      alert("Please select at least one child");
      return;
    }

    if (selectedSubjects.length === 0) {
      alert("Please select at least one subject");
      return;
    }

    if (!startDate || !endDate) {
      alert("Please set start and end dates");
      return;
    }

    setIsGenerating(true);
    setGenerationTimeLeft(30);

    // Countdown timer
    const timer = setInterval(() => {
      setGenerationTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      // Get auth token
      let accessToken = "";
      if (typeof window !== "undefined") {
        const sessionStr = localStorage.getItem("kernlo_session");
        if (sessionStr) {
          try {
            const session = JSON.parse(sessionStr);
            accessToken = session.access_token;
          } catch (e) {
            accessToken = localStorage.getItem("kernlo_access_token") || "";
          }
        } else {
          accessToken = localStorage.getItem("kernlo_access_token") || "";
        }
      }

      const selectedKids = kids.filter((k) => selectedChildren.includes(k.id));
      let successCount = 0;
      let errorCount = 0;

      for (const kid of selectedKids) {
        // Get activities for this kid
        const coreActivities = activities.filter(
          (a) =>
            a.child_name === kid.name &&
            new Date(a.date) >= new Date(startDate) &&
            new Date(a.date) <= new Date(endDate) &&
            selectedSubjects.includes(a.subject)
        );

        if (coreActivities.length === 0) {
          console.log(`No activities found for ${kid.name}`);
          continue;
        }

        // Get extracurricular and field trip activities
        let extracurr: any[] = [];
        let fieldTrips: any[] = [];

        try {
          const extraResp = await fetch(
            `/api/extracurricular?childId=${kid.id}&startDate=${startDate}&endDate=${endDate}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (extraResp.ok) {
            const data = await extraResp.json();
            extracurr = data.activities || [];
          }
        } catch (e) {
          console.log("Could not fetch extracurricular");
        }

        try {
          const tripResp = await fetch(
            `/api/field-trips?childId=${kid.id}&startDate=${startDate}&endDate=${endDate}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (tripResp.ok) {
            const data = await tripResp.json();
            fieldTrips = data.activities || [];
          }
        } catch (e) {
          console.log("Could not fetch field trips");
        }

        // Generate activity summary
        let activitySummary = "";
        let totalActivities = coreActivities.length + extracurr.length + fieldTrips.length;

        if (totalActivities === 0) {
          console.log(`No activities for ${kid.name}`);
          errorCount++;
          continue;
        }

        // Build summary based on compliance mode
        const coreSubjectsForReport = getCoreSubjectsForState();
        const subjectsToInclude = complianceMode
          ? selectedSubjects.filter((s) =>
              coreSubjectsForReport.some(cs => cs.toLowerCase() === s.toLowerCase())
            )
          : selectedSubjects;

        const relevantActivities = coreActivities.filter((a) =>
          subjectsToInclude.includes(a.subject)
        );

        if (complianceMode && relevantActivities.length === 0) {
          console.log(`No compliance subjects found for ${kid.name}`);
          errorCount++;
          continue;
        }

        if (relevantActivities.length > 0) {
          activitySummary += `CORE SUBJECTS (${relevantActivities.length} activities, ${(
            relevantActivities.reduce((sum, a) => sum + a.duration, 0) / 60
          ).toFixed(1)} hours):\n`;
          relevantActivities.forEach((a) => {
            activitySummary += `- ${a.date}: ${a.subject} (${a.duration}m via ${a.platform})\n`;
          });
          activitySummary += "\n";
        }

        if (!complianceMode) {
          if (extracurr.length > 0) {
            activitySummary += `EXTRACURRICULAR (${extracurr.length} activities):\n`;
            extracurr.forEach((a) => {
              activitySummary += `- ${a.date}: ${a.activity_name}\n`;
            });
            activitySummary += "\n";
          }

          if (fieldTrips.length > 0) {
            activitySummary += `FIELD TRIPS & ENRICHMENT (${fieldTrips.length} activities):\n`;
            fieldTrips.forEach((a) => {
              activitySummary += `- ${a.date}: ${a.trip_name} (${a.destination})\n`;
            });
            activitySummary += "\n";
          }
        }

        // Generate PDF
        const coreSubjects = getCoreSubjectsForState();
        const coreSubjectsStr = coreSubjects.join(", ");
        const prompt = `Generate a ${complianceMode ? "minimalist, professional homeschool compliance" : "comprehensive"} progress report for ${kid.name} covering ${startDate} to ${endDate}.

${
  complianceMode
    ? `Focus ONLY on core subjects: ${coreSubjectsStr}. Use a standardized format for ${parentState ? STATE_NAMES[parentState] : "your state"}'s compliance requirements. Remove non-core subjects.`
    : "Include Core Subjects, Extracurricular, and Field Trips. Create a narrative-style report with accomplishments and skill development."
}

Activity log:
${activitySummary}

Create a professional homeschool report document.`;

        const genResp = await fetch("/api/generate-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            studentName: kid.name,
            startDate,
            endDate,
          }),
        });

        if (!genResp.ok) throw new Error("Report generation failed");
        const genData = await genResp.json();

        // Generate PDF with jsPDF
        const { jsPDF } = await import("jspdf");
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const marginLeft = 15;
        const marginRight = 15;
        const marginTop = 15;
        let yPosition = marginTop;

        // Determine title based on report type and compliance mode
        let reportTitle = "COMPREHENSIVE PROGRESS REPORT";
        if (complianceMode) {
          const stateName = parentState && STATE_NAMES[parentState] ? STATE_NAMES[parentState] : "";
          reportTitle = stateName ? `${stateName.toUpperCase()} COMPLIANCE REPORT` : "COMPLIANCE REPORT";
        } else if (reportType === "progress") {
          reportTitle = "PROGRESS SUMMARY";
        } else if (reportType === "portfolio") {
          reportTitle = "PORTFOLIO & ACHIEVEMENTS";
        }

        // Title
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text(reportTitle, marginLeft, yPosition);
        yPosition += 10;

        // Student info
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text(`Student: ${kid.name}`, marginLeft, yPosition);
        yPosition += 6;
        doc.text(`Period: ${startDate} to ${endDate}`, marginLeft, yPosition);
        yPosition += 6;
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, marginLeft, yPosition);
        yPosition += 12;

        // Narrative
        doc.setFontSize(10);
        const narrativeLines = (doc.splitTextToSize(
          genData.narrative,
          pageWidth - marginLeft - marginRight
        )) as string[];
        narrativeLines.forEach((line) => {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = marginTop;
          }
          doc.text(line, marginLeft, yPosition);
          yPosition += 5;
        });

        // Save PDF
        doc.save(`${kid.name}-report-${startDate}-${endDate}.pdf`);

        // Log to database
        try {
          const sessionStr = localStorage.getItem("kernlo_session");
          if (sessionStr) {
            const session = JSON.parse(sessionStr);
            await supabase.auth.setSession(session);
          }
          await new Promise((resolve) => setTimeout(resolve, 50));
        } catch (e) {
          console.log("Auth context error");
        }

        const { data: userData } = await supabase.auth.getUser();
        const currentUserId = userData.user?.id;

        if (currentUserId) {
          const dateRange = `${new Date(startDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}-${new Date(endDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}, ${new Date(endDate).getFullYear()}`;

          const reportId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
          const sanitizedDateRange = dateRange
            .replace(/\s+/g, "_")
            .replace(/[^a-zA-Z0-9_-]/g, "");
          const fileName = `${currentUserId}/${kid.id}/${reportId}-${sanitizedDateRange}.pdf`;

          // Skip PDF storage for now, just log to database
          try {
            const { error } = await supabase.from("generated_reports").insert({
              user_id: currentUserId,
              kid_id: kid.id,
              child_name: kid.name,
              report_type: reportType,
              date_range: dateRange,
              date_generated: new Date().toISOString(),
              start_date: startDate,
              end_date: endDate,
              selected_subjects: selectedSubjects,
              selected_activity_types: ["Core Subject"],
              compliance_mode: complianceMode,
            });

            if (error) {
              console.error("Database insert error:", error.message);
              errorCount++;
            } else {
              console.log(`✅ Report logged for ${kid.name}`);
              successCount++;
            }
          } catch (e) {
            console.error("Database insert exception:", e);
            errorCount++;
          }
        }
      }

      clearInterval(timer);
      setIsGenerating(false);

      // Show result message
      if (successCount > 0) {
        alert(`✅ Successfully generated ${successCount} report${successCount > 1 ? "s" : ""}!`);
        onClose();
      } else if (errorCount > 0) {
        alert(`⚠️ Could not generate reports. Please check that selected children have activities logged for the date range.`);
      }
    } catch (error) {
      console.error("Error generating reports:", error);
      clearInterval(timer);
      setIsGenerating(false);
      alert("Failed to generate reports. Please try again.");
    }
  };

  if (!isOpen) return null;

  const availableSubjects = getAvailableSubjects();

  return (
    <div
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div
        style={{ backgroundColor: "white", borderRadius: "12px" }}
        className="p-6 sm:p-8 max-w-2xl w-full my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ color: "#1a1a2e" }} className="text-lg sm:text-2xl font-bold mb-6">
          📊 Reports Hub
        </h2>

        <div className="space-y-6 mb-6 max-h-96 overflow-y-auto">
          {/* Child Selection - Checkboxes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label style={{ color: "#1a1a2e" }} className="block text-sm font-semibold">
                Select Children
              </label>
              <div className="flex gap-2">
                <button
                  onClick={selectAllChildren}
                  className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                >
                  Select All
                </button>
                <button
                  onClick={clearAllChildren}
                  className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-gray-50">
              {kids.length === 0 ? (
                <p style={{ color: "#555" }} className="text-sm">
                  ⚠️ No children available. Please add a child first.
                </p>
              ) : (
                kids.map((kid) => (
                  <button
                    key={kid.id}
                    onClick={() => toggleChildSelection(kid.id)}
                    className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 min-h-[44px] flex items-center justify-center cursor-pointer hover:shadow-md active:scale-95 ${
                      selectedChildren.includes(kid.id)
                        ? "bg-blue-500 text-white shadow-md"
                        : "bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400"
                    }`}
                    style={
                      selectedChildren.includes(kid.id)
                        ? { backgroundColor: COLORS.primary, color: "white" }
                        : { color: "#1a1a2e" }
                    }
                  >
                    {kid.name}
                  </button>
                ))
              )}
            </div>
            {selectedChildren.length > 0 && (
              <p style={{ color: COLORS.primary }} className="text-xs mt-2 font-medium">
                {selectedChildren.length} child{selectedChildren.length > 1 ? "ren" : ""} selected
              </p>
            )}
          </div>

          {/* Date Presets */}
          <div>
            <label style={{ color: "#1a1a2e" }} className="block text-sm font-semibold mb-3">
              Quick Date Presets
            </label>
            <div className="flex flex-wrap gap-2">
              {DATE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() =>
                    applyDatePreset(preset.days, preset.preset)
                  }
                  className="px-4 py-2 text-sm font-medium rounded-lg border-2 border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-600 transition-all"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ color: "#1a1a2e" }} className="block text-sm font-semibold mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label style={{ color: "#1a1a2e" }} className="block text-sm font-semibold mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Subject Selection with Colors & Icons */}
          <div>
            <label style={{ color: "#1a1a2e" }} className="block text-sm font-semibold mb-3">
              Select Subjects
            </label>
            <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-gray-50">
              {selectedChildren.length === 0 ? (
                <p style={{ color: "#555" }} className="text-sm">
                  👉 Select children first to see available subjects
                </p>
              ) : availableSubjects.length === 0 ? (
                <p style={{ color: "#555" }} className="text-sm">
                  ⚠️ No subjects found. Log some activities first for the selected children.
                </p>
              ) : (
                availableSubjects.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => toggleSubjectSelection(subject)}
                    className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 min-h-[44px] flex items-center justify-center gap-2 cursor-pointer hover:shadow-md active:scale-95 ${
                      selectedSubjects.includes(subject)
                        ? "text-white shadow-md"
                        : "bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400"
                    }`}
                    style={
                      selectedSubjects.includes(subject)
                        ? {
                            backgroundColor: SUBJECT_COLORS[subject] || "#9ca3af",
                            color: "white",
                          }
                        : { color: "#1a1a2e" }
                    }
                  >
                    <span>{SUBJECT_ICONS[subject] || "📝"}</span>
                    {subject}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Report Type Segmented Control */}
          <div>
            <label style={{ color: "#1a1a2e" }} className="block text-sm font-semibold mb-3">
              Report Type
            </label>
            <div className="flex gap-2 p-2 bg-gray-100 rounded-lg w-fit">
              {["progress", "comprehensive", "portfolio"].map((type) => (
                <button
                  key={type}
                  onClick={() => setReportType(type as "progress" | "comprehensive" | "portfolio")}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all capitalize ${
                    reportType === type
                      ? "bg-white text-blue-600 shadow-sm"
                      : "bg-transparent text-gray-600 hover:text-gray-800"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Compliance Mode Toggle */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={complianceMode}
                onChange={(e) => setComplianceMode(e.target.checked)}
                className="w-5 h-5 rounded cursor-pointer"
              />
              <span style={{ color: "#1a1a2e" }} className="text-sm font-semibold">
                {parentState ? `${STATE_NAMES[parentState]} Compliance Mode` : "Compliance Mode"} (Core subjects only)
              </span>
            </label>
          </div>
        </div>

        {/* Warning & Status */}
        <div className="mb-6">
          {isGenerating && (
            <div className="p-3 bg-blue-50 rounded border border-blue-200">
              <p style={{ color: "#1a1a2e" }} className="text-sm font-medium">
                📊 Generating Report ({generationTimeLeft}s)...
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  style={{
                    width: `${((30 - generationTimeLeft) / 30) * 100}%`,
                    backgroundColor: COLORS.primary,
                    transition: "width 0.1s linear",
                  }}
                  className="h-2 rounded-full"
                />
              </div>
            </div>
          )}
          {!isGenerating && (
            <p style={{ color: "#ff6b6b" }} className="text-xs p-3 bg-red-50 rounded border border-red-200">
              ⚠️ Report generation takes ~30 seconds. Please click once and wait.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 sm:gap-3 flex-col sm:flex-row">
          <button
            onClick={handleGenerateReport}
            disabled={
              isGenerating ||
              selectedChildren.length === 0 ||
              selectedSubjects.length === 0
            }
            style={{
              backgroundColor: isGenerating
                ? "#999"
                : selectedChildren.length === 0 || selectedSubjects.length === 0
                ? "#ccc"
                : COLORS.primary,
              minHeight: "44px",
            }}
            className="flex-1 px-4 py-2.5 text-white font-semibold rounded-lg hover:opacity-90 disabled:cursor-not-allowed text-sm sm:text-base flex items-center justify-center"
          >
            {isGenerating
              ? `Generating Report (${generationTimeLeft}s)...`
              : "📥 Download Reports"}
          </button>
          <button
            onClick={onClose}
            disabled={isGenerating}
            style={{ color: "#1a1a2e", borderColor: "#333", minHeight: "44px" }}
            className="flex-1 px-4 py-2.5 border font-semibold rounded-lg hover:bg-gray-50 text-sm sm:text-base flex items-center justify-center disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
