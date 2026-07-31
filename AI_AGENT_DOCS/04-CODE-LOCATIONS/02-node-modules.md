# 🟢 Node.js Modules - Code Location Guide

**Purpose:** Quick reference for finding specific functionality in Node.js/Wazipar engine

---

## 📁 Base Path
```
Wazipar/01-02-2026bt_wa/
```

---

## 🔍 Quick Search Index

### Core Functions
| Function | File | Line | Description |
|----------|------|------|-------------|
| Active sessions object | `waziper/waziper.js` | 55 | `const sessions = {}` |
| Create WebSocket | `waziper/waziper.js` | 345 | `makeWASocket()` |
| Session management | `waziper/waziper.js` | 1102 | `session()` |
| Get QR code | `waziper/waziper.js` | 1245 | `get_qrcode()` |
| Get pairing code | `waziper/waziper.js` | 1298 | `get_pairing()` |
| Logout instance | `waziper/waziper.js` | 1452 | `logout()` |
| Send message | `waziper/waziper.js` | ~1800 | `send_message()` |
| Forward message | `waziper/extend.js` | - | `forward_message()` |

### Message Handling
| Function | File | Line | Description |
|----------|------|------|-------------|
| Incoming messages | `waziper/waziper.js` | ~800 | `messages.upsert` event |
| Autoresponder logic | `waziper/waziper.js` | 2656-2806 | Auto-reply processing |
| Chatbot processing | `waziper/waziper.js` | - | AI chatbot responses |
| Call responder | `waziper/waziper.js` | 2915 | Call handling |

### Connection Management
| Function | File | Line | Description |
|----------|------|------|-------------|
| Connection events | `waziper/waziper.js` | 455-780 | `connection.update` |
| QR code generation | `waziper/waziper.js` | 493-505 | QR event handler |
| Authentication | `waziper/waziper.js` | 671-678 | Auth complete handler |
| Reconnection logic | `waziper/waziper.js` | 3457-3480 | Retry mechanism |

---

## 📂 File Structure

```
Wazipar/01-02-2026bt_wa/
├── app.js                          [Main entry point, Express routes]
├── config.js                       [Configuration (DB, ports, Redis)]
├── package.json                    [Dependencies]
├── waziper/
│   ├── waziper.js                  [Core WhatsApp engine - 4000+ lines]
│   ├── common.js                   [Database & utility functions]
│   └── extend.js                   [Extended features (AI, webhooks)]
├── sessions/                       [Session auth files]
│   ├── token123/
│   │   └── creds.json
│   └── token456/
│       └── creds.json
└── node_modules/                   [Dependencies]
    └── @whiskeysockets/baileys/    [WhatsApp library]
```

---

## 🎯 Main Files Breakdown

### 1. app.js - API Routes & Server Setup

**Purpose:** Express.js server with REST API endpoints

**Key Sections:**
```javascript
// Line 1-50: Imports and table creation
const config = require("./config.js");
const Common = require("./waziper/common.js");
const WAZIPER = require("./waziper/waziper.js");

// Line ~60-100: Server startup
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});

// Line ~150+: API Routes
app.post('/get_qrcode', async (req, res) => {
  await WAZIPER.get_qrcode(instance_id, res);
});

app.post('/get_pairing', async (req, res) => {
  await WAZIPER.get_pairing(instance_id, req, res);
});

app.post('/send_message', async (req, res) => {
  // Message sending endpoint
});

app.post('/logout', async (req, res) => {
  await WAZIPER.logout(instance_id, res);
});
```

**Common Routes:**
- `/get_qrcode` - Generate QR code for authentication
- `/get_pairing` - Generate 8-digit pairing code
- `/check_login` - Check if instance is connected
- `/send_message` - Send WhatsApp message
- `/forward_message` - Forward message to contacts/groups
- `/logout` - Disconnect and logout instance
- `/get_groups` - Get list of groups
- `/health_check` - Check instance health

---

### 2. waziper/waziper.js - Core Engine (4000+ lines)

