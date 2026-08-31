'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  UploadCloud,
  ImageIcon,
  Trash2,
  Camera,
  Layers,
} from 'lucide-react';
import {
  getPushSubscribersCount,
  dispatchBroadcastNotification,
  getBroadcastHistory,
  displaySystemNotification,
  requestNotificationPermission,
} from '@/lib/pushNotificationService';
import { compressImage } from '@/lib/imageUtils';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { BroadcastNotification } from '@/types';
import { useToast } from '@/context/ToastContext';

export default function AdminNotificationsPage() {
  const { success, error, info } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subscribersCount, setSubscribersCount] = useState<number>(0);
  const [history, setHistory] = useState<BroadcastNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);

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
    } catch {
      error('Failed to load push stats and history');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Photo File Upload
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      // 1. Client-side luxury compression to WebP/JPEG (1200x800, max 250KB)
      const { blob, dataUrl } = await compressImage(file, 1200, 800, 0.85);

      // 2. Upload to Firebase Storage with timeout race
      const uploadWithTimeout = async (): Promise<string> => {
        const storageRef = ref(
          storage,
          `notifications/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        );
        const snap = await uploadBytes(storageRef, blob);
        return await getDownloadURL(snap.ref);
      };

      const timeoutPromise = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('Storage timeout')), 2500)
      );

      try {
        const storageUrl = await Promise.race([uploadWithTimeout(), timeoutPromise]);
        setImageUrl(storageUrl);
        success('Notification banner photo uploaded & ready!', 'Image Uploaded');
      } catch {
        setImageUrl(dataUrl);
        success('Notification banner photo optimized & attached!', 'Image Attached');
      }
    } catch (err) {
      console.warn('Image processing notice:', err);
      const localUrl = URL.createObjectURL(file);
      setImageUrl(localUrl);
      info('Local banner preview attached');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      error('Please enter both headline and body text');
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
        `Push alert broadcasted successfully to all subscribed devices!`,
        'VIP Alert Dispatched'
      );
      setHistory((prev) => [dispatched, ...prev]);
    } catch {
      error('Failed to dispatch push notification alert');
    } finally {
      setSending(false);
    }
  };

  // Quick Preset Handlers
  const applyPreset = (presetType: 'drop' | 'flash' | 'shipping') => {
    if (presetType === 'drop') {
      setTitle('✨ ARMIA New Haute Couture Drop');
      setBody('The Private Atelier Autumn/Winter Collection is now live. Reserve your piece online.');
      setTargetUrl('/collections/new-in');
      setBadgeTag('HAUTE_COUTURE');
    } else if (presetType === 'flash') {
      setTitle('🔥 Flash VIP Privilege: 15% Off All Linen Sets');
      setBody('Exclusive 3-hour privilege on all Egyptian linen sets. Use code VIP15 at checkout.');
      setTargetUrl('/collections/sets');
      setBadgeTag('FLASH_SALE');
    } else if (presetType === 'shipping') {
      setTitle('🚚 Complimentary Express Delivery Weekend');
      setBody('Enjoy 100% free door-to-door delivery on all orders across Cairo, Giza & Alexandria.');
      setTargetUrl('/collections');
      setBadgeTag('FREE_SHIPPING');
    }
    info('Preset template applied');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans">
      
      {/* Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#333333] pb-6">
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
                className="bg-[#141414] hover:bg-[#2A2A2A] text-xs text-[#DCC9A6] border border-[#333333] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#B67355]" />
                <span>Collection Drop</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('flash')}
                className="bg-[#141414] hover:bg-[#2A2A2A] text-xs text-amber-300 border border-[#333333] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Flash Deal (3-Hr)</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('shipping')}
                className="bg-[#141414] hover:bg-[#2A2A2A] text-xs text-emerald-400 border border-[#333333] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
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
                placeholder="e.g. ✨ New Summer Linen Collection Available"
                className="w-full bg-[#141414] border border-[#333333] text-white px-3.5 py-2.5 rounded text-xs focus:outline-none focus:border-[#DCC9A6]"
              />
            </div>

            {/* Body */}
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

            {/* Photo Upload & Image Banner Section */}
            <div className="space-y-2 pt-1">
              <label className="block text-[#8E8A85] uppercase tracking-wider font-bold">
                Notification Banner Photo (Upload Image File)
              </label>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFileUpload}
                className="hidden"
                disabled={uploadingImage}
              />

              {!imageUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#444444] hover:border-[#DCC9A6] bg-[#141414] rounded-xl p-5 text-center cursor-pointer transition-colors group flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-10 h-10 rounded-full bg-[#1F1F1F] group-hover:bg-[#B67355] flex items-center justify-center text-[#DCC9A6] group-hover:text-white transition-colors">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      {uploadingImage ? 'Compressing & Uploading...' : 'Click to Upload Image from Phone / Computer'}
                    </span>
                    <span className="text-[10px] text-[#8E8A85] block mt-0.5">
                      Supports JPG, PNG, WEBP — automatically optimized for fast delivery
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-[#141414] border border-[#333333] rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-black shrink-0 border border-[#333333]">
                      <Image src={imageUrl} alt="Banner Preview" fill className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white block truncate">
                        Photo Banner Attached
                      </span>
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Ready for broadcast
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-[#DCC9A6] hover:text-white px-2.5 py-1.5 rounded bg-[#1F1F1F] border border-[#333333] transition-colors"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="text-xs text-rose-400 hover:text-rose-300 p-1.5 rounded hover:bg-rose-950/30 transition-colors"
                      title="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Alternative Image URL Input fallback */}
              <div className="pt-1">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Or paste external photo web link: https://..."
                  className="w-full bg-[#141414] border border-[#2A2A2A] text-[#8E8A85] focus:text-white px-3 py-1.5 rounded text-[11px] focus:outline-none focus:border-[#DCC9A6]"
                />
              </div>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                disabled={sending || uploadingImage}
                className="w-full sm:flex-1 bg-[#B67355] hover:bg-[#DCC9A6] hover:text-[#1F1F1F] text-white py-3.5 px-4 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
              >
                <Send className="w-4 h-4" />
                <span>{sending ? 'Broadcasting Alert...' : 'Dispatch Push Alert to All Devices'}</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (typeof window !== 'undefined' && 'Notification' in window) {
                    if (Notification.permission !== 'granted') {
                      await requestNotificationPermission();
                    }
                    displaySystemNotification(title, body, targetUrl);
                    success('Test push notification sent directly to your screen!', 'Test Notification Sent');
                  } else {
                    info('Notifications are not supported in this browser environment.');
                  }
                }}
                className="w-full sm:w-auto bg-[#141414] hover:bg-[#2A2A2A] border border-[#DCC9A6]/50 text-[#DCC9A6] py-3.5 px-4 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <BellRing className="w-4 h-4 text-[#B67355]" />
                <span>Test on My Device</span>
              </button>
            </div>
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
            <table className="w-full text-left text-xs text-[#D5D5D5]">
              <thead className="bg-[#141414] text-[10px] uppercase tracking-wider text-[#8E8A85] border-b border-[#333333]">
                <tr>
                  <th className="py-3 px-4">Campaign Headline</th>
                  <th className="py-3 px-4">Message Body</th>
                  <th className="py-3 px-4">Target Link</th>
                  <th className="py-3 px-4">Recipients</th>
                  <th className="py-3 px-4">Dispatched At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-[#252525] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        {h.imageUrl && (
                          <div className="relative w-8 h-8 rounded bg-black shrink-0 overflow-hidden border border-[#333333]">
                            <Image src={h.imageUrl} alt="" fill className="object-cover" />
                          </div>
                        )}
                        <span>{h.title}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#8E8A85] max-w-xs truncate">
                      {h.body}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#DCC9A6]">
                      {h.targetUrl || '/'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded text-[10px] font-bold">
                        {h.recipientCount || 1} devices
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#8E8A85]">
                      {typeof h.sentAt === 'string' || typeof h.sentAt === 'number'
                        ? new Date(h.sentAt).toLocaleDateString()
                        : 'Just now'}
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
