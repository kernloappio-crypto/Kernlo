"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import Navbar from "@/components/Navbar";
import MonthCalendar from "@/components/MonthCalendar";

export const dynamic = "force-dynamic";

interface Kid {
  id: string;
  name: string;
  age?: number;
  grade?: string;
}

interface ParentProfile {
  id?: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

const COLORS = {
  primary: "#0066cc",
  secondary: "#00d4ff",
  dark: "#1a1a2e",
  light: "#f0f7ff",
};

export default function ParentCalendarPage() {
  const [userId, setUserId] = useState("");
  const [kids, setKids] = useState<Kid[]>([]);
  const [loading, setLoading] = useState(true);
  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null);
  const router = useRouter();

  useEffect(() => {
    const initUser = async () => {
      try {
        console.log("📅 Parent Calendar loading...");
        
        let user = null;
        let accessToken = null;
        let fullSession = null;
        
        // Source of truth: Check for full session first, fall back to tokens
        if (typeof window !== 'undefined') {
          // Try to load full session first
          const sessionStr = localStorage.getItem('kernlo_session');
          if (sessionStr) {
            try {
              fullSession = JSON.parse(sessionStr);
              accessToken = fullSession.access_token;
              user = fullSession.user;
              console.log(`✅ Full session found in localStorage`);
            } catch (e) {
              console.log(`⚠️ Could not parse stored session`);
              fullSession = null;
            }
          }
          
          // Fallback: Use JWT token if no full session
          if (!fullSession && !accessToken) {
            accessToken = localStorage.getItem('kernlo_access_token');
            if (accessToken) {
              console.log(`🔑 JWT access token found (no session)`);
              
              // Decode JWT to extract user info
              try {
                const parts = accessToken.split('.');
                if (parts.length === 3) {
                  const decoded = JSON.parse(atob(parts[1]));
                  
                  // Check if token is expired
                  const now = Math.floor(Date.now() / 1000);
                  if (decoded.exp && decoded.exp < now) {
                    console.log(`⚠️ Token expired`);
                    accessToken = null;
                  } else {
                    user = {
                      id: decoded.sub,
                      email: decoded.email,
                    };
                    console.log(`✅ User from JWT: ${user.id}`);
                  }
                }
              } catch (e) {
                console.log(`⚠️ Failed to decode token`);
                accessToken = null;
              }
            }
          }
        }
        
        if (!user || !accessToken) {
          console.log("❌ Not authenticated");
          console.log("→ Redirecting to login");
          await new Promise(resolve => setTimeout(resolve, 1000));
          router.push("/auth/login");
          return;
        }
        
        // CRITICAL: Restore Supabase auth context
        try {
          console.log("🔑 Restoring auth context...");
          
          let setSessionData: any = null;
          let setSessionError: any = null;
          
          if (fullSession) {
            // Use the full session object if available
            console.log("📦 Using full session object");
            const result = await supabase.auth.setSession(fullSession);
            setSessionData = result.data;
            setSessionError = result.error;
          } else {
            // Fallback: construct session from tokens
            console.log("🔑 Using tokens to construct session");
            const result = await supabase.auth.setSession({
              access_token: accessToken!,
              refresh_token: localStorage.getItem('kernlo_refresh_token') || '',
            });
            setSessionData = result.data;
            setSessionError = result.error;
          }
          
          if (setSessionError) {
            console.log(`⚠️ setSession error: ${setSessionError.message}`);
          } else if (setSessionData?.session) {
            console.log(`✅ Auth context restored, user: ${setSessionData.session.user?.id}`);
          } else {
            console.log(`⚠️ setSession returned no data`);
          }
          
          // Give Supabase a moment to register the auth context
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (e: any) {
          console.log(`⚠️ Could not restore auth context: ${e?.message}`);
          // Continue anyway - we have the token
        }
        
        setUserId(user.id);

        try {
          console.log("📚 Loading kids...");
          const kidsResponse = await fetch('/api/kids', {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });

          if (!kidsResponse.ok) {
            const errorData = await kidsResponse.json();
            console.log(`❌ Kids error: ${errorData.error}`);
            throw new Error(errorData.error || 'Kids query failed');
          }

          const { kids: kidsData } = await kidsResponse.json();
          
          console.log(`✅ Kids: ${kidsData?.length || 0}`);
          if (kidsData) {
            setKids(kidsData);
          }
        } catch (e: any) {
          console.log(`❌ Kids failed: ${e?.message}`);
          throw e;
        }

        // Load parent profile
        try {
          console.log("👤 Loading parent profile...");
          const { data: profileData, error: profileError } = await supabase
            .from("parent_profiles")
            .select("*")
            .eq("user_id", user.id)
            .single();

          if (profileError && profileError.code !== "PGRST116") {
            console.log(`⚠️ Profile error: ${profileError.message}`);
          } else if (profileData) {
            console.log(`✅ Parent profile loaded: ${profileData.first_name} ${profileData.last_name}`);
            setParentProfile(profileData);
          }
        } catch (e: any) {
          console.log(`⚠️ Could not load parent profile: ${e?.message}`);
        }

        console.log("🎉 Parent Calendar ready!");
        setLoading(false);
      } catch (error: any) {
        const errorMsg = error?.message || JSON.stringify(error) || "Unknown error";
        console.log(`❌ CRASH: ${errorMsg}`);
        console.error("Error initializing user:", error);
        console.log("⏳ Redirecting to dashboard in 3s...");
        setTimeout(() => router.push("/dashboard"), 3000);
      }
    };

    initUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#f0f7ff" }}>
        <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px", maxWidth: "400px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <h2 style={{ color: "#0066cc", marginBottom: "16px" }}>Loading Calendar...</h2>
          <p style={{ color: "#999", fontSize: "11px", marginTop: "12px", textAlign: "center" }}>
            Please wait...
          </p>
        </div>
      </div>
    );
  }

  if (kids.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        <Navbar />
        <main style={{ backgroundColor: COLORS.light, flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }} className="p-4">
          <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "32px", maxWidth: "500px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <h2 style={{ color: COLORS.dark, marginBottom: "12px" }} className="text-lg sm:text-xl font-bold">
              No Kids Added Yet
            </h2>
            <p style={{ color: "#555", marginBottom: "24px" }} className="text-sm">
              Add a kid to your dashboard to see their calendar activities.
            </p>
            <Link
              href="/dashboard"
              style={{ backgroundColor: COLORS.primary }}
              className="inline-block px-6 py-2.5 text-white rounded-lg hover:opacity-90 font-medium text-sm"
            >
              Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Navbar />

      {/* Header */}
      <div style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}>
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 style={{ color: COLORS.dark }} className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
              📅 Family Calendar
            </h1>
            <p style={{ color: "#333" }} className="text-xs sm:text-sm mt-1">
              All {kids.length} kid{kids.length > 1 ? "s'" : "'s"} activities aggregated
            </p>
          </div>
          <Link
            href="/dashboard"
            style={{ color: COLORS.primary, borderColor: COLORS.primary }}
            className="px-4 sm:px-6 py-2 border rounded-lg hover:bg-gray-50 font-medium text-xs sm:text-sm whitespace-nowrap"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Calendar */}
      <main style={{ backgroundColor: COLORS.light, flex: 1, display: "flex", overflow: "hidden" }} className="relative">
        <div className="w-full overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 w-full">
            <MonthCalendar userId={userId} kids={kids} />
          </div>
        </div>
      </main>
    </div>
  );
}
