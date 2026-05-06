"use client";

import { useReport } from "@/context/ReportContext";

interface Kid {
  id: string;
  name: string;
}

interface KidFilterButtonsProps {
  kids: Kid[];
}

const COLORS = {
  primary: "#0066cc",
  dark: "#1a1a2e",
  light: "#f0f7ff",
};

export default function KidFilterButtons({ kids }: KidFilterButtonsProps) {
  const { selectedKid, setSelectedKid } = useReport();

  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", paddingBottom: "12px" }}>
      {kids.map((kid) => {
        const isActive = selectedKid === kid.id;
        return (
          <button
            key={kid.id}
            onClick={() => setSelectedKid(isActive ? null : kid.id)}
            style={{
              backgroundColor: isActive ? COLORS.primary : "white",
              color: isActive ? "white" : COLORS.dark,
              borderColor: COLORS.primary,
              borderWidth: "2px",
              padding: "8px 14px",
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              opacity: isActive ? 1 : 0.6,
            }}
            className="hover:opacity-100"
            title={`Filter by ${kid.name}`}
          >
            {kid.name}
          </button>
        );
      })}
    </div>
  );
}
