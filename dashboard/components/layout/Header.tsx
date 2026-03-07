/**
 * Header Component
 * Top navigation with user menu, notifications, theme toggle
 */

'use client';

import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

export default function Header() {
  const { user } = useAuthStore();
  const { darkMode, toggleDarkMode, toggleSidebar, isConnected } = useUIStore();

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 flex items-center justify-between">
      {/* Left: Menu Toggle */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
      >
        <span className="text-xl">☰</span>
      </button>

      {/* Middle: Status */}
      <div className="flex-1 flex items-center justify-center space-x-2">
        <div
          className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {isConnected ? 'Live' : 'Offline'}
        </span>
      </div>

      {/* Right: User Menu & Controls */}
      <div className="flex items-center space-x-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title={darkMode ? 'Light mode' : 'Dark mode'}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>

        {/* Notifications */}
        <button className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <span className="text-xl">🔔</span>
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User Avatar */}
        <div className="flex items-center space-x-3 pl-4 border-l border-gray-200 dark:border-gray-700">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {user?.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {user?.role.replace('_', ' ').toUpperCase()}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
