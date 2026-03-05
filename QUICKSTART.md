# QueClaw AI Bot - Complete Setup Guide

## 🎯 Project Overview

QueClaw is a full-featured SaaS bot platform built with:
- **Backend Node.js Bot** - Telegram bot with AI integration (modular architecture)
- **Python AI Engine** - FastAPI backend for AI processing
- **MongoDB** - User data and subscription storage
- **PayPal Integration** - Subscription billing
- **React Dashboard** - Admin panel for management

## 📦 Quick Start

### Prerequisites
- Node.js 16+ (for backend and dashboard)
- Python 3.8+ (for AI engine)
- MongoDB instance
- PayPal Developer Account
- Telegram BotFather token

### Directory Structure
```
Queclaw/
├── backend-node/          # Node.js Telegram bot
├── ai-engine-python/      # Python AI engine
├── dashboard/             # React admin dashboard
└── .vscode/              # VS Code settings
```

## 🚀 Backend Setup (Node.js Bot)

### 1. Install Dependencies
```bash
cd backend-node
npm install
```

### 2. Configure Environment
Create `.env` file:
```env
# Server
PORT=3000
NODE_ENV=development

# Telegram
TELEGRAM_TOKEN=your_token_from_botfather
ADMIN_ID=your_telegram_id

# PayPal (Sandbox)
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_SECRET=your_secret
PAYPAL_PLAN_ID=your_plan_id
PAYPAL_WEBHOOK_ID=your_webhook_id

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/queclaw

# AI Engine
AI_SERVER_URL=http://localhost:8000

# Usage Limits
AI_USAGE_FREE_LIMIT=5
AI_USAGE_PRO_LIMIT=unlimited
```

### 3. Start the Bot
```bash
npm run dev
```

The bot server will start on port 3000.

## 🐍 Python AI Engine Setup

### 1. Create Virtual Environment
```bash
cd ai-engine-python
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure API Keys
Create `.env` file:
```env
# Choose your AI provider (Groq, OpenAI, or Claude)
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_key
# OR
OPENAI_API_KEY=your_openai_key
# OR
ANTHROPIC_API_KEY=your_claude_key

# Server
PORT=8000
```

### 4. Start the Server
```bash
python main.py
```

The AI engine will start on port 8000.

## 🎨 Dashboard Setup (React)

### 1. Install Dependencies
```bash
cd dashboard
npm install
```

### 2. Configure Environment
Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_BOT_URL=https://t.me/queclaw_bot
```

### 3. Start Development Server
```bash
npm run dev
```

