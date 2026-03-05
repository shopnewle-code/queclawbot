import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useData } from '../hooks';
import { api } from '../lib/api';
import { BotUser } from '../lib/types';

export default function Users() {
  const { data: users, loading } = useData<BotUser[]>(
    () => api.users.list()
  );
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users?.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-dark">Users</h1>
            <p className="text-gray-600 mt-2">Manage your bot users and subscriptions</p>
          </div>
          <div className="flex space-x-3">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-dark">User</th>
                  <th className="text-left py-4 px-6 font-semibold text-dark">Telegram ID</th>
                  <th className="text-left py-4 px-6 font-semibold text-dark">Plan</th>
                  <th className="text-left py-4 px-6 font-semibold text-dark">Usage</th>
                  <th className="text-left py-4 px-6 font-semibold text-dark">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-dark">Joined</th>
                  <th className="text-left py-4 px-6 font-semibold text-dark">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers?.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-semibold text-dark">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-gray-600">@{user.username}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">{user.telegramId}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          user.plan === 'pro'
                            ? 'bg-purple-100 text-purple-900'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {user.plan === 'pro' ? '💎 Pro' : '🆓 Free'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {user.aiUsage} queries
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          user.subscriptionActive
                            ? 'bg-green-100 text-green-900'
                            : 'bg-red-100 text-red-900'
                        }`}
                      >
                        {user.subscriptionActive ? '✅ Active' : '❌ Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <button className="text-primary hover:text-secondary font-semibold text-sm">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Stats Summary */}
        {users && (
          <div className="grid grid-cols-3 gap-4">
            <div className="card text-center">
              <p className="text-gray-600 text-sm">Total Users</p>
              <p className="text-3xl font-bold text-primary mt-2">{users.length}</p>
            </div>
            <div className="card text-center">
              <p className="text-gray-600 text-sm">Pro Users</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {users.filter((u) => u.plan === 'pro').length}
              </p>
            </div>
            <div className="card text-center">
              <p className="text-gray-600 text-sm">Active Subscriptions</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {users.filter((u) => u.subscriptionActive).length}
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
