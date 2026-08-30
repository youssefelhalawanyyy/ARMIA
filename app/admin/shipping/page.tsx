'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  Search,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Gift,
} from 'lucide-react';
import {
  getShippingSettings,
  saveShippingSettings,
  DEFAULT_SHIPPING_SETTINGS,
} from '@/lib/shippingService';
import { ShippingSettings, ShippingZone } from '@/types';
import { useToast } from '@/context/ToastContext';

export default function AdminShippingPage() {
  const { success, error, info } = useToast();
  const [settings, setSettings] = useState<ShippingSettings>(DEFAULT_SHIPPING_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Add new zone modal / state
  const [newGovName, setNewGovName] = useState('');
  const [newGovArabic, setNewGovArabic] = useState('');
  const [newRate, setNewRate] = useState(60);
  const [newDays, setNewDays] = useState('2-3 Days');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getShippingSettings()
      .then((data) => {
        if (isMounted) {
          setSettings(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load shipping settings:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRateChange = (zoneId: string, newRateVal: number) => {
    setSettings((prev) => ({
      ...prev,
      zones: prev.zones.map((z) => (z.id === zoneId ? { ...z, rate: Math.max(0, newRateVal) } : z)),
    }));
  };

  const handleDaysChange = (zoneId: string, newDaysVal: string) => {
    setSettings((prev) => ({
      ...prev,
      zones: prev.zones.map((z) => (z.id === zoneId ? { ...z, estimatedDays: newDaysVal } : z)),
    }));
  };

  const handleToggleActive = (zoneId: string) => {
    setSettings((prev) => ({
      ...prev,
      zones: prev.zones.map((z) => (z.id === zoneId ? { ...z, isActive: !z.isActive } : z)),
    }));
  };

  const handleDeleteZone = (zoneId: string) => {
    setSettings((prev) => ({
      ...prev,
      zones: prev.zones.filter((z) => z.id !== zoneId),
    }));
    info('Zone removed from list. Click "Save Changes" to apply.');
  };

  const handleAddZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGovName.trim()) {
      error('Governorate or city name is required');
      return;
    }

    const id = newGovName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newZone: ShippingZone = {
      id: `${id}-${Date.now()}`,
      governorate: newGovName.trim(),
      governorateArabic: newGovArabic.trim() || newGovName.trim(),
      rate: Number(newRate),
      estimatedDays: newDays.trim() || '2-3 Days',
      isActive: true,
    };

    setSettings((prev) => ({
      ...prev,
      zones: [newZone, ...prev.zones],
    }));

    setNewGovName('');
    setNewGovArabic('');
    setNewRate(60);
    setShowAddForm(false);
    success(`Zone "${newZone.governorate}" added. Remember to click "Save Changes".`);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await saveShippingSettings(settings);
      success('Shipping rates & delivery cities saved successfully!', 'Settings Updated');
    } catch (err: unknown) {
      console.error(err);
      error('Failed to save shipping settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Reset all delivery rates and governorates to Egypt courier standard rates?')) {
      setSettings(DEFAULT_SHIPPING_SETTINGS);
      info('Reset to default Egyptian rates. Click "Save Changes" to publish.');
    }
  };

  // Bulk rate adjustment
  const handleBulkAdjust = (delta: number) => {
    setSettings((prev) => ({
      ...prev,
      zones: prev.zones.map((z) => ({
        ...z,
        rate: Math.max(0, z.rate + delta),
      })),
    }));
    info(`Adjusted all active delivery rates by ${delta > 0 ? `+${delta}` : delta} EGP`);
  };

  const filteredZones = settings.zones.filter((z) => {
    const q = searchQuery.toLowerCase();
    return (
      z.governorate.toLowerCase().includes(q) ||
      z.governorateArabic.includes(searchQuery) ||
      z.rate.toString().includes(q)
    );
  });

  const activeZonesCount = settings.zones.filter((z) => z.isActive).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#333333] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-[#DCC9A6]">
              Boutique Logistics
            </span>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 font-mono font-bold">
              {activeZonesCount} Active Cities
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
            Cities & Delivery Rates
          </h1>
          <p className="text-xs text-[#8E8A85] font-sans mt-0.5">
            Adjust shipping fees and active delivery coverage across Egyptian Governorates and cities.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 bg-[#1F1F1F] border border-[#333333] text-neutral-300 hover:text-white px-3 py-2 text-xs font-semibold rounded hover:border-[#DCC9A6] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Standards</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-[#DCC9A6] text-[#1F1F1F] px-5 py-2 text-xs uppercase font-extrabold tracking-wider hover:bg-white transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
          </button>
        </div>
      </div>

      {/* Global Rules Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Free Shipping Rule */}
        <div className="bg-[#1F1F1F] border border-[#333333] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-[#8E8A85] font-semibold flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-[#DCC9A6]" />
              <span>Free Delivery Threshold</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#DCC9A6] font-bold">EGP</span>
            <input
              type="number"
              min={0}
              step={50}
              value={settings.freeShippingThreshold}
              onChange={(e) =>
                setSettings({ ...settings, freeShippingThreshold: Number(e.target.value) })
              }
              className="w-32 bg-[#141414] border border-[#333333] text-white px-3 py-1.5 text-base font-serif font-bold focus:outline-none focus:border-[#DCC9A6]"
            />
          </div>
          <p className="text-[10px] text-[#8E8A85]">
            Orders with subtotal at or above this amount automatically receive 100% free delivery across Egypt.
          </p>
        </div>

        {/* Fallback Standard Rate */}
        <div className="bg-[#1F1F1F] border border-[#333333] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-[#8E8A85] font-semibold flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-[#B67355]" />
              <span>Default Fallback Rate</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#DCC9A6] font-bold">EGP</span>
            <input
              type="number"
              min={0}
              step={5}
              value={settings.defaultRate}
              onChange={(e) =>
                setSettings({ ...settings, defaultRate: Number(e.target.value) })
              }
              className="w-32 bg-[#141414] border border-[#333333] text-white px-3 py-1.5 text-base font-serif font-bold focus:outline-none focus:border-[#DCC9A6]"
            />
          </div>
          <p className="text-[10px] text-[#8E8A85]">
            Applied if an unrecognized governorate or city is entered during checkout.
          </p>
        </div>

        {/* Quick Bulk Adjustments */}
        <div className="bg-[#1F1F1F] border border-[#333333] p-5 space-y-3 flex flex-col justify-between">
          <span className="text-xs uppercase tracking-wider text-[#8E8A85] font-semibold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#DCC9A6]" />
            <span>Bulk Rate Adjuster</span>
          </span>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleBulkAdjust(10)}
              className="flex-1 bg-[#141414] border border-[#333333] hover:border-[#DCC9A6] text-white py-1.5 text-xs font-semibold rounded"
            >
              +10 EGP All
            </button>
            <button
              type="button"
              onClick={() => handleBulkAdjust(-10)}
              className="flex-1 bg-[#141414] border border-[#333333] hover:border-[#DCC9A6] text-white py-1.5 text-xs font-semibold rounded"
            >
              -10 EGP All
            </button>
          </div>
          <p className="text-[10px] text-[#8E8A85]">
            Quickly offset fuel or courier price changes across all zones with 1 tap.
          </p>
        </div>
      </div>

      {/* Controls Bar: Search & Add Custom City */}
      <div className="bg-[#1F1F1F] border border-[#333333] p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search governorate or city (e.g. Cairo, الإسكندرية)..."
            className="w-full bg-[#141414] border border-[#333333] text-white px-3.5 py-2 pl-9 text-xs focus:outline-none focus:border-[#DCC9A6]"
          />
          <Search className="w-4 h-4 text-[#8E8A85] absolute left-3 top-2.5" />
        </div>

        {/* Add Zone Button */}
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-[#B67355] text-white px-4 py-2 text-xs uppercase font-bold tracking-wider hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'Close Add Form' : 'Add Custom City / Zone'}</span>
        </button>
      </div>

      {/* Add Custom City Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddZone}
          className="bg-[#181818] border-2 border-[#B67355] p-6 space-y-4 animate-fadeIn shadow-xl"
        >
          <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider">
            Add New City or Special Shipping Zone
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-sans">
            <div>
              <label className="block text-[11px] uppercase text-[#DCC9A6] mb-1 font-semibold">
                City / Zone (English) *
              </label>
              <input
                type="text"
                required
                value={newGovName}
                onChange={(e) => setNewGovName(e.target.value)}
                placeholder="e.g. North Coast Summer Express"
                className="w-full bg-[#141414] border border-[#333333] text-white p-2.5 focus:outline-none focus:border-[#DCC9A6]"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase text-[#DCC9A6] mb-1 font-semibold">
                Arabic Name (الاسم بالعربي)
              </label>
              <input
                type="text"
                value={newGovArabic}
                onChange={(e) => setNewGovArabic(e.target.value)}
                placeholder="e.g. الساحل الشمالي - توصيل خاص"
                className="w-full bg-[#141414] border border-[#333333] text-white p-2.5 focus:outline-none focus:border-[#DCC9A6]"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase text-[#DCC9A6] mb-1 font-semibold">
                Delivery Fee (EGP) *
              </label>
              <input
                type="number"
                min={0}
                required
                value={newRate}
                onChange={(e) => setNewRate(Number(e.target.value))}
                className="w-full bg-[#141414] border border-[#333333] text-white p-2.5 focus:outline-none focus:border-[#DCC9A6]"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase text-[#DCC9A6] mb-1 font-semibold">
                Estimated Days
              </label>
              <input
                type="text"
                value={newDays}
                onChange={(e) => setNewDays(e.target.value)}
                placeholder="e.g. 1-2 Days"
                className="w-full bg-[#141414] border border-[#333333] text-white p-2.5 focus:outline-none focus:border-[#DCC9A6]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-[#141414] border border-[#333333] text-neutral-300 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#DCC9A6] text-[#1F1F1F] text-xs font-bold uppercase tracking-wider"
            >
              Add to List
            </button>
          </div>
        </form>
      )}

      {/* Governorates & Rates Table */}
      <div className="bg-[#1F1F1F] border border-[#333333] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300 border-collapse">
            <thead>
              <tr className="bg-[#141414] border-b border-[#333333] text-[11px] uppercase tracking-wider text-[#DCC9A6] font-bold">
                <th className="py-3 px-4 w-12 text-center">Status</th>
                <th className="py-3 px-4">Governorate / City (English & Arabic)</th>
                <th className="py-3 px-4 text-center w-36">Est. Delivery</th>
                <th className="py-3 px-4 text-center w-40">Rate (EGP)</th>
                <th className="py-3 px-4 text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#333333]/70">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-500">
                    <div className="w-8 h-8 border-2 border-[#DCC9A6] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading delivery zones...</span>
                  </td>
                </tr>
              ) : filteredZones.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-neutral-500">
                    No governorates match your search query &ldquo;{searchQuery}&rdquo;
                  </td>
                </tr>
              ) : (
                filteredZones.map((zone) => (
                  <tr
                    key={zone.id}
                    className={`hover:bg-[#252525] transition-colors ${
                      !zone.isActive ? 'opacity-40 bg-black/20' : ''
                    }`}
                  >
                    {/* Active Toggle Switch */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(zone.id)}
                        title={zone.isActive ? 'Active (Click to disable delivery)' : 'Disabled (Click to enable)'}
                        className="text-neutral-400 hover:text-white"
                      >
                        {zone.isActive ? (
                          <ToggleRight className="w-6 h-6 text-emerald-400" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-neutral-600" />
                        )}
                      </button>
                    </td>

                    {/* Governorate Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm font-sans">
                          {zone.governorate}
                        </span>
                        <span className="text-xs text-[#DCC9A6] font-mono bg-black/50 px-2 py-0.5 rounded" dir="rtl">
                          {zone.governorateArabic}
                        </span>
                      </div>
                    </td>

                    {/* Estimated Days */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 bg-[#141414] border border-[#333333] px-2.5 py-1 rounded">
                        <Clock className="w-3 h-3 text-[#8E8A85]" />
                        <input
                          type="text"
                          value={zone.estimatedDays}
                          onChange={(e) => handleDaysChange(zone.id, e.target.value)}
                          className="bg-transparent text-white text-xs w-20 text-center focus:outline-none focus:text-[#DCC9A6]"
                        />
                      </div>
                    </td>

                    {/* Rate Input (EGP) */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1 bg-[#141414] border border-[#333333] px-3 py-1.5 focus-within:border-[#DCC9A6]">
                        <span className="text-xs font-bold text-[#DCC9A6]">EGP</span>
                        <input
                          type="number"
                          min={0}
                          step={5}
                          value={zone.rate}
                          onChange={(e) => handleRateChange(zone.id, Number(e.target.value))}
                          className="bg-transparent text-white font-serif font-bold text-sm w-16 text-center focus:outline-none"
                        />
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteZone(zone.id)}
                        title="Delete zone"
                        className="p-1.5 text-neutral-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
