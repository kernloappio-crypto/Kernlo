const fs = require('fs');

// Check if ensureAuthContext is in the compiled file
const dataFile = fs.readFileSync('.next/server/chunks/ssr/kernlo_lib_supabase-data_ts_*._.js', 'utf8');

if (dataFile.includes('ensureAuthContext')) {
  console.log('✅ ensureAuthContext function is present in compiled code');
} else {
  console.log('❌ ensureAuthContext function NOT found in compiled code');
}

if (dataFile.includes('Attendance already exists')) {
  console.log('✅ Duplicate handling is present in compiled code');
} else {
  console.log('❌ Duplicate handling NOT found in compiled code');
}

