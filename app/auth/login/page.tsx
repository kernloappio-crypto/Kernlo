"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/supabase-auth";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin() {
    console.log("🔘 Sign In clicked");
    setError("");
    
    if (!email.trim()) {
      const msg = "Email is required";
      console.log(`❌ ${msg}`);
      setError(msg);
      return;
    }

    if (!password) {
      const msg = "Password is required";
      console.log(`❌ ${msg}`);
      setError(msg);
      return;
    }

    console.log("⏳ Calling signIn...");
    setLoading(true);

    if (!email || !password) {
      setError("Email and password required");
      return;
    }

    setLoading(true);

    try {
      const result = await signIn(email, password);
      console.log(`📨 Login result: ${result.success ? "SUCCESS" : "FAILED"}`);

      if (!result.success) {
        const errorMsg = result.error || "Login failed";
        console.log(`❌ Error: ${errorMsg}`);
        setLoading(false);
        setError(errorMsg);
        // Keep error visible - don't redirect
        return;
      }

      console.log("✅ Login successful!");
      // Tokens already stored to localStorage by signIn()
      console.log("🔑 JWT tokens stored to localStorage");
      console.log("→ Redirecting to dashboard...");
      setLoading(false);
      // Give localStorage time to persist
      setTimeout(() => router.push("/dashboard"), 300);
    } catch (err: any) {
      console.log(`❌ Catch: ${err?.message || err}`);
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        body { background-color: #1a1a2e !important; }
        div[class*="bg-gradient"] { background: #1a1a2e !important; }
        div[class*="from-slate"] { background: #1a1a2e !important; }
      `}</style>
      <main style={{ backgroundColor: "#1a1a2e" }} className="min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div
          style={{ backgroundColor: "white", borderRadius: "12px" }}
          className="p-6 sm:p-8 w-full max-w-sm border border-gray-200 shadow-lg"
        >
          <div className="mb-6 sm:mb-8 pb-4 sm:pb-6" style={{ borderBottom: "1px solid #e5e7eb" }}>
            <h1 style={{ color: "#0066cc" }} className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
              kernlo
            </h1>
            <h2 style={{ color: "#1a1a2e" }} className="text-xl sm:text-2xl font-bold mb-2">
              Sign In
            </h2>
            <p style={{ color: "#666" }} className="text-xs sm:text-sm">
              Access your homeschool dashboard
            </p>
          </div>

          {error && (
            <div
              style={{
                backgroundColor: "#ffebee",
                borderLeft: "4px solid #ff6b6b",
              }}
              className="p-3 sm:p-4 rounded mb-6"
            >
              <p style={{ color: "#c62828" }} className="text-sm sm:text-base font-bold mb-2">
                ❌ Sign In Failed
              </p>
              <p style={{ color: "#c62828" }} className="text-xs sm:text-sm mb-3 sm:mb-4">
                {error}
              </p>
              <p style={{ color: "#999" }} className="text-xs mb-3">
                Check your email and password, then try again.
              </p>
              <button
                onClick={() => setError("")}
                style={{ 
                  color: "white", 
                  backgroundColor: "#0066cc",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  fontWeight: "600",
                  border: "none",
                  fontSize: "0.875rem"
                }}
                className="hover:opacity-90"
              >
                Try Again
              </button>
            </div>
          )}

          {loading && (
            <div
              style={{
                backgroundColor: "#e3f2fd",
                borderLeft: "4px solid #0066cc",
              }}
              className="p-3 sm:p-4 rounded mb-6"
            >
              <p style={{ color: "#0066cc" }} className="text-xs sm:text-sm font-semibold">
                ⏳ Signing in... Please wait.
              </p>
            </div>
          )}

          <div className="space-y-3 sm:space-y-4 mb-6">
            <div>
              <label
                style={{ color: "#666" }}
                className="text-xs sm:text-sm font-medium block mb-2"
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{ color: "#1a1a2e" }}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                style={{ color: "#666" }}
                className="text-xs sm:text-sm font-medium block mb-2"
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ color: "#1a1a2e" }}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              style={{ backgroundColor: "#0066cc" }}
              className="w-full px-4 py-2 text-white font-medium rounded-lg hover:opacity-90 transition disabled:opacity-50 text-sm sm:text-base"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>



          <div style={{ borderTop: "1px solid #e5e7eb" }} className="pt-4 sm:pt-6">
            <div className="text-center mb-4">
              <Link
                href="/auth/forgot-password"
                style={{ color: "#0066cc" }}
                className="text-xs sm:text-sm font-medium hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="text-center">
              <p style={{ color: "#666" }} className="text-xs sm:text-sm mb-2">
                Don't have an account?
              </p>
              <Link
                href="/auth/signup"
                style={{ color: "#0066cc" }}
                className="text-xs sm:text-sm font-medium hover:underline"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
