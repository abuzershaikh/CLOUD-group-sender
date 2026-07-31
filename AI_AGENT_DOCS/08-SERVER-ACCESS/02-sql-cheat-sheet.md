# 📊 SQL Cheat Sheet - WhatsApp Instances

**Purpose:** Ready-to-use SQL queries for checking instances  
**Database:** MySQL (waziper_db)  
**Last Updated:** January 29, 2026

---

## 🚀 Quick Copy-Paste Queries

### ✅ Most Used Queries (Top 5)

#### 1. Count Active Instances
```sql
SELECT COUNT(*) as active_count FROM sp_whatsapp_sessions WHERE status = 1;
```

#### 2. List All Active with Details
```sql
SELECT 
    s.instance_id,
    s.name,
    s.phone,
    a.name as account_name,
    FROM_UNIXTIME(s.created) as created_at
FROM sp_whatsapp_sessions s
LEFT JOIN sp_accounts a ON s.instance_id = a.token
WHERE s.status = 1
ORDER BY s.created DESC;
```

#### 3. Find Instance by Phone
```sql
SELECT * FROM sp_whatsapp_sessions WHERE phone LIKE '%YOUR_PHONE%';
```

#### 4. Active Instances by Team
```sql
SELECT team_id, COUNT(*) as count 
FROM sp_whatsapp_sessions 
WHERE status = 1 
GROUP BY team_id;
```

#### 5. Check Instance Status
```sql
SELECT 
    instance_id,
    name,
    phone,
    CASE status 
        WHEN 1 THEN 'Connected ✓'
        WHEN 0 THEN 'Disconnected ✗'
    END as status
FROM sp_whatsapp_sessions
WHERE instance_id = 'YOUR_TOKEN';
```

---

## 📱 Instance Queries

### Get All Instances (Active + Inactive)
```sql
SELECT 
    s.id,
    s.instance_id,
    s.name,
    s.phone,
    CASE s.status 
        WHEN 1 THEN '🟢 Connected'
        WHEN 0 THEN '🔴 Disconnected'
    END as status,
    FROM_UNIXTIME(s.created) as created,
    FROM_UNIXTIME(s.changed) as last_update
FROM sp_whatsapp_sessions s
ORDER BY s.status DESC, s.changed DESC;
```

### Get Instances Created Today
```sql
SELECT 
    instance_id,
    name,
    phone,
    FROM_UNIXTIME(created) as created_time
FROM sp_whatsapp_sessions
WHERE FROM_UNIXTIME(created) >= CURDATE()
ORDER BY created DESC;
```

### Get Instances Created This Week
```sql
SELECT 
    COUNT(*) as new_this_week,
    DATE(FROM_UNIXTIME(created)) as date
FROM sp_whatsapp_sessions
WHERE FROM_UNIXTIME(created) >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(FROM_UNIXTIME(created))
ORDER BY date DESC;
```

### Get Instances by Login Type
```sql
SELECT 
    s.instance_id,
    s.phone,
    a.login_type,
    CASE a.login_type
        WHEN 1 THEN 'QR Code'
        WHEN 2 THEN 'Pairing Code'
        ELSE 'Unknown'
    END as login_method
FROM sp_whatsapp_sessions s
LEFT JOIN sp_accounts a ON s.instance_id = a.token
WHERE s.status = 1;
```

---

## 🔍 Diagnostic Queries

### Check Database vs File System Consistency
```sql
-- Get list of instance_ids from database
SELECT instance_id FROM sp_whatsapp_sessions WHERE status = 1;

-- Compare with file system manually:
-- ls /path/to/sessions/
```

### Find Orphaned Sessions (No Account)
```sql
SELECT 
    s.instance_id,
    s.phone,
    s.name,
    '⚠️ No Account Record' as issue
FROM sp_whatsapp_sessions s
LEFT JOIN sp_accounts a ON s.instance_id = a.token
WHERE a.id IS NULL;
```

### Find Accounts Without Sessions
```sql
SELECT 
    a.token,
    a.name,
    '⚠️ No Session Record' as issue
FROM sp_accounts a
LEFT JOIN sp_whatsapp_sessions s ON a.token = s.instance_id
WHERE a.social_network = 'whatsapp'
  AND a.category = 'profile'
  AND s.id IS NULL;
```

### Find Inactive Accounts That Should Be Deleted
```sql
SELECT 
    a.token,
    a.name,
    FROM_UNIXTIME(a.changed) as last_activity,
    DATEDIFF(NOW(), FROM_UNIXTIME(a.changed)) as days_inactive
FROM sp_accounts a
LEFT JOIN sp_whatsapp_sessions s ON a.token = s.instance_id
WHERE a.social_network = 'whatsapp'
  AND (s.status = 0 OR s.id IS NULL)
  AND a.changed < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 30 DAY))
ORDER BY days_inactive DESC;
```

---

## 👥 Team & User Queries

