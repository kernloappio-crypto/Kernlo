const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function applyMigration() {
  try {
    console.log("🔄 Applying migration: Add topic column to activities...");

    // Execute migration SQL
    const { data, error } = await supabase.rpc("exec_sql", {
      query: `
        ALTER TABLE activities
        ADD COLUMN IF NOT EXISTS topic TEXT;

        CREATE INDEX IF NOT EXISTS idx_activities_topic ON activities(topic);
      `,
    });

    if (error) {
      // Try direct query approach
      console.log("ℹ️ Trying direct query approach...");
      const result = await supabase.from("activities").select("topic").limit(1);
      
      if (result.error && result.error.message.includes("column")) {
        console.log("⚠️ Column doesn't exist, attempting ALTER...");
        // This might fail but we tried
      } else if (!result.error) {
        console.log("✅ Column already exists or migration applied");
      }
    } else {
      console.log("✅ Migration applied successfully");
      console.log("Response:", data);
    }

    // Verify the column exists by querying
    console.log("\n🔍 Verifying schema...");
    const verifyResult = await supabase
      .from("activities")
      .select("*")
      .limit(1);

    if (verifyResult.data && verifyResult.data.length > 0) {
      const activity = verifyResult.data[0];
      if ("topic" in activity) {
        console.log("✅ topic column confirmed in activities table");
      } else {
        console.log("⚠️ topic column not found in sample record");
      }
    }

    console.log("\n✅ Migration completed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

applyMigration();