**Purpose:** WhatsApp connection management, message handling, automation

**Critical Objects:**
```javascript
// Line 55: Active WebSocket connections
const sessions = {};

// Line 56: Pending sessions (QR code waiting)
const new_sessions = {};

// Line 51: Bulk messaging state
const bulks = {};

// Line 53: Chatbot conversation state
const chatbots = {};
```

**Key Functions:**

#### Connection Management
```javascript
// Line 345-760: makeWASocket()
// Creates WhatsApp WebSocket connection
// Handles events: connection.update, messages.upsert, groups.update

// Line 1102-1163: session()
// Returns existing session or creates new one
// Parameters: instance_id, reset (boolean)
async session(instance_id, reset) {
  if (sessions[instance_id] == undefined || reset) {
    sessions[instance_id] = await this.makeWASocket(instance_id);
  }
  return sessions[instance_id];
}

// Line 1452-1510: logout()
// Disconnects instance and deletes session files
async logout(instance_id, res) {
  if (sessions[instance_id]) {
    const sessionRef = sessions[instance_id];
    await sessionRef.logout();
    delete sessions[instance_id];
    // Delete files
    rimraf.sync(`sessions/${instance_id}/`);
  }
}
```

#### Authentication
```javascript
// Line 1245-1295: get_qrcode()
// Returns QR code for mobile scanning
async get_qrcode(instance_id, res) {
  var client = sessions[instance_id];
  if (client && client.qrcode) {
    return res.json({
      status: 'success',
      qrcode: client.qrcode
    });
  }
}

// Line 1298-1410: get_pairing()
// Generates 8-digit pairing code
async get_pairing(instance_id, req, res) {
  const phone = req.body.phone;
  const code = await client.requestPairingCode(phone);
  return res.json({
    status: 'success',
    code: code
  });
}
```

#### Message Handling
```javascript
// Line ~800-1000: messages.upsert event handler
client.ev.on("messages.upsert", async (m) => {
  const message = m.messages[0];
  const chat_id = message.key.remoteJid;
  
  // Process autoresponder
  await WAZIPER.autoresponder_check(instance_id, chat_id, message);
  
  // Process chatbot
  await WAZIPER.chatbot_check(instance_id, chat_id, message);
});

// Line 2656-2806: autoresponder_check()
// Auto-reply logic based on rules
async autoresponder_check(instance_id, chat_id, message) {
  // Check delay
  // Match keywords
  // Send response
  await sessions[instance_id].sendMessage(chat_id, {
    text: response_text
  });
}
```

#### Bulk Messaging
```javascript
// Line ~1800+: send_bulk_messages()
// Sends messages to multiple contacts with delays
async send_bulk_messages(instance_id, campaign_id, contacts) {
  for (let contact of contacts) {
    await sessions[instance_id].sendMessage(contact.phone, {
      text: contact.message
    });
    await sleep(delay_seconds * 1000);
  }
}
```

---

### 3. waziper/common.js - Database & Utilities

**Purpose:** Database operations, helper functions

**Key Functions:**
```javascript
// Database operations
db_query(sql)           // Execute raw SQL
db_get(table, where)    // Get single row
db_fetch(table, where)  // Get multiple rows
db_update(table, data, where)
db_insert(table, data)
db_delete(table, where)

// Utility functions
sleep(ms)               // Delay execution
format_phone(phone)     // Format phone number
get_file_extension(filename)
save_media(buffer, filename)
```

**Example Usage:**
```javascript
// Get account from database
const account = await Common.db_get('sp_accounts', [{
  token: instance_id,
  team_id: team_id
}]);

// Update session status
await Common.db_update('sp_whatsapp_sessions', [{
  status: 1,
  changed: Date.now() / 1000
}, {
  instance_id: instance_id
}]);
```

---

### 4. waziper/extend.js - Extended Features

**Purpose:** Advanced features (AI, webhooks, integrations)

