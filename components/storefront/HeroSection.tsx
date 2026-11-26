'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { Product } from '@/types';
import { INITIAL_PRODUCTS } from '@/lib/seedData';
import { useLanguage } from '@/context/LanguageContext';
import './runway-hero.css';

interface HeroSectionProps {
  products?: Product[];
}

interface RunwaySlide {
  id: string;
  product: Product;
  image: string;
  label: string;
  labelArabic: string;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export default function HeroSection({ products = [] }: HeroSectionProps) {
  const router = useRouter();
  const { t, isArabic } = useLanguage();
  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;

  // Build up to 6 distinct ARMIA runway looks from live products
  const slides: RunwaySlide[] = useMemo(() => {
    const pool = products.length > 0 ? products : INITIAL_PRODUCTS;
    const available = pool.filter((p) => (p.stockQuantity ?? 1) > 0);
    const catalog = available.length > 0 ? available : INITIAL_PRODUCTS;

    const count = Math.min(6, Math.max(4, catalog.length));
    return Array.from({ length: count }).map((_, idx) => {
      const prod = catalog[idx % catalog.length];
      const imgs = prod.imageUrls?.length ? prod.imageUrls : ['/images/hero-editorial.jpg'];
      const img =
        imgs[Math.floor(idx / Math.max(1, catalog.length)) % imgs.length] || imgs[0];
      return {
        id: `${prod.id}-${idx}`,
        product: prod,
        image: img,
        label: prod.name,
        labelArabic: prod.nameArabic || prod.name,
      };
    });
  }, [products]);

  const N = slides.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDraggingUI, setIsDraggingUI] = useState(false);
  const [stageBg, setStageBg] = useState('#F2F3F6');

  // Refs for zero-lag scroll + drag GPU transforms
  const trackRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const bodyRefs = useRef<(HTMLDivElement | null)[]>([]);

  const curRef = useRef<number>(0);
  const targetRef = useRef<number>(0);
  const indexRef = useRef<number>(0);
  const draggingRef = useRef<boolean>(false);
  const rafRef = useRef<number>(0);
  const metricsRef = useRef<{ W: number; H: number; isMobile: boolean }>({
    W: 1200,
    H: 520,
    isMobile: false,
  });

  const dragStartRef = useRef<{ x: number; y: number; startTarget: number; active: boolean }>({
    x: 0,
    y: 0,
    startTarget: 0,
    active: false,
  });

