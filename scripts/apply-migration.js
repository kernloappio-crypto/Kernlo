const fs = require('fs');
const path = require('path');

// Read the migration SQL
const migrationPath = path.join(__dirname, '../supabase/migrations/014_add_sms_notifications.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

console.log('Migration SQL:');
console.log(migrationSQL);
console.log('\n✅ Migration file created successfully');
console.log('To apply this migration:');
console.log('1. Go to Supabase Dashboard: https://app.supabase.com');
console.log('2. Select your project');
console.log('3. Go to SQL Editor');
console.log('4. Create new query and paste the above SQL');
console.log('5. Run it');
