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
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const router = useRouter();

  const addLog = (msg: string) => {
    console.log(msg);
    setDebugLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`].slice(-10));
  };

  async function handleLogin() {
    addLog("🔘 Sign In clicked");
    setError("");
    
    if (!email.trim()) {
      const msg = "Email is required";
      addLog(`❌ ${msg}`);
      setError(msg);
      return;
    }

    if (!password) {
      const msg = "Password is required";
      addLog(`❌ ${msg}`);
      setError(msg);
      return;
    }

    addLog("⏳ Calling signIn...");
    setLoading(true);

    if (!email || !password) {
      setError("Email and password required");
      return;
    }

    setLoading(true);

    try {
      const result = await signIn(email, password);
      addLog(`📨 Login result: ${result.success ? "SUCCESS" : "FAILED"}`);

      if (!result.success) {
        const errorMsg = result.error || "Login failed";
        addLog(`❌ Error: ${errorMsg}`);
        setLoading(false);
        setError(errorMsg);
        // Keep error visible - don't redirect
        return;
      }

      addLog("✅ Login successful!");
      // Session is automatically persisted by Supabase client to localStorage
      // Store fallback in sessionStorage for extra safety
      if (typeof window !== 'undefined' && result.session?.user?.id) {
        try {
          sessionStorage.setItem('kernlo_user_id', result.session.user.id);
          localStorage.setItem('kernlo_session_backup', JSON.stringify(result.session));
          addLog("💾 Session persisted to localStorage");
        } catch (e) {
          addLog("⚠️ Could not store backup session");
        }
      }
      addLog("→ Redirecting to dashboard...");
      setLoading(false);
      // Give session time to persist
      setTimeout(() => router.push("/dashboard"), 800);
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
            Sign In
          </h2>
          <p style={{ color: "#666" }} className="text-sm">
            Access your homeschool dashboard
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: "#ffebee",
              borderLeft: "4px solid #ff6b6b",
            }}
            className="p-4 rounded mb-6"
          >
            <p style={{ color: "#c62828" }} className="text-base font-bold mb-2">
              ❌ Sign In Failed
            </p>
            <p style={{ color: "#c62828" }} className="text-sm mb-4">
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
                border: "none"
              }}
              className="text-sm hover:opacity-90"
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
            className="p-4 rounded mb-6"
          >
            <p style={{ color: "#0066cc" }} className="text-sm font-semibold">
              ⏳ Signing in... Please wait.
            </p>
          </div>
        )}

        <div className="space-y-4 mb-6">
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

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            style={{ backgroundColor: "#0066cc" }}
            className="w-full px-4 py-2 text-white font-medium rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>

        {/* Debug Logs */}
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

        <div style={{ borderTop: "1px solid #e5e7eb" }} className="pt-6">
          <div className="text-center mb-4">
            <Link
              href="/auth/forgot-password"
              style={{ color: "#0066cc" }}
              className="text-sm font-medium hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="text-center">
            <p style={{ color: "#666" }} className="text-sm mb-2">
              Don't have an account?
            </p>
            <Link
              href="/auth/signup"
              style={{ color: "#0066cc" }}
              className="text-sm font-medium hover:underline"
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
