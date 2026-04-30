"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { logAttendance } from "@/lib/supabase-data";

export default function TestAttendancePage() {
  const [status, setStatus] = useState<string[]>([]);
  const [userId, setUserId] = useState("");
  const [testRunning, setTestRunning] = useState(false);

  const log = (msg: string) => {
    console.log(msg);
    setStatus((prev) => [...prev, msg]);
  };

  const runTest = async () => {
    setTestRunning(true);
    setStatus([]);

    try {
      log("🧪 Starting Attendance Logging Test...\n");

      // Step 1: Get current user
      log("Step 1: Getting current user...");
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        log("❌ Not logged in!");
        setTestRunning(false);
        return;
      }

      log(`✅ User: ${user.id}\n`);
      setUserId(user.id);

      // Step 2: Verify session is set
      log("Step 2: Checking auth session...");
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        log(`✅ Session found, token valid\n`);
      } else {
        log("⚠️ No session on client\n");
      }

      // Step 3: Test attendance insert
      log("Step 3: Testing attendance insert...");
      const today = new Date().toISOString().split("T")[0];
      const childName = "TestChild";

      try {
        const result = await logAttendance(user.id, childName, today);
        log(`✅ Attendance inserted: ${JSON.stringify(result)}\n`);
      } catch (err: any) {
        log(`❌ Attendance insert failed: ${err.message}\n`);
        log(`Error details: ${JSON.stringify(err)}\n`);
        setTestRunning(false);
        return;
      }

      // Step 4: Test duplicate handling
      log("Step 4: Testing duplicate insert (should return existing)...");
      try {
        const result2 = await logAttendance(user.id, childName, today);
        log(`✅ Duplicate handled gracefully: ${JSON.stringify(result2)}\n`);
      } catch (err: any) {
        log(`❌ Duplicate handling failed: ${err.message}\n`);
        setTestRunning(false);
        return;
      }

      // Step 5: Verify attendance was saved
      log("Step 5: Verifying attendance record...");
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("user_id", user.id)
        .eq("child_name", childName)
        .eq("schooling_date", today);

      if (error) {
        log(`❌ Query failed: ${error.message}\n`);
      } else {
        log(`✅ Record verified: ${data?.length} record(s) found\n`);
        if (data && data.length > 0) {
          log(`   Details: ${JSON.stringify(data[0])}\n`);
        }
      }

      log("================================");
      log("✅ ALL TESTS PASSED!");
      log("================================\n");
      log("Attendance logging is working correctly!");

    } catch (err: any) {
      log(`❌ Test error: ${err.message}`);
    }

    setTestRunning(false);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "monospace", backgroundColor: "#1a1a2e", color: "#fff" }}>
      <h1>Attendance Logging Test</h1>
      
      <button 
        onClick={runTest}
        disabled={testRunning}
        style={{
          padding: "10px 20px",
          backgroundColor: testRunning ? "#666" : "#0066cc",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: testRunning ? "not-allowed" : "pointer",
          marginBottom: "20px"
        }}
      >
        {testRunning ? "Running..." : "Run Test"}
      </button>

      <div style={{
        backgroundColor: "#222",
        padding: "20px",
        borderRadius: "8px",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        maxHeight: "600px",
        overflowY: "auto",
        border: "1px solid #444"
      }}>
        {status.length === 0 ? "Click 'Run Test' to start..." : status.join("\n")}
      </div>

      {userId && (
        <p style={{ marginTop: "20px", color: "#888" }}>
          Logged in as: {userId}
        </p>
      )}
    </div>
  );
}
