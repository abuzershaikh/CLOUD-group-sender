# 🚀 Quick Start Guide for AI Agents

**Purpose:** Get AI agents productive in 5 minutes  
**For:** New AI agents working on this codebase

---

## ⚡ 30-Second Overview

**Project:** WhatsApp bulk messaging system  
**Components:** PHP Backend + Node.js Engine + Mobile App  
**Active Instances Location:** `sessions` object in `waziper/waziper.js` line 55  
**Main Bug:** Status code confusion (0/1/2 meanings)  

---

## 📋 Essential Commands

### Check Active Instances
```javascript
// In Node.js
Object.keys(sessions).length  // Count active instances
```

```sql
-- In Database
SELECT COUNT(*) FROM sp_whatsapp_sessions WHERE status = 1;
```

### Find Code Fast
```bash
# Search in PHP
grep -r "function_name" Wazipar/01-02-2026bt.wappbuzz.in\ \(2\)/inc/core/

# Search in Node.js
grep -r "function_name" Wazipar/01-02-2026bt_wa/waziper/
```

---

## 🎯 Common Tasks

### Task 1: "Where are active instances?"
1. Open `07-SESSIONS/01-instance-tracking.md`
2. See section "Active Instances in Memory"
3. Location: `waziper/waziper.js` line 55

### Task 2: "Fix instance visibility bug"
1. Open `02-BUGS/BUG-001-instance-visibility.md`
2. Go to "Fix Steps" section
3. Change status from 0 to 1 in line 28

### Task 3: "Find forward function"
1. Open `03-FEATURES/02-message-forwarding/README.md`
2. Check "Code Locations" table
3. PHP: TBD, Node: `extend.js`

### Task 4: "Understand status codes"
```php
0 = Deleted/Inactive
1 = Logged in (Active for WhatsApp)
2 = Fully Active (Active for Users)
```

---

## 🗂️ Navigation Map

```
Need to...                       → Go to...
────────────────────────────────────────────────────────
Understand system                → 01-ARCHITECTURE/
Find a bug                       → 02-BUGS/README.md
Learn a feature                  → 03-FEATURES/
Find code location               → 04-CODE-LOCATIONS/
Check database schema            → 05-DATABASE/
See API endpoints                → 06-API-REFERENCE/
Understand instances             → 07-SESSIONS/
Debug an issue                   → 08-TROUBLESHOOTING/
```

---

## 🔍 Search Strategies

### By Symptom
"Mobile can't see instances" → `02-BUGS/BUG-001`  
"Different modules show different data" → `02-BUGS/BUG-002`  
"Forward not working" → `03-FEATURES/02-message-forwarding/`  

### By Component
PHP Controllers → `04-CODE-LOCATIONS/01-php-controllers.md`  
Node.js Modules → `04-CODE-LOCATIONS/02-node-modules.md`  
Database Tables → `05-DATABASE/02-tables-reference.md`  

### By File Type
Looking for `.php` → Check `04-CODE-LOCATIONS/01-php-controllers.md`  
Looking for `.js` → Check `04-CODE-LOCATIONS/02-node-modules.md`  
Looking for bugs → Check `02-BUGS/README.md`  

---

## 📊 Status Code Quick Reference

### Account Status (sp_accounts.status)
```
0 = Deleted/Not exists
1 = Inactive/Logged in
2 = Active/Connected
```

### Session Status (sp_whatsapp_sessions.status)
```
0 = Disconnected
1 = Connected
```

**⚠️ CONFUSION ALERT:**  
- For sp_accounts: status=1 is what most modules use for "active"
- For sp_users: status=2 means "active"
- Always check which table you're querying!

---

## 🚨 Critical Bugs (Fix Priority)

### 🔴 BUG-001: Instance Visibility
**File:** `Whatsapp_profiles.php` line 28  
**Issue:** Using status=0 (deleted) instead of status=1 (active)  
**Impact:** Mobile app sees NO instances  
**Fix:** Change `"status" => 0` to `"status" => 1`  

### 🟡 BUG-002: Status Inconsistency
**Files:** Multiple controllers  
**Issue:** Some use status=0, others use status=1  
**Impact:** Data inconsistency across modules  

---

## 🎓 Learning Path

### For New AI Agents:
1. **Start Here:** `README.md` (main documentation index)
2. **Understand System:** `01-ARCHITECTURE/01-system-overview.md`
3. **Know the Bugs:** `02-BUGS/README.md`
4. **Learn Navigation:** This file (QUICK_START.md)
5. **Practice:** Fix BUG-001 following the guide

### For Specific Tasks:
```
Task: Fix a bug          → 02-BUGS/BUG-XXX.md
Task: Add feature        → 03-FEATURES/
Task: Debug issue        → 08-TROUBLESHOOTING/
Task: Understand code    → 04-CODE-LOCATIONS/
```

---

## 💡 Pro Tips

### Tip 1: Always Check Status Context
```php
// ❌ DON'T assume status=1 means the same everywhere
$accounts = db_fetch("*", TB_ACCOUNTS, ["status" => 1]);

// ✅ DO check which table and what status means
// For sp_accounts: status=1 is active
// For sp_users: status=2 is active
```

### Tip 2: Use Serial Numbers
```
Looking for a bug? → Check BUG-001, BUG-002, etc.
All bugs have serial numbers for easy reference
```

### Tip 3: Follow Cross-References
```
Each documentation file links to related files
Example: BUG-001 links to code location docs
```

### Tip 4: Check Last Updated Date
```
Every file has "Last Updated" date
Helps you know if info is current
```

---

## 📁 File Count Summary

```
Total Documentation Files: 7+ MD files (and growing)
├── Main Index: 1 file (README.md)
├── Bugs: 2 files (README + BUG-001)
├── Code Locations: 2 files (PHP + Node)
├── Sessions: 1 file (Instance tracking)
├── Features: 1 file (Message forwarding)
└── Quick Start: 1 file (this file)
```

---

## 🔗 Quick Links

| Resource | Location |
|----------|----------|
| **Main Index** | `README.md` |
| **Bug Index** | `02-BUGS/README.md` |
| **Critical Bug** | `02-BUGS/BUG-001-instance-visibility.md` |
| **PHP Code** | `04-CODE-LOCATIONS/01-php-controllers.md` |
| **Node Code** | `04-CODE-LOCATIONS/02-node-modules.md` |
| **Instance Tracking** | `07-SESSIONS/01-instance-tracking.md` |
| **Forward Feature** | `03-FEATURES/02-message-forwarding/README.md` |

---

## 🆘 Need Help?

### Can't find what you're looking for?

1. **Search by keyword** in relevant category folder
2. **Check cross-references** at bottom of each file
3. **Look at code comments** in actual source files
4. **Check existing PROJECT_DOCS** folder for additional context

### Adding New Documentation?

1. Follow the template in existing files
2. Use serial numbers for bugs (BUG-006, BUG-007...)
3. Add cross-references to related docs
4. Update file count in README.md

---

## ✅ Quick Checklist

Before starting work:
- [ ] Read this QUICK_START.md
- [ ] Check 02-BUGS/ for known issues
- [ ] Find code location in 04-CODE-LOCATIONS/
- [ ] Understand status codes (0/1/2)
- [ ] Know where active instances are (sessions object)

---

**Created for:** AI Agents  
**Time to Read:** 5 minutes  
**Time to Productive:** 10 minutes  
**Last Updated:** January 29, 2026

**Now you're ready! Go to `README.md` for full navigation or dive into a specific task using the navigation map above.**
