"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import ReportGenerator from "@/components/ReportGenerator";
import ActivityLedger from "@/components/ActivityLedger";

export const dynamic = "force-dynamic";

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

const COLORS = {
  primary: "#0066cc",
  secondary: "#00d4ff",
  accent1: "#ff6b6b",
  accent2: "#ffd93d",
  accent3: "#6bcf7f",
  dark: "#1a1a2e",
  light: "#f0f7ff",
};

export default function ReportsPage() {
  const [userId, setUserId] = useState("");
  const [kids, setKids] = useState<Kid[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<"generator" | "ledger">("generator");
  const [refreshCounter, setRefreshCounter] = useState(0);

  const router = useRouter();

  useEffect(() => {
    const initPage = async () => {
      try {
        let user = null;
        let accessToken = null;
        let fullSession = null;

        if (typeof window !== "undefined") {
          const sessionStr = localStorage.getItem("kernlo_session");
          if (sessionStr) {
            try {
              fullSession = JSON.parse(sessionStr);
              accessToken = fullSession.access_token;
              user = fullSession.user;
            } catch (e) {
              fullSession = null;
            }
          }

          if (!fullSession && !accessToken) {
            accessToken = localStorage.getItem("kernlo_access_token");
            if (accessToken) {
              try {
                const parts = accessToken.split(".");
                if (parts.length === 3) {
                  const decoded = JSON.parse(atob(parts[1]));
                  const now = Math.floor(Date.now() / 1000);
                  if (decoded.exp && decoded.exp < now) {
                    accessToken = null;
                  } else {
                    user = {
                      id: decoded.sub,
                      email: decoded.email,
                    };
                  }
                }
              } catch (e) {
                accessToken = null;
              }
            }
          }
        }

        if (!user || !accessToken) {
          router.push("/auth/login");
          return;
        }

        setUserId(user.id);

        try {
          const kidsResponse = await fetch("/api/kids", {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (kidsResponse.ok) {
            const { kids: kidsData } = await kidsResponse.json();
            setKids(kidsData || []);
          }
        } catch (e) {
          console.error("Failed to load kids:", e);
        }

        try {
          const activitiesResponse = await fetch("/api/activities?status=all", {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (activitiesResponse.ok) {
            const { activities: activitiesData } = await activitiesResponse.json();
            setActivities(activitiesData || []);
          }
        } catch (e) {
          console.error("Failed to load activities:", e);
        }

        setLoading(false);
      } catch (error: any) {
        console.error("Error initializing page:", error);
        router.push("/");
      }
    };

    initPage();
  }, [router]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: COLORS.light }}>
        <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px", maxWidth: "400px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <h2 style={{ color: COLORS.primary, marginBottom: "16px" }}>Loading Reports...</h2>
          <p style={{ color: "#999", fontSize: "11px", marginTop: "12px", textAlign: "center" }}>
            Please wait...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Navbar />

      {/* Header */}
      <div style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}>
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex items-center justify-between gap-4">
          <div>
            <h1 style={{ color: "#1a1a2e" }} className="text-lg sm:text-xl lg:text-2xl font-bold">
              📊 Reports & Activity Ledger
            </h1>
            <p style={{ color: "#666" }} className="text-xs sm:text-sm mt-1">
              Generate reports and view all logged activities
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Toggle */}
      {isMobile && (
        <div style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb", padding: "12px 16px" }} className="flex gap-2">
          <button
            onClick={() => setMobileView("generator")}
            style={{
              backgroundColor: mobileView === "generator" ? COLORS.primary : "white",
              color: mobileView === "generator" ? "white" : COLORS.primary,
              border: `2px solid ${COLORS.primary}`,
            }}
            className="flex-1 px-4 py-2 rounded-lg font-medium text-sm"
          >
            🛠️ Generator
          </button>
          <button
            onClick={() => setMobileView("ledger")}
            style={{
              backgroundColor: mobileView === "ledger" ? COLORS.primary : "white",
              color: mobileView === "ledger" ? "white" : COLORS.primary,
              border: `2px solid ${COLORS.primary}`,
            }}
            className="flex-1 px-4 py-2 rounded-lg font-medium text-sm"
          >
            📋 Ledger
          </button>
        </div>
      )}

      {/* Main Content */}
      <main style={{ backgroundColor: COLORS.light, flex: 1, display: "flex", overflow: "hidden" }} className="relative">
        {isMobile ? (
          // Mobile: Single view
          <div className="w-full overflow-y-auto">
            {mobileView === "generator" ? (
              <ReportGenerator userId={userId} kids={kids} activities={activities} isMobile={true} onRefresh={() => setRefreshCounter(c => c + 1)} />
            ) : (
              <ActivityLedger userId={userId} kids={kids} activities={activities} isMobile={true} refreshCounter={refreshCounter} onActivityEdited={() => setRefreshCounter(c => c + 1)} />
            )}
          </div>
        ) : (
          // Desktop: Two-pane layout
          <div className="flex w-full h-full overflow-hidden">
            {/* Left Pane: Report Generator (40%) */}
            <div style={{ flex: "0 0 40%", borderRight: "1px solid #e5e7eb", overflowY: "auto" }} className="overflow-y-auto">
              <ReportGenerator userId={userId} kids={kids} activities={activities} isMobile={false} onRefresh={() => setRefreshCounter(c => c + 1)} />
            </div>

            {/* Right Pane: Activity Ledger (60%) */}
            <div style={{ flex: "1 1 60%", overflowY: "auto" }} className="overflow-y-auto">
              <ActivityLedger userId={userId} kids={kids} activities={activities} isMobile={false} refreshCounter={refreshCounter} onActivityEdited={() => setRefreshCounter(c => c + 1)} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
