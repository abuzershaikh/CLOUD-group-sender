# 🔐 Vault CLI & Server Access Guide

**Purpose:** Complete guide to access server and check instances using Vault CLI  
**Last Updated:** January 29, 2026

---

## 🎯 Quick Reference

### Check Active Instances (3 Methods)

```bash
# Method 1: Direct SQL Query (Fastest)
mysql -u root -p -e "SELECT COUNT(*) as active FROM sp_whatsapp_sessions WHERE status=1;"

# Method 2: SSH + MySQL
ssh user@server "mysql -u root -p -e 'SELECT * FROM waziper_db.sp_whatsapp_sessions WHERE status=1;'"

# Method 3: Vault CLI (if configured)
vault kv get whatsapp/instances/active
```

---

## 🔑 Vault CLI Setup

### Installation

**Linux/Mac:**
```bash
# Download Vault CLI
wget https://releases.hashicorp.com/vault/1.15.0/vault_1.15.0_linux_amd64.zip
unzip vault_1.15.0_linux_amd64.zip
sudo mv vault /usr/local/bin/

# Verify installation
vault --version
```

**Windows:**
```powershell
# Using Chocolatey
choco install vault

# Or download from: https://www.vaultproject.io/downloads
# Add to PATH manually
```

### Configuration

```bash
# Set Vault server address
export VAULT_ADDR='http://your-vault-server:8200'

# Login (if authentication is required)
vault login

# Test connection
vault status
```

---

## 🗄️ SQL Database Access

### Direct MySQL Connection

**Method 1: Local MySQL Client**
```bash
# Connect to database
mysql -h localhost -u root -p waziper_db

# Or with password in command (not recommended for production)
mysql -h localhost -u root -pYOUR_PASSWORD waziper_db
```

**Method 2: SSH Tunnel + MySQL**
```bash
# Create SSH tunnel
ssh -L 3307:localhost:3306 user@your-server

# Then connect locally
mysql -h 127.0.0.1 -P 3307 -u root -p waziper_db
```

**Method 3: Direct SSH Command**
```bash
ssh user@server 'mysql -u root -pPASSWORD -e "USE waziper_db; SELECT * FROM sp_whatsapp_sessions WHERE status=1;"'
```

---

## 📊 Essential SQL Queries

### 1. Count Active Instances

```sql
-- Total active instances
SELECT COUNT(*) as active_instances 
FROM sp_whatsapp_sessions 
WHERE status = 1;
```

**One-liner for CLI:**
```bash
mysql -u root -p -e "SELECT COUNT(*) FROM sp_whatsapp_sessions WHERE status=1;" waziper_db
```

---

### 2. List All Active Instances

```sql
-- Get all active instances with details
SELECT 
    s.id,
    s.instance_id,
    s.name as whatsapp_name,
    s.phone,
    a.name as account_name,
    a.login_type,
    FROM_UNIXTIME(s.created) as created_date
FROM sp_whatsapp_sessions s
LEFT JOIN sp_accounts a ON s.instance_id = a.token
WHERE s.status = 1
ORDER BY s.created DESC;
```

**Expected Output:**
```
+----+--------------+---------------+---------------+--------------+------------+---------------------+
| id | instance_id  | whatsapp_name | phone         | account_name | login_type | created_date        |
+----+--------------+---------------+---------------+--------------+------------+---------------------+
|  1 | token123     | Business Act  | 917688907953  | Main Account |          2 | 2026-01-15 10:30:00 |
|  2 | token456     | Personal      | 918765432109  | My Phone     |          2 | 2026-01-20 14:45:00 |
+----+--------------+---------------+---------------+--------------+------------+---------------------+
```

---

### 3. Count by Team

```sql
-- Active instances per team
SELECT 
    team_id,
    COUNT(*) as instance_count
FROM sp_whatsapp_sessions
WHERE status = 1
GROUP BY team_id
ORDER BY instance_count DESC;
```

---

### 4. Get Instance Details by Token

```sql
-- Find specific instance
SELECT 
    s.*,
    a.name as account_name,
    a.social_network,
    a.login_type,
    FROM_UNIXTIME(s.created) as created_date,
    FROM_UNIXTIME(s.changed) as last_updated
FROM sp_whatsapp_sessions s
LEFT JOIN sp_accounts a ON s.instance_id = a.token
WHERE s.instance_id = 'YOUR_TOKEN_HERE';
```

---

### 5. Check Instance Status by Phone

```sql
-- Find instance by phone number
SELECT 
    instance_id,
    name,
    phone,
    status,
    FROM_UNIXTIME(created) as created_date
FROM sp_whatsapp_sessions
WHERE phone LIKE '%8907953%';
```

---

