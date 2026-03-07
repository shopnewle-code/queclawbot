/**
 * Root Layout for the entire app
 * Handles global styles, providers, etc.
 */

import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'QueClaw Admin Dashboard',
  description: 'Professional SaaS dashboard for QueClaw AI Bot',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1f2937" />
      </head>
      <body className="dark:bg-gray-900 dark:text-white">
        {/* Providers will go here */}
        {children}
      </body>
    </html>
  );
}
