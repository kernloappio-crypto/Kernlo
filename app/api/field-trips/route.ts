import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const childId = searchParams.get("childId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!childId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Get authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get current user session
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch field trip activities
    const { data: activities, error } = await supabase
      .from("field_trips")
      .select("*")
      .eq("kid_id", childId)
      .eq("user_id", user.id)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      activities: activities || [],
    });
  } catch (error: any) {
    console.error("Error fetching field trips:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch field trips" },
      { status: 500 }
    );
  }
}
