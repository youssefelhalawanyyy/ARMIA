'use client';

import React from 'react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';

export default function PackagingSection() {
  const { isArabic } = useLanguage();

  const packagingFeatures = [
    {
      title: isArabic ? 'صندوق التغليف الفاخر' : 'Luxury Signature Box',
      desc: isArabic
        ? 'علبة صلبة فاخرة باللون الأسود الملكي مختومة بشعار أرميا الذهبي اللامع.'
        : 'Rigid matte black packaging stamped with gold foil ARMIA emblem.',
      img: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=85',
    },
    {
      title: isArabic ? 'ورق حريري وختم شمعي' : 'Tissue & Golden Wax Seal',
      desc: isArabic
        ? 'تغليف داخلي بورق الكرافت والحرير المعتمد بختم شمعي مونوغرام خاص.'
        : 'Delicate kraft wrapping sealed with our custom boutique monogram.',
      img: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=85',
    },
    {
      title: isArabic ? 'بطاقة شكر وإهداء خاصة' : 'Boutique Thank You Note',
      desc: isArabic
        ? 'بطاقة إهداء مخصصة ومصنوعة يدوياً ترافق كل طلب تعبيراً عن امتناننا.'
        : 'Handcrafted card enclosed in every order expressing our gratitude.',
      img: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800&auto=format&fit=crop&q=85',
    },
    {
      title: isArabic ? 'طرد حماية للشحن الآمن' : 'Eco-Friendly Mailer',
      desc: isArabic
        ? 'طرد مقاوم للماء وعوامل الشحن لضمان وصول فساتينك بأفضل جودة لباب بيتك.'
        : 'Water-resistant, durable beige parcel designed for safe Egyptian transit.',
      img: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop&q=85',
    },
  ];

  return (
    <section className="py-20 bg-white border-b border-[#E8E2D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-[11px] font-sans font-semibold tracking-[0.25em] text-[#B67355] uppercase block mb-1">
            {isArabic ? 'تجربة فتح الصندوق الاستثنائية' : 'The Unboxing Experience'}
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#1F1F1F]">
            {isArabic ? 'تغليف فاخر وعناية ملكية' : 'LUXURY PACKAGING & CARE'}
          </h2>
          <div className="w-12 h-[1px] bg-[#DCC9A6] mx-auto mt-3 mb-3" />
          <p className="text-xs sm:text-sm text-[#8E8A85] font-sans">
            {isArabic
              ? 'كل قطعة من أرميا تُجهز وتُغلف كهدية استثنائية لكِ أو لعميلات بوتيكك.'
              : 'Every ARMIA piece is prepared as a gift to you or your boutique customers.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {packagingFeatures.map((item, idx) => (
            <div
              key={idx}
              className="bg-[#F6F3EE] border border-[#E8E2D8] overflow-hidden group hover:border-[#B67355] transition-all rounded-sm"
            >
              <div className="relative aspect-square w-full bg-[#EBE5DA] overflow-hidden">
                <Image
                  src={item.img}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-108"
                />
                <div className="absolute inset-0 bg-black/15 group-hover:bg-transparent transition-colors" />
              </div>
              <div className="p-4">
                <h3 className="font-serif text-sm font-semibold text-[#1F1F1F] mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-[#8E8A85] font-sans leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
