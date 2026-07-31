# 🎮 PHP Controllers - Code Location Guide

**Purpose:** Quick reference for finding specific functionality in PHP controllers

---

## 📁 Base Path
```
Wazipar/01-02-2026bt.wappbuzz.in (2)/inc/core/
```

---

## 🔍 Quick Search Index

### WhatsApp Instance Management
| Function | Controller | File | Line |
|----------|-----------|------|------|
| List instances | Whatsapp_profiles | `Whatsapp_profiles/Controllers/Whatsapp_profiles.php` | 28 |
| Check login status | Whatsapp_profiles | `Whatsapp_profiles/Controllers/Whatsapp_profiles.php` | 238 |
| Delete instance | Whatsapp_profiles | `Whatsapp_profiles/Controllers/Whatsapp_profiles.php` | 286-313 |
| Add new instance | Whatsapp_profiles | `Whatsapp_profiles/Controllers/Whatsapp_profiles.php` | - |
| Get QR code | Whatsapp_profiles | `Whatsapp_profiles/Controllers/Whatsapp_profiles.php` | 125-189 |

### Message Forwarding
| Function | Controller | File | Line |
|----------|-----------|------|------|
| Forward message | Whatsapp_send_message | `Whatsapp_send_message/Controllers/Whatsapp_send_message.php` | - |
| Forward to groups | Whatsapp_bulk | `Whatsapp_bulk/Controllers/Whatsapp_bulk.php` | - |

### Account Management
| Function | Controller | File | Line |
|----------|-----------|------|------|
| Get accounts | Account_manager | `Account_manager/Controllers/Account_manager.php` | 27-42 |
| Widget accounts | Account_manager | `Account_manager/Controllers/Account_manager.php` | 40 |
| Delete account | Account_manager | `Account_manager/Controllers/Account_manager.php` | 67-86 |
| Cascade delete WhatsApp | Account_manager | `Account_manager/Controllers/Account_manager.php` | 93-122 |

### Admin API
| Function | Controller | File | Line |
|----------|-----------|------|------|
| Get users | Admin_API | `Admin_API/Controllers/Admin_API.php` | 42 |
| Create user | Admin_API | `Admin_API/Controllers/Admin_API.php` | 64 |
| Update user | Admin_API | `Admin_API/Controllers/Admin_API.php` | 148 |
| Provision Waziper user | Admin_API | `Admin_API/Controllers/Admin_API.php` | 371 |
| List campaign status | Admin_API | `Admin_API/Controllers/Admin_API.php` | 448 |
| List group sender status | Admin_API | `Admin_API/Controllers/Admin_API.php` | 577 |

---

## 📂 Controller Directory Structure

```
inc/core/
├── Account_manager/
│   ├── Controllers/
│   │   └── Account_manager.php          [Account CRUD, Widget display]
│   ├── Models/
│   │   └── Account_managerModel.php     [Account queries, permissions]
│   └── Views/
│       ├── content.php
│       └── widget.php
│
├── Whatsapp_profiles/
│   ├── Controllers/
│   │   └── Whatsapp_profiles.php        [Instance management, QR generation]
│   ├── Models/
│   │   └── Whatsapp_profilesModel.php
│   └── Views/
│       └── oauth.php                     [QR code display]
│
├── Whatsapp_send_message/
│   ├── Controllers/
│   │   └── Whatsapp_send_message.php    [Send messages, autoresponder]
│   └── Views/
│
├── Whatsapp_bulk/
│   ├── Controllers/
│   │   └── Whatsapp_bulk.php            [Bulk messaging, campaigns]
│   └── Models/
│       └── Whatsapp_bulkModel.php
│
├── Whatsapp_chatbot/
│   ├── Controllers/
│   │   └── Whatsapp_chatbot.php         [Chatbot management, AI integration]
│   └── Views/
│
├── Whatsapp_autoresponder/
│   ├── Controllers/
│   │   └── Whatsapp_autoresponder.php   [Auto-reply rules]
│   └── Views/
│
├── Whatsapp_callresponder/
│   ├── Controllers/
│   │   └── Whatsapp_callresponder.php   [Call response automation]
│   └── Views/
│
├── Whatsapp_livechat/
│   ├── Controllers/
│   │   └── Whatsapp_livechat.php        [Live chat interface]
│   └── Views/
│
├── Admin_API/
│   ├── Controllers/
│   │   └── Admin_API.php                [Admin endpoints, mobile API]
│   └── Models/
│       └── Admin_APIModel.php
│
└── Users/
    ├── Controllers/
    │   └── Users.php                     [User management]
    └── Views/
```

---

## 🎯 Common Code Patterns

### Pattern 1: Fetching Instances

**Location:** Multiple controllers  
**Common Code:**
```php
// CORRECT pattern (used in most controllers)
$accounts = db_fetch("*", TB_ACCOUNTS, [
    "social_network" => "whatsapp",
    "category" => "profile",
    "login_type" => 2,
    "team_id" => $team_id,
    "status" => 1  // Active status
], "created", "ASC");
```

**Examples:**
- `Whatsapp_autoresponder.php` - Line 19 ✅
- `Whatsapp_send_message.php` - Line 19 ✅
- `Whatsapp_api.php` - Line 33 ✅
- `Whatsapp_profiles.php` - Line 28 ❌ (BUG: uses status=0)

