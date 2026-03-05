import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks';
import Head from 'next/head';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>QueClaw Admin - Login</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-dark to-primary flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-4xl font-bold gradient-text mb-2">🤖 QueClaw</h1>
              <p className="text-gray-600">Admin Dashboard</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@queclaw.com"
                  className="input-field"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field"
                  required
                />
              </div>

              {/* Error */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center space-x-4 text-gray-300">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="text-sm">Or</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            {/* Demo Login */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900 font-semibold mb-2">Demo Credentials:</p>
              <p className="text-sm text-blue-800">Email: admin@demo.com</p>
              <p className="text-sm text-blue-800">Password: demo123</p>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => router.push('/register')}
                className="text-primary font-semibold hover:underline"
              >
                Sign up
              </button>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-8 text-center text-white/70 text-sm">
            <p>🔒 This is a secure admin panel. Only authorized users can access.</p>
          </div>
        </div>
      </div>
    </>
  );
}