  // Sample corner pixel of the first product photo so hero stage matches the exact studio backdrop!
  useEffect(() => {
    const src = slides[0]?.image;
    if (!src || typeof window === 'undefined') return;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const cv = document.createElement('canvas');
        cv.width = 12;
        cv.height = 12;
        const ctx = cv.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 12, 12);
        const px = ctx.getImageData(2, 2, 1, 1).data;
        // Only apply if it's a clean light studio background (avoids dark/saturated backgrounds)
        if (px[3] > 200 && px[0] > 180 && px[1] > 180 && px[2] > 180) {
          setStageBg(`rgb(${px[0]}, ${px[1]}, ${px[2]})`);
        }
      } catch {
        // CORS fallback keeps clean #f5f5f7 studio white-grey
      }
    };
    img.src = src;
  }, [slides]);

  // Pure GPU transform placement (NO filter:blur! Ultra-fast 120fps)
  const renderRing = useCallback(
    (cur: number) => {
      const { W, H, isMobile } = metricsRef.current;
      if (!W || !H || N === 0) return;

      const cx = W * 0.5;
      const spacing = isMobile ? W * 0.62 : Math.min(340, W * 0.25);
      const baseBottom = isMobile ? 16 : 20;

      for (let i = 0; i < N; i++) {
        const el = bodyRefs.current[i];
        if (!el) continue;

        const d = i - cur;
        const absD = Math.abs(d);

        // Smooth depth perspective curve
        const x = cx + d * spacing * (1 - Math.min(0.28, absD * 0.08));
        const bottom = baseBottom + absD * (isMobile ? 16 : 24);
        const scale = Math.max(0.62, 1.06 - absD * 0.16);
        const opacity = clamp(1.12 - absD * 0.34, 0, 1);
        const zIndex = Math.round(100 - absD * 15);

        el.style.transform = `translate3d(${x.toFixed(1)}px, ${(-bottom).toFixed(
          1
        )}px, 0) translateX(-50%) scale(${scale.toFixed(4)})`;
        el.style.opacity = opacity.toFixed(3);
        el.style.zIndex = String(zIndex);
        el.style.visibility = opacity < 0.02 ? 'hidden' : 'visible';
        el.style.pointerEvents = opacity < 0.35 ? 'none' : 'auto';
      }
    },
    [N]
  );

  // On-demand smooth rAF loop (halts immediately when settled — zero idle CPU usage!)
  const kick = useCallback(() => {
    if (rafRef.current) return;
    let prev = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000) || 0.016;
      prev = now;

      const diff = targetRef.current - curRef.current;
      if (!draggingRef.current && Math.abs(diff) < 0.001) {
        curRef.current = targetRef.current;
        renderRing(curRef.current);
        rafRef.current = 0;
        return;
      }

      // Fast, responsive critically damped lerp
      const ease = draggingRef.current ? 1 : Math.min(1, dt * 14);
      curRef.current += diff * ease;
      renderRing(curRef.current);

      const nearest = clamp(Math.round(curRef.current), 0, N - 1);
      if (nearest !== indexRef.current) {
        indexRef.current = nearest;
        setActiveIndex(nearest);
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
  }, [N, renderRing]);

  // Measure stage dimensions
  const measure = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const isMobile = window.innerWidth <= 767;
    const modelH = Math.max(240, Math.round(rect.height - (isMobile ? 28 : 42)));
    stage.style.setProperty('--rw-model-h', `${modelH}px`);
    metricsRef.current = { W: rect.width, H: rect.height, isMobile };
    renderRing(curRef.current);
  }, [renderRing]);

  useEffect(() => {
    measure();
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
  }, [measure, slides]);

  // Native Passive Scroll-Driven Runway (scrolls through all looks 0 -> N-1, then moves to next section!)
  useEffect(() => {
    const onScroll = () => {
      if (window.innerWidth <= 767 || draggingRef.current) return;
      const track = trackRef.current;
      if (!track) return;

      const rect = track.getBoundingClientRect();
      const stickyTop = 80;
      const span = Math.max(1, track.offsetHeight - (window.innerHeight - stickyTop));
      const scrolled = stickyTop - rect.top;
      const progress = clamp(scrolled / span, 0, 1);

      targetRef.current = progress * Math.max(0, N - 1);
      kick();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [N, kick]);

  // Jump to specific look (smoothly scrolls the runway on desktop, or glides directly on mobile)
  const goToIndex = useCallback(
    (idx: number) => {
      const clampedIdx = clamp(idx, 0, N - 1);
      if (window.innerWidth > 767 && trackRef.current) {
        const trackTopDoc =
          trackRef.current.getBoundingClientRect().top + window.scrollY - 80;
        const span = Math.max(1, trackRef.current.offsetHeight - (window.innerHeight - 80));
        const ratio = N > 1 ? clampedIdx / (N - 1) : 0;
        window.scrollTo({
          top: Math.max(0, trackTopDoc + ratio * span),
          behavior: 'smooth',
        });
      } else {
        targetRef.current = clampedIdx;
        indexRef.current = clampedIdx;
        setActiveIndex(clampedIdx);
        kick();
      }
    },
    [N, kick]
  );

  // Pointer Drag / Swipe on stage
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startTarget: curRef.current,
      active: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const ds = dragStartRef.current;
    if (e.pointerType === 'mouse' && (e.buttons & 1) === 0) return;

    const dx = e.clientX - ds.x;
    const dy = e.clientY - ds.y;

    if (!ds.active) {
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
        ds.active = true;
        draggingRef.current = true;
        setIsDraggingUI(true);
        e.currentTarget.setPointerCapture(e.pointerId);
      } else {
        return;
      }
    }

    const unit = Math.max(160, metricsRef.current.W * 0.25);
    targetRef.current = clamp(ds.startTarget - dx / unit, 0, N - 1);
    kick();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const ds = dragStartRef.current;
    if (!ds.active) return;
    ds.active = false;
    draggingRef.current = false;
    setIsDraggingUI(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    goToIndex(Math.round(targetRef.current));
  };

  const activeSlide = slides[activeIndex] || slides[0];
  const activeProd = activeSlide.product;
  const activePrice = Number(activeProd.discountPrice || activeProd.price || 0);
  const scrollTrackExtraPx = Math.max(900, (N - 1) * 340);

  return (
    <div
      ref={trackRef}
      className="rw-track"
      style={
        {
          height: `calc(100vh - 80px + ${scrollTrackExtraPx}px)`,
          '--rw-stage': stageBg,
        } as React.CSSProperties
      }
    >
      <section
        className="rw"
        style={{ '--rw-stage': stageBg } as React.CSSProperties}
        aria-label="ARMIA Runway Hero"
      >
        {/* Top Row: Exact ARMIA Hero Heading + Active Piece CTA */}
        <div className="rw__head">
          <div className="rw__intro">
            <div className="rw__eyebrow">
              <Sparkles className="w-3 h-3" />
              <span>{t.hero.tagline}</span>
            </div>
            <h1 className="rw__title">
              {t.hero.headlinePart1}{' '}
              <span className="italic font-normal text-gold-gradient">
                {t.hero.headlinePart2}
              </span>
            </h1>
            <p className="rw__sub">{t.hero.description}</p>
          </div>

          <div className="rw__active-meta">
            <div className="rw__active-info">
              <span className="rw__active-cat">
                0{activeIndex + 1} / 0{N} •{' '}
                {isArabic && activeProd.categoryArabic
                  ? activeProd.categoryArabic
                  : activeProd.category}
              </span>
              <span className="rw__active-name">
                {isArabic ? activeSlide.labelArabic : activeSlide.label}
              </span>
              <span className="rw__active-price">
                EGP {activePrice.toLocaleString('en-EG')}
              </span>
            </div>

            <Link href={`/product/${activeProd.id}`} className="rw__shop-btn">
              <span>{isArabic ? 'عرض القطعة' : 'View Piece'}</span>
              <ArrowIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Full-Width 3D Runway Stage */}
        <div
          ref={stageRef}
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label="ARMIA Runway — scroll or drag to explore"
          className={`rw__stage ${isDraggingUI ? 'is-dragging' : ''}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') goToIndex(activeIndex + 1);
            else if (e.key === 'ArrowLeft') goToIndex(activeIndex - 1);
          }}
        >
          <div className="rw__actors">
            {slides.map((slide, i) => (
              <div
                key={slide.id}
                ref={(el) => {
                  bodyRefs.current[i] = el;
                }}
                className="rw__model"
              >
                <span className="rw__shadow" />
                <div className="rw__figure">
                  <div className="rw__art">
                    <img
                      src={slide.image}
                      alt={slide.label}
                      draggable={false}
                      loading={i < 3 ? 'eager' : 'lazy'}
                      fetchPriority={i === 0 ? 'high' : 'auto'}
                      decoding="async"
                    />
                    <button
                      type="button"
                      className="rw__hit"
                      aria-label={`View ${slide.label}`}
                      onClick={() => {
                        if (i === activeIndex) {
                          router.push(`/product/${slide.product.id}`);
                        } else {
                          goToIndex(i);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Progress Bar & Controls */}
        <div className="rw__controls">
          <button
            type="button"
            className="rw__icon"
            onClick={() => goToIndex(activeIndex - 1)}
            disabled={activeIndex === 0}
            aria-label="Previous look"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="rw__ticks">
            {slides.map((slide, i) => {
              const isCurrent = i === activeIndex;
              const isPast = i < activeIndex;
              return (
                <button
                  key={slide.id}
                  type="button"
                  className={`rw__tick ${isPast ? 'is-past' : ''}`}
                  aria-current={isCurrent ? 'true' : 'false'}
                  onClick={() => goToIndex(i)}
                >
                  <span className="rw__tick-bar" />
                  <span className="rw__tick-label">
                    {`0${i + 1}`}
                    <span className="rw__tick-name">
                      &nbsp;&nbsp;{isArabic ? slide.labelArabic : slide.label}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="rw__icon"
            onClick={() => goToIndex(activeIndex + 1)}
            disabled={activeIndex === N - 1}
            aria-label="Next look"
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          <span className="rw__scroll-hint">
            {isArabic ? 'مرّري للاستكشاف ↓' : 'Scroll to explore ↓'}
          </span>
        </div>
      </section>
    </div>
  );
}
