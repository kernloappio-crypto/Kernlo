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
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  return (
    <div
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      className="fixed inset-0 flex items-center justify-center p-2 md:p-3 z-50"
      onClick={onClose}
    >
      {/* Mobile Compact Modal */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          position: "relative",
          width: "100%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER with Compliance Toggle */}
        <div
          style={{
            borderBottom: "1px solid #e5e7eb",
            padding: isMobile ? "8px 12px" : "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <h2 style={{ color: "#1a1a2e", fontSize: isMobile ? "16px" : "20px", fontWeight: "bold", margin: 0 }}>
            📊 Reports Hub
          </h2>
          {/* Compliance Toggle - Top Right Corner */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <input
              type="checkbox"
              checked={complianceMode}
              onChange={(e) => setComplianceMode(e.target.checked)}
              style={{
                width: "14px",
                height: "14px",
                cursor: "pointer",
              }}
            />
            <span style={{ color: "#1a1a2e", fontSize: isMobile ? "9px" : "10px", fontWeight: "500" }} className="hidden sm:inline">
              {parentState && STATE_NAMES[parentState] ? `${STATE_NAMES[parentState]}` : "Compliance"}
            </span>
            <span style={{ color: "#1a1a2e", fontSize: "9px", fontWeight: "500" }} className="sm:hidden">
              Compliance
            </span>
          </label>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: isMobile ? "8px 12px" : "12px 16px",
            paddingBottom: isMobile ? "90px" : "75px",
          }}
        >
          {/* Child Selection - 3-Column Chips Row */}
          <div style={{ marginBottom: isMobile ? "8px" : "12px" }}>
            <div className="flex items-center justify-between mb-1">
              <label style={{ color: "#1a1a2e", fontSize: isMobile ? "11px" : "12px" }} className="font-semibold">
                Children
              </label>
              <div className="flex gap-0.5">
                <button
                  onClick={selectAllChildren}
                  className="text-xs px-1.5 py-0.5 text-blue-600 hover:bg-blue-50 rounded"
                  style={{ fontSize: "10px" }}
                >
                  All
                </button>
                <button
                  onClick={clearAllChildren}
                  className="text-xs px-1.5 py-0.5 text-gray-600 hover:bg-gray-100 rounded"
                  style={{ fontSize: "10px" }}
                >
                  Clear
                </button>
              </div>
            </div>
            {/* 3-Column Grid for Children */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: isMobile ? "6px" : "8px" }}>
              {kids.length === 0 ? (
                <p style={{ color: "#555", fontSize: "11px" }}>⚠️ No children</p>
              ) : (
                kids.map((kid) => (
                  <button
                    key={kid.id}
                    onClick={() => toggleChildSelection(kid.id)}
                    style={{
                      padding: isMobile ? "6px 8px" : "8px 10px",
                      fontSize: isMobile ? "11px" : "12px",
                      backgroundColor: selectedChildren.includes(kid.id)
                        ? COLORS.primary
                        : "white",
                      color: selectedChildren.includes(kid.id) ? "white" : "#1a1a2e",
                      border: selectedChildren.includes(kid.id)
                        ? "none"
                        : "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    className="hover:opacity-90"
                  >
                    {selectedChildren.includes(kid.id) ? "✓ " : ""}
                    {kid.name}
                  </button>
                ))
              )}
            </div>
            {selectedChildren.length > 0 && (
              <p style={{ color: COLORS.primary, fontSize: "10px", marginTop: "4px" }} className="font-medium">
                {selectedChildren.length} selected
              </p>
            )}
          </div>

          {/* Presets - Horizontal Scroll */}
          <div style={{ marginBottom: isMobile ? "8px" : "12px" }}>
            <label style={{ color: "#1a1a2e", fontSize: isMobile ? "11px" : "12px" }} className="font-semibold block mb-1">
              Presets
            </label>
            <div
              style={{
                display: "flex",
                gap: "6px",
                overflowX: "auto",
                overflowY: "hidden",
                scrollBehavior: "smooth",
                paddingBottom: "4px",
                WebkitOverflowScrolling: "touch", // smooth momentum scroll on iOS
              }}
            >
              {DATE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => applyDatePreset(preset.days, preset.preset)}
                  style={{
                    padding: isMobile ? "6px 12px" : "8px 16px",
                    fontSize: "11px",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    backgroundColor: "white",
                    color: "#374151",
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#3b82f6";
                    e.currentTarget.style.color = "#3b82f6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#d1d5db";
                    e.currentTarget.style.color = "#374151";
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Inputs - Start | End (50/50 Split) */}
          <div style={{ marginBottom: isMobile ? "8px" : "12px" }}>
            <label style={{ color: "#1a1a2e", fontSize: isMobile ? "11px" : "12px" }} className="font-semibold block mb-1">
              Date Range
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: isMobile ? "6px" : "8px" }}>
              <div>
                <label style={{ color: "#555", fontSize: "10px" }} className="font-medium block mb-0.5">
                  Start
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: isMobile ? "6px 8px" : "8px 10px",
                    fontSize: "11px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label style={{ color: "#555", fontSize: "10px" }} className="font-medium block mb-0.5">
                  End
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: isMobile ? "6px 8px" : "8px 10px",
                    fontSize: "11px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Report Type */}
          <div style={{ marginBottom: isMobile ? "8px" : "12px" }}>
            <label style={{ color: "#1a1a2e", fontSize: isMobile ? "11px" : "12px" }} className="font-semibold block mb-1">
              Report Type
            </label>
            <div style={{ display: "flex", gap: "4px", padding: "4px", backgroundColor: "#f3f4f6", borderRadius: "6px" }}>
              {["progress", "comprehensive", "portfolio"].map((type) => (
                <button
                  key={type}
                  onClick={() => setReportType(type as "progress" | "comprehensive" | "portfolio")}
                  style={{
                    flex: 1,
                    padding: isMobile ? "6px 4px" : "8px 8px",
                    fontSize: "10px",
                    fontWeight: "500",
                    borderRadius: "4px",
                    border: "none",
                    cursor: "pointer",
                    backgroundColor:
                      reportType === type ? "white" : "transparent",
                    color:
                      reportType === type ? COLORS.primary : "#6b7280",
                    transition: "all 0.2s",
                  }}
                  title={
                    type === "comprehensive"
                      ? "Comprehensive"
                      : type === "progress"
                      ? "Progress"
                      : "Portfolio"
                  }
                >
                  {type === "comprehensive"
                    ? "Comp"
                    : type === "progress"
                    ? "Prog"
                    : "Port"}
                </button>
              ))}
            </div>
          </div>

          {/* Subject Selection Grid - Conditional (Only if child selected) */}
          {selectedChildren.length > 0 && (
            <div style={{ marginBottom: isMobile ? "8px" : "12px" }}>
              <label style={{ color: "#1a1a2e", fontSize: isMobile ? "11px" : "12px" }} className="font-semibold block mb-1">
                Subjects
              </label>
              {availableSubjects.length === 0 ? (
                <p style={{ color: "#555", fontSize: "11px", padding: "8px", backgroundColor: "#f9fafb", borderRadius: "4px" }}>
                  ⚠️ No subjects found. Log activities first.
                </p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: isMobile ? "6px" : "8px" }}>
                  {availableSubjects.map((subject) => (
                    <button
                      key={subject}
                      onClick={() => toggleSubjectSelection(subject)}
                      style={{
                        padding: isMobile ? "6px 8px" : "8px 10px",
                        fontSize: "10px",
                        fontWeight: "500",
                        borderRadius: "4px",
                        border: selectedSubjects.includes(subject)
                          ? "none"
                          : "1px solid #d1d5db",
                        backgroundColor: selectedSubjects.includes(subject)
                          ? SUBJECT_COLORS[subject] || "#9ca3af"
                          : "white",
                        color: selectedSubjects.includes(subject)
                          ? "white"
                          : "#1a1a2e",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                        minHeight: isMobile ? "28px" : "32px",
                      }}
                    >
                      <span>{SUBJECT_ICONS[subject] || "📝"}</span>
                      <span className="hidden sm:inline">{subject}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Generation Status - Conditional (Only during generation) */}
          {isGenerating && (
            <div
              style={{
                marginBottom: isMobile ? "8px" : "12px",
                padding: isMobile ? "8px" : "10px",
                backgroundColor: "#eff6ff",
                border: `1px solid #bfdbfe`,
                borderRadius: "6px",
              }}
            >
              <p style={{ color: "#1a1a2e", fontSize: "11px", fontWeight: "500", marginBottom: "6px" }}>
                📊 Generating ({generationTimeLeft}s)...
              </p>
              <div
                style={{
                  width: "100%",
                  backgroundColor: "#e5e7eb",
                  borderRadius: "9999px",
                  height: "6px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${((30 - generationTimeLeft) / 30) * 100}%`,
                    backgroundColor: COLORS.primary,
                    transition: "width 0.1s linear",
                    height: "100%",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* FIXED FOOTER - Download & Cancel */}
        <div
          style={{
            position: "sticky",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "white",
            borderTop: "1px solid #e5e7eb",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: isMobile ? "6px" : "8px",
            padding: isMobile ? "8px" : "10px",
            flexShrink: 0,
          }}
        >
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
                ? "#d1d5db"
                : COLORS.primary,
              color: "white",
              padding: isMobile ? "8px 10px" : "10px 12px",
              fontSize: isMobile ? "11px" : "12px",
              fontWeight: "600",
              borderRadius: "6px",
              border: "none",
              cursor: isGenerating || selectedChildren.length === 0 || selectedSubjects.length === 0
                ? "not-allowed"
                : "pointer",
              transition: "opacity 0.2s",
              opacity:
                isGenerating ||
                selectedChildren.length === 0 ||
                selectedSubjects.length === 0
                  ? 0.6
                  : 1,
            }}
            onMouseEnter={(e) => {
              if (!isGenerating && selectedChildren.length > 0 && selectedSubjects.length > 0) {
                e.currentTarget.style.opacity = "0.9";
              }
            }}
            onMouseLeave={(e) => {
              if (!isGenerating && selectedChildren.length > 0 && selectedSubjects.length > 0) {
                e.currentTarget.style.opacity = "1";
              }
            }}
          >
            {isGenerating ? `Gen... ${generationTimeLeft}s` : "📥 Download"}
          </button>
          <button
            onClick={onClose}
            disabled={isGenerating}
            style={{
              backgroundColor: "white",
              color: "#1a1a2e",
              padding: isMobile ? "8px 10px" : "10px 12px",
              fontSize: isMobile ? "11px" : "12px",
              fontWeight: "600",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              cursor: isGenerating ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              opacity: isGenerating ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isGenerating) {
                e.currentTarget.style.backgroundColor = "#f3f4f6";
              }
            }}
            onMouseLeave={(e) => {
              if (!isGenerating) {
                e.currentTarget.style.backgroundColor = "white";
              }
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
