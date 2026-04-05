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
      // Simple localStorage auth (MVP only)
      const users = JSON.parse(localStorage.getItem("users") || "{}");

      const user = users[email];
      if (!user || user.password !== password) {
        setError("Invalid email or password");
        return;
      }

      // Set session
      localStorage.setItem("auth_token", "token_" + btoa(email));
      localStorage.setItem("user_id", email);
      localStorage.setItem("user_email", email);

      router.push("/dashboard");
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-xl p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">Welcome Back</h1>
        <p className="text-gray-600 text-sm">
          Log in to your account to manage reports
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-700 uppercase tracking-wide block mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black transition-all bg-white"
            required
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-700 uppercase tracking-wide block mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black transition-all bg-white"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 bg-black text-white rounded-lg font-medium text-sm hover:bg-gray-900 disabled:opacity-50 transition-all mt-6"
        >
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-6">
        Don't have an account?{" "}
        <Link href="/auth/signup" className="text-black font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
