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
  ShoppingBag,
  FolderTree,
  Globe,
  Search,
  Check,
  ChevronDown,
} from 'lucide-react';
import {
  getPushSubscribersCount,
  dispatchBroadcastNotification,
  getBroadcastHistory,
  displaySystemNotification,
  requestNotificationPermission,
} from '@/lib/pushNotificationService';
import { getProducts } from '@/lib/productService';
import { getCategories } from '@/lib/categoryService';
import { compressImage } from '@/lib/imageUtils';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { BroadcastNotification, Product, Category } from '@/types';
import { useToast } from '@/context/ToastContext';

export default function AdminNotificationsPage() {
  const { success, error, info } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subscribersCount, setSubscribersCount] = useState<number>(0);
  const [history, setHistory] = useState<BroadcastNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);

  // Products & Categories for Auto-Fill
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [targetMode, setTargetMode] = useState<'product' | 'category' | 'page' | 'preset'>('product');
  const [productSearch, setProductSearch] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('');

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
      const [count, hist, prods, cats] = await Promise.all([
        getPushSubscribersCount(),
        getBroadcastHistory(),
        getProducts(),
        getCategories(),
      ]);
      setSubscribersCount(count);
      setHistory(hist);
      setProducts(prods);
      setCategories(cats);

      // Auto-select first product if available
      if (prods.length > 0 && !selectedProductId) {
        const firstProd = prods[0];
        setSelectedProductId(firstProd.id);
        setTitle(`✨ Spotlight: ${firstProd.name}`);
        setBody(
          `${firstProd.description || `Handcrafted luxury piece in premium fabric.`} | EGP ${firstProd.price.toLocaleString()}`
        );
        setTargetUrl(`/product/${firstProd.id}`);
        if (firstProd.imageUrls && firstProd.imageUrls.length > 0) {
          setImageUrl(firstProd.imageUrls[0]);
        }
      }
    } catch {
      error('Failed to load push stats and catalog data');
    } finally {
      setLoading(false);
    }
  }, [error, selectedProductId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Product Auto-Fill Selection
  const handleSelectProduct = (prod: Product) => {
    setSelectedProductId(prod.id);
    setTitle(`✨ Spotlight: ${prod.name}`);
    setBody(
      `${prod.description || `Explore our signature ${prod.name} with bespoke tailoring.`} | EGP ${prod.price.toLocaleString()}`
    );
    setTargetUrl(`/product/${prod.id}`);
    if (prod.imageUrls && prod.imageUrls.length > 0) {
      setImageUrl(prod.imageUrls[0]);
    }
    setBadgeTag('PRODUCT_SPOTLIGHT');
    success(`Auto-filled details & photo for "${prod.name}"`, 'Smart Auto-Fill');
  };

  // Handle Category / Collection Auto-Fill Selection
  const handleSelectCategory = (cat: Category) => {
    setSelectedCategorySlug(cat.slug);
    setSelectedProductId('');
    setTitle(`✨ Discover The New ${cat.name} Collection`);
    setBody(
      `${cat.description || `Shop our curated luxury ${cat.name} collection. Available online now.`}`
    );
    setTargetUrl(`/collections/${cat.slug}`);
    if (cat.imageUrl) {
      setImageUrl(cat.imageUrl);
    }
    setBadgeTag('COLLECTION_DROP');
    success(`Auto-filled collection: "${cat.name}"`, 'Smart Auto-Fill');
  };

  // Handle Special Store Page Auto-Fill Selection
  const handleSelectPage = (pageKey: string) => {
    setSelectedProductId('');
    setSelectedCategorySlug('');

    if (pageKey === 'home') {
      setTitle('✨ Welcome to ARMIA Haute Couture');
      setBody('Discover our latest season arrivals, bespoke dresses, and luxury linen sets.');
      setTargetUrl('/');
      setImageUrl('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&auto=format&fit=crop&q=80');
      setBadgeTag('NEW_SEASON');
    } else if (pageKey === 'collections') {
      setTitle('🛍️ Explore All ARMIA Collections');
      setBody('Browse our entire catalog of dresses, sets, tops, and outerwear. Wholesale & Retail.');
      setTargetUrl('/collections');
      setImageUrl('https://images.unsplash.com/photo-1550614000-4895a10e1bfd?w=900&auto=format&fit=crop&q=80');
      setBadgeTag('ALL_COLLECTIONS');
    } else if (pageKey === 'sets') {
      setTitle('🔥 Exclusive Co-Ord Sets & Outfit Deals');
      setBody('Complete your look with matching tops, bottoms, and sets with special privileges.');
      setTargetUrl('/collections/sets');
      setImageUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&auto=format&fit=crop&q=80');
      setBadgeTag('FLASH_SALE');
    } else if (pageKey === 'shipping') {
      setTitle('🚚 Express Door-to-Door Delivery Available');
      setBody('Fast 2-4 day shipping across all Egyptian Governorates with cash on delivery & Instapay.');
      setTargetUrl('/shipping');
      setBadgeTag('FREE_SHIPPING');
    } else if (pageKey === 'contact') {
      setTitle('💬 Atelier VIP Concierge & Personal Stylist');
      setBody('Have questions or need custom sizing? Reach out directly via WhatsApp concierge.');
      setTargetUrl('/contact');
      setBadgeTag('VIP_CONCIERGE');
    }
    success('Auto-filled page broadcast content!', 'Page Selected');
  };

  // Handle Photo File Upload
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { blob, dataUrl } = await compressImage(file, 1200, 800, 0.85);

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

  // Filtered products for search
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.nameArabic && p.nameArabic.includes(productSearch))
  );

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
            Broadcast real-time mobile push notifications to subscribed client devices for private collection drops, specific product spotlights, and flash sales.
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

      {/* Background Push Delivery Operating System Notes */}
      <div className="bg-[#141414] border border-[#333333] p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#B67355]/20 border border-[#B67355]/40 flex items-center justify-center text-[#DCC9A6] shrink-0 mt-0.5">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <span className="font-bold text-white block">
              Mobile Background Delivery Guidelines:
            </span>
            <p className="text-[11px] text-[#8E8A85]">
              <strong className="text-white">Android:</strong> Delivers directly to lock screen when Chrome or PWA is closed. &nbsp;|&nbsp; <strong className="text-white">iPhone (iOS):</strong> Apple requires the client to tap <em>"Add to Home Screen (إضافة للشاشة الرئيسية)"</em> in Safari to receive alerts when Safari is closed (Apple WebKit policy).
            </p>
          </div>
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
            <p className="text-xs text-[#8E8A85] mt-1">
              Select any product, category, or page to <strong>automatically write all titles, descriptions, links, and photos</strong> in 1 click!
            </p>
          </div>

          {/* Smart Auto-Fill Picker Navigation Tabs */}
          <div className="space-y-3 bg-[#141414] p-4 rounded-xl border border-[#333333]">
            <span className="text-[11px] text-[#DCC9A6] uppercase tracking-wider font-bold block">
              ⚡ 1-Click Smart Auto-Fill Selection:
            </span>

            {/* Mode Switcher Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setTargetMode('product')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  targetMode === 'product'
                    ? 'bg-[#B67355] text-white shadow-md'
                    : 'bg-[#1F1F1F] text-[#8E8A85] hover:text-white border border-[#333333]'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Product</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetMode('category')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  targetMode === 'category'
                    ? 'bg-[#B67355] text-white shadow-md'
                    : 'bg-[#1F1F1F] text-[#8E8A85] hover:text-white border border-[#333333]'
                }`}
              >
                <FolderTree className="w-3.5 h-3.5" />
                <span>Collection</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetMode('page')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  targetMode === 'page'
                    ? 'bg-[#B67355] text-white shadow-md'
                    : 'bg-[#1F1F1F] text-[#8E8A85] hover:text-white border border-[#333333]'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Store Page</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetMode('preset')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  targetMode === 'preset'
                    ? 'bg-[#B67355] text-white shadow-md'
                    : 'bg-[#1F1F1F] text-[#8E8A85] hover:text-white border border-[#333333]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>VIP Deals</span>
              </button>
            </div>

            {/* TAB 1: PRODUCT PICKER */}
            {targetMode === 'product' && (
              <div className="space-y-3 pt-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#8E8A85] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search product name or category..."
                    className="w-full bg-[#1F1F1F] border border-[#333333] text-white pl-9 pr-3.5 py-2 rounded-lg text-xs focus:outline-none focus:border-[#DCC9A6]"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                  {filteredProducts.map((prod) => {
                    const isSelected = selectedProductId === prod.id;
                    const thumb = prod.imageUrls && prod.imageUrls.length > 0 ? prod.imageUrls[0] : '';
                    return (
                      <div
                        key={prod.id}
                        onClick={() => handleSelectProduct(prod)}
                        className={`p-2 rounded-lg flex items-center justify-between gap-3 cursor-pointer transition-all border ${
                          isSelected
                            ? 'bg-[#B67355]/20 border-[#DCC9A6] text-white'
                            : 'bg-[#1F1F1F] border-[#2A2A2A] text-[#D5D5D5] hover:border-[#444444]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative w-10 h-10 rounded bg-black shrink-0 overflow-hidden border border-[#333333]">
                            {thumb ? (
                              <Image src={thumb} alt={prod.name} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-[#8E8A85]">
                                No img
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold block truncate text-white">
                              {prod.name}
                            </span>
                            <span className="text-[10px] text-[#8E8A85] block truncate">
                              {prod.category} • EGP {prod.price.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-1.5">
                          {isSelected ? (
                            <span className="bg-[#DCC9A6] text-[#1F1F1F] text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                              <Check className="w-3 h-3" /> Selected
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#8E8A85] hover:text-[#DCC9A6]">
                              Pick & Auto-fill →
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: COLLECTION PICKER */}
            {targetMode === 'category' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {categories.map((cat) => {
                  const isSelected = selectedCategorySlug === cat.slug;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => handleSelectCategory(cat)}
                      className={`p-3 rounded-lg flex items-center justify-between gap-3 cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-[#B67355]/20 border-[#DCC9A6] text-white'
                          : 'bg-[#1F1F1F] border-[#2A2A2A] text-[#D5D5D5] hover:border-[#444444]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {cat.imageUrl && (
                          <div className="relative w-8 h-8 rounded bg-black shrink-0 overflow-hidden border border-[#333333]">
                            <Image src={cat.imageUrl} alt={cat.name} fill className="object-cover" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="text-xs font-bold block text-white truncate">
                            {cat.name}
                          </span>
                          {cat.nameArabic && (
                            <span className="text-[10px] text-[#8E8A85] block truncate">
                              {cat.nameArabic}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="text-[10px] text-[#DCC9A6] shrink-0 font-semibold">
                        {isSelected ? '✓ Active' : 'Auto-fill'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 3: STORE PAGE PICKER */}
            {targetMode === 'page' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleSelectPage('home')}
                  className="p-3 bg-[#1F1F1F] hover:bg-[#2A2A2A] border border-[#333333] hover:border-[#DCC9A6] rounded-lg text-left transition-all space-y-1"
                >
                  <span className="text-xs font-bold text-white block">🏠 Home / New Season</span>
                  <span className="text-[10px] text-[#8E8A85] block truncate">Destination: /</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPage('collections')}
                  className="p-3 bg-[#1F1F1F] hover:bg-[#2A2A2A] border border-[#333333] hover:border-[#DCC9A6] rounded-lg text-left transition-all space-y-1"
                >
                  <span className="text-xs font-bold text-white block">👗 All Collections</span>
                  <span className="text-[10px] text-[#8E8A85] block truncate">Destination: /collections</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPage('sets')}
                  className="p-3 bg-[#1F1F1F] hover:bg-[#2A2A2A] border border-[#333333] hover:border-[#DCC9A6] rounded-lg text-left transition-all space-y-1"
                >
                  <span className="text-xs font-bold text-white block">🔥 Deals & Sets Outlet</span>
                  <span className="text-[10px] text-[#8E8A85] block truncate">Destination: /collections/sets</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPage('shipping')}
                  className="p-3 bg-[#1F1F1F] hover:bg-[#2A2A2A] border border-[#333333] hover:border-[#DCC9A6] rounded-lg text-left transition-all space-y-1"
                >
                  <span className="text-xs font-bold text-white block">🚚 Express Shipping Promo</span>
                  <span className="text-[10px] text-[#8E8A85] block truncate">Destination: /shipping</span>
                </button>
              </div>
            )}

            {/* TAB 4: VIP PRESETS */}
            {targetMode === 'preset' && (
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleSelectPage('home')}
                  className="bg-[#1F1F1F] hover:bg-[#2A2A2A] text-xs text-[#DCC9A6] border border-[#333333] px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#B67355]" />
                  <span>Haute Couture Drop</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPage('sets')}
                  className="bg-[#1F1F1F] hover:bg-[#2A2A2A] text-xs text-amber-300 border border-[#333333] px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>Flash Deal (15% Off)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPage('shipping')}
                  className="bg-[#1F1F1F] hover:bg-[#2A2A2A] text-xs text-emerald-400 border border-[#333333] px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Free Express Shipping</span>
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs">
            
            {/* Title */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[#8E8A85] uppercase tracking-wider font-bold">
                  Notification Headline / Title *
                </label>
                <span className="text-[10px] text-[#DCC9A6]">Auto-filled / Editable</span>
              </div>
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[#8E8A85] uppercase tracking-wider font-bold">
                  Notification Message Body *
                </label>
                <span className="text-[10px] text-[#DCC9A6]">Auto-filled / Editable</span>
              </div>
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[#8E8A85] uppercase tracking-wider font-bold">
                  Click Target Destination URL *
                </label>
                <span className="text-[10px] text-emerald-400 font-mono">Linked Target</span>
              </div>
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
              <div className="flex items-center justify-between">
                <label className="block text-[#8E8A85] uppercase tracking-wider font-bold">
                  Notification Banner Photo
                </label>
                <span className="text-[10px] text-[#DCC9A6]">Auto-synced from Product</span>
              </div>

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
                      Supports JPG, PNG, WEBP — or auto-filled from product selection above
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
                    displaySystemNotification(title, body, targetUrl, imageUrl);
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
