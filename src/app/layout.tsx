import { Outfit } from 'next/font/google';
import './globals.css';
import type { Metadata } from 'next';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'HomeTrack Admin',
    template: '%s | HomeTrack Admin',
  },
  description: 'HomeTrack Admin Dashboard - Quản lý hệ thống HomeTrack',
  icons: {
    icon: [
      { url: '/images/logo/logo-icon.svg', type: 'image/svg+xml' },
      { url: '/images/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/images/logo/logo-icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/images/favicon.ico',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ThemeProvider>
          <SidebarProvider>{children}</SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
