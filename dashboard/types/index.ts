/**
 * QueClaw Dashboard Types & Interfaces
 * Core type definitions for roles, permissions, and data models
 */

// ============ USER & AUTH ============
export type UserRole = 'super_admin' | 'admin' | 'support' | 'finance';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface AuthSession {
  user: User;
  token: string;
}

// ============ PERMISSIONS ============
export type Permission =
  | 'view_users'
  | 'manage_users'
  | 'view_subscriptions'
  | 'manage_subscriptions'
  | 'view_payments'
  | 'manage_payments'
  | 'view_analytics'
  | 'manage_analytics'
  | 'view_logs'
  | 'manage_logs'
  | 'manage_feature_flags'
  | 'manage_bot_settings'
  | 'manage_broadcast'
  | 'view_fraud'
  | 'manage_fraud'
  | 'manage_api_keys'
  | 'view_conversations'
  | 'view_system_status';

export type RolePermissions = Record<UserRole, Permission[]>;

// ============ BOT USERS ============
export interface BotUser {
  id: string;
  telegram_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  plan: 'FREE' | 'PRO' | 'PREMIUM';
  subscriptionActive: boolean;
  subscriptionExpire?: Date;
  totalQueries: number;
  dailyQueries: number;
  totalSpent: number;
  joinedAt: Date;
  lastActiveAt?: Date;
}

// ============ ACTIVITY LOG ============
export type AdminActionType =
  | 'user_deleted'
  | 'user_banned'
  | 'subscription_changed'
  | 'payment_refunded'
  | 'broadcast_sent'
  | 'feature_flag_updated'
  | 'bot_command_updated'
  | 'api_key_created'
  | 'api_key_revoked';

export interface ActivityLog {
  id: string;
  admin_id: string;
  adminName: string;
  action: AdminActionType;
  target_user?: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

// ============ CONVERSATION ============
export interface ConversationMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  message: string;
  tokens_used: number;
  created_at: Date;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  messages: ConversationMessage[];
  totalTokens: number;
  created_at: Date;
  updated_at: Date;
}

// ============ FEATURE FLAG ============
export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number; // 0-100
  targetRoles?: UserRole[];
  updated_at: Date;
  updated_by: string;
}

// ============ API KEY ============
export interface APIKey {
  id: string;
  user_id: string;
  name: string;
  key: string; // Hashed in DB
  keyPreview: string; // Last 4 chars
  permissions: Permission[];
  usage: {
    total_requests: number;
    last_used?: Date;
  };
  created_at: Date;
  expires_at?: Date;
  revoked: boolean;
}

// ============ BOT COMMAND ============
export interface BotCommand {
  id: string;
  command: string;
  description: string;
  enabled: boolean;
  response: string;
  category: 'help' | 'billing' | 'general' | 'premium';
  updated_at: Date;
  updated_by: string;
}

// ============ FRAUD DETECTION ============
export type FraudRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface FraudAlert {
  id: string;
  user_id: string;
  risk_level: FraudRiskLevel;
  reason: string;
  metrics: {
    queries_per_hour?: number;
    api_calls_per_minute?: number;
    unusual_geography?: boolean;
    rapid_subscription_changes?: boolean;
  };
  status: 'open' | 'investigated' | 'resolved';
  created_at: Date;
  reviewed_by?: string;
  reviewed_at?: Date;
  notes?: string;
}

// ============ ANALYTICS ============
export interface DashboardMetrics {
  totalUsers: number;
  activeSubscriptions: number;
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  churnRate: number;
  ltv: number; // Lifetime Value
  avgResponseTime: number; // AI response time in ms
  totalQueries: number;
  failedQueries: number;
  avgTokensPerQuery: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  timestamp?: Date;
}

export interface RevenueMetrics {
  mrr: number;
  arr: number;
  newSubscribers: number;
  canceledSubscribers: number;
  totalRevenue: number;
  avgRevenuePerUser: number;
}

// ============ EMAIL BROADCAST ============
export interface BroadcastMessage {
  id: string;
  subject: string;
  content: string;
  recipients: 'all' | 'free' | 'pro' | 'premium'; // or specific user IDs
  scheduled_at?: Date;
  sent_at?: Date;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  opened_count: number;
  click_count: number;
  created_by: string;
  created_at: Date;
}

// ============ SYSTEM STATUS ============
export type HealthStatus = 'healthy' | 'degraded' | 'down';

export interface SystemComponent {
  name: string;
  status: HealthStatus;
  uptime: number; // percentage
  lastChecked: Date;
  details?: string;
}

export interface SystemStatus {
  overall: HealthStatus;
  components: {
    ai_server: SystemComponent;
    telegram_api: SystemComponent;
    payment_gateway: SystemComponent;
    database: SystemComponent;
    cache: SystemComponent;
  };
  lastIncident?: {
    component: string;
    duration: number; // minutes
    resolved: boolean;
  };
}

// ============ PAYMENT ============
export interface PaymentMetrics {
  totalMRR: number;
  totalARR: number;
  newMRR: number;
  churnMRR: number;
  churnRate: number;
  ltv: number;
  cac: number; // Customer Acquisition Cost
  paybackPeriod: number; // days
}

export interface QueryCostAnalysis {
  user_id: string;
  username: string;
  totalQueries: number;
  totalTokens: number;
  estimatedCost: number;
  queriesPerDay: number;
  costPerDay: number;
  totalSpent: number;
}
