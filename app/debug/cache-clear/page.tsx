"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CacheClearPage() {
  const router = useRouter();
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    // Clear all localStorage
    localStorage.clear();
    
    // Clear session storage
    sessionStorage.clear();
    
    // Force reload after 1 second to clear service workers and browser cache
    setTimeout(() => {
      setCleared(true);
      // Redirect home after clearing
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    }, 500);
  }, [router]);

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Cache Cleared</h1>
      {cleared ? (
        <>
          <p>✅ All caches cleared. Redirecting...</p>
          <p style={{ fontSize: "12px", color: "#666" }}>
            localStorage, sessionStorage, and browser cache have been cleared.
          </p>
        </>
      ) : (
        <p>Clearing caches...</p>
      )}
    </div>
  );
}
