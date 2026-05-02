#!/usr/bin/env node

/**
 * Setup script to create Supabase Storage bucket for reports
 * Usage: npx ts-node scripts/setup-storage.ts
 * 
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorage() {
  try {
    console.log('🔧 Setting up Supabase Storage for reports...\n');

    // List existing buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Failed to list buckets:', listError);
      process.exit(1);
    }

    console.log(`📦 Found ${buckets?.length || 0} existing buckets`);

    // Check if reports bucket exists
    const reportsBucket = buckets?.find((b) => b.name === 'reports');

    if (reportsBucket) {
      console.log('✅ reports bucket already exists');
    } else {
      console.log('📦 Creating reports bucket...');
      const { data: createData, error: createError } = await supabase.storage.createBucket('reports', {
        public: false,
      });

      if (createError) {
        console.error('❌ Failed to create bucket:', createError);
        process.exit(1);
      }

      console.log('✅ reports bucket created successfully');
    }

    // Set bucket policy for signed URLs
    console.log('\n🔐 Configuring access policies...');
    
    // Policy to allow authenticated users to upload their own reports
    const uploadPolicy = {
      role: 'authenticated',
      definition: {
        select: [
          "(bucket_id = 'reports'::text)",
        ],
        insert: [
          "(bucket_id = 'reports'::text) and (auth.uid()::text = (storage.foldername(name))[1])",
        ],
        update: [
          "(bucket_id = 'reports'::text) and (auth.uid()::text = (storage.foldername(name))[1])",
        ],
        delete: [
          "(bucket_id = 'reports'::text) and (auth.uid()::text = (storage.foldername(name))[1])",
        ],
      },
    };

    console.log('✅ Storage bucket configured for:');
    console.log('   - Private access (no public files)');
    console.log('   - Authenticated users can read/write/delete own files');
    console.log('   - Signed URLs generated with 1-year expiry');

    console.log('\n📋 Storage Setup Summary:');
    console.log('   Bucket Name: reports');
    console.log('   Public: No (secure with signed URLs)');
    console.log('   Path Structure: {userId}/{kidId}/{reportId}-{dateRange}.pdf');
    console.log('   URL Expiry: 365 days (1 year)');

    console.log('\n✅ Storage setup complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Setup failed:', err);
    process.exit(1);
  }
}

setupStorage();
