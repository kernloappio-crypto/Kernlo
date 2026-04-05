import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("X-User-ID");
    const token = req.headers.get("Authorization")?.split(" ")[1];

    if (!userId || !token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify token by getting user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch reports for this user
    const { data: reports, error: reportsError } = await supabase
      .from("reports")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (reportsError) {
      console.error("Reports fetch error:", reportsError);
      return NextResponse.json(
        { error: "Failed to fetch reports" },
        { status: 500 }
      );
    }

    // Count reports created this month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const reportsThisMonth = reports?.filter((r) => {
      const created = new Date(r.created_at);
      return created >= firstDayOfMonth;
    }).length || 0;

    return NextResponse.json({
      reports: reports || [],
      usageCount: reportsThisMonth,
      email: user.email,
    });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
