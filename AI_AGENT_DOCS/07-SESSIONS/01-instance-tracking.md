# 📱 Instance Tracking - How WhatsApp Instances Are Managed

**Last Updated:** January 29, 2026

---

## 🎯 Overview

WhatsApp instances in the system are tracked at multiple levels:
1. **Runtime Memory** (Node.js `sessions` object)
2. **Database** (MySQL tables)
3. **File System** (Session authentication files)

---

## 🔴 Active Instances in Memory

### Location
**File:** `Wazipar/01-02-2026bt_wa/waziper/waziper.js`  
**Line:** 55  
**Object:** `sessions`

### Declaration
```javascript
const sessions = {};  // Active WhatsApp socket connections
```

### Structure
```javascript
sessions = {
  "instance_token_123": {
    ws: WebSocket,              // WebSocket connection
    user: {                     // User info
      id: "917688907953@s.whatsapp.net",
      name: "User Name",
      avatar: "base64_image"
    },
    groups: [                   // Cached groups
      { id: "group@g.us", name: "Group Name", isAdmin: true }
    ],
    qrcode: "qr_data",         // QR code (only during pairing)
    lastCall: {},              // Call response tracking
    _isRefreshingGroups: false // Group refresh lock
  },
  "instance_token_456": { /* ... */ }
}
```

### Key Properties

| Property | Type | Purpose |
|----------|------|---------|
| `ws` | WebSocket | Active connection to WhatsApp servers |
| `user` | Object | Logged-in user information |
| `groups` | Array | Cached list of groups user is in |
| `qrcode` | String | QR code during authentication (temporary) |
| `lastCall` | Object | Tracks last call response time per chat |

---

## 💾 Database Storage

### Primary Table: `sp_accounts`

**Purpose:** Stores all account information

**Key Columns:**
```sql
CREATE TABLE sp_accounts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ids VARCHAR(50),              -- Unique account identifier
  team_id INT,                  -- Team owner
  pid INT,                      -- Platform ID
  token VARCHAR(255),           -- Instance token (used as key in sessions)
  name VARCHAR(255),            -- Account display name
  social_network VARCHAR(50),   -- 'whatsapp'
  category VARCHAR(50),         -- 'profile'
  login_type INT,               -- 1=QR, 2=Pairing code
  status TINYINT,               -- 0=Deleted, 1=Inactive, 2=Active
  can_post TINYINT,             -- Can send messages
  avatar TEXT,                  -- Profile picture
  created INT,                  -- Creation timestamp
  changed INT                   -- Last update timestamp
);
```

**Status Codes:**
- `0` = Deleted/Not active
- `1` = Logged in but inactive
- `2` = Fully active and connected

### Secondary Table: `sp_whatsapp_sessions`

**Purpose:** Tracks WhatsApp connection state

**Key Columns:**
```sql
CREATE TABLE sp_whatsapp_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ids VARCHAR(50),
  team_id INT,
  instance_id VARCHAR(255),     -- Links to sp_accounts.token
  name VARCHAR(255),            -- WhatsApp name
  phone VARCHAR(50),            -- Phone number
  status TINYINT,               -- 0=Disconnected, 1=Connected
  created INT,
  changed INT
);
```

**Status Codes:**
- `0` = Disconnected/Not authenticated
- `1` = Connected and authenticated

---

## 📁 File System Storage

### Session Files Location
**Path:** `Wazipar/01-02-2026bt_wa/sessions/[instance_token]/`

### Directory Structure
```
sessions/
├── instance_token_123/
│   ├── creds.json           # Authentication credentials
│   ├── app-state-sync-key-*.json  # WhatsApp state sync
│   └── app-state-sync-version-*.json
├── instance_token_456/
│   └── ...
└── instance_token_789/
    └── ...
```

**Important Files:**
- `creds.json` - Contains auth keys, phone number, registration data
- `app-state-sync-*` - WhatsApp state synchronization data

---

## 🔄 Instance Lifecycle

### 1. Creation (Registration)
```javascript
// User scans QR or enters pairing code
sessions[instance_id] = await WAZIPER.makeWASocket(instance_id);

// QR code generated
new_sessions[instance_id] = expiry_timestamp;
```

### 2. Authentication
```javascript
// connection.update event with 'open' status
sessions[instance_id] = WA;  // Store active socket
delete new_sessions[instance_id];  // Remove from pending

// Database update
await Common.db_update('sp_accounts', [
  { status: 1 },
  { token: instance_id }
]);
```

### 3. Active State
```javascript
// Instance is connected and ready
sessions[instance_id].ws.readyState === 1  // OPEN

// Can send messages, receive events
await sessions[instance_id].sendMessage(/* ... */);
```

