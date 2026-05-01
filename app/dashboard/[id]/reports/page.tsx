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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getReportTitle = (report: GeneratedReport) => {
    const startDate = new Date(report.start_date);
    const endDate = new Date(report.end_date);

    const startMonth = startDate.toLocaleDateString("en-US", { month: "short" });
    const endMonth = endDate.toLocaleDateString("en-US", { month: "short" });
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const year = endDate.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}-${endDay}, ${year} Comprehensive Report`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year} Comprehensive Report`;
    }
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
            <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
              {/* Reports List */}
              <div className="divide-y divide-gray-200">
                {reports.map((report, index) => (
                  <div
                    key={report.id}
                    style={{
                      backgroundColor: index % 2 === 0 ? "white" : "#fafafa",
                    }}
                    className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 style={{ color: COLORS.dark }} className="font-semibold text-base sm:text-lg mb-2">
                        {getReportTitle(report)}
                      </h3>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                        <span style={{ color: "#666" }} className="text-xs sm:text-sm">
                          Generated: {formatDate(report.date_generated)}
                        </span>
                        {report.selected_subjects && Array.isArray(report.selected_subjects) && report.selected_subjects.length > 0 && (
                          <span style={{ color: "#999" }} className="text-xs">
                            {report.selected_subjects.length} subject{report.selected_subjects.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>

                    <a
                      href={`/api/download-report/${report.id}`}
                      download={`${report.child_name}-report-${report.start_date}-${report.end_date}.pdf`}
                      style={{
                        backgroundColor: COLORS.primary,
                      }}
                      className="px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 flex-shrink-0 text-center min-w-32"
                    >
                      📥 Download
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
