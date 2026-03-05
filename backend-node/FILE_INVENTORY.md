# 📋 QueClaw Backend - File Inventory

This document provides a quick reference for all files in the refactored backend.

## 📁 Project Structure

```
backend-node/
│
├─ 📁 config/                          [Configuration Management]
│  ├─ env.js                          Centralized environment variables
│  └─ mongodb.js                      Database connection setup
│
├─ 📁 models/                          [Database Schemas]
│  └─ User.js                         User model with subscription tracking
│
├─ 📁 services/                        [Business Logic Layer]
│  ├─ paypalService.js                PayPal API operations (auth, subscriptions, orders)
│  ├─ aiService.js                    AI engine REST client integration
│  └─ subscriptionService.js          Subscription lifecycle management
│
├─ 📁 handlers/                        [Event Handlers]
│  ├─ botHandlers.js                  Telegram bot command handlers
│  └─ paypalWebhookHandler.js         PayPal webhook event processor
│
├─ 📁 routes/                          [API Route Definitions]
│  ├─ generalRoutes.js                Health, stats, user endpoints
│  └─ paypalRoutes.js                 PayPal subscription/order endpoints
│
├─ 📁 middleware/                      [Express Middleware]
│  └─ errorHandler.js                 Error handling, validation, logging
│
├─ 📁 utils/                           [Utility Functions]
│  ├─ constants.js                    App constants, messages, enums
│  └─ logger.js                       Centralized logging utility
│
├─ 📁 node_modules/                    [NPM Dependencies]
│
├─ server.js                           ⭐ Main entry point (refactored)
├─ package.json                        ⭐ Dependencies & scripts (updated)
├─ package-lock.json
│
├─ .env                                🔐 Environment variables (your credentials)
├─ .env.example                        📝 Example env template
│
├─ README.md                           📖 Getting started guide
├─ ARCHITECTURE.md                     🏗️ Detailed architecture documentation
├─ MIGRATION_GUIDE.md                  📋 Migration from old structure
└─ FILE_INVENTORY.md                   📋 This file
```

## 📄 File Details

### Core Entry Point

#### `server.js` (128 lines)
**Purpose**: Main application entry point
- Express app initialization
- Middleware setup (helmet, CORS, logging)
- Bot initialization
- Route mounting
- Error handling setup
- Graceful shutdown

**Key Features**:
- Async/await pattern for clean initialization
- Comprehensive error handling
- Process signal handlers (SIGTERM, SIGINT, SIGKILL)
- Subscription expiry check (hourly)
- Pretty startup logs

---

### Configuration Files (`config/`)

#### `config/env.js` (50 lines)
**Purpose**: Centralized environment configuration
- All env vars in one place
- Default values provided
- Environment validation
- Exports single `env` object

**Example**:
```javascript
export const env = {
  PORT: process.env.PORT || 3000,
  TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN,
  PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
  // ... etc
};
```

#### `config/mongodb.js` (22 lines)
**Purpose**: MongoDB connection management
- Connection initialization
- Error handling
- Graceful disconnection

**Exports**:
- `connectMongoDB()` - Async connection
- `disconnectMongoDB()` - Async disconnection
- `default` - mongoose instance

---

### Database Models (`models/`)

#### `models/User.js` (120 lines)
**Purpose**: Mongoose User schema with advanced features
- Complete user information tracking
- Subscription management
- Payment history
- Usage tracking

**Schema Fields**:
- Telegram info (telegramId, username, firstName, lastName)
- Subscription info (subscriptionActive, subscriptionId, subscriptionExpire, plan)
- Usage tracking (aiUsage, lastUsageReset)
- Payment history
- User settings & metadata

**Methods**:
- `hasUnlimitedAI()` - Check Pro status
- `canUseAI(limit)` - Check usage limit
- `increaseUsage()` - Increment usage count
- `resetUsage()` - Reset monthly usage
- `activateSubscription()` - Activate Pro plan
- `cancelSubscription()` - Downgrade to Free

**Indexes**: telegramId, createdAt, subscriptionActive, subscriptionExpire

---

### Services (`services/`)

#### `services/paypalService.js` (180 lines)
**Purpose**: PayPal API integration wrapper
- OAuth token management with caching
- Subscription operations
- One-time order creation
- Subscription details retrieval
- Cancellation handling

**Key Methods**:
- `getAccessToken()` - Gets/caches PayPal token
- `createSubscription(telegramId, planId)` - Creates subscription
- `createOrder(amount, currency)` - Creates one-time order
- `getSubscriptionDetails(subscriptionId)` - Fetches details
- `cancelSubscription(subscriptionId)` - Cancels subscription
- `verifyWebhookSignature()` - Webhook verification

