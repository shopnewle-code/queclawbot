import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const { user, logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Users', path: '/users', icon: '👥' },
    { name: 'Subscriptions', path: '/subscriptions', icon: '💎' },
    { name: 'Analytics', path: '/analytics', icon: '📈' },
    { name: 'Settings', path: '/settings', icon: '⚙️' },
  ];

  const isActive = (path: string) => router.pathname === path;

  return (
    <div className="flex h-screen bg-light">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-dark text-white transition-all duration-300 shadow-lg`}
      >
        {/* Logo */}
        <div className="p-6 text-center border-b border-gray-700">
          <h1 className={`${!sidebarOpen && 'text-lg'} font-bold gradient-text`}>
            {sidebarOpen ? '🤖 QueClaw' : 'QC'}
          </h1>
        </div>

        {/* Menu */}
        <nav className="mt-6 space-y-2 px-3">
          {menuItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <a
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  isActive(item.path)
                    ? 'bg-primary text-white'
                    : 'hover:bg-gray-800 text-gray-300'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {sidebarOpen && <span>{item.name}</span>}
              </a>
            </Link>
          ))}
        </nav>

        {/* Sidebar Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute bottom-6 left-0 right-0 mx-auto p-2 hover:bg-gray-800 rounded-lg transition-all"
        >
          <span className="text-xl">{sidebarOpen ? '◀' : '▶'}</span>
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-dark">QueClaw Admin Dashboard</h2>
            <p className="text-gray-600 text-sm">Manage your AI Bot SaaS</p>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <div className="text-right">
                  <p className="font-semibold text-dark">{user.name}</p>
                  <p className="text-gray-600 text-sm">{user.email}</p>
                </div>
                <button
                  onClick={() => logout()}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
