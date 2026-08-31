'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Bell,
  BellRing,
  Send,
  Sparkles,
  Smartphone,
  CheckCircle2,
  Clock,
  ExternalLink,
  Users,
  Zap,
  Tag,
  Radio,
  Flame,
  Truck,
} from 'lucide-react';
import {
  getPushSubscribersCount,
  dispatchBroadcastNotification,
  getBroadcastHistory,
} from '@/lib/pushNotificationService';
import { BroadcastNotification } from '@/types';
import { useToast } from '@/context/ToastContext';

export default function AdminNotificationsPage() {
  const { success, error, info } = useToast();
  const [subscribersCount, setSubscribersCount] = useState<number>(0);
  const [history, setHistory] = useState<BroadcastNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);

  // Form State
  const [title, setTitle] = useState<string>('✨ ARMIA New Haute Couture Drop');
  const [body, setBody] = useState<string>(
    'Discover our latest luxury linen sets and evening gowns. Shop the new collection online now.'
  );
  const [targetUrl, setTargetUrl] = useState<string>('/collections/new-in');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [badgeTag, setBadgeTag] = useState<string>('VIP_DROP');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [count, hist] = await Promise.all([
        getPushSubscribersCount(),
        getBroadcastHistory(),
      ]);
      setSubscribersCount(count);
      setHistory(hist);
    } catch (err) {
      console.error('Error fetching notification data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.all([getPushSubscribersCount(), getBroadcastHistory()])
      .then(([count, hist]) => {
        if (isMounted) {
          setSubscribersCount(count);
          setHistory(hist);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error loading push data:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const applyPreset = (presetType: 'drop' | 'flash' | 'shipping') => {
    switch (presetType) {
      case 'drop':
        setTitle('✨ New Haute Couture Collection Just Dropped!');
        setBody('Explore our exclusive autumn evening dresses & tailored linen sets. Limited atelier pieces.');
        setTargetUrl('/collections/new-in');
        setBadgeTag('NEW_COLLECTION');
        break;
      case 'flash':
        setTitle('⏳ Flash Deal: 25% OFF For 3 Hours Only!');
        setBody('Special VIP promotion on select Linen Sets. Use code FLASH25 at checkout before timer ends!');
        setTargetUrl('/collections/sets');
        setBadgeTag('FLASH_SALE');
        break;
      case 'shipping':
        setTitle('🚚 Free Doorstep Delivery Across Egypt Today!');
        setBody('Enjoy complimentary express shipping on all orders placed today with zero delivery fees.');
        setTargetUrl('/collections');
        setBadgeTag('FREE_SHIPPING');
        break;
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      error('Notification title and message body are required.');
      return;
    }

    setSending(true);
    try {
      const dispatched = await dispatchBroadcastNotification({
        title: title.trim(),
        body: body.trim(),
        targetUrl: targetUrl.trim() || '/',
        imageUrl: imageUrl.trim() || undefined,
        badgeTag,
      });

      success(
        `Push alert broadcasted successfully to all active client devices!`,
        'Broadcast Dispatched'
      );

      setHistory((prev) => [dispatched, ...prev]);
    } catch (err: unknown) {
      console.error('Dispatch failed:', err);
      const e = err as { message?: string };
      error('Failed to send broadcast: ' + (e.message || 'Error occurred'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.25em] text-[#B67355]">
            Instant Customer Engagement
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
            Mobile Push Notifications & Broadcast Center
          </h1>
          <p className="text-xs text-[#8E8A85]">
            Broadcast real-time mobile push notifications to subscribed client devices for private collection drops, flash sales, and special offers.
          </p>
        </div>

        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 bg-[#1F1F1F] border border-[#333333] text-[#DCC9A6] px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#2A2A2A] transition-colors rounded"
        >
          <span>Refresh Stats</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#1F1F1F] border border-[#333333] p-5 rounded-xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#8E8A85]">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Subscribed Devices</span>
            <Smartphone className="w-4 h-4 text-[#DCC9A6]" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-serif text-white">
            {Math.max(1, subscribersCount)} Devices
          </p>
          <span className="text-[10px] text-emerald-400 block">
            Active opt-in mobile & desktop subscribers
          </span>
        </div>

        <div className="bg-[#1F1F1F] border border-[#333333] p-5 rounded-xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#8E8A85]">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Total Campaigns Sent</span>
            <Send className="w-4 h-4 text-[#B67355]" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-serif text-white">
            {history.length}
          </p>
          <span className="text-[10px] text-[#8E8A85] block">
            Across all collections & promos
          </span>
        </div>

        <div className="bg-[#1F1F1F] border border-[#333333] p-5 rounded-xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#8E8A85]">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Engagement Delivery</span>
            <Radio className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-serif text-emerald-400">
            100% Instant
          </p>
          <span className="text-[10px] text-[#8E8A85] block">
            Direct lock screen push alerts
          </span>
        </div>
      </div>

      {/* Broadcast Composer & Live Phone Mockup Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left 7 Cols: Push Notification Composer */}
        <div className="lg:col-span-7 bg-[#1F1F1F] border border-[#333333] p-6 sm:p-7 rounded-2xl shadow-sm space-y-6">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#B67355]">
              Campaign Composer
            </span>
            <h3 className="font-serif text-xl font-bold text-white mt-0.5">
              Draft Broadcast Alert
            </h3>
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-2">
            <span className="text-xs text-[#8E8A85] uppercase tracking-wider font-semibold block">
              1-Click Luxury Presets:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyPreset('drop')}
                className="inline-flex items-center gap-1.5 bg-[#141414] hover:bg-[#2A2A2A] border border-[#333333] text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#DCC9A6]" />
                <span>Collection Drop</span>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('flash')}
                className="inline-flex items-center gap-1.5 bg-[#141414] hover:bg-[#2A2A2A] border border-[#333333] text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Flash Deal (3-Hr)</span>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('shipping')}
                className="inline-flex items-center gap-1.5 bg-[#141414] hover:bg-[#2A2A2A] border border-[#333333] text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
              >
                <Truck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Free Shipping Day</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs">
            {/* Title */}
            <div>
              <label className="block text-[#8E8A85] uppercase tracking-wider font-bold mb-1.5">
                Notification Headline / Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. ✨ New Collection Drop Alert"
                className="w-full bg-[#141414] border border-[#333333] text-white px-3.5 py-2.5 rounded text-xs focus:outline-none focus:border-[#DCC9A6]"
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-[#8E8A85] uppercase tracking-wider font-bold mb-1.5">
                Notification Message Body *
              </label>
              <textarea
                required
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Enter compelling luxury message..."
                className="w-full bg-[#141414] border border-[#333333] text-white p-3.5 rounded text-xs focus:outline-none focus:border-[#DCC9A6] resize-none"
              />
            </div>

            {/* Target URL */}
            <div>
              <label className="block text-[#8E8A85] uppercase tracking-wider font-bold mb-1.5">
                Click Target Destination URL *
              </label>
              <input
                type="text"
                required
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="e.g. /collections/new-in or /product/linen-set"
                className="w-full bg-[#141414] border border-[#333333] text-white px-3.5 py-2.5 rounded text-xs focus:outline-none focus:border-[#DCC9A6]"
              />
            </div>

            {/* Optional Image URL */}
            <div>
              <label className="block text-[#8E8A85] uppercase tracking-wider font-bold mb-1.5">
                Optional Banner Image URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-[#141414] border border-[#333333] text-white px-3.5 py-2.5 rounded text-xs focus:outline-none focus:border-[#DCC9A6]"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-[#B67355] hover:bg-[#DCC9A6] hover:text-[#1F1F1F] text-white py-3.5 px-4 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99] mt-4"
            >
              <Send className="w-4 h-4" />
              <span>{sending ? 'Broadcasting Alert...' : 'Dispatch Push Alert to All Devices'}</span>
            </button>
          </form>
        </div>

        {/* Right 5 Cols: Live Smartphone Lock Screen Preview */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="w-full max-w-[320px] bg-[#000000] border-4 border-[#333333] rounded-[36px] p-4 shadow-2xl relative overflow-hidden text-white">
            {/* Top Speaker / Dynamic Island Bar */}
            <div className="w-24 h-4 bg-[#1F1F1F] rounded-full mx-auto mb-6" />

            {/* Lock Screen Time */}
            <div className="text-center space-y-0.5 mb-8">
              <span className="text-[10px] text-[#8E8A85] uppercase tracking-widest font-semibold">
                Monday, August 31
              </span>
              <p className="text-4xl font-light font-sans text-white">
                07:05
              </p>
            </div>

            {/* Live Push Notification Card Mockup */}
            <div className="bg-[#1F1F1F]/90 border border-[#DCC9A6]/40 p-3.5 rounded-2xl shadow-xl backdrop-blur-md space-y-2 animate-bounceSubtle">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md bg-[#B67355] flex items-center justify-center text-white text-[9px] font-serif font-bold">
                    A
                  </div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-[#DCC9A6]">
                    ARMIA BOUTIQUE
                  </span>
                </div>
                <span className="text-[9px] text-[#8E8A85]">now</span>
              </div>

              <div>
                <h5 className="font-bold text-xs text-white leading-tight">
                  {title || 'ARMIA Exclusive Drop'}
                </h5>
                <p className="text-[11px] text-[#D5D5D5] mt-1 leading-snug">
                  {body || 'Tap to view exclusive pieces now.'}
                </p>
              </div>

              {imageUrl && (
                <div className="relative w-full h-24 bg-[#141414] rounded-lg overflow-hidden border border-[#333333]">
                  <Image src={imageUrl} alt="Preview" fill className="object-cover" />
                </div>
              )}
            </div>

            <div className="text-center mt-12 mb-2">
              <span className="text-[9px] text-[#666666]">Swipe up to open</span>
              <div className="w-28 h-1 bg-white/40 rounded-full mx-auto mt-1" />
            </div>
          </div>
        </div>

      </div>

      {/* Broadcast History Table */}
      <div className="bg-[#1F1F1F] border border-[#333333] overflow-hidden shadow-sm rounded-xl">
        <div className="p-4 border-b border-[#333333] flex items-center justify-between">
          <h4 className="font-serif font-bold text-sm text-white">
            Broadcast Campaigns History ({history.length})
          </h4>
        </div>

        {history.length === 0 ? (
          <div className="py-12 text-center text-[#8E8A85] text-xs">
            No broadcast campaigns sent yet. Send your first push alert above!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#141414] border-b border-[#333333] text-[#8E8A85] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Campaign Headline</th>
                  <th className="py-3.5 px-4">Message Body</th>
                  <th className="py-3.5 px-4">Target Link</th>
                  <th className="py-3.5 px-4">Recipients</th>
                  <th className="py-3.5 px-4">Dispatched At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-[#252525]">
                    <td className="py-3.5 px-4 font-bold text-white max-w-[180px] truncate">
                      {h.title}
                    </td>
                    <td className="py-3.5 px-4 text-[#CCCCCC] max-w-[260px] truncate">
                      {h.body}
                    </td>
                    <td className="py-3.5 px-4 text-[#DCC9A6] font-mono text-[11px]">
                      {h.targetUrl}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        {h.recipientCount} devices
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#8E8A85] text-[11px]">
                      {typeof h.sentAt === 'string'
                        ? new Date(h.sentAt).toLocaleDateString('en-GB')
                        : 'Recent'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
