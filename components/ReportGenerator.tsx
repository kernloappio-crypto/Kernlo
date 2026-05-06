"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import { useReport } from "@/context/ReportContext";

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

interface ReportGeneratorProps {
  userId: string;
  kids: Kid[];
  activities: Activity[];
  isMobile: boolean;
  onRefresh: () => void;
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

const DATE_PRESETS = [
  { label: "7D", days: 7 },
  { label: "MTD", days: null, preset: "month" },
  { label: "Semester", days: null, preset: "semester" },
];

const STATE_CORE_SUBJECTS: { [key: string]: string[] } = {
  "TX": ["Reading", "Spelling", "Grammar", "Math", "Good Citizenship"],
  "CA": ["English", "Math", "Social Studies", "Science", "Physical Education"],
  "FL": ["English Language Arts", "Mathematics", "Science", "Social Studies"],
  "NY": ["English Language Arts", "Mathematics", "Science", "Social Studies"],
  "PA": ["Reading", "Mathematics", "Science", "Social Studies"],
  "default": ["English", "Math", "Science", "Social Studies", "Reading"],
};

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

export default function ReportGenerator({
  userId,
  kids,
  activities,
  isMobile,
  onRefresh,
}: ReportGeneratorProps) {
  const { selectedKid, setSelectedKid } = useReport();
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [reportType, setReportType] = useState<"progress" | "comprehensive" | "portfolio">("comprehensive");
  const [complianceMode, setComplianceMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [parentState, setParentState] = useState<string>("");

  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    setEndDate(today.toISOString().split("T")[0]);
    setStartDate(thirtyDaysAgo.toISOString().split("T")[0]);

    fetchParentState();
  }, []);

