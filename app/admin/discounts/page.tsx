'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  X,
  Search,
  Sparkles,
  Ticket,
  ToggleLeft,
  ToggleRight,
  Copy,
  Zap,
  Clock,
  Package,
} from 'lucide-react';
import {
  getDiscounts,
  saveDiscount,
  deleteDiscount,
  DEFAULT_DISCOUNTS,
} from '@/lib/discountService';
import { getCategories, DEFAULT_CATEGORIES } from '@/lib/categoryService';
import { getProducts } from '@/lib/productService';
import { Discount, DiscountType, DiscountTrigger, DiscountTargetType, Category, Product } from '@/types';
import { useToast } from '@/context/ToastContext';
import FlashDealCountdown from '@/components/storefront/FlashDealCountdown';

export default function AdminDiscountsPage() {
  const { success, error, info } = useToast();
  const [discounts, setDiscounts] = useState<Discount[]>(DEFAULT_DISCOUNTS);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'flash' | 'auto' | 'coupon'>('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [titleArabic, setTitleArabic] = useState('');
  const [trigger, setTrigger] = useState<DiscountTrigger>('auto');
  const [targetType, setTargetType] = useState<DiscountTargetType>('all');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<DiscountType>('percentage');
  const [value, setValue] = useState<number>(20);
  const [minSubtotal, setMinSubtotal] = useState<number>(0);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | undefined>(undefined);
  const [applicableCategory, setApplicableCategory] = useState<string>('all');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    Promise.all([getDiscounts(), getCategories(), getProducts('all')])
      .then(([discs, cats, prods]) => {
        if (isMounted) {
          setDiscounts(discs);
          if (cats && cats.length > 0) setCategories(cats);
          if (prods && prods.length > 0) {
            setProducts(prods);
            setSelectedProductId(prods[0].id);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load discounts, categories, or products:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Format date to datetime-local input string YYYY-MM-DDTHH:mm
  const toDateTimeLocal = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const applyDurationPreset = (hours: number) => {
    const start = startTime ? new Date(startTime) : new Date();
    const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
    setStartTime(toDateTimeLocal(start));
    setEndTime(toDateTimeLocal(end));
  };

  const openAddModal = (initialTarget: DiscountTargetType = 'all') => {
    setEditingDiscount(null);
    setTargetType(initialTarget);
    setTrigger('auto');
    setType('percentage');
    setValue(initialTarget === 'product' ? 25 : 15);
    setMinSubtotal(0);
    setMaxDiscountAmount(undefined);
    setApplicableCategory('all');
    setIsActive(true);

    const now = new Date();
    const future = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48h default
    setStartTime(toDateTimeLocal(now));
    setEndTime(toDateTimeLocal(future));

    if (initialTarget === 'product') {
      const defaultProd = products[0];
      setSelectedProductId(defaultProd ? defaultProd.id : '');
      setTitle(defaultProd ? `⚡ Flash Deal: 25% OFF ${defaultProd.name}` : '⚡ Single Item Flash Deal');
      setTitleArabic(defaultProd ? `عرض محدود: خصم 25% على ${defaultProd.name}` : 'عرض محدود على القطعة');
    } else {
      setTitle('');
      setTitleArabic('');
      setCode('');
    }

    setModalOpen(true);
  };

  const openEditModal = (d: Discount) => {
    setEditingDiscount(d);
    setTitle(d.title);
    setTitleArabic(d.titleArabic || '');
    setTrigger(d.trigger);
    setTargetType(d.targetType || (d.applicableProductId ? 'product' : 'all'));
    setSelectedProductId(d.applicableProductId || (products[0]?.id || ''));
    setCode(d.code || '');
    setType(d.type);
    setValue(d.value);
    setMinSubtotal(d.minSubtotal || 0);
    setMaxDiscountAmount(d.maxDiscountAmount);
    setApplicableCategory(d.applicableCategory || 'all');
    setStartTime(d.startTime ? toDateTimeLocal(new Date(d.startTime)) : '');
    setEndTime(d.endTime ? toDateTimeLocal(new Date(d.endTime)) : '');
    setIsActive(d.isActive);
    setModalOpen(true);
  };

  const handleProductSelectChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod && !editingDiscount) {
      setTitle(`⚡ Flash Deal: ${value}% OFF ${prod.name}`);
      setTitleArabic(`عرض محدود: خصم ${value}% على ${prod.name}`);
    }
  };

  const handleToggleActive = async (discountId: string) => {
    const updated = discounts.map((d) =>
      d.id === discountId ? { ...d, isActive: !d.isActive } : d
    );
    setDiscounts(updated);
    const target = updated.find((d) => d.id === discountId);
    if (target) {
      await saveDiscount(target);
      info(`Discount "${target.title}" is now ${target.isActive ? 'Active' : 'Paused'}`);
    }
  };

  const handleDelete = async (discountId: string, discTitle: string) => {
    if (confirm(`Delete discount rule "${discTitle}"?`)) {
      try {
        const updated = await deleteDiscount(discountId);
        setDiscounts(updated);
        success(`Discount "${discTitle}" deleted.`);
      } catch (err: unknown) {
        console.error(err);
        error('Failed to delete discount');
      }
    }
  };

  const handleCopyCode = (couponCode: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(couponCode);
      success(`Code '${couponCode}' copied to clipboard!`, 'Code Copied');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      error('Discount title is required');
      return;
    }

    if (trigger === 'coupon' && !code.trim()) {
      error('Promo Code is required for coupon discounts');
      return;
    }

    const selectedProd = products.find((p) => p.id === selectedProductId);

    const payload: Discount = {
      id: editingDiscount ? editingDiscount.id : `disc-${Date.now()}`,
      title: title.trim(),
      titleArabic: titleArabic.trim() || title.trim(),
      trigger,
      targetType,
      applicableProductId: targetType === 'product' ? selectedProductId : undefined,
      applicableProductName: targetType === 'product' && selectedProd ? selectedProd.name : undefined,
      applicableProductImage: targetType === 'product' && selectedProd ? selectedProd.imageUrls[0] : undefined,
      code: trigger === 'coupon' ? code.trim().toUpperCase() : undefined,
      type,
      value: Number(value),
      minSubtotal: Number(minSubtotal) || 0,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
      applicableCategory: targetType === 'category' ? applicableCategory : 'all',
      startTime: startTime ? new Date(startTime).toISOString() : undefined,
      endTime: endTime ? new Date(endTime).toISOString() : undefined,
      isActive,
      usageCount: editingDiscount?.usageCount || 0,
    };

    setSaving(true);
    try {
      const updated = await saveDiscount(payload);
      setDiscounts(updated);
      setModalOpen(false);
      success(
        editingDiscount ? `Discount "${payload.title}" updated!` : `Discount "${payload.title}" created successfully!`
      );
    } catch (err: unknown) {
      console.error(err);
      error('Failed to save discount');
    } finally {
      setSaving(false);
    }
  };

  const filteredDiscounts = discounts.filter((d) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      d.title.toLowerCase().includes(q) ||
      (d.titleArabic && d.titleArabic.includes(searchQuery)) ||
      (d.code && d.code.toLowerCase().includes(q)) ||
      (d.applicableProductName && d.applicableProductName.toLowerCase().includes(q));

    let matchesFilter = true;
    if (filterType === 'flash') matchesFilter = d.targetType === 'product' || Boolean(d.applicableProductId);
    else if (filterType === 'auto') matchesFilter = d.trigger === 'auto' && d.targetType !== 'product';
    else if (filterType === 'coupon') matchesFilter = d.trigger === 'coupon';

    return matchesSearch && matchesFilter;
  });

  const flashCount = discounts.filter((d) => (d.targetType === 'product' || Boolean(d.applicableProductId)) && d.isActive).length;
  const autoCount = discounts.filter((d) => d.trigger === 'auto' && d.targetType !== 'product' && d.isActive).length;
  const couponCount = discounts.filter((d) => d.trigger === 'coupon' && d.isActive).length;
  const totalUsage = discounts.reduce((sum, d) => sum + (d.usageCount || 0), 0);

  // Selected product snapshot for modal calculation
  const modalProd = products.find((p) => p.id === selectedProductId);
  const calculatedDealPrice = modalProd
    ? type === 'percentage'
      ? modalProd.price - (modalProd.price * value) / 100
      : Math.max(0, modalProd.price - value)
    : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#333333] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-[#DCC9A6]">
              Marketing & Conversions
            </span>
            <span className="text-[10px] bg-black text-[#DCC9A6] border border-[#333333] px-2 py-0.5 font-mono font-bold">
              {flashCount} Flash Deals • {autoCount} Cart Auto • {couponCount} Codes
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
            Discounts & Timed Flash Deals
          </h1>
          <p className="text-xs text-[#8E8A85] font-sans mt-0.5">
            Configure single-item timed flash deals with client countdowns, automatic cart discounts, and promo vouchers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => openAddModal('product')}
            className="inline-flex items-center gap-1.5 bg-[#B67355] text-white px-4 py-2 text-xs uppercase font-extrabold tracking-wider hover:bg-white hover:text-[#1F1F1F] transition-all shadow-lg active:scale-95 border border-[#B67355]"
          >
            <Zap className="w-4 h-4 fill-current animate-pulse" />
            <span>+ Single Item Flash Deal</span>
          </button>

          <button
            type="button"
            onClick={() => openAddModal('all')}
            className="inline-flex items-center gap-2 bg-[#DCC9A6] text-[#1F1F1F] px-4 py-2 text-xs uppercase font-extrabold tracking-wider hover:bg-white transition-all shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Discount Rule</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Flash Deals Card */}
        <div className="bg-[#1F1F1F] border-2 border-[#B67355] p-4 space-y-1 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-[#DCC9A6] uppercase tracking-wider font-semibold">
            <span className="flex items-center gap-1.5 font-bold">
              <Zap className="w-4 h-4 text-[#E5A84B]" />
              <span>Single Item Flash Deals</span>
            </span>
            <span className="text-[9px] bg-[#B67355] text-white px-1.5 py-0.5 rounded font-mono">
              Live Timer
            </span>
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-white">
            {flashCount} Active
          </p>
          <p className="text-[10px] text-[#8E8A85]">
            Shows digital countdown timer on item cards & product page.
          </p>
        </div>

        {/* Auto Cart */}
        <div className="bg-[#1F1F1F] border border-[#333333] p-4 space-y-1 shadow-md">
          <span className="text-xs text-[#8E8A85] uppercase tracking-wider font-semibold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#DCC9A6]" />
            <span>Auto Cart Discounts</span>
          </span>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-white">
            {autoCount} Active
          </p>
          <p className="text-[10px] text-[#8E8A85]">
            Threshold spend discounts applied directly in bag.
          </p>
        </div>

        {/* Coupon Codes */}
        <div className="bg-[#1F1F1F] border border-[#333333] p-4 space-y-1 shadow-md">
          <span className="text-xs text-[#8E8A85] uppercase tracking-wider font-semibold flex items-center gap-1.5">
            <Ticket className="w-4 h-4 text-[#DCC9A6]" />
            <span>Promo Vouchers</span>
          </span>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-white">
            {couponCount} Active
          </p>
          <p className="text-[10px] text-[#8E8A85]">
            Voucher codes entered at checkout.
          </p>
        </div>

        {/* Total Redemptions */}
        <div className="bg-[#1F1F1F] border border-[#333333] p-4 space-y-1 shadow-md">
          <span className="text-xs text-[#8E8A85] uppercase tracking-wider font-semibold flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-[#DCC9A6]" />
            <span>Total Redemptions</span>
          </span>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-white font-mono">
            {totalUsage} Orders
          </p>
          <p className="text-[10px] text-[#8E8A85]">
            Completed customer orders with promotions.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#1F1F1F] border border-[#333333] p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Trigger Tabs */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Rules' },
            { id: 'flash', label: '⚡ Single Item Flash Deals' },
            { id: 'auto', label: '✨ Auto-Applied' },
            { id: 'coupon', label: '🎟️ Promo Codes' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as 'all' | 'flash' | 'auto' | 'coupon')}
              className={`px-3 py-1.5 text-xs font-sans uppercase tracking-wider font-semibold transition-all ${
                filterType === tab.id
                  ? 'bg-[#B67355] text-white shadow'
                  : 'bg-[#141414] text-[#8E8A85] border border-[#333333] hover:text-[#DCC9A6]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search discounts, items, codes..."
            className="w-full bg-[#141414] border border-[#333333] text-white px-3.5 py-2 pl-9 text-xs focus:outline-none focus:border-[#DCC9A6]"
          />
          <Search className="w-4 h-4 text-[#8E8A85] absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Discounts Table / Cards */}
      <div className="bg-[#1F1F1F] border border-[#333333] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300 border-collapse">
            <thead>
              <tr className="bg-[#141414] border-b border-[#333333] text-[11px] uppercase tracking-wider text-[#DCC9A6] font-bold">
                <th className="py-3 px-4 w-12 text-center">Status</th>
                <th className="py-3 px-4">Promotion / Flash Item</th>
                <th className="py-3 px-4 text-center">Type / Scope</th>
                <th className="py-3 px-4 text-center">Discount Value</th>
                <th className="py-3 px-4">Countdown / Schedule</th>
                <th className="py-3 px-4 text-center">Redeemed</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#333333]/70">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500">
                    <div className="w-8 h-8 border-2 border-[#DCC9A6] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading discount rules...</span>
                  </td>
                </tr>
              ) : filteredDiscounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500">
                    No discount rules found matching your filter.
                  </td>
                </tr>
              ) : (
                filteredDiscounts.map((disc) => {
                  const isItemDeal = disc.targetType === 'product' || Boolean(disc.applicableProductId);

                  return (
                    <tr
                      key={disc.id}
                      className={`hover:bg-[#252525] transition-colors ${
                        !disc.isActive ? 'opacity-40 bg-black/20' : ''
                      }`}
                    >
                      {/* Active Toggle Switch */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(disc.id)}
                          title={disc.isActive ? 'Active (Click to pause)' : 'Paused (Click to activate)'}
                          className="text-neutral-400 hover:text-white"
                        >
                          {disc.isActive ? (
                            <ToggleRight className="w-6 h-6 text-emerald-400" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-neutral-600" />
                          )}
                        </button>
                      </td>

                      {/* Title & Product info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {isItemDeal && disc.applicableProductImage && (
                            <div className="relative w-10 h-12 bg-black border border-[#333333] shrink-0 overflow-hidden rounded">
                              <Image
                                src={disc.applicableProductImage}
                                alt={disc.applicableProductName || 'Item'}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-white text-sm font-sans block">
                              {disc.title}
                            </span>
                            {disc.applicableProductName && (
                              <span className="text-[11px] text-[#B67355] font-semibold block">
                                Target Item: {disc.applicableProductName}
                              </span>
                            )}
                            {disc.titleArabic && (
                              <span className="text-xs text-[#DCC9A6] font-sans block mt-0.5" dir="rtl">
                                {disc.titleArabic}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Scope & Trigger */}
                      <td className="py-3.5 px-4 text-center">
                        {isItemDeal ? (
                          <span className="inline-flex items-center gap-1 bg-[#B67355]/30 border border-[#B67355] text-[#E5A84B] px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded">
                            <Zap className="w-3 h-3 fill-current animate-pulse" />
                            Single Item Flash
                          </span>
                        ) : disc.trigger === 'auto' ? (
                          <span className="inline-flex items-center gap-1 bg-amber-950/80 border border-amber-600 text-amber-300 px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded">
                            <Sparkles className="w-3 h-3" />
                            Auto-Apply
                          </span>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 bg-black border border-[#DCC9A6]/60 px-2.5 py-1 rounded">
                            <span className="font-mono font-bold text-xs text-[#DCC9A6] tracking-wider">
                              {disc.code}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(disc.code || '')}
                              className="text-neutral-400 hover:text-white"
                              title="Copy code"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Value */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-serif font-bold text-sm text-[#DCC9A6]">
                          {disc.type === 'percentage'
                            ? `${disc.value}% OFF`
                            : disc.type === 'fixed_amount'
                            ? `EGP ${disc.value.toFixed(2)} OFF`
                            : 'Free Delivery'}
                        </span>
                      </td>

                      {/* Countdown & Timings */}
                      <td className="py-3.5 px-4 text-xs">
                        {disc.endTime ? (
                          <div className="space-y-1">
                            <FlashDealCountdown compact={true} endTime={disc.endTime} />
                            <span className="text-[10px] text-[#8E8A85] block font-mono">
                              Until {new Date(disc.endTime).toLocaleDateString()} {new Date(disc.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-neutral-400">
                            Permanent active rule
                          </span>
                        )}
                      </td>

                      {/* Usage */}
                      <td className="py-3.5 px-4 text-center font-mono text-xs">
                        {disc.usageCount || 0} uses
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(disc)}
                            className="p-1.5 bg-[#141414] hover:bg-[#DCC9A6] hover:text-[#1F1F1F] border border-[#333333] rounded transition-colors"
                            title="Edit discount"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(disc.id, disc.title)}
                            className="p-1.5 bg-[#141414] hover:bg-red-900 border border-[#333333] hover:text-red-200 rounded transition-colors"
                            title="Delete discount"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT DISCOUNT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-xl bg-[#181818] border-2 border-[#DCC9A6] p-6 sm:p-8 shadow-2xl text-white rounded-xl">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif text-xl font-bold text-white mb-1">
              {editingDiscount
                ? `Edit Promotion: ${editingDiscount.title}`
                : targetType === 'product'
                ? '⚡ Create Single Item Flash Deal (With Countdown)'
                : 'Create New Discount Rule'}
            </h3>
            <p className="text-xs text-[#8E8A85] mb-6 font-sans">
              Choose the item, set the discount amount, time duration, and client countdown timer.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
              {/* Scope Target Selector (Storewide vs Category vs Single Item) */}
              <div>
                <label className="block text-[11px] uppercase text-[#DCC9A6] mb-1.5 font-semibold">
                  1. Promotion Target (Scope) *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetType('product');
                      setTrigger('auto');
                    }}
                    className={`p-2.5 border text-center rounded transition-all ${
                      targetType === 'product'
                        ? 'border-[#B67355] bg-[#B67355]/20 text-white font-bold'
                        : 'border-[#333333] bg-[#141414] text-neutral-400 hover:border-neutral-600'
                    }`}
                  >
                    <Zap className="w-4 h-4 mx-auto mb-1 text-[#E5A84B]" />
                    <span className="block text-[11px]">⚡ Single Item (Flash)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('all')}
                    className={`p-2.5 border text-center rounded transition-all ${
                      targetType === 'all'
                        ? 'border-[#DCC9A6] bg-[#DCC9A6]/20 text-white font-bold'
                        : 'border-[#333333] bg-[#141414] text-neutral-400 hover:border-neutral-600'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 mx-auto mb-1 text-[#DCC9A6]" />
                    <span className="block text-[11px]">Storewide / Cart</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('category')}
                    className={`p-2.5 border text-center rounded transition-all ${
                      targetType === 'category'
                        ? 'border-[#DCC9A6] bg-[#DCC9A6]/20 text-white font-bold'
                        : 'border-[#333333] bg-[#141414] text-neutral-400 hover:border-neutral-600'
                    }`}
                  >
                    <Package className="w-4 h-4 mx-auto mb-1 text-[#DCC9A6]" />
                    <span className="block text-[11px]">Specific Category</span>
                  </button>
                </div>
              </div>

              {/* SINGLE PRODUCT PICKER (If targetType === 'product') */}
              {targetType === 'product' && (
                <div className="bg-[#141414] border border-[#B67355] p-3.5 rounded-lg space-y-3">
                  <label className="block text-[11px] uppercase text-[#E5A84B] font-bold">
                    Select Target Product for Flash Deal *
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => handleProductSelectChange(e.target.value)}
                    className="w-full bg-[#1F1F1F] border border-[#333333] text-white p-2.5 text-xs font-sans focus:outline-none focus:border-[#E5A84B]"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — Base Price: EGP {p.price} ({p.stockQuantity} in stock)
                      </option>
                    ))}
                  </select>

                  {/* Live Item Preview with Deal Price Calculator */}
                  {modalProd && (
                    <div className="flex items-center gap-3 bg-[#1F1F1F] p-2.5 rounded border border-[#333333]">
                      <div className="relative w-12 h-16 bg-black rounded overflow-hidden shrink-0 border border-[#333333]">
                        <Image
                          src={modalProd.imageUrls[0] || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600'}
                          alt={modalProd.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 text-xs">
                        <p className="font-bold text-white truncate">{modalProd.name}</p>
                        <p className="text-[11px] text-[#8E8A85]">
                          Original: <span className="line-through">EGP {modalProd.price.toFixed(2)}</span>
                        </p>
                        <p className="text-xs text-[#E5A84B] font-bold">
                          Flash Deal Price: EGP {calculatedDealPrice.toFixed(2)}{' '}
                          <span className="text-[10px] text-emerald-400 font-normal">
                            (Save EGP {(modalProd.price - calculatedDealPrice).toFixed(2)})
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Specific Category Selection (If targetType === 'category') */}
              {targetType === 'category' && (
                <div>
                  <label className="block text-[11px] uppercase text-[#DCC9A6] mb-1 font-semibold">
                    Applicable Category *
                  </label>
                  <select
                    value={applicableCategory}
                    onChange={(e) => setApplicableCategory(e.target.value)}
                    className="w-full bg-[#141414] border border-[#333333] text-white p-2.5 focus:outline-none focus:border-[#DCC9A6]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name} ({c.nameArabic})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Titles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase text-[#DCC9A6] mb-1 font-semibold">
                    Title (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Flash Deal: 25% OFF Linen Set"
                    className="w-full bg-[#141414] border border-[#333333] text-white p-2.5 focus:outline-none focus:border-[#DCC9A6]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase text-[#DCC9A6] mb-1 font-semibold">
                    Title (Arabic)
                  </label>
                  <input
                    type="text"
                    value={titleArabic}
                    onChange={(e) => setTitleArabic(e.target.value)}
                    placeholder="e.g. عرض محدود: خصم 25%"
                    dir="rtl"
                    className="w-full bg-[#141414] border border-[#333333] text-white p-2.5 focus:outline-none focus:border-[#DCC9A6]"
                  />
                </div>
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase text-[#DCC9A6] mb-1 font-semibold">
                    Discount Type *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as DiscountType)}
                    className="w-full bg-[#141414] border border-[#333333] text-white p-2.5 focus:outline-none focus:border-[#DCC9A6]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_amount">Fixed Amount (EGP)</option>
                    {targetType !== 'product' && <option value="free_shipping">Free Shipping</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] uppercase text-[#DCC9A6] mb-1 font-semibold">
                    Discount Value ({type === 'percentage' ? '%' : 'EGP'}) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-full bg-[#141414] border border-[#333333] text-white p-2.5 font-bold focus:outline-none focus:border-[#DCC9A6]"
                  />
                </div>
              </div>

              {/* TIMING & COUNTDOWN CONTROLS */}
              <div className="bg-[#141414] border border-[#333333] p-3.5 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] uppercase text-[#DCC9A6] font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Duration & Live Countdown Schedule</span>
                  </label>
                  <span className="text-[10px] text-neutral-400">
                    Quick Presets:
                  </span>
                </div>

                {/* Duration Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '+6 Hours', hours: 6 },
                    { label: '+12 Hours', hours: 12 },
                    { label: '+24 Hours (1 Day)', hours: 24 },
                    { label: '+48 Hours (2 Days)', hours: 48 },
                    { label: '+3 Days', hours: 72 },
                    { label: '+7 Days (1 Week)', hours: 168 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => applyDurationPreset(p.hours)}
                      className="px-2 py-1 bg-[#222222] hover:bg-[#B67355] text-neutral-300 hover:text-white text-[10px] font-mono rounded border border-[#333333] transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] uppercase text-neutral-400 mb-1">
                      Start Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-[#1F1F1F] border border-[#333333] text-white p-2 text-xs focus:outline-none focus:border-[#DCC9A6]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-neutral-400 mb-1">
                      End Date & Time (Countdown Expiration)
                    </label>
                    <input
                      type="datetime-local"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-[#1F1F1F] border border-[#333333] text-white p-2 text-xs focus:outline-none focus:border-[#DCC9A6]"
                    />
                  </div>
                </div>
              </div>

              {/* Status Switch */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="active-disc-modal"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 accent-[#DCC9A6]"
                />
                <label htmlFor="active-disc-modal" className="text-xs text-neutral-300 font-medium">
                  Flash Deal is Active & Customer Countdown is Live
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#333333]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-[#2A2A2A] text-neutral-300 hover:text-white rounded"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-[#DCC9A6] text-[#1F1F1F] font-bold uppercase tracking-wider hover:bg-white transition-colors"
                >
                  {saving ? 'Saving...' : editingDiscount ? 'Save Changes' : 'Launch Flash Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
