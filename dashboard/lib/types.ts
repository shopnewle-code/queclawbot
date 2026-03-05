export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface BotUser {
  id: string;
  telegramId: string;
  username: string;
  firstName: string;
  lastName: string;
  plan: 'free' | 'pro';
  aiUsage: number;
  subscriptionActive: boolean;
  subscriptionExpire?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'inactive' | 'cancelled';
  startDate: string;
  endDate?: string;
  amount: number;
  paymentMethod: 'paypal' | 'card';
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  queries: number | 'unlimited';
  features: string[];
}

export interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  monthlyRevenue: number;
  activeToday: number;
  churnRate: number;
}

export interface Usage {
  date: string;
  count: number;
}

export interface Revenue {
  date: string;
  amount: number;
}

export interface TopUser {
  id: string;
  username: string;
  queries: number;
  subscriptionStatus: 'active' | 'inactive';
}
