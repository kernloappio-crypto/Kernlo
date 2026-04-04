"use client";

import { useState } from "react";
import { generatePDF } from "@/lib/pdf-generator";

interface ReportInput {
  childName: string;
  subject: string;
  activity: string;
  duration: string;
  notes: string;
}

interface GeneratedReport {
  content: string;
  input: ReportInput;
}

export default function Generator() {
  const [input, setInput] = useState<ReportInput>({
    childName: "",
    subject: "",
    activity: "",
    duration: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<GeneratedReport | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const data = await res.json();
      if (data.report) {
        setReport({
          content: data.report,
          input,
        });
      }
    } catch {
      alert("Error generating report");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPDF() {
    if (!report) return;

    try {
      const blob = await generatePDF({
        childName: report.input.childName,
        subject: report.input.subject,
        activity: report.input.activity,
        duration: report.input.duration,
        notes: report.input.notes,
        reportContent: report.content,
        generatedDate: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      });

      // Download the PDF
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${report.input.childName}-progress-report.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Error downloading PDF");
    }
  }

  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <a href="/" className="text-lg font-semibold text-black">
          kernlo
        </a>
        <div className="flex gap-4">
          <a href="/" className="text-sm text-gray-600 hover:text-black transition">
            Back
          </a>
        </div>
      </nav>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Input Form */}
        <div className="w-full lg:w-1/2 p-6 lg:p-12 border-r border-gray-100 lg:border-r lg:border-gray-200">
          <div className="max-w-md">
            <h1 className="text-3xl font-bold text-black mb-2">
              Generate Report
            </h1>
            <p className="text-gray-600 text-sm mb-8">
              Tell us what your child studied today. We'll format it into a
              professional report.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Child Name */}
              <div>
                <label className="text-xs font-medium text-gray-700 uppercase tracking-wide block mb-2">
                  Child's Name
                </label>
                <input
                  type="text"
                  value={input.childName}
                  onChange={(e) =>
                    setInput({ ...input, childName: e.target.value })
                  }
                  placeholder="e.g., Emma"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-600 transition-colors bg-white"
                  required
                />
              </div>

              {/* Subject */}
              <div>
                <label className="text-xs font-medium text-gray-700 uppercase tracking-wide block mb-2">
                  Subject
                </label>
                <select
                  value={input.subject}
                  onChange={(e) =>
                    setInput({ ...input, subject: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-600 transition-colors bg-white"
                  required
                >
                  <option value="">Select a subject</option>
                  <option value="Math">Math</option>
                  <option value="Reading">Reading</option>
                  <option value="Science">Science</option>
                  <option value="History">History</option>
                  <option value="Language Arts">Language Arts</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Activity */}
              <div>
                <label className="text-xs font-medium text-gray-700 uppercase tracking-wide block mb-2">
                  Activity
                </label>
                <input
                  type="text"
                  value={input.activity}
                  onChange={(e) =>
                    setInput({ ...input, activity: e.target.value })
                  }
                  placeholder="e.g., Khan Academy lessons on fractions"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-600 transition-colors bg-white"
                  required
                />
              </div>

              {/* Duration */}
              <div>
                <label className="text-xs font-medium text-gray-700 uppercase tracking-wide block mb-2">
                  Duration
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={input.duration}
                    onChange={(e) =>
                      setInput({ ...input, duration: e.target.value })
                    }
                    placeholder="45"
                    min="1"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-600 transition-colors bg-white"
                    required
                  />
                  <div className="flex items-center text-sm text-gray-700 px-3">
                    minutes
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-gray-700 uppercase tracking-wide block mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={input.notes}
                  onChange={(e) =>
                    setInput({ ...input, notes: e.target.value })
                  }
                  placeholder="Any additional details about the lesson..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-600 transition-colors resize-none bg-white"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 bg-black text-white rounded-lg font-medium text-sm hover:bg-gray-900 disabled:opacity-50 transition-colors"
              >
                {loading ? "Generating..." : "Generate Report"}
              </button>

              <p className="text-xs text-gray-500 text-center">
                Free: 3 reports/month • Premium: Unlimited
              </p>
            </form>
          </div>
        </div>

        {/* Report Output */}
        <div className="w-full lg:w-1/2 p-6 lg:p-12 bg-gray-50 flex flex-col">
          {report ? (
            <div className="max-w-md">
              <h2 className="text-2xl font-bold text-black mb-4">
                Your Report
              </h2>
              <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6 max-h-96 overflow-y-auto">
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {report.content}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleDownloadPDF}
                  className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-medium text-sm hover:bg-gray-900 transition-colors"
                >
                  Download PDF
                </button>
                <button
                  onClick={() => setReport(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-black rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors"
                >
                  New Report
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl mb-4">📋</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Your report will appear here
              </h2>
              <p className="text-gray-600 text-sm max-w-xs">
                Fill in the form on the left and we'll generate a professional
                report in seconds.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
