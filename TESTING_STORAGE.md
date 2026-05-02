# Testing Supabase Storage Implementation

Quick checklist to verify the PDF Storage implementation is working correctly.

## Prerequisites
- Node.js running locally or on Railway
- Supabase project set up with `reports` bucket
- Test user account with at least one child added
- Test activities logged (at least one for each activity type)

## Test Flow

### Test 1: Basic Report Generation & Upload ✓

**Steps:**
1. Go to Parent Dashboard (`/dashboard`)
2. Click "📄 Report" button
3. Configure:
   - Kid: Select a test child
   - Start Date: 30 days ago
   - End Date: Today
   - Activity Types: Check "Core Subjects"
   - Subjects: Select at least one subject
4. Click "Download Report"
5. Wait for PDF download to complete

**Expected Results:**
- Browser downloads PDF file
- No error messages in console
- Console shows:
  ```
  📤 Uploading PDF to Storage...
  ✅ PDF uploaded successfully
  ✅ Signed URL created
  📝 Attempting to log report...
  ✅ Report logged successfully with file_url: https://...
  ```

**Verify Storage Upload:**
1. Open Supabase Dashboard
2. Go to Storage → reports bucket
3. Navigate to folder: `{userId}/{childId}/`
4. Should see file: `{reportId}-{startDate}-{endDate}.pdf`
5. File size should be 50-200 KB

**Verify Database Entry:**
1. Open Supabase Dashboard
2. SQL Editor → New Query → Paste:
   ```sql
   SELECT id, child_name, file_url, date_generated, start_date, end_date
   FROM generated_reports
   WHERE child_name = '{childName}'
   ORDER BY date_generated DESC
   LIMIT 1;
   ```
3. Should see:
   - `file_url` column populated with signed URL
   - URL format: `https://...supabase.co/storage/v1/object/sign/reports/...`
   - URL contains `token=` and `t=` parameters

---

### Test 2: Direct Download from Reports Page ✓

**Steps:**
1. From Parent Dashboard, generate a report (Test 1)
2. Go to Kid's Dashboard: Click kid card → View
3. Click "📊 Reports" tab or navigate to `/dashboard/{kidId}/reports`
4. Should see the report you just generated
5. Click "📥 Download Report" button
6. File downloads to browser

**Expected Results:**
- PDF downloads immediately (fast, <2 seconds)
- Console shows:
  ```
  📥 Download button clicked for report: {id}
  📥 Downloading from Storage URL
  ```
- No request to `/api/download-report/` endpoint
- Downloaded file is identical to original

---

### Test 3: Multiple Activity Types ✓

**Steps:**
1. Go to Parent Dashboard
2. Log activities of different types if not already logged:
   - Core Subject: Math (2 hours)
   - Extracurricular: Piano Lesson
   - Field Trip: Science Museum
3. Go to "📄 Report" button
4. Select all activity types:
   - ✓ Core Subjects
   - ✓ Extracurricular
   - ✓ Field Trips
5. Generate and download report

**Expected Results:**
- PDF includes all activity sections
- Console shows successful upload
- Database entry has `selected_activity_types` with all three types:
  ```json
  ["Core Subject", "Extracurricular", "Field Trips"]
  ```

---

### Test 4: Fallback to API (No file_url) ✓

**Advanced Test - Requires Manual DB Edit**

**Steps:**
1. Generate a report (Test 1)
2. Go to Supabase SQL Editor
3. Find the report record:
   ```sql
   SELECT id FROM generated_reports ORDER BY date_generated DESC LIMIT 1;
   ```
4. Manually clear the URL:
   ```sql
   UPDATE generated_reports 
   SET file_url = NULL 
   WHERE id = '{reportId}';
   ```
5. Go to Kid Reports page (`/dashboard/{kidId}/reports`)
6. Click "📥 Download Report"

**Expected Results:**
- PDF still downloads (fallback works)
- Console shows:
  ```
  📥 Download button clicked for report: {id}
  ⚠️ No file_url found, falling back to API regeneration
  📥 Fetching PDF from: /api/download-report/{id}
  ```
- Download takes 30-60 seconds (regeneration time)
- PDF is identical to original

---

### Test 5: Multiple Reports Same Kid ✓

**Steps:**
1. Generate Report 1 (Jan 1-31)
2. Wait for completion
3. Generate Report 2 (Feb 1-28)
4. Wait for completion
5. Go to Kid Reports page

