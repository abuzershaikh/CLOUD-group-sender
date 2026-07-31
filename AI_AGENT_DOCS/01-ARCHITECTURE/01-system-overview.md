# 🏗️ System Architecture Overview

**Last Updated:** January 29, 2026  
**Version:** 1.0

---

## 📊 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────┤
│  Mobile App (Flutter)  │  Web Dashboard (PHP Views)         │
│  - Bulk messaging      │  - Admin panel                     │
│  - Instance management │  - User management                 │
│  - Group selection     │  - Campaign creation               │
└──────────────┬──────────────────────┬───────────────────────┘
               │                      │
               ↓                      ↓
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                          │
├─────────────────────────────────────────────────────────────┤
│           PHP Backend (CodeIgniter 4)                        │
│  - REST API endpoints                                        │
│  - Authentication & Authorization                            │
│  - Business logic                                            │
│  - Database operations                                       │
│  - Session management                                        │
└──────────────┬──────────────────────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────────────────────────┐
│                WHATSAPP ENGINE LAYER                         │
├─────────────────────────────────────────────────────────────┤
│         Node.js + Baileys (Wazipar Engine)                  │
│  - WhatsApp WebSocket connections                            │
│  - Message sending/receiving                                 │
│  - Autoresponder logic                                       │
│  - Chatbot processing (AI integration)                       │
│  - Bulk campaign execution                                   │
│  - Group management                                          │
└──────────────┬──────────────────────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                │
├─────────────────────────────────────────────────────────────┤
│  MySQL Database  │  Redis Cache  │  File System            │
│  - User data     │  - Sessions   │  - WhatsApp auth files  │
│  - Accounts      │  - Keep-alive │  - Media uploads        │
│  - Messages      │  - Rate limit │  - Logs                 │
│  - Campaigns     │               │                         │
└──────────────┬──────────────────────┬───────────────────────┘
               │                      │
               ↓                      ↓
┌─────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES                           │
├─────────────────────────────────────────────────────────────┤
│  WhatsApp Servers  │  AI APIs (OpenAI, etc.)                │
│  - Meta WhatsApp   │  - Chatbot responses                   │
│  - Baileys library │  - Content generation                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Component Breakdown

### 1. Mobile App (Flutter/Dart)
**Location:** `Bulksenderformarketingagent/`

**Purpose:**
- Android client for end users
- Instance selection and management
- Contact/group selection
- Message composition and sending
- Campaign monitoring

**Key Features:**
- Instance group caching
- Offline support
- Real-time status updates
- Media message support

**Tech Stack:**
- Flutter/Dart
- HTTP client for API calls
- Local SQLite cache

---

### 2. PHP Backend (CodeIgniter 4)
**Location:** `Wazipar/01-02-2026bt.wappbuzz.in (2)/`

**Purpose:**
- Web-based admin dashboard
- REST API for mobile app
- User authentication and authorization
- Database CRUD operations
- Business logic layer

**Key Modules:**

#### Core Modules
- `Users` - User management
- `Account_manager` - WhatsApp account CRUD
- `Admin_API` - Mobile/external API endpoints

#### WhatsApp Modules
- `Whatsapp_profiles` - Instance management
- `Whatsapp_send_message` - Message sending interface
- `Whatsapp_bulk` - Bulk messaging campaigns
- `Whatsapp_chatbot` - AI chatbot configuration
- `Whatsapp_autoresponder` - Auto-reply rules
- `Whatsapp_callresponder` - Call response automation
- `Whatsapp_livechat` - Live chat interface
- `Whatsapp_export_participants` - Group member export

**Tech Stack:**
- PHP 8.0+
- CodeIgniter 4
- MySQL database
- JWT authentication

---

### 3. Node.js Engine (Wazipar)
**Location:** `Wazipar/01-02-2026bt_wa/`

**Purpose:**
- WhatsApp connection management
- Real-time message handling
- Automation execution
- WebSocket server

**Core Components:**

#### app.js - API Server
- Express.js HTTP server
- REST endpoints for PHP backend
- Route handling
- Request validation

#### waziper.js - WhatsApp Engine
- Baileys WebSocket management
- Active sessions tracking (`sessions` object)
- Message event handling
- Connection lifecycle management
- Autoresponder execution
- Chatbot processing
- Bulk campaign execution

#### common.js - Utilities
- Database operations (MySQL)
- Helper functions
- Data formatting
- File operations

#### extend.js - Extensions
- AI integration (OpenAI, etc.)
- Webhook notifications
- Advanced message formatting
- Custom features

**Tech Stack:**
- Node.js 18+
- Baileys v6.7.21 (WhatsApp library)
- Express.js
- MySQL2
- ioredis (Redis client)
- Moment.js (date/time)

---

## 🔄 Data Flow Diagrams

### Message Sending Flow
```
[Mobile App]
    ↓ HTTP POST
[PHP Backend /admin_api/send_message]
    ↓ Validate user & instance
    ↓ HTTP POST
[Node.js Engine /send_message]
    ↓ Get session from sessions object
    ↓ Check WebSocket connection
[Baileys WebSocket]
    ↓ Protocol buffer encoding
[WhatsApp Servers]
    ↓ Delivery receipt
[Node.js Engine]
    ↓ Update database
    ↓ Webhook notification (optional)
[Mobile App]
    ↓ Success response
```

