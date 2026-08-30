'use client';

import React from 'react';
import { Crown, PackageCheck, Truck, Headphones } from 'lucide-react';

export default function ValueProps() {
  const props = [
    {
      icon: Crown,
      title: 'PREMIUM QUALITY',
      subtitle: 'Best fabrics & details',
    },
    {
      icon: PackageCheck,
      title: 'WHOLESALE & RETAIL',
      subtitle: 'For retailers & boutique clients',
    },
    {
      icon: Truck,
      title: 'FAST SHIPPING',
      subtitle: 'Across Egypt (Cash on Delivery)',
    },
    {
      icon: Headphones,
      title: 'DEDICATED SUPPORT',
      subtitle: 'We are here for you',
    },
  ];

  return (
    <section className="bg-white border-b border-[#E8E2D8] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
          {props.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex flex-col items-center text-center p-4 rounded-none transition-all duration-300 hover:bg-[#F6F3EE] group"
              >
                <div className="w-10 h-10 rounded-full bg-[#F6F3EE] border border-[#E8E2D8] flex items-center justify-center mb-3 group-hover:border-[#B67355] transition-colors">
                  <Icon className="w-5 h-5 text-[#B67355] transition-transform group-hover:scale-110" />
                </div>
                <h4 className="font-serif text-xs sm:text-sm font-semibold tracking-wider text-[#1F1F1F] uppercase mb-1">
                  {item.title}
                </h4>
                <p className="text-[11px] text-[#8E8A85] font-sans font-normal">
                  {item.subtitle}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
