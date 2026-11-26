'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ZoomIn, ChevronDown } from 'lucide-react';
import { Product, ProductColor, ProductHotspot, Discount } from '@/types';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import FlashDealCountdown from './FlashDealCountdown';
import './spin-product.css';

interface SpinProductShowcaseProps {
  product: Product;
  effectivePrice: number;
  savingsAmount: number;
  flashDeal?: Discount | null;
  selectedColor: ProductColor | null;
  onSelectColor: (color: ProductColor) => void;
  selectedSize: string;
  onSelectSize: (size: string) => void;
  getStockForCombination: (colorName?: string, sizeName?: string) => number;
  isCombinationSoldOut: boolean;
  onAddToBag: () => void;
  onOpenSizeGuide: () => void;
  onOpenZoom: (imageIndex?: number) => void;
  onScrollToDetails?: () => void;
}

const DEFAULT_HOTSPOT_POSITIONS = [
  { x: 0.47, y: 0.24 },
  { x: 0.37, y: 0.33 },
  { x: 0.63, y: 0.43 },
];

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function normAngle(a: number): number {
  return ((a % 1) + 1) % 1;
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number
) {
  if (!srcW || !srcH) return;
  const srcRatio = srcW / srcH;
  const dstRatio = dstW / dstH;
  let drawW = dstW;
  let drawH = dstH;
  let dx = 0;
  let dy = 0;

  if (srcRatio > dstRatio) {
    drawH = dstH;
    drawW = dstH * srcRatio;
    dx = (dstW - drawW) / 2;
  } else {
    drawW = dstW;
    drawH = dstW / srcRatio;
    dy = (dstH - drawH) / 2;
  }

  ctx.drawImage(source, dx, dy, drawW, drawH);
}

