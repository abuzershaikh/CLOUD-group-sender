# BUG-008: Campaign Delay Hardcapped for Group Forwarding

**Status:** Fixed ✅  
**Priority:** High  
**Date Fixed:** July 31, 2026

---

## 🐞 Problem Description

The user requested a feature to add a custom delay (1 to 15 seconds) between sending messages to groups via the Android App. Despite successfully modifying the UI and sending the chosen `delay_seconds` variable through the API, the backend was completely ignoring values over 1 second, causing messages to blast out instantly (or at 1-second intervals at best).

## 📍 Location

- **PHP Backend File:** `/var/www/wappbuzz/inc/core/Admin_API/Controllers/Admin_API.php`
  - *Line Numbers:* ~490 & ~633
- **Node.js Engine File:** `/opt/waziper-engine/app.js`
  - *Line Numbers:* ~889 & ~2772

## 🔍 Root Cause Analysis

Both the PHP Controller and the Node.js Engine had a hardcoded logic block designed to force-cap delays for campaigns consisting entirely of Group recipients.

```javascript
// Example from app.js
const hasOnlyGroupRecipients = recipients.length > 0 && recipients.every((recipient) => isGroupCampaignRecipient(recipient));
const effectiveManualDelaySec = hasOnlyGroupRecipients
    ? Math.min(manualDelaySec, CAMPAIGN_GROUP_FAST_DELAY_SEC) // CAMPAIGN_GROUP_FAST_DELAY_SEC = 1
    : manualDelaySec;
```
```php
// Example from Admin_API.php
$finalDelay = $hasOnlyGroupRecipients ? min($delay_seconds, 1) : $delay_seconds;
```

This meant that even if a user explicitly asked for a 15-second delay, `Math.min(15, 1)` or `min(15, 1)` would forcefully override it down to exactly 1 second.

## 🛠️ The Fix

We removed the overriding `min()` constraint across both the PHP API and the Node.js engine, ensuring they directly respect the manual user-defined delay.

**In Node.js (`app.js`):**
```javascript
const effectiveManualDelaySec = manualDelaySec;
// and later:
const delay_seconds = requestedDelaySeconds;
```

**In PHP (`Admin_API.php`):**
```php
$finalDelay = $delay_seconds;
```

## 🧪 Verification
The PM2 engine `waziper-engine` was restarted after applying the patch. New bulk campaigns launched from the Android App will now correctly reflect and honor any delay configured by the user (up to the slider's maximum of 15 seconds).
