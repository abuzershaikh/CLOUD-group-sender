# BUG-008: Live Status Stuck ("Waiting for live server status...")

## Symptoms
- In the Flutter Mobile App, when sending a "Group Forward" campaign, the UI gets stuck showing the message `"Waiting for live server status..."`.
- The campaign is successfully inserted and queued in the backend, and messages might actually be sending, but the app never reflects the real-time status (queued, sent, failed).

## Root Cause
The Flutter app periodically polls the CodeIgniter backend API endpoint `/admin_api/list_group_sender_status` to update the local database with the live status of active campaigns. 

However, in the `Admin_API.php` controller, the `list_group_sender_status()` method contained a hardcoded SQL filter to only fetch statuses for specific `message_mode`s:

```php
$campaignRows = $db->table($campaignTable)
    ->where('team_id', $team->id)
    ->whereIn('message_mode', ['group_text', 'group_media']) // ❌ Missing group_forward
    ->orderBy('created', 'DESC')
    ->get()
    ->getResultArray();
```

Because the `group_forward` mode was excluded, the endpoint returned an empty array for forward campaigns. The Flutter app, receiving no update for that campaign ID, kept displaying its default fallback state: `"Waiting for live server status..."`.

## Fix / Resolution
The `whereIn` array in `/var/www/wappbuzz/inc/core/Admin_API/Controllers/Admin_API.php` was updated to explicitly include `group_forward`.

**Correct (After):**
```php
$campaignRows = $db->table($campaignTable)
    ->where('team_id', $team->id)
    ->whereIn('message_mode', ['group_text', 'group_media', 'group_forward'])
    ->orderBy('created', 'DESC')
    ->get()
    ->getResultArray();
```

## How to Debug Similar Issues in the Future
1. Whenever the Flutter app shows "Waiting for server status", identify which API endpoint it uses to fetch that status (e.g., `list_group_sender_status`).
2. Verify if the database actually holds the record.
3. Check the PHP CodeIgniter controller handling that endpoint to ensure there are no missing `where` or `whereIn` filters that exclude newly added message types or features.
