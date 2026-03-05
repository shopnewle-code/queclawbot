import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useData } from '../hooks';
import { api } from '../lib/api';

export default function Settings() {
  const { data: settings, refetch } = useData(() => api.settings.get());
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('bot');

  const tabs = [
    { id: 'bot', name: '🤖 Bot Settings', icon: '⚙️' },
    { id: 'webhook', name: '🪝 Webhooks', icon: '🔗' },
    { id: 'email', name: '📧 Email', icon: '📬' },
    { id: 'api', name: '🔑 API Keys', icon: '🔐' },
  ];

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.settings.update(settings);
      refetch();
    } catch (error) {
      console.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-dark">Settings</h1>
          <p className="text-gray-600 mt-2">Manage bot configuration and integrations</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-4 font-semibold border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-600 hover:text-dark'
              }`}
            >
              {tab.icon} {tab.name}
            </button>
          ))}
        </div>

        {/* Bot Settings Tab */}
        {activeTab === 'bot' && (
          <div className="card space-y-4">
            <h3 className="text-xl font-bold text-dark">Bot Configuration</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">
                  Bot Name
                </label>
                <input
                  type="text"
                  defaultValue="QueClaw AI"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark mb-2">
                  Bot Description
                </label>
                <textarea
                  defaultValue="Your personal AI assistant"
                  rows={4}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">
                    Free Plan Queries/Month
                  </label>
                  <input
                    type="number"
                    defaultValue={5}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">
                    Pro Plan Price ($)
                  </label>
                  <input
                    type="number"
                    defaultValue={4.99}
                    step="0.01"
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-3">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="font-semibold text-dark">Bot Enabled</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Webhook Settings Tab */}
        {activeTab === 'webhook' && (
          <div className="card space-y-4">
            <h3 className="text-xl font-bold text-dark">Webhook Configuration</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">
                  PayPal Webhook ID
                </label>
                <input
                  type="text"
                  placeholder="WH-XXXXXXXXXXXX"
                  defaultValue={settings?.paypalWebhookId || ''}
                  className="input-field"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Configure this in your PayPal dashboard
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark mb-2">
                  Webhook Events
                </label>
                <div className="space-y-2">
                  {['BILLING.SUBSCRIPTION.CREATED', 'BILLING.SUBSCRIPTION.UPDATED', 'BILLING.SUBSCRIPTION.CANCELLED'].map(
                    (event) => (
                      <label key={event} className="flex items-center space-x-3">
                        <input type="checkbox" defaultChecked className="w-4 h-4" />
                        <span className="text-sm text-dark">{event}</span>
                      </label>
                    )
                  )}
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-blue-900">📝 Webhook URL</p>
                <p className="text-xs text-blue-800 mt-2 font-mono">
                  {process.env.NEXT_PUBLIC_API_URL}/webhook/paypal
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Email Settings Tab */}
        {activeTab === 'email' && (
          <div className="card space-y-4">
            <h3 className="text-xl font-bold text-dark">Email Configuration</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">
                  From Email
                </label>
                <input
                  type="email"
                  defaultValue="noreply@queclaw.com"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark mb-2">
                  From Name
                </label>
                <input
                  type="text"
                  defaultValue="QueClaw AI"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark mb-2">
                  Email Template
                </label>
                <select className="input-field">
                  <option>Welcome Email</option>
                  <option>Subscription Confirmation</option>
                  <option>Reminder Email</option>
                  <option>Cancellation Email</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark mb-2">
                  Preview
                </label>
                <div className="p-4 bg-gray-100 rounded-lg border border-gray-300 font-mono text-sm h-32 overflow-auto">
                  Welcome to QueClaw AI! 🤖
                  <br />
                  <br />
                  Your account is ready to use.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* API Keys Tab */}
        {activeTab === 'api' && (
          <div className="card space-y-4">
            <h3 className="text-xl font-bold text-dark">API Keys & Access</h3>

            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-semibold text-yellow-900">⚠️ Security Notice</p>
                <p className="text-xs text-yellow-800 mt-2">
                  Never share API keys publicly. Rotate them regularly for security.
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-dark mb-3">Your API Keys:</p>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-100 rounded-lg flex justify-between items-center">
                    <code className="text-xs font-mono text-gray-700">sk_test_xxxxxxxxxxxxxxxxxx</code>
                    <button className="text-primary hover:text-secondary text-sm font-semibold">
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              <button className="btn-secondary">Generate New Key</button>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end space-x-4">
          <button className="btn-secondary">Cancel</button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Layout>
  );
}
