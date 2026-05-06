"use client";

interface ChildStatsBarProps {
  fieldTripCount: number;
  extracurricularCount: number;
  childName?: string;
  completedOnly?: boolean;
}

const COLORS = {
  light: "#f9fafb",
  dark: "#1a1a2e",
};

export default function ChildStatsBar({
  fieldTripCount,
  extracurricularCount,
  childName,
  completedOnly = true,
}: ChildStatsBarProps) {
  return (
    <div
      style={{
        backgroundColor: COLORS.light,
        padding: "10px 16px",
        borderRadius: "6px",
        marginBottom: "12px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        flexWrap: "wrap",
        fontSize: "13px",
      }}
    >
      {childName && (
        <span style={{ color: COLORS.dark, fontSize: "12px", fontWeight: "600" }}>
          {childName}
        </span>
      )}
      <div style={{ display: "flex", gap: "16px", flex: 1, minWidth: "fit-content" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ fontSize: "13px" }}>📍</span>
          <span style={{ color: COLORS.dark, fontSize: "12px", fontWeight: "500" }}>
            Field Trips: {fieldTripCount}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ fontSize: "13px" }}>🎯</span>
          <span style={{ color: COLORS.dark, fontSize: "12px", fontWeight: "500" }}>
            Extracurriculars: {extracurricularCount}
          </span>
        </div>
      </div>
    </div>
  );
}
