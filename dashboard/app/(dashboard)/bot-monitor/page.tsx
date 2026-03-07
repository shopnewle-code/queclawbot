/**
 * Bot Monitor Page
 * Real-time AI bot health and metrics
 */

'use client';

import { useAuthStore } from '@/store/authStore';

export default function BotMonitorPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Bot Monitor
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Real-time AI bot health and performance metrics
        </p>
      </div>

      {/* Health Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'CPU Usage', value: '45%', status: 'healthy' },
          { label: 'Memory', value: '62%', status: 'healthy' },
          { label: 'Response Time', value: '287ms', status: 'degraded' },
          { label: 'Error Rate', value: '0.3%', status: 'healthy' },
        ].map((metric, idx) => {
          const statusColors = {
            healthy:
              'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20',
            degraded:
              'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20',
            down: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20',
          };

          return (
            <div
              key={idx}
              className={`rounded-lg p-6 border-2 ${statusColors[metric.status as keyof typeof statusColors]}`}
            >
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {metric.label}
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {metric.value}
              </p>
              <p className="mt-2 text-xs font-semibold uppercase">
                {metric.status === 'healthy' && (
                  <span className="text-green-600 dark:text-green-400">✓ Healthy</span>
                )}
                {metric.status === 'degraded' && (
                  <span className="text-yellow-600 dark:text-yellow-400">
                    ⚠ Degraded
                  </span>
                )}
              </p>
            </div>
          );
        })}
      </div>

      {/* API Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Requests Per Minute
          </h2>
          <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center text-gray-500">
            📊 Real-time chart
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Response Distribution
          </h2>
          <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center text-gray-500">
            📊 Chart
          </div>
        </div>
      </div>

      {/* Recent Errors */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Errors
        </h2>
        <div className="space-y-3">
          {[
            { error: 'Timeout error', count: 23, time: '10 mins ago' },
            { error: 'Rate limit exceeded', count: 5, time: '1 hour ago' },
            { error: 'Invalid query', count: 2, time: '2 hours ago' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800"
            >
              <div>
                <p className="font-medium text-red-900 dark:text-red-100">
                  {item.error}
                </p>
                <p className="text-sm text-red-700 dark:text-red-200">
                  {item.count} occurrences
                </p>
              </div>
              <span className="text-xs text-red-600 dark:text-red-400">
                {item.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
