# QueClaw Admin Dashboard - Architecture & Features Roadmap

## 🎯 Dashboard Overview

A production-grade SaaS admin dashboard for managing the QueClaw AI Bot business.

### Core Technologies
- **Frontend:** Next.js 14 + React 18
- **Styling:** Tailwind CSS + Dark Mode
- **State:** Zustand
- **Charts:** Chart.js & react-chartjs-2
- **Real-time:** Socket.io (ready to integrate)
- **Auth:** Custom JWT + Cookie-based
- **Database:** MongoDB (backend)

---

## 📊 Feature Matrix

### Phase 1: Foundation ✅ COMPLETE
| Feature | Status | Priority |
|---------|--------|----------|
| App directory structure | ✅ | - |
| RBAC (4 roles) | ✅ | - |
| Middleware & Route protection | ✅ | - |
| Dark mode foundation | ✅ | - |
| Sidebar with role-based menu | ✅ | - |
| Responsive layout | ✅ | - |

### Phase 2: Core Monitoring 🔄 NEXT
| Feature | Status | Priority |
|---------|--------|----------|
| Activity Logs | 🟡 Partial | HIGH |
| Bot Monitor | 🟡 Partial | HIGH |
| Real-time Updates | ⚪ Not Started | MEDIUM |
| Dashboard Metrics | ⚪ Not Started | HIGH |

### Phase 3: User & Content 🚀
| Feature | Status | Priority |
|---------|--------|----------|
| Conversation Logs | ⚪ Placeholder | MEDIUM |
| Fraud Detection | ⚪ Placeholder | MEDIUM |
| User Management | 🟡 Partial | HIGH |
| Subscription Mgmt | ⚪ Placeholder | HIGH |

### Phase 4: Revenue & Analytics 💰
| Feature | Status | Priority |
|---------|--------|----------|
| MRR/ARR/LTV/Churn | ⚪ Placeholder | HIGH |
| Query Cost Tracking | ⚪ Placeholder | MEDIUM |
| Payment Dashboard | 🟡 Partial | HIGH |
| Revenue Forecasting | ⚪ Planned | MEDIUM |

### Phase 5: Control Systems 🎛️
| Feature | Status | Priority |
|---------|--------|----------|
| Feature Flags | ⚪ Placeholder | MEDIUM |
| Email Broadcast | ⚪ Placeholder | HIGH |
| Bot Commands | ⚪ Placeholder | MEDIUM |
| API Key Manager | ⚪ Placeholder | HIGH |

### Phase 6: Enterprise Polish ✨
| Feature | Status | Priority |
|---------|--------|----------|
| Dark Mode (full) | 🟡 Partial | LOW |
| System Status | ⚪ Placeholder | MEDIUM |
| Advanced Analytics | ⚪ Planned | MEDIUM |
| Performance Monitoring | ⚪ Planned | LOW |

---

## 🔐 RBAC Role Hierarchy

```
Super Admin (All Features)
├── User Management
├── Subscriptions & Payments
├── Analytics & Reports
├── Activity Logs
├── Feature Flags
├── Bot Settings
├── API Keys
└── All Broadcasts

Admin (Most Features)
├── User Management
├── Subscriptions & Payments
├── Analytics
├── Activity Logs
├── Bot Settings
├── API Keys
└── Broadcast Management

Support (Limited)
├── View Users
├── View Conversations
└── View Analytics

Finance (Revenue Focus)
├── View Subscriptions
├── Manage Payments
└── View Analytics
```

---

## 📁 Project Structure

```
dashboard/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                [Main Dashboard]
│   │   ├── users/page.tsx          [User Directory]
│   │   ├── subscriptions/page.tsx   [Subscriptions]
│   │   ├── analytics/page.tsx       [Analytics]
│   │   ├── conversations/page.tsx   [AI Conversations]
│   │   ├── logs/page.tsx            [Activity Audit Trail] ⭐
│   │   ├── fraud/page.tsx           [Fraud Alerts]
│   │   ├── payments/page.tsx        [Revenue Dashboard]
│   │   ├── broadcast/page.tsx       [Email Campaigns]
│   │   ├── feature-flags/page.tsx   [Feature Control]
│   │   ├── bot-monitor/page.tsx     [Bot Health] ⭐
│   │   ├── api-keys/page.tsx        [API Management]
│   │   ├── commands/page.tsx        [Bot Commands]
│   │   └── settings/page.tsx        [Admin Settings]
│   ├── api/
│   │   └── auth/route.ts
│   ├── layout.tsx
│   └── middleware.ts
├── components/
│   └── layout/
│       ├── Sidebar.tsx              [Role-based Navigation]
│       └── Header.tsx               [Top Bar]
├── lib/
│   └── rbac.ts                      [Role-Permission System]
├── store/
│   ├── authStore.ts                 [Auth State]
│   └── uiStore.ts                   [UI State]
├── types/
│   └── index.ts                     [TypeScript Definitions]
└── IMPLEMENTATION_GUIDE.md         [This document]
```

---

## 🎨 UI/UX Highlights

### 1. **Role-Based Sidebar**
- Dynamic menu based on user role
- Active page highlighting
- Collapsible on mobile
- Dark mode support

### 2. **Header Navigation**
- User profile dropdown
- Notification system
- Theme toggle (🌙/☀️)
- Connection status indicator

### 3. **Responsive Design**
- Mobile: Collapsible sidebar
- Tablet: 2-column layouts
- Desktop: Full 4-column grids
- Touch-friendly buttons

### 4. **Dark Mode**
- System preference detection
- Manual toggle in header
- Persistent preference storage
- All colors optimized

---

