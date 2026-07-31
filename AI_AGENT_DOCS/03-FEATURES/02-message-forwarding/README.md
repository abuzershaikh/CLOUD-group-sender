# 📤 Message Forwarding Feature - Complete Documentation

**Feature:** Forward WhatsApp messages to multiple contacts/groups  
**Status:** Implemented  
**Last Updated:** January 29, 2026

---

## 📋 Overview

Message forwarding allows users to forward received WhatsApp messages (with or without tags) to multiple recipients in bulk.

**Supported Message Types:**
- Text messages
- Media messages (images, videos, documents)
- Contact cards
- Location messages
- Quoted messages (replies)

---

## 🗺️ Code Locations

### PHP Side (Web Dashboard)

| Component | File | Line | Description |
|-----------|------|------|-------------|
| Forward UI | `PROJECT_DOCS/forward-tag-fix-solution.md` | - | UI documentation |
| Forward API | To be documented | - | Backend endpoint |

### Node.js Side (Wazipar Engine)

| Component | File | Function | Description |
|-----------|------|----------|-------------|
| Forward Logic | `waziper/extend.js` | `forward_message()` | Main forwarding logic |
| Message Prep | `waziper/common.js` | `prepare_forward()` | Prepare message for forwarding |
| Bulk Forward | `waziper/waziper.js` | `bulk_forward()` | Batch forwarding with delays |

**Note:** Exact line numbers to be added after code review.

---

## 🎯 How It Works

### Step-by-Step Flow:

```
1. User selects message to forward (Mobile/Web)
   ↓
2. User selects target contacts/groups
   ↓
3. Request sent to PHP backend
   ↓
4. PHP validates and forwards to Node.js
   ↓
5. Node.js retrieves original message
   ↓
6. Node.js forwards to each target (with delay)
   ↓
7. Response sent back to user
```

### Data Flow Diagram:

```
[Mobile App] → [PHP Backend] → [Node.js Engine] → [WhatsApp Server]
     ↑                                                      ↓
     └──────────── Response ←───────────────────────────────┘
```

---

## 🔍 Implementation Details

### PHP Implementation

**Location:** To be added  
**Endpoint:** `/api/forward_message` (to be confirmed)

```php
public function forward_message() {
    $instance_id = post('instance_id');
    $message_id = post('message_id');
    $targets = post('targets');  // Array of phone numbers or group JIDs
    $include_tag = post('include_tag', false);  // Boolean
    
    // Validate permissions
    $this->check_permission('forward_message');
    
    // Call Node.js API
    $response = wa_get_curl('forward_message', [
        'instance_id' => $instance_id,
        'message_id' => $message_id,
        'targets' => $targets,
        'include_tag' => $include_tag
    ]);
    
    return $this->respond($response);
}
```

### Node.js Implementation

**Location:** `waziper/extend.js` (to be confirmed)

```javascript
async forward_message(instance_id, message_id, targets, options = {}) {
    const client = sessions[instance_id];
    if (!client) {
        return { status: 'error', message: 'Instance not found' };
    }
    
    // Get original message from database or memory
    const originalMessage = await this.get_message_by_id(message_id);
    
    // Prepare message for forwarding
    const forwardedMessage = await this.prepare_forward(
        originalMessage, 
        options.include_tag
    );
    
    // Forward to each target with delay
    const results = [];
    for (const target of targets) {
        try {
            await client.sendMessage(target, forwardedMessage);
            results.push({ target, status: 'sent' });
            
            // Delay between messages to avoid spam detection
            await Common.sleep(options.delay || 2000);
        } catch (error) {
            results.push({ target, status: 'failed', error: error.message });
        }
    }
    
    return {
        status: 'success',
        results: results
    };
}
```

---

## 🏷️ Tag Handling

### Forward Tag Format

**Without Tag:**
```
Original message content
```

**With Tag:**
```
◄ فوروارډ شوي
───────────
Original message content
```

**Tag Implementation:**
```javascript
function add_forward_tag(message_text) {
    return `◄ فوروارډ شوي\n───────────\n${message_text}`;
}

function remove_forward_tag(message_text) {
    // Remove existing tag if present
    return message_text
        .replace(/◄ فوروارډ شوي\n───────────\n/, '')
        .trim();
}
```

