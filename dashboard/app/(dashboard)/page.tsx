/**
 * Main Dashboard Page
 * Overview with key metrics and charts
 */

'use client';

import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Welcome back, {user.name}! 👋
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: 'Total Users',
            value: '2,543',
            icon: '👥',
            trend: '+12%',
            color: 'blue',
          },
          {
            label: 'Active Subscriptions',
            value: '1,247',
            icon: '💳',
            trend: '+8%',
            color: 'green',
          },
          {
            label: 'Monthly Revenue',
            value: '$45,231',
            icon: '💰',
            trend: '+23%',
            color: 'purple',
          },
          {
            label: 'AI Queries Today',
            value: '128,456',
            icon: '🤖',
            trend: '+45%',
            color: 'orange',
          },
        ].map((metric, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {metric.label}
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  {metric.value}
                </p>
                <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                  {metric.trend} from last month
                </p>
              </div>
              <span className="text-3xl">{metric.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Revenue Trend
          </h2>
          <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center text-gray-500">
            📊 Chart placeholder - Install chart library
          </div>
        </div>

        {/* Users Growth */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            User Growth
          </h2>
          <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center text-gray-500">
            📈 Chart placeholder - Install chart library
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h2>
        <div className="space-y-4">
          {[
            { action: 'New subscription', user: 'John Doe', time: '2 mins ago' },
            { action: 'Payment received', user: 'Jane Smith', time: '15 mins ago' },
            { action: 'User joined', user: 'Bob Wilson', time: '1 hour ago' },
            { action: 'Subscription cancelled', user: 'Alice Brown', time: '3 hours ago' },
          ].map((log, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-0"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {log.action}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {log.user}
                </p>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {log.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
