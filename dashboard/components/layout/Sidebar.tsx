/**
 * Sidebar Navigation Component
 * Role-based menu items
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { hasPermission } from '@/lib/rbac';
import clsx from 'clsx';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  requiredPermission?: string;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: '📊',
  },
  {
    label: 'Users',
    href: '/users',
    icon: '👥',
    requiredPermission: 'view_users',
  },
  {
    label: 'Subscriptions',
    href: '/subscriptions',
    icon: '💳',
    requiredPermission: 'view_subscriptions',
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: '📈',
    requiredPermission: 'view_analytics',
  },
  {
    label: 'Conversations',
    href: '/conversations',
    icon: '💬',
    requiredPermission: 'view_conversations',
  },
  {
    label: 'Activity Logs',
    href: '/logs',
    icon: '📝',
    requiredPermission: 'view_logs',
  },
  {
    label: 'Bot Monitor',
    href: '/bot-monitor',
    icon: '🤖',
    requiredPermission: 'manage_bot_settings',
  },
  {
    label: 'Fraud Detection',
    href: '/fraud',
    icon: '⚠️',
    requiredPermission: 'view_fraud',
  },
  {
    label: 'Payments',
    href: '/payments',
    icon: '💰',
    requiredPermission: 'view_payments',
  },
  {
    label: 'Broadcast',
    href: '/broadcast',
    icon: '📢',
    requiredPermission: 'manage_broadcast',
  },
  {
    label: 'Feature Flags',
    href: '/feature-flags',
    icon: '🚩',
    requiredPermission: 'manage_feature_flags',
  },
  {
    label: 'API Keys',
    href: '/api-keys',
    icon: '🔑',
    requiredPermission: 'manage_api_keys',
  },
  {
    label: 'Bot Commands',
    href: '/commands',
    icon: '⚙️',
    requiredPermission: 'manage_bot_settings',
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: '⚙️',
    requiredPermission: 'manage_analytics',
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  if (!user) return null;

  // Filter items based on user permissions
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.requiredPermission) return true;
    return hasPermission(user.role, item.requiredPermission as any);
  });

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800',
          'border-r border-gray-200 dark:border-gray-700',
          'transform transition-transform duration-300 ease-in-out z-30',
          'lg:relative lg:transform-none',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo Area */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🔮</span>
            <span className="font-bold text-lg">QueClaw</span>
          </div>
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            ✕
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {user.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {user.role.replace('_', ' ').toUpperCase()}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center space-x-3 px-4 py-2.5 rounded-lg',
                  'transition-colors duration-200',
                  isActive
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto text-xs bg-red-500 text-white px-2 py-1 rounded">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <Link
            href="/settings"
            className="flex items-center space-x-3 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <span>⚙️</span>
            <span>Settings</span>
          </Link>
          <button
            onClick={() => useAuthStore.getState().logout()}
            className="w-full flex items-center space-x-3 px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
