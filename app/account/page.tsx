'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Package,
  LogOut,
  User,
  ShieldAlert,
  ExternalLink,
  Smartphone,
} from 'lucide-react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import AuthModal from '@/components/storefront/AuthModal';
import { useAuth } from '@/context/AuthContext';
import { usePWA } from '@/context/PWAContext';
import { getCustomerOrders } from '@/lib/productService';
import { Order, OrderStatus } from '@/types';

export default function AccountPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAdmin, logout } = useAuth();
  const { promptInstall, isInstalled } = usePWA();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    async function loadOrders() {
      if (user) {
        setLoadingOrders(true);
        const data = await getCustomerOrders(user.uid);
        setOrders(data);
        setLoadingOrders(false);
      }
    }
    if (user) {
      loadOrders();
    }
  }, [user]);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-1">
            Pending Confirmation
          </span>
        );
      case 'confirmed':
        return (
          <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-1">
            Confirmed
          </span>
        );
      case 'processing':
        return (
          <span className="bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-1">
            In Processing
          </span>
        );
      case 'shipped':
        return (
          <span className="bg-[#EDE3CF] text-[#B67355] border border-[#DCC9A6] text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-1">
            Out for Delivery
          </span>
        );
      case 'delivered':
        return (
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-1">
            Delivered
          </span>
        );
      case 'cancelled':
        return (
          <span className="bg-red-50 text-red-800 border border-red-200 text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-1">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F6F3EE]">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-[#1F1F1F] border-t-[#DCC9A6] rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F6F3EE]">
        <Navbar />
        <main className="flex-grow py-20 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white border border-[#E8E2D8] p-8 text-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-[#F6F3EE] flex items-center justify-center mx-auto mb-4 border border-[#E8E2D8]">
              <User className="w-6 h-6 text-[#8E8A85]" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#1F1F1F] mb-2">
              Sign In to Your Account
            </h2>
            <p className="text-xs text-[#8E8A85] font-sans mb-6">
              Track past orders, manage your shipping information, and access exclusive boutique services.
            </p>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full bg-[#1F1F1F] text-[#DCC9A6] py-3.5 text-xs uppercase tracking-[0.2em] font-sans font-bold hover:bg-[#B67355] hover:text-white transition-colors"
            >
              Sign In / Register
            </button>
          </div>
        </main>
        <Footer />
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F3EE]">
      <Navbar />

      <main className="flex-grow py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Account Profile Header */}
          <div className="bg-white border border-[#E8E2D8] p-6 sm:p-8 mb-10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#1F1F1F] text-[#DCC9A6] flex items-center justify-center font-serif text-2xl font-bold border-2 border-[#DCC9A6]">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'A'}
              </div>
              <div>
                <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.25em] text-[#B67355]">
                  Boutique Client Profile
                </span>
                <h1 className="font-serif text-2xl font-bold text-[#1F1F1F]">
                  {user.displayName || 'ARMIA Patron'}
                </h1>
                <p className="text-xs text-[#8E8A85] font-sans">{user.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {!isInstalled && (
                <button
                  type="button"
                  onClick={promptInstall}
                  className="inline-flex items-center gap-2 bg-[#141414] border border-[#DCC9A6] text-[#DCC9A6] px-4 py-2.5 text-xs uppercase tracking-wider font-sans font-bold hover:bg-[#DCC9A6] hover:text-[#1F1F1F] transition-all"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Install App</span>
                </button>
              )}

              {isAdmin && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 bg-[#1F1F1F] text-[#DCC9A6] px-4 py-2.5 text-xs uppercase tracking-wider font-sans font-bold hover:bg-[#B67355] hover:text-white transition-colors"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Admin Dashboard</span>
                </Link>
              )}
              <button
                onClick={async () => {
                  await logout();
                  router.push('/');
                }}
                className="inline-flex items-center gap-2 border border-[#E8E2D8] text-[#1F1F1F] px-4 py-2.5 text-xs uppercase tracking-wider font-sans hover:bg-[#F6F3EE] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* All Past Orders Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl font-bold text-[#1F1F1F]">
                All Past & Current Orders
              </h2>
              <span className="text-xs font-sans text-[#8E8A85]">
                {orders.length} {orders.length === 1 ? 'Order' : 'Orders'} Placed
              </span>
            </div>

            {loadingOrders ? (
              <div className="bg-white border border-[#E8E2D8] p-12 text-center">
                <div className="w-8 h-8 border-2 border-[#1F1F1F] border-t-[#DCC9A6] rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-[#8E8A85] font-sans">Loading your orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white border border-[#E8E2D8] p-12 text-center">
                <Package className="w-12 h-12 text-[#8E8A85] mx-auto mb-3" />
                <h3 className="font-serif text-lg font-bold text-[#1F1F1F] mb-1">
                  No orders yet
                </h3>
                <p className="text-xs text-[#8E8A85] font-sans mb-6">
                  You haven&apos;t placed any orders yet. Explore our newest collection today.
                </p>
                <Link
                  href="/collections"
                  className="inline-block bg-[#1F1F1F] text-[#DCC9A6] px-8 py-3 text-xs uppercase tracking-widest font-sans font-bold hover:bg-[#B67355] transition-colors"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((ord) => (
                  <div
                    key={ord.id || ord.orderId}
                    className="bg-white border border-[#E8E2D8] p-6 transition-all hover:border-[#DCC9A6] shadow-sm"
                  >
                    {/* Order header row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D8] pb-4 mb-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="font-serif text-base font-bold text-[#1F1F1F]">
                            Order #{ord.orderId}
                          </h4>
                          {getStatusBadge(ord.status)}
                        </div>
                        <p className="text-[11px] text-[#8E8A85] font-sans mt-1">
                          Payment: <strong className="text-[#1F1F1F]">Cash on Delivery (COD)</strong> • Destination: {ord.customerDetails?.city}, {ord.customerDetails?.governorate}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-serif text-base font-bold text-[#B67355]">
                          EGP {ord.totalAmount?.toFixed(2)}
                        </span>
                        <Link
                          href={`/order/${ord.id}?orderId=${ord.orderId}`}
                          className="inline-flex items-center gap-1 bg-[#F6F3EE] border border-[#E8E2D8] px-3.5 py-1.5 text-xs font-sans font-medium text-[#1F1F1F] hover:bg-[#1F1F1F] hover:text-[#DCC9A6] transition-colors"
                        >
                          <span>Track Order</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>

                    {/* Order items thumbnails */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {ord.items.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-2 bg-[#F6F3EE] border border-[#E8E2D8]/60"
                        >
                          <div className="relative w-12 h-14 bg-white shrink-0 overflow-hidden">
                            <Image
                              src={item.imageUrl || ''}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="font-serif text-xs font-semibold text-[#1F1F1F] truncate">
                              {item.name}
                            </h5>
                            <p className="text-[10px] text-[#8E8A85] font-sans">
                              {item.selectedColor?.name} • Size {item.selectedSize} • Qty {item.quantity}
                            </p>
                            <span className="text-xs font-bold text-[#1F1F1F] font-serif">
                              EGP {(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
