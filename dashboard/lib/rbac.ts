/**
 * Role-Based Access Control (RBAC) System
 * Manages roles, permissions, and access control
 */

import { UserRole, Permission, RolePermissions } from '@/types';

// ============ PERMISSIONS MATRIX ============
export const ROLE_PERMISSIONS: RolePermissions = {
  super_admin: [
    // Users
    'view_users',
    'manage_users',
    // Subscriptions & Payments
    'view_subscriptions',
    'manage_subscriptions',
    'view_payments',
    'manage_payments',
    // Analytics
    'view_analytics',
    'manage_analytics',
    // Logs & Monitoring
    'view_logs',
    'manage_logs',
    // Advanced Features
    'manage_feature_flags',
    'manage_bot_settings',
    'manage_broadcast',
    'view_fraud',
    'manage_fraud',
    'manage_api_keys',
    'view_conversations',
    'view_system_status',
  ],
  admin: [
    // Users
    'view_users',
    'manage_users',
    // Subscriptions & Payments
    'view_subscriptions',
    'manage_subscriptions',
    'view_payments',
    'manage_payments',
    // Analytics
    'view_analytics',
    // Logs
    'view_logs',
    // Broadcast & Fraud
    'manage_broadcast',
    'view_fraud',
    'manage_fraud',
    'manage_api_keys',
    'view_conversations',
    'view_system_status',
  ],
  support: [
    // Users
    'view_users',
    // Conversations
    'view_conversations',
    // Limited analytics
    'view_analytics',
  ],
  finance: [
    // Subscriptions & Payments
    'view_subscriptions',
    'manage_subscriptions',
    'view_payments',
    'manage_payments',
    // Analytics (Revenue focused)
    'view_analytics',
    'view_system_status',
  ],
};

// ============ ROLE METADATA ============
export const ROLE_METADATA: Record<
  UserRole,
  { label: string; description: string; color: string }
> = {
  super_admin: {
    label: 'Super Admin',
    description: 'Full system access',
    color: 'red',
  },
  admin: {
    label: 'Admin',
    description: 'Users, subscriptions, and analytics',
    color: 'blue',
  },
  support: {
    label: 'Support',
    description: 'View users and conversations only',
    color: 'green',
  },
  finance: {
    label: 'Finance',
    description: 'Revenue and subscription management',
    color: 'purple',
  },
};

// ============ PERMISSION CHECKS ============

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(
  role: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.some((perm) => hasPermission(role, perm));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(
  role: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.every((perm) => hasPermission(role, perm));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role];
}

/**
 * Get role label
 */
export function getRoleLabel(role: UserRole): string {
  return ROLE_METADATA[role].label;
}

/**
 * Check if user is admin or super admin
 */
export function isAdminRole(role: UserRole): boolean {
  return role === 'admin' || role === 'super_admin';
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(role: UserRole): boolean {
  return role === 'super_admin';
}

// ============ ROUTE PROTECTION ============

/**
 * Routes accessible by each role
 */
export const ACCESSIBLE_ROUTES: Record<UserRole, string[]> = {
  super_admin: [
    '/dashboard',
    '/users',
    '/subscriptions',
    '/analytics',
    '/conversations',
    '/logs',
    '/fraud',
    '/payments',
    '/broadcast',
    '/feature-flags',
    '/bot-monitor',
    '/api-keys',
    '/commands',
    '/settings',
  ],
  admin: [
    '/dashboard',
    '/users',
    '/subscriptions',
    '/analytics',
    '/conversations',
    '/logs',
    '/fraud',
    '/payments',
    '/broadcast',
    '/bot-monitor',
    '/api-keys',
    '/settings',
  ],
  support: ['/dashboard', '/users', '/conversations', '/analytics'],
  finance: ['/dashboard', '/subscriptions', '/payments', '/analytics'],
};

/**
 * Check if a role can access a route
 */
export function canAccessRoute(role: UserRole, route: string): boolean {
  return ACCESSIBLE_ROUTES[role].some((r) => route.startsWith(r));
}
