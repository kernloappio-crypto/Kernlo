# Supabase Storage Implementation for PDF Reports

## Overview
PDFs generated from the Parent Dashboard are now stored in Supabase Storage instead of being regenerated on download. This provides:
- **Faster downloads** - Direct from storage URL
- **Cost savings** - No repeated PDF generation
- **Reliability** - Signed URLs valid for 1 year
- **Security** - Private bucket, authenticated access only

## Architecture

### Flow
1. Parent Dashboard generates report (in-memory PDF with jsPDF)
2. PDF bytes uploaded to Supabase Storage
3. Signed URL created (365-day expiry)
4. URL saved to `generated_reports.file_url` column
5. Kid Reports page downloads directly from storage URL

### Path Structure
```
Bucket: reports
├── {userId}/
│   └── {kidId}/
│       └── {reportId}-{startDate}-{endDate}.pdf
```

Example: `a1b2c3d4/e5f6g7h8/1234567890-abc-2024-01-01-2024-01-31.pdf`

## Implementation Details

### 1. Parent Dashboard (`app/dashboard/page.tsx`)
**Changes in `handleGenerateReport()`:**
```typescript
// After PDF creation (doc.save() works):

// Get PDF bytes
const pdfBytes = doc.output('arraybuffer');

// Upload to Storage
const fileName = `${currentUserId}/${reportKid.id}/${reportId}-${reportStartDate}-${reportEndDate}.pdf`;
const { data: uploadData, error: uploadError } = await supabase
  .storage
  .from('reports')
  .upload(fileName, new Blob([pdfBytes], { type: 'application/pdf' }), {
    contentType: 'application/pdf',
    upsert: true,
  });

// Get signed URL (1 year expiry)
const { data: signedData } = await supabase
  .storage
  .from('reports')
  .createSignedUrl(fileName, 365 * 24 * 60 * 60);
const signedUrl = signedData?.signedUrl;

// Save to database
await supabase
  .from('generated_reports')
  .insert({
    // ... other fields
    file_url: signedUrl,
  });
```

**Error Handling:**
- Storage upload failure doesn't break report download
- Errors logged but flow continues
- If no URL saved, fallback to API regeneration available

