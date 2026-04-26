"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/supabase-auth";
import { useRouter } from "next/navigation";

const COLORS = {
  primary: "#0066cc",
  dark: "#1a1a2e",
};

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("kernlo_access_token");
    setIsLoggedIn(!!token);
  }, [pathname]);

  async function handleLogout() {
    await signOut();
    setMenuOpen(false);
    setIsLoggedIn(false);
    router.push("/");
  }

  return (
    <nav style={{ backgroundColor: "white", borderBottom: `1px solid #e5e7eb` }} className="sticky top-0 left-0 right-0 z-50">
      <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <div style={{ color: COLORS.primary }} className="text-2xl font-bold hover:opacity-80 transition">
            kernlo
          </div>
        </Link>

        {/* Hamburger Menu - Only on mobile/tablet if logged in */}
        {isLoggedIn && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
              style={{ color: COLORS.primary }}
              aria-label="Menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div
                style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
                className="absolute right-0 mt-2 w-48 z-50"
              >
                {/* Menu Items */}
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  style={{ color: COLORS.primary, borderBottom: "1px solid #e5e7eb" }}
                  className="block px-4 py-3 text-sm font-medium hover:bg-gray-50"
                >
                  Dashboard
                </Link>

                {/* Logout at Bottom */}
                <button
                  onClick={handleLogout}
                  style={{ color: "#c62828" }}
                  className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-50 rounded-b-lg"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
