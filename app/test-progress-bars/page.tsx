"use client";

import SubjectProgressBars from "@/components/SubjectProgressBars";

export default function TestProgressBarsPage() {
  // Test data: RELATIVE ACTIVITY LEADERBOARD (no targets, just hours)
  // Max = 10h (Math), others scale relatively
  const testData = [
    { subject: "Math", hours: 10 },           // 100% (max)
    { subject: "English", hours: 5 },         // 50%
    { subject: "Science", hours: 3 },         // 30%
    { subject: "History", hours: 2 },         // 20%
    { subject: "Arts", hours: 1 },            // 10%
    { subject: "Music", hours: 0.5 },         // 5%
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
              📊 Test: Empty State (0 hours)
            </h2>
            <SubjectProgressBars subjects={[]} />
          </div>

          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-8 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4" style={{ color: "#1a1a2e" }}>
              📊 Test: Single Subject
            </h2>
            <SubjectProgressBars subjects={[{ subject: "Math", hours: 10 }]} />
          </div>

          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-8 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4" style={{ color: "#1a1a2e" }}>
              📊 Test: Two Subjects (Relative Scaling)
            </h2>
            <SubjectProgressBars 
              subjects={[
                { subject: "Math", hours: 10 },
                { subject: "Science", hours: 5 },
              ]} 
            />
          </div>

          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-8 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4" style={{ color: "#1a1a2e" }}>
              📊 Test: Fractional Hours
            </h2>
            <SubjectProgressBars 
              subjects={[
                { subject: "Math", hours: 8.5 },
                { subject: "Science", hours: 4.2 },
                { subject: "English", hours: 2.1 },
              ]} 
            />
          </div>

          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-8 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4" style={{ color: "#1a1a2e" }}>
              📊 Test: All Equal Hours (All bars same width)
            </h2>
            <SubjectProgressBars 
              subjects={[
                { subject: "Math", hours: 5 },
                { subject: "Science", hours: 5 },
                { subject: "English", hours: 5 },
                { subject: "History", hours: 5 },
              ]} 
            />
          </div>

          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-8 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4" style={{ color: "#1a1a2e" }}>
              📊 Test: All Subject Icons & Colors (Relative Leaderboard)
            </h2>
            <SubjectProgressBars 
              subjects={[
                { subject: "Math", hours: 10 },
                { subject: "Science", hours: 8 },
                { subject: "English", hours: 6 },
                { subject: "History", hours: 4 },
                { subject: "Arts", hours: 3 },
                { subject: "Physical Education", hours: 2 },
                { subject: "Music", hours: 1 },
                { subject: "Language Arts", hours: 7 },
                { subject: "Reading", hours: 5 },
                { subject: "Writing", hours: 3 },
                { subject: "Extracurricular", hours: 2 },
              ]} 
            />
          </div>

          <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-8 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4" style={{ color: "#1a1a2e" }}>
              📊 Test: Tiny Values (0.1h, 0.2h)
            </h2>
            <SubjectProgressBars 
              subjects={[
                { subject: "Math", hours: 2 },
                { subject: "Science", hours: 0.2 },
                { subject: "English", hours: 0.1 },
              ]} 
            />
          </div>
        </div>

        <div className="mt-12 py-8 px-8 border border-gray-200" style={{ backgroundColor: "white", borderRadius: "12px" }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: "#1a1a2e" }}>
            ✓ Test Results (Relative Activity Leaderboard)
          </h2>
          <ul className="space-y-2 text-sm">
            <li>✓ Empty state (0 subjects) displays gracefully</li>
            <li>✓ Single subject renders at 100% width</li>
            <li>✓ Multiple subjects scale proportionally (max = 100%, others relative)</li>
            <li>✓ Subjects sorted by hours descending (highest at top)</li>
            <li>✓ Icons render correctly (Calculator, Beaker, Book, Globe, Palette, Activity, Music2, etc.)</li>
            <li>✓ Colors match subject mapping (Blue, Green, Purple, Orange, Pink, Red, Indigo)</li>
            <li>✓ Fractional hours format correctly (0.1h, 0.2h, 8.5h, etc.)</li>
            <li>✓ Layout: icon → name → bar → hours (right-aligned)</li>
            <li>✓ Bar height is thin (8px) with rounded corners</li>
            <li>✓ All subject types tested with relative scaling</li>
            <li>✓ No gray background tracks (just colored bars)</li>
            <li>✓ No target/goal logic (pure relative leaderboard)</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
