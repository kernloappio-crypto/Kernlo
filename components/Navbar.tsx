"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/supabase-auth";
import { useRouter } from "next/navigation";
import ParentProfileModal from "./ParentProfileModal";

const COLORS = {
  primary: "#0066cc",
  secondary: "#00d4ff",
  dark: "#1a1a2e",
};

interface NavbarProps {}

export default function Navbar({}: NavbarProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentKidId, setCurrentKidId] = useState("");
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

    // Extract kid ID from URL if in dashboard
    const match = pathname.match(/\/dashboard\/([a-f0-9\-]+)/);
    if (match) {
      setCurrentKidId(match[1]);
    }
  }, [pathname]);

  async function handleLogout() {
    await signOut();
    setIsLoggedIn(false);
    setMobileMenuOpen(false);
    router.push("/");
  }

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isMenuOpen = target.closest('[data-menu]') || target.closest('[data-hamburger]');
      if (!isMenuOpen && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [mobileMenuOpen]);

  return (
    <>
      <ParentProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        userId={userId}
        userEmail={userEmail}
        onProfileUpdate={() => {
          // Refresh the page to update the dashboard with new state
          window.location.reload();
        }}
      />
      <nav style={{ backgroundColor: "white", borderBottom: `1px solid #e5e7eb` }} className="sticky top-0 left-0 right-0 z-50">
        <div className="px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center">
            <div style={{ color: COLORS.primary }} className="text-2xl font-bold hover:opacity-80 transition">
              kernlo
            </div>
          </Link>

          {/* Hamburger Menu - Always visible */}
          {isLoggedIn && (
            <div className="relative">
                <button
                  data-hamburger
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  style={{ color: COLORS.dark }}
                  className="p-2 rounded-lg hover:bg-gray-100 transition"
                  aria-label="Toggle menu"
                >
                  {/* Hamburger Icon */}
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {mobileMenuOpen && (
                  <div
                    data-menu
                    style={{
                      backgroundColor: "white",
                      borderColor: "#e5e7eb",
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    }}
                    className="absolute right-0 top-full mt-2 w-48 rounded-lg border overflow-hidden"
                  >
                    {/* Profile Button */}
                    <button
                      onClick={() => {
                        setProfileModalOpen(true);
                        setMobileMenuOpen(false);
                      }}
                      style={{ color: COLORS.dark }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition font-medium text-sm border-b border-gray-200"
                    >
                      👤 Profile
                    </button>

                    {/* Settings Button */}
                    {currentKidId && (
                      <Link
                        href={`/dashboard/${currentKidId}/settings`}
                        onClick={() => setMobileMenuOpen(false)}
                        style={{ color: COLORS.dark }}
                        className="block px-4 py-3 text-left hover:bg-gray-50 transition font-medium text-sm border-b border-gray-200"
                      >
                        ⚙️ Settings
                      </Link>
                    )}

                    {/* Logout Button */}
                    <button
                      onClick={handleLogout}
                      style={{ color: "#dc2626" }}
                      className="w-full px-4 py-3 text-left hover:bg-red-50 transition font-medium text-sm"
                    >
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            )}
        </div>
      </nav>
    </>
  );
}
