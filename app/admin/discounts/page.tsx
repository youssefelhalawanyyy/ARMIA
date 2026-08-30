'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import {
  getDiscounts,
  saveDiscount,
  deleteDiscount,
  DEFAULT_DISCOUNTS,
} from '@/lib/discountService';
import { getCategories, DEFAULT_CATEGORIES } from '@/lib/categoryService';
import { Discount, DiscountType, DiscountTrigger, Category } from '@/types';
import { useToast } from '@/context/ToastContext';

export default function AdminDiscountsPage() {
  const { success, error, info } = useToast();
  const [discounts, setDiscounts] = useState<Discount[]>(DEFAULT_DISCOUNTS);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [triggerFilter, setTriggerFilter] = useState<'all' | 'auto' | 'coupon'>('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [titleArabic, setTitleArabic] = useState('');
  const [trigger, setTrigger] = useState<DiscountTrigger>('auto');
  const [code, setCode] = useState('');
  const [type, setType] = useState<DiscountType>('percentage');
  const [value, setValue] = useState<number>(15);
  const [minSubtotal, setMinSubtotal] = useState<number>(0);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | undefined>(undefined);
  const [applicableCategory, setApplicableCategory] = useState<string>('all');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    Promise.all([getDiscounts(), getCategories()])
      .then(([discs, cats]) => {
        if (isMounted) {
          setDiscounts(discs);
          if (cats && cats.length > 0) setCategories(cats);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load discounts or categories:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const openAddModal = () => {
    setEditingDiscount(null);
    setTitle('');
    setTitleArabic('');
    setTrigger('auto');
    setCode('');
    setType('percentage');
    setValue(15);
    setMinSubtotal(1500);
    setMaxDiscountAmount(undefined);
    setApplicableCategory('all');
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (d: Discount) => {
    setEditingDiscount(d);
    setTitle(d.title);
    setTitleArabic(d.titleArabic || '');
    setTrigger(d.trigger);
    setCode(d.code || '');
    setType(d.type);
    setValue(d.value);
    setMinSubtotal(d.minSubtotal || 0);
    setMaxDiscountAmount(d.maxDiscountAmount);
    setApplicableCategory(d.applicableCategory || 'all');
    setIsActive(d.isActive);
    setModalOpen(true);
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

    const payload: Discount = {
      id: editingDiscount ? editingDiscount.id : `disc-${Date.now()}`,
      title: title.trim(),
      titleArabic: titleArabic.trim() || title.trim(),
      trigger,
      code: trigger === 'coupon' ? code.trim().toUpperCase() : undefined,
      type,
      value: Number(value),
      minSubtotal: Number(minSubtotal) || 0,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
      applicableCategory,
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
      (d.code && d.code.toLowerCase().includes(q));

    const matchesTrigger =
      triggerFilter === 'all' || d.trigger === triggerFilter;

    return matchesSearch && matchesTrigger;
  });

  const autoCount = discounts.filter((d) => d.trigger === 'auto' && d.isActive).length;
  const couponCount = discounts.filter((d) => d.trigger === 'coupon' && d.isActive).length;
  const totalUsage = discounts.reduce((sum, d) => sum + (d.usageCount || 0), 0);

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
              {autoCount} Auto / {couponCount} Codes
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
            Discounts & Auto-Promotions
          </h1>
          <p className="text-xs text-[#8E8A85] font-sans mt-0.5">
            Configure automatic threshold discounts and coupon vouchers that apply seamlessly at checkout.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 bg-[#DCC9A6] text-[#1F1F1F] px-5 py-2 text-xs uppercase font-extrabold tracking-wider hover:bg-white transition-all shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Discount Rule</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#1F1F1F] border border-[#333333] p-5 space-y-1.5 shadow-md">
          <span className="text-xs text-[#8E8A85] uppercase tracking-wider font-semibold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#DCC9A6]" />
            <span>Automatic Cart Discounts</span>
          </span>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-white">
            {autoCount} Active
          </p>
          <p className="text-[10px] text-[#8E8A85]">
            Applies directly to customer cart when spending threshold is met.
          </p>
        </div>

        <div className="bg-[#1F1F1F] border border-[#333333] p-5 space-y-1.5 shadow-md">
          <span className="text-xs text-[#8E8A85] uppercase tracking-wider font-semibold flex items-center gap-1.5">
            <Ticket className="w-4 h-4 text-[#B67355]" />
            <span>Promo & Coupon Codes</span>
          </span>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-white">
            {couponCount} Active
          </p>
          <p className="text-[10px] text-[#8E8A85]">
            Applied by customers entering promo vouchers at checkout.
          </p>
        </div>

        <div className="bg-[#1F1F1F] border border-[#333333] p-5 space-y-1.5 shadow-md">
          <span className="text-xs text-[#8E8A85] uppercase tracking-wider font-semibold flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-[#DCC9A6]" />
            <span>Total Campaign Redemptions</span>
          </span>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-white font-mono">
            {totalUsage} Orders
          </p>
          <p className="text-[10px] text-[#8E8A85]">
            Total orders completed utilizing boutique promotions.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#1F1F1F] border border-[#333333] p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Trigger Tabs */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Rules' },
            { id: 'auto', label: '✨ Auto-Applied' },
            { id: 'coupon', label: '🎟️ Promo Codes' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTriggerFilter(tab.id as 'all' | 'auto' | 'coupon')}
              className={`px-3 py-1.5 text-xs font-sans uppercase tracking-wider font-semibold transition-all ${
                triggerFilter === tab.id
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
            placeholder="Search discounts, codes..."
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
                <th className="py-3 px-4">Promotion Name</th>
                <th className="py-3 px-4 text-center">Trigger Mode</th>
                <th className="py-3 px-4 text-center">Discount Value</th>
                <th className="py-3 px-4">Conditions</th>
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
                filteredDiscounts.map((disc) => (
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

                    {/* Title & Arabic */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-white text-sm font-sans block">
                          {disc.title}
                        </span>
                        {disc.titleArabic && (
                          <span className="text-xs text-[#DCC9A6] font-sans block mt-0.5" dir="rtl">
                            {disc.titleArabic}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Trigger: Auto vs Coupon */}
                    <td className="py-3.5 px-4 text-center">
                      {disc.trigger === 'auto' ? (
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

                    {/* Conditions */}
                    <td className="py-3.5 px-4 text-xs">
                      <div className="space-y-0.5 text-neutral-400">
                        {disc.minSubtotal ? (
                          <p>
                            Min spend: <strong className="text-neutral-200">EGP {disc.minSubtotal}</strong>
                          </p>
                        ) : (
                          <p>No minimum spend</p>
                        )}
                        {disc.applicableCategory && disc.applicableCategory !== 'all' && (
                          <p className="text-[11px] text-[#B67355]">
                            Category: <strong>{disc.applicableCategory}</strong>
                          </p>
                        )}
                        {disc.maxDiscountAmount && (
                          <p className="text-[10px] text-neutral-500">
                            Max Cap: EGP {disc.maxDiscountAmount}
                          </p>
                        )}
                      </div>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT DISCOUNT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#181818] border-2 border-[#DCC9A6] p-6 sm:p-8 shadow-2xl text-white">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif text-xl font-bold text-white mb-1">
              {editingDiscount ? `Edit: ${editingDiscount.title}` : 'Create New Discount Rule'}
            </h3>
            <p className="text-xs text-[#8E8A85] mb-6 font-sans">
              Configure automatic cart discounts or promo codes with spend thresholds.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
              {/* Trigger Mode Selector */}
              <div>
                <label className="block text-[11px] uppercase text-[#DCC9A6] mb-1.5 font-semibold">
                  How is this discount applied? *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTrigger('auto')}
                    className={`p-3 border text-left rounded transition-all ${
                      trigger === 'auto'
                        ? 'border-[#DCC9A6] bg-[#DCC9A6]/10 text-white'
                        : 'border-[#333333] bg-[#141414] text-neutral-400 hover:border-neutral-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-[#DCC9A6]">
                      <Sparkles className="w-4 h-4" />
                      <span>✨ Auto-Applied</span>
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-1">
                      Applies automatically in cart when conditions are met.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTrigger('coupon')}
                    className={`p-3 border text-left rounded transition-all ${
                      trigger === 'coupon'
                        ? 'border-[#DCC9A6] bg-[#DCC9A6]/10 text-white'
                        : 'border-[#333333] bg-[#141414] text-neutral-400 hover:border-neutral-600'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-[#DCC9A6]">
                      <Ticket className="w-4 h-4" />
                      <span>🎟️ Promo Code</span>
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-1">
                      Customer must enter a voucher code at checkout.
                    </p>
                  </button>
                </div>
              </div>

              {/* Title & Arabic */}
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
                    placeholder="e.g. VIP 15% Auto Discount"
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
                    placeholder="e.g. خصم مميز 15%"
                    dir="rtl"
                    className="w-full bg-[#141414] border border-[#333333] text-white p-2.5 focus:outline-none focus:border-[#DCC9A6]"
                  />
                </div>
              </div>

              {/* Coupon Code (Only if trigger === 'coupon') */}
              {trigger === 'coupon' && (
                <div>
                  <label className="block text-[11px] uppercase text-[#DCC9A6] mb-1 font-semibold">
                    Promo Code Voucher *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. ARMIA15, SUMMER20, VIP100"
                    className="w-full bg-[#141414] border border-[#333333] text-white p-2.5 font-mono uppercase font-bold text-sm tracking-wider focus:outline-none focus:border-[#DCC9A6]"
                  />
                </div>
              )}

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
                    <option value="free_shipping">Free Shipping</option>
                  </select>
                </div>

                {type !== 'free_shipping' && (
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
                )}
              </div>

              {/* Minimum Spend & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase text-[#DCC9A6] mb-1 font-semibold">
                    Minimum Cart Subtotal (EGP)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={minSubtotal}
                    onChange={(e) => setMinSubtotal(Number(e.target.value))}
                    placeholder="0 for no minimum"
                    className="w-full bg-[#141414] border border-[#333333] text-white p-2.5 focus:outline-none focus:border-[#DCC9A6]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase text-[#DCC9A6] mb-1 font-semibold">
                    Applicable Category
                  </label>
                  <select
                    value={applicableCategory}
                    onChange={(e) => setApplicableCategory(e.target.value)}
                    className="w-full bg-[#141414] border border-[#333333] text-white p-2.5 focus:outline-none focus:border-[#DCC9A6]"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name} ({c.nameArabic})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Max Discount Cap (for percentage discounts) */}
              {type === 'percentage' && (
                <div>
                  <label className="block text-[11px] uppercase text-[#DCC9A6] mb-1 font-semibold">
                    Maximum Discount Limit (EGP Cap - Optional)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={maxDiscountAmount || ''}
                    onChange={(e) =>
                      setMaxDiscountAmount(e.target.value ? Number(e.target.value) : undefined)
                    }
                    placeholder="e.g. 500 (Leaves uncapped if blank)"
                    className="w-full bg-[#141414] border border-[#333333] text-white p-2.5 focus:outline-none focus:border-[#DCC9A6]"
                  />
                </div>
              )}

              {/* Status Switch */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="active-disc"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 accent-[#DCC9A6]"
                />
                <label htmlFor="active-disc" className="text-xs text-neutral-300 font-medium">
                  Rule is Active & Ready for Customers
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
                  {saving ? 'Saving...' : editingDiscount ? 'Save Changes' : 'Create Promotion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
