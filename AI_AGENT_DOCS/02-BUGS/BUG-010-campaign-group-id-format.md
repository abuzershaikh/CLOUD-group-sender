# BUG-007: Campaign Message Not Sending (Group ID Format Issue)

**Status:** Fixed ✅  
**Priority:** Critical  
**Date Fixed:** July 31, 2026

---

## 🐞 Problem Description

The Android App was attempting to create bulk group campaigns, but the messages were not being queued or sent. The campaigns were completely skipped by the backend without throwing any visible errors to the frontend.

## 📍 Location

- **PHP Backend File:** `/var/www/wappbuzz/inc/core/Admin_API/Controllers/Admin_API.php`
- **Function:** `bulk_create_campaign` and `create_campaign`
- **Line Numbers:** ~450 & ~590

## 🔍 Root Cause Analysis

The Dart/Flutter app was sending `recipients` as a simple array of strings containing the Group IDs:
```json
{
  "recipients": ["120363324299097007@g.us", "120363324299097008@g.us"]
}
```

However, the PHP `Admin_API` was hardcoded to expect an array of objects:
```php
foreach ($recipients as $idx => $recipient) {
    $number = trim((string)($recipient["number"] ?? ""));
    $chatId = trim((string)($recipient["chat_id"] ?? ""));
    // ...
}
```

Because it couldn't access `$recipient["number"]` or `$recipient["chat_id"]` from a plain string, it resulted in empty values. Down the line, `if (empty($normalizedRecipients)) { continue; }` was triggered, completely skipping the database insertion for both `sp_android_campaign_status` and `sp_android_campaign_queue`.

## 🛠️ The Fix

We patched `Admin_API.php` to smartly detect if a recipient is just a string (Group ID) and convert it into the expected associative array structure before processing.

```php
// Added this patch inside the foreach loop
foreach ($recipients as $idx => $recipient) {
    if (is_string($recipient)) { 
        $recipient = [
            'chat_id' => $recipient, 
            'number' => $recipient, 
            'is_group' => true
        ]; 
    }
    // ... existing logic
}
```

This ensures backwards compatibility with any existing payload structures while instantly fixing the Flutter app's array-of-strings format.

## 🧪 Verification
The payload is now successfully inserted into `sp_android_campaign_queue`, and the Node.js engine can properly pick it up for processing.
