import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { api } from '../lib/api';
import { User } from '../lib/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await api.auth.getProfile();
        setUser(response.data);
      } catch (err: any) {
        localStorage.removeItem('authToken');
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.auth.login(email, password);
      localStorage.setItem('authToken', response.data.token);
      setUser(response.data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
      localStorage.removeItem('authToken');
      setUser(null);
      router.push('/login');
    } catch (err) {
      console.error('Logout failed');
    }
  };

  return { user, loading, error, login, logout };
}

export function useData<T>(
  fetcher: () => Promise<{ data: T }>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetcher();
        setData(response.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  const refetch = async () => {
    try {
      const response = await fetcher();
      setData(response.data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return { data, loading, error, refetch };
}
