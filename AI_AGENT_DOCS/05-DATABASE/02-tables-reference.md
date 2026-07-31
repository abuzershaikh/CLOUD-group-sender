# 🗄️ Database Tables Reference

**Database:** MySQL  
**Prefix:** `sp_`  
**Last Updated:** January 29, 2026

---

## 📋 Table Categories

### Core Tables
- [sp_users](#sp_users) - System users
- [sp_team](#sp_team) - User teams/workspaces
- [sp_plans](#sp_plans) - Subscription plans
- [sp_accounts](#sp_accounts) - Social media accounts (including WhatsApp)

### WhatsApp Tables
- [sp_whatsapp_sessions](#sp_whatsapp_sessions) - Connection status
- [sp_whatsapp_messages](#sp_whatsapp_messages) - Message history
- [sp_whatsapp_autoresponder](#sp_whatsapp_autoresponder) - Auto-reply rules
- [sp_whatsapp_chatbot](#sp_whatsapp_chatbot) - Chatbot configurations
- [sp_whatsapp_callresponder](#sp_whatsapp_callresponder) - Call auto-response
- [sp_whatsapp_subscribers](#sp_whatsapp_subscribers) - Contact list
- [sp_whatsapp_webhook](#sp_whatsapp_webhook) - Webhook configs
- [sp_whatsapp_ai](#sp_whatsapp_ai) - AI chatbot settings
- [sp_groups](#sp_groups) - WhatsApp groups cache

### Campaign Tables
- [sp_android_campaign_status](#sp_android_campaign_status) - Campaign history
- [sp_android_campaign_queue](#sp_android_campaign_queue) - Pending campaigns
- [sp_android_group_sender_status](#sp_android_group_sender_status) - Group send history
- [sp_android_whatsapp_parent_groups](#sp_android_whatsapp_parent_groups) - Multi-group sets

---

## 📊 Core Tables

### sp_users
**Purpose:** Stores system user accounts

**Structure:**
```sql
CREATE TABLE sp_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ids VARCHAR(50) NOT NULL,           -- Unique identifier
    is_admin TINYINT DEFAULT 0,         -- 1 = admin user
    role INT DEFAULT 0,                 -- User role ID
    fullname VARCHAR(255),              -- Full name
    username VARCHAR(100) UNIQUE,       -- Login username
    email VARCHAR(255) UNIQUE,          -- Email address
    password VARCHAR(255),              -- MD5 hashed password
    plan INT,                           -- Plan ID (FK to sp_plans)
    expiration_date INT,                -- Unix timestamp (0 = no expiry)
    timezone VARCHAR(100),              -- User timezone
    login_type VARCHAR(50),             -- 'direct', 'google', etc.
    avatar TEXT,                        -- Profile picture path
    status TINYINT DEFAULT 2,           -- 0=Banned, 1=Inactive, 2=Active
    changed INT,                        -- Last update timestamp
    created INT                         -- Creation timestamp
);
```

**Status Codes:**
- `0` = Banned/Deleted
- `1` = Inactive
- `2` = Active ✅

**Indexes:**
- PRIMARY KEY (`id`)
- UNIQUE (`ids`, `username`, `email`)
- INDEX (`plan`, `status`)

---

### sp_team
**Purpose:** User workspaces/teams

**Structure:**
```sql
CREATE TABLE sp_team (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ids VARCHAR(50) NOT NULL UNIQUE,    -- Access token for API
    owner INT NOT NULL,                 -- User ID (FK to sp_users)
    pid INT,                            -- Plan ID (FK to sp_plans)
    permissions TEXT,                   -- JSON permissions object
    data TEXT                           -- Additional team data (JSON)
);
```

**Important:**
- `ids` field is used as API access token
- Each user can have one team
- Permissions stored as JSON: `{"feature_name": limit_value}`

---

### sp_accounts
**Purpose:** Social media accounts (WhatsApp, Facebook, etc.)

**Structure:**
```sql
CREATE TABLE sp_accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ids VARCHAR(50) NOT NULL,
    team_id INT NOT NULL,               -- Team owner (FK to sp_team)
    pid INT,                            -- Platform ID
    token VARCHAR(255),                 -- Instance token (for WhatsApp)
    name VARCHAR(255),                  -- Display name
    username VARCHAR(255),              -- Account username
    password TEXT,                      -- Account password (if applicable)
    avatar TEXT,                        -- Profile picture
    url TEXT,                           -- Profile URL
    social_network VARCHAR(50),         -- 'whatsapp', 'facebook', etc.
    category VARCHAR(50),               -- 'profile', 'page', 'group'
    login_type INT,                     -- 1=QR code, 2=Pairing code
    can_post TINYINT DEFAULT 1,         -- Can send messages
    status TINYINT DEFAULT 1,           -- 0=Deleted, 1=Active, 2=Reserved
    data TEXT,                          -- Additional data (JSON)
    changed INT,
    created INT,
    module VARCHAR(100)                 -- Module that manages this account
);
```

**Status Codes (for WhatsApp):**
- `0` = Deleted/Inactive ❌
- `1` = Active (logged in) ✅
- `2` = Reserved/Special status

**Important Fields:**
- `token` - Used as key in Node.js `sessions` object
- `login_type` - 1=QR, 2=Pairing code
- `social_network` - Filter to get WhatsApp: `'whatsapp'`
- `category` - Usually `'profile'` for WhatsApp

**Indexes:**
- PRIMARY KEY (`id`)
- UNIQUE (`ids`)
- INDEX (`team_id`, `social_network`, `status`)
- INDEX (`token`)

---

## 📱 WhatsApp Tables

### sp_whatsapp_sessions
**Purpose:** Track WhatsApp connection status

**Structure:**
```sql
CREATE TABLE sp_whatsapp_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ids VARCHAR(50) NOT NULL,
    team_id INT NOT NULL,
    instance_id VARCHAR(255) NOT NULL,  -- Links to sp_accounts.token
    name VARCHAR(255),                  -- WhatsApp display name
    phone VARCHAR(50),                  -- Phone number
    avatar TEXT,                        -- Profile picture
    status TINYINT DEFAULT 0,           -- 0=Disconnected, 1=Connected
    data TEXT,                          -- Additional session data
    created INT,
    changed INT
);
```

**Status Codes:**
- `0` = Disconnected ❌
- `1` = Connected ✅

**Relationship:**
```
sp_accounts.token = sp_whatsapp_sessions.instance_id
```

---

### sp_whatsapp_messages
**Purpose:** Store message history

**Structure:**
```sql
CREATE TABLE sp_whatsapp_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ids VARCHAR(50) NOT NULL,
    team_id INT NOT NULL,
    instance_id VARCHAR(255) NOT NULL,
    remote_jid VARCHAR(255),            -- Chat/Group JID
    message_id VARCHAR(255),            -- WhatsApp message ID
    from_me TINYINT,                    -- 1=Sent by us, 0=Received
    message_type VARCHAR(50),           -- 'text', 'image', 'video', etc.
    message_body TEXT,                  -- Message content
    caption TEXT,                       -- Media caption
    quoted_message_id VARCHAR(255),     -- If replying
    status VARCHAR(50),                 -- 'sent', 'delivered', 'read'
    timestamp INT,                      -- Message timestamp
    created INT
);
```

**Message Types:**
- `text` - Plain text
- `image` - Image with optional caption
- `video` - Video with optional caption
- `document` - Document/file
- `audio` - Voice/audio message
- `sticker` - Sticker
- `location` - Location share
- `contact` - Contact card

---

### sp_whatsapp_autoresponder
**Purpose:** Auto-reply rules

**Structure:**
```sql
CREATE TABLE sp_whatsapp_autoresponder (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ids VARCHAR(50) NOT NULL,
    team_id INT NOT NULL,
    instance_id VARCHAR(255) NOT NULL,
    name VARCHAR(255),                  -- Rule name
    keyword TEXT,                       -- Trigger keywords (JSON array)
    response TEXT,                      -- Response message
    media TEXT,                         -- Media file path
    delay INT DEFAULT 0,                -- Delay in minutes
    status TINYINT DEFAULT 1,           -- 0=Inactive, 1=Active
    match_type VARCHAR(50),             -- 'exact', 'contains', 'starts'
    chat_type VARCHAR(50),              -- 'all', 'private', 'group'
    created INT,
    changed INT
);
```

**Match Types:**
- `exact` - Keyword matches exactly
- `contains` - Message contains keyword
- `starts` - Message starts with keyword
- `regex` - Regular expression match

---

### sp_whatsapp_chatbot
**Purpose:** AI chatbot configurations

**Structure:**
```sql
CREATE TABLE sp_whatsapp_chatbot (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ids VARCHAR(50) NOT NULL,
    team_id INT NOT NULL,
    instance_id VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    trigger_keyword TEXT,               -- Keywords to activate bot
    system_prompt TEXT,                 -- AI system instructions
    status TINYINT DEFAULT 1,
    run TINYINT DEFAULT 0,              -- 0=Stopped, 1=Running
    sent INT DEFAULT 0,                 -- Messages sent count
    is_default TINYINT DEFAULT 0,       -- Is default chatbot
    save_data TINYINT DEFAULT 1,        -- Save conversation history
    created INT,
    changed INT
);
```

---

### sp_whatsapp_subscribers
**Purpose:** Contact/subscriber management

**Structure:**
```sql
CREATE TABLE sp_whatsapp_subscribers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    team_id INT NOT NULL,
    instance_id VARCHAR(255) NOT NULL,
    chatid VARCHAR(255) NOT NULL,       -- Contact JID
    name VARCHAR(255),                  -- Contact name
    phone VARCHAR(50),                  -- Phone number
    data TEXT,                          -- Custom fields (JSON)
    tags TEXT,                          -- Tags (JSON array)
    status TINYINT DEFAULT 1,           -- Active/Blocked
    created INT,
    changed INT,
    UNIQUE KEY (instance_id, chatid)
);
```

---

### sp_groups
**Purpose:** Cache WhatsApp group information

**Structure:**
```sql
CREATE TABLE sp_groups (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ids VARCHAR(50) NOT NULL,           -- Instance token
    gid VARCHAR(255) NOT NULL,          -- Group JID
    name VARCHAR(255),                  -- Group name
    description TEXT,                   -- Group description
    avatar TEXT,                        -- Group picture
    participants INT DEFAULT 0,         -- Member count
    is_admin TINYINT DEFAULT 0,         -- User is admin
    created INT,
    changed INT,
    UNIQUE KEY (ids, gid)
);
```

---

## 📊 Campaign Tables

### sp_android_campaign_status
**Purpose:** Campaign execution history

**Structure:**
```sql
CREATE TABLE sp_android_campaign_status (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ids VARCHAR(50) NOT NULL,
    team_id INT NOT NULL,
    user_email VARCHAR(255),
    campaign_name VARCHAR(255),
    target_name VARCHAR(255),           -- Contact list name
    target_count INT DEFAULT 0,
    sent_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,
    message_mode VARCHAR(50),           -- 'text', 'media', 'forward'
    message_label VARCHAR(255),
    delay_seconds INT DEFAULT 0,
    instance_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'completed',
    meta LONGTEXT,                      -- Campaign metadata (JSON)
    items LONGTEXT,                     -- Detailed results (JSON)
    created INT,
    changed INT
);
```

**Message Modes:**
- `text` - Plain text message
- `media` - Image/video/document
- `forward` - Forward existing message
- `group_text` - Send to groups
- `group_media` - Media to groups
- `group_forward` - Forward to groups

---

### sp_android_whatsapp_parent_groups
**Purpose:** Group sets for bulk operations

**Structure:**
```sql
CREATE TABLE sp_android_whatsapp_parent_groups (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ids VARCHAR(50) NOT NULL,
    team_id INT NOT NULL,
    user_email VARCHAR(255),
    group_name VARCHAR(255),            -- Parent group name
    group_count INT DEFAULT 0,          -- Number of linked groups
    instance_count INT DEFAULT 0,       -- Number of instances used
    linked_groups LONGTEXT,             -- Array of group details (JSON)
    created INT,
    changed INT
);
```

**linked_groups JSON Structure:**
```json
[
    {
        "groupId": "120363012345678901@g.us",
        "groupName": "Marketing Team",
        "instanceId": "token123",
        "instanceName": "Business Account"
    }
]
```

---

## 🔍 Common Queries

### Get Active WhatsApp Accounts
```sql
SELECT 
    a.id,
    a.token,
    a.name,
    s.phone,
    s.status as connection_status
FROM sp_accounts a
LEFT JOIN sp_whatsapp_sessions s ON a.token = s.instance_id
WHERE a.social_network = 'whatsapp'
  AND a.category = 'profile'
  AND a.team_id = ?
  AND a.status = 1
ORDER BY a.created DESC;
```

### Get Message History
```sql
SELECT 
    m.message_id,
    m.remote_jid,
    m.from_me,
    m.message_type,
    m.message_body,
    FROM_UNIXTIME(m.timestamp) as sent_at
FROM sp_whatsapp_messages m
WHERE m.instance_id = ?
  AND m.team_id = ?
ORDER BY m.timestamp DESC
LIMIT 100;
```

### Get Campaign Summary
```sql
SELECT 
    campaign_name,
    COUNT(*) as total_campaigns,
    SUM(sent_count) as total_sent,
    SUM(failed_count) as total_failed,
    AVG(delay_seconds) as avg_delay
FROM sp_android_campaign_status
WHERE team_id = ?
  AND created >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 30 DAY))
GROUP BY campaign_name;
```

---

## 📝 Naming Conventions

**Table Names:**
- Prefix: `sp_`
- Lowercase with underscores
- Descriptive nouns

**Column Names:**
- Lowercase with underscores
- `id` for primary key
- `ids` for unique identifier (UUID-like)
- `_id` suffix for foreign keys
- `created`, `changed` for timestamps (Unix)

**Status Fields:**
- Usually TINYINT
- 0 = Inactive/Off
- 1 = Active/On
- 2+ = Special states

---

## 🔗 Related Documentation

- [Database Schema ERD](./01-schema.md)
- [Relationships](./03-relationships.md)
- [Query Examples](./04-common-queries.md)
- [Code Locations](../04-CODE-LOCATIONS/03-database-queries.md)

---

**Maintained by:** AI Documentation System  
**Total Tables:** 20+  
**Review Frequency:** After schema changes