**Features**:
- Token caching (45-minute cache)
- Error handling with meaningful messages
- Request-Id headers for idempotency
- Timeout handling

#### `services/aiService.js` (90 lines)
**Purpose**: Python AI engine integration
- REST client for AI operations
- User synchronization
- Health checks

**Key Methods**:
- `askAI(prompt, userId)` - Send prompt, get response
- `getUserInfo(userId)` - Retrieve user data
- `updateUserPlan(userId, plan)` - Sync subscription
- `healthCheck()` - Check AI engine status

**Features**:
- Automatic timeout handling
- Error message translation
- Connection error detection
- Rate limit handling

#### `services/subscriptionService.js` (140 lines)
**Purpose**: Handle subscription lifecycle
- User management (create/find)
- Subscription activation/cancellation
- Renewal handling
- Expiry detection
- Statistics gathering

**Key Methods**:
- `findOrCreateUser(telegramId, userData)` - User lifecycle
- `activateSubscription(telegramId, subscriptionId, months)` - Activate Pro
- `cancelSubscription(telegramId)` - Downgrade to Free
- `renewSubscription(subscriptionId)` - Monthly renewal
- `checkAndDeactivateExpired()` - Cleanup task
- `getStats()` - Bot statistics

**Features**:
- Automatic user creation
- Date calculation (expiry, renewal)
- Database transactions
- Comprehensive logging

---

### Handlers (`handlers/`)

#### `handlers/botHandlers.js` (220 lines)
**Purpose**: Telegram bot command handlers
- Register all bot commands
- Handle user interactions
- Validate inputs
- Call services

**Commands Handled**:
- `/help` - Show help menu
- `/ai <prompt>` - Ask AI a question
- `/upgrade` - Subscribe to Pro
- `/profile` - View user account
- `/stats` - Bot statistics (admin only)

**Features**:
- Usage limit checking
- Error recovery with retry
- User creation on first message
- Admin protection (/stats)
- Usage tracking
- Inline keyboard generation

#### `handlers/paypalWebhookHandler.js` (110 lines)
**Purpose**: Process PayPal webhook events
- Subscription activation
- Payment completion
- Cancellation/expiry

**Events Handled**:
- `BILLING.SUBSCRIPTION.ACTIVATED` - New subscription
- `PAYMENT.SALE.COMPLETED` - Monthly payment
- `BILLING.SUBSCRIPTION.CANCELLED` - User cancelled
- `BILLING.SUBSCRIPTION.EXPIRED` - Auto-expiry

**Features**:
- Event type routing
- Database updates
- User message notifications
- Error resilience

---

### Routes (`routes/`)

#### `routes/generalRoutes.js` (90 lines)
**Purpose**: General-purpose API endpoints
- Health checks
- Statistics
- User information
- Server info

**Endpoints**:
- `GET /api/` → Server info
- `GET /api/health` → Health check (DB + AI)
- `GET /api/stats` → Statistics
- `GET /api/user/:telegramId` → User details

**Features**:
- JSON responses
- Error handling
- Database status checking
- Service integration

#### `routes/paypalRoutes.js` (140 lines)
**Purpose**: PayPal subscription management endpoints
- Subscription creation
- Order creation
- Webhook handling
- Subscription management

**Endpoints**:
- `POST /api/paypal/create-subscription` → Create subscription
- `POST /api/paypal/create-order` → Create one-time payment
- `POST /api/paypal/webhook` → PayPal IPN
- `GET /api/paypal/subscription/:id` → Get details
- `POST /api/paypal/cancel/:id` → Cancel subscription
- `GET /api/paypal/success` → Success page
- `GET /api/paypal/cancel` → Cancel page

**Features**:
- Input validation
- Service layer usage
- HTML redirect pages
- Event routing

---

### Middleware (`middleware/`)

#### `middleware/errorHandler.js` (70 lines)
**Purpose**: Express middleware for cross-cutting concerns
- Global error handling
- Request logging
- 404 handling
- Input validation

**Exports**:
- `errorHandler(err, req, res, next)` - Global error catch
- `notFoundHandler(req, res)` - 404 responses
- `requestLogger(req, res, next)` - Request logging
- `validateJSON(req, res, next)` - JSON validation

**Features**:
- Stack trace in development
- Emoji-based severity
- Duration tracking
- Sanitized error messages

---

### Utilities (`utils/`)

#### `utils/constants.js` (80 lines)
**Purpose**: Centralized application constants
- Plan names
- Bot messages
- Event types
- HTTP status codes

