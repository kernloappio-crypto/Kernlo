"use client";

import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div
        style={{ backgroundColor: "white", borderRadius: "12px" }}
        className="p-8 max-w-md w-full border border-gray-200 text-center"
      >
        <div style={{ color: "#ff6b6b" }} className="text-6xl mb-4">
          📡
        </div>
        <h1 style={{ color: "#1a1a2e" }} className="text-2xl font-bold mb-4">
          You're Offline
        </h1>
        <p style={{ color: "#666" }} className="text-sm mb-6">
          It looks like you've lost your internet connection. Your data is safe—check your connection and try again.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            style={{ backgroundColor: "#0066cc" }}
            className="w-full px-4 py-2 text-white font-medium rounded-lg hover:opacity-90"
          >
            Try Again
          </button>
          <Link
            href="/"
            style={{ borderColor: "#0066cc", color: "#0066cc" }}
            className="w-full px-4 py-2 font-medium rounded-lg border block"
          >
            Go Home
          </Link>
        </div>
      </div>
    </main>
  );
}
