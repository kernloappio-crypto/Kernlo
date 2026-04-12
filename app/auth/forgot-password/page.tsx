"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { sendPasswordResetEmail } from "@/lib/email-verification";

const COLORS = {
  primary: "#0066cc",
  dark: "#1a1a2e",
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Email is required");
      return;
    }

    setLoading(true);

    try {
      const users = JSON.parse(localStorage.getItem("users") || "{}");
      
      if (!users[email]) {
        setError("Email not found");
        setLoading(false);
        return;
      }

      // Send mock reset email
      sendPasswordResetEmail(email);
      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    } catch (err) {
      console.error("Reset error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div
        style={{ backgroundColor: "white", borderRadius: "12px" }}
        className="p-8 max-w-md w-full border border-gray-200"
      >
        <div className="mb-8">
          <h1 style={{ color: COLORS.dark }} className="text-3xl font-bold mb-2">
            Reset Password
          </h1>
          <p style={{ color: "#666" }} className="text-sm">
            Enter your email to receive a reset link
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: "#ffebee",
              borderLeft: "4px solid #ff6b6b",
            }}
            className="p-3 rounded mb-6"
          >
            <p style={{ color: "#c62828" }} className="text-sm">
              {error}
            </p>
          </div>
        )}

        {success && (
          <div
            style={{
              backgroundColor: "#e8f5e9",
              borderLeft: "4px solid #4caf50",
            }}
            className="p-3 rounded mb-6"
          >
            <p style={{ color: "#2e7d32" }} className="text-sm">
              ✓ Reset link sent! Check your email. Redirecting to login...
            </p>
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-4 mb-6">
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
              disabled={success}
              style={{ color: "#1a1a2e" }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            style={{ backgroundColor: COLORS.primary }}
            className="w-full px-4 py-2 text-white font-medium rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div style={{ borderTop: "1px solid #e5e7eb" }} className="pt-6 text-center">
          <p style={{ color: "#666" }} className="text-sm mb-2">
            Remember your password?
          </p>
          <Link
            href="/auth/login"
            style={{ color: COLORS.primary }}
            className="text-sm font-medium hover:underline"
          >
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
