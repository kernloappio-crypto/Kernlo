"use client";

import { useState } from "react";
import Link from "next/link";

const COLORS = {
  primary: "#0066cc",
  secondary: "#00d4ff",
  accent1: "#ff6b6b",
  accent2: "#ffd93d",
  accent3: "#6bcf7f",
  dark: "#1a1a2e",
  light: "#f0f7ff",
};

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [videoUrl, setVideoUrl] = useState(""); // Will be populated when user uploads to HeyGen

  function handleWaitlist() {
    if (!email) return;

    const waitlist = JSON.parse(localStorage.getItem("waitlist") || "[]");
    if (!waitlist.includes(email)) {
      waitlist.push(email);
      localStorage.setItem("waitlist", JSON.stringify(waitlist));
      alert("Thanks! You're on the waitlist. We'll be in touch.");
      setEmail("");
    }
  }

  return (
    <main style={{ backgroundColor: "white" }}>
      {/* Navigation */}
      <nav style={{ backgroundColor: "white", borderBottom: `1px solid #e5e7eb` }} className="sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div style={{ color: COLORS.primary }} className="text-lg sm:text-2xl font-bold">
            kernlo
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <Link
              href="/auth/login"
              style={{ color: COLORS.primary }}
              className="text-xs sm:text-sm font-medium hover:opacity-70"
            >
              Log In
            </Link>
            <Link
              href="/auth/signup"
              style={{ backgroundColor: COLORS.primary }}
              className="px-4 sm:px-6 py-2 text-white text-xs sm:text-sm font-medium rounded-lg hover:opacity-90"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ backgroundColor: COLORS.light }} className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h1 style={{ color: COLORS.dark }} className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
            Stop spreadsheets. Start seeing what your kids actually learn.
          </h1>
          <p style={{ color: "#666" }} className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 max-w-3xl mx-auto">
            One place to log activities, track progress by subject, and see what's actually happening in your homeschool. Generate professional reports when you need them—in moments, not hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12">
            <Link
              href="/auth/signup"
              style={{ backgroundColor: COLORS.primary }}
              className="px-6 sm:px-8 py-2.5 sm:py-3 text-white font-semibold rounded-lg hover:opacity-90 transition text-sm sm:text-base"
            >
              Try Free (No credit card)
            </Link>
            <a
              href="#how-it-works"
              className="px-6 sm:px-8 py-2.5 sm:py-3 border-2 font-semibold rounded-lg transition hover:bg-gray-50 text-sm sm:text-base"
              style={{ borderColor: COLORS.primary, color: COLORS.primary }}
            >
              See How It Works
            </a>
          </div>

          {/* Video - Whiteboard Animation */}
          <div className="max-w-2xl mx-auto rounded-lg overflow-hidden shadow-lg bg-black mb-8">
            <video
              width="100%"
              height="auto"
              controls
              autoPlay
              muted
              loop
              playsInline
              style={{ display: "block", backgroundColor: "#000" }}
              preload="auto"
            >
              <source src="/videos/kernlo-whiteboard.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>

          {/* 45-Second Video Script */}
          <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg border border-gray-200 text-left">
            <p style={{ color: "#999" }} className="text-xs uppercase tracking-wide font-semibold mb-4">Video Script (45 sec)</p>
            <div className="space-y-4 text-sm leading-relaxed" style={{ color: COLORS.dark }}>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Hook (5 sec)</p>
                <p>"You didn't become a homeschool parent to manage spreadsheets."</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Problem (10 sec)</p>
                <p>"Hours disappear tracking activities across different platforms. Notes get duplicated. Compliance deadlines sneak up. And when you need to show progress—nothing's organized."</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Solution (15 sec)</p>
                <p>"Kernlo changes that. Log an activity in 30 seconds—subject, platform, duration, done. Watch your kids' progress unfold in real time. See exactly what they're learning. And when you need reports? Generate them instantly."</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">CTA (5 sec)</p>
                <p>"Start free today. 30 days unlimited. No credit card."</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 style={{ color: COLORS.dark }} className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">
            The homeschool tracking chaos is real
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 max-w-2xl mx-auto">
            {[
              "Spreadsheets that don't talk to each other",
              "No visibility into what your kids actually learned",
              "Hours wasted documenting instead of teaching",
              "Panic scramble when compliance deadlines hit",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span style={{ color: COLORS.accent1 }} className="text-2xl font-bold flex-shrink-0">
                  ✗
                </span>
                <p style={{ color: "#666" }} className="text-sm">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{ backgroundColor: COLORS.light }} className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 style={{ color: COLORS.dark }} className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">
            See. Track. Report. Simple.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              { step: "1", title: "Log Activity", desc: "Quick log—subject, platform, duration, notes. Takes 30 seconds." },
              { step: "2", title: "See Progress", desc: "Watch learning unfold by subject, by state, by kid. Full visibility." },
              { step: "3", title: "Generate Reports", desc: "AI creates professional reports when you need them. Ready to submit." },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div
                  style={{ backgroundColor: COLORS.primary, color: "white" }}
                  className="w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4"
                >
                  {item.step}
                </div>
                <h3 style={{ color: COLORS.dark }} className="text-lg font-bold mb-2">
                  {item.title}
                </h3>
                <p style={{ color: "#666" }} className="text-sm">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 style={{ color: COLORS.dark }} className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">
            Real-time visibility. No spreadsheets.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
            {[
              { icon: "📱", title: "Quick Logging", desc: "Log in 30 seconds—subject, platform, duration, notes. That's it." },
              { icon: "👁️", title: "See Progress Real-Time", desc: "Dashboard shows exactly what each kid is learning, by subject, right now" },
              { icon: "📚", title: "Track by Subject", desc: "Monitor progress in Math, English, Science, and more at a glance" },
              { icon: "📋", title: "State Compliance", desc: "Track hours against your state's requirements. Know you're on track." },
              { icon: "🤖", title: "AI-Powered Reports", desc: "When you need reports, generate professional narratives in moments" },
              { icon: "📄", title: "PDF Export", desc: "Download and submit to co-ops, colleges, or state authorities" },
            ].map((feature, i) => (
              <div key={i} style={{ backgroundColor: COLORS.light }} className="p-4 sm:p-6 rounded-lg">
                <p className="text-3xl sm:text-4xl mb-2">{feature.icon}</p>
                <h3 style={{ color: COLORS.dark }} className="font-bold mb-2 text-sm sm:text-base">
                  {feature.title}
                </h3>
                <p style={{ color: "#666" }} className="text-xs sm:text-sm">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section style={{ backgroundColor: COLORS.light }} className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 style={{ color: COLORS.dark }} className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">
            What Parents Are Saying
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                quote: "I went from 5 hours of report writing to 30 minutes. Game changer.",
                author: "Sarah M.",
                kids: "3 kids",
                state: "CA",
              },
              {
                quote: "Finally, a tool designed for homeschool parents, not administrators.",
                author: "James T.",
                kids: "2 kids",
                state: "TX",
              },
              {
                quote: "The AI-generated reports are actually impressive. My co-op was amazed.",
                author: "Jessica P.",
                kids: "4 kids",
                state: "FL",
              },
            ].map((testimonial, i) => (
              <div key={i} style={{ backgroundColor: "white" }} className="p-4 sm:p-6 rounded-lg border border-gray-200">
                <p style={{ color: "#666" }} className="mb-4 italic text-sm">
                  "{testimonial.quote}"
                </p>
                <p style={{ color: COLORS.dark }} className="font-bold text-sm">
                  {testimonial.author}
                </p>
                <p style={{ color: "#999" }} className="text-xs">
                  {testimonial.kids} • {testimonial.state}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 style={{ color: COLORS.dark }} className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">
            Simple Pricing
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 max-w-2xl mx-auto">
            {[
              {
                name: "Free Trial",
                price: "30 days",
                desc: "Unlimited access",
                features: ["Unlimited reports", "Up to 5 children", "All 50 states", "Multi-kid support", "Goals + Compliance tracking"],
              },
              {
                name: "Pro",
                price: "$14.99",
                desc: "per month",
                features: ["Unlimited reports", "Up to 5 children", "All 50 states", "Multi-kid support", "Goals + Compliance tracking", "Priority support"],
              },
            ].map((plan, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: i === 1 ? COLORS.primary : COLORS.light,
                  color: i === 1 ? "white" : COLORS.dark,
                }}
                className="p-6 sm:p-8 rounded-lg text-center"
              >
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p style={{ color: i === 1 ? "rgba(255,255,255,0.9)" : "#666" }} className="mb-6 text-sm sm:text-base">
                  {plan.price}
                  <span className="text-xs sm:text-sm">
                    {plan.price !== "$0" ? " " + plan.desc : ""}
                  </span>
                </p>
                <Link
                  href="/auth/signup"
                  style={{
                    backgroundColor: i === 1 ? "white" : COLORS.primary,
                    color: i === 1 ? COLORS.primary : "white",
                  }}
                  className="block px-6 py-2 rounded-lg font-semibold mb-8 hover:opacity-90 transition text-sm sm:text-base"
                >
                  Get Started
                </Link>
                <ul className="space-y-3 text-left text-xs sm:text-sm">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2">
                      <span>✓</span> {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p style={{ color: "#999" }} className="text-center mt-8 text-xs sm:text-sm">
            Free trial. No credit card required. Upgrade anytime.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ backgroundColor: COLORS.light }} className="py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 style={{ color: COLORS.dark }} className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "Does Kernlo work for my state?",
                a: "Kernlo tracks learning hours and generates reports for any homeschool parent. Your state has specific rules—we recommend checking your state education department to confirm what documentation they need. Kernlo covers the tracking and report generation; you verify compliance with your state.",
              },
              {
                q: "How does the AI generate reports?",
                a: "You log activities with details (subject, duration, platform, notes). Kernlo tracks your progress by subject and state requirements in real-time. When you need a report, our AI analyzes your logs and generates professional, narrative-style progress reports.",
              },
              {
                q: "What if I use IXL, Khan Academy, or other platforms?",
                a: "Great question! We're building integrations for popular platforms. For now, you can manually log them. Phase 2 will auto-log from your account.",
              },
              {
                q: "Can I share access with my co-op or spouse?",
                a: "Multi-user support is coming in Phase 2. For now, each account is single-user. Stay tuned!",
              },
              {
                q: "What happens if I go over my free 3 reports?",
                a: "You'll get a reminder. You can upgrade to Pro ($14.99/mo) for unlimited reports, or wait until next month.",
              },
              {
                q: "Can I export my data?",
                a: "Absolutely. Your data is yours. You can export reports as PDF at any time.",
              },
            ].map((faq, i) => (
              <div key={i} className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
                <h3 style={{ color: COLORS.dark }} className="font-bold mb-2 text-sm sm:text-base">
                  {faq.q}
                </h3>
                <p style={{ color: "#666" }} className="text-xs sm:text-sm">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ backgroundColor: COLORS.primary }} className="py-16 sm:py-20 text-center text-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Ready to take back your weekends?</h2>
          <p className="text-base sm:text-lg mb-6 sm:mb-8 opacity-90">
            Start free. No credit card. No commitments.
          </p>
          <Link
            href="/auth/signup"
            className="inline-block px-8 py-3 bg-white text-black font-semibold rounded-lg hover:opacity-90 transition text-sm sm:text-base"
          >
            Get Started Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: COLORS.dark }} className="text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8">
            <div>
              <p className="font-bold mb-4">Kernlo</p>
              <p className="text-xs sm:text-sm opacity-70">AI-powered progress reports for homeschool families.</p>
            </div>
            <div>
              <p className="font-bold mb-4">Product</p>
              <ul className="text-xs sm:text-sm opacity-70 space-y-2">
                <li><Link href="/generator" className="hover:opacity-100">Report Generator</Link></li>
                <li><Link href="/dashboard" className="hover:opacity-100">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-bold mb-4">Legal</p>
              <ul className="text-xs sm:text-sm opacity-70 space-y-2">
                <li><Link href="/privacy" className="hover:opacity-100">Privacy</Link></li>
                <li><Link href="/terms" className="hover:opacity-100">Terms</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-bold mb-4">Contact</p>
              <p className="text-xs sm:text-sm opacity-70">hello@kernlo.app</p>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }} className="pt-8 text-center text-xs sm:text-sm opacity-50">
            <p>© 2026 Kernlo. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