### Incoming Message Flow
```
[WhatsApp Servers]
    ↓ WebSocket message
[Baileys WebSocket]
    ↓ Protocol buffer decoding
[Node.js messages.upsert event]
    ↓ Parse message
    ↓ Check autoresponder rules
    ├─→ [Autoresponder triggered?]
    │       ↓ Yes
    │   [Send auto-reply]
    │       ↓
    └─→ [Chatbot enabled?]
            ↓ Yes
        [Process with AI]
            ↓
        [Send chatbot response]
            ↓
[Save to database]
    ↓
[Webhook notification]
    ↓
[PHP Backend can query messages]
```

### Instance Creation Flow
```
[User scans QR / enters pairing code]
    ↓
[PHP Backend /whatsapp_profiles/get_oauth]
    ↓ HTTP POST
[Node.js /get_qrcode or /get_pairing]
    ↓
[Create new session]
    ↓
sessions[instance_id] = new WhatsAppSocket
    ↓
new_sessions[instance_id] = expiry_time
    ↓
[Generate QR code or pairing code]
    ↓
[Return to PHP]
    ↓
[Display to user]
    ↓
[User authenticates]
    ↓
[connection.update event: status='open']
    ↓
[Save credentials to sessions/instance_id/creds.json]
    ↓
[Update database: status=1]
    ↓
[Remove from new_sessions]
    ↓
[Instance ready for use]
```

---

## 💾 Data Storage Strategy

### 1. MySQL Database
**What's Stored:**
- User accounts and teams
- WhatsApp account metadata
- Message history
- Campaign data
- Autoresponder rules
- Chatbot configurations
- Subscriber lists
- Analytics data

**Key Tables:**
- `sp_users` - System users
- `sp_accounts` - WhatsApp accounts
- `sp_whatsapp_sessions` - Connection status
- `sp_whatsapp_messages` - Message log
- `sp_whatsapp_chatbot` - Chatbot rules
- `sp_whatsapp_autoresponder` - Auto-reply rules

### 2. Redis Cache
**What's Cached:**
- Session keep-alive timestamps
- Rate limiting counters
- Temporary data
- Real-time metrics

### 3. File System
**What's Stored:**
- WhatsApp authentication credentials (`sessions/`)
- Uploaded media files
- Logs
- Temporary files

**Directory Structure:**
```
sessions/
├── instance_token_1/
│   ├── creds.json
│   └── app-state-sync-*.json
└── instance_token_2/
    └── ...
```

---

## 🔐 Security Architecture

### Authentication Layers
```
1. User Login
   ↓ (JWT token generated)
2. API Key Validation (mobile app)
   ↓ (check admin_api_key)
3. Team Ownership Check
   ↓ (verify team_id)
4. Permission Check
   ↓ (check user role & permissions)
5. Access Granted
```

### Data Protection
- **Passwords:** MD5 hashed (⚠️ should upgrade to bcrypt)
- **API Keys:** Stored in database
- **WhatsApp Credentials:** Encrypted in session files
- **Team Isolation:** All queries filtered by team_id

---

## 📡 Communication Patterns

### Synchronous (HTTP REST)
- Mobile app ↔ PHP backend
- PHP backend ↔ Node.js engine

### Asynchronous (WebSocket)
- Node.js ↔ WhatsApp servers

### Event-Driven
- Baileys events (messages, connection changes)
- Cron jobs (scheduled campaigns)
- Webhooks (external notifications)

---

## 🚀 Scalability Considerations

### Current Limitations
- Single Node.js process (no clustering)
- File-based session storage (not distributed)
- MySQL single instance

### Scaling Strategy (Future)
```
Current:
[Single Node.js] → [Single MySQL]

Future:
[Load Balancer]
    ↓
[Node.js Cluster 1] ─┐
[Node.js Cluster 2] ─┼→ [Redis] → [MySQL Primary]
[Node.js Cluster 3] ─┘                ↓
                              [MySQL Replica]
```

---

## 🔗 Integration Points

### External Integrations
1. **WhatsApp (via Baileys)**
   - Protocol: WebSocket
   - Library: @whiskeysockets/baileys v6.7.21

2. **AI Services**
   - OpenAI API
   - Custom AI endpoints

3. **Webhooks**
   - Outgoing notifications
   - Third-party integrations

### Internal Integrations
1. **PHP ↔ Node.js**
   - Protocol: HTTP REST
   - Port: Configurable (default 3000)

2. **Database**
   - Protocol: MySQL protocol
   - Connection pooling

3. **Redis**
   - Protocol: Redis protocol
   - Keep-alive tracking

---

## 📊 Performance Metrics

### Key Metrics to Monitor
- Active sessions count
- Message send rate (per minute)
- API response time
- Database query performance
- Memory usage per instance
- WebSocket connection stability

### Bottlenecks
1. **Database queries** - Can be slow with large datasets
2. **File I/O** - Session file reads/writes
3. **Network** - WhatsApp server latency
4. **Memory** - Each instance uses ~50MB RAM

---

## 🔗 Related Documentation

- [Data Flow Diagrams](./02-data-flow.md)
- [Component Details](./03-component-diagram.md)
- [Technology Stack](./04-technology-stack.md)
- [Database Schema](../05-DATABASE/01-schema.md)
- [API Reference](../06-API-REFERENCE/)

---

**Maintained by:** AI Documentation System  
**Complexity:** High  
**Review Frequency:** Monthly
