import React from 'react';
import Layout from '../components/Layout';
import { useData } from '../hooks';
import { api } from '../lib/api';
import { Subscription } from '../lib/types';

export default function Subscriptions() {
  const { data: subscriptions, loading } = useData<Subscription[]>(
    () => api.subscriptions.list()
  );

  const stats = subscriptions && {
    total: subscriptions.length,
    active: subscriptions.filter((s) => s.status === 'active').length,
    totalRevenue: subscriptions
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => sum + s.amount, 0),
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-dark">Subscriptions</h1>
          <p className="text-gray-600 mt-2">Manage user subscriptions and billing</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <p className="text-gray-600 text-sm">Total Subscriptions</p>
              <p className="text-3xl font-bold text-primary mt-2">{stats.total}</p>
            </div>
            <div className="card">
              <p className="text-gray-600 text-sm">Active Now</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.active}</p>
            </div>
            <div className="card">
              <p className="text-gray-600 text-sm">Monthly Revenue</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">${stats.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* Subscriptions Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-dark">User ID</th>
                  <th className="text-left py-4 px-6 font-semibold text-dark">Plan</th>
                  <th className="text-left py-4 px-6 font-semibold text-dark">Amount</th>
                  <th className="text-left py-4 px-6 font-semibold text-dark">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-dark">Start Date</th>
                  <th className="text-left py-4 px-6 font-semibold text-dark">End Date</th>
                  <th className="text-left py-4 px-6 font-semibold text-dark">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions?.map((sub) => (
                  <tr key={sub.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6 text-sm text-gray-600">{sub.userId}</td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 bg-purple-100 text-purple-900 rounded-full text-sm font-semibold">
                        💎 {sub.planId}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-dark">${sub.amount.toFixed(2)}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          sub.status === 'active'
                            ? 'bg-green-100 text-green-900'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {sub.status === 'active' ? '✅ Active' : '❌ ' + sub.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {new Date(sub.startDate).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {sub.endDate ? new Date(sub.endDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <button className="text-primary hover:text-secondary font-semibold">
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
