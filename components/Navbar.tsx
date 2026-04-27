"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/supabase-auth";
import { useRouter } from "next/navigation";
import ParentProfileModal from "./ParentProfileModal";

const COLORS = {
  primary: "#0066cc",
  dark: "#1a1a2e",
};

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in and extract user info
    const token = localStorage.getItem("kernlo_access_token");
    setIsLoggedIn(!!token);
    
    if (token) {
      try {
        // Decode JWT to get user info
        const parts = token.split('.');
        if (parts.length === 3) {
          const decoded = JSON.parse(atob(parts[1]));
          setUserId(decoded.sub || "");
          setUserEmail(decoded.email || "");
        }
      } catch (e) {
        console.log("Could not decode token");
      }
    }
  }, [pathname]);

  async function handleLogout() {
    await signOut();
    setIsLoggedIn(false);
    router.push("/");
  }

  return (
    <>
      <ParentProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        userId={userId}
        userEmail={userEmail}
      />
      <nav style={{ backgroundColor: "white", borderBottom: `1px solid #e5e7eb` }} className="sticky top-0 left-0 right-0 z-50">
      <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <div style={{ color: COLORS.primary }} className="text-2xl font-bold hover:opacity-80 transition">
            kernlo
          </div>
        </Link>


      </div>
    </nav>
    </>
  );
}