Dashboard will be available at [http://localhost:3000](http://localhost:3000)

## 📊 MongoDB Setup

### Option 1: MongoDB Atlas (Cloud)
1. Create account at [mongodb.com](https://mongodb.com)
2. Create a cluster
3. Get connection string
4. Add to `.env` as `MONGODB_URI`

### Option 2: Local MongoDB
```bash
# Windows
mongod

# Mac/Linux
brew services start mongodb-community
```

Default URL: `mongodb://localhost:27017/queclaw`

## 💰 PayPal Setup

### 1. Create Developer Account
- Visit [developer.paypal.com](https://developer.paypal.com)
- Create sandbox account
- Navigate to "Apps & Credentials"

### 2. Create Subscription Plan
1. Go to "Products" → "Billing Plans"
2. Create plan:
   - **Recurring Billing**
   - **Amount**: $4.99
   - **Frequency**: Monthly
   - Copy Plan ID to `.env` as `PAYPAL_PLAN_ID`

### 3. Create Webhook
1. Go to "Webhooks"
2. Event Types:
   - `BILLING.SUBSCRIPTION.CREATED`
   - `BILLING.SUBSCRIPTION.UPDATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
3. Webhook URL: `http://your-domain.com/api/paypal/webhook`
4. Copy Webhook ID to `.env` as `PAYPAL_WEBHOOK_ID`

## 🤖 Telegram Bot Setup

### 1. Create Bot with BotFather
1. Open [@BotFather](https://t.me/botfather) in Telegram
2. `/newbot`
3. Follow prompts
4. Copy token to `.env` as `TELEGRAM_TOKEN`

### 2. Get Your User ID
1. Message the bot
2. Send `/start`
3. Add your ID to `.env` as `ADMIN_ID`

### 3. Test Commands in Telegram
```
/start      - Welcome message
/help       - Show all commands
/ai <prompt> - Ask AI questions
/profile    - View your profile
/upgrade    - Subscribe to Pro
/search <query> - Web search (Pro)
/imagine <prompt> - Image generation (Pro)
/refer      - Referral program
```

## 🔑 API Endpoints

### Bot User Endpoints
```
GET  /api/users           - List all users
GET  /api/users/:id      - Get user details
POST /api/users          - Create user
PUT  /api/users/:id      - Update user
```

### Subscription Endpoints
```
GET  /api/subscriptions           - List subscriptions
POST /api/subscriptions/:userId   - Create subscription
DELETE /api/subscriptions/:userId - Cancel subscription
GET  /api/subscriptions/stats     - Get stats
```

### Analytics Endpoints
```
GET /api/analytics/dashboard  - Dashboard stats
GET /api/analytics/usage      - Usage trends
GET /api/analytics/revenue    - Revenue trends
GET /api/analytics/top-users  - Top users
```

## ✅ Testing Checklist

### Bot Functionality
- [ ] Bot responds to /start
- [ ] /help shows all commands
- [ ] /ai <prompt> returns AI response
- [ ] /profile shows user stats
- [ ] /upgrade opens PayPal
- [ ] /search works (test with Pro account)
- [ ] /imagine works (test with Pro account)

### Dashboard
- [ ] Login page loads
- [ ] Dashboard shows stats
- [ ] Users page displays list
- [ ] Subscriptions page works
- [ ] Analytics loads charts
- [ ] Settings saves changes

### Backend
- [ ] MongoDB connection works
- [ ] AI engine responds
- [ ] PayPal webhooks received
- [ ] User creation on /start
- [ ] Email notifications work

## 📝 Database Schema

### User Collection
```javascript
{
  telegramId: String,
  username: String,
  firstName: String,
  lastName: String,
  plan: 'free' | 'pro',
  aiUsage: Number,
  subscriptionActive: Boolean,
  subscriptionExpire: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Subscription Collection
```javascript
{
  userId: ObjectId,
  paypalSubscriptionId: String,
  planId: String,
  status: 'active' | 'suspended' | 'cancelled',
  amount: Number,
  startDate: Date,
  endDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🐛 Troubleshooting

### Bot Not Responding
1. Check TELEGRAM_TOKEN in .env
2. Ensure Node.js server is running (port 3000)
3. Check bot polling logs
4. Verify Telegram can reach your server

### AI Engine Not Working
1. Verify Python server running (port 8000)
2. Check AI_PROVIDER and API keys
3. Test with: `curl http://localhost:8000/health`
4. Check Python error logs

### PayPal Issues
1. Verify you're using Sandbox credentials
2. Check webhook configuration
3. Test with PayPal's webhook simulator
4. Verify webhook URL is accessible

### Database Issues
1. Check MongoDB connection string
2. Verify database exists
3. Check user permissions
4. Test connection: `mongosh <connection_string>`

## 📚 Documentation Files

See detailed documentation:
- `backend-node/README.md` - Backend documentation
- `backend-node/ARCHITECTURE.md` - System architecture
- `ai-engine-python/README.md` - AI engine guide
- `dashboard/README.md` - Dashboard guide

## 🚀 Deployment

### Heroku
```bash
# Install Heroku CLI, then:
heroku create queclaw-bot
git push heroku main
heroku config:set TELEGRAM_TOKEN=xxx
heroku logs --tail
```

### AWS EC2
1. Launch EC2 instance (Ubuntu)
2. Install Node.js and Python
3. Clone repository
4. Set environment variables
5. Run with PM2: `pm2 start server.js`

### Docker
```bash
docker build -t queclaw-bot .
docker run -p 3000:3000 --env-file .env queclaw-bot
```

##  💡 Tips & Best Practices

1. **Security**
   - Never commit .env files
   - Rotate API keys regularly
   - Use HTTPS in production
   - Validate all user inputs

2. **Performance**
   - Cache API responses
   - Use connection pooling for MongoDB
   - Implement rate limiting
   - Monitor server resources

3. **Monitoring**
   - Set up error tracking (Sentry)
   - Monitor bot logs
   - Track API usage
   - Set up alerts

4. **Scaling**
   - Use Redis for caching
   - Implement message queues
   - Load balance with nginx
   - Separate read/write databases

## 🤝 Support & Community

- GitHub Issues: Report bugs and request features
- Documentation: See detailed guides in each folder
- Email: support@queclaw.com

## 📄 License

MIT License - See LICENSE file

---

**Happy coding! 🚀**

Questions? Check the documentation or open an issue!
