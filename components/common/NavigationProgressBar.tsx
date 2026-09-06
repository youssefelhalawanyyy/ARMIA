'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { usePathname } from 'next/navigation';

function ProgressBarInner() {
  const pathname = usePathname();
  const [navigating, setNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Trigger smooth progress animation whenever pathname changes
  useEffect(() => {
    setProgress(30);
    const t1 = setTimeout(() => setProgress(80), 60);
    const t2 = setTimeout(() => {
      setProgress(100);
      const t3 = setTimeout(() => {
        setNavigating(false);
        setProgress(0);
      }, 180);
      return () => clearTimeout(t3);
    }, 150);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [pathname]);

  // Intercept internal link clicks to start progress bar with zero latency
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a');
      if (!target) return;
      const href = target.getAttribute('href');
      if (
        href &&
        href.startsWith('/') &&
        !href.startsWith('//') &&
        !target.hasAttribute('download') &&
        target.target !== '_blank' &&
        href !== pathname
      ) {
        setNavigating(true);
        setProgress(45);
      }
    };

    document.addEventListener('click', handleLinkClick, { passive: true });
    return () => document.removeEventListener('click', handleLinkClick);
  }, [pathname]);

  if (!navigating && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[99999] h-[2.5px] pointer-events-none overflow-hidden"
    >
      <div
        className="h-full bg-gradient-to-r from-[#B67355] via-[#DCC9A6] to-[#F2E9DA] shadow-[0_0_8px_rgba(220,201,166,0.9)] transition-all duration-150 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}

export default function NavigationProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarInner />
    </Suspense>
  );
}
