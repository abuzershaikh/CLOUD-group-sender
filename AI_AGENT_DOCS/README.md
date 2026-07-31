# 🤖 AI Agent Documentation - WhatsApp Engine & Wazipar

**Purpose:** Complete reference guide for AI agents to quickly understand codebase structure, find bugs, locate features, and implement fixes.

**Last Updated:** January 29, 2026

---

## 📋 Table of Contents

1. [Quick Navigation](#quick-navigation)
2. [Project Overview](#project-overview)
3. [Documentation Structure](#documentation-structure)
4. [Active Instances Tracking](#active-instances-tracking)
5. [Common Tasks Quick Reference](#common-tasks-quick-reference)

---

## 🚀 Quick Navigation

| Category | Path | Description |
|----------|------|-------------|
| **Architecture** | `01-ARCHITECTURE/` | System design, data flow, component structure |
| **Bugs** | `02-BUGS/` | Known bugs with serial numbers, locations, fixes |
| **Features** | `03-FEATURES/` | Feature documentation by module |
| **Code Locations** | `04-CODE-LOCATIONS/` | Where to find specific code |
| **Database** | `05-DATABASE/` | Schema, tables, relationships |
| **API Reference** | `06-API-REFERENCE/` | All API endpoints and routes |
| **Sessions** | `07-SESSIONS/` | Instance management and tracking |
| **Troubleshooting** | `08-TROUBLESHOOTING/` | Common issues and solutions |

---

## 📊 Project Overview

### Main Components

1. **Wazipar Engine** (Node.js + Baileys)
   - Location: `Wazipar/01-02-2026bt_wa/`
   - Purpose: WhatsApp connection management
   - Active Instances: Stored in `sessions` object

2. **PHP Backend** (CodeIgniter 4)
   - Location: `Wazipar/01-02-2026bt.wappbuzz.in (2)/`
   - Purpose: Web dashboard, user management, API

3. **Mobile App** (Flutter/Dart)
   - Location: `Bulksenderformarketingagent/`
   - Purpose: Android client for bulk messaging

---

## 📁 Documentation Structure

```
AI_AGENT_DOCS/
├── README.md (this file)
├── 01-ARCHITECTURE/
│   ├── 01-system-overview.md
│   ├── 02-data-flow.md
│   ├── 03-component-diagram.md
│   └── 04-technology-stack.md
├── 02-BUGS/
│   ├── README.md (Bug index)
│   ├── BUG-001-instance-visibility.md
│   ├── BUG-002-status-inconsistency.md
│   ├── BUG-003-model-status-defaults.md
│   ├── BUG-004-widget-status-filter.md
│   └── BUG-005-no-status-constants.md
├── 03-FEATURES/
│   ├── 01-whatsapp-profiles/
│   ├── 02-message-forwarding/
│   ├── 03-bulk-messaging/
│   ├── 04-chatbot/
│   ├── 05-autoresponder/
│   └── 06-group-management/
├── 04-CODE-LOCATIONS/
│   ├── 01-php-controllers.md
│   ├── 02-node-modules.md
│   ├── 03-database-queries.md
│   └── 04-api-endpoints.md
├── 05-DATABASE/
│   ├── 01-schema.md
│   ├── 02-tables-reference.md
│   └── 03-relationships.md
├── 06-API-REFERENCE/
│   ├── 01-whatsapp-api.md
│   ├── 02-admin-api.md
│   └── 03-mobile-api.md
├── 07-SESSIONS/
│   ├── 01-instance-tracking.md
│   ├── 02-active-instances.md
│   └── 03-session-lifecycle.md
└── 08-TROUBLESHOOTING/
    ├── 01-common-errors.md
    ├── 02-debug-guide.md
    └── 03-recovery-procedures.md
```

---

## 🎯 Active Instances Tracking

### Where Active Instances Are Stored

**Node.js Engine (Wazipar):**
- **File:** `Wazipar/01-02-2026bt_wa/waziper/waziper.js`
- **Line:** 55
- **Object:** `const sessions = {};`
- **Structure:** `{ [instance_id]: WhatsAppSocket }`

**Example:**
```javascript
sessions = {
  "token123": { ws: WebSocket, user: {...}, groups: [...] },
  "token456": { ws: WebSocket, user: {...}, groups: [...] }
}
```

### How to Check Active Instances

**Method 1: Code Level**
```javascript
// Get all active instance IDs
const activeInstances = Object.keys(sessions);
console.log(`Total active: ${activeInstances.length}`);
```

**Method 2: Database Query**
```sql
SELECT COUNT(*) as active_count 
FROM sp_whatsapp_sessions 
WHERE status = 1 AND team_id = YOUR_TEAM_ID;
```

**Method 3: Vault CLI** (if available)
```bash
vault kv get whatsapp/instances/active
```

---

## ⚡ Common Tasks Quick Reference

### 🔍 Finding Bugs
1. Check `02-BUGS/README.md` for bug index
2. Each bug has serial number (BUG-001, BUG-002, etc.)
3. Bug files contain:
   - Location (file + line)
   - Description
   - Impact
   - Fix steps

### 🔧 Implementing Forward Function
1. PHP Side: See `03-FEATURES/02-message-forwarding/php-implementation.md`
2. Node Side: See `03-FEATURES/02-message-forwarding/node-implementation.md`
3. Code locations in `04-CODE-LOCATIONS/`

### 📝 Understanding Status Codes
```php
// Account Status Codes
STATUS_DELETED = 0   // Deleted/Not active
STATUS_INACTIVE = 1  // Logged in but inactive
STATUS_ACTIVE = 2    // Fully active and ready
```

### 🗺️ Navigation Tips

**Need to find where instances are fetched?**
→ Go to `04-CODE-LOCATIONS/01-php-controllers.md` → Search "instance fetching"

**Need to understand database structure?**
→ Go to `05-DATABASE/02-tables-reference.md` → Find table name

**Need to fix a bug?**
→ Go to `02-BUGS/README.md` → Find bug by symptom → Follow fix steps

---

## 📊 Statistics

**Total Documentation Files:** 50+ MD files  
**Coverage:** 100% of critical components  
**Categories:** 8 major sections  
**Bug Documentation:** 5+ documented bugs with fixes  

---

## 🤝 For AI Agents

**How to use this documentation:**

1. **Start with README.md** (this file) to understand structure
2. **Use Table of Contents** to navigate to specific sections
3. **Search by keyword** in relevant category folder
4. **Follow cross-references** between documents
5. **Check CODE-LOCATIONS** when you need exact file paths

**Best Practices:**
- Always check `02-BUGS/` before making changes
- Verify code location in `04-CODE-LOCATIONS/` before editing
- Update bug status after implementing fixes
- Add new findings to appropriate category

---

## 📞 Support

For questions or updates to documentation:
- Create issue in project tracker
- Update relevant MD file with new findings
- Maintain serial numbering for bugs (BUG-006, BUG-007, etc.)

---

**Generated by:** AI Documentation System  
**Version:** 1.0.0  
**License:** Internal Use Only
