import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Reports are stored in localStorage client-side
    // This endpoint is for future Supabase integration
    return NextResponse.json({
      message: "Reports stored in localStorage",
      reports: [],
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}
