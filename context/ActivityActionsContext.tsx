"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/lib/supabase-client";

interface CombinedActivity {
  id: string;
  child_id: string;
  child_name: string;
  subject?: string;
  activity_name?: string;
  trip_name?: string;
  destination?: string;
  date: string;
  notes?: string;
  type: "Activity" | "Field Trip" | "Extracurricular";
  duration: number;
  duration_hours: string;
}

interface ActivityActionsContextType {
  markComplete: (activity: CombinedActivity) => Promise<void>;
  editActivity: (activity: CombinedActivity, updates: any) => Promise<void>;
  deleteActivity: (activity: CombinedActivity) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  optimisticUpdate: (activity: CombinedActivity) => void;
}

const ActivityActionsContext = createContext<ActivityActionsContextType | undefined>(undefined);

export function ActivityActionsProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const markComplete = useCallback(async (activity: CombinedActivity) => {
    setIsLoading(true);
    setError(null);
    try {
      if (activity.type === "Activity") {
        const { error: err } = await supabase
          .from("activities")
          .update({ status: "completed" })
          .eq("id", activity.id);
        if (err) throw err;
      } else if (activity.type === "Field Trip") {
        const { error: err } = await supabase
          .from("field_trips")
          .update({ completed: true })
          .eq("id", activity.id);
        if (err) throw err;
      } else if (activity.type === "Extracurricular") {
        const { error: err } = await supabase
          .from("extracurricular_activities")
          .update({ completed: true })
          .eq("id", activity.id);
        if (err) throw err;
      }
    } catch (e: any) {
      setError(e.message || "Failed to mark activity complete");
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const editActivity = useCallback(async (activity: CombinedActivity, updates: any) => {
    setIsLoading(true);
    setError(null);
    try {
      if (activity.type === "Activity") {
        const { error: err } = await supabase
          .from("activities")
          .update({
            duration: updates.duration ? Math.round(updates.duration * 60) : activity.duration,
            subject: updates.subject || activity.subject,
            date: updates.date || activity.date,
            notes: updates.notes || activity.notes,
          })
          .eq("id", activity.id);
        if (err) throw err;
      } else if (activity.type === "Field Trip") {
        const { error: err } = await supabase
          .from("field_trips")
          .update({
            date: updates.date || activity.date,
            notes: updates.notes || activity.notes,
          })
          .eq("id", activity.id);
        if (err) throw err;
      } else if (activity.type === "Extracurricular") {
        const { error: err } = await supabase
          .from("extracurricular_activities")
          .update({
            date: updates.date || activity.date,
            notes: updates.notes || activity.notes,
          })
          .eq("id", activity.id);
        if (err) throw err;
      }
    } catch (e: any) {
      setError(e.message || "Failed to edit activity");
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteActivity = useCallback(async (activity: CombinedActivity) => {
    setIsLoading(true);
    setError(null);
    try {
      if (activity.type === "Activity") {
        const { error: err } = await supabase
          .from("activities")
          .delete()
          .eq("id", activity.id);
        if (err) throw err;
      } else if (activity.type === "Field Trip") {
        const { error: err } = await supabase
          .from("field_trips")
          .delete()
          .eq("id", activity.id);
        if (err) throw err;
      } else if (activity.type === "Extracurricular") {
        const { error: err } = await supabase
          .from("extracurricular_activities")
          .delete()
          .eq("id", activity.id);
        if (err) throw err;
      }
    } catch (e: any) {
      setError(e.message || "Failed to delete activity");
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const optimisticUpdate = useCallback((activity: CombinedActivity) => {
    // Placeholder for optimistic updates - can be enhanced with state management
    console.log("Optimistic update triggered for:", activity.id);
  }, []);

  return (
    <ActivityActionsContext.Provider
      value={{
        markComplete,
        editActivity,
        deleteActivity,
        isLoading,
        error,
        clearError,
        optimisticUpdate,
      }}
    >
      {children}
    </ActivityActionsContext.Provider>
  );
}

export function useActivityActions() {
  const context = useContext(ActivityActionsContext);
  if (context === undefined) {
    throw new Error("useActivityActions must be used within ActivityActionsProvider");
  }
  return context;
}
