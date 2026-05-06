"use client";

import { useMemo } from "react";
import { useReport } from "@/context/ReportContext";

interface CombinedActivity {
  id: string;
  child_id: string;
  child_name: string;
  type: "Activity" | "Field Trip" | "Extracurricular";
  date: string;
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
    return {
      fieldTrips: group.fieldTripCount || 0,
      extracurriculars: group.extracurricularCount || 0,
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

  return (
    <div
      style={{
        backgroundColor: "#f9fafb",
        borderBottom: "2px solid #e5e7eb",
        padding: "16px",
        marginBottom: "16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "24px", flexWrap: "wrap" }}>
        {displayTotals.showFieldTrips && (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#666", fontSize: "12px", fontWeight: "500", marginBottom: "4px" }}>
              Field Trips
            </p>
            <p style={{ color: COLORS.primary, fontSize: "28px", fontWeight: "700" }}>
              {totals.fieldTrips}
            </p>
          </div>
        )}

        {displayTotals.showExtracurriculars && (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#666", fontSize: "12px", fontWeight: "500", marginBottom: "4px" }}>
              Extracurriculars
            </p>
            <p style={{ color: "#ec4899", fontSize: "28px", fontWeight: "700" }}>
              {totals.extracurriculars}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
