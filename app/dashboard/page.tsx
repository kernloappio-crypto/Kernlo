"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import Navbar from "@/components/Navbar";
import { signOut } from "@/lib/supabase-auth";

export const dynamic = "force-dynamic";

interface Kid {
  id: string;
  name: string;
  age?: number;
  grade?: string;
}

interface Activity {
  id: string;
  child_name: string;
  subject: string;
  duration: number;
  platform: string;
  date: string;
  notes?: string;
}

interface Goal {
  id: string;
  child_name: string;
  subject: string;
  monthly_hours: number;
}

const COLORS = {
  primary: "#0066cc",
  secondary: "#00d4ff",
  accent1: "#ff6b6b",
  accent2: "#ffd93d",
  accent3: "#6bcf7f",
  dark: "#1a1a2e",
  light: "#f0f7ff",
};

export default function DashboardPage() {
  const [userId, setUserId] = useState("");
  const [kids, setKids] = useState<Kid[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddKid, setShowAddKid] = useState(false);
  const [newKidName, setNewKidName] = useState("");
  const [newKidAge, setNewKidAge] = useState("");
  const [newKidGrade, setNewKidGrade] = useState("");
  const [email, setEmail] = useState("");
  const router = useRouter();

  useEffect(() => {
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/auth/login");
        return;
      }

      setUserId(user.id);
      setEmail(user.email || "");
      
      // Load kids
      const { data: kidsData } = await supabase
        .from("kids")
        .select("*")
        .eq("user_id", user.id);

      if (kidsData) {
        setKids(kidsData);
      }

      setLoading(false);
    };
    
    initUser();
  }, [router]);

  async function handleAddKid() {
    if (!newKidName.trim()) {
      alert("Kid name is required");
      return;
    }

    if (kids.length >= 5) {
      alert("Pro tier limited to 5 children");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("kids")
        .insert({
          user_id: userId,
          name: newKidName,
          age: newKidAge ? parseInt(newKidAge) : null,
          grade: newKidGrade || null,
        })
        .select();

      if (error) {
        alert("Error: " + error.message);
        return;
      }

      if (data) {
        setKids([...kids, ...data]);
      }

      setNewKidName("");
      setNewKidAge("");
      setNewKidGrade("");
      setShowAddKid(false);
    } catch (err) {
      alert("Failed to add kid");
    }
  }

  async function handleLogout() {
    await signOut();
    router.push("/");
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <>
      <Navbar />
      <main style={{ backgroundColor: COLORS.light, minHeight: "100vh" }}>
        <div style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb" }} className="p-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div>
              <h1 style={{ color: COLORS.dark }} className="text-3xl font-bold">
                Dashboard
              </h1>
              <p style={{ color: "#666" }} className="text-sm">
                Welcome, {email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              style={{ borderColor: COLORS.primary, color: COLORS.primary }}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 style={{ color: COLORS.dark }} className="text-2xl font-bold">
              Your Kids
            </h2>
            <button
              onClick={() => setShowAddKid(!showAddKid)}
              style={{ backgroundColor: COLORS.primary }}
              className="px-6 py-2 text-white rounded-lg hover:opacity-90 font-medium"
            >
              {showAddKid ? "Cancel" : "+ Add Kid"}
            </button>
          </div>

          {showAddKid && (
            <div style={{ backgroundColor: "white", borderLeft: `4px solid ${COLORS.primary}` }} className="p-6 rounded mb-8">
              <div className="space-y-4 max-w-md">
                <input
                  type="text"
                  value={newKidName}
                  onChange={(e) => setNewKidName(e.target.value)}
                  placeholder="Kid's name"
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <input
                  type="number"
                  value={newKidAge}
                  onChange={(e) => setNewKidAge(e.target.value)}
                  placeholder="Age (optional)"
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  value={newKidGrade}
                  onChange={(e) => setNewKidGrade(e.target.value)}
                  placeholder="Grade (optional)"
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <button
                  onClick={handleAddKid}
                  style={{ backgroundColor: COLORS.primary }}
                  className="w-full px-4 py-2 text-white rounded-lg hover:opacity-90"
                >
                  Add Kid
                </button>
              </div>
            </div>
          )}

          {kids.length === 0 ? (
            <p style={{ color: "#999" }}>No kids added yet. Click "Add Kid" to get started!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {kids.map((kid) => (
                <div key={kid.id} style={{ backgroundColor: "white", borderLeft: `4px solid ${COLORS.primary}` }} className="p-6 rounded">
                  <h3 style={{ color: COLORS.dark }} className="text-xl font-bold mb-2">
                    {kid.name}
                  </h3>
                  {kid.age && <p style={{ color: "#666" }} className="text-sm mb-4">Age: {kid.age}</p>}
                  {kid.grade && <p style={{ color: "#666" }} className="text-sm mb-4">Grade: {kid.grade}</p>}
                  <Link
                    href={`/dashboard/${kid.id}`}
                    style={{ backgroundColor: COLORS.primary }}
                    className="inline-block px-6 py-2 text-white rounded-lg hover:opacity-90 font-medium text-sm"
                  >
                    View Dashboard
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
