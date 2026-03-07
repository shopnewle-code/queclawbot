/**
 * Dashboard UI State Management
 * Manages theme, sidebar, notifications, etc.
 */

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIStore {
  // Theme
  darkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
  toggleDarkMode: () => void;

  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Notifications
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
  }>;
  addNotification: (
    message: string,
    type?: 'success' | 'error' | 'warning' | 'info'
  ) => void;
  removeNotification: (id: string) => void;

  // Real-time status
  isConnected: boolean;
  setConnected: (connected: boolean) => void;

  // Loading states
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      // Theme
      darkMode: false,
      setDarkMode: (enabled) => set({ darkMode: enabled }),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

      // Sidebar
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      // Notifications
      notifications: [],
      addNotification: (message, type = 'info') => {
        const id = Date.now().toString();
        set((state) => ({
          notifications: [...state.notifications, { id, type, message }],
        }));

        // Auto-remove after 5 seconds
        setTimeout(() => {
          set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          }));
        }, 5000);
      },
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      // Real-time
      isConnected: false,
      setConnected: (connected) => set({ isConnected: connected }),

      // Loading
      isLoading: false,
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({
        darkMode: state.darkMode,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
