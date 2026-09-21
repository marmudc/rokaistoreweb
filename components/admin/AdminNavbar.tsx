'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Store, ChevronDown, LogOut } from 'lucide-react';

interface AdminNavbarProps {
  activeOrdersCount?: number;
  onRefresh?: () => void;
  storeName?: string;
  onLogout?: () => void;
}

export default function AdminNavbar({
  storeName = 'FableMart.',
  onLogout,
}: AdminNavbarProps) {
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const adminMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target as Node)) {
        setAdminMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass-nav-scrolled py-0' : 'glass-nav py-0.5 sm:py-1'
      }`}
    >
      {/* Subtle iridescent glowing bottom line */}
      <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/25 via-pink-500/25 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">

          {/* Brand linking to storefront - identical size & style as main page */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group cursor-pointer">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/40 via-indigo-500/30 to-purple-600/40 rounded-2xl blur-xs opacity-60 group-hover:opacity-100 transition duration-500" />
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/95 backdrop-blur-md flex items-center justify-center shadow-[0_4px_14px_-2px_rgba(43,89,255,0.2),0_1px_3px_rgba(0,0,0,0.06)] border border-blue-100/80 ring-1 ring-slate-900/5 group-hover:scale-105 transition-all duration-300 overflow-hidden p-1 sm:p-1.5">
                {!logoError ? (
                  <img
                    src="/logo.png"
                    alt={storeName}
                    className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(43,89,255,0.25)] transition-transform duration-300 group-hover:scale-105"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <span className="text-blue-600 font-black text-sm sm:text-base drop-shadow-sm">F</span>
                )}
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-slate-900 text-base sm:text-lg tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text">
                  {storeName.replace(/\.$/, '')}
                </span>
                <span className="text-blue-600 font-black text-base sm:text-lg animate-pulse">.</span>
                <span className="text-[9px] font-black bg-purple-100/90 text-purple-700 px-2 py-0.5 rounded-full uppercase tracking-wider border border-purple-200/80 shadow-xs">
                  ADMIN
                </span>
              </div>
              <span className="text-[9px] font-bold text-slate-400 -mt-1 hidden sm:block tracking-wider">
                Control Panel
              </span>
            </div>
          </Link>

          {/* Right side simple actions */}
          <div className="flex items-center gap-2">
            {/* View storefront button */}
            <Link
              href="/"
              className="flex items-center gap-1.5 h-9 sm:h-10 px-3 sm:px-4 rounded-xl border border-purple-200/80 bg-purple-50/70 hover:bg-purple-100/90 text-xs font-bold text-purple-700 transition cursor-pointer active:scale-95 shadow-xs"
            >
              <Store size={15} />
              <span className="hidden sm:inline">Lihat Toko</span>
            </Link>

            {/* Admin Profile Dropdown */}
            <div ref={adminMenuRef} className="relative">
              <button
                onClick={() => setAdminMenuOpen(v => !v)}
                className={`flex items-center gap-1.5 h-9 sm:h-10 pl-1.5 pr-2.5 rounded-xl glass-btn transition-all duration-200 cursor-pointer active:scale-95 ${
                  adminMenuOpen ? 'ring-2 ring-purple-400/50 bg-white/95 shadow-sm' : ''
                }`}
                aria-label="Menu Admin"
              >
                <div className="relative">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center text-xs font-black shadow-xs ring-2 ring-purple-400/30">
                    A
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border-2 border-white rounded-full" />
                </div>
                <span className="text-xs font-bold text-slate-800 hidden sm:inline-block">Super Admin</span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${adminMenuOpen ? 'rotate-180 text-purple-600' : ''}`} />
              </button>

              {adminMenuOpen && (
                <div
                  onClick={e => e.stopPropagation()}
                  className="absolute right-0 top-full mt-2.5 w-60 glass-dropdown rounded-2xl z-50 overflow-hidden dropdown-fluid-in shadow-[0_20px_50px_-12px_rgba(15,23,42,0.18),0_0_0_1px_rgba(255,255,255,0.8)] border border-slate-200/80"
                >
                  <div className="p-3.5 border-b border-slate-200/60 flex items-center gap-3 bg-white/40">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center text-xs font-black shadow-xs shrink-0">
                      A
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 truncate">Super Admin</p>
                      <p className="text-[10px] text-slate-400 truncate">admin@fablemart.com</p>
                      <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Online</span>
                      </div>
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/"
                      onClick={() => setAdminMenuOpen(false)}
                      className="w-full text-left px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-purple-50/50 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <Store size={14} className="text-purple-600" />
                      <span>Kunjungi Etalase Toko</span>
                    </Link>

                    {onLogout && (
                      <button
                        onClick={() => {
                          setAdminMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3.5 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition cursor-pointer"
                      >
                        <LogOut size={14} className="text-red-500" />
                        <span>Keluar (Logout Admin)</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
