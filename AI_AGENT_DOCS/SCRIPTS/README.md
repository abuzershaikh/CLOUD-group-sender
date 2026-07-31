# 🛠️ Utility Scripts for AI Agents

**Purpose:** Helper scripts to check system status and debug issues

---

## 📋 Available Scripts

### 1. check-active-instances.js
**Purpose:** Check active WhatsApp instances across all layers

**Usage:**
```bash
# Check all instances
node check-active-instances.js

# Check for specific team
node check-active-instances.js 123

# With environment variables
DB_HOST=localhost DB_USER=root DB_PASSWORD=pass node check-active-instances.js
```

**What it checks:**
1. ✅ Database (sp_whatsapp_sessions table)
2. ✅ File System (sessions/ directory)
3. ✅ Node.js API status
4. ✅ Consistency between layers

**Output Example:**
```
============================================================
🔍 ACTIVE INSTANCES CHECKER
============================================================

1️⃣  Checking Database...
   ✅ Active in DB: 3
      1. Business Account (917688907953)
         Instance ID: token123
      2. Personal Account (918765432109)
         Instance ID: token456

2️⃣  Checking File System...
   ✅ Session Directories: 3
      1. token123 [✓]
      2. token456 [✓]
      3. token789 [✓]

3️⃣  Checking Node.js API...
   ✅ API Status: online
   ✅ Active Sessions (API): 3

============================================================
📊 SUMMARY
============================================================
Database Active:        3
File System Sessions:   3
Node.js API Status:     online

🔍 Consistency Check:
   ✅ Database and File System match
============================================================
```

**Requirements:**
```bash
npm install mysql2 axios
```

**Environment Variables:**
- `DB_HOST` - Database host (default: localhost)
- `DB_USER` - Database user (default: root)
- `DB_PASSWORD` - Database password (default: empty)
- `DB_NAME` - Database name (default: waziper_db)
- `NODE_API` - Node.js API URL (default: http://localhost:3000)

---

## 🚀 Future Scripts (TO DO)

### 2. validate-status-codes.js
Check all status code usage across PHP files

### 3. find-orphaned-sessions.js
Find session files without database records

### 4. sync-instances.js
Sync database with actual running instances

### 5. health-check.js
Complete system health check

### 6. generate-docs.js
Auto-generate documentation from code comments

---

## 💡 Usage Tips

**For AI Agents:**
1. Run scripts before making changes
2. Use output to understand system state
3. Verify fixes with scripts after changes

**For Debugging:**
1. Run `check-active-instances.js` first
2. Compare database vs file system
3. Check for orphaned sessions
4. Verify Node.js is running

**For Monitoring:**
```bash
# Add to cron for periodic checks
*/30 * * * * cd /path/to/scripts && node check-active-instances.js >> /var/log/instances.log
```

---

## 📝 Creating New Scripts

**Template:**
```javascript
#!/usr/bin/env node

/**
 * Script Name
 * Purpose: Brief description
 * Usage: node script-name.js [args]
 */

const CONFIG = {
    // Configuration here
};

async function main() {
    console.log('🔍 Script Name');
    // Your logic here
}

main().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
});
```

**Guidelines:**
- Use descriptive names
- Add usage comments at top
- Handle errors gracefully
- Use colored output for readability
- Support environment variables
- Add to this README

---

## 🔗 Related Documentation

- [Instance Tracking](../07-SESSIONS/01-instance-tracking.md)
- [Troubleshooting](../08-TROUBLESHOOTING/)
- [Database Reference](../05-DATABASE/02-tables-reference.md)

---

**Maintained by:** AI Documentation System  
**Scripts Count:** 1 (more coming soon)  
**Last Updated:** January 29, 2026