### Pattern 2: Database Operations

**Using db_get (single row):**
```php
$account = db_get("*", TB_ACCOUNTS, [
    "token" => $instance_id,
    "team_id" => $team_id
]);
```

**Using db_fetch (multiple rows):**
```php
$accounts = db_fetch("*", TB_ACCOUNTS, $where_conditions, "column", "ASC");
```

**Using db_update:**
```php
db_update(TB_ACCOUNTS, [
    "status" => 1,
    "changed" => time()
], ["id" => $account_id]);
```

**Using db_delete:**
```php
db_delete(TB_ACCOUNTS, ["ids" => $account_ids]);
```

### Pattern 3: Permission Checking

**Location:** Most controllers  
**Code:**
```php
if (!permission("whatsapp_profiles")) {
    redirect_to(base_url());
}
```

### Pattern 4: Team ID Retrieval

**Location:** All controllers  
**Code:**
```php
$team_id = get_team("id");
$access_token = get_team("ids");
```

---

## 🔗 Key Methods by Feature

### Instance Creation/Login
**Controller:** `Whatsapp_profiles`  
**Methods:**
- `index()` - Main page, lists instances (Line 13)
- `get_oauth()` - Generate QR/pairing code (Line 125)
- `check_login()` - Verify connection status (Line 238)

**Flow:**
1. User navigates to profiles page → `index()`
2. Clicks "Add Instance" → `get_oauth()` generates QR
3. Backend polls → `check_login()` verifies status

### Instance Deletion
**Controller:** `Whatsapp_profiles`  
**Method:** `delete()` (Line 286)  
**Cascade Operations:**
```php
db_delete(TB_WHATSAPP_AUTORESPONDER, ['instance_id' => $token]);
db_delete(TB_WHATSAPP_CHATBOT, ['instance_id' => $token]);
db_delete(TB_WHATSAPP_SESSIONS, ['instance_id' => $token]);
db_delete(TB_WHATSAPP_WEBHOOK, ['instance_id' => $token]);
db_delete(TB_WHATSAPP_MESSAGES, ['instance_id' => $token]);
db_delete(TB_WHATSAPP_SUBSCRIBERS, ['instance_id' => $token]);
```

### Message Sending
**Controllers:** `Whatsapp_send_message`, `Whatsapp_bulk`  
**Key Methods:**
- `send_direct()` - Send to single contact
- `send_bulk()` - Send to multiple contacts
- `send_campaign()` - Run scheduled campaign

### Autoresponder
**Controller:** `Whatsapp_autoresponder`  
**Methods:**
- `index()` - List autoresponders
- `create()` - Create new rule
- `update()` - Update existing rule
- Processing happens in Node.js (waziper.js)

---

## 🚨 Critical Code Sections

### BUG LOCATION: Wrong Status Filter
**File:** `Whatsapp_profiles/Controllers/Whatsapp_profiles.php`  
**Line:** 28  
```php
// BUG: This returns NO active instances
$accounts = db_fetch("*", TB_ACCOUNTS, [
    "social_network" => "whatsapp",
    "category" => "profile",
    "team_id" => $team_id,
    "status" => 0  // ❌ WRONG: 0 = deleted
]);

// FIX: Should be
$accounts = db_fetch("*", TB_ACCOUNTS, [
    "social_network" => "whatsapp",
    "category" => "profile",
    "team_id" => $team_id,
    "status" => 1  // ✅ CORRECT: 1 = active
]);
```

### CRITICAL: Cascade Delete
**File:** `Account_manager/Controllers/Account_manager.php`  
**Method:** `deleteAccountWithCascade()` (Line 93-122)

**Important:** Always use this method when deleting WhatsApp accounts to prevent orphaned data.

---

## 🔄 Request Flow

### Typical Request Flow:
```
1. Route (Routes.php)
   ↓
2. Controller (e.g., Whatsapp_profiles.php)
   ↓
3. Validation (permission check, input validation)
   ↓
4. Model (optional - for complex queries)
   ↓
5. Database (via db_get/db_fetch/db_update)
   ↓
6. View (return HTML or JSON response)
```

### API Request Flow:
```
1. Route (/admin_api/*)
   ↓
2. Admin_API Controller
   ↓
3. check_api_key() validation
   ↓
4. Business logic
   ↓
5. JSON response (with status + data)
```

---

## 📝 Naming Conventions

**Controllers:** PascalCase with underscores
- `Whatsapp_profiles`
- `Account_manager`
- `Admin_API`

**Methods:** snake_case
- `get_oauth()`
- `check_login()`
- `send_message()`

**Database Functions:** snake_case
- `db_get()`
- `db_fetch()`
- `db_update()`

**Tables:** Prefix + lowercase with underscores
- `sp_accounts`
- `sp_whatsapp_sessions`
- `sp_whatsapp_chatbot`

---

## 🔗 Related Documentation

- [Node.js Modules](./02-node-modules.md)
- [Database Queries](./03-database-queries.md)
- [API Endpoints](./04-api-endpoints.md)
- [Bug List](../02-BUGS/README.md)

---

**Maintained by:** AI Documentation System  
**Last Updated:** January 29, 2026
