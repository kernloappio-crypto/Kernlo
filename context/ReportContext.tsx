"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface ReportContextType {
  selectedKid: string | null;
  setSelectedKid: (kidId: string | null) => void;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export function ReportProvider({ children }: { children: ReactNode }) {
  const [selectedKid, setSelectedKid] = useState<string | null>(null);

  return (
    <ReportContext.Provider value={{ selectedKid, setSelectedKid }}>
      {children}
    </ReportContext.Provider>
  );
}

export function useReport() {
  const context = useContext(ReportContext);
  if (context === undefined) {
    throw new Error("useReport must be used within ReportProvider");
  }
  return context;
}
