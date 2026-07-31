# 🐛 BUG-003: Campaign Socket Stop Issues
# Critical Bugs That Can Stop Campaign Mid-Execution

**Severity:** 🔴 CRITICAL  
**Impact:** Campaign stops unexpectedly, messages not delivered  
**Status:** 🔍 IDENTIFIED & DOCUMENTED  
**Last Updated:** January 29, 2026

---

## 📋 BUG SUMMARY

Yeh document un sabhi bugs ko detail karta hai jo campaign execution ko mid-way stop kar sakte hain socket errors ya database issues ki wajah se.

---

## 🐛 BUG 1: Session Lost During Campaign

### Description:
Campaign processing ke dauran agar WhatsApp session disconnect ho jaye (logout, network issue, server restart), to campaign stuck ho jata hai.

### Location:
**File:** `Wazipar/01-02-2026bt_wa/app.js`  
**Function:** `processQueuedCampaignRow()`  
**Line:** ~935

### Root Cause:
```javascript
// Session health check fail hone par campaign 'queued' state mein chala jata hai
const health = await WAZIPER.check_session_health(queueRow.instance_id);
if (!health.healthy) {
  await Common.db_update('sp_android_campaign_queue', [
    { status: 'queued', next_run_at: now + 5 },
    { ids: queueRow.ids }
  ]);
  return;  // Campaign exits but keeps retrying infinitely
}
```

### Problem:
- Agar session permanently lost hai (user ne logout kar diya), to campaign infinite retry loop mein chala jata hai
- Database mein status 'queued' rehta hai but koi progress nahi hoti
- User ko clear error message nahi milta

### Impact:
- Campaign appears "stuck" in processing
- Messages not being sent
- No clear indication to user that relink is needed


### Solution:
```javascript
// Improved health check with clear pause on auth failure
const health = await WAZIPER.check_session_health(queueRow.instance_id);
if (!health.healthy) {
  const healthReason = `${health?.reason || ''}`.toLowerCase();
  const needsRelink = 
    healthReason.includes('not authenticated') ||
    healthReason.includes('missing user.id') ||
    healthReason.includes('session does not exist in memory');
  
  await Common.db_update('sp_android_campaign_queue', [
    {
      status: needsRelink ? 'paused' : 'queued',
      next_run_at: needsRelink ? 0 : now + 5,
      last_error: needsRelink 
        ? 'Session not authenticated. Please relink WhatsApp and Resume.'
        : health.reason
    },
    { ids: queueRow.ids }
  ]);
  return;
}
```

**Status:** ✅ FIXED (already implemented in current code)

---

## 🐛 BUG 2: Socket Connection Lost Mid-Campaign

### Description:
Node.js process ke socket connection drop hone par ongoing campaigns fail ho jate hain without proper recovery.

### Location:
**File:** `Wazipar/01-02-2026bt_wa/app.js`  
**Function:** `sendQueuedCampaignRecipient()`  
**Line:** ~590-620

### Root Cause:
```javascript
// Direct socket call without connection check
const client = WAZIPER.sessions[queueRow.instance_id];
if (!client || !client.user) {
  throw new Error('Session not active');
}

await client.sendMessage(chatId, { forward: forwardSourceMessage });
// If socket drops here, exception is thrown but not properly caught
```

### Problem:
- `client.sendMessage()` internally uses websocket
- Agar socket disconnect ho to `ECONNRESET` ya `socket hang up` error aata hai
- Current code mein yeh error properly catch nahi hota, campaign crash ho jata hai

### Impact:
- Campaign worker crashes
- Status 'processing' pe stuck ho jata hai
- No automatic recovery

### Reproduction Steps:
1. Start a campaign with 100 recipients
2. After 20-30 messages sent, restart Node.js server OR disconnect internet
3. Campaign will throw socket error and stop
4. Status remains 'processing' but nothing happens

