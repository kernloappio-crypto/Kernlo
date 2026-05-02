"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import Navbar from "@/components/Navbar";

export const dynamic = "force-dynamic";

interface GeneratedReport {
  id: string;
  child_name: string;
  date_range: string;
  date_generated: string;
  report_type: string;
  start_date: string;
  end_date: string;
  selected_subjects?: string[];
  selected_activity_types?: string[];
  file_url?: string;
}

interface Kid {
  id: string;
  name: string;
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
  const params = useParams();
  const router = useRouter();
  const kidId = params.id as string;

  const [userId, setUserId] = useState("");
  const [kid, setKid] = useState<Kid | null>(null);
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeUser = async () => {
      try {
        // Restore auth context
        const sessionStr = localStorage.getItem("kernlo_session");
        if (sessionStr) {
          try {
            const session = JSON.parse(sessionStr);
            await supabase.auth.setSession(session);
          } catch (e) {
            console.log("Could not restore session");
          }
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/auth/login");
          return;
        }

        setUserId(user.id);

        // Load kid data
        const { data: kidData } = await supabase
          .from("kids")
          .select("*")
          .eq("id", kidId)
          .eq("user_id", user.id)
          .single();

        if (kidData) {
          setKid(kidData as Kid);
        }

        // Load generated reports
        try {
          const { data: reportsData, error } = await supabase
            .from("generated_reports")
            .select("*")
            .eq("user_id", user.id)
            .eq("kid_id", kidId)
            .order("date_generated", { ascending: false });

          if (error) {
            console.error("Error loading reports:", error);
            setReports([]);
          } else {
            setReports((reportsData as GeneratedReport[]) || []);
          }
        } catch (err) {
          console.error("Error loading reports:", err);
          setReports([]);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error initializing:", err);
        setLoading(false);
      }
    };

    initializeUser();
  }, [kidId, router]);



  const formatDateRange = (report: GeneratedReport) => {
    const startDate = new Date(report.start_date);
    const endDate = new Date(report.end_date);
    const startMonth = startDate.toLocaleDateString("en-US", { month: "short" });
    const endMonth = endDate.toLocaleDateString("en-US", { month: "short" });
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const year = endDate.getFullYear();

    return startMonth === endMonth
      ? `${startMonth} ${startDay}-${endDay}, ${year}`
      : `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  };

  const formatGeneratedTime = (report: GeneratedReport) => {
    const genDate = new Date(report.date_generated);
    const genMonth = genDate.toLocaleDateString("en-US", { month: "short" });
    const genDay = genDate.getDate();
    const genTime = genDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `Generated: ${genMonth} ${genDay} @ ${genTime}`;
  };

  const formatLine1 = (report: GeneratedReport) => {
    return `${formatDateRange(report)} | ${formatGeneratedTime(report)}`;
  };

  const formatLine2 = (report: GeneratedReport) => {
    const parts: string[] = [];

    if (
      report.selected_subjects &&
      Array.isArray(report.selected_subjects) &&
      report.selected_subjects.length > 0
    ) {
      parts.push(`Subjects: ${report.selected_subjects.join(", ")}`);
    }

    if (
      report.selected_activity_types &&
      Array.isArray(report.selected_activity_types) &&
      report.selected_activity_types.length > 0
    ) {
      parts.push(`Types: ${report.selected_activity_types.join(", ")}`);
    }

    return parts.join(" | ");
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main style={{ backgroundColor: COLORS.light, minHeight: "100vh" }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            <p>Loading reports...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main style={{ backgroundColor: COLORS.light, minHeight: "100vh" }}>
        {/* Header */}
        <div
          style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb" }}
          className="sticky top-0 z-40"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
            <div>
              <Link
                href={`/dashboard/${kidId}`}
                style={{ color: COLORS.primary }}
                className="text-sm font-medium mb-2 block"
              >
                ← Back to {kid?.name || "Dashboard"}
              </Link>
              <h1 style={{ color: COLORS.dark }} className="text-2xl font-bold">
                📊 Reports
              </h1>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          {reports.length === 0 ? (
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
              }}
              className="p-8 text-center"
            >
              <p style={{ color: "#666" }} className="text-lg mb-4">
                No reports generated yet.
              </p>
              <p style={{ color: "#999" }} className="text-sm">
                Go back to the dashboard and generate a comprehensive report to see it here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  style={{
                    backgroundColor: "white",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    paddingLeft: "1.5rem",
                    paddingRight: "1.5rem",
                    paddingTop: "1rem",
                    paddingBottom: "1rem",
                  }}
                  className="hover:shadow-sm transition-shadow"
                >
                  {/* Line 1: Date Range | Generated Date/Time */}
                  <p style={{ color: "#333", fontSize: "0.95rem", fontWeight: "500", lineHeight: "1.4" }}>
                    {formatLine1(report)}
                  </p>
                  
                  {/* Line 2: Subjects | Types */}
                  <p style={{ color: "#666", fontSize: "0.875rem", lineHeight: "1.4", marginTop: "0.25rem" }}>
                    {formatLine2(report)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
