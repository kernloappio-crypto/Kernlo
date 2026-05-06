"use client";

interface ChildStatsBarProps {
  fieldTripCount: number;
  extracurricularCount: number;
  childName?: string;
}

const COLORS = {
  light: "#f0f7ff",
  dark: "#1a1a2e",
};

export default function ChildStatsBar({
  fieldTripCount,
  extracurricularCount,
  childName,
}: ChildStatsBarProps) {
  return (
    <div
      style={{
        backgroundColor: COLORS.light,
        padding: "12px 16px",
        borderRadius: "8px",
        marginBottom: "16px",
        display: "flex",
        alignItems: "center",
        gap: "24px",
        flexWrap: "wrap",
      }}
    >
      {childName && (
        <span style={{ color: COLORS.dark, fontSize: "13px", fontWeight: "600" }}>
          {childName}
        </span>
      )}
      <div style={{ display: "flex", gap: "24px", flex: 1, minWidth: "fit-content" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "16px" }}>🚌</span>
          <span style={{ color: COLORS.dark, fontSize: "13px", fontWeight: "500" }}>
            Field Trips: <strong>{fieldTripCount}</strong>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "16px" }}>🎭</span>
          <span style={{ color: COLORS.dark, fontSize: "13px", fontWeight: "500" }}>
            Extracurriculars: <strong>{extracurricularCount}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
