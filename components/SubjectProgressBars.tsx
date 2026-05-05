"use client";

import React from "react";
import {
  Calculator,
  Beaker,
  Book,
  Globe,
  Palette,
  Activity,
  Music2,
  PenTool,
  BookOpen,
  Pen,
  Star,
  BookMarked,
} from "lucide-react";

interface SubjectHours {
  subject: string;
  hours: number;
  target?: number;
}

interface SubjectProgressBarsProps {
  subjects: SubjectHours[];
  colorOverride?: { [key: string]: string };
}

const SUBJECT_COLORS: { [key: string]: string } = {
  Math: "#3b82f6",
  "Mathematics": "#3b82f6",
  Science: "#10b981",
  English: "#8b5cf6",
  History: "#f59e0b",
  "Social Studies": "#f59e0b",
  Art: "#ec4899",
  Arts: "#ec4899",
  "Physical Education": "#ef4444",
  PE: "#ef4444",
  Music: "#6366f1",
  "Language Arts": "#8b5cf6",
  "Reading": "#3b82f6",
  Writing: "#8b5cf6",
  Extracurricular: "#6366f1",
  Default: "#6b7280",
};

const SUBJECT_ICONS: { [key: string]: React.ComponentType<any> } = {
  Math: Calculator,
  "Mathematics": Calculator,
  Science: Beaker,
  English: Book,
  History: Globe,
  "Social Studies": Globe,
  Art: Palette,
  Arts: Palette,
  "Physical Education": Activity,
  PE: Activity,
  Music: Music2,
  "Language Arts": PenTool,
  "Reading": BookOpen,
  Writing: Pen,
  Extracurricular: Star,
  Default: BookMarked,
};

export default function SubjectProgressBars({
  subjects,
  colorOverride,
}: SubjectProgressBarsProps) {
  console.log("🔍 SubjectProgressBars: Rendering with data:", {
    subjectsLength: subjects?.length || 0,
    subjects: subjects,
    colorOverride: colorOverride,
  });

  if (!subjects || subjects.length === 0) {
    console.log("⚠️ SubjectProgressBars: No subjects provided, showing empty state");
    return (
      <p style={{ color: "#555" }} className="text-sm">
        No subjects logged yet
      </p>
    );
  }

  // RELATIVE ACTIVITY LEADERBOARD LOGIC
  // Find the maximum hours across all subjects
  const maxHours = Math.max(...subjects.map(s => s.hours), 0);
  
  // If max is 0, show empty state
  if (maxHours === 0) {
    return (
      <p style={{ color: "#555" }} className="text-sm">
        No activities logged yet
      </p>
    );
  }

  // Sort by hours descending
  const sortedSubjects = [...subjects].sort((a, b) => b.hours - a.hours);

  const getColor = (subject: string): string => {
    if (colorOverride && colorOverride[subject]) {
      return colorOverride[subject];
    }
    return SUBJECT_COLORS[subject] || SUBJECT_COLORS.Default;
  };

  const getIcon = (subject: string): React.ComponentType<any> => {
    return SUBJECT_ICONS[subject] || SUBJECT_ICONS.Default;
  };

  return (
    <div className="space-y-1.5">
      {sortedSubjects.map((item, idx) => {
        const IconComponent = getIcon(item.subject);
        const barColor = getColor(item.subject);
        // Calculate percentage relative to max hours
        const percentage = (item.hours / maxHours) * 100;
        
        // Format hours display
        const hoursDisplay = item.hours < 1 
          ? `${(item.hours).toFixed(1)}h` 
          : `${Math.round(item.hours * 10) / 10}h`;

        // Calculate bar width in a sensible container
        // We'll use a fixed container width for consistent display
        const containerWidthPx = 200; // Fixed width for consistent spacing
        const barWidthPx = (percentage / 100) * containerWidthPx;

        return (
          <div key={`${item.subject}-${idx}`} className="flex items-center gap-2">
            {/* Icon */}
            <div
              className="flex-shrink-0"
              style={{ color: barColor, width: "16px", height: "16px" }}
            >
              <IconComponent size={14} strokeWidth={2.5} />
            </div>

            {/* Subject Name */}
            <div className="flex-shrink-0 min-w-fit">
              <span
                style={{ color: "#1a1a2e" }}
                className="text-sm font-medium"
              >
                {item.subject}
              </span>
            </div>

            {/* Relative Activity Bar */}
            <div className="flex-1 flex items-center gap-2">
              <div
                style={{
                  backgroundColor: barColor,
                  height: "8px",
                  borderRadius: "4px",
                  width: `${percentage}%`,
                  minWidth: percentage > 0 ? "4px" : "0px",
                  transition: "width 0.3s ease",
                  maxWidth: "100%",
                }}
              />
              
              {/* Hours Display (right-aligned, just after bar) */}
              <div style={{ color: barColor }} className="flex-shrink-0 text-right">
                <span className="text-sm font-semibold">{hoursDisplay}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
