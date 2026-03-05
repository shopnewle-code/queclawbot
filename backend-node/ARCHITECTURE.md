# 🏗️ QueClaw AI Bot - Architecture Guide

## Overview

QueClaw Bot is a production-ready Telegram AI bot with PayPal subscriptions. It uses a **modular, service-oriented architecture** for scalability and maintainability.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Telegram Users                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Telegram Bot (node-telegram-bot-api)           │
│  - Command handlers (/ai, /upgrade, /profile, /stats)      │
│  - Message routing & validation                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                Express.js Web Server                        │
│  - Port: 3000                                               │
│  - Middleware: CORS, Helmet, Logger                        │
│  - Routes: /api/*, /api/paypal/*                           │
└──────────────┬────────────────────┬────────────────────────┘
               │                    │
        ┌──────▼──────┐      ┌──────▼──────┐
        │ Services    │      │ Handlers    │
        ├─────────────┤      ├─────────────┤
        │ PayPal API  │      │ Bot Cmds    │
        │ AI Engine   │      │ Webhooks    │
        │ Subscript.  │      │ Validation  │
        └──────┬──────┘      └─────────────┘
               │
        ┌──────▼──────────────┐
        │  External APIs      │
        ├─────────────────────┤
        │ PayPal (REST API)   │
        │ Python AI Engine    │
        │  (http://8000)      │
        └─────────────────────┘
```

## Directory Structure & Responsibilities

### `/config` - Configuration Management
```
config/
├── env.js          # Central env var config with validation
└── mongodb.js      # MongoDB connection & initialization
```

**Purpose**: Centralize all configuration and external service setup
- **env.js**: Defines all environment variables with defaults
- **mongodb.js**: Handles MongoDB connection logic

### `/models` - Database Schemas
```
models/
└── User.js         # User model with subscription & usage tracking
```

**Purpose**: Define database schemas using Mongoose ODM
- User schema with subscription tracking
- Methods for subscription management
- Usage tracking and limit enforcement

### `/services` - Business Logic
```
services/
├── paypalService.js       # PayPal API wrapper
├── aiService.js           # AI engine REST client
└── subscriptionService.js # Subscription lifecycle management
```

**Purpose**: Core business logic and external service integration
- **paypalService.js**: Handles all PayPal operations
  - Token management with caching
  - Subscription creation/cancellation
  - One-time orders
  
- **aiService.js**: AI engine integration
  - Send prompts and get responses
  - User info retrieval
  - Health checks
  
- **subscriptionService.js**: Subscription management
  - User creation/retrieval
  - Activation/cancellation
  - Expiry checking
  - Statistics

### `/handlers` - Event Handlers
```
handlers/
├── botHandlers.js              # Telegram bot command handlers
└── paypalWebhookHandler.js     # PayPal event processor
```

**Purpose**: Handle specific events and interactions
- **botHandlers.js**: All Telegram bot commands
  - /help, /ai, /upgrade, /profile, /stats
  - User validation and AI calls
  
- **paypalWebhookHandler.js**: PayPal event processing
  - Subscription activation
  - Payment received
  - Cancellation/expiry

### `/routes` - API Endpoints
```
routes/
├── generalRoutes.js   # Health, stats, user endpoints
└── paypalRoutes.js    # PayPal subscription/order endpoints
```

**Purpose**: Express.js route definitions
- **generalRoutes.js**:
  - `GET /api/` - Server info
  - `GET /api/health` - Health check
  - `GET /api/stats` - Bot statistics
  - `GET /api/user/:id` - User info
  
- **paypalRoutes.js**:
  - `POST /api/paypal/create-subscription` - Create subscription
  - `POST /api/paypal/create-order` - One-time payment
  - `POST /api/paypal/webhook` - PayPal IPN
  - `GET /api/paypal/subscription/:id` - Subscription details

### `/middleware` - Express Middleware
```
middleware/
└── errorHandler.js    # Error handling & validation
```

**Purpose**: Cross-cutting concerns
- Error handling and logging
- Request validation
- 404 handling
- Request logging

### `/utils` - Utility Functions
```
utils/
├── constants.js       # App constants and messages
└── logger.js          # Centralized logging
```

**Purpose**: Shared utilities and helpers
- **constants.js**: All hardcoded strings, enums, status codes
- **logger.js**: Consistent logging with emoji indicators

## Data Flow Examples

### 1️⃣ User Asks AI (/ai command)

```
User: /ai What is AI?
   │
   ▼
botHandlers.findOrCreateUser()
   │
   ▼
Check usage limits (Free: 5, Pro: unlimited)
   │
   ├─► User at limit? → Send "Upgrade" message
   │
   ▼
aiService.askAI(prompt, telegramId)
   │
   ▼
Python Engine (http://localhost:8000/ask)
   │
   ▼
subscriptionService.increaseUsage()
   │
   ▼
Send response to user
```

### 2️⃣ User Subscribes (/upgrade command)

```
User: /upgrade
   │
   ▼
botHandlers.handleUpgradeCommand()
   │
   ▼
paypalService.createSubscription(telegramId)
   │
   ▼
PayPal API (GET auth token, CREATE subscription)
   │
   ▼
Return approval URL
   │
   ▼
Send inline button to user
   │
   ▼
User clicks → PayPal checkout → Returns to bot
```

### 3️⃣ PayPal Webhook (Subscription Activated)

```
PayPal: POST /api/paypal/webhook
   {event_type: "BILLING.SUBSCRIPTION.ACTIVATED"}
   │
   ▼
paypalWebhookHandler.handlePayPalWebhook()
   │
   ▼
subscriptionService.activateSubscription(telegramId)
   │
   ▼
User.findOneAndUpdate() → Set to PRO plan
   │
   ▼
bot.sendMessage() → "🎉 Subscription Activated!"
```

## Request Lifecycle

```
Express Server
   │
   ├─ Helmet (security headers)
   ├─ CORS (cross-origin requests)
   │
   ├─ requestLogger (logging)
   ├─ validateJSON (input validation)
   │
   ├─ Routes (/api/...)
   │  ├─ General routes
   │  └─ PayPal routes
   │
   ├─ 404 Handler
   └─ Error Handler (catches all errors)
```

## Storage & Persistence

### MongoDB Collections

**users**
```javascript
{
  _id: ObjectId,
  telegramId: "123456789",
  username: "john_doe",
  firstName: "John",
  lastName: "Doe",
  subscriptionActive: true,
  subscriptionId: "I-XXXXX",
  subscriptionExpire: Date,
  plan: "pro",
  aiUsage: 150,
  lastUsageReset: Date,
  totalSpent: 49.99,
  paymentHistory: [...],
  language: "en",
  timezone: "UTC",
  notifications: true,
  isActive: true,
  lastInteraction: Date,
  ipAddresses: ["1.2.3.4"],
  createdAt: Date,
  updatedAt: Date
}
```

## External Integrations

### 1. PayPal API
- **Base URL**: https://api-m.sandbox.paypal.com (sandbox) or https://api.paypal.com (live)
- **Auth**: OAuth 2.0 Bearer token
- **Operations**:
  - Create subscription
  - View subscription details
  - Cancel subscription
  - Verify webhooks

### 2. Python AI Engine
- **Base URL**: http://localhost:8000
- **Endpoints**:
  - `POST /ask` - Send prompt, get response
  - `GET /health` - Health check
  - `GET /get_user/:id` - User info
  - `POST /update-plan` - Sync plan

### 3. Telegram Bot API
- **Polling**: Long polling for message updates
- **Commands**: /help, /ai, /upgrade, /profile, /stats
- **Inline Buttons**: Payment links, action buttons

## Error Handling Strategy

```
Try-Catch Flow:
   │
   ├─ Database errors → Log & return 500
   ├─ PayPal errors → Log & send user message
   ├─ AI service errors → Tell user to retry
   ├─ Validation errors → Return 400
   ├─ Auth errors → Return 401
   └─ Unknown errors → 500 + log stack trace
```

## Scalability Improvements (Future)

### For 10k+ users:

1. **Message Queue**
   ```
   Telegram → Redis Queue → Worker Pool
   ```

2. **Load Balancing**
   ```
   Users → Load Balancer (nginx)
            ├─ Server 1
            ├─ Server 2
            └─ Server 3
   ```

3. **Database Replication**
   ```
   MongoDB Replica Set
   ├─ Primary (writes)
   ├─ Secondary (reads)
   └─ Arbiter
   ```

4. **Caching**
   ```
   Redis Cache
   ├─ PayPal tokens
   ├─ User session data
   └─ Statistics
   ```

## Environment Variables

```bash
# Server
PORT=3000
BASE_URL=https://queclawbot.loca.lt
NODE_ENV=development

# Telegram
TELEGRAM_TOKEN=your_token
ADMIN_ID=your_id

# PayPal
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=xxx
PAYPAL_SECRET=xxx
PAYPAL_PLAN_ID=xxx
PAYPAL_WEBHOOK_ID=xxx

# Database
MONGO_URI=mongodb://localhost:27017/queclaw

# AI
AI_SERVER_URL=http://localhost:8000
```

## Development Workflow

```bash
# 1. Install dependencies
npm install

# 2. Start MongoDB
mongod

# 3. Start AI engine (separate terminal)
cd ../ai-engine-python
python main.py

# 4. Start Node.js server with auto-reload
npm run dev

# 5. Test in Telegram
/ai What is machine learning?
```

## Testing Endpoints

```bash
# Health check
curl http://localhost:3000/api/health

# Get stats
curl http://localhost:3000/api/stats

# Create subscription
curl -X POST http://localhost:3000/api/paypal/create-subscription \
  -H "Content-Type: application/json" \
  -d '{"telegram_id":"123456789"}'

# PayPal webhook test
curl -X POST http://localhost:3000/api/paypal/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event_type":"BILLING.SUBSCRIPTION.ACTIVATED",
    "resource":{"id":"sub-123","custom_id":"user-123"}
  }'
```

## Performance Considerations

1. **Database Indexing**: Indexed on telegramId, createdAt, subscriptionActive
2. **PayPal Token Caching**: 45-minute cache to avoid repeated OAuth calls
3. **Async/Await**: Non-blocking I/O throughout
4. **Error Recovery**: Auto-retry on transient failures
5. **Graceful Shutdown**: Proper cleanup on SIGTERM/SIGINT

## Security Measures

1. **Helmet.js**: HTTP header security
2. **CORS**: Cross-origin request control
3. **Input Validation**: All inputs validated
4. **Error Messages**: No sensitive data leaked
5. **Admin Protection**: /stats only available to admin
6. **PayPal Verification**: Webhook signature validation (simplified)

---

**Architecture Version**: 1.0
**Last Updated**: 2026-03-05
**Status**: Production-Ready
