# BUG-002: Inconsistent Status Filtering Across Controllers

**Serial Number:** BUG-002  
**Severity:** 🟡 High  
**Status:** Open  
**Component:** PHP Backend  
**Module:** Multiple (Whatsapp_profiles, Whatsapp_autoresponder, etc.)  
**Discovered:** January 29, 2026

---

## 📍 Locations

Multiple files have inconsistent status filtering:

| File | Line | Status Used | Correct? |
|------|------|-------------|----------|
| `Whatsapp_autoresponder.php` | 19 | `status => 1` | ✅ Yes |
| `Whatsapp_send_message.php` | 19 | `status => 1` | ✅ Yes |
| `Whatsapp_api.php` | 33 | `status => 1` | ✅ Yes |
| `Whatsapp_callresponder.php` | 19 | `status => 1` | ✅ Yes |
| `Whatsapp_export_participants.php` | 19 | `status => 1` | ✅ Yes |
| `Whatsapp_profiles.php` | 28 | `status => 0` | ❌ **WRONG** |

---

## 🐛 Problematic Code

### Wrong Implementation (Whatsapp_profiles)
```php
// Line 28 - Whatsapp_profiles.php
$accounts = db_fetch("*", TB_ACCOUNTS, [
    "social_network" => "whatsapp",
    "category" => "profile",
    "team_id" => $team_id,
    "status" => 0  // ❌ WRONG: Returns deleted accounts
]);
```

### Correct Implementation (Others)
```php
// Line 19 - Whatsapp_autoresponder.php, Whatsapp_send_message.php, etc.
$accounts = db_fetch("*", TB_ACCOUNTS, [
    "social_network" => "whatsapp",
    "category" => "profile",
    "login_type" => 2,
    "team_id" => $team_id,
    "status" => 1  // ✅ CORRECT: Returns active accounts
], "created", "ASC");
```

---

## 📝 Description

Different WhatsApp modules are using different status codes to fetch accounts, leading to inconsistent behavior:

**Correct Modules (Using status=1):**
- Whatsapp_autoresponder
- Whatsapp_send_message
- Whatsapp_api
- Whatsapp_callresponder
- Whatsapp_export_participants

**Wrong Module (Using status=0):**
- Whatsapp_profiles

This inconsistency means:
1. Most modules show active instances correctly
2. Whatsapp_profiles (main listing) shows NO instances
3. Users see instances in some places but not others
4. Creates confusion and appears as a UI bug

---

## 💥 Impact

### Primary Impact:
- **Inconsistent UI across different modules**
- Users see instances in autoresponder but not in profiles
- Dashboard appears broken/inconsistent
- Difficult to debug because some features work, others don't

### Secondary Impact:
- Developer confusion about which status to use
- Code maintenance nightmare
- Hard to onboard new developers
- Potential for more similar bugs in future

### User Experience:
```
User Journey:
1. Opens Autoresponder → Sees 5 instances ✓
2. Opens Profiles → Sees 0 instances ✗
3. User thinks system is broken
4. Reports bug to support
```

---

## 🔍 Root Cause

**Lack of standardization:**
1. No documented status code convention
2. No constants defined (magic numbers used)
3. Different developers used different assumptions
4. No code review caught the inconsistency

**Why status=1 is correct:**
```php
// Evidence from system behavior:
// Most modules use status=1 successfully
// Database shows active accounts with status=1
// Only Whatsapp_profiles is broken (uses status=0)
```

---

## 🔧 Fix Steps

### Step 1: Fix Whatsapp_profiles.php
```php
// File: Whatsapp_profiles/Controllers/Whatsapp_profiles.php
// Line: 28

// Change from:
$accounts = db_fetch("*", TB_ACCOUNTS, [
    "social_network" => "whatsapp",
    "category" => "profile",
    "team_id" => $team_id,
    "status" => 0
]);

// Change to (match other controllers):
$accounts = db_fetch("*", TB_ACCOUNTS, [
    "social_network" => "whatsapp",
    "category" => "profile",
    "login_type" => 2,
    "team_id" => $team_id,
    "status" => 1
], "created", "ASC");
```

### Step 2: Verify All Controllers Use Same Pattern
```bash
# Search for all status filters in WhatsApp controllers
grep -r "status.*=>" Wazipar/01-02-2026bt.wappbuzz.in\ \(2\)/inc/core/Whatsapp_*/
```

### Step 3: Add Code Comment
```php
// Fetch active WhatsApp instances (status=1 for logged-in accounts)
$accounts = db_fetch(/* ... */);
```

---

## ✅ Verification Steps

