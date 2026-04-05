"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      // Simple localStorage auth (MVP only)
      const users = JSON.parse(localStorage.getItem("users") || "{}");

      if (users[email]) {
        setError("Email already registered");
        return;
      }

      // Store user
      users[email] = {
        email,
        password, // NOT secure for production
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem("users", JSON.stringify(users));
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
        <h1 className="text-3xl font-bold text-black mb-2">Create Account</h1>
        <p className="text-gray-600 text-sm">
          Sign up to start generating progress reports
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-4">
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
            minLength={6}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-700 uppercase tracking-wide block mb-2">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black transition-all bg-white"
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 bg-black text-white rounded-lg font-medium text-sm hover:bg-gray-900 disabled:opacity-50 transition-all mt-6"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-6">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-black font-medium hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
