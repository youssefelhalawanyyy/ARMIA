'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingBag, Check } from 'lucide-react';
import { Product, ProductColor } from '@/types';
import { useCart } from '@/context/CartContext';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, toggleWishlist, isWishlisted } = useCart();
  const [selectedColor, setSelectedColor] = useState<ProductColor>(
    product.colors && product.colors.length > 0
      ? product.colors[0]
      : { name: 'Standard', hex: '#1F1F1F' }
  );
  const [isHovered, setIsHovered] = useState(false);
  const [quickAddSuccess, setQuickAddSuccess] = useState(false);

  const isFav = isWishlisted(product.id);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addToCart(
      {
        productId: product.id,
        name: product.name,
        price: product.discountPrice || product.price,
        originalPrice: product.price,
        quantity: 1,
        selectedColor: selectedColor,
        selectedSize: product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'Standard',
        imageUrl: product.imageUrls[0] || '',
        category: product.category,
      },
      true // open drawer
    );

    setQuickAddSuccess(true);
    setTimeout(() => setQuickAddSuccess(false), 2000);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const mainImage = product.imageUrls[0] || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800';
  const hoverImage = product.imageUrls[1] || mainImage;

  return (
    <div
      className="group flex flex-col bg-white border border-[#E8E2D8] hover:border-[#B67355] transition-all duration-300 shadow-sm hover:shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F6F3EE]">
        <Link href={`/product/${product.id}`} className="block w-full h-full">
          {/* Main & Hover Image Switch */}
          <Image
            src={isHovered && product.imageUrls.length > 1 ? hoverImage : mainImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
          />
        </Link>

        {/* Discount or New Tag */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none">
          {product.discountPrice && (
            <span className="bg-[#B67355] text-white text-[9px] font-sans font-bold uppercase tracking-wider px-2 py-0.5 shadow-sm">
              Sale
            </span>
          )}
          {product.isNewArrival && !product.discountPrice && (
            <span className="bg-[#1F1F1F] text-[#DCC9A6] text-[9px] font-sans font-semibold uppercase tracking-wider px-2 py-0.5 shadow-sm">
              New In
            </span>
          )}
        </div>

        {/* Wishlist Heart Button */}
        <button
          onClick={handleToggleWishlist}
          aria-label="Add to wishlist"
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-[#E8E2D8] flex items-center justify-center text-[#1F1F1F] hover:text-[#B67355] hover:border-[#B67355] transition-all shadow-sm z-10"
        >
          <Heart
            className={`w-4 h-4 transition-transform active:scale-125 ${
              isFav ? 'fill-[#B67355] text-[#B67355]' : 'text-[#1F1F1F]'
            }`}
          />
        </button>

        {/* Quick Add Overlay on Desktop Hover */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-center gap-2">
          <button
            onClick={handleQuickAdd}
            className="w-full bg-white text-[#1F1F1F] py-2 px-3 text-[11px] font-sans uppercase font-bold tracking-wider hover:bg-[#1F1F1F] hover:text-[#DCC9A6] transition-colors flex items-center justify-center gap-1.5 shadow"
          >
            {quickAddSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-600" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Quick Add</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Product Information */}
      <div className="p-4 flex flex-col flex-1 justify-between bg-white">
        <div>
          {/* Color Dots */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-1.5 mb-2">
              {product.colors.map((c) => (
                <button
                  key={c.name}
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedColor(c);
                  }}
                  title={c.name}
                  className={`w-3.5 h-3.5 rounded-full border transition-all ${
                    selectedColor.name === c.name
                      ? 'ring-1 ring-[#B67355] scale-110'
                      : 'border-[#E8E2D8]'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
              <span className="text-[10px] text-[#8E8A85] font-sans ml-1">
                {product.colors.length} {product.colors.length === 1 ? 'color' : 'colors'}
              </span>
            </div>
          )}

          {/* Product Name */}
          <Link href={`/product/${product.id}`} className="block">
            <h3 className="font-serif text-sm font-semibold tracking-wider text-[#1F1F1F] group-hover:text-[#B67355] transition-colors truncate">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Price in EGP */}
        <div className="mt-2.5 pt-2 border-t border-[#E8E2D8]/50 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            {product.discountPrice ? (
              <>
                <span className="font-serif text-sm font-bold text-[#B67355]">
                  EGP {product.discountPrice.toFixed(2)}
                </span>
                <span className="font-sans text-[11px] text-[#8E8A85] line-through">
                  EGP {product.price.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="font-serif text-sm font-bold text-[#1F1F1F]">
                EGP {product.price.toFixed(2)}
              </span>
            )}
          </div>

          <span className="text-[10px] font-sans uppercase tracking-widest text-[#8E8A85]">
            {product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'S-L'}
          </span>
        </div>
      </div>
    </div>
  );
}
