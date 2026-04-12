"use client";

import Link from "next/link";

const COLORS = {
  primary: "#0066cc",
  dark: "#1a1a2e",
  light: "#f0f7ff",
};

export default function TermsPage() {
  return (
    <main style={{ backgroundColor: COLORS.light }}>
      {/* Navigation */}
      <nav style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb" }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" style={{ color: COLORS.primary }} className="text-2xl font-bold">
            kernlo
          </Link>
          <Link
            href="/"
            style={{ color: COLORS.primary }}
            className="text-sm font-medium hover:opacity-70"
          >
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 style={{ color: COLORS.dark }} className="text-4xl font-bold mb-8">
          Terms of Service
        </h1>

        <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-8 border border-gray-200 space-y-8">
          <section>
            <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-4">
              1. Agreement to Terms
            </h2>
            <p style={{ color: "#666" }} className="mb-4">
              By accessing and using Kernlo, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-4">
              2. Use License
            </h2>
            <p style={{ color: "#666" }} className="mb-4">
              Permission is granted to temporarily download one copy of the materials (information or software) on Kernlo for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul style={{ color: "#666" }} className="list-disc list-inside space-y-2 ml-4">
              <li>Modifying or copying the materials</li>
              <li>Using the materials for any commercial purpose or for any public display</li>
              <li>Attempting to decompile or reverse engineer any software contained on Kernlo</li>
              <li>Removing any copyright or other proprietary notations from the materials</li>
              <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-4">
              3. Disclaimer
            </h2>
            <p style={{ color: "#666" }} className="mb-4">
              The materials on Kernlo are provided on an 'as is' basis. Kernlo makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-4">
              4. Limitations
            </h2>
            <p style={{ color: "#666" }} className="mb-4">
              In no event shall Kernlo or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Kernlo.
            </p>
          </section>

          <section>
            <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-4">
              5. Accuracy of Materials
            </h2>
            <p style={{ color: "#666" }} className="mb-4">
              The materials appearing on Kernlo could include technical, typographical, or photographic errors. Kernlo does not warrant that any of the materials on our application are accurate, complete, or current. Kernlo may make changes to the materials contained on its application at any time without notice.
            </p>
          </section>

          <section>
            <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-4">
              6. Links
            </h2>
            <p style={{ color: "#666" }} className="mb-4">
              Kernlo has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Kernlo of the site. Use of any such linked website is at the user's own risk.
            </p>
          </section>

          <section>
            <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-4">
              7. Modifications
            </h2>
            <p style={{ color: "#666" }} className="mb-4">
              Kernlo may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </section>

          <section>
            <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-4">
              8. Governing Law
            </h2>
            <p style={{ color: "#666" }} className="mb-4">
              These terms and conditions are governed by and construed in accordance with the laws of the United States, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
            </p>
          </section>

          <section>
            <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold mb-4">
              9. Payment Terms
            </h2>
            <p style={{ color: "#666" }} className="mb-4">
              Pro subscriptions are billed monthly at $14.99 USD. You can cancel anytime. All sales are final unless otherwise stated. Refunds are issued at our discretion.
            </p>
          </section>

          <section>
            <p style={{ color: "#999" }} className="text-sm">
              Last updated: April 12, 2026
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
