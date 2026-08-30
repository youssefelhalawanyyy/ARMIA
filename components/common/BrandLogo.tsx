'use client';

import React from 'react';
import Link from 'next/link';

interface BrandLogoProps {
  variant?: 'dark' | 'light' | 'gold';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  monogramOnly?: boolean;
  href?: string;
  className?: string;
}

export default function BrandLogo({
  variant = 'dark',
  size = 'md',
  showTagline = false,
  monogramOnly = false,
  href = '/',
  className = '',
}: BrandLogoProps) {
  // Sizing styles
  const sizeMap = {
    sm: {
      svg: 'w-6 h-6',
      title: 'text-sm tracking-[0.25em]',
      sub: 'text-[9px] tracking-[0.3em]',
      tagline: 'text-[8px] tracking-[0.15em]',
    },
    md: {
      svg: 'w-8 h-8',
      title: 'text-lg tracking-[0.28em]',
      sub: 'text-[10px] tracking-[0.35em]',
      tagline: 'text-[10px] tracking-[0.2em]',
    },
    lg: {
      svg: 'w-12 h-12',
      title: 'text-2xl tracking-[0.3em]',
      sub: 'text-xs tracking-[0.4em]',
      tagline: 'text-xs tracking-[0.22em]',
    },
    xl: {
      svg: 'w-20 h-20',
      title: 'text-4xl tracking-[0.32em]',
      sub: 'text-sm tracking-[0.45em]',
      tagline: 'text-sm tracking-[0.25em]',
    },
  };

  const currentSize = sizeMap[size];

  // Colors
  const textColor =
    variant === 'light'
      ? 'text-white'
      : variant === 'gold'
      ? 'text-[#DCC9A6]'
      : 'text-[#1F1F1F]';

  const subColor =
    variant === 'light'
      ? 'text-[#DCC9A6]'
      : variant === 'gold'
      ? 'text-[#DCC9A6]'
      : 'text-[#B67355]';

  const logoContent = (
    <div className={`flex flex-col items-center select-none text-center ${className}`}>
      {/* Luxury Monogram SVG */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${currentSize.svg} transition-transform duration-300 group-hover:scale-105`}
      >
        <defs>
          <linearGradient id={`goldGrad-${variant}-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F2E9DA" />
            <stop offset="40%" stopColor="#DCC9A6" />
            <stop offset="100%" stopColor="#B67355" />
          </linearGradient>
          <linearGradient id={`goldLine-${variant}-${size}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#B67355" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#DCC9A6" />
            <stop offset="100%" stopColor="#B67355" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Outer stylized elegant 'A' frame */}
        <path
          d="M 50 12 L 20 85 L 32 85 L 43 58 L 57 58 L 68 85 L 80 85 Z"
          fill={`url(#goldGrad-${variant}-${size})`}
          opacity="0.95"
        />
        
        {/* Monogram Inner cut */}
        <path
          d="M 50 28 L 45 52 L 55 52 Z"
          fill={variant === 'light' ? '#000000' : '#F6F3EE'}
        />

        {/* Elegant Silhouette with Hat & Flowing Hair Overlay */}
        <path
          d="M 50 14 C 54 14, 58 17, 60 21 C 62 25, 60 29, 58 32 C 63 36, 68 43, 67 52 C 65 62, 55 70, 42 78 C 36 82, 30 84, 25 85 C 32 81, 42 74, 49 65 C 56 56, 57 48, 54 42 C 51 38, 48 35, 47 31 C 45 25, 46 19, 50 14 Z"
          fill={`url(#goldGrad-${variant}-${size})`}
        />
        {/* Hat brim curve */}
        <path
          d="M 42 22 Q 54 13 65 24 Q 53 19 42 22 Z"
          fill="#FFF"
          opacity="0.8"
        />
        {/* Flowing hair golden ribbon highlight */}
        <path
          d="M 60 25 C 68 33, 72 45, 69 56 C 65 68, 52 77, 35 84"
          stroke={`url(#goldGrad-${variant}-${size})`}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>

      {!monogramOnly && (
        <div className="flex flex-col items-center mt-1">
          {/* Brand Name */}
          <span className={`font-serif font-semibold tracking-widest ${currentSize.title} ${textColor} leading-tight`}>
            ARMIA
          </span>

          {/* Boutique Subtitle with dividers */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-3 h-[0.5px] bg-[#DCC9A6]" />
            <span className={`font-sans font-medium uppercase ${currentSize.sub} ${subColor}`}>
              BOUTIQUE
            </span>
            <span className="w-3 h-[0.5px] bg-[#DCC9A6]" />
          </div>

          {/* Optional Tagline */}
          {showTagline && (
            <span className={`font-serif italic mt-1 ${currentSize.tagline} text-[#8E8A85]`}>
              Design for Your Style
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group inline-flex items-center justify-center">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}
