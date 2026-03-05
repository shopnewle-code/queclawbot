# 🤖 QueClaw AI - Advanced Telegram Bot with Subscriptions

A production-ready Telegram bot with AI integration, PayPal subscriptions, and MongoDB storage.

## 🎯 Features

- ✅ **Telegram Bot** - Full command support (/ai, /upgrade, /profile, /stats)
- ✅ **PayPal Integration** - Subscriptions + one-time payments
- ✅ **AI Engine** - Multi-provider support (Groq, OpenAI, Claude)
- ✅ **User Management** - Subscription tracking and usage limits
- ✅ **Webhook Handling** - Real-time payment notifications
- ✅ **Admin Dashboard** - Statistics and user analytics
- ✅ **Modular Architecture** - Clean, maintainable codebase
- ✅ **Error Handling** - Comprehensive logging and error management

## 📁 Project Structure

```
backend-node/
├── config/                 # Configuration files
│   ├── env.js             # Environment variables
│   └── mongodb.js         # MongoDB connection
├── models/                # Database models
│   └── User.js            # User schema
├── services/              # Business logic
│   ├── paypalService.js   # PayPal API operations
│   ├── aiService.js       # AI engine integration
│   └── subscriptionService.js  # Subscription management
├── handlers/              # Request handlers
│   ├── botHandlers.js     # Telegram bot commands
│   └── paypalWebhookHandler.js  # PayPal events
├── routes/                # API routes
│   ├── generalRoutes.js   # Health, stats, user endpoints
│   └── paypalRoutes.js    # PayPal endpoints
├── middleware/            # Express middleware
│   └── errorHandler.js    # Error handling
├── utils/                 # Utility functions
│   ├── constants.js       # App constants
│   └── logger.js          # Logging utility
├── server.js              # Main entry point
├── package.json           # Dependencies
├── .env                   # Environment variables (DO NOT COMMIT)
└── .env.example          # Example environment file
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend-node
npm install
```

### 2. Configure Environment

```bash
# Copy example to actual .env file
cp .env.example .env

# Edit .env with your credentials
# - TELEGRAM_TOKEN from @BotFather
# - PayPal credentials from developer.paypal.com
# - MongoDB connection string
# - ADMIN_ID (your Telegram ID)
```

### 3. Install System Dependencies

- **Node.js** 16+ (https://nodejs.org)
- **MongoDB** (local or Atlas) (https://www.mongodb.com)
- **Python AI Engine** (separate project)

### 4. Start Server

```bash
# Development
npm run dev

# Production
npm start
```

## 📋 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| PORT | Server port | No (default: 3000) |
| BASE_URL | Base URL for webhooks | Yes |
| TELEGRAM_TOKEN | Bot token from @BotFather | Yes |
| ADMIN_ID | Your Telegram ID | Yes |
| PAYPAL_MODE | sandbox or live | Yes |
| PAYPAL_CLIENT_ID | PayPal client ID | Yes |
| PAYPAL_SECRET | PayPal secret | Yes |
| PAYPAL_PLAN_ID | PayPal subscription plan ID | Yes |
| MONGO_URI | MongoDB connection string | Yes |
| AI_SERVER_URL | Python AI engine URL | Yes |

## 🤖 Telegram Commands

| Command | Description |
|---------|-------------|
| `/help` | Show help menu |
| `/ai <prompt>` | Ask AI a question |
| `/upgrade` | Subscribe to Pro plan |
| `/profile` | View your account |
| `/stats` | View bot statistics (admin only) |

## 💳 PayPal Plans

- **Free**: 5 queries per month
- **Pro**: Unlimited queries - $4.99/month

## 📊 API Endpoints

### General
- `GET /api/` - Server info
- `GET /api/health` - Health check
- `GET /api/stats` - Bot statistics
- `GET /api/user/:telegramId` - User info

### PayPal
- `POST /api/paypal/create-subscription` - Create subscription
- `POST /api/paypal/create-order` - Create one-time order
- `POST /api/paypal/webhook` - PayPal webhook
- `GET /api/paypal/subscription/:id` - Get subscription details
- `POST /api/paypal/cancel/:id` - Cancel subscription

## 🔐 Security Features

- ✅ Helmet.js for HTTP headers
- ✅ CORS protection
- ✅ PayPal webhook verification
- ✅ Admin command protection
- ✅ Input validation
- ✅ Error message sanitization

## 🛠️ Development

### Run in Development Mode with Auto-Reload

```bash
npm run dev
```

### View Logs

```bash
# Enable debug logs
DEBUG=true npm run dev
```

### Test PayPal Webhook

```bash
curl -X POST http://localhost:3000/api/paypal/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "BILLING.SUBSCRIPTION.ACTIVATED",
    "resource": {
      "id": "sub-123",
      "custom_id": "user-123"
    }
  }'
```

## 📦 Dependencies

- **express** - Web framework
- **mongoose** - MongoDB ODM
- **axios** - HTTP client
- **node-telegram-bot-api** - Telegram bot
- **cors** - CORS middleware
- **helmet** - Security middleware
- **dotenv** - Environment variables

## 🚨 Troubleshooting

### MongoDB Not Connecting
```bash
# Check MongoDB is running
mongosh

# Or use MongoDB Atlas
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/queclaw
```

### Bot Not Receiving Updates
- Verify TELEGRAM_TOKEN is correct
- Check bot token with @BotFather
- Ensure polling is enabled

### PayPal Webhook Not Working
- Verify PAYPAL_WEBHOOK_ID is set
- Check BASE_URL is accessible
- Verify webhook is registered in PayPal dashboard

### AI Server Not Responding
- Check AI engine is running on port 8000
- Verify AI_SERVER_URL matches your setup
- Check AI engine logs for errors

## 📈 Scaling Architecture

For 10k+ users, implement:

```
Telegram Bot
     │
Node.js API (load balanced)
     │
Redis Queue (message broker)
     │
AI Workers (Python pool)
     │
MongoDB (replica set)
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for details.

## 📝 License

MIT License - see LICENSE file

## 🤝 Support

For issues and questions:
1. Check troubleshooting section above
2. Review logs with DEBUG=true
3. Check MongoDB and AI engine are running
4. Verify all environment variables are set

## 👨‍💻 Author

QueClaw AI Team

---

**Happy coding! 🚀**