## 🔄 Data Flow

```
┌─────────────────────────────────────────────────────────┐
│ User Browser                                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Login Page] → Authenticate → [Dashboard]             │
│                                    ↓                     │
│         ┌────────────────────────────────────────┐     │
│         │ Sidebar (Role-based Menu)              │     │
│         │ ↓                                      │     │
│         │ [Page: Users/Logs/Analytics/etc]      │     │
│         │ ↓                                      │     │
│         │ Zustand Store (Auth + UI State)       │     │
│         │ ↓                                      │     │
│         │ API Calls (Axios)                     │     │
│         └────────────────────────────────────────┘     │
│                    ↓                                     │
├─────────────────────────────────────────────────────────┤
│ Backend Node.js Server (Railway)                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Express Routes]                                      │
│      ↓                                                   │
│  POST /api/auth/login                                  │
│  GET /api/users                                        │
│  GET /api/analytics                                    │
│  GET /api/logs (Activity)                              │
│  GET /api/conversations                                │
│  GET /api/fraud                                        │
│  etc...                                                │
│      ↓                                                   │
│  [MongoDB Database]                                    │
│      ↓                                                   │
│  users, subscriptions, payments, queries,              │
│  admin_logs, conversations, feature_flags              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📱 Key Pages Implemented

### ✅ Login Page
- Email/password input
- Demo credentials display
- Error handling
- Responsive design

### ✅ Main Dashboard
- Key metrics cards (users, revenue, queries)
- Revenue & user growth charts
- Recent activity timeline
- Real-time status indicator

### ✅ Activity Logs
- Full audit trail of admin actions
- Filter by action type
- Date range selector
- Color-coded action badges
- Export functionality

### ✅ Bot Monitor
- System health status (CPU, Memory, Response Time, Errors)
- Real-time performance charts
- Error logs with timestamps
- Status indicators (Healthy/Degraded/Down)

### 🟡 Other Pages (Placeholder Ready)
- Users, Subscriptions, Analytics
- Conversations, Fraud Detection, Payments
- Broadcast, Feature-Flags, API Keys
- Bot Commands, Settings

---

## 🚀 Quick Start

```bash
# Install dependencies
cd dashboard
npm install

# Run development server
npm run dev

# Open in browser
http://localhost:3000/login

# Demo Credentials
Email: admin@queclaw.com
Password: demo123
```

---

## 🔧 Backend Integration Checklist

**What you need to implement in Node.js backend:**

### 1. Database Models
- [ ] AdminLog (activity tracking)
- [ ] ConversationLog (AI chats)
- [ ] FeatureFlag (feature control)
- [ ] APIKey (developer access)
- [ ] BotCommand (command management)
- [ ] FraudAlert (suspicious users)
- [ ] BroadcastMessage (campaigns)

### 2. API Routes
- [ ] GET /api/logs - Activity logs
- [ ] POST /api/logs - Create log entry
- [ ] GET /api/conversations - Chat history
- [ ] GET /api/fraud - Fraud alerts
- [ ] GET /api/feature-flags - All flags
- [ ] POST /api/feature-flags/:id - Update flag
- [ ] GET /api/api-keys - List keys
- [ ] POST /api/broadcast - Send email
- [ ] GET /api/analytics/dashboard - Main metrics

### 3. Middleware Enhancements
- [ ] Activity logging middleware (logs all admin actions)
- [ ] RBAC middleware for routes
- [ ] Request validation

### 4. Real-time (Socket.io)
- [ ] Setup Socket.io server
- [ ] Emit events: new_user, payment_received, error_spike
- [ ] Dashboard listens and updates in real-time

---

## 📊 Metrics Explained

### Dashboard Cards
- **Total Users**: Sum of all bot users
- **Active Subscriptions**: Users with active paid plans
- **Monthly Revenue**: MRR from all subscribers
- **AI Queries Today**: Today's total queries

### Bot Monitor
- **CPU/Memory**: Server resource usage
- **Response Time**: Average AI response latency (target: <500ms)
- **Error Rate**: Percentage of failed queries

### Revenue (Future)
- **MRR**: Monthly Recurring Revenue
- **ARR**: Annual Recurring Revenue
- **LTV**: Lifetime Value (average customer revenue)
- **Churn Rate**: % of subscribers who cancel

---

## 🎓 Learning Path

If new to this codebase:

1. **Understand RBAC** → Read `lib/rbac.ts`
2. **Explore State** → Check `store/authStore.ts` & `store/uiStore.ts`
3. **Navigation** → Study `components/layout/Sidebar.tsx`
4. **Types** → Review `types/index.ts` for data structures
5. **Pages** → Build a new page following existing patterns

---

## 💡 Pro Tips

### Adding a New Feature Page
1. Create folder: `app/(dashboard)/feature-name/`
2. Create `page.tsx` with boilerplate
3. Add to `ACCESSIBLE_ROUTES` in `rbac.ts`
4. Add navigation item to `Sidebar.tsx`
5. Connect backend API

### Debugging RBAC Issues
```typescript
// In component
import { hasPermission } from '@/lib/rbac';
const canAccess = hasPermission(user.role, 'view_users');
console.log('Permission:', canAccess);
```

### Styling Tips
```tsx
// Dark mode example
<div className="bg-white dark:bg-gray-800 
                text-gray-900 dark:text-white">
  Content
</div>
```

---

## 📞 Support Resources

- **Next.js Docs:** https://nextjs.org/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Chart.js:** https://www.chartjs.org/docs/latest/
- **Socket.io:** https://socket.io/docs/

---

**Status:** Ready for Phase 2 Backend Integration 🚀

Last Updated: March 8, 2026
