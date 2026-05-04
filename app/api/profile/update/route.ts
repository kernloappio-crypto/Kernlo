import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Phone number validation - accept E.164 or flexible input
function validatePhoneNumber(phone: string): boolean {
  if (!phone || phone.trim() === "") return false;
  // Basic validation: at least 10 digits
  const digitsOnly = phone.replace(/\D/g, "");
  return digitsOnly.length >= 10;
}

// Normalize phone to E.164 format
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let digitsOnly = phone.replace(/\D/g, "");
  
  // If doesn't start with +, assume US number and prepend +1
  if (!phone.trim().startsWith("+")) {
    if (digitsOnly.length === 10) {
      digitsOnly = "1" + digitsOnly;
    } else if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) {
      // Already has country code
    }
  }
  
  // Format as E.164 if we have the right digits
  if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) {
    return `+${digitsOnly}`;
  } else if (digitsOnly.length >= 10) {
    // Return with + prefix if not US
    return `+${digitsOnly}`;
  }
  
  return phone; // Return as-is if can't normalize
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    // Get user from token
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const { phone_number, sms_notifications_enabled } = await request.json();

    // Validation
    if (sms_notifications_enabled && !phone_number) {
      return NextResponse.json(
        { error: "Phone number is required when SMS notifications are enabled" },
        { status: 400 }
      );
    }

    if (phone_number && !validatePhoneNumber(phone_number)) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    
    if (phone_number !== undefined && phone_number !== null) {
      updateData.phone_number = normalizePhoneNumber(phone_number);
    }
    
    if (sms_notifications_enabled !== undefined) {
      updateData.sms_notifications_enabled = sms_notifications_enabled;
    }

    // Update user in database
    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", user.id)
      .select();

    if (error) {
      console.error("Error updating profile:", error);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile settings saved",
      data: data?.[0],
    });
  } catch (err: any) {
    console.error("Error in profile update:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
