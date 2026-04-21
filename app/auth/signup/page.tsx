"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/supabase-auth";

export const dynamic = "force-dynamic";

// Force redeploy: v2026-04-21-2252

export default function SignupPage() {
  useEffect(() => {
    addLog("✅ SignupPage mounted");
    
    // Catch unhandled errors
    const handleError = (event: ErrorEvent) => {
      addLog(`❌ Unhandled error: ${event.error}`);
    };
    
    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const router = useRouter();

  // Add debug log
  const addLog = (msg: string) => {
    console.log(msg);
    setDebugLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`].slice(-10)); // Keep last 10
  };

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    addLog(`🔘 Button clicked: ${email}`);
    setError("");

    if (!email.trim()) {
      const msg = "Email is required";
      addLog(`❌ ${msg}`);
      setError(msg);
      return;
    }

    if (password !== confirmPassword) {
      const msg = "Passwords don't match";
      addLog(`❌ ${msg}`);
      setError(msg);
      return;
    }

    if (password.length < 6) {
      const msg = "Password must be at least 6 characters";
      addLog(`❌ ${msg}`);
      setError(msg);
      return;
    }

    addLog("⏳ Calling signUp...");
    setLoading(true);

    try {
      const result = await signUp(email, password);
      addLog(`📨 Signup result: ${result.success ? "SUCCESS" : "FAILED"}`);

      if (!result.success) {
        const errorMsg = result.error || "Signup failed";
        addLog(`❌ Error: ${errorMsg}`);
        setError(errorMsg);
        setLoading(false);
        return;
      }

      addLog(`✅ Account created: ${result.user?.id}`);
      setSuccess(true);
      setLoading(false);
      // Don't redirect - let user click the Sign In link manually
      addLog("→ Waiting for user to verify email and sign in");
    } catch (err: any) {
      addLog(`❌ Catch: ${err?.message || err}`);
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
      <main style={{ backgroundColor: "#1a1a2e" }} className="min-h-screen flex items-center justify-center p-4">
      <div
        style={{ backgroundColor: "white", borderRadius: "12px" }}
        className="p-8 w-full max-w-sm border border-gray-200 shadow-lg"
      >
        <div className="mb-8 pb-6" style={{ borderBottom: "1px solid #e5e7eb" }}>
          <h1 style={{ color: "#0066cc" }} className="text-2xl font-bold mb-4">
            kernlo
          </h1>
          <h2 style={{ color: "#1a1a2e" }} className="text-2xl font-bold mb-2">
            Get Started
          </h2>
          <p style={{ color: "#666" }} className="text-sm">
            Create your account
          </p>
        </div>

        {success && (
          <div
            style={{
              backgroundColor: "#e8f5e9",
              borderLeft: "4px solid #4caf50",
            }}
            className="p-4 rounded mb-6"
          >
            <p style={{ color: "#2e7d32" }} className="text-sm font-semibold">
              ✅ Account created! Check your email for verification link.
            </p>
            <p style={{ color: "#666" }} className="text-xs mt-2 mb-3">
              Click the verification link in your email, then sign in below.
            </p>
            <Link
              href="/auth/login"
              style={{ color: "white", backgroundColor: "#0066cc" }}
              className="block text-center px-3 py-2 rounded font-medium text-sm hover:opacity-90"
            >
              Go to Sign In
            </Link>
          </div>
        )}

        {loading && (
          <div
            style={{
              backgroundColor: "#e3f2fd",
              borderLeft: "4px solid #0066cc",
            }}
            className="p-4 rounded mb-6"
          >
            <p style={{ color: "#0066cc" }} className="text-sm font-semibold">
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
            className="p-4 rounded mb-6"
          >
            <p style={{ color: "#c62828" }} className="text-sm font-semibold">
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

        {!success && <div className="space-y-4 mb-6">
          <div>
            <label
              style={{ color: "#666" }}
              className="text-sm font-medium block mb-2"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              style={{ color: "#666" }}
              className="text-sm font-medium block mb-2"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              style={{ color: "#666" }}
              className="text-sm font-medium block mb-2"
            >
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ color: "#1a1a2e" }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={handleSignup}
            disabled={loading}
            style={{ backgroundColor: "#0066cc" }}
            className="w-full px-4 py-2 text-white font-medium rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </div>}

        {!success && <div style={{ borderTop: "1px solid #e5e7eb" }} className="pt-6 text-center">
          <p style={{ color: "#666" }} className="text-sm mb-2">
            Already have an account?
          </p>
          <Link
            href="/auth/login"
            style={{ color: "#0066cc" }}
            className="text-sm font-medium hover:underline"
          >
            Sign In
          </Link>
        </div>}

        {/* Debug Logs - visible on mobile */}
        {debugLogs.length > 0 && (
          <div
            style={{
              backgroundColor: "#f5f5f5",
              borderTop: "1px solid #e5e7eb",
              marginTop: "20px",
              paddingTop: "10px",
            }}
            className="text-xs"
          >
            <p style={{ color: "#666", marginBottom: "8px", fontWeight: "bold" }}>
              Debug Log:
            </p>
            {debugLogs.map((log, i) => (
              <p key={i} style={{ color: "#666", margin: "2px 0", fontFamily: "monospace" }}>
                {log}
              </p>
            ))}
          </div>
        )}
      </div>
    </main>
    </>
  );
}
