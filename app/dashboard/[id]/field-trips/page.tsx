"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import Navbar from "@/components/Navbar";
import {
  getFieldTrips,
  addFieldTrip,
  deleteFieldTrip,
  updateFieldTrip,
} from "@/lib/supabase-data";

export const dynamic = "force-dynamic";

interface FieldTrip {
  id: string;
  kid_id: string;
  trip_name: string;
  destination: string;
  date: string;
  notes?: string;
  created_at?: string;
}

interface Kid {
  id: string;
  name: string;
  age?: number;
  grade?: string;
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

export default function FieldTripsPage() {
  const params = useParams();
  const router = useRouter();
  const kidId = params.id as string;

  const [userId, setUserId] = useState("");
  const [kid, setKid] = useState<Kid | null>(null);
  const [trips, setTrips] = useState<FieldTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formTripName, setFormTripName] = useState("");
  const [formDestination, setFormDestination] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const sessionStr = localStorage.getItem("kernlo_session");
        if (sessionStr) {
          try {
            const session = JSON.parse(sessionStr);
            await supabase.auth.setSession(session);
          } catch (e) {
            console.log("Could not restore session");
          }
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/auth/login");
          return;
        }

        setUserId(user.id);

        // Load kid data
        const { data: kidData } = await supabase
          .from("kids")
          .select("*")
          .eq("id", kidId)
          .eq("user_id", user.id)
          .single();

        if (kidData) {
          setKid(kidData as Kid);

          // Load field trips
          try {
            const tripsData = await getFieldTrips(user.id, kidId);
            setTrips(tripsData as FieldTrip[]);
          } catch (err) {
            console.error("Error loading field trips:", err);
            setTrips([]);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Error initializing:", err);
        setLoading(false);
      }
    };