### Instances per Team with Details
```sql
SELECT 
    t.id as team_id,
    u.email as owner_email,
    u.fullname,
    COUNT(s.id) as active_instances
FROM sp_team t
LEFT JOIN sp_users u ON t.owner = u.id
LEFT JOIN sp_whatsapp_sessions s ON s.team_id = t.id AND s.status = 1
GROUP BY t.id, u.email, u.fullname
HAVING active_instances > 0
ORDER BY active_instances DESC;
```

### Get All Instances for Specific User
```sql
SELECT 
    s.instance_id,
    s.name,
    s.phone,
    s.status,
    FROM_UNIXTIME(s.created) as created
FROM sp_whatsapp_sessions s
JOIN sp_team t ON s.team_id = t.id
JOIN sp_users u ON t.owner = u.id
WHERE u.email = 'user@example.com'
ORDER BY s.status DESC, s.created DESC;
```

### Teams Without Active Instances
```sql
SELECT 
    t.id as team_id,
    u.email as owner_email,
    u.fullname,
    0 as active_instances
FROM sp_team t
LEFT JOIN sp_users u ON t.owner = u.id
LEFT JOIN sp_whatsapp_sessions s ON s.team_id = t.id AND s.status = 1
WHERE s.id IS NULL;
```

---

## 📊 Analytics Queries

### Daily Instance Creation Stats
```sql
SELECT 
    DATE(FROM_UNIXTIME(created)) as date,
    COUNT(*) as instances_created
FROM sp_whatsapp_sessions
WHERE FROM_UNIXTIME(created) >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(FROM_UNIXTIME(created))
ORDER BY date DESC;
```

### Active vs Inactive Instances
```sql
SELECT 
    CASE status 
        WHEN 1 THEN 'Active'
        WHEN 0 THEN 'Inactive'
    END as status_label,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM sp_whatsapp_sessions), 2) as percentage
FROM sp_whatsapp_sessions
GROUP BY status;
```

### Average Session Lifetime
```sql
SELECT 
    AVG(DATEDIFF(NOW(), FROM_UNIXTIME(created))) as avg_days_active,
    MIN(DATEDIFF(NOW(), FROM_UNIXTIME(created))) as oldest_days,
    MAX(DATEDIFF(NOW(), FROM_UNIXTIME(created))) as newest_days
FROM sp_whatsapp_sessions
WHERE status = 1;
```

---

## 🔧 Maintenance Queries

### Update Instance Status (Manual)
```sql
-- Mark instance as disconnected
UPDATE sp_whatsapp_sessions 
SET status = 0, changed = UNIX_TIMESTAMP()
WHERE instance_id = 'YOUR_TOKEN';

-- Mark instance as connected
UPDATE sp_whatsapp_sessions 
SET status = 1, changed = UNIX_TIMESTAMP()
WHERE instance_id = 'YOUR_TOKEN';
```

### Delete Orphaned Sessions
```sql
-- ⚠️ DANGER: This deletes data! Backup first!
DELETE s FROM sp_whatsapp_sessions s
LEFT JOIN sp_accounts a ON s.instance_id = a.token
WHERE a.id IS NULL;
```

### Clean Up Old Inactive Sessions (30+ days)
```sql
-- ⚠️ DANGER: This deletes data! Backup first!
DELETE FROM sp_whatsapp_sessions
WHERE status = 0
  AND changed < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 30 DAY));
```

---

## 🎯 One-Liner Queries (For Terminal)

### Count Active
```bash
mysql -u root -p -e "SELECT COUNT(*) FROM sp_whatsapp_sessions WHERE status=1;" waziper_db
```

### List Active with Phone
```bash
mysql -u root -p -e "SELECT instance_id, phone, name FROM sp_whatsapp_sessions WHERE status=1;" waziper_db
```

### Find by Phone (No quotes needed)
```bash
mysql -u root -p -e "SELECT * FROM sp_whatsapp_sessions WHERE phone LIKE '%8907953%';" waziper_db
```

### Export to CSV
```bash
mysql -u root -p -e "SELECT * FROM sp_whatsapp_sessions WHERE status=1;" waziper_db | sed 's/\t/,/g' > active_instances.csv
```

---

## 📋 Query Templates

### Template: Find by Field
```sql
SELECT * FROM sp_whatsapp_sessions 
WHERE {field_name} LIKE '%{search_term}%';

-- Examples:
-- WHERE phone LIKE '%8907953%'
-- WHERE name LIKE '%Business%'
-- WHERE instance_id LIKE '%token123%'
```

### Template: Count by Condition
```sql
SELECT 
    {group_field},
    COUNT(*) as count
FROM sp_whatsapp_sessions
WHERE {condition}
GROUP BY {group_field}
ORDER BY count DESC;

-- Examples:
-- GROUP BY team_id
-- GROUP BY status
-- WHERE status = 1
```