### 4. Disconnection
```javascript
// connection.update with 'close' status
delete sessions[instance_id];

// Database update
await Common.db_update('sp_whatsapp_sessions', [
  { status: 0 },
  { instance_id: instance_id }
]);
```

### 5. Logout/Delete
```javascript
// User initiates logout
await sessions[instance_id].logout();
delete sessions[instance_id];

// Delete session files
rimraf.sync(`sessions/${instance_id}/`);

// Database cleanup
await Common.db_delete('sp_accounts', { token: instance_id });
```

---

## 🔍 Checking Active Instances

### Method 1: Node.js Runtime
```javascript
// In waziper.js or any file with access to sessions
const activeInstances = Object.keys(sessions);
console.log(`Total active: ${activeInstances.length}`);
console.log('Instance IDs:', activeInstances);

// Check specific instance
if (sessions['token123']) {
  console.log('Instance token123 is active');
  console.log('User:', sessions['token123'].user.name);
  console.log('WebSocket state:', sessions['token123'].ws.readyState);
}
```

### Method 2: Database Query
```sql
-- Count active instances per team
SELECT team_id, COUNT(*) as active_count
FROM sp_whatsapp_sessions
WHERE status = 1
GROUP BY team_id;

-- List all active instances with details
SELECT 
  a.token,
  a.name,
  s.phone,
  s.status,
  a.login_type,
  FROM_UNIXTIME(a.created) as created_at
FROM sp_accounts a
JOIN sp_whatsapp_sessions s ON a.token = s.instance_id
WHERE a.social_network = 'whatsapp'
  AND s.status = 1
  AND a.team_id = YOUR_TEAM_ID;
```

### Method 3: API Endpoint
```bash
# If API endpoint exists
curl -X GET "http://localhost:3000/admin_api/get_active_instances" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Method 4: CLI Command
```bash
# Count session directories
ls -la sessions/ | grep -c "^d" 

# List all session directories
ls -1 sessions/

# Check if specific instance exists
if [ -d "sessions/token123" ]; then
  echo "Instance token123 exists"
fi
```

---

## 📊 Instance State Matrix

| Memory (sessions) | Database (status) | File System | State |
|-------------------|-------------------|-------------|-------|
| ✅ Exists | 1 (Connected) | ✅ Exists | **Active & Connected** |
| ❌ Not exists | 1 (Connected) | ✅ Exists | **Disconnected, can reconnect** |
| ❌ Not exists | 0 (Disconnected) | ✅ Exists | **Offline, needs auth** |
| ❌ Not exists | 0 (Disconnected) | ❌ Not exists | **Deleted/New** |

---

## 🛠️ Common Operations

### Get Total Active Instances
```javascript
// Node.js
const totalActive = Object.keys(sessions).length;
```

```sql
-- SQL
SELECT COUNT(*) FROM sp_whatsapp_sessions WHERE status = 1;
```

### Check Instance Status
```javascript
// Node.js - Check if instance is active
function isInstanceActive(instance_id) {
  return sessions[instance_id] !== undefined &&
         sessions[instance_id].ws &&
         sessions[instance_id].ws.readyState === 1;
}
```

### Reconnect Disconnected Instance
```javascript
// Node.js
if (!sessions[instance_id]) {
  sessions[instance_id] = await WAZIPER.session(instance_id, false);
}
```

### Clean Up Dead Sessions
```javascript
// Node.js - Remove disconnected sessions from memory
Object.keys(sessions).forEach(instance_id => {
  if (sessions[instance_id].ws.readyState === 3) {  // CLOSED
    delete sessions[instance_id];
  }
});
```

---

## 🚨 Important Notes

1. **Memory vs Database:** 
   - `sessions` object = Currently connected instances
   - Database = All instances (connected + disconnected)

2. **Token is Key:**
   - `sp_accounts.token` = Primary identifier
   - Used as key in `sessions` object
   - Used in file system directory name

3. **Status Confusion:**
   - `sp_accounts.status` (0/1/2) ≠ `sp_whatsapp_sessions.status` (0/1)
   - Always check correct table for correct meaning

4. **File System Persistence:**
   - Session files persist even after process restart
   - Can reconnect without QR code if files exist

---

## 🔗 Related Documentation

- [Active Instances Count](./02-active-instances.md)
- [Session Lifecycle](./03-session-lifecycle.md)
- [Bug: Instance Visibility](../02-BUGS/BUG-001-instance-visibility.md)

---

**Maintained by:** AI Documentation System  
**Next Review:** After any instance management changes
