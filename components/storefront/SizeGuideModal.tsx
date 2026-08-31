'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Ruler,
  HelpCircle,
  Sparkles,
  Info,
  Check,
  ArrowRight,
  MessageCircle,
} from 'lucide-react';
import { SizeChartGuide, SizeChartRow, Product } from '@/types';
import { getSizeChartByCategory } from '@/lib/sizeChartService';
import { useLanguage } from '@/context/LanguageContext';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  categorySlug?: string;
  selectedSize?: string;
  onSelectSize?: (size: string) => void;
}

export default function SizeGuideModal({
  isOpen,
  onClose,
  product,
  categorySlug,
  selectedSize,
  onSelectSize,
}: SizeGuideModalProps) {
  const { isArabic } = useLanguage();
  const [unit, setUnit] = useState<'cm' | 'in'>('cm');
  const [activeTab, setActiveTab] = useState<'chart' | 'measure' | 'fit'>('chart');
  const [guide, setGuide] = useState<SizeChartGuide | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const effectiveCategory = categorySlug || product?.category || 'dresses';

  useEffect(() => {
    if (!isOpen) return;

    async function loadGuide() {
      setLoading(true);
      const data = await getSizeChartByCategory(effectiveCategory);
      setGuide(data);
      setLoading(false);
    }
    loadGuide();
  }, [isOpen, effectiveCategory]);

  if (!isOpen) return null;

  // Convert centimeter string range (e.g. "86-90" or "140") to inches
  const convertValue = (valStr?: string) => {
    if (!valStr || valStr === '-') return '-';
    if (unit === 'cm') return valStr;

    // Handle ranges like "86-90"
    if (valStr.includes('-')) {
      const parts = valStr.split('-').map((p) => parseFloat(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        const in1 = (parts[0] / 2.54).toFixed(1);
        const in2 = (parts[1] / 2.54).toFixed(1);
        return `${in1}-${in2}`;
      }
    }

    // Handle single numbers like "140"
    const num = parseFloat(valStr);
    if (!isNaN(num)) {
      return (num / 2.54).toFixed(1);
    }

    return valStr;
  };

  const title = isArabic && guide?.titleArabic ? guide.titleArabic : guide?.title || 'Size Chart';
  const description =
    isArabic && guide?.descriptionArabic ? guide.descriptionArabic : guide?.description;

  const measuringTips =
    isArabic && guide?.measuringTipsArabic && guide.measuringTipsArabic.length > 0
      ? guide.measuringTipsArabic
      : guide?.measuringTips || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md animate-fadeIn font-sans">
      <div
        className="bg-[#141414] border border-[#DCC9A6]/40 text-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative animate-scaleUp"
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#2A2A2A] flex items-center justify-between bg-gradient-to-r from-[#141414] to-[#1F1F1F]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#B67355] flex items-center justify-center text-white shrink-0 shadow-md">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#DCC9A6] block">
                {isArabic ? 'دليل القياسات والأتيليه' : 'ARMIA ATELIER FIT GUIDE'}
              </span>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-white mt-0.5">
                {title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1F1F1F] hover:bg-[#2A2A2A] text-[#8E8A85] hover:text-white flex items-center justify-center transition-colors"
            aria-label="Close size guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-Header Tabs & Unit Switcher */}
        <div className="px-5 sm:px-6 py-3 border-b border-[#222222] bg-[#171717] flex flex-wrap items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('chart')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'chart'
                  ? 'bg-[#DCC9A6] text-[#1F1F1F] shadow-sm'
                  : 'text-[#8E8A85] hover:text-white'
              }`}
            >
              {isArabic ? 'جدول المقاسات' : 'Size Chart'}
            </button>

            <button
              onClick={() => setActiveTab('measure')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'measure'
                  ? 'bg-[#DCC9A6] text-[#1F1F1F] shadow-sm'
                  : 'text-[#8E8A85] hover:text-white'
              }`}
            >
              {isArabic ? 'كيف تقيسين جسمكِ؟' : 'How to Measure'}
            </button>

            {product?.specs?.modelInfo && (
              <button
                onClick={() => setActiveTab('fit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'fit'
                    ? 'bg-[#DCC9A6] text-[#1F1F1F] shadow-sm'
                    : 'text-[#8E8A85] hover:text-white'
                }`}
              >
                {isArabic ? 'معلومات الموديل' : 'Model Stats'}
              </button>
            )}
          </div>

          {/* Unit Toggle: CM vs IN */}
          <div className="flex items-center gap-1 bg-[#1F1F1F] p-1 rounded-lg border border-[#333333]">
            <button
              type="button"
              onClick={() => setUnit('cm')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                unit === 'cm' ? 'bg-[#B67355] text-white' : 'text-[#8E8A85] hover:text-white'
              }`}
            >
              {isArabic ? 'سم (cm)' : 'CM'}
            </button>
            <button
              type="button"
              onClick={() => setUnit('in')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                unit === 'in' ? 'bg-[#B67355] text-white' : 'text-[#8E8A85] hover:text-white'
              }`}
            >
              {isArabic ? 'بوصة (in)' : 'INCHES'}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-grow space-y-6">
          {loading ? (
            <div className="py-16 text-center text-[#8E8A85] text-xs">
              <div className="w-8 h-8 border-2 border-[#DCC9A6] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <span>{isArabic ? 'جاري تحميل جدول المقاسات...' : 'Loading size chart...'}</span>
            </div>
          ) : (
            <>
              {/* TAB 1: SIZE CHART TABLE */}
              {activeTab === 'chart' && (
                <div className="space-y-4">
                  {description && (
                    <p className="text-xs text-[#A0A0A0] leading-relaxed">
                      {description}
                    </p>
                  )}

                  {/* Size Table */}
                  <div className="overflow-x-auto rounded-xl border border-[#333333]">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#1C1C1C] text-[10px] uppercase tracking-wider text-[#DCC9A6] border-b border-[#333333]">
                        <tr>
                          <th className="py-3 px-3 text-center">{isArabic ? 'المقاس' : 'Size'}</th>
                          <th className="py-3 px-3">{isArabic ? 'التحويل الأوروبي' : 'EU / UK'}</th>
                          <th className="py-3 px-3">{isArabic ? `الصدر (${unit})` : `Bust (${unit})`}</th>
                          <th className="py-3 px-3">{isArabic ? `الخصر (${unit})` : `Waist (${unit})`}</th>
                          <th className="py-3 px-3">{isArabic ? `الأرداف (${unit})` : `Hips (${unit})`}</th>
                          <th className="py-3 px-3">{isArabic ? `الطول (${unit})` : `Length (${unit})`}</th>
                          <th className="py-3 px-3">{isArabic ? `الكم (${unit})` : `Sleeve (${unit})`}</th>
                          {onSelectSize && <th className="py-3 px-3 text-center">{isArabic ? 'اختيار' : 'Action'}</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#262626]">
                        {guide?.rows.map((r) => {
                          const isCurrent = selectedSize === r.size;
                          return (
                            <tr
                              key={r.size}
                              className={`transition-colors ${
                                isCurrent
                                  ? 'bg-[#B67355]/25 text-white font-semibold'
                                  : 'hover:bg-[#1A1A1A] text-[#D5D5D5]'
                              }`}
                            >
                              <td className="py-3 px-3 text-center font-bold">
                                <span className={`inline-block w-7 h-7 leading-7 rounded-full text-xs ${
                                  isCurrent ? 'bg-[#DCC9A6] text-[#1F1F1F]' : 'bg-[#222222] text-[#DCC9A6]'
                                }`}>
                                  {r.size}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-[#A0A0A0] text-[11px]">
                                {r.ukEuSize || '-'}
                              </td>
                              <td className="py-3 px-3 font-mono">{convertValue(r.bustCm)}</td>
                              <td className="py-3 px-3 font-mono">{convertValue(r.waistCm)}</td>
                              <td className="py-3 px-3 font-mono">{convertValue(r.hipsCm)}</td>
                              <td className="py-3 px-3 font-mono">{convertValue(r.lengthCm)}</td>
                              <td className="py-3 px-3 font-mono">{convertValue(r.sleeveCm)}</td>
                              {onSelectSize && (
                                <td className="py-3 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onSelectSize(r.size);
                                      onClose();
                                    }}
                                    className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded transition-colors ${
                                      isCurrent
                                        ? 'bg-[#DCC9A6] text-[#1F1F1F]'
                                        : 'bg-[#262626] hover:bg-[#B67355] text-white'
                                    }`}
                                  >
                                    {isCurrent ? (isArabic ? 'مختار' : 'Selected') : (isArabic ? 'اختاري' : 'Select')}
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Fit Tip Banner */}
                  <div className="bg-[#1C1C1C] border border-[#333333] p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-[#DCC9A6]">
                    <Sparkles className="w-4 h-4 text-[#B67355] shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      {isArabic
                        ? 'نصيحة الأتيليه: إذا كانت قياساتكِ تقع بين مقاسين، نوصي باختيار المقاس الأكبر لضمان الراحة التامة وإمكانية التعديل.'
                        : 'Atelier Sizing Tip: If your measurements fall between two sizes, we recommend selecting the larger size for relaxed comfort.'}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: HOW TO MEASURE */}
              {activeTab === 'measure' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Visual Tips List */}
                    <div className="space-y-3">
                      <h4 className="font-serif font-bold text-sm text-white flex items-center gap-2">
                        <Ruler className="w-4 h-4 text-[#B67355]" />
                        <span>{isArabic ? 'خطوات القياس الصحيحة:' : 'Accurate Measuring Guidelines:'}</span>
                      </h4>

                      <ul className="space-y-2.5">
                        {measuringTips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2.5 bg-[#1C1C1C] p-3 rounded-xl border border-[#2B2B2B]">
                            <span className="w-5 h-5 rounded-full bg-[#B67355]/30 text-[#DCC9A6] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <span className="text-[#D5D5D5] leading-relaxed">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Quality Assurance Card */}
                    <div className="bg-[#1C1C1C] border border-[#333333] p-5 rounded-2xl flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase tracking-widest text-[#DCC9A6] font-bold">
                          {isArabic ? 'ضمان المقاس المثالي' : 'PERFECT FIT GUARANTEE'}
                        </span>
                        <h4 className="font-serif text-base font-bold text-white">
                          {isArabic ? 'هل تحتاجين لمقاس مخصص؟' : 'Need Custom Atelier Tailoring?'}
                        </h4>
                        <p className="text-[#8E8A85] text-xs leading-relaxed">
                          {isArabic
                            ? 'نحن نوفر خدمة التعديل والتفصيل الخاص لأي طول أو محيط في أتيليه ARMIA بالقاهرة.'
                            : 'We offer bespoke adjustments and custom length tailoring at the ARMIA Cairo atelier.'}
                        </p>
                      </div>

                      <a
                        href="https://wa.me/201220859992?text=Hello%20ARMIA%20Boutique,%20I%20need%20help%20with%20sizing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#25D366] hover:bg-[#1EBE5D] text-black font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                      >
                        <MessageCircle className="w-4 h-4 fill-current" />
                        <span>{isArabic ? 'استشيري مصممة الأزياء عبر واتساب' : 'Chat with Atelier Stylist'}</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: MODEL & FIT DETAILS */}
              {activeTab === 'fit' && product && (
                <div className="space-y-4 text-xs">
                  <div className="bg-[#1C1C1C] border border-[#333333] p-5 rounded-2xl space-y-4">
                    <h4 className="font-serif text-sm font-bold text-white">
                      {isArabic ? 'مواصفات القطعة والموديل:' : 'Garment & Model Specifications:'}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {product.specs?.fit && (
                        <div className="p-3 bg-[#141414] rounded-lg border border-[#2B2B2B]">
                          <span className="text-[#8E8A85] text-[10px] uppercase font-bold block">
                            {isArabic ? 'نوع القصة' : 'Silhouette / Fit'}
                          </span>
                          <span className="text-white font-medium mt-0.5 block">
                            {isArabic && product.specs.fitArabic ? product.specs.fitArabic : product.specs.fit}
                          </span>
                        </div>
                      )}

                      {product.specs?.fabric && (
                        <div className="p-3 bg-[#141414] rounded-lg border border-[#2B2B2B]">
                          <span className="text-[#8E8A85] text-[10px] uppercase font-bold block">
                            {isArabic ? 'الخامة' : 'Fabric Composition'}
                          </span>
                          <span className="text-white font-medium mt-0.5 block">
                            {isArabic && product.specs.fabricArabic ? product.specs.fabricArabic : product.specs.fabric}
                          </span>
                        </div>
                      )}

                      {product.specs?.modelInfo && (
                        <div className="p-3 bg-[#141414] rounded-lg border border-[#2B2B2B] sm:col-span-2">
                          <span className="text-[#8E8A85] text-[10px] uppercase font-bold block">
                            {isArabic ? 'مقاس الموديل في الصورة' : 'Model Height & Wearing Size'}
                          </span>
                          <span className="text-white font-medium mt-0.5 block">
                            {isArabic && product.specs.modelInfoArabic ? product.specs.modelInfoArabic : product.specs.modelInfo}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#222222] bg-[#171717] flex items-center justify-between">
          <span className="text-[11px] text-[#8E8A85]">
            {isArabic ? 'جميع القياسات مطابقة لمعايير الأتيليه' : 'All measurements are atelier calibrated'}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="bg-[#DCC9A6] hover:bg-white text-[#1F1F1F] px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
          >
            {isArabic ? 'إغلاق' : 'Close Guide'}
          </button>
        </div>
      </div>
    </div>
  );
}