    init();
  }, [kidId, router]);

  const handleSubmit = async () => {
    if (!formTripName.trim() || !formDestination.trim() || !formDate) {
      alert("Trip name, destination, and date are required");
      return;
    }

    try {
      if (editingId) {
        // Update
        await updateFieldTrip(editingId, {
          trip_name: formTripName,
          destination: formDestination,
          date: formDate,
          notes: formNotes || undefined,
        });
      } else {
        // Add new
        await addFieldTrip(userId, kidId, formTripName, formDestination, formDate, formNotes);
      }

      // Reload field trips
      const tripsData = await getFieldTrips(userId, kidId);
      setTrips(tripsData as FieldTrip[]);

      // Reset form
      setFormTripName("");
      setFormDestination("");
      setFormDate(new Date().toISOString().split("T")[0]);
      setFormNotes("");
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      console.error("Error saving field trip:", err);
      alert("Failed to save field trip");
    }
  };

  const handleDelete = async (tripId: string) => {
    if (!confirm("Delete this field trip?")) return;

    try {
      await deleteFieldTrip(tripId);
      setTrips(trips.filter((t) => t.id !== tripId));
    } catch (err) {
      console.error("Error deleting field trip:", err);
      alert("Failed to delete field trip");
    }
  };

  const handleEdit = (trip: FieldTrip) => {
    setEditingId(trip.id);
    setFormTripName(trip.trip_name);
    setFormDestination(trip.destination);
    setFormDate(trip.date);
    setFormNotes(trip.notes || "");
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormTripName("");
    setFormDestination("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormNotes("");
  };

  return (
    <>
      <Navbar />
      <main style={{ backgroundColor: COLORS.light, minHeight: "100vh" }}>
        {/* Header */}
        <div style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb" }} className="sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <Link href={`/dashboard/${kidId}`} style={{ color: COLORS.primary }} className="text-sm font-medium mb-2 block">
                ← Back to {kid?.name || "Kid"}
              </Link>
              <h1 style={{ color: COLORS.dark }} className="text-2xl font-bold">
                🚌 Field Trips
              </h1>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              style={{ backgroundColor: COLORS.primary }}
              className="px-4 sm:px-6 py-2.5 text-white font-medium rounded-lg hover:opacity-90 text-sm min-h-12 sm:min-h-auto"
            >
              {showForm ? "Cancel" : "+ Add Trip"}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          {/* Add/Edit Form */}
          {showForm && (
            <div style={{ backgroundColor: "white", borderRadius: "12px", borderLeft: `4px solid ${COLORS.accent1}` }} className="p-6 mb-6">
              <h2 style={{ color: COLORS.dark }} className="text-lg font-bold mb-4">
                {editingId ? "Edit Field Trip" : "Add New Field Trip"}
              </h2>
              <div className="space-y-4 mb-6">
                <div>
                  <label style={{ color: "#333" }} className="block text-sm font-medium mb-2">
                    Trip Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Science Museum, Zoo, Art Gallery"
                    value={formTripName}
                    onChange={(e) => setFormTripName(e.target.value)}
                    style={{ color: "#1a1a2e" }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label style={{ color: "#333" }} className="block text-sm font-medium mb-2">
                    Destination *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Local Museum, State Park, Downtown Library"
                    value={formDestination}
                    onChange={(e) => setFormDestination(e.target.value)}
                    style={{ color: "#1a1a2e" }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label style={{ color: "#333" }} className="block text-sm font-medium mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    style={{ color: "#1a1a2e" }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label style={{ color: "#333" }} className="block text-sm font-medium mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    placeholder="What did you learn? Highlights of the trip?"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    style={{ color: "#1a1a2e" }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3 flex-col">
                <button
                  onClick={handleSubmit}
                  style={{ backgroundColor: COLORS.primary }}
                  className="w-full px-4 py-3 text-white font-semibold rounded-lg hover:opacity-90 text-sm min-h-12"
                >
                  {editingId ? "Update Trip" : "Add Trip"}
                </button>
                <button
                  onClick={handleCancel}
                  style={{ color: COLORS.dark, borderColor: "#333" }}
                  className="w-full px-4 py-3 border font-semibold rounded-lg hover:bg-gray-50 text-sm min-h-12"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Field Trips List */}
          {loading ? (
            <div className="text-center py-12">
              <p style={{ color: "#555" }}>Loading...</p>
            </div>
          ) : trips.length === 0 ? (
            <div style={{ backgroundColor: "white", borderRadius: "12px" }} className="p-6 sm:p-8 text-center border border-gray-200">
              <p style={{ color: "#555" }} className="mb-4">
                No field trips logged yet.
              </p>
              <button
                onClick={() => setShowForm(true)}
                style={{ backgroundColor: COLORS.primary }}
                className="px-6 py-3 text-white font-medium rounded-lg hover:opacity-90 min-h-12"
              >
                + Add First Trip
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  style={{ backgroundColor: "white", borderRadius: "12px" }}
                  className="p-4 border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div>
                          <h3 style={{ color: COLORS.dark }} className="text-lg font-bold">
                            {trip.trip_name}
                          </h3>
                          <p style={{ color: "#666" }} className="text-sm">
                            📍 {trip.destination}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span style={{ backgroundColor: "#fff3cd", color: "#856404" }} className="px-2 py-1 rounded text-xs font-medium">
                          {new Date(trip.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      {trip.notes && (
                        <p style={{ color: "#666" }} className="text-sm mt-2">
                          {trip.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0 flex-wrap sm:flex-nowrap">
                      <button
                        onClick={() => handleEdit(trip)}
                        style={{ color: COLORS.primary }}
                        className="px-4 py-2 text-sm font-medium hover:opacity-70 min-h-10 active:bg-blue-50 rounded"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(trip.id)}
                        style={{ color: COLORS.accent1 }}
                        className="px-4 py-2 text-sm font-medium hover:opacity-70 min-h-10 active:bg-red-50 rounded"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
