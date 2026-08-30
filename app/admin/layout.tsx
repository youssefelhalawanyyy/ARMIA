import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

export const metadata = {
  title: 'ARMIA Boutique Admin Portal',
  description: 'Manage Orders, Inventory, and Products for ARMIA Boutique',
};

export default function RootAdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