**Key Functions:**
```javascript
// AI Chatbot
process_ai_response(instance_id, chat_id, user_message)

// Webhook notifications
send_webhook(url, data)

// Message forwarding
forward_message(instance_id, message_id, target_contacts)

// Media handling
download_media(message)
upload_media(file_path)
```

---

## 🔄 Message Flow

### Incoming Message Flow:
```
1. WhatsApp Server
   ↓
2. Baileys WebSocket (sessions[instance_id].ws)
   ↓
3. messages.upsert event (waziper.js ~800)
   ↓
4. Autoresponder check (line 2656)
   ↓
5. Chatbot check (if autoresponder didn't respond)
   ↓
6. Database logging (sp_whatsapp_messages)
   ↓
7. Webhook notification (if configured)
```

### Outgoing Message Flow:
```
1. API Request (/send_message)
   ↓
2. Validate instance & permissions
   ↓
3. Get session: sessions[instance_id]
   ↓
4. Send via Baileys: client.sendMessage()
   ↓
5. Log to database
   ↓
6. Return response to API caller
```

---

## 🎯 Critical Code Sections

### Instance State Check
**Location:** waziper.js, multiple functions  
**Pattern:**
```javascript
// Always check if instance exists before using
if (!sessions[instance_id]) {
  return res.json({
    status: 'error',
    message: 'Instance not found'
  });
}

// Check WebSocket state
const wsState = sessions[instance_id].ws.readyState;
if (wsState !== 1) {  // 1 = OPEN
  // Handle disconnected state
}
```

### Safe Session Deletion
**Location:** waziper.js, line 1452-1510  
**Critical Fix:**
```javascript
// ❌ WRONG: sessions[instance_id] may become undefined during logout
if (sessions[instance_id]) {
  await sessions[instance_id].logout();
  await sessions[instance_id].ws.close();  // Error!
}

// ✅ CORRECT: Store reference before logout
if (sessions[instance_id]) {
  const sessionRef = sessions[instance_id];
  await sessionRef.logout();  // This deletes sessions[instance_id]
  if (sessionRef.ws) {
    await sessionRef.ws.close();  // Now safe to use
  }
}
```

### Reconnection Logic
**Location:** waziper.js, line 3457  
```javascript
// Retry connection without deleting session files
async retry_connection(instance_id) {
  try {
    // Close existing connection
    if (sessions[instance_id]?.ws) {
      sessions[instance_id].ws.close();
    }
    
    // Remove from memory (but keep files!)
    delete sessions[instance_id];
    
    // Wait before reconnecting
    await sleep(3000);
    
    // Reconnect
    sessions[instance_id] = await WAZIPER.session(instance_id, false);
  } catch (error) {
    console.error('Retry failed:', error);
  }
}
```

---

## 🚨 Common Pitfalls

### 1. Not Checking Instance Existence
```javascript
// ❌ WRONG
await sessions[instance_id].sendMessage(/* ... */);

// ✅ CORRECT
if (sessions[instance_id]) {
  await sessions[instance_id].sendMessage(/* ... */);
} else {
  // Handle missing instance
}
```

### 2. Forgetting Async/Await
```javascript
// ❌ WRONG
WAZIPER.send_message(instance_id, chat_id, text);

// ✅ CORRECT
await WAZIPER.send_message(instance_id, chat_id, text);
```

### 3. Not Handling WebSocket States
```javascript
// ❌ WRONG
if (sessions[instance_id]) {
  // Assume it's connected
}

// ✅ CORRECT
if (sessions[instance_id] && 
    sessions[instance_id].ws.readyState === 1) {
  // Actually connected
}
```

---

## 🔗 Related Documentation

- [PHP Controllers](./01-php-controllers.md)
- [Instance Tracking](../07-SESSIONS/01-instance-tracking.md)
- [API Reference](../06-API-REFERENCE/01-whatsapp-api.md)
- [Forward Function Location](../03-FEATURES/02-message-forwarding/node-implementation.md)

---

**Maintained by:** AI Documentation System  
**Last Updated:** January 29, 2026