### 6. Get All Instances (Active + Inactive)

```sql
-- All instances with status
SELECT 
    s.instance_id,
    s.phone,
    s.name,
    CASE 
        WHEN s.status = 1 THEN 'Connected ✓'
        WHEN s.status = 0 THEN 'Disconnected ✗'
        ELSE 'Unknown'
    END as connection_status,
    a.status as account_status,
    FROM_UNIXTIME(s.changed) as last_change
FROM sp_whatsapp_sessions s
LEFT JOIN sp_accounts a ON s.instance_id = a.token
ORDER BY s.status DESC, s.changed DESC;
```

---

### 7. Find Orphaned Sessions (No Account Record)

```sql
-- Sessions without account entry
SELECT 
    s.instance_id,
    s.phone,
    s.name,
    'No Account Found' as issue
FROM sp_whatsapp_sessions s
LEFT JOIN sp_accounts a ON s.instance_id = a.token
WHERE a.id IS NULL;
```

---

### 8. Find Accounts Without Sessions

```sql
-- Accounts that have no session record
SELECT 
    a.token as instance_id,
    a.name,
    'No Session Record' as issue
FROM sp_accounts a
LEFT JOIN sp_whatsapp_sessions s ON a.token = s.instance_id
WHERE a.social_network = 'whatsapp'
  AND s.id IS NULL;
```

---

## 🖥️ Server Commands

### SSH Access

```bash
# Basic SSH login
ssh username@your-server-ip

# With specific port
ssh -p 2222 username@your-server-ip

# With key file
ssh -i /path/to/key.pem username@your-server-ip
```

---

### Check Running Processes

```bash
# Check if Node.js is running
ps aux | grep node

# Check MySQL
ps aux | grep mysql

# Check specific port (Wazipar default: 3000)
netstat -tulpn | grep :3000

# Or using lsof
lsof -i :3000
```

---

### Check Session Files

```bash
# Navigate to sessions directory
cd /path/to/wazipar/sessions/

# Count session directories
ls -la | grep "^d" | wc -l

# List all session directories
ls -1

# Check specific instance
ls -la token123/

# Check if creds.json exists
ls -la */creds.json

# Count instances with creds
find . -name "creds.json" | wc -l
```

---

### Check Node.js Logs

```bash
# If using PM2
pm2 logs wazipar

# If using systemd
journalctl -u wazipar -f

# If using direct logs
tail -f /var/log/wazipar/app.log

# Last 100 lines
tail -n 100 /var/log/wazipar/app.log
```

---

## 🔍 Vault CLI Commands (If Configured)

### Basic Vault Operations

```bash
# Check Vault status
vault status

# Login to Vault
vault login -method=userpass username=admin

# List secrets
vault kv list whatsapp/

# Get specific secret
vault kv get whatsapp/instances/active

# Get with specific field
vault kv get -field=count whatsapp/instances/active
```

---

### Store Instance Data in Vault

```bash
# Store instance count
vault kv put whatsapp/instances/active \
    count=5 \
    last_checked="2026-01-29 10:00:00"

# Store instance details
vault kv put whatsapp/instances/token123 \
    phone="917688907953" \
    name="Business Account" \
    status="active"

# Get instance data
vault kv get whatsapp/instances/token123
```

---

## 📋 Complete Practical Examples

### Example 1: Quick Health Check

```bash
#!/bin/bash
# health-check.sh

echo "=== WhatsApp Instance Health Check ==="
echo ""

# 1. Check Node.js process
echo "1. Node.js Process:"
if pgrep -x "node" > /dev/null; then
    echo "   ✓ Running"
else
    echo "   ✗ Not Running"
fi

# 2. Check active sessions in DB
echo ""
echo "2. Database Active Sessions:"
ACTIVE=$(mysql -u root -pPASSWORD -sN -e "SELECT COUNT(*) FROM sp_whatsapp_sessions WHERE status=1;" waziper_db)
echo "   Active: $ACTIVE"

# 3. Check session files
echo ""
echo "3. Session Files:"
SESSION_COUNT=$(ls -1 /path/to/sessions/ | wc -l)
echo "   Directories: $SESSION_COUNT"

# 4. Compare
echo ""
echo "4. Consistency:"
if [ "$ACTIVE" -eq "$SESSION_COUNT" ]; then
    echo "   ✓ Database and Files Match"
else
    echo "   ⚠ Mismatch: DB=$ACTIVE, Files=$SESSION_COUNT"
fi
```

**Usage:**
```bash
chmod +x health-check.sh
./health-check.sh
```

---

### Example 2: Get Instance by Phone

