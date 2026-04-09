import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Reports are saved client-side to localStorage
    // This endpoint is for future Supabase integration
    return NextResponse.json({
      message: "Report saved to localStorage",
      success: true,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to save report" },
      { status: 500 }
    );
  }
}
