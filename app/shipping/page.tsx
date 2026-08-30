import React from 'react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import { Truck, Clock, DollarSign } from 'lucide-react';

export default function ShippingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F6F3EE]">
      <Navbar />

      <main className="flex-grow py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] font-sans font-semibold tracking-[0.25em] text-[#B67355] uppercase block mb-1">
              Boutique Logistics
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#1F1F1F]">
              CASH ON DELIVERY & SHIPPING
            </h1>
            <div className="w-12 h-[1px] bg-[#DCC9A6] mx-auto mt-3 mb-2" />
            <p className="text-xs sm:text-sm text-[#8E8A85] font-sans">
              Reliable, discreet, and fast delivery across all 27 Egyptian Governorates.
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-[#E8E2D8] p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-3 border-b border-[#E8E2D8] pb-3">
                <DollarSign className="w-6 h-6 text-[#B67355]" />
                <h3 className="font-serif text-lg font-bold text-[#1F1F1F]">
                  Cash on Delivery (COD) Policy
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#8E8A85] font-sans leading-relaxed">
                All ARMIA Boutique purchases are processed via strictly Cash on Delivery. You are invited to inspect the packaging and luxury garments before settling payment with the courier representative.
              </p>
            </div>

            <div className="bg-white border border-[#E8E2D8] p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-3 border-b border-[#E8E2D8] pb-3">
                <Clock className="w-6 h-6 text-[#B67355]" />
                <h3 className="font-serif text-lg font-bold text-[#1F1F1F]">
                  Delivery Timeframes in Egypt
                </h3>
              </div>
              <ul className="text-xs sm:text-sm text-[#8E8A85] font-sans space-y-2 list-disc pl-5">
                <li><strong className="text-[#1F1F1F]">Greater Cairo & Giza:</strong> 24 to 48 hours</li>
                <li><strong className="text-[#1F1F1F]">Alexandria, Delta & Canal Cities:</strong> 2 to 3 business days</li>
                <li><strong className="text-[#1F1F1F]">Upper Egypt & Coastal Regions:</strong> 3 to 4 business days</li>
              </ul>
            </div>

            <div className="bg-white border border-[#E8E2D8] p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-3 border-b border-[#E8E2D8] pb-3">
                <Truck className="w-6 h-6 text-[#B67355]" />
                <h3 className="font-serif text-lg font-bold text-[#1F1F1F]">
                  Shipping Rates
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#8E8A85] font-sans leading-relaxed">
                Standard delivery rate across Egypt is <strong>EGP 50.00</strong>. Orders totaling <strong>EGP 1,500.00 or more</strong> receive complimentary Free Shipping.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
