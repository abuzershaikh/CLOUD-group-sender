# 📤 FORWARD MESSAGE - COMPLETE TECHNICAL DOCUMENTATION
# Group Message Forwarding - Detailed Flow & Implementation

**Last Updated:** January 29, 2026  
**Language:** Urdu/English Mixed Technical Documentation  
**Status:** Production Ready

---

## 📋 TABLE OF CONTENTS

1. [Overview - Forward Message Kya Hai](#overview)
2. [Complete Flow - Kaise Kaam Karta Hai](#complete-flow)
3. [Code Implementation - PHP & Node.js](#code-implementation)
4. [Data Structures - Message Format](#data-structures)
5. [Campaign Processing - Queue System](#campaign-processing)
6. [Socket Communication - Real-time Updates](#socket-communication)
7. [Known Bugs - Critical Issues](#known-bugs)
8. [Testing & Debugging](#testing)

---

## 📖 OVERVIEW - FORWARD MESSAGE KYA HAI {#overview}

### What is Forward Message?

Forward message ek feature hai jis se aap kisi bhi received WhatsApp message ko multiple groups ya contacts ko send kar sakte ho without manually copy-paste kiye.

### Supported Message Types:

✅ Text Messages  
✅ Image Messages (with caption)  
✅ Video Messages  
✅ Document/PDF Messages  
✅ Audio Messages  
✅ Contact Cards  
✅ Location Messages  
✅ Poll Messages  
✅ Quoted Messages (Replies)

### Key Features:

- **Bulk Forward:** Ek hi message ko 100+ groups mein ek saath forward kar sakte ho
- **Native WhatsApp Format:** Message original format mein forward hota hai
- **Forward Tag:** Message pe "Forwarded" tag automatically lagta hai (WhatsApp native)
- **Queue System:** Background mein messages forward hote hain, app hang nahi hota
- **Delay Control:** Messages ke beech delay set kar sakte ho (spam prevention)
- **Retry Logic:** Agar message fail ho to automatic retry hota hai
- **Real-time Progress:** Live tracking ke saath progress dekhte raho

---

## 🔄 COMPLETE FLOW - KAISE KAAM KARTA HAI {#complete-flow}

### Step-by-Step Flow Diagram:

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: USER SELECTS MESSAGE TO FORWARD                        │
│ ─────────────────────────────────────                          │
│ • Mobile app ya web dashboard se user message select karta hai │
│ • Recent messages list se select kar sakte ho                  │
│ • Ya existing campaign se forward kar sakte ho                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: SELECT TARGET GROUPS/CONTACTS                          │
│ ──────────────────────────────────                             │
│ • Groups list se select karo (single/multiple)                 │
│ • CSV file upload karke bulk select kar sakte ho               │
│ • Saved audience list se select kar sakte ho                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: CONFIGURE CAMPAIGN SETTINGS                            │
│ ───────────────────────────────────                            │
│ • Delay between messages (0-60 seconds)                        │
│ • Campaign name                                                │
│ • Instance (WhatsApp number) selection                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: PHP BACKEND RECEIVES REQUEST                           │
│ ───────────────────────────────────────                        │
│ File: Admin_API.php                                            │
│ Endpoint: /admin_api/create_campaign                           │
│                                                                 │
│ Actions:                                                        │
│ ✓ Validate access_token & team_id                             │
│ ✓ Check instance exists & is active                           │
│ ✓ Validate source_message structure                           │
│ ✓ Insert into sp_android_campaign_queue table                 │
│ ✓ Insert into sp_android_campaign_status table                │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: NODE.JS CAMPAIGN WORKER ACTIVATES                      │
│ ────────────────────────────────────────                       │
│ File: app.js                                                    │
│ Function: processQueuedCampaigns()                             │
│                                                                 │
│ • Worker har 250ms mein check karta hai new campaigns ke liye │
│ • sp_android_campaign_queue table se pending campaigns fetch   │
│ • Status 'queued' ya 'processing' wale campaigns process hote │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: CAMPAIGN ROW PROCESSING                                │
│ ───────────────────────────────                                │
│ Function: processQueuedCampaignRow(queueRow)                   │
│                                                                 │
│ Pre-Flight Checks:                                             │
│ ✓ Check if worker already running for this campaign           │
│ ✓ Check if instance already busy with another campaign        │
│ ✓ Check WhatsApp session health (logged in?)                  │
│ ✓ Check adaptive cooldown (rate limiting)                     │
│                                                                 │
│ If all checks pass:                                            │
│ • Update campaign status to 'processing'                       │
│ • Start sending messages one by one                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 7: SEND INDIVIDUAL MESSAGE                                │
│ ────────────────────────────                                   │
│ Function: sendQueuedCampaignRecipient(queueRow)                │
│                                                                 │
│ For FORWARD type messages:                                     │
│                                                                 │
│ 1. Extract source_message from payload                         │
│    {                                                            │
│      key: { remoteJid, id, fromMe, participant },             │
│      message: { imageMessage/textMessage/etc }                 │
│    }                                                            │
│                                                                 │
│ 2. Validate source message structure                           │
│    - Check key.remoteJid exists                               │
│    - Check key.id exists                                      │
│    - Check message content exists                             │
│                                                                 │
│ 3. Get WhatsApp client session                                │
│    const client = WAZIPER.sessions[instance_id];              │
│                                                                 │
│ 4. Call Baileys sendMessage with forward option               │
│    await client.sendMessage(chatId, {                         │
│      forward: forwardSourceMessage,                           │
│      force: true  // Always show forward tag                  │
│    });                                                         │
│                                                                 │
│ 5. Mark recipient as 'sent' or 'failed'                       │
│ 6. Update database with progress                              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 8: DELAY & NEXT RECIPIENT                                 │
│ ───────────────────────────                                    │
│ • User-defined delay apply hoti hai (0-60 seconds)            │
│ • Groups ke liye fast delay (max 1 second)                    │
│ • Adaptive delay system (rate limiting)                       │
│ • Next recipient ka loop chalu hota hai                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 9: CAMPAIGN COMPLETION                                    │
│ ───────────────────────────                                    │
│ When all recipients processed:                                 │
│ • Update campaign status to 'completed'                        │
│ • Update sp_android_campaign_status with final counts         │
│ • Send socket event to frontend (real-time update)            │
│ • Release instance lock (available for next campaign)         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 10: USER SEES RESULTS                                     │
│ ────────────────────────────                                   │
│ • Campaign dashboard pe results dikhai dete hain               │
│ • Sent count, failed count, total recipients                  │
│ • Individual message status (sent/failed/pending)             │
│ • Error messages agar koi issue aaya to                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💻 CODE IMPLEMENTATION - PHP & NODE.JS {#code-implementation}

### 🔷 PHP Backend Code

**File Location:** `Wazipar/01-02-2026bt.wappbuzz.in (2)/inc/core/Admin_API/Controllers/Admin_API.php`

#### API Endpoint: Create Campaign

```php
POST /admin_api/create_campaign

// Request Body
{
  "access_token": "team_token_123",
  "instance_id": "whatsapp_instance_456",
  "campaign_name": "Product Launch Forward",
  "recipients": [
    {
      "number": "120363290960123456@g.us",
      "chat_id": "120363290960123456@g.us",
      "is_group": true,
      "name": "Marketing Group 1"
    },
    {
      "number": "120363290960789012@g.us",
      "chat_id": "120363290960789012@g.us",
      "is_group": true,
      "name": "Sales Group 2"
    }
  ],
  "payload": {
    "type": "forward",
    "source_message": {
      "key": {
        "remoteJid": "917688907953@s.whatsapp.net",
        "id": "3EB0F8A5D2C1B3A4E5F6G7H8",
        "fromMe": false,
        "participant": "917688907953@s.whatsapp.net"
      },
      "message": {
        "imageMessage": {
          "url": "https://mmg.whatsapp.net/v/t62...",
          "mimetype": "image/jpeg",
          "caption": "Check out our new product!",
          "jpegThumbnail": "/9j/4AAQSkZJRg...",
          "width": 1080,
          "height": 1920
        }
      }
    }
  },
  "delay_seconds": 3
}
```

#### Database Tables Used:

**1. sp_android_campaign_queue** (Main Queue Table)
```sql
CREATE TABLE sp_android_campaign_queue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ids VARCHAR(64) NOT NULL UNIQUE,
  history_ids VARCHAR(64),
  team_id INT NOT NULL,
  instance_id VARCHAR(128) NOT NULL,
  campaign_name VARCHAR(255),
  payload TEXT,  -- JSON: { type, source_message, ... }
  recipients TEXT,  -- JSON array of recipients
  current_index INT DEFAULT 0,
  sent_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  delay_seconds INT DEFAULT 0,
  status ENUM('queued','processing','completed','paused','failed'),
  next_run_at INT,
  last_error TEXT,
  created INT,
  changed INT,
  INDEX idx_status (status),
  INDEX idx_instance (instance_id),
  INDEX idx_next_run (next_run_at)
);
```

**2. sp_android_campaign_status** (History Table)
```sql
CREATE TABLE sp_android_campaign_status (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ids VARCHAR(64) NOT NULL UNIQUE,
  team_id INT NOT NULL,
  instance_id VARCHAR(128),
  campaign_name VARCHAR(255),
  total_count INT DEFAULT 0,
  sent_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  status VARCHAR(50),
  created INT,
  changed INT
);
```

---

### 🔷 Node.js Backend Code

**File Location:** `Wazipar/01-02-2026bt_wa/app.js`

#### Main Campaign Worker Function

```javascript
/**
 * Campaign Worker - Runs every 250ms
 * Checks for queued campaigns and processes them
 */
async function processQueuedCampaigns() {
  if (campaignWorkerTickInProgress) return;
  
  campaignWorkerTickInProgress = true;
  const now = Common.time();
  
  try {
    // Fetch all queued/processing campaigns
    const rows = await Common.db_query(`
      SELECT *
      FROM sp_android_campaign_queue
      WHERE status IN ('queued', 'processing')
        AND next_run_at <= ${now}
      ORDER BY next_run_at ASC
      LIMIT 50
    `, false);

    
    if (rows && rows.length > 0) {
      // Process each campaign in parallel
      const tasks = rows.map(row => 
        processQueuedCampaignRow(row).catch(error => {
          console.error(`Campaign ${row.ids} failed:`, error);
        })
      );
      await Promise.all(tasks);
    }
  } catch (error) {
    console.error('processQueuedCampaigns error:', error);
  } finally {
    campaignWorkerTickInProgress = false;
  }
}

// Start worker loop
setInterval(processQueuedCampaigns, 250);  // 250ms interval
```

#### Send Forward Message Function

```javascript
/**
 * Send a forward message to a recipient
 * Extracts source_message from payload and forwards using Baileys
 */
async function sendQueuedCampaignRecipient(queueRow) {
  const payload = parseJsonObject(queueRow.payload);
  const recipients = parseJsonArray(queueRow.recipients);
  const recipient = recipients[queueRow.current_index];
  
  // Extract chat ID (group or individual)
  let chatId = recipient.chat_id || recipient.number;
  const isGroup = chatId.includes('@g.us');
  
  if (payload.type === 'forward') {
    const source = payload.source_message;
    
    // Validate source message
    if (!source?.key?.remoteJid || !source?.key?.id) {
      throw new Error('Invalid source_message structure');
    }

    
    // Extract actual message content
    const sourceMessage = source.message;
    const rawContent = sourceMessage.deviceSentMessage?.message || sourceMessage;
    const messageType = getContentType(rawContent);
    
    // Build forward message object
    const forwardSourceMessage = {
      key: {
        remoteJid: source.key.remoteJid,
        id: source.key.id,
        fromMe: source.key.fromMe,
        participant: source.key.participant || undefined
      },
      message: {
        [messageType]: rawContent[messageType]
      }
    };
    
    // Get WhatsApp session
    const client = WAZIPER.sessions[queueRow.instance_id];
    if (!client?.user) {
      throw new Error('WhatsApp session not active');
    }
    
    // Forward the message
    console.log('🔄 Forwarding message to:', chatId);
    const result = await client.sendMessage(chatId, {
      forward: forwardSourceMessage,
      force: true  // Always show forward tag
    });
    
    console.log('✅ Forward success:', result.key.id);
    return { status: 1, phone_number: chatId };
  }
}
```

---

## 📊 DATA STRUCTURES - MESSAGE FORMAT {#data-structures}

### source_message Object Structure

```javascript
{
  "key": {
    "remoteJid": "917688907953@s.whatsapp.net",  // Source chat ID
    "id": "3EB0F8A5D2C1B3A4E5F6G7H8",           // Message ID
    "fromMe": false,                              // Sent by me?
    "participant": "917688907953@s.whatsapp.net"  // Group sender (optional)
  },
  "message": {
    // One of the following message types:
    
    "conversation": "Plain text message",
    
    "extendedTextMessage": {
      "text": "Text with formatting",
      "contextInfo": { /* quote/mention info */ }
    },
    
    "imageMessage": {
      "url": "https://mmg.whatsapp.net/...",
      "mimetype": "image/jpeg",
      "caption": "Photo caption",
      "jpegThumbnail": "base64_thumbnail",
      "width": 1080,
      "height": 1920
    },
    
    "videoMessage": {
      "url": "https://mmg.whatsapp.net/...",
      "mimetype": "video/mp4",
      "caption": "Video caption",
      "seconds": 60
    },
    
    "documentMessage": {
      "url": "https://mmg.whatsapp.net/...",
      "mimetype": "application/pdf",
      "fileName": "document.pdf",
      "caption": "File description"
    },

    
    "audioMessage": {
      "url": "https://mmg.whatsapp.net/...",
      "mimetype": "audio/ogg; codecs=opus",
      "seconds": 45
    },
    
    "contactMessage": {
      "displayName": "John Doe",
      "vcard": "BEGIN:VCARD\nVERSION:3.0\n..."
    },
    
    "locationMessage": {
      "degreesLatitude": 28.6139,
      "degreesLongitude": 77.2090,
      "name": "India Gate"
    },
    
    "pollCreationMessage": {
      "name": "Which color?",
      "options": [
        { "optionName": "Red" },
        { "optionName": "Blue" }
      ],
      "selectableOptionsCount": 1
    }
  }
}
```

### Recipients Array Structure

```javascript
[
  {
    "number": "120363290960123456@g.us",
    "chat_id": "120363290960123456@g.us",
    "is_group": true,
    "name": "Marketing Group",
    "status": "sent",           // sent | failed | queued
    "error": "",                // Error message if failed
    "retry_count": 0            // Number of retries
  },
  {
    "number": "918765432109",
    "chat_id": "918765432109@s.whatsapp.net",
    "is_group": false,
    "name": "John Doe",
    "status": "failed",
    "error": "Session timeout",
    "retry_count": 2
  }
]
```

---

## ⚙️ CAMPAIGN PROCESSING - QUEUE SYSTEM {#campaign-processing}

### Queue States & Transitions

```
queued → processing → completed
   ↓          ↓           ↓
 paused ←─────┴──────→ failed
   ↓
 resumed → queued (cycle back)
```

### Campaign States Explained:

| State | Description | Next Action |
|-------|-------------|-------------|
| **queued** | Campaign waiting to be processed | Worker picks it up when ready |
| **processing** | Campaign actively sending messages | Continues until all sent or paused |
| **completed** | All messages sent successfully | No further action |
| **paused** | User manually stopped campaign | Waits for resume command |
| **failed** | Unrecoverable error occurred | Requires manual intervention |

### Adaptive Rate Limiting System

System automatically adjusts sending speed based on errors:

```javascript
const adaptiveStates = new Map();  // instance_id → state

function markAdaptiveSuccess(instanceId) {
  const state = adaptiveStates.get(instanceId) || {};
  state.consecutiveErrors = 0;
  state.consecutiveSuccesses = (state.consecutiveSuccesses || 0) + 1;
  
  // Speed up if consistent success
  if (state.consecutiveSuccesses > 10) {
    state.speedMultiplier = 0.8;  // 20% faster
  }
}

function markAdaptiveFailure(instanceId, error) {
  const state = adaptiveStates.get(instanceId) || {};
  state.consecutiveSuccesses = 0;
  state.consecutiveErrors = (state.consecutiveErrors || 0) + 1;
  
  // Slow down on errors
  if (state.consecutiveErrors > 3) {
    state.speedMultiplier = 2.0;  // 2x slower
    state.cooldownUntil = Date.now() + (30 * 1000);  // 30s cooldown
  }
}
```

### Parallel vs Sequential Sending

**Sequential Mode (delay_seconds > 0):**
```javascript
for (let i = 0; i < recipients.length; i++) {
  await sendMessage(recipients[i]);
  await sleep(delay_seconds * 1000);  // Wait between messages
}
```

**Parallel Mode (delay_seconds = 0, groups only):**
```javascript
const BATCH_SIZE = 5;
for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
  const batch = recipients.slice(i, i + BATCH_SIZE);
  await Promise.all(batch.map(r => sendMessage(r)));
  // No delay between batches for ultra-fast group forwarding
}
```

### Retry Logic

```javascript
const RETRY_LIMIT = 8;

async function sendWithRetry(recipient) {
  let retryCount = recipient.retry_count || 0;
  
  try {
    await sendMessage(recipient);
    recipient.status = 'sent';
  } catch (error) {
    const isTransient = isTransientError(error);
    
    if (isTransient && retryCount < RETRY_LIMIT) {
      recipient.status = 'queued';
      recipient.retry_count = retryCount + 1;
      recipient.error = error.message;
      // Campaign will retry this recipient later
    } else {
      recipient.status = 'failed';
      recipient.error = error.message;
    }
  }
}

function isTransientError(error) {
  const transientPatterns = [
    'timeout',
    'ECONNRESET',
    'ETIMEDOUT',
    'socket hang up',
    'temporarily unavailable'
  ];
  return transientPatterns.some(p => 
    error.message.toLowerCase().includes(p)
  );
}
```

---
