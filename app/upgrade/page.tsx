"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { markUserAsPaid } from "@/lib/stripe-utils";

function UpgradeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  function handleUpgradeClick() {
    setLoading(true);
    
    const userEmail = email || localStorage.getItem("user_email");
    if (userEmail) {
      markUserAsPaid(userEmail);
      alert("✓ Upgrade successful! Redirecting to dashboard...");
      router.push("/dashboard");
    } else {
      alert("Email not found. Please sign in and try again.");
      router.push("/auth/login");
    }
  }

  return (
    <main style={{ backgroundColor: COLORS.light, minHeight: "100vh" }}>
      {/* Navigation */}
      <nav style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb" }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" style={{ color: COLORS.primary }} className="text-2xl font-bold">
            kernlo
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-8 border border-gray-200">
          <h1 style={{ color: COLORS.dark }} className="text-3xl font-bold mb-2">
            Upgrade to Pro
          </h1>
          <p style={{ color: "#666" }} className="text-lg mb-8">
            Unlock unlimited reports and full access to Kernlo.
          </p>

          {/* Pricing Card */}
          <div style={{ backgroundColor: COLORS.light }} className="p-6 rounded-lg mb-8">
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-bold" style={{ color: COLORS.primary }}>
                $14.99
              </span>
              <span style={{ color: "#666" }}>/ month</span>
            </div>

            <ul style={{ color: COLORS.dark }} className="space-y-3 mb-8">
              <li className="flex items-center gap-2">
                <span className="text-xl">✓</span>
                <span>Unlimited reports</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-xl">✓</span>
                <span>Up to 5 children</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-xl">✓</span>
                <span>All features included</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-xl">✓</span>
                <span>Email support</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-xl">✓</span>
                <span>Cancel anytime</span>
              </li>
            </ul>

            <button
              onClick={handleUpgradeClick}
              disabled={loading}
              style={{ backgroundColor: COLORS.primary }}
              className="w-full px-6 py-3 text-white font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "Processing..." : "Upgrade to Pro"}
            </button>
          </div>

          {/* FAQ */}
          <div className="space-y-4">
            <h2 style={{ color: COLORS.dark }} className="text-lg font-bold mb-4">
              Common Questions
            </h2>

            <details className="border border-gray-200 rounded-lg p-4">
              <summary style={{ color: COLORS.dark }} className="font-semibold cursor-pointer">
                Can I cancel anytime?
              </summary>
              <p style={{ color: "#666" }} className="mt-2 text-sm">
                Yes! Your subscription can be canceled at any time. You'll keep access through the end of your billing period.
              </p>
            </details>

            <details className="border border-gray-200 rounded-lg p-4">
              <summary style={{ color: COLORS.dark }} className="font-semibold cursor-pointer">
                Do you offer refunds?
              </summary>
              <p style={{ color: "#666" }} className="mt-2 text-sm">
                We offer a full refund for the first 30 days if you're not satisfied.
              </p>
            </details>

            <details className="border border-gray-200 rounded-lg p-4">
              <summary style={{ color: COLORS.dark }} className="font-semibold cursor-pointer">
                What payment methods do you accept?
              </summary>
              <p style={{ color: "#666" }} className="mt-2 text-sm">
                We accept all major credit cards, debit cards, and Apple Pay via Stripe.
              </p>
            </details>
          </div>

          {/* Contact Support */}
          <div style={{ backgroundColor: "#f0f7ff" }} className="mt-8 p-6 rounded-lg text-center">
            <p style={{ color: COLORS.dark }} className="font-semibold mb-2">
              Have questions?
            </p>
            <p style={{ color: "#666" }} className="text-sm">
              Contact us at{" "}
              <a href="mailto:hello@kernlo.app" style={{ color: COLORS.primary }} className="font-medium">
                hello@kernlo.app
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

const COLORS = {
  primary: "#0066cc",
  secondary: "#00d4ff",
  dark: "#1a1a2e",
  light: "#f0f7ff",
};

export default function UpgradePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UpgradeContent />
    </Suspense>
  );
}