### 1. Check All Controllers Return Same Data
```php
// Add temporary debug code to each controller
$team_id = get_team("id");

// Test Whatsapp_profiles
$profiles_accounts = db_fetch("*", TB_ACCOUNTS, [
    "social_network" => "whatsapp",
    "team_id" => $team_id,
    "status" => 1
]);

// Test Whatsapp_autoresponder
$autoresponder_accounts = db_fetch("*", TB_ACCOUNTS, [
    "social_network" => "whatsapp",
    "team_id" => $team_id,
    "status" => 1
]);

// Verify counts match
error_log("Profiles: " . count($profiles_accounts));
error_log("Autoresponder: " . count($autoresponder_accounts));
// Should log same number
```

### 2. Database Verification
```sql
-- Count accounts with each status
SELECT 
    status,
    COUNT(*) as count
FROM sp_accounts
WHERE social_network = 'whatsapp'
  AND team_id = YOUR_TEAM_ID
GROUP BY status;

-- Should show:
-- status=0: 0 or very few (deleted)
-- status=1: Most accounts (active)
-- status=2: 0 or few (if used)
```

### 3. UI Testing
1. Login to dashboard
2. Open Whatsapp Profiles → Should see N instances
3. Open Whatsapp Autoresponder → Should see same N instances
4. Open Whatsapp Send Message → Should see same N instances
5. All counts should match!

---

## 📊 Affected Modules Analysis

### ✅ Correct Modules (status=1)
```
inc/core/Whatsapp_autoresponder/Controllers/Whatsapp_autoresponder.php:19
inc/core/Whatsapp_send_message/Controllers/Whatsapp_send_message.php:19
inc/core/Whatsapp_api/Controllers/Whatsapp_api.php:33
inc/core/Whatsapp_callresponder/Controllers/Whatsapp_callresponder.php:19
inc/core/Whatsapp_export_participants/Controllers/Whatsapp_export_participants.php:19
```

### ❌ Wrong Module (status=0)
```
inc/core/Whatsapp_profiles/Controllers/Whatsapp_profiles.php:28
```

---

## 📚 Related Bugs

- **BUG-001:** Instance visibility (same root cause)
- **BUG-003:** Model status defaults wrong
- **BUG-004:** Widget status filter wrong
- **BUG-005:** No status constants (prevention)

---

## 🔄 Status Updates

| Date | Status | Notes |
|------|--------|-------|
| 2026-01-29 | Open | Bug documented |
| | | Awaiting fix across all modules |

---

## 💡 Prevention Strategy

### 1. Define Status Constants (See BUG-005)
```php
// In a constants file
const ACCOUNT_STATUS_DELETED = 0;
const ACCOUNT_STATUS_ACTIVE = 1;
const ACCOUNT_STATUS_SUSPENDED = 2;
```

### 2. Create Helper Function
```php
/**
 * Get active WhatsApp accounts for a team
 * @param int $team_id Team ID
 * @param int $login_type Optional login type filter (1=QR, 2=Pairing)
 * @return array Active accounts
 */
function get_active_whatsapp_accounts($team_id, $login_type = null) {
    $where = [
        "social_network" => "whatsapp",
        "category" => "profile",
        "team_id" => $team_id,
        "status" => ACCOUNT_STATUS_ACTIVE
    ];
    
    if ($login_type !== null) {
        $where["login_type"] = $login_type;
    }
    
    return db_fetch("*", TB_ACCOUNTS, $where, "created", "ASC");
}
```

### 3. Code Review Checklist
```
When reviewing account queries:
□ Uses status constant, not magic number
□ Matches pattern from other controllers
□ Has explanatory comment
□ Tested to verify correct data returned
```

---

## 🎯 Consistency Rules (Going Forward)

### For WhatsApp Account Queries:
```php
// ALWAYS use this pattern:
$accounts = db_fetch("*", TB_ACCOUNTS, [
    "social_network" => "whatsapp",
    "category" => "profile",
    "login_type" => 2,        // 2 = Waziper pairing instances
    "team_id" => $team_id,
    "status" => 1             // 1 = Active logged-in accounts
], "created", "ASC");
```

### Never Do This:
```php
// ❌ NEVER use status=0 for active accounts
$accounts = db_fetch("*", TB_ACCOUNTS, ["status" => 0]);

// ❌ NEVER omit status filter (includes deleted)
$accounts = db_fetch("*", TB_ACCOUNTS, ["team_id" => $team_id]);

// ❌ NEVER use magic numbers without comment
$accounts = db_fetch("*", TB_ACCOUNTS, ["status" => 1]); // What does 1 mean?
```

---

## 📞 Support

**For Developers:**
- Check this doc before adding new account queries
- Use the helper function (when created)
- Follow the consistency rules above

**For AI Agents:**
- Search for "status.*=>" in PHP files
- Verify all return same results
- Reference this doc for correct pattern

---

**Documented by:** AI Agent  
**Priority:** High (affects user experience)  
**Estimated Fix Time:** 10 minutes  
**Testing Time:** 20 minutes
