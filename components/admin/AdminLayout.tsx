'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FolderTree,
  Percent,
  Truck,
  Users,
  ShieldCheck,
  ShoppingCart,
  Bell,
  LogOut,
  Download,
  Store,
  Menu,
  X,
  Smartphone,
} from 'lucide-react';
import BrandLogo from '@/components/common/BrandLogo';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { useAuth } from '@/context/AuthContext';
import { usePWA } from '@/context/PWAContext';
import AdminPWAInstallModal from './AdminPWAInstallModal';
import AdminMobileTabBar from './AdminMobileTabBar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, loading, logout } = useAuth();
  const { isInstalled } = usePWA();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [time, setTime] = useState<string>('');

  // Clock in Cairo timezone
  useEffect(() => {
    const updateTime = () => {
      setTime(
        new Date().toLocaleTimeString('en-US', {
          timeZone: 'Africa/Cairo',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Automatic PWA Prompt on Login (if not installed and not permanently dismissed)
  useEffect(() => {
    if (user && isAdmin && pathname !== '/admin/login' && !isInstalled) {
      const dismissed = typeof window !== 'undefined' && localStorage.getItem('armia_admin_pwa_dismissed_v2');
      if (!dismissed) {
        const timer = setTimeout(() => {
          setShowInstallModal(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [user, isAdmin, pathname, isInstalled]);

  // Route guard: if not admin, redirect to admin login
  useEffect(() => {
    if (!loading) {
      if (!user || !isAdmin) {
        if (pathname !== '/admin/login') {
          router.replace('/admin/login');
        }
      }
    }
  }, [user, isAdmin, loading, pathname, router]);

  // If on login page, render children directly
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1F1F1F] text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#DCC9A6] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-sans tracking-widest text-[#DCC9A6] uppercase">
            Verifying Admin Security...
          </p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null; // Will redirect via useEffect
  }

  const navItems = [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Live Orders', href: '/admin/orders', icon: ShoppingBag },
    { name: 'Abandoned Carts', href: '/admin/abandoned', icon: ShoppingCart },
    { name: 'Clients Database', href: '/admin/clients', icon: Users },
    { name: 'Admin Team', href: '/admin/admins', icon: ShieldCheck },
    { name: 'Push Notifications', href: '/admin/notifications', icon: Bell },
    { name: 'Products (CRUD)', href: '/admin/products', icon: Package },
    { name: 'Categories (CRUD)', href: '/admin/categories', icon: FolderTree },
    { name: 'Discounts & Promos', href: '/admin/discounts', icon: Percent },
    { name: 'Shipping Rates', href: '/admin/shipping', icon: Truck },
  ];

  return (
    <div className="min-h-screen bg-[#141414] text-[#F6F3EE] flex flex-col lg:flex-row font-sans selection:bg-[#DCC9A6] selection:text-[#1F1F1F]">
      
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#1F1F1F] border-r border-[#333333] shrink-0 justify-between">
        <div>
          {/* Logo */}
          <div className="p-6 border-b border-[#333333] flex flex-col items-center">
            <BrandLogo variant="gold" size="md" showTagline={false} href="/admin" />
            <span className="mt-2 text-[9px] font-sans font-bold uppercase tracking-[0.3em] bg-[#000000] text-[#DCC9A6] px-2 py-0.5 border border-[#333333]">
              Admin Portal
            </span>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-3 text-xs uppercase tracking-wider font-medium transition-all ${
                    isActive
                      ? 'bg-[#B67355] text-white shadow-md font-bold'
                      : 'text-[#8E8A85] hover:bg-[#2A2A2A] hover:text-[#DCC9A6]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-[#333333] space-y-3">
          {/* PWA Install Trigger Button */}
          {!isInstalled && (
            <button
              onClick={() => setShowInstallModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-[#DCC9A6] text-[#1F1F1F] py-2.5 px-3 text-xs font-bold uppercase tracking-wider hover:bg-white transition-all shadow-md active:scale-95"
            >
              <Smartphone className="w-4 h-4 text-[#1F1F1F]" />
              <span>Install Admin App</span>
            </button>
          )}

          {/* Storefront Link */}
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-center gap-2 w-full border border-[#333333] text-[#DCC9A6] py-2 text-xs uppercase tracking-wider hover:bg-[#2A2A2A] transition-colors"
          >
            <Store className="w-3.5 h-3.5" />
            <span>View Storefront</span>
          </Link>

          {/* Admin User Info & Logout */}
          <div className="pt-2 flex items-center justify-between border-t border-[#333333]/60 text-xs">
            <div className="truncate max-w-[140px]">
              <p className="text-[11px] font-semibold text-white truncate">
                {user.displayName || 'Administrator'}
              </p>
              <p className="text-[9px] text-[#8E8A85] truncate">{user.email}</p>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 text-[#8E8A85] hover:text-[#B67355] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Header */}
        <header className="h-16 bg-[#1F1F1F] border-b border-[#333333] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden p-2 text-[#DCC9A6] hover:text-white"
            >
              {mobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs text-[#8E8A85]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Cairo Atelier Live Time:</span>
              <strong className="text-[#DCC9A6] font-mono">{time}</strong>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <LanguageSwitcher variant="compact" />

            {/* Quick PWA App Button in Header */}
            {!isInstalled && (
              <button
                onClick={() => setShowInstallModal(true)}
                className="flex items-center gap-1.5 bg-[#000000] border border-[#DCC9A6]/50 text-[#DCC9A6] px-3 py-1.5 text-xs font-semibold hover:border-[#DCC9A6] hover:bg-[#2A2A2A] transition-all rounded"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Download App</span>
              </button>
            )}

            <span className="text-[11px] text-[#8E8A85] hidden md:block">
              Welcome, <span className="text-[#DCC9A6] font-semibold">{user.displayName || user.email}</span>
            </span>

            <button
              onClick={() => logout()}
              className="bg-[#2A2A2A] text-xs text-[#8E8A85] hover:text-white px-3 py-1.5 border border-[#333333] transition-colors"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileSidebarOpen && (
          <div className="lg:hidden bg-[#1F1F1F] border-b border-[#333333] p-4 space-y-3">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 text-xs uppercase tracking-wider ${
                      isActive
                        ? 'bg-[#B67355] text-white font-bold'
                        : 'text-[#8E8A85] hover:bg-[#2A2A2A] hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {!isInstalled && (
              <button
                onClick={() => {
                  setMobileSidebarOpen(false);
                  setShowInstallModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 bg-[#DCC9A6] text-[#1F1F1F] py-2 text-xs uppercase font-bold tracking-wider mt-2"
              >
                <Smartphone className="w-4 h-4" />
                <span>Install Mobile App (PWA)</span>
              </button>
            )}
          </div>
        )}

        {/* Page Body with safe bottom padding for mobile app tab bar */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-[#141414] pb-28 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Native Mobile App Bottom Navigation Tab Bar */}
      <AdminMobileTabBar onOpenInstallModal={() => setShowInstallModal(true)} />

      {/* Luxury PWA Install Pop-Up Modal */}
      <AdminPWAInstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </div>
  );
}
