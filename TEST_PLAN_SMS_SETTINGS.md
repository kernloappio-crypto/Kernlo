# SMS Settings Feature - Test Plan

## Overview
Testing phone number and SMS notification settings implementation across UI, API, and database.

---

## Pre-Requisites

1. ✅ Database migration applied (migration 014)
2. ✅ Code deployed to Railway
3. ✅ User logged into Kernlo with valid session

---

## Test Scenarios

### 1. Settings Page Load & Navigation

**1.1: Navigate to Settings from Dashboard**
- [ ] Go to `/dashboard/{kid-id}`
- [ ] Click hamburger menu (☰)
- [ ] See "⚙️ Settings" option in menu
- [ ] Click Settings
- **Expected:** Settings page loads at `/dashboard/{kid-id}/settings`
- **Expected:** Page title is "Settings"
- **Expected:** Subtitle says "Manage your notification preferences"

**1.2: Settings Page Elements Present**
- [ ] Phone Number field visible with placeholder "+1 (555) 123-4567"
- [ ] SMS Notifications toggle visible (currently OFF, gray)
- [ ] Help text "Receive activity confirmations via text"
- [ ] Save Settings button visible
- [ ] Info box at bottom with SMS explanation

**1.3: Back Link Works**
- [ ] Click "← Back to Dashboard"
- **Expected:** Returns to dashboard at `/dashboard/{kid-id}`

---

### 2. Phone Number Input

**2.1: Accept Various Phone Formats**

| Format | Input | Expected Result |
|--------|-------|-----------------|
| US with dashes | 555-123-4567 | ✅ Accepted |
| US with parens | (555) 123-4567 | ✅ Accepted |
| With country code | +1 555 123 4567 | ✅ Accepted |
| Plain digits | 5551234567 | ✅ Accepted |
| International | +44 20 7946 0958 | ✅ Accepted |
| Short (invalid) | 12345 | ❌ Error on save |

**Test Steps:**
1. [ ] Type phone in field (each format above)
2. [ ] Verify no immediate validation (field accepts any input)
3. [ ] Save and check validation message

**2.2: Phone Field Disabled During Save**
- [ ] Start save operation
- [ ] Phone field should be disabled/grayed during saving
- [ ] Button shows "Saving..."
- **Expected:** Re-enable after save completes

**2.3: Clear Phone Number**
- [ ] Enter phone number
- [ ] Clear the field completely
- [ ] SMS toggle is ON
- [ ] Click Save
- **Expected:** Error: "Phone number is required when SMS notifications are enabled"

---

### 3. SMS Notifications Toggle

**3.1: Toggle Visual States**
- [ ] Toggle OFF (gray): `background-color: #d1d5db`
- [ ] Toggle ON (blue): `background-color: #0066cc`
- [ ] Animated slide when clicked
- [ ] Handle on right when ON, left when OFF

**3.2: Toggle Behavior**
- [ ] Click toggle OFF → turns gray
- [ ] Click toggle ON → turns blue
- [ ] Toggle multiple times → works smoothly
- [ ] Toggle disabled during save → cannot toggle while saving

**3.3: SMS + Phone Relationship**
- [ ] Phone field empty, SMS OFF → Save OK
- [ ] Phone field empty, SMS ON → Save fails with error
- [ ] Phone entered, SMS OFF → Save OK
- [ ] Phone entered, SMS ON → Save OK

---

### 4. Data Persistence

**4.1: Save Phone + SMS Enabled**
- [ ] Enter phone: `(555) 123-4567`
- [ ] Toggle SMS ON (blue)
- [ ] Click "Save Settings"
- **Expected:** Green success message "Settings saved ✅"
- **Expected:** Message disappears after 3 seconds
- **Expected:** Page ready for new input

**4.2: Verify in Database**
```sql
SELECT phone_number, sms_notifications_enabled FROM users 
WHERE id = '{USER_ID}';
```
- [ ] `phone_number` shows normalized format: `+15551234567`
- [ ] `sms_notifications_enabled` shows `true`

**4.3: Refresh Page & See Persisted Data**
- [ ] Reload page (F5)
- **Expected:** Phone field shows: `+15551234567`
- **Expected:** SMS toggle is ON (blue)
- [ ] No loading spinner (should fetch immediately from API)

**4.4: Update Existing Settings**
- [ ] Change phone to different number: `(666) 555-1212`
- [ ] Toggle SMS OFF
- [ ] Click Save
- **Expected:** Success message
- **Expected:** Toggle is now gray
- [ ] Refresh page → confirms new values saved

**4.5: Change Phone, Keep SMS On**
- [ ] Current: phone `+15551234567`, SMS ON
- [ ] Change phone to: `(777) 999-8888`
- [ ] SMS stays ON
- [ ] Save
- **Expected:** Success, phone updates to `+17779998888`

---

### 5. Validation & Error Handling

**5.1: Phone Too Short**
- [ ] Enter: `123`
- [ ] SMS ON
- [ ] Save
- **Expected:** Error message: "Phone number must have at least 10 digits"
- **Expected:** Form does not submit

**5.2: Invalid Characters (if applicable)**
- [ ] Enter: `abc-def-ghij`
- [ ] Save
- **Expected:** Error or accepted (depends on validation logic)
- **Test both paths:**
  - [ ] If accepted: stored with digits only
  - [ ] If rejected: error message shown