### Solution:
```javascript
// Add proper socket error handling with retry
async function sendWithSocketRetry(chatId, message, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = WAZIPER.sessions[queueRow.instance_id];
      
      // Check socket state before sending
      if (!client?.ws?.isOpen || client?.ws?.readyState !== 1) {
        throw new Error('Socket not connected');
      }
      
      const result = await client.sendMessage(chatId, message);
      return result;  // Success
      
    } catch (error) {
      const isSocketError = 
        error.message.includes('socket') ||
        error.message.includes('ECONNRESET') ||
        error.message.includes('ETIMEDOUT');
      
      if (isSocketError && attempt < retries) {
        console.log(`Socket error, retrying (${attempt}/${retries})...`);
        await new Promise(r => setTimeout(r, 2000 * attempt));  // Exponential backoff
        
        // Try to reconnect session
        await WAZIPER.session(queueRow.instance_id, false);
        continue;
      }
      
      throw error;  // Give up after retries
    }
  }
}
```

**Status:** ⚠️ NEEDS FIX

---

## 🐛 BUG 3: Database Lock During High Concurrency

### Description:
Multiple campaigns running simultaneously on same database cause lock timeouts and campaign failures.

### Location:
**File:** `Wazipar/01-02-2026bt_wa/app.js`  
**Function:** `processQueuedCampaignRow()` (database updates)  
**Line:** ~1035-1041

### Root Cause:
```javascript
// Frequent database updates during campaign execution
while (currentIndex < recipients.length) {
  // Send message...
  
  // Update DB after EVERY single message
  await Common.db_update('sp_android_campaign_queue', [
    {
      sent_count: sentCount,
      failed_count: failedCount,
      current_index: currentIndex,
      recipients: JSON.stringify(recipients),  // Large JSON update
      changed: Common.time()
    },
    { ids: queueRow.ids }
  ]);
  
  // If 5 campaigns running parallel, this causes 5 writes/second
}
```

### Problem:
- `recipients` field contains large JSON (can be 10,000+ characters for 100 groups)
- MySQL row locking occurs on every update
- Multiple campaigns = multiple concurrent writes = lock contention
- Lock timeout causes `Lock wait timeout exceeded` error

### Impact:
- Campaign randomly fails with database error
- Other campaigns slow down
- Server load increases

### Reproduction Steps:
1. Start 3-4 campaigns simultaneously
2. Each with 50+ recipients
3. Set delay_seconds = 1 (frequent updates)
4. Watch logs for: `Lock wait timeout exceeded; try restarting transaction`

### Solution:
```javascript
// Batch database updates every 10 messages instead of every message
const DB_UPDATE_BATCH_SIZE = 10;
let messagesSinceLastDbUpdate = 0;

while (currentIndex < recipients.length) {
  // Send message...
  messagesSinceLastDbUpdate++;
  
  // Only update DB every 10 messages OR on completion
  const shouldUpdateDb = 
    messagesSinceLastDbUpdate >= DB_UPDATE_BATCH_SIZE ||
    currentIndex >= recipients.length - 1;
  
  if (shouldUpdateDb) {
    await Common.db_update('sp_android_campaign_queue', [
      {
        sent_count: sentCount,
        failed_count: failedCount,
        current_index: currentIndex,
        recipients: JSON.stringify(recipients),
        changed: Common.time()
      },
      { ids: queueRow.ids }
    ]);
    messagesSinceLastDbUpdate = 0;
  }
}
```

**Alternative Solution: Use Redis for Hot Data**
```javascript
// Store progress in Redis (fast, no locks)
await redis.set(`campaign:${queueRow.ids}:progress`, JSON.stringify({
  currentIndex,
  sentCount,
  failedCount
}), 'EX', 300);  // 5 min expiry

// Only update MySQL on completion or every 50 messages
```

**Status:** ⚠️ NEEDS FIX (high priority for scaling)

---

## 🐛 BUG 4: Memory Leak in Long-Running Campaigns

### Description:
Large campaigns (1000+ recipients) cause Node.js memory to grow unbounded, eventually crashing the process.

### Location:
**File:** `Wazipar/01-02-2026bt_wa/app.js`  
**Function:** `processQueuedCampaignRow()`  
**Line:** Throughout the function

### Root Cause:
```javascript
// Recipients array is kept in memory and constantly updated
const recipients = parseJsonArray(queueRow.recipients);  // 1000+ objects

while (currentIndex < recipients.length) {
  // Each iteration modifies recipients array
  recipients[currentIndex] = {
    ...recipients[currentIndex],
    status: 'sent',
    error: '',
    timestamp: Date.now(),
    // More fields added over time...
  };
  
  // Array is serialized to JSON after EVERY update
  await db_update({ recipients: JSON.stringify(recipients) });
}
// Recipients array never released from memory until completion
```

