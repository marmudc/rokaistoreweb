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
  storeName = 'Rokai Store',
  onLogout,
}: AdminNavbarProps) {
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const adminMenuRef = useRef<HTMLDivElement>(null);
  const cleanStoreName = storeName.replace(/\.$/, '');

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
    <header className="sticky top-0 z-50 bg-[#12151e] border-b border-slate-800 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">

          {/* Brand linking to storefront */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group cursor-pointer">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center shadow-sm overflow-hidden p-1 sm:p-1.5 group-hover:border-slate-500 transition">
              {!logoError ? (
                <img
                  src="/logo.png"
                  alt={cleanStoreName}
                  className="w-full h-full object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <span className="text-rose-500 font-black text-sm sm:text-base">R</span>
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-white text-base sm:text-lg tracking-tight">
                  {cleanStoreName}
                </span>
                <span className="text-rose-500 font-black text-base sm:text-lg">.</span>
                <span className="text-[9px] font-black bg-rose-950 text-rose-300 px-2 py-0.5 rounded-full uppercase tracking-wider border border-rose-800/60 shadow-xs">
                  ADMIN
                </span>
              </div>
              <span className="text-[9px] font-bold text-slate-400 -mt-1 hidden sm:block tracking-wider">
                Control Panel
              </span>
            </div>
          </Link>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* View storefront button */}
            <Link
              href="/"
              className="flex items-center gap-1.5 h-9 sm:h-10 px-3 sm:px-4 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700/90 text-xs font-bold text-slate-200 transition cursor-pointer active:scale-95 shadow-xs"
            >
              <Store size={15} />
              <span className="hidden sm:inline">Lihat Toko</span>
            </Link>

            {/* Admin Profile Dropdown */}
            <div ref={adminMenuRef} className="relative">
              <button
                onClick={() => setAdminMenuOpen(v => !v)}
                className={`flex items-center gap-1.5 h-9 sm:h-10 pl-1.5 pr-2.5 rounded-xl border transition-all duration-200 cursor-pointer active:scale-95 ${
                  adminMenuOpen
                    ? 'border-slate-600 bg-slate-800 text-white shadow-sm'
                    : 'border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-800 hover:text-white'
                }`}
                aria-label="Menu Admin"
              >
                <div className="relative">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-red-600 to-rose-600 text-white flex items-center justify-center text-xs font-black shadow-xs ring-1 ring-white/10">
                    A
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border-2 border-[#12151e] rounded-full" />
                </div>
                <span className="text-xs font-bold text-slate-200 hidden sm:inline-block">Super Admin</span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${adminMenuOpen ? 'rotate-180 text-white' : ''}`} />
              </button>

              {adminMenuOpen && (
                <div
                  onClick={e => e.stopPropagation()}
                  className="absolute right-0 top-full mt-2 w-60 rounded-2xl z-50 overflow-hidden shadow-2xl border border-slate-700 bg-[#161a25] text-slate-200"
                >
                  <div className="p-3.5 border-b border-slate-800 flex items-center gap-3 bg-slate-900/50">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 text-white flex items-center justify-center text-xs font-black shadow-xs shrink-0">
                      A
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-white truncate">Super Admin</p>
                      <p className="text-[10px] text-slate-400 truncate">admin@rokai.store</p>
                      <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Online</span>
                      </div>
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/"
                      onClick={() => setAdminMenuOpen(false)}
                      className="w-full text-left px-3.5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <Store size={14} className="text-slate-400" />
                      <span>Kunjungi Etalase Toko</span>
                    </Link>

                    {onLogout && (
                      <button
                        onClick={() => {
                          setAdminMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3.5 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 flex items-center gap-2.5 transition cursor-pointer"
                      >
                        <LogOut size={14} className="text-rose-400" />
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
