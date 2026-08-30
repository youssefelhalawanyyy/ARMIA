import React from 'react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import { RotateCcw, ShieldCheck } from 'lucide-react';

export default function ReturnsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F6F3EE]">
      <Navbar />

      <main className="flex-grow py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] font-sans font-semibold tracking-[0.25em] text-[#B67355] uppercase block mb-1">
              Client Satisfaction
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#1F1F1F]">
              EXCHANGES & RETURNS
            </h1>
            <div className="w-12 h-[1px] bg-[#DCC9A6] mx-auto mt-3 mb-2" />
            <p className="text-xs sm:text-sm text-[#8E8A85] font-sans">
              We want you to love your ARMIA pieces. We offer seamless 14-day exchange and returns.
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-[#E8E2D8] p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-3 border-b border-[#E8E2D8] pb-3">
                <RotateCcw className="w-6 h-6 text-[#B67355]" />
                <h3 className="font-serif text-lg font-bold text-[#1F1F1F]">
                  14-Day Exchange Window
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#8E8A85] font-sans leading-relaxed">
                If the size or fit isn&apos;t perfect, you can request an exchange within 14 days of receiving your order. Our courier will deliver the replacement size directly to your doorstep.
              </p>
            </div>

            <div className="bg-white border border-[#E8E2D8] p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-3 border-b border-[#E8E2D8] pb-3">
                <ShieldCheck className="w-6 h-6 text-[#B67355]" />
                <h3 className="font-serif text-lg font-bold text-[#1F1F1F]">
                  Condition Requirements
                </h3>
              </div>
              <ul className="text-xs sm:text-sm text-[#8E8A85] font-sans space-y-2 list-disc pl-5">
                <li>Garments must be unworn, unwashed, and in their original pristine condition.</li>
                <li>All original ARMIA tags and black luxury gift packaging must be intact.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