**Expected Results:**
- Both reports visible in list
- Newest first (Feb report on top)
- Both have `file_url` populated
- Both download successfully

**Verify in Storage:**
1. Supabase Dashboard → Storage → reports
2. Navigate to: `{userId}/{childId}/`
3. Should see both files:
   ```
   {reportId1}-2024-01-01-2024-01-31.pdf
   {reportId2}-2024-02-01-2024-02-28.pdf
   ```

---

### Test 6: Multi-Kid Scenario ✓

**Steps:**
1. Create/add 2 child profiles
2. Log activities for Child A
3. Log activities for Child B
4. Generate report for Child A
5. Generate report for Child B
6. View reports for Child A
7. View reports for Child B

**Expected Results:**
- Each child's reports only visible on their own Reports page
- Storage files organized correctly:
  ```
  {userId}/
  ├── {kidAid}/
  │   └── {reportAid}-dates.pdf
  └── {kidBid}/
      └── {reportBid}-dates.pdf
  ```
- Both download correctly from their storage locations

---

## Performance Benchmarks

### Expected Times
| Operation | Expected Time | Notes |
|-----------|---------------|-------|
| Report Generation | 30-60s | AI prompt + PDF creation |
| PDF Upload | 1-5s | Network upload |
| Signed URL Creation | <1s | Instant |
| Storage Download | <2s | Direct from Storage |
| API Fallback Download | 30-60s | Regeneration required |

### Test Benchmarks
**To measure performance:**
1. Open DevTools → Network tab
2. Generate report and observe:
   - Upload time to Storage
   - Total time for download
3. Compare with `/api/download-report` endpoint:
   - Should be 15-30x faster

---

## Debugging

### Check Browser Console
During report generation:
```javascript
// Open DevTools → Console
// Look for these messages:
"📤 Uploading PDF to Storage..."      // Should appear
"✅ PDF uploaded successfully"        // Should appear
"✅ Signed URL created"               // Should appear
"✅ Report logged successfully"       // Should appear
```

### Check Network Tab
1. Open DevTools → Network tab
2. Generate report
3. Should NOT see request to `/api/download-report`
4. Should see request to Supabase Storage (signed URL)

### Check Supabase Logs
1. Supabase Dashboard → Logs
2. Filter by Storage events
3. Should see successful uploads:
   ```
   POST /storage/v1/object/reports - 200 OK
   POST /storage/v1/object/sign/reports - 200 OK
   ```

### Common Issues & Fixes

**❌ "Upload failed" Error**
- Check: Is `reports` bucket created in Storage?
- Fix: Create bucket manually in Supabase Dashboard

**❌ "Failed to create signed URL" Error**
- Check: Are credentials correct?
- Fix: Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**❌ PDF Downloads Slowly**
- Check: Is fallback being used (no `file_url`)?
- Fix: Ensure reports have `file_url` populated in database

**❌ "Invalid request signature" on Download**
- Check: Is URL in browser address bar unchanged?
- Fix: Don't modify URL, use download button

---

## Rollback (If Needed)

If Storage implementation causes issues:

1. **Disable Storage Upload (Keep Fallback):**
   ```typescript
   // In app/dashboard/page.tsx, comment out upload block:
   // try {
   //   const { data: uploadData, error: uploadError } = await supabase...
   // }
   // Leave file_url as null → Falls back to API
   ```

2. **Revert to Previous Code:**
   ```bash
   git revert HEAD
   git push
   ```

3. **Fallback Always Available:**
   - Users can still download via API endpoint
   - No data loss
   - Slower but functional

---

## Sign-Off Checklist

- [ ] Test 1: Basic generation & upload works
- [ ] Test 2: Direct download from Reports page
- [ ] Test 3: Multiple activity types
- [ ] Test 4: Fallback to API when needed
- [ ] Test 5: Multiple reports per kid
- [ ] Test 6: Multi-kid scenario
- [ ] Storage bucket exists with correct files
- [ ] Database records have file_url populated
- [ ] Download times are acceptable (<2s from Storage)
- [ ] No console errors during operations

---

## Production Readiness

Once all tests pass:

1. ✅ Code is merged to main branch
2. ✅ TypeScript builds clean
3. ✅ No runtime errors in console
4. ✅ All tests documented and passed
5. ✅ Ready for Railway deployment

Deploy with: `git push origin main` (Railway auto-deploys)
