"use client";

import Link from "next/link";

const COLORS = {
  primary: "#0066cc",
  secondary: "#00d4ff",
  accent1: "#ff6b6b",
  accent2: "#ffd93d",
  accent3: "#6bcf7f",
  light: "#f0f7ff",
  dark: "#1a1a2e",
};

export default function Home() {
  return (
    <main style={{ backgroundColor: COLORS.light, minHeight: "100vh" }}>
      {/* Navigation */}
      <nav style={{ backgroundColor: "white", borderBottom: `1px solid #e5e7eb` }} className="sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div style={{ color: COLORS.primary }} className="text-2xl font-bold">
            kernlo
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/generator"
              style={{ color: COLORS.dark }}
              className="text-sm font-medium hover:opacity-70 transition"
            >
              Generator
            </Link>
            <Link
              href="/auth/login"
              style={{ color: COLORS.dark }}
              className="text-sm font-medium hover:opacity-70 transition"
            >
              Log In
            </Link>
            <Link
              href="/auth/signup"
              style={{ backgroundColor: COLORS.primary }}
              className="px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 transition"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <div style={{ backgroundColor: `${COLORS.primary}15`, color: COLORS.primary }} className="inline-block text-xs font-semibold uppercase tracking-widest rounded-full px-4 py-2 mb-6">
          🎓 AI Progress Reports
        </div>

        <h1 style={{ color: COLORS.dark }} className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          Turn learning into{" "}
          <span style={{ color: COLORS.primary }}>beautiful reports</span>
        </h1>

        <p style={{ color: "#666" }} className="text-lg max-w-3xl mx-auto mb-12 leading-relaxed">
          Kernlo transforms what your child learned today into professional, school-ready progress reports in minutes. No spreadsheets. No stress. Just powerful insights.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link
            href="/generator"
            style={{ backgroundColor: COLORS.primary }}
            className="px-8 py-3 text-white font-semibold rounded-lg hover:opacity-90 transition"
          >
            Start Free
          </Link>
          <Link
            href="/auth/signup"
            style={{ backgroundColor: "white", color: COLORS.primary, borderColor: COLORS.primary }}
            className="px-8 py-3 font-semibold rounded-lg border-2 hover:bg-gray-50 transition"
          >
            Create Account
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-20">
          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-8 border border-gray-200">
            <div className="text-4xl mb-3">📝</div>
            <h3 style={{ color: COLORS.dark }} className="font-semibold mb-2">
              Log Activities
            </h3>
            <p style={{ color: "#666" }} className="text-sm">
              Record subjects, platforms, topics, and time spent in seconds.
            </p>
          </div>

          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-8 border border-gray-200">
            <div className="text-4xl mb-3">✨</div>
            <h3 style={{ color: COLORS.dark }} className="font-semibold mb-2">
              AI Generates
            </h3>
            <p style={{ color: "#666" }} className="text-sm">
              Kernlo writes professional assessments instantly.
            </p>
          </div>

          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-8 border border-gray-200">
            <div className="text-4xl mb-3">📥</div>
            <h3 style={{ color: COLORS.dark }} className="font-semibold mb-2">
              Download
            </h3>
            <p style={{ color: "#666" }} className="text-sm">
              Export polished PDFs ready for your school.
            </p>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section style={{ backgroundColor: "white" }} className="py-20 border-t border-gray-200">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 style={{ color: COLORS.dark }} className="text-4xl font-bold mb-4">
              Powerful Dashboard
            </h2>
            <p style={{ color: "#666" }}>
              Track progress across all your kids and subjects with colorful, engaging insights.
            </p>
          </div>

          <div style={{ backgroundColor: COLORS.light, borderRadius: "12px", border: `2px solid ${COLORS.primary}20` }} className="p-8">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div style={{ backgroundColor: COLORS.primary }} className="w-3 h-3 rounded-full mt-1" />
                <div>
                  <p style={{ color: COLORS.dark }} className="font-semibold">
                    Kids Sidebar
                  </p>
                  <p style={{ color: "#666" }} className="text-sm">
                    Switch between children instantly
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div style={{ backgroundColor: COLORS.accent3 }} className="w-3 h-3 rounded-full mt-1" />
                <div>
                  <p style={{ color: COLORS.dark }} className="font-semibold">
                    Progress Rings
                  </p>
                  <p style={{ color: "#666" }} className="text-sm">
                    Visualize courses and growth
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div style={{ backgroundColor: COLORS.accent2 }} className="w-3 h-3 rounded-full mt-1" />
                <div>
                  <p style={{ color: COLORS.dark }} className="font-semibold">
                    Weekly Graphs
                  </p>
                  <p style={{ color: "#666" }} className="text-sm">
                    See time spent by day with colorful bars
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div style={{ backgroundColor: COLORS.accent1 }} className="w-3 h-3 rounded-full mt-1" />
                <div>
                  <p style={{ color: COLORS.dark }} className="font-semibold">
                    Subject Details
                  </p>
                  <p style={{ color: "#666" }} className="text-sm">
                    Dive deep into each subject's progress
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 style={{ color: COLORS.dark }} className="text-4xl font-bold mb-4">
          Ready to simplify progress tracking?
        </h2>
        <p style={{ color: "#666" }} className="text-lg mb-8">
          Start free today. No credit card required.
        </p>
        <Link
          href="/generator"
          style={{ backgroundColor: COLORS.primary }}
          className="inline-block px-8 py-3 text-white font-semibold rounded-lg hover:opacity-90 transition"
        >
          Create Your First Report
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: "white", borderTop: `1px solid #e5e7eb` }} className="py-8 text-center">
        <p style={{ color: "#999" }} className="text-sm">
          © 2026 Kernlo. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