### Problem:
- For 1000 recipients, `recipients` array ~ 500KB in memory
- JSON.stringify() creates another copy in memory (500KB more)
- Each update creates temporary strings, objects (garbage collection pressure)
- Memory grows from 100MB → 500MB → 1GB → crash

### Impact:
- Node.js process crashes with: `JavaScript heap out of memory`
- All running campaigns fail
- Server restart required

### Reproduction Steps:
1. Create campaign with 1000+ recipients
2. Monitor Node.js memory: `ps aux | grep node`
3. Watch memory grow steadily
4. After 15-20 minutes, process will crash

### Solution:
```javascript
// Option 1: Paginate recipient processing
const PAGE_SIZE = 100;

async function processInPages(queueRow) {
  const allRecipients = parseJsonArray(queueRow.recipients);
  const totalPages = Math.ceil(allRecipients.length / PAGE_SIZE);
  
  for (let page = 0; page < totalPages; page++) {
    const startIdx = page * PAGE_SIZE;
    const endIdx = Math.min(startIdx + PAGE_SIZE, allRecipients.length);
    const pageRecipients = allRecipients.slice(startIdx, endIdx);
    
    // Process this page
    for (const recipient of pageRecipients) {
      await sendMessage(recipient);
    }
    
    // Update DB for this page only
    await db_update({
      current_index: endIdx,
      sent_count: ...,
      // Don't update full recipients array every time
    });
    
    // Force garbage collection between pages
    if (global.gc) global.gc();
  }
}

// Option 2: Store recipient status in separate table
CREATE TABLE sp_campaign_recipient_status (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id VARCHAR(64),
  recipient_index INT,
  chat_id VARCHAR(128),
  status ENUM('pending','sent','failed'),
  error TEXT,
  INDEX idx_campaign (campaign_id)
);
```

**Status:** ⚠️ NEEDS FIX (critical for large campaigns)

---

## 🐛 BUG 5: Race Condition on Campaign Pause/Resume

### Description:
User clicking "Pause" and then immediately "Resume" causes campaign to enter inconsistent state.

### Location:
**File:** `Wazipar/01-02-2026bt_wa/app.js`  
**Endpoints:** `/admin_api/stop_campaign` and `/admin_api/resume_campaign`  
**Line:** ~4005-4083

### Root Cause:
```javascript
// STOP endpoint
app.post('/admin_api/stop_campaign', async (req, res) => {
  await db_update('sp_android_campaign_queue', [
    { status: 'paused' },
    { history_ids: campaign_id }
  ]);
  return res.json({ status: 'success' });
});

// RESUME endpoint (called immediately after)
app.post('/admin_api/resume_campaign', async (req, res) => {
  await db_update('sp_android_campaign_queue', [
    { status: 'queued' },
    { history_ids: campaign_id }
  ]);
  processQueuedCampaigns();  // Trigger worker
  return res.json({ status: 'success' });
});

// Problem: Campaign worker is still running in background!
// It checks status mid-loop and sees 'paused', then user resumes,
// worker updates to 'paused' again, overriding the 'queued' status
```

### Problem:
1. Campaign is processing (status: 'processing')
2. User clicks Pause → status set to 'paused'
3. Worker loop sees 'paused', tries to update status
4. But user already clicked Resume → status set to 'queued'
5. Worker's update overwrites 'queued' back to 'paused'
6. Campaign stuck in paused state even though user resumed

### Impact:
- Campaign appears to ignore Resume button
- Status inconsistency in UI vs database
- Requires manual database fix

### Reproduction Steps:
1. Start campaign with 100 recipients, 5 second delay
2. After 10 messages sent, click "Pause"
3. Immediately click "Resume" (within 1 second)
4. Campaign status shows 'queued' but doesn't process
5. Check database: status might be 'paused' even though UI shows 'queued'