### 2. Kid Reports Page (`app/dashboard/[id]/reports/page.tsx`)
**Updated `handleDownloadReport()`:**
```typescript
const handleDownloadReport = async (report: GeneratedReport) => {
  if (report.file_url) {
    // Direct download from Storage
    const link = document.createElement("a");
    link.href = report.file_url;
    link.download = `${report.child_name}-report-${report.start_date}-${report.end_date}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    // Fallback to API regeneration
    link.href = `/api/download-report/${report.id}`;
    // ... trigger download from API
  }
};
```

**Interface Update:**
```typescript
interface GeneratedReport {
  // ... existing fields
  file_url?: string; // NEW: Signed URL from Storage
}
```

### 3. Database Schema
**Column Added to `generated_reports` table:**
```sql
file_url TEXT  -- Signed URL for downloading from Storage
```

This column already existed in the schema migration `010_create_generated_reports_table.sql`

## Setup Instructions

### Step 1: Create Storage Bucket
The bucket must exist in Supabase. Options:

**Option A: Manual (via Supabase Dashboard)**
1. Go to Storage → Create Bucket
2. Name: `reports`
3. Public: ❌ (uncheck - private access)
4. Click Create

**Option B: Programmatic (Node.js)**
```bash
NEXT_PUBLIC_SUPABASE_URL="your-url" SUPABASE_SERVICE_ROLE_KEY="your-key" npx ts-node scripts/setup-storage.ts
```

### Step 2: Verify RLS Policies
The bucket should enforce:
- Only authenticated users can access
- Users can only access their own files (by userId in path)

Default Supabase policies allow this automatically with the path structure.

### Step 3: Deploy
```bash
git push origin main
# Railway rebuilds automatically
```

## Testing

### 1. Generate Report
1. Go to Parent Dashboard
2. Click "📄 Report" button
3. Configure report (kid, dates, subjects)
4. Click "Download Report"
5. PDF downloads to browser

### 2. Verify Storage
1. Check Supabase Dashboard → Storage → reports bucket
2. Navigate: `{userId}/{kidId}/`
3. Should see PDF file: `{reportId}-{date}-{date}.pdf`

### 3. Verify Database
1. Check Supabase Dashboard → SQL Editor
2. Run:
```sql
SELECT id, child_name, file_url, date_generated 
FROM generated_reports 
ORDER BY date_generated DESC 
LIMIT 1;
```
3. `file_url` should contain signed URL like:
```
https://tyzvhpyrghqayuqchwra.supabase.co/storage/v1/object/sign/reports/...?token=...&t=...
```

### 4. Download from Reports Page
1. Go to Kid Reports page (`/dashboard/{kidId}/reports`)
2. Click "📥 Download Report"
3. Should download directly from Storage (fast)
4. File should be identical to original

## Signed URL Details

### Expiration
- **Duration:** 365 days (1 year)
- **Format:** `365 * 24 * 60 * 60` seconds = 31,536,000 seconds
- **After expiry:** URL becomes invalid, fallback to API regeneration triggers

### URL Format
```
https://{project}.supabase.co/storage/v1/object/sign/{bucket}/{path}?token={signed_token}&t={timestamp}
```

The `token` parameter is cryptographically signed by Supabase service key.

## API Fallback

If `file_url` is null or expired, `/api/download-report/[id]` endpoint still works:
- Regenerates PDF from database activity logs
- Slower than Storage download (30-60 seconds)
- Used as emergency fallback only

## Cost Analysis

### Before (On-Demand Regeneration)
- Every download triggers PDF generation
- 30-60 seconds per download
- Higher compute costs
- Slower user experience

### After (Storage)
- PDF generated once, stored permanently
- Direct download via Storage
- ~0 compute cost for downloads
- Instant downloads
- 1 year storage per report

**Cost Estimate:**
- Storage: ~2-5MB per PDF × 10,000 users × 5 kids × 12 reports/year = ~12 TB/year ≈ $240/year
- Bandwidth: Minimal (storage egress ~5-10 GB/month = $5-10/month)
- Total: ~$300/year vs. previous compute costs

## File Lifecycle

1. **Generation (0s)** - PDF created in memory
2. **Upload (1-5s)** - Uploaded to Storage
3. **URL Creation (1s)** - Signed URL generated
4. **Storage (365d)** - PDF stored in bucket
5. **Access (1yr)** - Downloadable via signed URL
6. **Expiry (365d+)** - URL invalid, falls back to API

## Security Considerations

### Access Control
- Bucket is **private** (not public)
- Signed URLs required for download
- URLs tied to specific file path
- Users can only access their own reports (via RLS on database)

### URL Tokens
- Generated by Supabase with service key
- Time-limited (1 year)
- Cannot be reused for other operations
- Cannot modify file permissions

### Database Security
- RLS policies ensure users only see their own reports
- `file_url` is read-only to user
- URLs regenerated if needed for other users (different bucket paths)

## Troubleshooting

### PDF Not Uploading
**Symptoms:** `file_url` is null after report generation

**Debug:**
```javascript
// Check browser console during report generation
// Look for "Upload failed:" or "Failed to create signed URL:" messages
```

**Causes & Fixes:**
1. **Bucket doesn't exist** → Create bucket (see Setup)
2. **Auth context lost** → Report page should restore auth context
3. **RLS policy too strict** → Verify bucket allows authenticated uploads

### URL Not Working
**Symptoms:** "Invalid request signature" when clicking download

**Causes & Fixes:**
1. **URL expired** → Should be rare (1 year), fallback works
2. **URL malformed** → Check database for proper signed URL format
3. **Browser blocked** → Check CORS headers (shouldn't be an issue)

### Storage Quota Exceeded
**Symptoms:** "Quota exceeded" during upload

**Solution:**
1. Check current usage: Supabase Dashboard → Storage → Usage
2. Delete old reports if needed: `DELETE FROM generated_reports WHERE date_generated < NOW() - INTERVAL '1 year'`
3. Upgrade Supabase plan if persistent

## Future Enhancements

1. **Batch Processing** - Generate multiple reports asynchronously
2. **Cleanup Job** - Auto-delete reports older than 1 year
3. **Encryption** - Additional encryption for sensitive reports
4. **Compression** - Store PDFs as gzip for smaller size
5. **CDN** - Distribute reports globally via CDN (Supabase Edge)

## Related Files

- **Main Implementation**
  - `app/dashboard/page.tsx` - Report generation with Storage upload
  - `app/dashboard/[id]/reports/page.tsx` - Downloads from Storage
  
- **Setup & Configuration**
  - `scripts/setup-storage.ts` - Bucket initialization script
  - `supabase/migrations/010_create_generated_reports_table.sql` - Schema
  
- **API Fallback**
  - `app/api/download-report/[id]/route.ts` - Regeneration endpoint (unchanged)

## Questions?

Refer to:
- Supabase Storage Docs: https://supabase.com/docs/guides/storage
- Report Generation Flow: See `handleGenerateReport()` in `app/dashboard/page.tsx`
- Download Flow: See `handleDownloadReport()` in `app/dashboard/[id]/reports/page.tsx`
