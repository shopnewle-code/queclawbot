/**
 * Feature Flags Page
 * Control features without deploying
 */

'use client';

export default function FeatureFlagsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Feature Flags
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Control features without deploying code
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="h-96 flex items-center justify-center text-gray-500 dark:text-gray-400">
          🚀 Feature coming soon - Feature flag manager
        </div>
      </div>
    </div>
  );
}
