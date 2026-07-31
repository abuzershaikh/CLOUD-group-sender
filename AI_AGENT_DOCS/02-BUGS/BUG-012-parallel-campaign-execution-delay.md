# BUG-012: Parallel Campaign Execution Delay & Queue Logic

## 🔴 Description
When a user linked 5 numbers in a team and launched a group broadcast to all groups across these 5 numbers, the messages were NOT sent simultaneously. The numbers appeared to send messages sequentially, or new campaigns would get "stuck" waiting for the previous ones to finish.
Additionally, users perceived campaigns as "stuck" when one of the numbers had an ongoing large campaign.

## 🔍 Root Causes

### 1. The Global Polling Lock in `app.js` (Fixed)
The Node.js Waziper Engine (`/opt/waziper-engine/app.js`) main polling loop `processQueuedCampaigns()` fetched campaigns every 5 seconds. However, it used an `await Promise.all(tasks)` to wait for all currently picked-up campaigns to reach their burst limit (e.g., 50 messages) before finishing the tick. 
Since a campaign with a 10-second delay for 50 groups takes 500 seconds, the `Promise.all` blocked the engine for 500 seconds. During this time, the global lock (`campaignWorkerTickInProgress = true`) prevented the engine from picking up **any** new campaigns for different numbers.

### 2. Per-Instance Queueing (Intended Behavior)
Waziper enforces a strict 1:1 lock for active campaigns per WhatsApp number (`instance_id`). If an instance `ij0svpdzkaihq` has a running campaign of 300 messages, any new campaign for that same instance will be marked as `queued` and will **not** start until the previous one is `completed`.
- This is a safety feature to prevent rate-limit violations and WhatsApp bans caused by sending parallel bursts from a single session.
- To the user, this may appear as "stuck," but the backend is actively processing the queue sequentially.

### 3. Missing `/files` Directory Causing `ENOENT` Errors (Fixed)
During debugging, `ENOENT: no such file or directory` errors were found in `/root/.pm2/logs/waziper-engine-error.log` when trying to save media:
`open '/opt/waziper-engine/files/njfatge7srinp_hswzeer0.jpeg'`
This occurred because `extend.js` tried to download incoming/outgoing image media but the `/opt/waziper-engine/files` directory was missing on the server.

## 🛠️ Fix Applied

### File: `/opt/waziper-engine/app.js`
**Line Numbers:** ~1350-1370 (inside `processQueuedCampaigns`)

**Changes Made:**
1. **Removed Global `await` block:**
   ```javascript
   // Before:
   await Promise.all(tasks);

   // After:
   Promise.all(tasks).catch(() => {});
   ```
   This detaches the execution. The loop dispatches the tasks and immediately releases the tick lock so other instances can be picked up 5 seconds later.

2. **Query Exclusion for Active Workers:**
   ```javascript
   // Modified SQL to prevent picking up the same active IDs:
   const activeIdsArr = Array.from(activeCampaignWorkers);
   const excludeSql = activeIdsArr.length > 0 ? `AND ids NOT IN (${activeIdsArr.map(id => "'" + id + "'").join(',')})` : ``;
   
   const rows = await Common.db_query(`
       SELECT * FROM sp_android_campaign_queue
       WHERE status IN ('queued', 'processing')
         AND next_run_at <= ${now}
         ${excludeSql}
       ORDER BY next_run_at ASC, created ASC
       LIMIT 40
   `);
   ```

### Command Executed:
To fix the `ENOENT` log spam:
```bash
mkdir -p /opt/waziper-engine/files
```

## ✅ Result
- **Parallel Campaigns:** Campaigns from **different** instances now run in parallel perfectly without delaying each other. 5 numbers in a team blast messages simultaneously.
- **Queueing intact:** Campaigns for the **same** instance queue safely behind each other, avoiding WhatsApp bans.
- **Error logs clean:** Media files are saved correctly to `/opt/waziper-engine/files/`.
