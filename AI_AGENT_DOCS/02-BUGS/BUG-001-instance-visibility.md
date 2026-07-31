# BUG-001: Instance Visibility - Wrong Status Filter Hides Instances from Mobile

**Serial Number:** BUG-001  
**Severity:** 🔴 Critical  
**Status:** Open  
**Component:** PHP Backend  
**Module:** Whatsapp_profiles  
**Discovered:** January 29, 2026  

---

## 📍 Location

**File:** `Wazipar/01-02-2026bt.wappbuzz.in (2)/inc/core/Whatsapp_profiles/Controllers/Whatsapp_profiles.php`  
**Line:** 28  
**Function:** `index()`  
**Method:** `db_fetch()`

---

## 🐛 Problematic Code

```php
// Line 26-28
$account = db_get("*", TB_ACCOUNTS, ["social_network" => "whatsapp", "category" => "profile", "token" => $instance_id, "team_id" => $team_id]);
$accounts = db_fetch("*", TB_ACCOUNTS, ["social_network" => "whatsapp", "category" => "profile", "team_id" => $team_id, "status" => 0]);
$content_data['accounts'] = $accounts;
```

**Problem:** `"status" => 0` is fetching DELETED/INACTIVE accounts instead of ACTIVE ones.

---

## 📝 Description

The Whatsapp_profiles controller is fetching accounts with `status = 0`, which according to the system's status code convention means "deleted" or "not active". This causes the mobile app to receive an empty list of instances because:

1. Active instances have `status = 2` (Active)
2. Logged-in but inactive instances have `status = 1` (Inactive)
3. Deleted instances have `status = 0` (Deleted)

The query is filtering for status 0, which returns NO active instances.

---

## 💥 Impact

### Primary Impact:
- **Mobile app cannot see ANY active WhatsApp instances**
- Users cannot select instances for operations
- All instance-dependent features are blocked

### Secondary Impact:
- Dashboard may show empty instance list
- Group management features unavailable
- Message sending features unusable
- Creates confusion for users

### Affected Users:
- All mobile app users
- Any system relying on this controller
- API consumers expecting instance list

---

## 🔍 Root Cause

**Status Code Convention:**
```php
STATUS_DELETED = 0   // Deleted/Not exists
STATUS_INACTIVE = 1  // Logged in but not active
STATUS_ACTIVE = 2    // Fully active and connected
```

**Evidence from codebase:**
- In `inc/core/Users/Views/ajax_list.php` (lines 58-64):
  ```php
  case 1:
      $status = '<span class="badge badge-light-warning">Inactive</span>';
      break;
  case 2:
      $status = '<span class="badge badge-light-success">Active</span>';
      break;
  ```

**Comparison with other controllers:**
```php
// Whatsapp_autoresponder (CORRECT) - Line 19
$accounts = db_fetch("*", TB_ACCOUNTS, ["status" => 1]);

// Whatsapp_profiles (WRONG) - Line 28
$accounts = db_fetch("*", TB_ACCOUNTS, ["status" => 0]);
```

---

## 🔧 Fix Steps

### Option 1: Use Status = 1 (Recommended for logged-in instances)
```php
// Line 28 - Change from:
$accounts = db_fetch("*", TB_ACCOUNTS, ["social_network" => "whatsapp", "category" => "profile", "team_id" => $team_id, "status" => 0]);

// To:
$accounts = db_fetch("*", TB_ACCOUNTS, ["social_network" => "whatsapp", "category" => "profile", "team_id" => $team_id, "status" => 1]);
```

### Option 2: Remove Status Filter (Show all non-deleted)
```php
// Line 28 - Change to:
$accounts = db_fetch("*", TB_ACCOUNTS, ["social_network" => "whatsapp", "category" => "profile", "team_id" => $team_id, "status != " => 0]);
```

### Option 3: Match Other Controllers (Use login_type filter)
```php
// Line 28 - Change to match Whatsapp_autoresponder pattern:
$accounts = db_fetch("*", TB_ACCOUNTS, [
    "social_network" => "whatsapp", 
    "category" => "profile", 
    "login_type" => 2,  // Type 2 = Waziper instances
    "team_id" => $team_id, 
    "status" => 1
], "created", "ASC");
```

**Recommended Fix:** Option 3 (matches other controllers and includes login_type filter)

---

## ✅ Verification Steps

### 1. Database Check
```sql
-- Before fix: Should return 0 rows
SELECT COUNT(*) FROM sp_accounts 
WHERE social_network = 'whatsapp' 
  AND category = 'profile' 
  AND team_id = YOUR_TEAM_ID 
  AND status = 0;

-- After fix: Should return > 0 rows
SELECT COUNT(*) FROM sp_accounts 
WHERE social_network = 'whatsapp' 
  AND category = 'profile' 
  AND team_id = YOUR_TEAM_ID 
  AND status = 1;
```

### 2. API Test
```bash
# Test endpoint response
curl -X GET "http://your-server/whatsapp_profiles" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: Should return array of active instances
# Before fix: Empty array
# After fix: Array with instances
```

### 3. Mobile App Test
1. Open mobile app
2. Navigate to instance selection screen
3. Verify instances are visible
4. Verify you can select an instance

### 4. Code Test
```php
// Add temporary debug code to verify
$accounts = db_fetch("*", TB_ACCOUNTS, [
    "social_network" => "whatsapp", 
    "category" => "profile", 
    "team_id" => $team_id, 
    "status" => 1
]);
error_log("Accounts found: " . count($accounts));
// Should log number > 0
```

---

## 📊 Related Bugs

- **BUG-002:** Status inconsistency across controllers (same root cause)
- **BUG-003:** Model methods default to wrong status
- **BUG-004:** Widget methods use wrong status filter
- **BUG-005:** No status constants defined (prevention)

---

## 📚 References

**Status code evidence:**
- `inc/core/Users/Views/ajax_list.php` - Lines 58-64
- `inc/core/Whatsapp_autoresponder/Controllers/Whatsapp_autoresponder.php` - Line 19
- `inc/core/Whatsapp_api/Controllers/Whatsapp_api.php` - Line 33

**Affected endpoints:**
- `/whatsapp_profiles`
- Mobile API instance list
- Dashboard instance selection

---

## 🔄 Status Updates

| Date | Status | Notes |
|------|--------|-------|
| 2026-01-29 | Open | Bug documented and analyzed |
| | | Awaiting fix implementation |

---

## 💡 Prevention

To prevent this bug from happening again:

1. **Define Status Constants** (See BUG-005)
   ```php
   const STATUS_DELETED = 0;
   const STATUS_INACTIVE = 1;
   const STATUS_ACTIVE = 2;
   ```

2. **Add Code Comments**
   ```php
   // Fetch active instances (status=1 for logged-in, status=2 for fully active)
   $accounts = db_fetch(/* ... */);
   ```

3. **Create Helper Function**
   ```php
   function get_active_accounts($team_id, $social_network = 'whatsapp') {
       return db_fetch("*", TB_ACCOUNTS, [
           "social_network" => $social_network,
           "team_id" => $team_id,
           "status" => STATUS_INACTIVE  // or STATUS_ACTIVE
       ]);
   }
   ```

4. **Write Unit Tests**
   ```php
   public function testActiveInstancesReturned() {
       $accounts = $this->controller->getAccounts($team_id);
       $this->assertGreaterThan(0, count($accounts));
       $this->assertEquals(1, $accounts[0]->status);
   }
   ```

---

**Documented by:** AI Agent  
**Priority:** Immediate fix required  
**Estimated Fix Time:** 5 minutes  
**Testing Time:** 15 minutes
