# QueClaw Enterprise Dashboard - Implementation Guide

**Status:** Phase 1 Complete ✅ | Foundation & RBAC Ready

## What's Been Implemented (Phase 1) ✅

### 1. **New App Directory Structure**
```
app/
├── (auth)/login/page.tsx          - Authentication
├── (dashboard)/
│   ├── page.tsx                   - Main dashboard
│   ├── users/page.tsx             - User management
│   ├── subscriptions/page.tsx      - Subscriptions
│   ├── analytics/page.tsx          - Analytics
│   ├── conversations/page.tsx      - AI conversations
│   ├── logs/page.tsx               - Activity logs ⭐ (implemented)
│   ├── fraud/page.tsx              - Fraud detection
│   ├── payments/page.tsx           - Payment analytics
│   ├── broadcast/page.tsx          - Email campaigns
│   ├── feature-flags/page.tsx      - Feature control
│   ├── bot-monitor/page.tsx        - Bot health ⭐ (implemented)
│   ├── api-keys/page.tsx           - API management
│   ├── commands/page.tsx           - Bot commands
│   └── settings/page.tsx           - Settings
└── api/auth/route.ts              - Auth endpoints
```

### 2. **Role-Based Access Control (RBAC)**
- 4 Role tiers: Super Admin, Admin, Support, Finance
- Permission matrix with 20+ granular permissions
- Middleware-based route protection
- Role-aware sidebar navigation

### 3. **State Management (Zustand)**
- `authStore.ts` - User authentication & role checks
- `uiStore.ts` - Theme, sidebar, notifications
- Global state with persistence

### 4. **Layout Components**
- Responsive sidebar with role-based menu
- Header with theme toggle & user menu
- Dark mode ready (Tailwind CSS configured)

### 5. **Implemented Pages**
- **Main Dashboard** - Metrics & overview
- **Activity Logs** - Full admin action tracking
- **Bot Monitor** - Health & real-time metrics
- **Login Page** - Authentication UI

## Running the Dashboard

```bash
cd dashboard
npm install
npm run dev
```

Open: http://localhost:3000/login

**Demo Credentials:**
- Email: admin@queclaw.com
- Password: demo123

## Next Steps (Phase 2-6) 🚀

### Phase 2: Backend Connection
**Priority: HIGH** - Connect to actual Node.js backend

**Tasks:**
1. Update backend `/api` routes to return real data
   - `/api/users` - User list
   - `/api/analytics/dashboard` - Metrics
   - `/api/logs` - Activity logs
   - `/api/conversations` - Chat history
   - `/api/auth/login` - Real authentication

2. Create MongoDB models for new features:
```javascript
// Models to add in backend-node/models/
- admin_logs.js
- conversation_logs.js
- feature_flags.js
- api_keys.js
- bot_commands.js
- fraud_alerts.js
```

3. Create backend endpoints:
```javascript
// Routes to add in backend-node/routes/
POST /api/logs              - Create activity log
GET  /api/logs              - Get activity logs
GET  /api/conversations     - Get conversations
GET  /api/fraud             - Get fraud alerts
POST /api/feature-flags     - Update flag
GET  /api/api-keys          - List API keys
```

### Phase 3: Activity Logs & Audit Trail
**Priority: HIGH** - Critical for compliance

**Database Schema (MongoDB):**
```javascript
db.create Collection("admin_logs", {
  admin_id: String,
  admin_name: String,
  action: String,
  target_user: String,
  details: Object,
  ip_address: String,
  user_agent: String,
  timestamp: Date,
  status: "success" | "failed"
})
```

**Integration Points:**
- Hook into user deletion, bans
- Track subscription changes
- Log payment refunds
- Audit admin settings changes

### Phase 4: Real-Time Updates (WebSocket) 🔥
**Priority: MEDIUM** - Enhance UX

**Setup Socket.io:**
```bash
npm install socket.io-client
```

**Real-time events:**
- New user joins
- Payment received
- API error spike
- Bot query spike
- Subscription expired

**Implementation:**
```typescript
// Create lib/socket.ts
import io from 'socket.io-client';

export const socket = io(process.env.NEXT_PUBLIC_API_URL, {
  transports: ['websocket'],
  reconnection: true,
});

// Listen for events
socket.on('new_user', (data) => {
  // Update dashboard
});
```

### Phase 5: Advanced Features
**Priority: MEDIUM** - Build incrementally

#### 5.1 Conversations Viewer
- Display user-AI conversations
- Search & filter
- Token usage analysis
- Export conversations

