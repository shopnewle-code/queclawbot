# QueClaw Admin Dashboard

A professional, feature-rich SaaS admin dashboard for managing the QueClaw AI Bot business.

## 🚀 Features

### Dashboard
- **Real-time Analytics**: View key metrics at a glance
- **Usage Trends**: Track AI query usage over time
- **Revenue Charts**: Monitor business growth
- **Quick Actions**: One-click access to common tasks

### User Management
- **User Directory**: Browse all registered bot users
- **Search & Filter**: Find users quickly by username or name
- **User Stats**: View individual usage and subscription status
- **User Details**: Deep dive into user behavior and history

### Subscription Management
- **Subscription Tracking**: Monitor all active subscriptions
- **Revenue Dashboard**: Real-time revenue metrics
- **Plan Management**: Create and manage subscription plans
- **Automatic Billing**: Integration with PayPal for recurring payments

### Advanced Analytics
- **Usage Analytics**: Query patterns and trends
- **Revenue Analytics**: Income tracking and forecasting
- **Top Users**: Identify your most engaged users
- **Custom Reports**: Generate insights with date ranges

### Settings & Configuration
- **Bot Settings**: Configure bot behavior
- **Webhook Settings**: Manage PayPal webhooks
- **Email Templates**: Customize user communications
- **API Keys**: Manage admin API access

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 + React 18
- **Styling**: Tailwind CSS
- **Authentication**: Next-Auth (ready to integrate)
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Charts**: Chart.js & react-chartjs-2
- **Notifications**: React Hot Toast

## 📦 Installation

### 1. Install Dependencies
```bash
cd dashboard
npm install
```

### 2. Environment Setup
Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_BOT_URL=https://t.me/queclaw_bot
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm run start
```

## 📁 Project Structure

```
dashboard/
├── pages/
│   ├── _app.tsx           # Next.js app config
│   ├── index.tsx          # Home/redirect page
│   ├── login.tsx          # Authentication
│   ├── dashboard.tsx      # Main dashboard
│   ├── users.tsx          # User management
│   ├── subscriptions.tsx   # Subscription tracking
│   ├── analytics.tsx      # Advanced analytics
│   └── settings.tsx       # Admin settings
├── components/
│   ├── Layout.tsx         # Main layout wrapper
│   ├── StatsCard.tsx      # Metric cards
│   └── [other components]
├── lib/
│   ├── api.ts            # API client & endpoints
│   └── types.ts          # TypeScript types
├── hooks/
│   └── index.ts          # Custom React hooks
├── styles/
│   └── globals.css       # Global styles
├── public/               # Static assets
└── [config files]
```

## 🔐 Authentication

The dashboard includes authentication hooks ready for integration:

```tsx
import { useAuth } from '../hooks';

function MyComponent() {
  const { user, logout, login } = useAuth();
  
  return (
    <div>
      {user && <p>Welcome, {user.name}!</p>}
    </div>
  );
}
```

## 📊 API Integration

All API calls go through the centralized client:

```tsx
import { api } from '../lib/api';

// Get dashboard stats
const response = await api.analytics.getDashboard();

// Get users list
const users = await api.users.list();

// Update settings
await api.settings.update(newSettings);
```

## 🎨 Customization

### Colors
Modify `tailwind.config.js` to change the color scheme:

```js
colors: {
  primary: '#6366f1',    // Indigo
  secondary: '#8b5cf6',  // Purple
  accent: '#ec4899',     // Pink
}
```

### Branding
Update the logo and branding in:
- `components/Layout.tsx` - Sidebar branding
- `pages/login.tsx` - Login page branding
- `pages/_app.tsx` - Page title

## 🚀 Deployment

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Other Platforms
- **Docker**: Create a Dockerfile based on Next.js guide
- **AWS**: Use Amplify or EC2
- **Heroku**: Use Heroku buildpack for Node.js
- **Digital Ocean**: Use App Platform

## 📝 Environment Variables

Required variables in `.env.local`:

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3000/api` |
| `NEXT_PUBLIC_BOT_URL` | Telegram bot URL | `https://t.me/queclaw_bot` |

## 🔧 API Endpoints Expected

The dashboard expects these API endpoints to be implemented:

```
GET  /api/analytics/dashboard    - Dashboard stats
GET  /api/analytics/usage        - Usage trends
GET  /api/analytics/revenue      - Revenue trends
GET  /api/analytics/top-users    - Top users
GET  /api/users                  - List all users
GET  /api/users/:id             - Get user details
GET  /api/subscriptions         - List subscriptions
GET  /api/subscriptions/stats   - Subscription stats
GET  /api/auth/profile          - Get current user
POST /api/auth/login            - Login
POST /api/auth/register         - Register
```

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 💬 Support

For issues and questions, please open an issue on GitHub.

---

Made with ❤️ for QueClaw AI Bot