  // Sync selectedKid from context to selectedChildren when kid is selected in ledger
  useEffect(() => {
    if (selectedKid && !selectedChildren.includes(selectedKid)) {
      setSelectedChildren([selectedKid]);
    }
  }, [selectedKid]);

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
    // Also update the shared context
    if (selectedKid === kidId) {
      setSelectedKid(null);
    } else {
      setSelectedKid(kidId);
    }
  };

  const toggleSubjectSelection = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
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

    try {
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

      for (const kid of selectedKids) {
        const coreActivities = activities.filter(
          (a) =>
            a.child_name === kid.name &&
            new Date(a.date) >= new Date(startDate) &&
            new Date(a.date) <= new Date(endDate) &&
            selectedSubjects.includes(a.subject)
        );

        if (coreActivities.length === 0) {
          continue;
        }

        const coreSubjects = getCoreSubjectsForState();
        const subjectsToInclude = complianceMode
          ? selectedSubjects.filter((s) =>
              coreSubjects.some(cs => cs.toLowerCase() === s.toLowerCase())
            )
          : selectedSubjects;

        const relevantActivities = coreActivities.filter((a) =>
          subjectsToInclude.includes(a.subject)
        );

        if (complianceMode && relevantActivities.length === 0) {
          continue;
        }

        let activitySummary = "";
        if (relevantActivities.length > 0) {
          activitySummary += `CORE SUBJECTS (${relevantActivities.length} activities, ${(
            relevantActivities.reduce((sum, a) => sum + a.duration, 0) / 60
          ).toFixed(1)} hours):\n`;
          relevantActivities.forEach((a) => {
            activitySummary += `- ${a.date}: ${a.subject} (${a.duration}m via ${a.platform})\n`;
          });
          activitySummary += "\n";
        }

        const coreSubjectsStr = coreSubjects.join(", ");
        const prompt = `Generate a ${complianceMode ? "minimalist, professional homeschool compliance" : "comprehensive"} progress report for ${kid.name} covering ${startDate} to ${endDate}.

${
  complianceMode
    ? `Focus ONLY on core subjects: ${coreSubjectsStr}. Use a standardized format for ${parentState ? STATE_NAMES[parentState] : "your state"}'s compliance requirements.`
    : "Include accomplishments and skill development."
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

        const { jsPDF } = await import("jspdf");
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const marginLeft = 15;
        const marginRight = 15;
        const marginTop = 15;
        let yPosition = marginTop;

        let reportTitle = "COMPREHENSIVE PROGRESS REPORT";
        if (complianceMode) {
          const stateName = parentState && STATE_NAMES[parentState] ? STATE_NAMES[parentState] : "";
          reportTitle = stateName ? `${stateName.toUpperCase()} COMPLIANCE REPORT` : "COMPLIANCE REPORT";
        } else if (reportType === "progress") {
          reportTitle = "PROGRESS SUMMARY";
        } else if (reportType === "portfolio") {
          reportTitle = "PORTFOLIO & ACHIEVEMENTS";
        }

        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text(reportTitle, marginLeft, yPosition);
        yPosition += 10;

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text(`Student: ${kid.name}`, marginLeft, yPosition);
        yPosition += 6;
        doc.text(`Period: ${startDate} to ${endDate}`, marginLeft, yPosition);
        yPosition += 6;
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, marginLeft, yPosition);
        yPosition += 12;

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

        doc.save(`${kid.name}-report-${startDate}-${endDate}.pdf`);

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

            if (!error) {
              successCount++;
            }
          } catch (e) {
            console.error("Database insert exception:", e);
          }
        }
      }

      setIsGenerating(false);

      if (successCount > 0) {
        alert(`✅ Successfully generated ${successCount} report${successCount > 1 ? "s" : ""}!`);
      } else {
        alert(`⚠️ No reports generated. Check that selected children have activities logged.`);
      }
    } catch (error) {
      console.error("Error generating reports:", error);
      setIsGenerating(false);
      alert("Failed to generate reports. Please try again.");
    }
  };

  const availableSubjects = getAvailableSubjects();

  return (
    <div style={{ backgroundColor: "white", display: "flex", flexDirection: "column", height: "100%" }} className="p-4 sm:p-6">
      <h2 style={{ color: COLORS.dark }} className="text-lg sm:text-xl font-bold mb-4 sticky top-0 bg-white z-10">
        🛠️ Report Generator
      </h2>

      <div style={{ flex: 1, overflow: "y-auto" }} className="space-y-4">
        {/* Compliance Mode Toggle */}
        <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: COLORS.light }}>
          <input
            type="checkbox"
            id="compliance-mode"
            checked={complianceMode}
            onChange={(e) => setComplianceMode(e.target.checked)}
            className="w-5 h-5 rounded cursor-pointer"
          />
          <label htmlFor="compliance-mode" className="text-sm font-medium cursor-pointer" style={{ color: COLORS.dark }}>
            Compliance Mode
          </label>
        </div>

        {/* Date Range Selector - Compact */}
        <div>
          <label style={{ color: COLORS.dark }} className="block text-sm font-semibold mb-2">
            Date Range
          </label>
          <div className="flex gap-1 mb-2 flex-wrap">
            {DATE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => applyDatePreset(preset.days, preset.preset)}
                style={{
                  backgroundColor: COLORS.secondary,
                  color: "white",
                }}
                className="px-2 py-1 rounded text-xs font-medium hover:opacity-90"
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2 py-1 border rounded text-xs"
                style={{ borderColor: "#ccc" }}
              />
            </div>
            <div className="flex-1">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2 py-1 border rounded text-xs"
                style={{ borderColor: "#ccc" }}
              />
            </div>
          </div>
        </div>

        {/* Children Selection */}
        <div>
          <label style={{ color: COLORS.dark }} className="block text-sm font-semibold mb-2">
            Children
          </label>
          <div className="flex flex-wrap gap-2">
            {kids.map((kid) => (
              <button
                key={kid.id}
                onClick={() => toggleChildSelection(kid.id)}
                style={{
                  backgroundColor: selectedChildren.includes(kid.id) ? COLORS.primary : "white",
                  color: selectedChildren.includes(kid.id) ? "white" : COLORS.dark,
                  borderColor: COLORS.primary,
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
              >
                {kid.name}
              </button>
            ))}
          </div>
        </div>

        {/* Subject Selection - Icon Pills */}
        {availableSubjects.length > 0 && (
          <div>
            <label style={{ color: COLORS.dark }} className="block text-sm font-semibold mb-2">
              Subjects
            </label>
            <div className="flex flex-wrap gap-2">
              {availableSubjects.map((subject) => (
                <button
                  key={subject}
                  onClick={() => toggleSubjectSelection(subject)}
                  style={{
                    backgroundColor: selectedSubjects.includes(subject)
                      ? SUBJECT_COLORS[subject] || COLORS.secondary
                      : "white",
                    color: selectedSubjects.includes(subject) ? "white" : COLORS.dark,
                    borderColor: SUBJECT_COLORS[subject] || COLORS.secondary,
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all inline-flex items-center gap-1"
                >
                  <span>{SUBJECT_ICONS[subject] || "📝"}</span>
                  <span>{subject}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Report Type Selector - Icon-only buttons */}
        <div>
          <label style={{ color: COLORS.dark }} className="block text-sm font-semibold mb-2">
            Report Type
          </label>
          <div className="flex gap-2">
            {[
              { id: "progress", label: "📈 Progress", icon: "📈" },
              { id: "comprehensive", label: "📄 Comprehensive", icon: "📄" },
              { id: "portfolio", label: "🎯 Portfolio", icon: "🎯" },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setReportType(type.id as "progress" | "comprehensive" | "portfolio")}
                style={{
                  backgroundColor: reportType === type.id ? COLORS.primary : "white",
                  color: reportType === type.id ? "white" : COLORS.dark,
                  borderColor: COLORS.primary,
                }}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-all"
                title={type.label}
              >
                {type.icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Download Button - Sticky Bottom */}
      <button
        onClick={handleGenerateReport}
        disabled={isGenerating}
        style={{
          backgroundColor: isGenerating ? "#ccc" : COLORS.primary,
          color: "white",
        }}
        className="w-full px-4 py-3 rounded-lg font-semibold text-sm mt-4 hover:opacity-90 disabled:opacity-50 min-h-[44px] flex items-center justify-center"
      >
        {isGenerating ? "⏳ Generating..." : "⬇️ Download Reports"}
      </button>
    </div>
  );
}
