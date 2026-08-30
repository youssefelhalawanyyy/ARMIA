import type { Metadata } from 'next';
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

export const metadata: Metadata = {
  title: 'ARMIA Boutique Admin Portal',
  description: 'Manage Orders, Inventory, and Products for ARMIA Boutique',
  manifest: '/admin-manifest.json',
  icons: {
    icon: '/icons/admin-favicon.svg',
    shortcut: '/icons/admin-favicon.svg',
    apple: '/icons/admin-icon.svg',
  },
};

export default function RootAdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
