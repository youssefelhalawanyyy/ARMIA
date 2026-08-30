'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, User, Heart, ShoppingBag, Menu, X, ShieldAlert, LogOut, Package } from 'lucide-react';
import BrandLogo from '@/components/common/BrandLogo';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import CartDrawer from './CartDrawer';
import AuthModal from './AuthModal';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount, setIsCartOpen, wishlist } = useCart();
  const { user, isAdmin, logout } = useAuth();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Scroll listener for sticky header background
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'HOME', href: '/' },
    { name: 'COLLECTIONS', href: '/collections' },
    { name: 'NEW IN', href: '/collections/new-in' },
    { name: 'BEST SELLERS', href: '/collections/best-sellers' },
    { name: 'ABOUT US', href: '/about' },
    { name: 'CONTACT', href: '/contact' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/collections?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="bg-[#1F1F1F] text-[#DCC9A6] text-[11px] font-sans font-medium tracking-[0.25em] uppercase py-2 px-4 text-center border-b border-[#333333]">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
          <span className="hidden sm:inline">✦ WHOLESALE & RETAIL</span>
          <span className="hidden sm:inline">•</span>
          <span>FAST SHIPPING ACROSS EGYPT</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden md:inline">PREMIUM QUALITY FABRICS ✦</span>
        </div>
      </div>

      {/* Main Navigation Header */}
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          isScrolled
            ? 'bg-[#F6F3EE]/95 backdrop-blur-md shadow-sm border-b border-[#E8E2D8]'
            : 'bg-[#F6F3EE] border-b border-[#E8E2D8]/60'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Mobile menu trigger */}
            <div className="flex items-center lg:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-[#1F1F1F] hover:text-[#B67355] transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

            {/* Brand Logo */}
            <div className="flex-shrink-0 flex items-center">
              <BrandLogo variant="dark" size="md" href="/" />
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-8">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`font-sans text-xs uppercase tracking-[0.2em] font-medium transition-colors relative py-1 ${
                      isActive ? 'text-[#B67355] font-semibold' : 'text-[#1F1F1F] hover:text-[#B67355]'
                    }`}
                  >
                    {link.name}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#B67355]" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right Action Icons */}
            <div className="flex items-center space-x-4 sm:space-x-5">
              {/* Search Toggle */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-[#1F1F1F] hover:text-[#B67355] transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Wishlist Link */}
              <Link
                href="/wishlist"
                className="p-2 text-[#1F1F1F] hover:text-[#B67355] transition-colors relative"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" />
                {wishlist.length > 0 && (
                  <span className="absolute top-1 right-1 bg-[#B67355] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold font-sans">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              {/* Account Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    if (!user) {
                      setAuthModalOpen(true);
                    } else {
                      setUserDropdownOpen(!userDropdownOpen);
                    }
                  }}
                  className="p-2 text-[#1F1F1F] hover:text-[#B67355] transition-colors flex items-center gap-1.5"
                  aria-label="Account"
                >
                  <User className="w-5 h-5" />
                  {user && (
                    <span className="hidden md:inline text-xs font-medium tracking-wider text-[#1F1F1F] truncate max-w-[80px]">
                      {user.displayName?.split(' ')[0] || 'Account'}
                    </span>
                  )}
                </button>

                {/* Dropdown Menu */}
                {user && userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white border border-[#E8E2D8] shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2.5 border-b border-[#E8E2D8]/60 bg-[#F6F3EE]/50">
                      <p className="text-xs font-semibold text-[#1F1F1F] truncate">
                        {user.displayName || 'Boutique Client'}
                      </p>
                      <p className="text-[10px] text-[#8E8A85] truncate font-sans">{user.email}</p>
                    </div>

                    <Link
                      href="/account"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#1F1F1F] hover:bg-[#F6F3EE] hover:text-[#B67355] transition-colors"
                    >
                      <Package className="w-4 h-4 text-[#B67355]" />
                      My Orders & Tracking
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#B67355] font-semibold hover:bg-[#F6F3EE] transition-colors border-t border-[#E8E2D8]/40"
                      >
                        <ShieldAlert className="w-4 h-4 text-[#B67355]" />
                        Admin Dashboard
                      </Link>
                    )}

                    <button
                      onClick={async () => {
                        setUserDropdownOpen(false);
                        await logout();
                      }}
                      className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs text-[#B67355] hover:bg-[#F6F3EE] transition-colors border-t border-[#E8E2D8]/60"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>

              {/* Shopping Bag Drawer Trigger */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="p-2 text-[#1F1F1F] hover:text-[#B67355] transition-colors relative flex items-center"
                aria-label="Shopping Bag"
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute top-1 right-1 bg-[#1F1F1F] text-[#DCC9A6] text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold font-sans">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Search Bar */}
        {searchOpen && (
          <div className="bg-[#F6F3EE] border-t border-[#E8E2D8] py-4 px-4 sm:px-6 shadow-inner animate-in fade-in duration-200">
            <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search dresses, linen sets, tops, outerwear..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full bg-white border border-[#E8E2D8] px-4 py-2.5 pl-10 text-sm focus:outline-none focus:border-[#B67355] font-sans"
                />
                <Search className="w-4 h-4 text-[#8E8A85] absolute left-3.5 top-3" />
              </div>
              <button
                type="submit"
                className="bg-[#1F1F1F] text-[#DCC9A6] px-6 py-2.5 text-xs font-sans uppercase tracking-[0.15em] hover:bg-[#B67355] hover:text-white transition-colors"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-2 text-[#8E8A85] hover:text-[#1F1F1F]"
              >
                <X className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#F6F3EE] border-t border-[#E8E2D8] px-6 py-6 space-y-4 shadow-xl">
            <nav className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm tracking-[0.18em] uppercase py-2 font-medium border-b border-[#E8E2D8]/40 ${
                    pathname === link.href ? 'text-[#B67355] font-semibold' : 'text-[#1F1F1F]'
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              <Link
                href="/wishlist"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm tracking-[0.18em] uppercase py-2 font-medium text-[#1F1F1F] flex items-center justify-between border-b border-[#E8E2D8]/40"
              >
                <span>Wishlist</span>
                <span className="text-xs bg-[#B67355] text-white px-2 py-0.5 rounded-full">
                  {wishlist.length}
                </span>
              </Link>

              {user ? (
                <Link
                  href="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm tracking-[0.18em] uppercase py-2 font-medium text-[#B67355] flex items-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  My Orders ({user.displayName || 'Profile'})
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAuthModalOpen(true);
                  }}
                  className="w-full text-left text-sm tracking-[0.18em] uppercase py-2 font-medium text-[#1F1F1F] flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-[#B67355]" />
                  Sign In / Register
                </button>
              )}

              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm tracking-[0.18em] uppercase py-2 font-semibold text-[#B67355] flex items-center gap-2"
                >
                  <ShieldAlert className="w-4 h-4" />
                  Admin Dashboard
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Slide-in Cart Drawer */}
      <CartDrawer />

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
