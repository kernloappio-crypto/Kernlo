"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/supabase-auth";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  useEffect(() => {
    // Log that page loaded
    console.log("SignupPage mounted");
    
    // Catch unhandled errors
    const handleError = (event: ErrorEvent) => {
      console.error("Unhandled error:", event.error);
    };
    
    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    console.log("handleSignup called", { email });
    setError("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    console.log("Loading set to true");

    try {
      console.log("Signup attempt:", { email, passwordLength: password.length });
      const result = await signUp(email, password);
      console.log("Signup result:", result);

      if (!result.success) {
        const errorMsg = result.error || "Signup failed";
        console.error("Signup failed:", errorMsg);
        setError(errorMsg);
        setLoading(false);
        // Keep form values visible for retry
        return;
      }

      console.log("Signup success, user created:", result.user?.id);
      alert("🎉 Welcome! Check your email to verify your account, then sign in.");
      // Redirect to login so they can sign in with verified account
      setTimeout(() => {
        router.push("/auth/login");
      }, 1000);
    } catch (err) {
      console.error("Signup catch error:", err);
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
        </div>

        <div style={{ borderTop: "1px solid #e5e7eb" }} className="pt-6 text-center">
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
        </div>
      </div>
    </main>
    </>
  );
}
