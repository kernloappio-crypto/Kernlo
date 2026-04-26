"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/supabase-auth";

export const dynamic = "force-dynamic";

// Force redeploy: v2026-04-21-2252

export default function SignupPage() {
  useEffect(() => {
    console.log("✅ SignupPage mounted");
    
    // Catch unhandled errors
    const handleError = (event: ErrorEvent) => {
      console.log(`❌ Unhandled error: ${event.error}`);
    };
    
    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    console.log(`🔘 Button clicked: ${email}`);
    setError("");

    if (!email.trim()) {
      const msg = "Email is required";
      console.log(`❌ ${msg}`);
      setError(msg);
      return;
    }

    if (password !== confirmPassword) {
      const msg = "Passwords don't match";
      console.log(`❌ ${msg}`);
      setError(msg);
      return;
    }

    if (password.length < 6) {
      const msg = "Password must be at least 6 characters";
      console.log(`❌ ${msg}`);
      setError(msg);
      return;
    }

    console.log("⏳ Calling signUp...");
    setLoading(true);

    try {
      const result = await signUp(email, password);
      console.log(`📨 Signup result: ${result.success ? "SUCCESS" : "FAILED"}`);

      if (!result.success) {
        const errorMsg = result.error || "Signup failed";
        console.log(`❌ Error: ${errorMsg}`);
        setError(errorMsg);
        setLoading(false);
        return;
      }

      console.log(`✅ Account created: ${result.user?.id}`);
      setSuccess(true);
      setLoading(false);
      // Don't redirect - let user click the Sign In link manually
      console.log("→ Waiting for user to verify email and sign in");
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
              Get Started
            </h2>
            <p style={{ color: "#666" }} className="text-xs sm:text-sm">
              Create your account
            </p>
          </div>

          {success && (
            <div
              style={{
                backgroundColor: "#e8f5e9",
                borderLeft: "4px solid #4caf50",
              }}
              className="p-4 sm:p-6 rounded mb-6 text-center"
            >
              <p style={{ color: "#2e7d32" }} className="text-sm sm:text-lg font-bold mb-2">
                ✅ Account Created!
              </p>
              <p style={{ color: "#666" }} className="text-xs sm:text-sm mb-4">
                Check your email for a verification link. Click it to confirm your account.
              </p>
              <p style={{ color: "#666" }} className="text-xs sm:text-sm mb-4 sm:mb-6">
                Once verified, come back here and sign in:
              </p>
              <Link
                href="/auth/login"
                style={{ 
                  color: "white", 
                  backgroundColor: "#0066cc",
                  display: "block",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  textDecoration: "none",
                  fontSize: "0.875rem"
                }}
                className="hover:opacity-90"
              >
                → Sign In Now
              </Link>
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
                ⏳ Creating account... Please wait.
              </p>
            </div>
          )}

          {error && (
            <div
              style={{
                backgroundColor: "#ffebee",
                borderLeft: "4px solid #ff6b6b",
              }}
              className="p-3 sm:p-4 rounded mb-6"
            >
              <p style={{ color: "#c62828" }} className="text-xs sm:text-sm font-semibold">
                ❌ Error: {error}
              </p>
              <p style={{ color: "#999" }} className="text-xs mt-2">
                Try a different email or check your internet connection.
              </p>
              <button
                onClick={() => setError("")}
                style={{ color: "#0066cc" }}
                className="text-xs font-medium mt-3 hover:underline"
              >
                Dismiss & Try Again
              </button>
            </div>
          )}

          {!success && <div className="space-y-3 sm:space-y-4 mb-6">
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
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ color: "#1a1a2e" }}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  style={{ fontSize: "18px" }}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <div>
              <label
                style={{ color: "#666" }}
                className="text-xs sm:text-sm font-medium block mb-2"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ color: "#1a1a2e" }}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  style={{ fontSize: "18px" }}
                >
                  {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignup}
              disabled={loading}
              style={{ backgroundColor: "#0066cc" }}
              className="w-full px-4 py-2 text-white font-medium rounded-lg hover:opacity-90 transition disabled:opacity-50 text-sm sm:text-base"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </div>}

          {!success && <div style={{ borderTop: "1px solid #e5e7eb" }} className="pt-4 sm:pt-6 text-center">
            <p style={{ color: "#666" }} className="text-xs sm:text-sm mb-2">
              Already have an account?
            </p>
            <Link
              href="/auth/login"
              style={{ color: "#0066cc" }}
              className="text-xs sm:text-sm font-medium hover:underline"
            >
              Sign In
            </Link>
          </div>}


        </div>
      </main>
    </>
  );
}
