"use client";

import { useMemo } from "react";
import { useReport } from "@/context/ReportContext";

interface CombinedActivity {
  id: string;
  child_id: string;
  child_name: string;
  type: "Activity" | "Field Trip" | "Extracurricular";
  date: string;
  status?: string;
  [key: string]: any;
}

interface GroupedActivities {
  [childId: string]: {
    activities: CombinedActivity[];
    fieldTripCount: number;
    extracurricularCount: number;
  };
}

interface TotalsCounterProps {
  groupedActivities: GroupedActivities;
  ledgerTab: "all" | "field-trips" | "extracurricular";
}

const COLORS = {
  primary: "#0066cc",
  dark: "#1a1a2e",
};

export default function TotalsCounter({ groupedActivities, ledgerTab }: TotalsCounterProps) {
  const { selectedKid } = useReport();

  const totals = useMemo(() => {
    if (!selectedKid || !groupedActivities[selectedKid]) {
      return { fieldTrips: 0, extracurriculars: 0 };
    }

    const group = groupedActivities[selectedKid];
    // COMPLETED ACTIVITIES ONLY (Texas Compliance)
    const completedActivities = group.activities.filter(
      a => a.status === "completed" || a.status === "marked_complete"
    );

    const completedFieldTrips = completedActivities.filter(a => a.type === "Field Trip").length;
    const completedExtracurriculars = completedActivities.filter(a => a.type === "Extracurricular").length;

    return {
      fieldTrips: completedFieldTrips,
      extracurriculars: completedExtracurriculars,
    };
  }, [selectedKid, groupedActivities]);

  const displayTotals = useMemo(() => {
    if (ledgerTab === "field-trips") {
      return { showFieldTrips: true, showExtracurriculars: false };
    } else if (ledgerTab === "extracurricular") {
      return { showFieldTrips: false, showExtracurriculars: true };
    } else {
      return { showFieldTrips: true, showExtracurriculars: true };
    }
  }, [ledgerTab]);

  if (!selectedKid) {
    return null;
  }

  // Hide if counts are zero (no redundant counters)
  if (totals.fieldTrips === 0 && totals.extracurriculars === 0) {
    return null;
  }

  return (
    <div
      style={{
        backgroundColor: "#f5f5f5",
        borderBottom: "1px solid #e5e7eb",
        padding: "12px 16px",
        marginBottom: "12px",
        borderRadius: "6px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "20px", flexWrap: "wrap" }}>
        {displayTotals.showFieldTrips && totals.fieldTrips > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "14px" }}>📍</span>
            <span style={{ color: COLORS.dark, fontSize: "13px", fontWeight: "500" }}>
              Field Trips: <strong>{totals.fieldTrips}</strong>
            </span>
          </div>
        )}

        {displayTotals.showExtracurriculars && totals.extracurriculars > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "14px" }}>🎯</span>
            <span style={{ color: COLORS.dark, fontSize: "13px", fontWeight: "500" }}>
              Extracurriculars: <strong>{totals.extracurriculars}</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
