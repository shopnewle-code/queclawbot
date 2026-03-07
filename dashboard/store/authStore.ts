/**
 * Authentication & User State Management
 * Using Zustand for global state management
 */

'use client';

import { create } from 'zustand';
import { User, UserRole } from '@/types';

interface AuthStore {
  // State
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;

  // Auth methods
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;

  // Role checks
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  // Setters
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => set({ token }),
  setLoading: (isLoading) => set({ isLoading }),

  // Auth methods
  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const { user, token } = await response.json();
      set({ user, token, isAuthenticated: true });

      // Store in cookies for server-side access
      document.cookie = `auth_token=${token}; path=/; max-age=86400`;
      document.cookie = `user_role=${user.role}; path=/; max-age=86400`;
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
    // Clear cookies
    document.cookie = 'auth_token=; path=/; max-age=0';
    document.cookie = 'user_role=; path=/; max-age=0';
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const { user, token } = await response.json();
        set({ user, token, isAuthenticated: true });
      } else {
        set({ user: null, token: null, isAuthenticated: false });
      }
    } catch (error) {
      set({ user: null, token: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  // Role checks
  hasRole: (role: UserRole) => {
    const { user } = get();
    return user?.role === role;
  },

  hasAnyRole: (roles: UserRole[]) => {
    const { user } = get();
    return user ? roles.includes(user.role) : false;
  },
}));
