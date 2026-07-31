# BUG-013: Delay & Duration Sync Issue in Flutter App UI

## 🔴 Description
The Flutter App's "Group Sender Status" screen was displaying `0s` for the Delay (even when configured otherwise by the user) and `1 sec` for the Duration (time taken to send messages) for all campaigns. The values were not reflecting the actual configuration or execution time.

## 🔍 Root Causes

### 1. `delay_seconds` Not Inserted into Status Table
When a new campaign is created, the API (`Admin_API.php`) inserts the campaign data into two tables: `sp_android_campaign_queue` (used by the engine for execution) and `sp_android_campaign_status` (used by the API to serve status to the Flutter app). 
While `delay_seconds` was correctly inserted into the queue table, it was omitted from the `sp_android_campaign_status` table insert statement. As a result, the database defaulted it to `0`, and the app always fetched and displayed `0s`.

### 2. `duration_seconds` Missing from API Response
The Flutter app model `GroupSenderStatusSummary` expects a field named `duration_seconds` from the server API to calculate the time taken to complete a campaign. 
However, the PHP function `make_group_sender_summary` inside `Admin_API.php` was not calculating or returning this field in its JSON response. Consequently, the Flutter app fell back to a default value of `1`, displaying `1 sec` in the UI.

## 🛠️ Fix Applied

### File: `/var/www/wappbuzz/inc/core/Admin_API/Controllers/Admin_API.php`

**1. Fix for `delay_seconds` (Campaign Creation):**
In `bulk_create_campaign` and `create_campaign`, added `'delay_seconds' => $finalDelay,` to the insert array for `sp_android_campaign_status`:
```php
$db->table('sp_android_campaign_status')->insert([
    'ids' => $campaign_id,
    'team_id' => $team->id,
    // ...
    'message_label' => $message_label,
    'delay_seconds' => $finalDelay, // <--- ADDED THIS LINE
    'status' => 'queued',
    // ...
]);
```

**2. Fix for `duration_seconds` (API Status List):**
In `make_group_sender_summary()`, calculated the elapsed time based on the `created` and `changed` timestamps and added `duration_seconds` to the returned array:
```php
'delay_seconds' => (int) ($row['delay_seconds'] ?? 0),
'duration_seconds' => max(1, (int)($row['changed'] ?? ($row['created'] ?? time())) - (int)($row['created'] ?? time())), // <--- ADDED THIS LINE
'instance_id' => $row['instance_id'] ?? '',
```

**Note on Deployment:**
During the patch, Windows formatting (`type` pipe and `\n` in `sed`) introduced a syntax error (`namespace` parsing failure due to incorrect line breaks/BOM). The file was successfully restored and patched by decoding base64 content via Python on the VPS, ensuring clean string replacements without mangling PHP tags or encoding.

## ✅ Result
- **Delay UI Fixed:** When a user sets a delay (e.g., 15s) while creating a campaign, it now correctly displays as `Delay: 15s` in the app.
- **Duration/Timer UI Fixed:** The app now accurately displays how much time the numbers took to send the group messages (e.g., `5 mins 20 secs`), fetching the calculated duration from the backend API.
