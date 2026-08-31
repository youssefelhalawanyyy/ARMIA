'use client';

import React, { useState, useEffect } from 'react';
import {
  Ruler,
  Save,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  Check,
  Eye,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';
import { SizeChartGuide, SizeChartRow } from '@/types';
import {
  getAllSizeCharts,
  saveSizeChart,
  DEFAULT_SIZE_CHARTS,
} from '@/lib/sizeChartService';
import { useToast } from '@/context/ToastContext';

export default function AdminSizeChartsPage() {
  const { success, error, info } = useToast();

  const [charts, setCharts] = useState<SizeChartGuide[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('dresses');
  const [currentChart, setCurrentChart] = useState<SizeChartGuide | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [previewUnit, setPreviewUnit] = useState<'cm' | 'in'>('cm');
  const [previewLanguage, setPreviewLanguage] = useState<'en' | 'ar'>('ar');

  // Load all charts on mount
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const list = await getAllSizeCharts();
        setCharts(list);
        const active = list.find((c) => c.id === 'dresses') || list[0];
        if (active) {
          setCurrentChart(JSON.parse(JSON.stringify(active)));
        }
      } catch {
        error('Failed to load size charts from database');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [error]);

  // Handle Category Tab Change
  const handleSelectCategory = (catId: string) => {
    setSelectedCategoryId(catId);
    const found = charts.find((c) => c.id === catId);
    if (found) {
      setCurrentChart(JSON.parse(JSON.stringify(found)));
    } else {
      const def = DEFAULT_SIZE_CHARTS.find((c) => c.id === catId) || DEFAULT_SIZE_CHARTS[0];
      setCurrentChart(JSON.parse(JSON.stringify({ ...def, id: catId })));
    }
  };

  // Handle Row Modification
  const handleRowChange = (index: number, field: keyof SizeChartRow, val: string) => {
    if (!currentChart) return;
    const updatedRows = [...currentChart.rows];
    updatedRows[index] = {
      ...updatedRows[index],
      [field]: val,
    };
    setCurrentChart({
      ...currentChart,
      rows: updatedRows,
    });
  };

  // Add New Size Row
  const handleAddRow = () => {
    if (!currentChart) return;
    const newRow: SizeChartRow = {
      size: 'CUSTOM',
      ukEuSize: '38-40 EU',
      bustCm: '90-95',
      waistCm: '70-75',
      hipsCm: '95-100',
      lengthCm: '140',
      sleeveCm: '60',
    };
    setCurrentChart({
      ...currentChart,
      rows: [...currentChart.rows, newRow],
    });
    info('Added new size row. Enter measurements and click Save.');
  };

  // Remove Size Row
  const handleRemoveRow = (index: number) => {
    if (!currentChart || currentChart.rows.length <= 1) {
      error('Size chart must have at least 1 size row.');
      return;
    }
    const updatedRows = currentChart.rows.filter((_, i) => i !== index);
    setCurrentChart({
      ...currentChart,
      rows: updatedRows,
    });
  };

  // Save to Firestore
  const handleSave = async () => {
    if (!currentChart) return;
    setSaving(true);
    try {
      const ok = await saveSizeChart(currentChart);
      if (ok) {
        // Update local charts state
        setCharts((prev) =>
          prev.map((c) => (c.id === currentChart.id ? currentChart : c))
        );
        success(`Size chart for "${currentChart.title}" saved successfully!`, 'Updated in Storefront');
      } else {
        error('Could not save size chart. Please check database permissions.');
      }
    } catch {
      error('An error occurred while saving the size chart.');
    } finally {
      setSaving(false);
    }
  };

  // Reset to Factory Default
  const handleResetToDefault = () => {
    if (!currentChart) return;
    const def = DEFAULT_SIZE_CHARTS.find((c) => c.id === currentChart.id);
    if (def) {
      setCurrentChart(JSON.parse(JSON.stringify(def)));
      info('Reset to standard atelier default specs. Click "Save Changes" to apply.');
    }
  };

  const categories = [
    { id: 'dresses', label: '👗 Dresses (فساتين)' },
    { id: 'sets', label: '✨ Sets & Co-Ords (أطقم)' },
    { id: 'tops', label: '👚 Tops & Blouses (توبات)' },
    { id: 'bottoms', label: '👖 Bottoms & Trousers (بناطيل)' },
    { id: 'outerwear', label: '🧥 Outerwear & Abayas (عبايات)' },
  ];

  if (loading) {
    return (
      <div className="p-8 text-center text-[#DCC9A6] space-y-4">
        <div className="w-10 h-10 border-2 border-[#DCC9A6] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs uppercase tracking-widest">Loading Atelier Size Guides...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#333333] pb-6">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#B67355]">
            Atelier Standards & Calibration
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1 flex items-center gap-2.5">
            <Ruler className="w-7 h-7 text-[#DCC9A6]" />
            <span>Size Charts & Measurement Guides</span>
          </h1>
          <p className="text-xs text-[#8E8A85] mt-1 max-w-2xl">
            Manage bilingual (Arabic & English) measurement tables for all clothing categories. Every edit updates instantly across all product pages on the live storefront.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-[#DCC9A6] hover:bg-white text-[#1F1F1F] px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-all shadow-lg active:scale-95 disabled:opacity-50 rounded"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-[#1F1F1F] border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{saving ? 'Saving...' : 'Save Size Chart'}</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#2A2A2A]">
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handleSelectCategory(cat.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
                isSelected
                  ? 'bg-[#B67355] text-white border-[#B67355] shadow-md'
                  : 'bg-[#1A1A1A] text-[#8E8A85] border-[#2E2E2E] hover:text-white hover:border-[#444444]'
              }`}
            >
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {currentChart && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT 7 COLS: EDITING CONTROLS */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Bilingual Titles & Descriptions Card */}
            <div className="bg-[#1F1F1F] border border-[#333333] p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#333333] pb-3">
                <h3 className="font-serif text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#DCC9A6]" />
                  <span>Category Guide Titles (Bilingual)</span>
                </h3>

                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="text-[11px] text-[#8E8A85] hover:text-[#DCC9A6] flex items-center gap-1 transition-colors"
                  title="Reset this category to default factory specs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Default</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wider text-[#8E8A85] font-semibold block">
                    English Title
                  </label>
                  <input
                    type="text"
                    value={currentChart.title}
                    onChange={(e) =>
                      setCurrentChart({ ...currentChart, title: e.target.value })
                    }
                    className="w-full bg-[#141414] border border-[#333333] p-2.5 rounded-lg text-xs text-white focus:border-[#DCC9A6] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wider text-[#8E8A85] font-semibold block text-right">
                    العنوان بالعربية
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={currentChart.titleArabic}
                    onChange={(e) =>
                      setCurrentChart({ ...currentChart, titleArabic: e.target.value })
                    }
                    className="w-full bg-[#141414] border border-[#333333] p-2.5 rounded-lg text-xs text-white focus:border-[#DCC9A6] outline-none text-right"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] uppercase tracking-wider text-[#8E8A85] font-semibold block">
                    English Description / Atelier Note
                  </label>
                  <textarea
                    rows={2}
                    value={currentChart.description || ''}
                    onChange={(e) =>
                      setCurrentChart({ ...currentChart, description: e.target.value })
                    }
                    className="w-full bg-[#141414] border border-[#333333] p-2.5 rounded-lg text-xs text-white focus:border-[#DCC9A6] outline-none"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] uppercase tracking-wider text-[#8E8A85] font-semibold block text-right">
                    الوصف بالعربية / ملاحظة الأتيليه
                  </label>
                  <textarea
                    rows={2}
                    dir="rtl"
                    value={currentChart.descriptionArabic || ''}
                    onChange={(e) =>
                      setCurrentChart({ ...currentChart, descriptionArabic: e.target.value })
                    }
                    className="w-full bg-[#141414] border border-[#333333] p-2.5 rounded-lg text-xs text-white focus:border-[#DCC9A6] outline-none text-right"
                  />
                </div>
              </div>
            </div>

            {/* Editable Size Rows Table */}
            <div className="bg-[#1F1F1F] border border-[#333333] p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#333333] pb-3">
                <div>
                  <h3 className="font-serif text-base font-bold text-white">
                    Measurement Rows & Specs (CM)
                  </h3>
                  <span className="text-[11px] text-[#8E8A85]">
                    Enter size names and centimeter ranges (e.g. &quot;86-90&quot; or single numbers &quot;140&quot;).
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddRow}
                  className="bg-[#141414] hover:bg-[#2A2A2A] text-[#DCC9A6] border border-[#333333] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Size Row</span>
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-[#333333]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#141414] text-[10px] uppercase tracking-wider text-[#DCC9A6] border-b border-[#333333]">
                    <tr>
                      <th className="p-2.5 text-center">Size</th>
                      <th className="p-2.5">EU/UK Convert</th>
                      <th className="p-2.5">Bust (cm)</th>
                      <th className="p-2.5">Waist (cm)</th>
                      <th className="p-2.5">Hips (cm)</th>
                      <th className="p-2.5">Length (cm)</th>
                      <th className="p-2.5">Sleeve (cm)</th>
                      <th className="p-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2B2B2B]">
                    {currentChart.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#1A1A1A]">
                        <td className="p-2 text-center">
                          <input
                            type="text"
                            value={row.size}
                            onChange={(e) => handleRowChange(idx, 'size', e.target.value)}
                            className="w-12 text-center bg-[#141414] border border-[#333333] rounded px-1.5 py-1 text-xs font-bold text-[#DCC9A6] uppercase outline-none focus:border-[#DCC9A6]"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.ukEuSize || ''}
                            onChange={(e) => handleRowChange(idx, 'ukEuSize', e.target.value)}
                            placeholder="38-40 EU"
                            className="w-24 bg-[#141414] border border-[#333333] rounded px-2 py-1 text-xs text-white outline-none focus:border-[#DCC9A6]"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.bustCm}
                            onChange={(e) => handleRowChange(idx, 'bustCm', e.target.value)}
                            className="w-16 bg-[#141414] border border-[#333333] rounded px-1.5 py-1 text-xs font-mono text-white outline-none focus:border-[#DCC9A6]"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.waistCm}
                            onChange={(e) => handleRowChange(idx, 'waistCm', e.target.value)}
                            className="w-16 bg-[#141414] border border-[#333333] rounded px-1.5 py-1 text-xs font-mono text-white outline-none focus:border-[#DCC9A6]"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.hipsCm}
                            onChange={(e) => handleRowChange(idx, 'hipsCm', e.target.value)}
                            className="w-16 bg-[#141414] border border-[#333333] rounded px-1.5 py-1 text-xs font-mono text-white outline-none focus:border-[#DCC9A6]"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.lengthCm || ''}
                            onChange={(e) => handleRowChange(idx, 'lengthCm', e.target.value)}
                            className="w-20 bg-[#141414] border border-[#333333] rounded px-1.5 py-1 text-xs font-mono text-white outline-none focus:border-[#DCC9A6]"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.sleeveCm || ''}
                            onChange={(e) => handleRowChange(idx, 'sleeveCm', e.target.value)}
                            className="w-14 bg-[#141414] border border-[#333333] rounded px-1.5 py-1 text-xs font-mono text-white outline-none focus:border-[#DCC9A6]"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
                            className="text-[#8E8A85] hover:text-red-400 p-1 transition-colors"
                            title="Delete size row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Measuring Tips Card */}
            <div className="bg-[#1F1F1F] border border-[#333333] p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-serif text-base font-bold text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-[#B67355]" />
                <span>How-To-Measure Guidelines (Arabic & English)</span>
              </h3>

              <div className="space-y-3">
                {currentChart.measuringTips.map((tip, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#141414] p-2.5 rounded-lg border border-[#2E2E2E]">
                    <input
                      type="text"
                      value={tip}
                      onChange={(e) => {
                        const updated = [...currentChart.measuringTips];
                        updated[idx] = e.target.value;
                        setCurrentChart({ ...currentChart, measuringTips: updated });
                      }}
                      className="bg-[#1C1C1C] border border-[#333333] rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#DCC9A6]"
                      placeholder="English Tip"
                    />
                    <input
                      type="text"
                      dir="rtl"
                      value={currentChart.measuringTipsArabic[idx] || ''}
                      onChange={(e) => {
                        const updated = [...currentChart.measuringTipsArabic];
                        updated[idx] = e.target.value;
                        setCurrentChart({ ...currentChart, measuringTipsArabic: updated });
                      }}
                      className="bg-[#1C1C1C] border border-[#333333] rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#DCC9A6] text-right"
                      placeholder="نصيحة القياس بالعربية"
                    />
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT 5 COLS: LIVE STOREFRONT PREVIEW */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#1F1F1F] border-2 border-[#DCC9A6]/40 p-6 rounded-2xl shadow-xl space-y-5 sticky top-6">
              
              <div className="flex items-center justify-between border-b border-[#333333] pb-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#DCC9A6]" />
                  <span className="font-serif text-sm font-bold text-white">Live Storefront Preview</span>
                </div>

                {/* Preview controls */}
                <div className="flex items-center gap-2">
                  {/* Language switch */}
                  <div className="flex items-center bg-[#141414] p-0.5 rounded border border-[#333333] text-[10px]">
                    <button
                      onClick={() => setPreviewLanguage('ar')}
                      className={`px-2 py-0.5 rounded font-bold ${
                        previewLanguage === 'ar' ? 'bg-[#B67355] text-white' : 'text-[#8E8A85]'
                      }`}
                    >
                      عربي
                    </button>
                    <button
                      onClick={() => setPreviewLanguage('en')}
                      className={`px-2 py-0.5 rounded font-bold ${
                        previewLanguage === 'en' ? 'bg-[#B67355] text-white' : 'text-[#8E8A85]'
                      }`}
                    >
                      EN
                    </button>
                  </div>

                  {/* Unit switch */}
                  <div className="flex items-center bg-[#141414] p-0.5 rounded border border-[#333333] text-[10px]">
                    <button
                      onClick={() => setPreviewUnit('cm')}
                      className={`px-2 py-0.5 rounded font-bold ${
                        previewUnit === 'cm' ? 'bg-[#DCC9A6] text-[#1F1F1F]' : 'text-[#8E8A85]'
                      }`}
                    >
                      CM
                    </button>
                    <button
                      onClick={() => setPreviewUnit('in')}
                      className={`px-2 py-0.5 rounded font-bold ${
                        previewUnit === 'in' ? 'bg-[#DCC9A6] text-[#1F1F1F]' : 'text-[#8E8A85]'
                      }`}
                    >
                      IN
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview Modal Simulation Card */}
              <div
                className="bg-[#141414] border border-[#333333] rounded-xl p-4 space-y-4 text-xs"
                dir={previewLanguage === 'ar' ? 'rtl' : 'ltr'}
              >
                <div>
                  <span className="text-[9px] uppercase font-bold text-[#DCC9A6] tracking-widest block">
                    {previewLanguage === 'ar' ? 'دليل مقاسات الأتيليه' : 'ARMIA ATELIER FIT GUIDE'}
                  </span>
                  <h4 className="font-serif text-base font-bold text-white mt-0.5">
                    {previewLanguage === 'ar' ? currentChart.titleArabic : currentChart.title}
                  </h4>
                  <p className="text-[11px] text-[#8E8A85] mt-1">
                    {previewLanguage === 'ar' ? currentChart.descriptionArabic : currentChart.description}
                  </p>
                </div>

                {/* Table Simulation */}
                <div className="overflow-x-auto rounded-lg border border-[#2E2E2E]">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-[#1A1A1A] text-[9px] text-[#DCC9A6] uppercase tracking-wider">
                      <tr>
                        <th className="p-2 text-center">{previewLanguage === 'ar' ? 'المقاس' : 'Size'}</th>
                        <th className="p-2">{previewLanguage === 'ar' ? 'الصدر' : 'Bust'}</th>
                        <th className="p-2">{previewLanguage === 'ar' ? 'الخصر' : 'Waist'}</th>
                        <th className="p-2">{previewLanguage === 'ar' ? 'الأرداف' : 'Hips'}</th>
                        <th className="p-2">{previewLanguage === 'ar' ? 'الطول' : 'Length'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#262626]">
                      {currentChart.rows.map((r, i) => (
                        <tr key={i} className={i === 1 ? 'bg-[#B67355]/20 font-bold text-white' : 'text-[#CCCCCC]'}>
                          <td className="p-2 text-center font-bold text-[#DCC9A6]">{r.size}</td>
                          <td className="p-2 font-mono">{r.bustCm}</td>
                          <td className="p-2 font-mono">{r.waistCm}</td>
                          <td className="p-2 font-mono">{r.hipsCm}</td>
                          <td className="p-2 font-mono">{r.lengthCm || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-[#1C1C1C] p-3 rounded-lg border border-[#2B2B2B] text-[10px] text-[#DCC9A6] flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#B67355] shrink-0" />
                  <span>
                    {previewLanguage === 'ar'
                      ? 'يتم تحديث هذا الجدول فورياً لجميع المنتجات في هذا القسم.'
                      : 'This size chart updates automatically across all products in this category.'}
                  </span>
                </div>
              </div>

              {/* Save CTA */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-[#B67355] hover:bg-[#A35C3E] text-white py-3 rounded-xl text-xs uppercase font-bold tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Publishing Changes...' : 'Save & Publish Live'}</span>
              </button>

            </div>
          </div>

        </div>
      )}

    </div>
  );
}
