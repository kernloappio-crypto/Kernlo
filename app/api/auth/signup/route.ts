import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials:", { supabaseUrl, supabaseKey });
  throw new Error("Missing Supabase credentials");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Sign up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("Supabase signup error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      user: data.user,
      session: data.session,
    });
  } catch (err) {
    console.error("Signup catch error:", err);
    return NextResponse.json(
      { error: "Signup failed: " + (err instanceof Error ? err.message : "unknown") },
      { status: 500 }
    );
  }
}
