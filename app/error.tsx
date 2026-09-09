'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('ARMIA App Error Boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#F6F3EE]">
      <div className="max-w-md w-full bg-white border border-[#E8E2D8] p-8 rounded-sm shadow-xl text-center space-y-6">
        <div className="w-14 h-14 rounded-full bg-[#FAF7F2] border border-[#DCC9A6] flex items-center justify-center mx-auto text-[#B67355]">
          <AlertCircle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-[#B67355] font-semibold block">
            ARMIA BOUTIQUE
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#1F1F1F]">
            Something went wrong
          </h2>
          <p className="font-sans text-xs text-[#8E8A85] leading-relaxed">
            We encountered a temporary display issue. Tap below to reload seamlessly.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 bg-[#1F1F1F] hover:bg-[#B67355] text-[#DCC9A6] hover:text-white py-3 px-4 text-xs font-sans uppercase tracking-wider font-bold rounded-xs transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="flex-1 bg-[#FAF7F2] hover:bg-[#E8E2D8] text-[#1F1F1F] py-3 px-4 text-xs font-sans uppercase tracking-wider font-bold rounded-xs transition-all border border-[#E8E2D8] flex items-center justify-center gap-2 active:scale-95"
          >
            <Home className="w-3.5 h-3.5 text-[#B67355]" />
            <span>Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