export default function SpinProductShowcase({
  product,
  effectivePrice,
  savingsAmount,
  flashDeal,
  selectedColor,
  onSelectColor,
  selectedSize,
  onSelectSize,
  getStockForCombination,
  isCombinationSoldOut,
  onAddToBag,
  onOpenSizeGuide,
  onOpenZoom,
  onScrollToDetails,
}: SpinProductShowcaseProps) {
  const router = useRouter();
  const { itemCount, toggleWishlist, isWishlisted } = useCart();
  const { isArabic } = useLanguage();

  const [viewport, setViewport] = useState<{ w: number; h: number }>({
    w: 1500,
    h: 880,
  });
  const [isDesktop, setIsDesktop] = useState(true);
  const [openAcc, setOpenAcc] = useState<number>(0);
  const [isFront, setIsFront] = useState<boolean>(true);
  const [isDraggingUI, setIsDraggingUI] = useState<boolean>(false);
  const [activeLook, setActiveLook] = useState<number>(0);
  const [addedAnim, setAddedAnim] = useState<boolean>(false);
  const [bgColor, setBgColor] = useState<string>('#F2F3F6');
  const [activeHotspotMobile, setActiveHotspotMobile] = useState<number | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoThumbDataUrl, setVideoThumbDataUrl] = useState<string>('');

  // Refs for zero-lag scroll + drag physics
  const trackRef = useRef<HTMLDivElement | null>(null);
  const scaleKRef = useRef<number>(1);
  const angRef = useRef<number>(0); // displayed angle [0..1]
  const targetAngRef = useRef<number>(0); // scroll/drag target angle
  const lastRenderedAngRef = useRef<number>(-1);
  const velRef = useRef<number>(0);
  const draggingRef = useRef<boolean>(false);
  const lastXRef = useRef<number>(0);
  const lastTRef = useRef<number>(0);
  const dragVelRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const isFrontRef = useRef<boolean>(true);
  const activeLookRef = useRef<number>(0);

  // Media refs (GPU image layers for photos, 540x810 canvas for 360° video)
  const photoLayerRefs = useRef<(HTMLImageElement | null)[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lookCanvas0Ref = useRef<HTMLCanvasElement | null>(null);
  const lookCanvas1Ref = useRef<HTMLCanvasElement | null>(null);
  const framesRef = useRef<(Blob | null)[]>([]);
  const nfRef = useRef<number>(0);
  const decodingRef = useRef<boolean>(false);
  const wantedFrameRef = useRef<number>(-1);
  const drawnFrameRef = useRef<number>(-1);

  // UI refs
  const dotRef = useRef<HTMLDivElement | null>(null);
  const degValRef = useRef<HTMLSpanElement | null>(null);
  const buyBtnRef = useRef<HTMLButtonElement | null>(null);
  const sizeBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [hlStyle, setHlStyle] = useState<{ left: number; top: number; width: number }>({
    left: 0,
    top: 0,
    width: 0,
  });

  const isFav = isWishlisted(product.id);
  const hasVideo360 = Boolean(product.video360Url);
  const productImages = useMemo(
    () =>
      product.imageUrls && product.imageUrls.length > 0
        ? product.imageUrls
        : ['/images/hero-editorial.jpg'],
    [product.imageUrls]
  );
  const frontThumbDataUrl = videoThumbDataUrl || productImages[0] || '';

  // Scroll runway distance: ~360px per angle so scrolling feels snappy & natural
  const scrollRunwayPx = useMemo(() => {
    if (hasVideo360) return 1400;
    if (productImages.length <= 1) return 480;
    return Math.max(720, (productImages.length - 1) * 380);
  }, [hasVideo360, productImages.length]);

  const hotspots: ProductHotspot[] = useMemo(() => {
    if (product.hotspots && product.hotspots.length > 0) {
      return product.hotspots;
    }
    return [
      {
        x: DEFAULT_HOTSPOT_POSITIONS[0].x,
        y: DEFAULT_HOTSPOT_POSITIONS[0].y,
        title: isArabic ? 'الخامة والنسيج' : 'Fabric & Weave',
        text:
          (isArabic && product.specs?.fabricArabic
            ? product.specs.fabricArabic
            : product.specs?.fabric) ||
          '100% Premium Organic Linen & Cotton Blend, woven for breathable drape.',
      },
      {
        x: DEFAULT_HOTSPOT_POSITIONS[1].x,
        y: DEFAULT_HOTSPOT_POSITIONS[1].y,
        title: isArabic ? 'القصّة والتفصيل' : 'Tailored Silhouette',
        text:
          (isArabic && product.specs?.fitArabic
            ? product.specs.fitArabic
            : product.specs?.fit) ||
          'Relaxed architectural cut designed for effortless movement and volume.',
      },
      {
        x: DEFAULT_HOTSPOT_POSITIONS[2].x,
        y: DEFAULT_HOTSPOT_POSITIONS[2].y,
        title: isArabic ? 'حرفية الأتيليه' : 'Atelier Craft',
        text:
          (isArabic && product.specs?.careArabic
            ? product.specs.careArabic
            : product.specs?.care) ||
          'Hand-finished seams crafted in Cairo. Dry clean or gentle cold wash.',
      },
    ];
  }, [product, isArabic]);

  const accordionRows = useMemo(() => {
    const desc =
      (isArabic && product.descriptionArabic ? product.descriptionArabic : product.description) ||
      'Architectural silhouette crafted in our Cairo atelier with precision finishing.';
    const materials = [
      (isArabic && product.specs?.fabricArabic
        ? product.specs.fabricArabic
        : product.specs?.fabric) || '100% Premium Organic Linen & Cotton Blend.',
      (isArabic && product.specs?.careArabic ? product.specs.careArabic : product.specs?.care) ||
        'Dry clean or gentle hand wash cold.',
    ].join(' ');
    const sizeInfo = [
      (isArabic && product.specs?.fitArabic ? product.specs.fitArabic : product.specs?.fit) ||
        'Relaxed tailored silhouette.',
      (isArabic && product.specs?.modelInfoArabic
        ? product.specs.modelInfoArabic
        : product.specs?.modelInfo) || 'Take your usual size for the intended drape.',
    ].join(' ');

    return [
      { label: isArabic ? 'الوصف' : 'Description', text: desc },
      { label: isArabic ? 'الخامات والعناية' : 'Materials', text: materials },
      {
        label: isArabic ? 'دليل المقاسات' : 'Size guide',
        text: sizeInfo,
        isSizeGuide: true,
      },
      {
        label: isArabic ? 'التغليف' : 'Packaging',
        text: isArabic
          ? 'تُطوى القطعة بعناية في كيس قماشي قابل لإعادة الاستخدام وتُشحن داخل صندوق أرميا الفاخر بدون بلاستيك.'
          : 'Folded into a reusable cotton atelier pouch and shipped in a signature recycled ARMIA box. Zero plastic.',
      },
      {
        label: isArabic ? 'الشحن والاستبدال' : 'Shipping & returns',
        text: isArabic
          ? 'توصيل خلال 24–48 ساعة داخل القاهرة والجيزة (50 ج.م). شحن مجاني للطلبات فوق 1,500 ج.م، واستبدال مرن خلال 14 يوماً.'
          : 'Cairo & Giza delivery in 24–48 hours. Free shipping across Egypt on orders over EGP 1,500. Easy 14-day exchanges.',
      },
    ];
  }, [product, isArabic]);

  // Responsive viewport & K scale calculation
  useEffect(() => {
    const updateSize = () => {
      const w = window.innerWidth;
      const availH = Math.max(560, window.innerHeight - 80);
      setViewport({ w, h: availH });
      setIsDesktop(w >= 1024);
      scaleKRef.current = Math.min(w / 1500, availH / 880);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Measure sliding black highlight for selected size
  const updateHighlight = useCallback(() => {
    const activeBtn = sizeBtnRefs.current[selectedSize];
    if (!activeBtn) return;
    setHlStyle({
      left: activeBtn.offsetLeft,
      top: activeBtn.offsetTop,
      width: activeBtn.offsetWidth,
    });
  }, [selectedSize]);

  useEffect(() => {
    updateHighlight();
    const t = setTimeout(updateHighlight, 60);
    window.addEventListener('resize', updateHighlight);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', updateHighlight);
    };
  }, [updateHighlight, product.sizes, isDesktop]);

  // Crisp GPU-composited photo layer updates (zero ghosting, zero 2D canvas overhead)
  const updatePhotoLayers = useCallback(
    (progress: number) => {
      const count = productImages.length;
      if (count === 0) return;

      if (count === 1) {
        const el = photoLayerRefs.current[0];
        if (el) {
          const shift = Math.sin(progress * Math.PI * 2) * 16;
          el.style.opacity = '1';
          el.style.transform = `translate3d(${shift.toFixed(1)}px, 0, 0) scale(1.03)`;
        }
        return;
      }

      // Map [0..1] linearly across [0 .. count - 1] so scroll finishes cleanly on the last angle!
      const pos = clamp(progress, 0, 1) * (count - 1);
      const idxA = Math.min(count - 1, Math.floor(pos));
      const idxB = Math.min(count - 1, idxA + 1);
      const rawFrac = pos - idxA;

      // Crisp transition concentrated in the middle 40% so each angle stays razor-sharp with no ghosting
      const blend = clamp((rawFrac - 0.3) / 0.4, 0, 1);
      const smooth = easeInOutCubic(blend);

      for (let i = 0; i < count; i++) {
        const el = photoLayerRefs.current[i];
        if (!el) continue;

        if (i === idxA && i === idxB) {
          el.style.opacity = '1';
          el.style.zIndex = '2';
          el.style.transform = 'translate3d(0, 0, 0) scale(1)';
        } else if (i === idxA) {
          el.style.opacity = (1 - smooth).toFixed(3);
          el.style.zIndex = smooth < 0.5 ? '2' : '1';
          el.style.transform = `translate3d(${(-smooth * 12).toFixed(1)}px, 0, 0) scale(${(
            1 +
            smooth * 0.015
          ).toFixed(4)})`;
        } else if (i === idxB && smooth > 0.005) {
          el.style.opacity = smooth.toFixed(3);
          el.style.zIndex = smooth >= 0.5 ? '2' : '1';
          el.style.transform = `translate3d(${((1 - smooth) * 12).toFixed(1)}px, 0, 0) scale(${(
            1.015 -
            smooth * 0.015
          ).toFixed(4)})`;
        } else {
          el.style.opacity = '0';
          el.style.zIndex = '0';
        }
      }
    },
    [productImages.length]
  );

  // Render function for 360° video frame cache
  const showVideoFrame = useCallback((ang: number) => {
    const frames = framesRef.current;
    const nf = nfRef.current;
    if (!nf || frames.length === 0) return;

    const idx = ((Math.round(normAngle(ang) * nf) % nf) + nf) % nf;
    wantedFrameRef.current = idx;

    if (decodingRef.current || idx === drawnFrameRef.current) return;

    const decodeNext = async () => {
      decodingRef.current = true;
      while (wantedFrameRef.current !== drawnFrameRef.current) {
        const target = wantedFrameRef.current;
        const blob = framesRef.current[target];
        if (!blob) {
          drawnFrameRef.current = target;
          break;
        }
        try {
          const bmp = await createImageBitmap(blob);
          const cv = canvasRef.current;
          if (cv) {
            const ctx = cv.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, cv.width, cv.height);
              drawCover(ctx, bmp, bmp.width, bmp.height, cv.width, cv.height);
            }
          }
          bmp.close();
          drawnFrameRef.current = target;
        } catch {
          drawnFrameRef.current = target;
          break;
        }
      }
      decodingRef.current = false;
    };

    decodeNext();
  }, []);

  // Render a specific angle to DOM (zero React re-renders unless front/look index flips)
  const applyAngleToDOM = useCallback(
    (ang: number) => {
      const clamped = hasVideo360 ? normAngle(ang) : clamp(ang, 0, 1);
      lastRenderedAngRef.current = clamped;

      if (dotRef.current) {
        dotRef.current.style.left = `${(clamped * 100).toFixed(2)}%`;
      }
      if (degValRef.current) {
        const deg = Math.round(clamped * 360);
        degValRef.current.textContent = `${String(deg).padStart(3, '0')}°`;
      }

      if (hasVideo360) {
        showVideoFrame(clamped);
      } else {
        updatePhotoLayers(clamped);
      }

      // Front-facing detection (first angle / 0°±4%)
      const facingFront =
        (clamped < 0.04 || (hasVideo360 && clamped > 0.96)) &&
        !draggingRef.current &&
        Math.abs(velRef.current) < 0.05;

      if (facingFront !== isFrontRef.current) {
        isFrontRef.current = facingFront;
        setIsFront(facingFront);
      }

      // Active look thumbnail index
      const totalLooks = hasVideo360 ? 2 : productImages.length;
      const nextLook = hasVideo360
        ? clamped > 0.25 && clamped < 0.75
          ? 1
          : 0
        : Math.min(totalLooks - 1, Math.round(clamped * (totalLooks - 1)));

      if (nextLook !== activeLookRef.current) {
        activeLookRef.current = nextLook;
        setActiveLook(nextLook);
      }
    },
    [hasVideo360, productImages.length, showVideoFrame, updatePhotoLayers]
  );

  // On-demand smooth rAF loop (ONLY runs while catching up to scroll/drag target, stops immediately when settled!)
  const kickLoop = useCallback(() => {
    if (rafRef.current) return;
    let prev = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000) || 0.016;
      prev = now;

      if (draggingRef.current) {
        applyAngleToDOM(angRef.current);
        rafRef.current = requestAnimationFrame(step);
        return;
      }

      if (Math.abs(velRef.current) > 0.002) {
        velRef.current *= Math.pow(0.08, dt);
        targetAngRef.current = hasVideo360
          ? normAngle(targetAngRef.current + velRef.current * dt)
          : clamp(targetAngRef.current + velRef.current * dt, 0, 1);
      } else {
        velRef.current = 0;
      }

      const diff = targetAngRef.current - angRef.current;
      if (Math.abs(diff) < 0.0006 && velRef.current === 0) {
        angRef.current = targetAngRef.current;
        applyAngleToDOM(angRef.current);
        rafRef.current = 0;
        return;
      }

      angRef.current += diff * Math.min(1, dt * 14);
      applyAngleToDOM(angRef.current);
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
  }, [applyAngleToDOM, hasVideo360]);

  // Initial photo paint + sample corner studio background color so model melts seamlessly into stage
  useEffect(() => {
    if (!hasVideo360) {
      applyAngleToDOM(angRef.current);

      const src = productImages[0];
      if (src && typeof window !== 'undefined') {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const cv = document.createElement('canvas');
            cv.width = 16;
            cv.height = 16;
            const ctx = cv.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(img, 0, 0, 16, 16);
            const p1 = ctx.getImageData(1, 1, 1, 1).data;
            const p2 = ctx.getImageData(14, 1, 1, 1).data;
            const r = Math.round((p1[0] + p2[0]) / 2);
            const g = Math.round((p1[1] + p2[1]) / 2);
            const b = Math.round((p1[2] + p2[2]) / 2);
            if (p1[3] > 200 && r > 175 && g > 175 && b > 175) {
              setBgColor(`rgb(${r}, ${g}, ${b})`);
            }
          } catch {
            // CORS fallback keeps #F2F3F6
          }
        };
        img.src = src;
      }
    }
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
  }, [hasVideo360, productImages, applyAngleToDOM, isDesktop]);

  // Native Passive Scroll-to-Rotate Listener (Desktop Sticky Runway)
  useEffect(() => {
    if (!isDesktop) return;

    const onScroll = () => {
      const track = trackRef.current;
      if (!track || draggingRef.current) return;
      const rect = track.getBoundingClientRect();
      const stickyTop = 80;
      const span = Math.max(1, track.offsetHeight - (window.innerHeight - stickyTop));
      const scrolled = stickyTop - rect.top;
      const progress = clamp(scrolled / span, 0, 1);

      velRef.current = 0;
      targetAngRef.current = progress;
      kickLoop();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [isDesktop, scrollRunwayPx, kickLoop]);

  // 360° Video Frame-Cache Engine (when product.video360Url is provided)
  const drawVideoThumbnails = useCallback(async () => {
    const frames = framesRef.current;
    const nf = nfRef.current;
    if (!nf || frames.length === 0) return;

    const drawThumb = async (
      frameIdx: number,
      targetCanvas: HTMLCanvasElement | null,
      saveDataUrl?: boolean
    ) => {
      const blob = frames[((frameIdx % nf) + nf) % nf];
      if (!blob || !targetCanvas) return;
      try {
        const bmp = await createImageBitmap(blob);
        const ctx = targetCanvas.getContext('2d');
        if (ctx) {
          const sq = bmp.width * 0.62;
          const sx = (bmp.width - sq) / 2;
          const sy = bmp.height * 0.07;
          ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
          ctx.drawImage(bmp, sx, sy, sq, sq, 0, 0, targetCanvas.width, targetCanvas.height);
          if (saveDataUrl) {
            setVideoThumbDataUrl(targetCanvas.toDataURL('image/jpeg', 0.85));
          }
        }
        bmp.close();
      } catch {}
    };

    await drawThumb(0, lookCanvas0Ref.current, true);
    await drawThumb(Math.round(nf * 0.5), lookCanvas1Ref.current, false);
  }, []);

  useEffect(() => {
    if (!hasVideo360 || !product.video360Url) return;
    const vid = videoRef.current;
    if (!vid) return;

    let cancelled = false;
    setVideoReady(false);
    framesRef.current = [];
    nfRef.current = 0;
    drawnFrameRef.current = -1;

    const finalizeCache = () => {
      if (cancelled) return;
      setTimeout(() => {
        if (cancelled) return;
        const arr = framesRef.current;
        if (arr.length === 0) return;

        let lastGood: Blob | null = null;
        for (let i = 0; i < arr.length; i++) {
          if (arr[i]) lastGood = arr[i];
          else if (lastGood) arr[i] = lastGood;
        }
        for (let i = arr.length - 1; i >= 0; i--) {
          if (arr[i]) lastGood = arr[i];
          else if (lastGood) arr[i] = lastGood;
        }
        if (arr.length > 2) arr.pop();
        nfRef.current = arr.length;
        setVideoReady(true);
        showVideoFrame(angRef.current);
        drawVideoThumbnails();
      }, 150);
    };

    const handleLoadedData = async () => {
      if (cancelled || !vid.duration || !vid.videoWidth) return;
      const totalFrames = Math.max(2, Math.round(vid.duration * 24));
      framesRef.current = new Array(totalFrames).fill(null);

      const offW = Math.min(540, vid.videoWidth);
      const offH = Math.round((offW * vid.videoHeight) / vid.videoWidth);
      const off = document.createElement('canvas');
      off.width = offW;
      off.height = offH;
      const offCtx = off.getContext('2d', { willReadFrequently: true });
      if (!offCtx) return;

      try {
        offCtx.drawImage(vid, 0, 0, offW, offH);
        const px = offCtx.getImageData(6, 6, 1, 1).data;
        if (px[3] > 200) setBgColor(`rgb(${px[0]}, ${px[1]}, ${px[2]})`);
      } catch {}

      const captureFrameAt = (index: number): Promise<void> =>
        new Promise((resolve) => {
          if (cancelled || index < 0 || index >= totalFrames) {
            resolve();
            return;
          }
          try {
            offCtx.drawImage(vid, 0, 0, offW, offH);
            off.toBlob(
              (blob) => {
                if (blob && !cancelled) framesRef.current[index] = blob;
                resolve();
              },
              'image/jpeg',
              0.85
            );
          } catch {
            resolve();
          }
        });

      const hasRVFC =
        typeof (vid as HTMLVideoElement & { requestVideoFrameCallback?: unknown })
          .requestVideoFrameCallback === 'function';

      if (hasRVFC) {
        vid.loop = false;
        vid.currentTime = 0;
        const onFrame = (_now: number, meta: { mediaTime: number }) => {
          if (cancelled) return;
          const idx = clamp(Math.round(meta.mediaTime * 24), 0, totalFrames - 1);
          captureFrameAt(idx);
          if (!vid.ended && !vid.paused) {
            (
              vid as HTMLVideoElement & {
                requestVideoFrameCallback: (cb: typeof onFrame) => number;
              }
            ).requestVideoFrameCallback(onFrame);
          }
        };
        vid.addEventListener('ended', finalizeCache, { once: true });
        (
          vid as HTMLVideoElement & {
            requestVideoFrameCallback: (cb: typeof onFrame) => number;
          }
        ).requestVideoFrameCallback(onFrame);
        vid.play().catch(() => {});
      } else {
        vid.pause();
        for (let i = 0; i < totalFrames; i++) {
          if (cancelled) return;
          await new Promise<void>((res) => {
            const onSeeked = () => captureFrameAt(i).then(res);
            vid.addEventListener('seeked', onSeeked, { once: true });
            vid.currentTime = Math.min(vid.duration - 0.01, i / 24);
          });
        }
        finalizeCache();
      }
    };

    vid.addEventListener('loadeddata', handleLoadedData, { once: true });
    if (vid.readyState >= 2) handleLoadedData();
    return () => {
      cancelled = true;
      vid.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [hasVideo360, product.video360Url, showVideoFrame, drawVideoThumbnails]);

  // Click thumbnail → smoothly scroll runway (on desktop) or spin directly (on mobile)
  const jumpToProgress = useCallback(
    (targetProgress: number) => {
      const clamped = clamp(targetProgress, 0, 1);
      if (isDesktop && trackRef.current) {
        const trackTopDoc =
          trackRef.current.getBoundingClientRect().top + window.scrollY - 80;
        const span = Math.max(1, trackRef.current.offsetHeight - (window.innerHeight - 80));
        window.scrollTo({
          top: Math.max(0, trackTopDoc + clamped * span),
          behavior: 'smooth',
        });
      } else {
        velRef.current = 0;
        targetAngRef.current = clamped;
        kickLoop();
      }
    },
    [isDesktop, kickLoop]
  );

  // Stage pointer drag handlers (works alongside scroll!)
  const handleStagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = true;
    setIsDraggingUI(true);
    velRef.current = 0;
    lastXRef.current = e.clientX;
    lastTRef.current = performance.now();
    dragVelRef.current = 0;
    kickLoop();
  };

  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const now = performance.now();
    const dx = e.clientX - lastXRef.current;
    const dtMs = Math.max(8, now - lastTRef.current);
    const k = isDesktop ? scaleKRef.current : 1;
    const d = -dx / k / 700;

    angRef.current = hasVideo360
      ? normAngle(angRef.current + d)
      : clamp(angRef.current + d, 0, 1);
    targetAngRef.current = angRef.current;
    dragVelRef.current = (d / dtMs) * 1000 * 0.6 + dragVelRef.current * 0.4;
    lastXRef.current = e.clientX;
    lastTRef.current = now;
  };

  const handleStagePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setIsDraggingUI(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    velRef.current = clamp(dragVelRef.current, -1.8, 1.8);
    kickLoop();
  };

  // Add to bag with flying 60x80 card arc straight into ARMIA's real Navbar Bag!
  const handleBuyClick = () => {
    if (isCombinationSoldOut || (product.stockQuantity ?? 0) === 0) return;

    setAddedAnim(true);
    setTimeout(() => setAddedAnim(false), 1800);

    const btnEl = buyBtnRef.current;
    const bagEl =
      typeof document !== 'undefined'
        ? (document.querySelector('header button[aria-label="Shopping Bag"]') as HTMLElement | null)
        : null;

    if (btnEl && bagEl) {
      const from = btnEl.getBoundingClientRect();
      const to = bagEl.getBoundingClientRect();

      const fly = document.createElement('div');
      fly.className = 'spin-fly-card';
      fly.style.left = `${from.left + from.width / 2 - 30}px`;
      fly.style.top = `${from.top + from.height / 2 - 40}px`;

      const img = document.createElement('img');
      img.src = frontThumbDataUrl || productImages[0] || '';
      img.alt = product.name;
      fly.appendChild(img);
      document.body.appendChild(fly);

      const dx = to.left + to.width / 2 - (from.left + from.width / 2);
      const dy = to.top + to.height / 2 - (from.top + from.height / 2);

      fly.animate(
        [
          { transform: 'translate3d(0px, 0px, 0) scale(1) rotate(0deg)', opacity: 1 },
          {
            transform: `translate3d(${dx * 0.5}px, ${dy * 0.5 - 110}px, 0) scale(0.8) rotate(-8deg)`,
            opacity: 1,
            offset: 0.5,
          },
          {
            transform: `translate3d(${dx}px, ${dy}px, 0) scale(0.18) rotate(-14deg)`,
            opacity: 0.9,
          },
        ],
        {
          duration: 850,
          easing: 'cubic-bezier(0.5, 0, 0.3, 1)',
          fill: 'forwards',
        }
      );

      setTimeout(() => {
        fly.remove();
        onAddToBag();
        bagEl.animate(
          [
            { transform: 'translateY(0) scale(1)' },
            { transform: 'translateY(-6px) scale(1.35)', offset: 0.45 },
            { transform: 'translateY(0) scale(1)' },
          ],
          { duration: 480, easing: 'cubic-bezier(0.3, 1.8, 0.5, 1)' }
        );
      }, 850);
    } else {
      onAddToBag();
    }
  };

  const handleCheckoutNow = () => {
    if (itemCount === 0 && !isCombinationSoldOut && (product.stockQuantity ?? 0) > 0) {
      onAddToBag();
    }
    router.push('/checkout');
  };

  const currentStock = getStockForCombination(selectedColor?.name, selectedSize);
  const displayName = isArabic && product.nameArabic ? product.nameArabic : product.name;
  const displayCategory =
    isArabic && product.categoryArabic ? product.categoryArabic : product.category;

  const badgeLabel = flashDeal
    ? flashDeal.type === 'percentage'
      ? `${flashDeal.value}% OFF`
      : `EGP ${flashDeal.value} OFF`
    : product.discountPrice
    ? isArabic
      ? 'تخفيض'
      : 'SALE'
    : product.isNewArrival
    ? isArabic
      ? 'جديد'
      : 'NEW IN'
    : isArabic
    ? 'متوفر'
    : 'IN STOCK';

  const sizeCols =
    product.sizes && product.sizes.length <= 3
      ? Math.max(1, product.sizes.length)
      : product.sizes && product.sizes.length === 4
      ? 4
      : 3;

  const K = Math.min(viewport.w / 1500, viewport.h / 880);

  const renderInfoCardContent = () => (
    <>
      <h1 className="spin-prod-name">{displayName}</h1>

      <div className="spin-price-row">
        <div className="flex items-baseline gap-2">
          <span className="font-medium">
            EGP {Number(effectivePrice || product.price).toLocaleString('en-EG')}
          </span>
          {(flashDeal || product.discountPrice) && savingsAmount > 0 && (
            <span className="text-[11px] line-through" style={{ color: 'var(--mute)' }}>
              EGP {Number(product.price).toLocaleString('en-EG')}
            </span>
          )}
        </div>
        <span className="spin-tag">{badgeLabel}</span>
      </div>

      {flashDeal?.endTime && (
        <div className="mt-3">
          <FlashDealCountdown
            endTime={flashDeal.endTime}
            title={
              (isArabic && flashDeal.titleArabic ? flashDeal.titleArabic : flashDeal.title) ||
              `Flash Deal: ${product.name}`
            }
            discountBadge={badgeLabel}
          />
        </div>
      )}

      <div className="spin-acc">
        {accordionRows.map((row, idx) => {
          const isOpen = openAcc === idx;
          return (
            <div key={row.label} className="spin-acc-item">
              <button
                type="button"
                className="spin-acc-btn"
                onClick={() => setOpenAcc(isOpen ? -1 : idx)}
                aria-expanded={isOpen}
              >
                <span>{row.label}</span>
                <span>{isOpen ? '[−]' : '[+]'}</span>
              </button>
              <div className={`spin-acc-body ${isOpen ? 'open' : ''}`}>
                <div className="spin-acc-inner">
                  <p className="spin-acc-text">
                    {row.text}
                    {row.isSizeGuide && (
                      <>
                        {' '}
                        <button
                          type="button"
                          onClick={onOpenSizeGuide}
                          className="underline underline-offset-2 text-[12px] uppercase tracking-wider font-mono text-[#1F1F1F]"
                        >
                          {isArabic ? 'جدول القياسات الكامل' : 'Full chart'}
                        </button>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  const renderBuyCardContent = () => (
    <>
      {product.colors && product.colors.length > 0 && (
        <div>
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.05em]">
            <span>{isArabic ? 'اللون' : 'COLOR'}</span>
            <span style={{ color: 'var(--mute)' }}>
              {isArabic && selectedColor?.nameArabic
                ? selectedColor.nameArabic
                : selectedColor?.name}
            </span>
          </div>
          <div className="spin-colors">
            {product.colors.map((c) => {
              const active = selectedColor?.name === c.name;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => onSelectColor(c)}
                  className={`spin-color-chip ${active ? 'active' : ''}`}
                >
                  <span className="spin-color-dot" style={{ backgroundColor: c.hex }} />
                  <span>{isArabic && c.nameArabic ? c.nameArabic : c.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[13px] uppercase tracking-[0.05em]">
          {isArabic ? 'المقاس' : 'SIZE'}
        </span>
        <span
          className="text-[10.5px] uppercase tracking-[0.04em]"
          style={{ color: 'var(--mute)' }}
        >
          {isCombinationSoldOut || product.stockQuantity === 0
            ? isArabic
              ? 'نفدت الكمية'
              : 'SOLD OUT'
            : currentStock <= 3
            ? isArabic
              ? `باقي ${currentStock} فقط`
              : `ONLY ${currentStock} LEFT`
            : isArabic
            ? 'متوفر للشحن'
            : 'READY TO SHIP'}
        </span>
      </div>

      {product.sizes && product.sizes.length > 0 && (
        <div
          className="spin-sizes-wrap"
          style={{ gridTemplateColumns: `repeat(${sizeCols}, minmax(0, 1fr))` }}
        >
          {hlStyle.width > 0 && (
            <div
              className="spin-hl"
              style={{
                transform: `translate3d(${hlStyle.left}px, ${hlStyle.top}px, 0)`,
                width: `${hlStyle.width}px`,
              }}
            />
          )}
          {product.sizes.map((size) => {
            const stock = getStockForCombination(selectedColor?.name, size);
            const soldOut = stock === 0;
            const active = selectedSize === size;
            return (
              <button
                key={size}
                ref={(el) => {
                  sizeBtnRefs.current[size] = el;
                }}
                type="button"
                onClick={() => onSelectSize(size)}
                className={`spin-size-btn ${active ? 'active' : ''} ${
                  soldOut ? 'sold-out' : ''
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      )}

      <p className="spin-note">
        {(isArabic && product.specs?.modelInfoArabic
          ? product.specs.modelInfoArabic
          : product.specs?.modelInfo) ||
          (isArabic ? 'العارضة بطول 174 سم وترتدي مقاس M' : 'Model is 174 cm & wears size M')}
        .{' '}
        <button type="button" onClick={onOpenSizeGuide}>
          {isArabic ? 'دليل المقاسات' : 'Size guide'}
        </button>
      </p>

      <div className="spin-actions">
        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          className={`spin-save-btn ${isFav ? 'saved' : ''}`}
        >
          {isFav ? (isArabic ? 'محفوظ' : 'Saved') : isArabic ? 'حفظ' : 'Save'}
        </button>

        <button
          ref={buyBtnRef}
          type="button"
          onClick={handleBuyClick}
          disabled={isCombinationSoldOut || (product.stockQuantity ?? 0) === 0}
          className={`spin-buy-btn ${addedAnim ? 'added' : ''}`}
        >
          <span className="spin-buy-label primary">
            {isCombinationSoldOut || (product.stockQuantity ?? 0) === 0
              ? isArabic
                ? 'نفدت الكمية'
                : 'Sold out'
              : isArabic
              ? 'أضيفي للحقيبة'
              : 'Add to bag'}
          </span>
          <span className="spin-buy-label secondary">
            {isArabic ? 'تمت الإضافة' : 'Added to bag'}
          </span>
        </button>
      </div>

      <p className="spin-note">
        {isArabic
          ? 'الدفع عند الاستلام أو إنستا باي متاح. '
          : 'Cash on delivery & InstaPay at checkout. '}
        <button type="button" onClick={handleCheckoutNow}>
          {isArabic ? 'إتمام الطلب' : 'Checkout now'}
        </button>
      </p>
    </>
  );

  const renderStageInner = () => (
    <>
      <div className="spin-media-mask">
        {hasVideo360 ? (
          <>
            <video
              ref={videoRef}
              src={product.video360Url}
              muted
              playsInline
              loop
              autoPlay
              preload="auto"
              crossOrigin="anonymous"
              className="spin-video"
              style={{ opacity: videoReady ? 0 : 1 }}
            />
            <canvas ref={canvasRef} width={540} height={810} className="spin-canvas" />
          </>
        ) : (
          productImages.map((src, idx) => (
            <img
              key={`${src}-${idx}`}
              ref={(el) => {
                photoLayerRefs.current[idx] = el;
              }}
              src={src}
              alt={`${product.name} angle ${idx + 1}`}
              draggable={false}
              loading={idx === 0 ? 'eager' : 'lazy'}
              decoding="async"
              fetchPriority={idx === 0 ? 'high' : 'auto'}
              className="spin-photo-layer"
              style={{
                opacity: idx === 0 ? 1 : 0,
                zIndex: idx === 0 ? 2 : 0,
              }}
            />
          ))
        )}
      </div>

      {/* High-Res Zoom trigger */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenZoom(activeLook < productImages.length ? activeLook : 0);
        }}
        title={isArabic ? 'تكبير فائق الدقة' : 'High-Res Studio Zoom'}
        className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-white/85 hover:bg-white text-[#1F1F1F] flex items-center justify-center shadow-sm transition-opacity opacity-80 hover:opacity-100"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      {/* Three Pulsing Hotspots (visible at Front / 0°) */}
      {hotspots.map((hs, idx) => {
        const isRight = hs.x > 0.5;
        return (
          <div
            key={hs.title}
            className={`spin-hs-wrap ${isFront ? 'show' : ''} ${
              activeHotspotMobile === idx ? 'active' : ''
            }`}
            style={
              {
                left: `${hs.x * 100}%`,
                top: `${hs.y * 100}%`,
                '--hs-delay': `${idx * 0.08}s`,
              } as React.CSSProperties
            }
          >
            <button
              type="button"
              className="spin-hs"
              aria-label={hs.title}
              onClick={(e) => {
                e.stopPropagation();
                setActiveHotspotMobile((prev) => (prev === idx ? null : idx));
              }}
            >
              +
            </button>
            <div className={`spin-tip ${isRight ? 'tip-right' : 'tip-left'}`}>
              <div className="spin-tip-title">
                {isArabic && hs.titleArabic ? hs.titleArabic : hs.title}
              </div>
              <div className="spin-tip-text">
                {isArabic && hs.textArabic ? hs.textArabic : hs.text}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );

  const renderLooks = () => {
    if (hasVideo360) {
      return (
        <>
          <button
            type="button"
            className={`spin-look-btn ${activeLook === 0 ? 'active' : ''}`}
            onClick={() => jumpToProgress(0)}
            aria-label="Front look"
          >
            <canvas ref={lookCanvas0Ref} width={96} height={96} className="spin-look-media" />
            <span className="spin-bracket tl" />
            <span className="spin-bracket tr" />
            <span className="spin-bracket bl" />
            <span className="spin-bracket br" />
          </button>
          <button
            type="button"
            className={`spin-look-btn ${activeLook === 1 ? 'active' : ''}`}
            onClick={() => jumpToProgress(0.5)}
            aria-label="Back look"
          >
            <canvas ref={lookCanvas1Ref} width={96} height={96} className="spin-look-media" />
            <span className="spin-bracket tl" />
            <span className="spin-bracket tr" />
            <span className="spin-bracket bl" />
            <span className="spin-bracket br" />
          </button>
        </>
      );
    }

    return productImages.slice(0, 5).map((imgUrl, idx) => {
      const denom = Math.max(1, productImages.length - 1);
      return (
        <button
          key={`${imgUrl}-${idx}`}
          type="button"
          className={`spin-look-btn ${activeLook === idx ? 'active' : ''}`}
          onClick={() => jumpToProgress(idx / denom)}
          aria-label={`Angle ${idx + 1}`}
        >
          <img src={imgUrl} alt={`Angle ${idx + 1}`} className="spin-look-media" />
          <span className="spin-bracket tl" />
          <span className="spin-bracket tr" />
          <span className="spin-bracket bl" />
          <span className="spin-bracket br" />
        </button>
      );
    });
  };

  return (
    <div className="spin-root" style={{ '--bg': bgColor } as React.CSSProperties}>
      {isDesktop ? (
        /* Sticky Scroll-to-Rotate Track: scrolls through every angle, then naturally advances to next section */
        <div
          ref={trackRef}
          className="spin-scroll-track"
          style={{ height: `calc(100vh - 80px + ${scrollRunwayPx}px)` }}
        >
          <section className="spin-viewport">
            <div
              className="spin-art"
              style={{
                left: `${viewport.w / 2}px`,
                top: `${viewport.h / 2}px`,
                transform: `scale(${K}) translate(-750px, -440px)`,
              }}
            >
              {/* Breadcrumb */}
              <nav className="spin-crumb" aria-label="Breadcrumb">
                <Link href="/">HOME</Link>
                <span>&gt;</span>
                <Link href="/collections">SHOP</Link>
                <span>&gt;</span>
                <Link href={`/collections/${product.category}`} className="spin-crumb-cur">
                  {displayCategory}
                </Link>
              </nav>

              {/* Top-Right Studio Zoom Pill */}
              <div className="spin-stage-badge">
                <button
                  type="button"
                  onClick={() => onOpenZoom(activeLook < productImages.length ? activeLook : 0)}
                  className="spin-pill"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'تكبير' : 'Studio Zoom'}</span>
                </button>
              </div>

              {/* Architectural Connector Lines */}
              <svg className="spin-connectors" viewBox="0 0 1500 880" aria-hidden="true">
                <path
                  d="M444 290H562L592 258H620"
                  pathLength={1}
                  className={`spin-conn-path ${isFront ? 'show' : ''}`}
                />
                <path
                  d="M1095 450H962L937 360H900"
                  pathLength={1}
                  className={`spin-conn-path ${isFront ? 'show' : ''}`}
                />
              </svg>

              {/* Center 360° Scroll + Drag Stage */}
              <div
                className={`spin-stage ${isDraggingUI ? 'dragging' : ''}`}
                onPointerDown={handleStagePointerDown}
                onPointerMove={handleStagePointerMove}
                onPointerUp={handleStagePointerUp}
                onPointerCancel={handleStagePointerUp}
              >
                {renderStageInner()}
              </div>

              {/* Scroll / Drag Angle Readout */}
              <div className="spin-deg">
                <span>
                  {isArabic ? 'مرّري أو اسحبي للتدوير' : 'SCROLL OR DRAG TO ROTATE'}
                </span>
                <div className="spin-deg-bar">
                  <div ref={dotRef} className="spin-deg-dot" style={{ left: '0%' }} />
                </div>
                <span ref={degValRef} className="spin-deg-val">
                  000°
                </span>
              </div>

              {/* Left Notched Product Info Card */}
              <aside className="spin-card-info">{renderInfoCardContent()}</aside>

              {/* Bottom-Left Angle Thumbnails */}
              <div className="spin-looks">{renderLooks()}</div>

              {/* Right Notched Size & Buy Card */}
              <aside className="spin-card-buy">{renderBuyCardContent()}</aside>

              {/* Scroll Cue */}
              {onScrollToDetails && (
                <button type="button" onClick={onScrollToDetails} className="spin-scroll-cue">
                  <span>{isArabic ? 'أكملي الإطلالة' : 'Complete the look'}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </section>
        </div>
      ) : (
        <section className="spin-mobile">
          <div className="text-[10.5px] uppercase tracking-[0.05em] text-[#8E8A85] flex items-center gap-1.5">
            <Link href="/">HOME</Link>
            <span>&gt;</span>
            <Link href="/collections">SHOP</Link>
            <span>&gt;</span>
            <span className="text-[#1F1F1F]">{displayCategory}</span>
          </div>

          <div
            className={`spin-mobile-stage ${isDraggingUI ? 'dragging' : ''}`}
            onPointerDown={handleStagePointerDown}
            onPointerMove={handleStagePointerMove}
            onPointerUp={handleStagePointerUp}
            onPointerCancel={handleStagePointerUp}
          >
            {renderStageInner()}
          </div>

          <div className="flex items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2 overflow-x-auto">{renderLooks()}</div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.06em] text-[#8E8A85]">
              <div className="spin-deg-bar" style={{ width: 72 }}>
                <div ref={dotRef} className="spin-deg-dot" style={{ left: '0%' }} />
              </div>
              <span ref={degValRef} className="spin-deg-val">
                000°
              </span>
            </div>
          </div>

          <div className="spin-mobile-card">{renderBuyCardContent()}</div>
          <div className="spin-mobile-card">{renderInfoCardContent()}</div>
        </section>
      )}
    </div>
  );
}
