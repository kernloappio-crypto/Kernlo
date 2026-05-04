#!/usr/bin/env node

/**
 * Apply Supabase Migration Script
 * This script applies the SMS notifications migration
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const supabaseUrl = 'https://tyzvhpyrghqayuqchwra.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5enZocHlyZ2hxYXl1cWNod3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTYzMDEsImV4cCI6MjA5MDk3MjMwMX0.Nf84YSxW5lHCzT2SIbfPH2TuvHwGlrLrY1AMNDZXYf4';

async function applyMigration() {
  console.log('🔧 Supabase Migration Runner');
  console.log('═'.repeat(50));

  // Read migration file
  const migrationPath = join(__dirname, 'supabase/migrations/014_add_sms_notifications.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  console.log('\n📝 Migration SQL:');
  console.log('─'.repeat(50));
  console.log(migrationSQL);
  console.log('─'.repeat(50));

  try {
    console.log('\n⏳ Attempting to apply migration...');
    
    // Note: We cannot directly execute arbitrary SQL via the JS client
    // The anon key cannot execute SQL directly for security
    // Migration must be applied via Supabase Dashboard or with service role key
    
    console.log('\n⚠️  IMPORTANT: Anon key cannot execute SQL directly');
    console.log('\n📋 To apply this migration manually:');
    console.log('1. Go to https://app.supabase.com');
    console.log('2. Select your Kernlo project (tyzvhpyrghqayuqchwra)');
    console.log('3. Go to SQL Editor → New Query');
    console.log('4. Copy-paste the migration SQL above');
    console.log('5. Click RUN (⚡)');
    console.log('\n✅ The IF NOT EXISTS clauses prevent errors if already applied');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

applyMigration();