### Template: Recent Records
```sql
SELECT * FROM sp_whatsapp_sessions
WHERE FROM_UNIXTIME({timestamp_field}) >= DATE_SUB(NOW(), INTERVAL {N} {UNIT})
ORDER BY {timestamp_field} DESC;

-- Examples:
-- INTERVAL 1 DAY
-- INTERVAL 7 DAY
-- INTERVAL 1 MONTH
```

---

## 🔍 Advanced Queries

### Get Instance with All Related Data
```sql
SELECT 
    -- Session Info
    s.instance_id,
    s.name as whatsapp_name,
    s.phone,
    s.status as session_status,
    
    -- Account Info
    a.name as account_name,
    a.login_type,
    a.can_post,
    a.status as account_status,
    
    -- Team Info
    t.id as team_id,
    u.email as owner_email,
    u.fullname as owner_name,
    
    -- Timestamps
    FROM_UNIXTIME(s.created) as session_created,
    FROM_UNIXTIME(a.created) as account_created
    
FROM sp_whatsapp_sessions s
LEFT JOIN sp_accounts a ON s.instance_id = a.token
LEFT JOIN sp_team t ON s.team_id = t.id
LEFT JOIN sp_users u ON t.owner = u.id
WHERE s.instance_id = 'YOUR_TOKEN';
```

### Get Chatbot Status for Active Instances
```sql
SELECT 
    s.instance_id,
    s.name,
    s.phone,
    cb.name as chatbot_name,
    cb.status as chatbot_enabled,
    cb.run as chatbot_running
FROM sp_whatsapp_sessions s
LEFT JOIN sp_whatsapp_chatbot cb ON s.instance_id = cb.instance_id
WHERE s.status = 1
ORDER BY s.instance_id;
```

### Get Message Count per Instance
```sql
SELECT 
    s.instance_id,
    s.name,
    s.phone,
    COUNT(m.id) as total_messages,
    SUM(CASE WHEN m.from_me = 1 THEN 1 ELSE 0 END) as sent_messages,
    SUM(CASE WHEN m.from_me = 0 THEN 1 ELSE 0 END) as received_messages
FROM sp_whatsapp_sessions s
LEFT JOIN sp_whatsapp_messages m ON s.instance_id = m.instance_id
WHERE s.status = 1
GROUP BY s.instance_id, s.name, s.phone
ORDER BY total_messages DESC;
```

---

## 💾 Backup Queries

### Export All Active Instances
```sql
SELECT 
    s.*,
    a.name as account_name,
    a.login_type
INTO OUTFILE '/tmp/active_instances_backup.csv'
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
FROM sp_whatsapp_sessions s
LEFT JOIN sp_accounts a ON s.instance_id = a.token
WHERE s.status = 1;
```

### Create Backup Table
```sql
CREATE TABLE sp_whatsapp_sessions_backup AS
SELECT * FROM sp_whatsapp_sessions
WHERE status = 1;
```

---

## 🎨 Pretty Print Queries

### Formatted Active List
```sql
SELECT 
    CONCAT('🟢 ', s.name) as 'Instance',
    CONCAT('📱 ', s.phone) as 'Phone',
    CONCAT('🔑 ', SUBSTRING(s.instance_id, 1, 10), '...') as 'Token',
    CONCAT('📅 ', DATE_FORMAT(FROM_UNIXTIME(s.created), '%Y-%m-%d')) as 'Created'
FROM sp_whatsapp_sessions s
WHERE s.status = 1
ORDER BY s.created DESC
LIMIT 10;
```

---

## 🔗 Related Documentation

- [Database Tables Reference](../05-DATABASE/02-tables-reference.md)
- [Vault CLI Guide](./01-vault-cli-guide.md)
- [Instance Tracking](../07-SESSIONS/01-instance-tracking.md)

---

## 💡 Pro Tips

1. **Save frequently used queries as stored procedures:**
```sql
DELIMITER //
CREATE PROCEDURE get_active_instances()
BEGIN
    SELECT * FROM sp_whatsapp_sessions WHERE status = 1;
END //
DELIMITER ;

-- Call it:
CALL get_active_instances();
```

2. **Create a view for quick access:**
```sql
CREATE VIEW active_instances AS
SELECT 
    s.instance_id,
    s.name,
    s.phone,
    a.name as account_name
FROM sp_whatsapp_sessions s
LEFT JOIN sp_accounts a ON s.instance_id = a.token
WHERE s.status = 1;

-- Use it:
SELECT * FROM active_instances;
```

3. **Use mysql command history:**
```bash
# Search history
cat ~/.mysql_history | grep "SELECT"

# Or press Ctrl+R in mysql to search
```

---

**Maintained by:** AI Documentation System  
**Total Queries:** 40+  
**Last Tested:** January 29, 2026

Location:
Mumbai
IP Address:
65.20.77.112
Username:
root
Password:
G8u$RW{5m46buXgw
