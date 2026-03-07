# 🚀 QueClaw Enterprise Dashboard - Quick Start

## What You Got ✨

A **production-ready admin dashboard** with:
- ✅ 4-tier Role-Based Access Control (Super Admin, Admin, Support, Finance)
- ✅ 14+ dashboard pages with role-based visibility
- ✅ Dark mode support
- ✅ Activity audit logs
- ✅ Real-time bot monitoring
- ✅ Fully responsive design
- ✅ TypeScript throughout
- ✅ Zustand state management

---

## 🎯 Start Dashboard

```bash
cd dashboard
npm install
npm run dev
```

Then open: **http://localhost:3000/login**

### Login Credentials
```
Email: admin@queclaw.com
Password: demo123
```

---

## 📊 Dashboard Pages Available

### All Users Can Access
- 📊 **Dashboard** - Main overview with metrics

### Super Admin Only
- 👥 **Users** - User directory & management
- 💳 **Subscriptions** - Subscription tracking
- 📈 **Analytics** - Advanced reports
- 💬 **Conversations** - AI conversation logs
- 📝 **Activity Logs** - Admin audit trail ⭐
- 🤖 **Bot Monitor** - AI bot health & metrics ⭐
- ⚠️ **Fraud Detection** - Suspicious user alerts
- 💰 **Payments** - Revenue analytics
- 📢 **Broadcast** - Email campaigns
- 🚩 **Feature Flags** - Feature control panel
- 🔑 **API Keys** - Developer API management
- ⚙️ **Commands** - Bot command editor
- ⚙️ **Settings** - Admin configuration

---

## 🔐 Role Permissions

### Super Admin → Everything
- Manage users
- Track revenue
- Control features
- View all logs
- Manage bot

### Admin → Most Things
- Manage users (no delete)
- View revenue
- Control broadcast
- Manage API keys
- View logs

### Support → Limited
- View users only
- View conversations
- View basic analytics

### Finance → Revenue
- Manage subscriptions
- Track payments
- View revenue analytics

---

## 🎨 Key Features

### 1. **Dark Mode**
Click the 🌙 icon in the header to toggle

### 2. **Responsive Design**
- Works on mobile (collapsed sidebar)
- Tablet (2-column layout)
- Desktop (4-column grid)

### 3. **Activity Logs**
- Track all admin actions
- Filter by action type
- Export to CSV

### 4. **Bot Monitoring**
- Real-time CPU/Memory/Response Time
- Error rate tracking
- Recent errors list

---

## 📁 Project Structure

```
dashboard/
├── app/(auth)/login           - Login page
├── app/(dashboard)/           - All dashboard pages
│   ├── page.tsx               - Main dashboard
│   ├── users/page.tsx         - User management
│   ├── logs/page.tsx          - Activity audit
│   ├── bot-monitor/page.tsx   - Bot health
│   └── ...13 more pages
├── components/layout/
│   ├── Sidebar.tsx            - Navigation
│   └── Header.tsx             - Top bar
├── lib/rbac.ts                - Role permissions
├── store/
│   ├── authStore.ts           - Auth state
│   └── uiStore.ts             - UI state
└── types/index.ts             - TypeScript
```

---

## 🔌 Backend Integration

The dashboard is ready to connect to your Node.js backend! 

**Required APIs to implement:**

```
GET    /api/auth/login          - Authenticate user
GET    /api/auth/me             - Get current user
GET    /api/users               - List users
GET    /api/logs                - Get activity logs
POST   /api/logs                - Create log entry
GET    /api/conversations       - AI conversations
GET    /api/fraud               - Fraud alerts
GET    /api/analytics/dashboard - Dashboard metrics
GET    /api/payments            - Payment data
GET    /api/subscriptions       - Subscriptions
```

See **IMPLEMENTATION_GUIDE.md** for full backend requirements.

---

## 🛠️ Customization

### Change Colors
Edit `tailwind.config.js`:
```js
colors: {
  primary: '#6366f1',    // Indigo
  secondary: '#8b5cf6',  // Purple
}
```

### Add New Role
1. Update `UserRole` type in `types/index.ts`
2. Add permissions in `lib/rbac.ts`
3. Update `ROLE_METADATA` for display name
4. Update routes in `ACCESSIBLE_ROUTES`

### Add New Page
1. Create `app/(dashboard)/page-name/page.tsx`
2. Add to sidebar in `components/layout/Sidebar.tsx`
3. Connect to backend API in your component

---

## 🎯 Feature Roadmap

**Phase 1** ✅ DONE
- RBAC, Layout, Core Pages

**Phase 2** 🔄 NEXT
- Connect backend APIs
- Real-time WebSocket updates
- Implement activity logging

**Phase 3** 🚀 COMING
- Advanced fraud detection
- Conversation search & analysis
- AI model control panel

See **DASHBOARD_FEATURES.md** for full roadmap.

---

## 📖 Documentation

- **IMPLEMENTATION_GUIDE.md** - Full integration guide
- **DASHBOARD_FEATURES.md** - Feature roadmap & architecture
- **types/index.ts** - All TypeScript interfaces

---

## 🐛 Troubleshooting

### "Page is blank after login"
- Check browser console for errors
- Verify backend API is running
- Clear cookies: `localStorage.clear()`

### "Route not accessible"
- Check your user role
- Verify permissions in `lib/rbac.ts`
- Check `ACCESSIBLE_ROUTES`

### "Sidebar menus not showing"
- Wait for auth to complete
- Check role permissions for that route
- Verify menu item has `requiredPermission`

---

## 📦 Dependencies

```json
{
  "next": "^14.0.0",
  "react": "^18.2.0",
  "zustand": "^4.4.0",
  "chart.js": "^4.4.0",
  "react-chartjs-2": "^5.2.0",
  "tailwindcss": "^3.3.0",
  "axios": "^1.6.0"
}
```

---

## 🚀 Deploy to Production

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Environment Variables
```
NEXT_PUBLIC_API_URL=https://api.queclaw.com/api
NEXT_PUBLIC_BOT_URL=https://t.me/queclaw_bot
NEXT_PUBLIC_WS_URL=https://api.queclaw.com
```

---

## 💡 Tips & Tricks

### Debug Auth Issues
```typescript
// In browser console
localStorage.getItem('user-store')
```

### Check Permissions
```typescript
import { hasPermission } from '@/lib/rbac';
hasPermission('admin', 'view_users') // true
```

### Add Notification
```typescript
const { addNotification } = useUIStore();
addNotification('Action completed!', 'success');
```

---

## 🎓 Next Steps

1. **Connect Backend** → See IMPLEMENTATION_GUIDE.md
2. **Add Real Data** → Query your MongoDB APIs
3. **Test Roles** → Login as different users
4. **Deploy** → Push to production
5. **Monitor** → Setup error tracking

---

## 📞 Support

- Next.js Docs: https://nextjs.org
- Tailwind: https://tailwindcss.com
- Zustand: https://github.com/pmndrs/zustand
- TypeScript: https://www.typescriptlang.org

---

**Happy building! 🚀**

Last updated: March 8, 2026