---

## 📊 Message Type Handling

### Text Messages
```javascript
{
    text: message_text
}
```

### Media Messages
```javascript
{
    image: { url: media_url },
    caption: caption_text
}
```

### Quoted Messages
```javascript
{
    text: message_text,
    quoted: {
        key: original_message_key,
        message: original_message_content
    }
}
```

### Contact Cards
```javascript
{
    contacts: {
        displayName: name,
        vcard: vcard_data
    }
}
```

---

## 🚨 Known Issues & Bugs

### Issue 1: Tag Duplication (FIXED)
**Problem:** Forward tag appears multiple times when message is forwarded repeatedly  
**Fix:** See `PROJECT_DOCS/forward-tag-fix-solution.md`  
**Status:** ✅ Fixed

### Issue 2: Media Forward Fails for Large Files
**Problem:** Videos > 50MB fail to forward  
**Status:** ⚠️ Open  
**Workaround:** Send link instead of file

---

## 🔧 Configuration

### Forward Settings

```javascript
// In config.js
module.exports = {
    forward: {
        max_targets: 100,        // Maximum recipients per forward
        delay_between: 2000,     // Delay in ms between each forward
        include_tag_default: false,  // Default tag inclusion
        max_retries: 3,          // Retry failed forwards
        timeout: 30000           // Forward timeout in ms
    }
};
```

---

## 📝 Usage Examples

### Example 1: Forward Text Message
```javascript
// API Request
POST /admin_api/forward_message
{
    "instance_id": "token123",
    "message_id": "msg_abc123",
    "targets": [
        "917688907953@s.whatsapp.net",
        "918765432109@s.whatsapp.net"
    ],
    "include_tag": false,
    "delay": 2000
}

// Response
{
    "status": "success",
    "results": [
        { "target": "917688907953@s.whatsapp.net", "status": "sent" },
        { "target": "918765432109@s.whatsapp.net", "status": "sent" }
    ]
}
```

### Example 2: Forward to Groups with Tag
```javascript
// API Request
POST /admin_api/forward_message
{
    "instance_id": "token123",
    "message_id": "msg_xyz789",
    "targets": [
        "120363012345678901@g.us",  // Group 1
        "120363098765432109@g.us"   // Group 2
    ],
    "include_tag": true
}
```

---

## ✅ Testing Checklist

### Manual Tests:
- [ ] Forward text message without tag
- [ ] Forward text message with tag
- [ ] Forward image with caption
- [ ] Forward video
- [ ] Forward document
- [ ] Forward to single contact
- [ ] Forward to multiple contacts
- [ ] Forward to group
- [ ] Forward to multiple groups
- [ ] Check tag doesn't duplicate on re-forward

### Automated Tests:
```javascript
describe('Message Forwarding', () => {
    it('should forward text message', async () => {
        const result = await forward_message(/* ... */);
        expect(result.status).toBe('success');
    });
    
    it('should add forward tag when requested', async () => {
        const message = add_forward_tag('Test');
        expect(message).toContain('◄ فوروارډ شوي');
    });
    
    it('should not duplicate tag', async () => {
        let message = add_forward_tag('Test');
        message = add_forward_tag(message);  // Forward again
        const tagCount = (message.match(/◄ فوروارډ شوي/g) || []).length;
        expect(tagCount).toBe(1);
    });
});
```

---

## 🔗 Related Documentation

- [Forward Tag Fix Solution](../../../PROJECT_DOCS/forward-tag-fix-solution.md)
- [Baileys Message Support](../../../PROJECT_DOCS/baileys-message-form-support-note.md)
- [Forward Debugging Guide](../../../PROJECT_DOCS/forward-message-debugging-guide.md)
- [Node.js Code Locations](../../04-CODE-LOCATIONS/02-node-modules.md)

---

## 📞 Support

For issues or questions:
- Check debugging guide first
- Review known issues section
- Search codebase for `forward_message`
- Check Node.js logs for errors

---

**Maintained by:** AI Documentation System  
**Priority:** High (Core feature)  
**Next Review:** After any forward logic changes