**5.3: SMS Without Phone**
- [ ] Clear phone field
- [ ] Toggle SMS ON
- [ ] Save
- **Expected:** Error: "Phone number is required when SMS notifications are enabled"
- **Expected:** Form does not submit
- **Expected:** SMS toggle remains ON (user's intent preserved)

**5.4: Empty Phone, SMS OFF**
- [ ] Clear phone field
- [ ] SMS OFF
- [ ] Save
- **Expected:** Success (phone is optional if SMS disabled)
- [ ] Refresh page → phone is empty, SMS OFF

**5.5: Auth Token Missing/Invalid**
- [ ] Clear `localStorage.getItem("kernlo_access_token")`
- [ ] Reload settings page
- **Expected:** Redirect to `/auth/login`

---

### 6. Landing Page Feature Display

**6.1: SMS Feature Visible on Landing**
- [ ] Go to `/`
- [ ] Scroll to "Real-time visibility. No spreadsheets." section
- [ ] Find Features grid with 7 cards (0-indexed):
  - 0: 📱 Quick Logging
  - 1: 👁️ See Progress Real-Time
  - 2: 📚 Track by Subject
  - 3: 📋 State Compliance
  - 4: 🤖 AI-Powered Reports
  - 5: 📄 PDF Export
  - **6: 💬 SMS Notifications (Optional)** ✨

**6.2: SMS Feature Card Content**
- [ ] Icon: 💬
- [ ] Title: "SMS Notifications (Optional)"
- [ ] Description: "Get instant text confirmations when activities are logged. Opt-in, stay informed."
- [ ] Responsive: On mobile, cards stack in 1 column
- [ ] Responsive: On tablet/desktop, cards in 2 columns

---

### 7. API Endpoint Testing

**7.1: GET `/api/profile/get`**

**Request:**
```bash
curl -H "Authorization: Bearer $TOKEN" https://kernlo.app/api/profile/get
```

**Response Success:**
```json
{
  "phone_number": "+15551234567",
  "sms_notifications_enabled": true
}
```

**Response New User (no settings):**
```json
{
  "phone_number": "",
  "sms_notifications_enabled": false
}
```

**Auth Error:**
```bash
curl https://kernlo.app/api/profile/get
# Expected: 401 Unauthorized
```

**7.2: POST `/api/profile/update`**

**Request (Enable SMS):**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "phone_number": "(555) 123-4567",
    "sms_notifications_enabled": true
  }' \
  https://kernlo.app/api/profile/update
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Profile settings saved",
  "data": {
    "id": "...",
    "email": "...",
    "phone_number": "+15551234567",
    "sms_notifications_enabled": true,
    ...
  }
}
```

**Request (Disable SMS):**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "phone_number": "",
    "sms_notifications_enabled": false
  }' \
  https://kernlo.app/api/profile/update
```

**Request (SMS without phone - Error):**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "phone_number": "",
    "sms_notifications_enabled": true
  }' \
  https://kernlo.app/api/profile/update
```

**Expected Error Response:**
```json
{
  "error": "Phone number is required when SMS notifications are enabled"
}
```

---

### 8. Mobile Responsiveness

**8.1: Test on Mobile (375px width)**
- [ ] Settings page loads correctly
- [ ] Phone field spans full width
- [ ] Toggle switch is touch-friendly (at least 44px height)
- [ ] Save button is full width, easily tappable
- [ ] Text is readable (no overflow)

**8.2: Test on Tablet (768px width)**
- [ ] Layout appropriate for tablet size
- [ ] No horizontal scrolling

**8.3: Test on Desktop (1920px width)**
- [ ] Elements properly centered
- [ ] Max-width container maintains readability

---

### 9. Cross-Browser Testing

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

### 10. Performance

**10.1: Page Load Time**
- [ ] Settings page loads in < 2 seconds
- [ ] No layout shift/CLS issues
- [ ] Fetch and populate in smooth manner

**10.2: Save Operation**
- [ ] Save completes in < 1 second
- [ ] Success message displays immediately
- [ ] No visible lag/stutter

---

### 11. Edge Cases

**11.1: Rapid Clicks**
- [ ] Click Save button 3x rapidly
- **Expected:** Request sent once or debounced
- **Expected:** No duplicate database entries

**11.2: Long Phone Numbers**
- [ ] Enter international number with +code: `+1-541-754-3010`
- [ ] Save
- **Expected:** Normalized to `+15417543010`

**11.3: Phone with Spaces**
- [ ] Enter: `555 123 4567`
- [ ] Save
- **Expected:** Accepted, normalized to `+15551234567`

**11.4: Network Error During Save**
- [ ] Open DevTools Network tab
- [ ] Throttle to offline
- [ ] Try to save
- **Expected:** Error message after timeout
- **Expected:** Form remains in edit state

---

## Sign-Off Checklist

- [ ] All 11 test scenarios completed
- [ ] No console errors in DevTools
- [ ] No 404/500 responses
- [ ] Database migration verified
- [ ] Landing page feature visible
- [ ] Mobile responsive verified
- [ ] API endpoints tested with curl
- [ ] Authentication properly enforced
- [ ] Phone normalization working
- [ ] Success/error messages displayed correctly
- [ ] Data persists across page reloads
- [ ] Back navigation works

---

## Known Limitations / Future Work

- [ ] SMS sending not yet implemented (API endpoint only)
- [ ] Phone number validation could be more strict (international support)
- [ ] No rate limiting on API endpoint (add if spam risk exists)
- [ ] No UI for revoking phone number (delete from account)

---

## Deployment Checklist

Before production:
1. [ ] Database migration applied to Supabase
2. [ ] Code merged to main and pushed to Railway
3. [ ] Railway build succeeds
4. [ ] All tests in this plan pass
5. [ ] Landing page feature visible in production
6. [ ] No console errors in production
7. [ ] Staging environment tested first