#### 5.2 Fraud Detection
- Query rate anomalies
- Rapid subscription changes
- Geographic anomalies
- Risk scoring

#### 5.3 Feature Flags
- Toggle features without deploy
- Gradual rollout (%)
- Role-based targeting

#### 5.4 Email Broadcast
- Campaign builder
- Template system
- Scheduling
- Open/click tracking

### Phase 6: Polish & Enterprise ✨
- Dark mode fully functional
- System status page
- Advanced analytics charts
- Performance monitoring
- Export to CSV/PDF

## Adding New Charts

The dashboard uses Chart.js. Example:

```typescript
import { Chart as ChartJS, Line } from 'chart.js';
import { Line as LineChart } from 'react-chartjs-2';

export function RevenueChart() {
  const data = {
    labels: ['Jan', 'Feb', 'Mar'],
    datasets: [{
      label: 'Revenue',
      data: [1000, 2000, 3000],
      borderColor: '#4f46e5',
    }],
  };

  return <LineChart data={data} />;
}
```

## Database Models Needed (Backend)

Add these to `backend-node/models/`:

```javascript
// AdminLog.js
{
  admin_id: ObjectId,
  admin_name: String,
  action: String, // user_deleted, subscription_changed, etc
  target_user: ObjectId,
  details: Object,
  ip_address: String,
  timestamp: Date,
  processedWebhookIds: [String] // for deduplication
}

// ConversationLog.js
{
  user_id: ObjectId,
  messages: [{
    role: String, // user or assistant
    content: String,
    tokens_used: Number,
    timestamp: Date
  }],
  total_tokens: Number,
  created_at: Date
}

// FeatureFlag.js
{
  key: String, // enable_new_model
  enabled: Boolean,
  rollout_percentage: Number, // 0-100
  target_roles: [String],
  updated_at: Date,
  updated_by: ObjectId
}

// APIKey.js
{
  name: String,
  key: String, // hashed
  permissions: [String],
  usage: {
    total_requests: Number,
    last_used: Date
  },
  created_at: Date,
  expires_at: Date,
  revoked: Boolean
}
```

## Frontend Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_BOT_URL=https://t.me/queclaw_bot
NEXT_PUBLIC_WS_URL=http://localhost:3000
```

## Important Files

Key files to understand:

- **[lib/rbac.ts](lib/rbac.ts)** - Permission checking
- **[middleware.ts](middleware.ts)** - Route protection
- **[store/authStore.ts](store/authStore.ts)** - Auth state
- **[components/layout/Sidebar.tsx](components/layout/Sidebar.tsx)** - Navigation
- **[types/index.ts](types/index.ts)** - TypeScript types

## Architecture Diagram

```
User Login
    ↓
[Middleware] - Check token, verify role
    ↓
[Sidebar] - Show role-based routes
    ↓
[Page Component] - Fetch data from API
    ↓
[Backend API] - MongoDB
    ↓
Real-time updates via WebSocket
```

## Testing Checklist

- [ ] Login works
- [ ] Sidebar shows based on role
- [ ] Activity logs display
- [ ] Bot monitor shows metrics
- [ ] Dark mode toggles
- [ ] Mobile responsive
- [ ] Role-based route protection
- [ ] API integration working

## Common Tasks

### Adding a New Role-Protected Page
1. Create `app/(dashboard)/new-page/page.tsx`
2. Add to `ACCESSIBLE_ROUTES` in `lib/rbac.ts`
3. Add menu item to Sidebar.tsx
4. Create backend API endpoint
5. Import data and render

### Adding a New Permission
1. Add to `Permission` type in `types/index.ts`
2. Add to `ROLE_PERMISSIONS` in `lib/rbac.ts`
3. Check with `hasPermission(user.role, 'permission_name')`

### Styling Components
- Use Tailwind CSS classes
- Dark mode prefix: `dark:`
- Example: `dark:bg-gray-800 dark:text-white`

## Support & Debugging

### Issue: Sidebar not showing menus
Check `hasPermission()` logic for user's role

### Issue: Changes not appearing
Clear browser cache or use Ctrl+Shift+R

### Issue: API calls failing
Check `.env.local` API URL and CORS headers

## Deployment

### To Vercel
```bash
vercel deploy
```

### Environment Variables (Vercel)
```
NEXT_PUBLIC_API_URL=https://api.queclaw.com/api
NEXT_PUBLIC_BOT_URL=https://t.me/queclaw_bot
```

---

**Next: Connect to real backend and implement Phase 2 features!** 🚀
