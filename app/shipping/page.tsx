'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import { Truck, DollarSign, Gift, MapPin } from 'lucide-react';
import {
  getShippingSettings,
  DEFAULT_SHIPPING_SETTINGS,
} from '@/lib/shippingService';
import { ShippingSettings } from '@/types';

export default function ShippingPage() {
  const [settings, setSettings] = useState<ShippingSettings>(DEFAULT_SHIPPING_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getShippingSettings()
      .then((data) => {
        if (isMounted) {
          setSettings(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const activeZones = settings.zones.filter((z) => z.isActive);

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F3EE]">
      <Navbar />

      <main className="flex-grow py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] font-sans font-semibold tracking-[0.25em] text-[#B67355] uppercase block mb-1">
              Boutique Logistics
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#1F1F1F]">
              CASH ON DELIVERY & SHIPPING
            </h1>
            <div className="w-12 h-[1px] bg-[#DCC9A6] mx-auto mt-3 mb-2" />
            <p className="text-xs sm:text-sm text-[#8E8A85] font-sans">
              Reliable, discreet, and fast delivery across Egyptian Governorates and cities.
            </p>
          </div>

          <div className="space-y-6">
            {/* Cash On Delivery & Free Delivery Rule */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border border-[#E8E2D8] p-6 space-y-3">
                <div className="flex items-center gap-3 border-b border-[#E8E2D8] pb-3">
                  <DollarSign className="w-6 h-6 text-[#B67355]" />
                  <h3 className="font-serif text-lg font-bold text-[#1F1F1F]">
                    Cash on Delivery (COD)
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-[#8E8A85] font-sans leading-relaxed">
                  All ARMIA Boutique purchases are strictly Cash on Delivery. You are invited to inspect your pieces before settling payment with the courier.
                </p>
              </div>

              <div className="bg-white border border-[#E8E2D8] p-6 space-y-3">
                <div className="flex items-center gap-3 border-b border-[#E8E2D8] pb-3">
                  <Gift className="w-6 h-6 text-[#DCC9A6]" />
                  <h3 className="font-serif text-lg font-bold text-[#1F1F1F]">
                    Complimentary Free Delivery
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-[#8E8A85] font-sans leading-relaxed">
                  Orders totaling <strong>EGP {settings.freeShippingThreshold.toFixed(2)} or more</strong> automatically qualify for 100% complimentary free delivery across Egypt.
                </p>
              </div>
            </div>

            {/* Live Governorates & Rates Table */}
            <div className="bg-white border border-[#E8E2D8] p-6 sm:p-8 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-4">
                <div className="flex items-center gap-3">
                  <Truck className="w-6 h-6 text-[#B67355]" />
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#1F1F1F]">
                      Governorates Delivery Rates & Timeframes
                    </h3>
                    <p className="text-xs text-[#8E8A85] font-sans">
                      Live rates across all served Egyptian cities
                    </p>
                  </div>
                </div>
                <span className="text-xs text-[#B67355] font-bold font-mono bg-[#EDE3CF] px-3 py-1 border border-[#DCC9A6]">
                  {activeZones.length} Cities Active
                </span>
              </div>

              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="bg-[#FAF8F5] border-b border-[#E8E2D8] text-[11px] uppercase tracking-wider text-[#1F1F1F] font-bold">
                      <th className="py-3 px-4">Governorate / City</th>
                      <th className="py-3 px-4 text-center">Estimated Timeline</th>
                      <th className="py-3 px-4 text-right">Standard Delivery Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D8]">
                    {loading ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-neutral-400">
                          Loading live shipping zones...
                        </td>
                      </tr>
                    ) : (
                      activeZones.map((zone) => (
                        <tr key={zone.id} className="hover:bg-[#FAF8F5] transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-[#B67355] shrink-0" />
                              <span className="font-semibold text-[#1F1F1F]">{zone.governorate}</span>
                              <span className="text-neutral-500 text-[11px]" dir="rtl">
                                ({zone.governorateArabic})
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-neutral-600">
                            {zone.estimatedDays}
                          </td>
                          <td className="py-3 px-4 text-right font-serif font-bold text-[#B67355]">
                            EGP {zone.rate.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
