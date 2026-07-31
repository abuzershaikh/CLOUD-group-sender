# BUG-006: Instance Not Loading in Engine & Linked Number Missing

**Serial Number:** BUG-006  
**Severity:** 🔴 Critical  
**Status:** Closed/Fixed  
**Component:** Node.js Engine (`app.js`) & Database (`sp_accounts`)  
**Module:** Waziper Engine Startup & Instance Fetching  
**Discovered & Fixed:** July 29, 2026  

---

## 📍 Location

1. **Database:** `wappbuzz` -> `sp_accounts` table
2. **Node Engine File:** `/opt/waziper-engine/app.js` (Lines ~324-335 & ~4595-4605)
3. **API Endpoint Affected:** `/api/instances` (called by Flutter Mobile App)

---

## 🐛 The Problems

### Problem 1: Database Inconsistency (Instances ignored on startup)
Mobile app users successfully linked their WhatsApp accounts, and the sessions were correctly stored and marked active (`status = 1`) in `sp_whatsapp_sessions`. **However, in the `sp_accounts` table, these instances had:**
- `social_network` = `NULL`
- `category` = `NULL`
- `login_type` = `0`
- `status` = `0` (Deleted/Inactive)

**Why this breaks the system:** 
When the PM2 `waziper-engine` restarts, it runs a query (around line 4599 in `app.js`) to load all active sessions into memory:
```sql
SELECT a.token as instance_id, a.name, a.id
FROM sp_accounts as a
WHERE a.social_network = 'whatsapp'
AND a.login_type = '2'
AND a.status = 1
```
Because the fields were `NULL` or `0`, the engine completely ignored these instances and logged: `ℹ️  No active sessions to load`. 
Since they were never loaded into memory, when the mobile app hit `/api/instances?only_active=1`, the engine checked their health (`check_session_health`), saw they were not in memory, returned `healthy: false`, and filtered them out. Thus, **the mobile app showed zero instances.**

### Problem 2: Payload Parsing Issue in `app.js`
Even if the instances loaded, their linked phone numbers would not show up. 
**Why:** The code in `/opt/waziper-engine/app.js` (around line 328) was trying to extract the linked number using an outdated Baileys payload format:
```javascript
// Old Code
entry.linkedNumber = `${decoded.id || decoded.wid || entry.linkedNumber || ''}`.trim();
```
Modern Baileys stores the user information inside `decoded.creds.me`. The engine failed to parse this, resulting in empty/null linked numbers.

---

## 🔧 How to Fix It (Step-by-Step for Future AI Agents)

If instances are active in `sp_whatsapp_sessions` but not showing up in the app, execute these steps on the VPS:

### Step 1: Fix Database Inconsistencies
Login to MySQL on the VPS and update the broken records in `sp_accounts`.

**SQL Command:**
```sql
UPDATE sp_accounts 
SET social_network = 'whatsapp', 
    category = 'profile', 
    login_type = 2, 
    status = 1 
WHERE social_network IS NULL OR status = 0;
```

### Step 2: Patch `app.js` to parse `creds.me`
Edit `/opt/waziper-engine/app.js` on the VPS to properly extract `me` from the session data.

**Target Code (Around line 325 in `app.js`):**
```javascript
const decoded = row.data ? JSON.parse(row.data) : null;
if (decoded && typeof decoded === 'object') {
    // FIX: Add this line to handle modern Baileys structure
    const me = decoded.creds?.me || decoded.me || decoded;
    
    entry.linkedNumber =
        `${me.id || me.wid || me.user || entry.linkedNumber || ''}`.trim();
    entry.linkedName =
        `${me.name || entry.linkedName || ''}`.trim();
}
```

### Step 3: Restart Engine
After patching the database and the node file, restart the engine so it fetches the accounts and loads them into memory.
```bash
pm2 restart all
```

---

## ✅ Verification Steps

1. **Check PM2 Logs:**
   ```bash
   pm2 logs waziper-engine --lines 20
   ```
   **Expected Output:** You should see logs indicating the engine found and successfully loaded the sessions:
   ```text
   🔄 Loading active sessions...
   📱 Found 10 active session(s) to load
      Loading session: ydseu6ew314qy (Instance ydseu6ew314qy)...
      ✅ Loaded: ydseu6ew314qy (Instance ydseu6ew314qy)
   ```

2. **Test the API Endpoint:**
   Fetch the team's access token from `sp_team.ids` and hit the endpoint:
   ```bash
   curl -s "http://127.0.0.1:8000/api/instances?access_token=YOUR_TEAM_TOKEN&only_active=1"
   ```
   **Expected Output:** A JSON array containing the instances with `linkedNumber` properly populated and `healthy: true`.

3. **Check Mobile App:**
   Open the mobile app and navigate to the instances screen. The linked numbers should now be completely visible and manageable.