### Solution:
```javascript
// Add mutex lock for campaign state changes
const campaignLocks = new Map();

async function lockCampaign(campaignId) {
  while (campaignLocks.has(campaignId)) {
    await new Promise(r => setTimeout(r, 100));
  }
  campaignLocks.set(campaignId, true);
}

function unlockCampaign(campaignId) {
  campaignLocks.delete(campaignId);
}

// Updated STOP endpoint
app.post('/admin_api/stop_campaign', async (req, res) => {
  const campaignId = req.body.campaign_id;
  
  await lockCampaign(campaignId);
  try {
    await db_update('sp_android_campaign_queue', [
      { status: 'paused', changed: Common.time() },
      { history_ids: campaignId }
    ]);
    
    // Wait for worker to acknowledge pause
    await new Promise(r => setTimeout(r, 500));
    
    return res.json({ status: 'success' });
  } finally {
    unlockCampaign(campaignId);
  }
});

// Updated RESUME endpoint
app.post('/admin_api/resume_campaign', async (req, res) => {
  const campaignId = req.body.campaign_id;
  
  await lockCampaign(campaignId);
  try {
    await db_update('sp_android_campaign_queue', [
      { status: 'queued', changed: Common.time() },
      { history_ids: campaignId }
    ]);
    
    processQueuedCampaigns();
    
    return res.json({ status: 'success' });
  } finally {
    unlockCampaign(campaignId);
  }
});
```

**Status:** ⚠️ NEEDS FIX

---

## 🐛 BUG 6: Forward Message Source Corruption

### Description:
Agar source_message ki structure invalid ho ya incomplete ho, to campaign start hone ke baad crash ho jata hai.

### Location:
**File:** `Wazipar/01-02-2026bt_wa/app.js`  
**Function:** `sendQueuedCampaignRecipient()`  
**Line:** ~505-545

### Root Cause:
```javascript
// Payload validation incomplete
const source = payload.source_message;
if (!source || typeof source !== 'object') {
  throw new Error('Forward payload is missing source_message');
}

// But doesn't validate nested fields
const rawContent = sourceMessage.deviceSentMessage?.message || sourceMessage;
// What if deviceSentMessage exists but message is undefined?

const messageType = getContentType(rawContent);
// What if rawContent is empty object {}?

const forwardMessage = {
  key: source.key,  // What if key is undefined?
  message: {
    [messageType]: rawContent[messageType]  // What if messageType is empty string?
  }
};
```

### Problem:
- Campaign creates successfully (validation passes)
- But when actually sending, corrupted source_message causes crash
- All 100 recipients fail because of one bad source message

### Impact:
- Entire campaign fails
- No way to recover without fixing source_message in database
- User sees generic "Send failed" error

### Reproduction Steps:
1. Manually create campaign via API with incomplete source_message:
```json
{
  "source_message": {
    "key": { "id": "123" },  // Missing remoteJid
    "message": {}  // Empty message
  }
}
```
2. Campaign will fail immediately on first send attempt

### Solution:
```javascript
// Comprehensive validation before campaign creation
function validateSourceMessage(source) {
  const errors = [];
  
  if (!source || typeof source !== 'object') {
    errors.push('source_message must be an object');
  }
  
  // Validate key
  if (!source.key || typeof source.key !== 'object') {
    errors.push('source_message.key is required');
  } else {
    if (!source.key.remoteJid) {
      errors.push('source_message.key.remoteJid is required');
    }
    if (!source.key.id) {
      errors.push('source_message.key.id is required');
    }
  }
  
  // Validate message
  if (!source.message || typeof source.message !== 'object') {
    errors.push('source_message.message is required');
  } else {
    const messageContent = source.message.deviceSentMessage?.message || source.message;
    const messageType = getContentType(messageContent);
    
    if (!messageType) {
      errors.push('source_message.message contains no valid message type');
    }
    
    if (!messageContent[messageType]) {
      errors.push(`source_message.message.${messageType} is empty`);
    }
  }
  
  if (errors.length > 0) {
    throw new Error('Invalid source_message: ' + errors.join(', '));
  }
  
  return true;
}

// Call before creating campaign
app.post('/admin_api/create_campaign', async (req, res) => {
  try {
    const payload = req.body.payload;
    
    if (payload.type === 'forward') {
      validateSourceMessage(payload.source_message);
    }
    
    // Continue with campaign creation...
  } catch (error) {
    return res.json({
      status: 'error',
      message: error.message
    });
  }
});
```

**Status:** ⚠️ NEEDS FIX (add validation)

---