```bash
#!/bin/bash
# find-instance.sh

PHONE=$1

if [ -z "$PHONE" ]; then
    echo "Usage: ./find-instance.sh <phone_number>"
    exit 1
fi

mysql -u root -pPASSWORD waziper_db <<EOF
SELECT 
    instance_id,
    name,
    phone,
    status,
    FROM_UNIXTIME(created) as created
FROM sp_whatsapp_sessions
WHERE phone LIKE '%$PHONE%';
EOF
```

**Usage:**
```bash
chmod +x find-instance.sh
./find-instance.sh 8907953
```

---

### Example 3: Export Active Instances

```bash
#!/bin/bash
# export-active.sh

OUTPUT_FILE="active_instances_$(date +%Y%m%d_%H%M%S).csv"

mysql -u root -pPASSWORD waziper_db -e "
SELECT 
    s.instance_id as 'Instance Token',
    s.name as 'WhatsApp Name',
    s.phone as 'Phone Number',
    a.name as 'Account Name',
    FROM_UNIXTIME(s.created) as 'Created Date'
FROM sp_whatsapp_sessions s
LEFT JOIN sp_accounts a ON s.instance_id = a.token
WHERE s.status = 1
ORDER BY s.created DESC;
" | sed 's/\t/,/g' > $OUTPUT_FILE

echo "Exported to: $OUTPUT_FILE"
cat $OUTPUT_FILE
```

---

### Example 4: Monitor Instances (Real-time)

```bash
#!/bin/bash
# monitor-instances.sh

while true; do
    clear
    echo "=== Active Instances Monitor ==="
    echo "Time: $(date)"
    echo ""
    
    mysql -u root -pPASSWORD waziper_db -e "
    SELECT 
        instance_id,
        name,
        phone,
        FROM_UNIXTIME(changed) as last_update
    FROM sp_whatsapp_sessions
    WHERE status = 1
    ORDER BY changed DESC
    LIMIT 10;
    "
    
    sleep 5
done
```

---

## 🔐 Security Best Practices

### 1. Never Hardcode Passwords

**Bad:**
```bash
mysql -u root -pMyPassword123 waziper_db
```

**Good:**
```bash
# Use .my.cnf file
cat > ~/.my.cnf << EOF
[client]
user=root
password=MyPassword123
EOF
chmod 600 ~/.my.cnf

# Now connect without password in command
mysql waziper_db
```

---

### 2. Use Environment Variables

```bash
# Set in .bashrc or .env
export DB_USER="root"
export DB_PASS="YourPassword"
export DB_NAME="waziper_db"

# Use in scripts
mysql -u $DB_USER -p$DB_PASS $DB_NAME
```

---

### 3. SSH Key Authentication

```bash
# Generate key
ssh-keygen -t rsa -b 4096

# Copy to server
ssh-copy-id user@server

# Now login without password
ssh user@server
```

---

## 📊 Quick Command Reference Card

```bash
# === MYSQL ===
# Count active
mysql -e "SELECT COUNT(*) FROM sp_whatsapp_sessions WHERE status=1;" DB_NAME

# List active
mysql -e "SELECT instance_id, phone, name FROM sp_whatsapp_sessions WHERE status=1;" DB_NAME

# === SSH ===
# Login
ssh user@server

# Remote command
ssh user@server "command"

# === FILE SYSTEM ===
# Count sessions
ls -1 /path/to/sessions/ | wc -l

# Check specific
ls -la /path/to/sessions/token123/

# === PROCESS ===
# Check Node
ps aux | grep node

# Check port
netstat -tulpn | grep :3000

# === VAULT (if configured) ===
# Get instances
vault kv get whatsapp/instances/active
```

---

## 🔗 Related Documentation

- [Database Tables Reference](../05-DATABASE/02-tables-reference.md)
- [Instance Tracking](../07-SESSIONS/01-instance-tracking.md)
- [Check Active Instances Script](../SCRIPTS/check-active-instances.js)

---

## 💡 Pro Tips

1. **Create aliases for common commands:**
```bash
alias check-active="mysql -e 'SELECT COUNT(*) FROM sp_whatsapp_sessions WHERE status=1;' waziper_db"
alias list-instances="mysql -e 'SELECT * FROM sp_whatsapp_sessions WHERE status=1;' waziper_db"
```

2. **Set up cron for monitoring:**
```bash
# Add to crontab
*/5 * * * * /path/to/health-check.sh >> /var/log/instance-monitor.log
```

3. **Use tmux/screen for long sessions:**
```bash
# Start tmux
tmux new -s monitoring

# Run monitor script
./monitor-instances.sh

# Detach: Ctrl+B then D
# Reattach: tmux attach -t monitoring
```

---

**Maintained by:** AI Documentation System  
**Priority:** High (Essential for debugging)  
**Next Review:** After server changes
