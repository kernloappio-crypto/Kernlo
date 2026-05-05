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

// Default targets per subject (in hours)
const DEFAULT_TARGETS: { [key: string]: number } = {
  Math: 240,
  "Mathematics": 240,
  Science: 120,
  English: 240,
  History: 120,
  "Social Studies": 120,
  Art: 60,
  Arts: 60,
  "Physical Education": 120,
  PE: 120,
  Music: 60,
  "Language Arts": 240,
  "Reading": 180,
  Writing: 120,
  Extracurricular: 100,
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

  const getColor = (subject: string): string => {
    if (colorOverride && colorOverride[subject]) {
      return colorOverride[subject];
    }
    return SUBJECT_COLORS[subject] || SUBJECT_COLORS.Default;
  };

  const getIcon = (subject: string): React.ComponentType<any> => {
    return SUBJECT_ICONS[subject] || SUBJECT_ICONS.Default;
  };

  const getTarget = (subject: string): number => {
    return DEFAULT_TARGETS[subject] || 100;
  };

  return (
    <div className="space-y-2">
      {subjects.map((item, idx) => {
        const IconComponent = getIcon(item.subject);
        const barColor = getColor(item.subject);
        const target = item.target || getTarget(item.subject);
        const percentage = Math.min(100, (item.hours / target) * 100);
        
        // Format hours display
        const hoursDisplay = item.hours < 1 
          ? `${(item.hours).toFixed(1)}h` 
          : `${Math.round(item.hours * 10) / 10}h`;

        return (
          <div key={`${item.subject}-${idx}`} className="flex items-center gap-3">
            {/* Icon */}
            <div
              className="flex-shrink-0"
              style={{ color: barColor, width: "20px", height: "20px" }}
            >
              <IconComponent size={16} strokeWidth={2.5} />
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

            {/* Progress Bar Container */}
            <div className="flex-1 flex items-center gap-3">
              <div
                style={{
                  backgroundColor: "#e5e7eb",
                  height: "8px",
                  borderRadius: "4px",
                  flex: 1,
                  overflow: "hidden",
                  minWidth: "80px",
                }}
              >
                <div
                  style={{
                    backgroundColor: barColor,
                    height: "100%",
                    borderRadius: "4px",
                    width: `${percentage}%`,
                    transition: "width 0.3s ease",
                  }}
                />
              </div>

              {/* Hours Display (right-aligned) */}
              <div style={{ color: barColor }} className="flex-shrink-0 text-right min-w-fit">
                <span className="text-sm font-semibold">{hoursDisplay}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
