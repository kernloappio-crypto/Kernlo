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
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div style={{ color: COLORS.primary }} className="text-2xl font-bold">
            kernlo
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/auth/login"
              style={{ color: COLORS.primary }}
              className="text-sm font-medium hover:opacity-70"
            >
              Log In
            </Link>
            <Link
              href="/auth/signup"
              style={{ backgroundColor: COLORS.primary }}
              className="px-6 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ backgroundColor: COLORS.light }} className="py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 style={{ color: COLORS.dark }} className="text-5xl font-bold mb-6 leading-tight">
            Turn 5 hours of compliance reports into 5 minutes
          </h1>
          <p style={{ color: "#666" }} className="text-xl mb-8 max-w-3xl mx-auto">
            Stop spending your weekends writing progress reports. Kernlo's AI generates professional, state-compliant reports from your activity logs. Log once. Report everywhere.
          </p>
          <div className="flex gap-4 justify-center mb-12">
            <Link
              href="/auth/signup"
              style={{ backgroundColor: COLORS.primary }}
              className="px-8 py-3 text-white font-semibold rounded-lg hover:opacity-90 transition"
            >
              Try Free (No credit card)
            </Link>
            <a
              href="#how-it-works"
              className="px-8 py-3 border-2 font-semibold rounded-lg transition hover:bg-gray-50"
              style={{ borderColor: COLORS.primary, color: COLORS.primary }}
            >
              See How It Works
            </a>
          </div>

          {/* Video - Whiteboard Animation */}
          <div className="max-w-2xl mx-auto rounded-lg overflow-hidden shadow-lg bg-black">
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
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 style={{ color: COLORS.dark }} className="text-3xl font-bold text-center mb-12">
            Does this sound like you?
          </h2>
          <div className="grid grid-cols-2 gap-8 max-w-2xl mx-auto">
            {[
              "Dreading compliance deadlines every month",
              "Spending weekends writing progress reports",
              "Using spreadsheets that don't work",
              "Wanting professional reports but have no time",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span style={{ color: COLORS.accent3 }} className="text-2xl font-bold">
                  ✓
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
      <section id="how-it-works" style={{ backgroundColor: COLORS.light }} className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 style={{ color: COLORS.dark }} className="text-3xl font-bold text-center mb-12">
            How Kernlo Works
          </h2>
          <div className="grid grid-cols-3 gap-8">
            {[
              { step: "1", title: "Log Activities", desc: "Record what your kids learned—subject, duration, platform, notes." },
              { step: "2", title: "AI Generates", desc: "Kernlo's AI creates professional, state-compliant reports automatically." },
              { step: "3", title: "Download & Submit", desc: "Export PDF reports ready for compliance submission." },
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
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 style={{ color: COLORS.dark }} className="text-3xl font-bold text-center mb-12">
            Everything You Need
          </h2>
          <div className="grid grid-cols-2 gap-8">
            {[
              { icon: "📊", title: "Multi-Kid Support", desc: "Track progress for all your kids in one place" },
              { icon: "🤖", title: "AI-Powered Reports", desc: "Professional reports generated in minutes, not hours" },
              { icon: "✓", title: "50-State Compliant", desc: "Works with requirements from all 50 states" },
              { icon: "📱", title: "Quick Logging", desc: "Log activities on the go—subject, duration, platform, notes" },
              { icon: "📈", title: "Goals & Tracking", desc: "Set monthly targets and track progress visually" },
              { icon: "📄", title: "PDF Export", desc: "Download comprehensive reports ready to submit" },
            ].map((feature, i) => (
              <div key={i} style={{ backgroundColor: COLORS.light }} className="p-6 rounded-lg">
                <p className="text-4xl mb-2">{feature.icon}</p>
                <h3 style={{ color: COLORS.dark }} className="font-bold mb-2">
                  {feature.title}
                </h3>
                <p style={{ color: "#666" }} className="text-sm">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section style={{ backgroundColor: COLORS.light }} className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 style={{ color: COLORS.dark }} className="text-3xl font-bold text-center mb-12">
            What Parents Are Saying
          </h2>
          <div className="grid grid-cols-3 gap-8">
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
              <div key={i} style={{ backgroundColor: "white" }} className="p-6 rounded-lg border border-gray-200">
                <p style={{ color: "#666" }} className="mb-4 italic">
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
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 style={{ color: COLORS.dark }} className="text-3xl font-bold text-center mb-12">
            Simple Pricing
          </h2>
          <div className="grid grid-cols-2 gap-8 max-w-2xl mx-auto">
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
                className="p-8 rounded-lg text-center"
              >
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p style={{ color: i === 1 ? "rgba(255,255,255,0.9)" : "#666" }} className="mb-6">
                  {plan.price}
                  <span className="text-sm">
                    {plan.price !== "$0" ? " " + plan.desc : ""}
                  </span>
                </p>
                <Link
                  href="/auth/signup"
                  style={{
                    backgroundColor: i === 1 ? "white" : COLORS.primary,
                    color: i === 1 ? COLORS.primary : "white",
                  }}
                  className="block px-6 py-2 rounded-lg font-semibold mb-8 hover:opacity-90 transition"
                >
                  Get Started
                </Link>
                <ul className="space-y-3 text-left text-sm">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2">
                      <span>✓</span> {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p style={{ color: "#999" }} className="text-center mt-8 text-sm">
            Free trial. No credit card required. Upgrade anytime.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ backgroundColor: COLORS.light }} className="py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h2 style={{ color: COLORS.dark }} className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "Does Kernlo work for my state?",
                a: "Yes! Kernlo works for all 50 states. When you generate a report, you can select your state and Kernlo ensures it's compliant with your specific requirements.",
              },
              {
                q: "How does the AI generate reports?",
                a: "You log activities with details (subject, duration, platform, notes). Our AI analyzes these logs and generates professional, narrative-style progress reports that impress compliance reviewers.",
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
              <div key={i} className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 style={{ color: COLORS.dark }} className="font-bold mb-2">
                  {faq.q}
                </h3>
                <p style={{ color: "#666" }} className="text-sm">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ backgroundColor: COLORS.primary }} className="py-20 text-center text-white">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-6">Ready to take back your weekends?</h2>
          <p className="text-lg mb-8 opacity-90">
            Start free. No credit card. No commitments.
          </p>
          <Link
            href="/auth/signup"
            className="inline-block px-8 py-3 bg-white text-black font-semibold rounded-lg hover:opacity-90 transition"
          >
            Get Started Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: COLORS.dark }} className="text-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-4 gap-8 mb-8">
            <div>
              <p className="font-bold mb-4">Kernlo</p>
              <p className="text-sm opacity-70">AI-powered progress reports for homeschool families.</p>
            </div>
            <div>
              <p className="font-bold mb-4">Product</p>
              <ul className="text-sm opacity-70 space-y-2">
                <li><Link href="/generator" className="hover:opacity-100">Report Generator</Link></li>
                <li><Link href="/dashboard" className="hover:opacity-100">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-bold mb-4">Legal</p>
              <ul className="text-sm opacity-70 space-y-2">
                <li><Link href="/privacy" className="hover:opacity-100">Privacy</Link></li>
                <li><Link href="/terms" className="hover:opacity-100">Terms</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-bold mb-4">Contact</p>
              <p className="text-sm opacity-70">hello@kernlo.app</p>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }} className="pt-8 text-center text-sm opacity-50">
            <p>© 2026 Kernlo. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
