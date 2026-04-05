"use client";

import { useState } from "react";

interface SubjectEntry {
  id: string;
  date: string;
  subject: string;
  platform: string;
  topics: string;
  duration: string;
}

interface ReportInput {
  childName: string;
  reportType: "daily" | "weekly";
  subjects: SubjectEntry[];
  notes: string;
}

interface GeneratedReport {
  content: string;
  input: ReportInput;
}

export default function Generator() {
  const getDefaultDate = () => new Date().toISOString().split("T")[0];

  const [input, setInput] = useState<ReportInput>({
    childName: "",
    reportType: "daily",
    subjects: [
      {
        id: "1",
        date: getDefaultDate(),
        subject: "",
        platform: "",
        topics: "",
        duration: "",
      },
    ],
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<GeneratedReport | null>(null);

  const addSubject = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    // Use last subject's date if available, otherwise today
    const lastDate = input.subjects[input.subjects.length - 1]?.date || getDefaultDate();
    setInput({
      ...input,
      subjects: [
        ...input.subjects,
        {
          id: newId,
          date: lastDate,
          subject: "",
          platform: "",
          topics: "",
          duration: "",
        },
      ],
    });
  };

  const removeSubject = (id: string) => {
    if (input.subjects.length > 1) {
      setInput({
        ...input,
        subjects: input.subjects.filter((s) => s.id !== id),
      });
    }
  };

  const updateSubject = (id: string, field: keyof SubjectEntry, value: string) => {
    setInput({
      ...input,
      subjects: input.subjects.map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      ),
    });
  };

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
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childName: report.input.childName,
          reportType: report.input.reportType,
          subjects: report.input.subjects,
          notes: report.input.notes,
          reportContent: report.content,
          generatedDate: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        }),
      });

      if (!res.ok) throw new Error("PDF generation failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${report.input.childName}-progress-report.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF download error:", error);
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
                <label className="text-xs font-medium text-gray-900 uppercase tracking-wide block mb-2">
                  Child's Name
                </label>
                <input
                  type="text"
                  value={input.childName}
                  onChange={(e) =>
                    setInput({ ...input, childName: e.target.value })
                  }
                  placeholder="e.g., Emma"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-300 transition-colors bg-white"
                  required
                />
              </div>

              {/* Report Type */}
              <div>
                <label className="text-xs font-medium text-gray-900 uppercase tracking-wide block mb-2">
                  Report Type
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="reportType"
                      value="daily"
                      checked={input.reportType === "daily"}
                      onChange={(e) =>
                        setInput({ ...input, reportType: "daily" })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-900">Daily</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="reportType"
                      value="weekly"
                      checked={input.reportType === "weekly"}
                      onChange={(e) =>
                        setInput({ ...input, reportType: "weekly" })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-900">Weekly</span>
                  </label>
                </div>
              </div>

              {/* Subjects List */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {input.reportType === "weekly" ? "Learning by Day" : "Subjects Studied"}
                  </h3>
                  <button
                    type="button"
                    onClick={addSubject}
                    className="text-xs px-2 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition"
                  >
                    + Add {input.reportType === "weekly" ? "Entry" : "Subject"}
                  </button>
                </div>

                <div className="space-y-6">
                  {input.subjects.map((subject, idx) => (
                    <div key={subject.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-xs font-medium text-gray-600">
                          {input.reportType === "weekly" ? "Entry" : "Subject"} {idx + 1}
                        </span>
                        {input.subjects.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSubject(subject.id)}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      {/* Date Field - only for daily, show for weekly too */}
                      <div className="mb-3">
                        <label className="text-xs font-medium text-gray-700 uppercase tracking-wide block mb-1">
                          Date
                        </label>
                        <input
                          type="date"
                          value={subject.date}
                          onChange={(e) =>
                            updateSubject(subject.id, "date", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-300 transition-colors bg-white"
                          required
                        />
                      </div>

                      {/* Subject Dropdown */}
                      <div className="mb-3">
                        <label className="text-xs font-medium text-gray-700 uppercase tracking-wide block mb-1">
                          Subject
                        </label>
                        <select
                          value={subject.subject}
                          onChange={(e) =>
                            updateSubject(subject.id, "subject", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-300 transition-colors bg-white"
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

                      {/* Platform */}
                      <div className="mb-3">
                        <label className="text-xs font-medium text-gray-700 uppercase tracking-wide block mb-1">
                          Platform/Resource
                        </label>
                        <input
                          type="text"
                          value={subject.platform}
                          onChange={(e) =>
                            updateSubject(subject.id, "platform", e.target.value)
                          }
                          placeholder="e.g., Khan Academy, IXL, Textbook"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-300 transition-colors bg-white"
                          required
                        />
                      </div>

                      {/* Topics */}
                      <div className="mb-3">
                        <label className="text-xs font-medium text-gray-700 uppercase tracking-wide block mb-1">
                          Specific Topics Covered
                        </label>
                        <textarea
                          value={subject.topics}
                          onChange={(e) =>
                            updateSubject(subject.id, "topics", e.target.value)
                          }
                          placeholder="e.g., Fractions: adding, subtracting, converting"
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-300 transition-colors resize-none bg-white"
                          required
                        />
                      </div>

                      {/* Duration */}
                      <div>
                        <label className="text-xs font-medium text-gray-700 uppercase tracking-wide block mb-1">
                          Duration
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={subject.duration}
                            onChange={(e) =>
                              updateSubject(subject.id, "duration", e.target.value)
                            }
                            placeholder={input.reportType === "weekly" ? "1.5" : "45"}
                            min="0.25"
                            step="0.25"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-300 transition-colors bg-white"
                            required
                          />
                          <div className="flex items-center text-xs text-gray-700 px-2">
                            {input.reportType === "weekly" ? "hrs" : "min"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-gray-900 uppercase tracking-wide block mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={input.notes}
                  onChange={(e) =>
                    setInput({ ...input, notes: e.target.value })
                  }
                  placeholder="Any additional details about performance, challenges, or achievements..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-300 transition-colors resize-none bg-white"
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
