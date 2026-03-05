'use client';

import React from 'react';
import Layout from '../components/Layout';
import { useData } from '../hooks';
import { api } from '../lib/api';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Analytics() {
  const { data: usageData } = useData(() => api.analytics.getUsage('90d'));
  const { data: revenueData } = useData(() => api.analytics.getRevenue('90d'));
  const { data: topUsers } = useData(() => api.analytics.getTopUsers(10));

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-dark">Analytics</h1>
          <p className="text-gray-600 mt-2">Detailed performance metrics and insights</p>
        </div>

        {/* Filters */}
        <div className="card flex space-x-4">
          <select className="input-field w-32">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>This year</option>
          </select>
          <button className="btn-secondary">Export Report</button>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Usage Chart */}
          <div className="card">
            <h3 className="text-xl font-bold text-dark mb-4">Query Usage (90 days)</h3>
            {usageData && (
              <Line
                data={{
                  labels: usageData?.data?.map((d: any) => d.date) || [],
                  datasets: [
                    {
                      label: 'Queries',
                      data: usageData?.data?.map((d: any) => d.count) || [],
                      borderColor: '#6366f1',
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      tension: 0.4,
                      fill: true,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: true, position: 'bottom' },
                  },
                  scales: {
                    y: { beginAtZero: true },
                  },
                }}
              />
            )}
          </div>

          {/* Revenue Chart */}
          <div className="card">
            <h3 className="text-xl font-bold text-dark mb-4">Revenue (90 days)</h3>
            {revenueData && (
              <Bar
                data={{
                  labels: revenueData?.data?.map((d: any) => d.date) || [],
                  datasets: [
                    {
                      label: 'Revenue ($)',
                      data: revenueData?.data?.map((d: any) => d.amount) || [],
                      backgroundColor: '#10b981',
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                  },
                  scales: {
                    y: { beginAtZero: true },
                  },
                }}
              />
            )}
          </div>
        </div>

        {/* Top Users */}
        <div className="card">
          <h3 className="text-xl font-bold text-dark mb-4">Top Users</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-dark">Rank</th>
                  <th className="text-left py-4 px-6 font-semibold text-dark">Username</th>
                  <th className="text-left py-4 px-6 font-semibold text-dark">Queries</th>
                  <th className="text-left py-4 px-6 font-semibold text-dark">Subscription</th>
                </tr>
              </thead>
              <tbody>
                {topUsers?.data?.map((user: any, index: number) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6 font-bold text-lg text-primary">#{index + 1}</td>
                    <td className="py-4 px-6">
                      <p className="font-semibold text-dark">@{user.username}</p>
                    </td>
                    <td className="py-4 px-6 font-semibold text-dark">{user.queries}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          user.subscriptionStatus === 'active'
                            ? 'bg-green-100 text-green-900'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {user.subscriptionStatus === 'active' ? '✅ Active' : '❌ Free'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card bg-blue-50 border-2 border-blue-200">
            <p className="text-sm font-semibold text-blue-900">💡 Insight</p>
            <p className="mt-2 text-blue-800">Peak usage at 2 PM - Deploy extra resources then</p>
          </div>
          <div className="card bg-green-50 border-2 border-green-200">
            <p className="text-sm font-semibold text-green-900">⭐ Opportunity</p>
            <p className="mt-2 text-green-800">5 users approaching upgrade - Send targeted offer</p>
          </div>
          <div className="card bg-orange-50 border-2 border-orange-200">
            <p className="text-sm font-semibold text-orange-900">⚠️ Alert</p>
            <p className="mt-2 text-orange-800">3 subscriptions expiring this week - Send reminders</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
