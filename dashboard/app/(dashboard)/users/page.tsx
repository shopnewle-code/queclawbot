/**
 * Users Page
 * User management and directory
 */

'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/lib/rbac';

export default function UsersPage() {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');

  if (!user || !hasPermission(user.role, 'view_users')) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">
          You don't have permission to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Users
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Manage bot users and subscriptions
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Queries
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      John Doe
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      @john_doe
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    PRO
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                  1,234
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                  Jan 15, 2026
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400">
                    View
                  </button>
                  <button className="text-red-600 hover:text-red-900 dark:text-red-400">
                    Ban
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
