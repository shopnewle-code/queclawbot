'use client';

import React, { useEffect } from 'react';
import Layout from '../components/Layout';
import { useData } from '../hooks';
import { api } from '../lib/api';
import { DashboardStats } from '../lib/types';
import StatsCard from '../components/StatsCard';
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

export default function Dashboard() {
  const { data: stats, loading: statsLoading } = useData<DashboardStats>(
    () => api.analytics.getDashboard()
  );

  const { data: usageData } = useData(
    () => api.analytics.getUsage('30d')
  );

  const { data: revenueData } = useData(
    () => api.analytics.getRevenue('30d')
  );

  if (statsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-dark">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's your bot performance overview.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            change={12}
            icon="👥"
            color="blue"
          />
          <StatsCard
            title="Active Subscriptions"
            value={stats?.activeSubscriptions || 0}
            change={8}
            icon="💎"
            color="purple"
          />
          <StatsCard
            title="Monthly Revenue"
            value={`$${(stats?.monthlyRevenue || 0).toFixed(2)}`}
            change={15}
            icon="💰"
            color="green"
          />
          <StatsCard
            title="Churn Rate"
            value={`${(stats?.churnRate || 0).toFixed(1)}%`}
            change={-5}
            icon="📉"
            color="red"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Usage Chart */}
          <div className="card">
            <h3 className="text-xl font-bold text-dark mb-4">AI Usage Trend</h3>
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

          {/* Revenue Chart */}
          <div className="card">
            <h3 className="text-xl font-bold text-dark mb-4">Revenue Trend</h3>
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

        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-xl font-bold text-dark mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all">
              <div className="text-2xl mb-2">📧</div>
              <p className="font-semibold text-blue-900">Email Users</p>
            </button>
            <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-all">
              <div className="text-2xl mb-2">🎁</div>
              <p className="font-semibold text-green-900">Send Bonus</p>
            </button>
            <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-all">
              <div className="text-2xl mb-2">📊</div>
              <p className="font-semibold text-purple-900">View Reports</p>
            </button>
            <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-all">
              <div className="text-2xl mb-2">🔧</div>
              <p className="font-semibold text-orange-900">Manage Bot</p>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
