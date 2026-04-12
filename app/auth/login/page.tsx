"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Simple localStorage auth
      const users = JSON.parse(localStorage.getItem("users") || "{}");

      const user = users[email];
      if (!user || user.password !== password) {
        setError("Invalid email or password");
        return;
      }

      // Set session
      const token = "token_" + btoa(email);
      localStorage.setItem("auth_token", token);
      localStorage.setItem("user_email", email);
      localStorage.setItem("user_id", email);

      router.push("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
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
          <h1 style={{ color: "#1a1a2e" }} className="text-3xl font-bold mb-2">
            Welcome Back
          </h1>
          <p style={{ color: "#666" }} className="text-sm">
            Log in to your account
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

        <form onSubmit={handleLogin} className="space-y-4 mb-6">
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
            type="submit"
            disabled={loading}
            style={{ backgroundColor: "#0066cc" }}
            className="w-full px-4 py-2 text-white font-medium rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

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
  );
}
