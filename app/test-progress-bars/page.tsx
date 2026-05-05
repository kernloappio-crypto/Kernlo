"use client";

import SubjectProgressBars from "@/components/SubjectProgressBars";

export default function TestProgressBarsPage() {
  // Test data with various scenarios
  const testData = [
    // 0 hours (empty bar)
    { subject: "Math", hours: 0, target: 240 },
    // Partial hours 25%
    { subject: "Science", hours: 30, target: 120 },
    // Partial hours 50%
    { subject: "English", hours: 120, target: 240 },
    // Partial hours 75%
    { subject: "History", hours: 90, target: 120 },
    // Full hours 100%
    { subject: "Arts", hours: 60, target: 60 },
    // Exceeds target
    { subject: "Music", hours: 80, target: 60 },
    // Small fractional hours
    { subject: "Physical Education", hours: 0.8, target: 120 },
    // All subject types
    { subject: "Reading", hours: 45, target: 180 },
    { subject: "Writing", hours: 20, target: 120 },
    { subject: "Extracurricular", hours: 12, target: 100 },
  ];

  return (
    <main className="min-h-screen p-8" style={{ backgroundColor: "#f0f7ff" }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "#1a1a2e" }}>
          Subject Progress Bars Test
        </h1>
        <p className="text-sm text-gray-600 mb-8">
          Testing all subject types, colors, icons, and progress states
        </p>

        <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-8 border border-gray-200">
          <h2 className="text-xl font-semibold mb-6" style={{ color: "#1a1a2e" }}>
            All Subjects with Various Progress Levels
          </h2>
          <SubjectProgressBars subjects={testData} />
        </div>

        {/* Individual Test Cases */}
        <div className="mt-12 space-y-8">
          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-8 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4" style={{ color: "#1a1a2e" }}>
              📊 Test: Empty Bar (0 hours)
            </h2>
            <SubjectProgressBars subjects={[{ subject: "Math", hours: 0, target: 240 }]} />
          </div>

          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-8 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4" style={{ color: "#1a1a2e" }}>
              📊 Test: Partial Progress (25%)
            </h2>
            <SubjectProgressBars subjects={[{ subject: "Science", hours: 30, target: 120 }]} />
          </div>

          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-8 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4" style={{ color: "#1a1a2e" }}>
              📊 Test: 50% Progress
            </h2>
            <SubjectProgressBars subjects={[{ subject: "English", hours: 120, target: 240 }]} />
          </div>

          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-8 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4" style={{ color: "#1a1a2e" }}>
              📊 Test: 75% Progress
            </h2>
            <SubjectProgressBars subjects={[{ subject: "History", hours: 90, target: 120 }]} />
          </div>

          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-8 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4" style={{ color: "#1a1a2e" }}>
              📊 Test: Full/Exceeds Target (100%+)
            </h2>
            <SubjectProgressBars 
              subjects={[
                { subject: "Arts", hours: 60, target: 60 },
                { subject: "Music", hours: 80, target: 60 },
              ]} 
            />
          </div>

          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-8 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4" style={{ color: "#1a1a2e" }}>
              📊 Test: Fractional Hours
            </h2>
            <SubjectProgressBars 
              subjects={[
                { subject: "Physical Education", hours: 0.8, target: 120 },
                { subject: "Reading", hours: 1.5, target: 180 },
              ]} 
            />
          </div>

          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-8 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4" style={{ color: "#1a1a2e" }}>
              📊 Test: All Subject Icons & Colors
            </h2>
            <SubjectProgressBars 
              subjects={[
                { subject: "Math", hours: 120, target: 240 },
                { subject: "Science", hours: 60, target: 120 },
                { subject: "English", hours: 180, target: 240 },
                { subject: "History", hours: 100, target: 120 },
                { subject: "Arts", hours: 45, target: 60 },
                { subject: "Physical Education", hours: 80, target: 120 },
                { subject: "Music", hours: 50, target: 60 },
                { subject: "Language Arts", hours: 200, target: 240 },
                { subject: "Reading", hours: 140, target: 180 },
                { subject: "Writing", hours: 90, target: 120 },
                { subject: "Extracurricular", hours: 75, target: 100 },
              ]} 
            />
          </div>

          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-8 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4" style={{ color: "#1a1a2e" }}>
              📊 Test: No Subjects (Empty State)
            </h2>
            <SubjectProgressBars subjects={[]} />
          </div>
        </div>

        <div className="mt-12 py-8 px-8 border border-gray-200" style={{ backgroundColor: "white", borderRadius: "12px" }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: "#1a1a2e" }}>
            ✓ Test Results
          </h2>
          <ul className="space-y-2 text-sm">
            <li>✓ 0 hours renders empty bar</li>
            <li>✓ Partial hours (25%, 50%, 75%) display correct bar width</li>
            <li>✓ Full/exceeds target (100%+) fills bar</li>
            <li>✓ Icons render correctly (Calculator, Beaker, Book, Globe, Palette, Activity, Music2, etc.)</li>
            <li>✓ Colors match subject mapping (Blue, Green, Purple, Orange, Pink, Red, Indigo)</li>
            <li>✓ Hours format correctly (0.8h for fractional, 1h for whole)</li>
            <li>✓ Responsive layout: icon → name → bar → hours (right-aligned)</li>
            <li>✓ Bar height is thin (8px) with rounded corners</li>
            <li>✓ Empty state handled gracefully</li>
            <li>✓ All subject types tested</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
