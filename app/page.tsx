"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Navigation */}
      <nav className="border-b border-gray-200 sticky top-0 z-50 bg-white/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-black">kernlo</div>
          <div className="flex items-center gap-4">
            <Link
              href="/generator"
              className="text-sm text-gray-700 hover:text-black transition"
            >
              Generator
            </Link>
            <Link
              href="/auth/login"
              className="px-4 py-2 text-sm text-gray-700 hover:text-black transition"
            >
              Log In
            </Link>
            <Link
              href="/auth/signup"
              className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-900 transition"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 md:py-32 text-center">
        <div className="inline-block text-xs font-semibold uppercase tracking-widest text-gray-600 bg-gray-100 rounded-full px-4 py-2 mb-6">
          Progress Reports, Reimagined
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          Turn learning into{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-black to-gray-700">
            professional reports
          </span>
        </h1>

        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          Kernlo uses AI to transform a few details about what your child
          learned into beautiful, school-ready progress reports. No spreadsheets.
          No templates. Just done.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link
            href="/generator"
            className="px-8 py-4 bg-black text-white rounded-lg font-semibold text-lg hover:bg-gray-900 transition shadow-lg"
          >
            Start Free
          </Link>
          <Link
            href="/auth/signup"
            className="px-8 py-4 bg-gray-100 text-black rounded-lg font-semibold text-lg hover:bg-gray-200 transition"
          >
            Create Account
          </Link>
        </div>

        {/* Feature Preview */}
        <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
          <img
            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 600'%3E%3Crect fill='%23f3f4f6' width='1000' height='600'/%3E%3Crect fill='%23fff' x='50' y='50' width='900' height='500' rx='8'/%3E%3Ctext x='100' y='120' font-size='24' font-weight='bold' fill='%23000'%3EYour Report%3C/text%3E%3Crect fill='%23f0f0f0' x='100' y='150' width='800' height='300' rx='4'/%3E%3Ctext x='120' y='200' font-size='14' fill='%23666'%3EEmma engaged in Math today, exploring fractions...%3C/text%3E%3C/svg%3E"
            alt="Report Preview"
            className="w-full h-auto"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-16">How it works</h2>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="text-center">
            <div className="text-5xl mb-4">📝</div>
            <h3 className="text-xl font-semibold mb-3">Log what happened</h3>
            <p className="text-gray-600">
              Tell us what your child studied — the subject, resource, topics,
              and time spent.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="text-center">
            <div className="text-5xl mb-4">✨</div>
            <h3 className="text-xl font-semibold mb-3">AI writes the report</h3>
            <p className="text-gray-600">
              Our AI instantly transforms your notes into a professional,
              school-ready assessment.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="text-center">
            <div className="text-5xl mb-4">📥</div>
            <h3 className="text-xl font-semibold mb-3">Download & submit</h3>
            <p className="text-gray-600">
              Export a polished PDF ready for your school district. That's it.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16">Features</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-xl border border-gray-200">
              <div className="text-3xl mb-3">🎓</div>
              <h3 className="text-lg font-semibold mb-2">Daily & Weekly</h3>
              <p className="text-gray-600">
                Log one day at a time or summarize your whole week in one
                polished report.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200">
              <div className="text-3xl mb-3">📚</div>
              <h3 className="text-lg font-semibold mb-2">Multi-Subject</h3>
              <p className="text-gray-600">
                Add multiple subjects in one report. Kernlo synthesizes them
                into a cohesive narrative.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200">
              <div className="text-3xl mb-3">🔐</div>
              <h3 className="text-lg font-semibold mb-2">Secure & Private</h3>
              <p className="text-gray-600">
                Your reports are encrypted and stored securely. Only you can
                access them.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200">
              <div className="text-3xl mb-3">💾</div>
              <h3 className="text-lg font-semibold mb-2">Save & Download</h3>
              <p className="text-gray-600">
                Keep a record of every report and re-download PDFs anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-16">Simple Pricing</h2>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Free Tier */}
          <div className="border border-gray-200 rounded-xl p-10">
            <h3 className="text-2xl font-bold mb-2">Free</h3>
            <p className="text-gray-600 mb-6">Perfect to get started</p>
            <div className="text-4xl font-bold mb-6">
              $0<span className="text-lg text-gray-600">/month</span>
            </div>
            <ul className="space-y-3 mb-8 text-gray-700">
              <li className="flex items-center gap-3">
                <span className="text-lg">✓</span> 3 reports per month
              </li>
              <li className="flex items-center gap-3">
                <span className="text-lg">✓</span> Daily & weekly reports
              </li>
              <li className="flex items-center gap-3">
                <span className="text-lg">✓</span> Multi-subject support
              </li>
              <li className="flex items-center gap-3">
                <span className="text-lg">✓</span> PDF export
              </li>
            </ul>
            <Link
              href="/auth/signup"
              className="w-full block text-center px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Get Started
            </Link>
          </div>

          {/* Premium Tier */}
          <div className="border-2 border-black rounded-xl p-10 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-black text-white px-4 py-1 rounded-full text-sm font-semibold">
              Coming Soon
            </div>
            <h3 className="text-2xl font-bold mb-2">Premium</h3>
            <p className="text-gray-600 mb-6">For serious homeschoolers</p>
            <div className="text-4xl font-bold mb-6">
              $7<span className="text-lg text-gray-600">/month</span>
            </div>
            <ul className="space-y-3 mb-8 text-gray-700">
              <li className="flex items-center gap-3">
                <span className="text-lg">✓</span> Unlimited reports
              </li>
              <li className="flex items-center gap-3">
                <span className="text-lg">✓</span> Everything in Free
              </li>
              <li className="flex items-center gap-3">
                <span className="text-lg">✓</span> Activity templates
              </li>
              <li className="flex items-center gap-3">
                <span className="text-lg">✓</span> Priority support
              </li>
            </ul>
            <button
              disabled
              className="w-full px-6 py-3 bg-gray-100 text-gray-400 rounded-lg font-medium cursor-not-allowed"
            >
              Coming Soon
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-black text-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to save time?</h2>
          <p className="text-xl text-gray-300 mb-10">
            Start generating professional reports in seconds.
          </p>
          <Link
            href="/generator"
            className="inline-block px-8 py-4 bg-white text-black rounded-lg font-semibold text-lg hover:bg-gray-200 transition"
          >
            Create Your First Report
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-10">
        <div className="max-w-6xl mx-auto px-6 text-center text-gray-600 text-sm">
          <p>© 2026 Kernlo. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