**Collections**:
- `PLANS` - "free", "pro"
- `TELEGRAM_MESSAGES` - All bot messages
- `BOT_COMMANDS` - Command names
- `BOT_REGEX` - Command patterns
- `PAYPAL_EVENTS` - Event types
- `HTTP_STATUS` - Status codes
- `SUBSCRIPTION_DURATION_MONTHS` - Duration

**Benefits**:
- Single source of truth
- Easy message updates
- No magic strings in code

#### `utils/logger.js` (40 lines)
**Purpose**: Consistent logging utility
- Emoji-based levels
- Simple API
- Centralized format

**Functions**:
- `logError()` - 🔴 Errors
- `logWarn()` - 🟡 Warnings
- `logInfo()` - 🔵 Info
- `logSuccess()` - ✅ Success
- `logDebug()` - 🟣 Debug (when DEBUG=true)

**Usage**:
```javascript
import { logger } from "./utils/logger.js";

logger.success("Operation completed");
logger.error("Failed operation", error);
logger.info("Starting process");
```

---

### Configuration Files

#### `.env.example` (40 lines)
**Purpose**: Template for environment configuration
- All required variables listed
- Example values shown
- Comments explaining each section

**Categories**:
- Server configuration
- Telegram bot
- PayPal settings
- MongoDB
- AI engine
- Rate limiting (optional)
- Logging (optional)

#### `package.json` (updated)
**Scripts**:
- `npm start` - Production (node server.js)
- `npm run dev` - Development with reload (node --watch server.js)
- `npm test` - Test setup

---

### Documentation Files

#### `README.md` (180 lines)
**Purpose**: Getting started guide
- Feature list
- Quick start
- Environment setup
- API endpoints reference
- Troubleshooting
- Scaling architecture

#### `ARCHITECTURE.md` (250 lines)
**Purpose**: Technical architecture documentation
- System diagram
- Data flow examples
- Request lifecycle
- Storage structure
- External integrations
- Scalability roadmap

#### `MIGRATION_GUIDE.md` (200 lines)
**Purpose**: Migration from old structure
- Summary of changes
- File mapping (old → new)
- What stayed the same
- What's new
- Running instructions
- Testing endpoints

#### `FILE_INVENTORY.md`
**Purpose**: This file - Quick reference

---

## 📊 Statistics

| Metric | Value |
|--------|-------|
| **Total Files** | 28+ |
| **Lines of Code** | ~2000 |
| **Configuration Files** | 2 |
| **Model Files** | 1 |
| **Service Files** | 3 |
| **Handler Files** | 2 |
| **Route Files** | 2 |
| **Middleware Files** | 1 |
| **Utility Files** | 2 |
| **Documentation Files** | 4 |

---

## 🔑 Key Features by File

| Feature | File(s) |
|---------|---------|
| **User Management** | `services/subscriptionService.js`, `models/User.js` |
| **PayPal Integration** | `services/paypalService.js`, `routes/paypalRoutes.js` |
| **Telegram Bot** | `handlers/botHandlers.js` |
| **AI Integration** | `services/aiService.js` |
| **Database** | `config/mongodb.js`, `models/User.js` |
| **API Endpoints** | `routes/generalRoutes.js`, `routes/paypalRoutes.js` |
| **Error Handling** | `middleware/errorHandler.js` |
| **Logging** | `utils/logger.js` |
| **Configuration** | `config/env.js`, `.env` |

---

## 🚀 Quick Navigation

### I want to...
- **Change bot messages** → Edit `utils/constants.js`
- **Add a new command** → Add to `handlers/botHandlers.js`
- **Modify user schema** → Edit `models/User.js`
- **Add a PayPal feature** → Edit `services/paypalService.js`
- **Add API endpoint** → Create in `routes/`
- **Handle new errors** → Update `middleware/errorHandler.js`
- **Change config** → Edit `config/env.js` or `.env`

---

## 📙 Learning Path

1. **Start with** → `README.md` (5 min)
2. **Understand structure** → `ARCHITECTURE.md` (15 min)
3. **See what changed** → `MIGRATION_GUIDE.md` (10 min)
4. **Explore code** → Start with `server.js` (entry point)
5. **Learn services** → Read `services/` files
6. **Check handlers** → Read `handlers/` files

---

## ✅ Verification Checklist

- ✅ All 15+ files created
- ✅ server.js refactored
- ✅ package.json updated
- ✅ Documentation complete
- ✅ .env preserved
- ✅ .env.example created
- ✅ No API keys exposed
- ✅ Modular structure in place
- ✅ Error handling added
- ✅ Logging utility added

---

**Status**: ✅ Refactoring Complete
**Version**: 1.0
**Last Updated**: 2026-03-05

---

For more information, see:
- 📖 [README.md](./README.md) - Getting started
- 🏗️ [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical details
- 📋 [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Migration help
