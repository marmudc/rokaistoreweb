'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  ShoppingCart,
  ChevronDown,
  Settings,
  Package,
  LogIn,
  LogOut,
  ShieldCheck,
  Search,
  X,
  Tag,
  CheckCheck,
  Trash2,
  Gamepad2,
  AlertTriangle,
} from 'lucide-react';
import type { UserRole } from '@/hooks/useRole';
import { useNotifications } from '@/hooks/useNotifications';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/context/AuthContext';
import type { AppNotification } from '@/lib/types';

interface NavbarProps {
  storeName: string;
  cartCount: number;
  activeOrdersCount: number;
  userOrdersCount: number;
  hasIssueOrders?: boolean;
  issueOrdersCount?: number;
  role: UserRole;
  isAdmin: boolean;
  onOpenCart: () => void;
  onOpenOrders: (filter?: 'all' | 'in_progress' | 'pending' | 'completed' | 'issue' | 'unpaid', orderId?: string) => void;
  onOpenAccount: () => void;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
  showToast: (msg: string) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export default function Navbar({
  storeName,
  cartCount,
  activeOrdersCount,
  userOrdersCount,
  hasIssueOrders = false,
  issueOrdersCount = 0,
  role,
  isAdmin,
  onOpenCart,
  onOpenOrders,
  onOpenAccount,
  onOpenAuth,
  showToast,
  searchQuery = '',
  onSearchChange,
}: NavbarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const notifRef = React.useRef<HTMLDivElement>(null);
  const accountRef = React.useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  const { profile } = useUserProfile();
  const { user, userProfile, logout } = useAuth();

  const effectiveIsAdmin = isAdmin || userProfile?.role === 'admin';
  const userDisplayName = userProfile?.name || user?.displayName || profile.name || (effectiveIsAdmin ? 'Super Admin' : 'Pelanggan');
  const userDisplayEmail = user?.email || userProfile?.email || profile.email || (effectiveIsAdmin ? 'admin@fablemart.com' : 'Akun Pembeli');
  const userInitial = effectiveIsAdmin
    ? 'A'
    : (userDisplayName ? userDisplayName.charAt(0).toUpperCase() : 'P');
  const userPhoto = user?.photoURL || userProfile?.photoURL || '';

  const handleLogout = async () => {
    try {
      await logout();
      setAccountOpen(false);
      showToast('✓ Berhasil keluar akun.');
    } catch (err) {
      console.error('Logout error:', err);
      showToast('Gagal keluar akun. Silakan coba lagi.');
    }
  };

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchInput = (val: string) => {
    onSearchChange?.(val);
    if (val.trim() && typeof window !== 'undefined') {
      const el = document.getElementById('products-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleNotificationClick = (notif: AppNotification) => {
    markAsRead(notif.id);
    setNotifOpen(false);

    if (notif.linkAction === 'open_orders') {
      const isKendala = notif.title?.toLowerCase().includes('kendala') || notif.message?.toLowerCase().includes('kendala');
      onOpenOrders(isKendala ? 'issue' : 'all', notif.orderId);
    } else if (notif.linkAction === 'view_promo') {
      if (notif.promoCode) {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          navigator.clipboard.writeText(notif.promoCode).catch(() => {});
        }
        showToast(`✓ Voucher "${notif.promoCode}" disalin! Gunakan saat checkout.`);
      }
      if (cartCount > 0) {
        onOpenCart();
      } else if (typeof window !== 'undefined') {
        const el = document.getElementById('products-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (notif.linkAction === 'open_cart') {
      onOpenCart();
    } else {
      showToast(notif.title);
    }
  };

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

          {/* Logo with clean elevated container & blue-indigo aura */}
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
              <div className="flex items-center">
                <span className="font-black text-slate-900 text-base sm:text-lg tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text">
                  {storeName.replace(/\.$/, '')}
                </span>
                <span className="text-blue-600 font-black text-base sm:text-lg animate-pulse">.</span>
              </div>
              <span className="text-[9px] font-extrabold text-blue-600/80 -mt-1 hidden sm:block tracking-wider uppercase">
                Verified Store
              </span>
            </div>
          </Link>

          {/* Center Search (Desktop / Tablet) with modern frosted pill */}
          <div className="hidden md:flex flex-1 max-w-md mx-4 relative items-center group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-xs opacity-0 group-focus-within:opacity-100 transition duration-300 pointer-events-none" />
            <div className="relative w-full flex items-center">
              <Search size={15} className="absolute left-3.5 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
              <input
                type="text"
                placeholder="Cari joki CDID, Blox Fruits, Robux, Gamepass..."
                value={searchQuery}
                onChange={e => handleSearchInput(e.target.value)}
                className="w-full pl-9 pr-14 py-2 text-xs rounded-full border border-slate-200/70 bg-white/60 hover:bg-white/80 focus:bg-white/95 backdrop-blur-md focus:outline-none focus:border-purple-400/80 shadow-xs focus:shadow-[0_4px_20px_-2px_rgba(168,85,247,0.15)] transition-all duration-200"
              />
              {searchQuery ? (
                <button
                  onClick={() => onSearchChange?.('')}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  aria-label="Hapus pencarian"
                >
                  <X size={14} />
                </button>
              ) : (
                <span className="absolute right-3 text-[10px] font-mono font-medium text-slate-400 bg-slate-100/80 border border-slate-200/60 rounded px-1.5 py-0.5 pointer-events-none hidden lg:inline-block">
                  ⌘K
                </span>
              )}
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">

            {/* Mobile Search Toggle */}
            <button
              onClick={() => setMobileSearchOpen(v => !v)}
              className="md:hidden w-9 h-9 rounded-xl glass-btn flex items-center justify-center text-slate-600 hover:text-purple-700 transition cursor-pointer active:scale-95"
              aria-label="Cari layanan"
            >
              <Search size={17} />
            </button>

            {/* Notification Dropdown */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => {
                  setNotifOpen(v => !v);
                  setAccountOpen(false);
                }}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl glass-btn flex items-center justify-center text-slate-600 hover:text-purple-700 relative transition-all duration-200 cursor-pointer active:scale-95 ${
                  notifOpen ? 'ring-2 ring-purple-400/50 bg-white/95 text-purple-700 shadow-sm' : ''
                }`}
                aria-label="Notifikasi"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-gradient-to-r from-pink-600 to-rose-600 text-white text-[9px] font-black flex items-center justify-center px-1 border-2 border-white shadow-md animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div
                  onClick={e => e.stopPropagation()}
                  className="absolute right-0 top-full mt-2.5 w-80 sm:w-88 glass-dropdown rounded-2xl z-50 overflow-hidden dropdown-fluid-in shadow-[0_20px_50px_-12px_rgba(15,23,42,0.18),0_0_0_1px_rgba(255,255,255,0.8)] border border-slate-200/80"
                >
                  {/* Notif Header */}
                  <div className="p-3.5 border-b border-slate-200/60 flex items-center justify-between bg-white/40">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black text-slate-900">Notifikasi</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        unreadCount > 0
                          ? 'text-purple-700 bg-purple-100/80 border-purple-200'
                          : 'text-slate-500 bg-slate-100/80 border-slate-200'
                      }`}>
                        {unreadCount > 0 ? `${unreadCount} Baru` : 'Semua Terbaca'}
                      </span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[10px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 transition cursor-pointer"
                      >
                        <CheckCheck size={12} />
                        <span>Tandai dibaca</span>
                      </button>
                    )}
                  </div>

                  {/* Notif List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100/60">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center space-y-2">
                        <div className="w-10 h-10 mx-auto rounded-xl bg-purple-50 text-purple-400 flex items-center justify-center">
                          <Bell size={18} />
                        </div>
                        <p className="text-xs font-bold text-slate-700">Belum Ada Notifikasi</p>
                        <p className="text-[11px] text-slate-400">Pembaruan pesanan & promo akan muncul di sini.</p>
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-3.5 hover:bg-purple-50/40 transition cursor-pointer flex items-start gap-3 relative group ${
                            !notif.read ? 'bg-purple-50/50' : 'bg-white/40'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs shadow-xs ${
                            notif.title?.toLowerCase().includes('kendala')
                              ? 'bg-rose-100 text-rose-700 border border-rose-300 shadow-rose-100'
                              : notif.type === 'order'
                              ? 'bg-sky-100/80 text-sky-700 border border-sky-200/60'
                              : notif.type === 'promo'
                              ? 'bg-amber-100/80 text-amber-700 border border-amber-200/60'
                              : 'bg-purple-100/80 text-purple-700 border border-purple-200/60'
                          }`}>
                            {notif.title?.toLowerCase().includes('kendala') ? (
                              <AlertTriangle size={14} className="text-rose-600 animate-pulse" />
                            ) : notif.type === 'order' ? (
                              <Package size={14} />
                            ) : notif.type === 'promo' ? (
                              <Tag size={14} />
                            ) : (
                              <Bell size={14} />
                            )}
                          </div>

                          <div className="flex-1 min-w-0 pr-5">
                            <div className="flex items-center gap-1.5">
                              {!notif.read && (
                                <span className="w-1.5 h-1.5 rounded-full bg-pink-600 shrink-0" />
                              )}
                              <p className={`text-xs truncate ${!notif.read ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                                {notif.title}
                              </p>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                              {notif.message}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[10px] text-purple-600 font-semibold">{notif.time}</span>
                              {notif.linkAction === 'open_orders' && (
                                <span className="text-[9px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200">
                                  Lihat Pesanan
                                </span>
                              )}
                              {notif.linkAction === 'view_promo' && notif.promoCode && (
                                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                  Salin {notif.promoCode}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Delete single notif */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notif.id);
                            }}
                            className="absolute right-2.5 top-3.5 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-1 rounded-lg transition"
                            aria-label="Hapus notifikasi"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="p-2.5 border-t border-slate-200/60 bg-white/40 flex items-center justify-between px-3.5">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {notifications.length} notifikasi total
                      </span>
                      <button
                        onClick={clearAll}
                        className="text-[10px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 transition cursor-pointer"
                      >
                        <Trash2 size={11} />
                        <span>Hapus Semua</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl glass-btn flex items-center justify-center text-slate-600 hover:text-purple-700 relative transition cursor-pointer active:scale-95"
              aria-label="Keranjang"
            >
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white text-[10px] font-black flex items-center justify-center px-1 border-2 border-white shadow-md animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Account Controls: Guest Login/Register OR Authenticated Dropdown */}
            {!user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Orders button for guest if they have local orders */}
                {userOrdersCount > 0 && (
                  <button
                    onClick={() => onOpenOrders(hasIssueOrders ? 'issue' : 'all')}
                    className={`flex items-center gap-1 sm:gap-1.5 h-9 sm:h-10 px-2 sm:px-3 rounded-xl glass-btn text-xs font-bold transition active:scale-95 cursor-pointer relative ${
                      hasIssueOrders
                        ? 'border-rose-400 bg-rose-50/90 text-rose-700 hover:bg-rose-100 ring-2 ring-rose-200 shadow-sm shadow-rose-200/50'
                        : 'text-slate-700 hover:text-purple-700'
                    }`}
                    title={hasIssueOrders ? "⚠️ Ada pesanan dalam kendala!" : "Pesanan Saya"}
                  >
                    {hasIssueOrders ? (
                      <AlertTriangle size={15} className="text-rose-600 animate-bounce" />
                    ) : (
                      <Package size={15} className="text-purple-600" />
                    )}
                    <span className="hidden sm:inline">Pesanan</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      hasIssueOrders
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {hasIssueOrders ? `⚠️ ${issueOrdersCount || '!'}` : userOrdersCount}
                    </span>
                  </button>
                )}

                {/* Masuk / Daftar Button */}
                <button
                  onClick={() => onOpenAuth?.('login')}
                  className="flex items-center gap-1.5 h-9 sm:h-10 px-3 sm:px-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold shadow-sm shadow-purple-500/25 hover:shadow-md transition-all duration-200 cursor-pointer active:scale-95 border border-purple-400/30"
                >
                  <LogIn size={15} />
                  <span className="hidden xs:inline">Masuk</span>
                  <span className="hidden sm:inline">/ Daftar</span>
                </button>
              </div>
            ) : (
              <div ref={accountRef} className="relative">
                <button
                  onClick={() => {
                    setAccountOpen(v => !v);
                    setNotifOpen(false);
                  }}
                  className={`flex items-center gap-1.5 h-9 sm:h-10 pl-1.5 pr-2.5 rounded-xl glass-btn transition-all duration-200 cursor-pointer active:scale-95 ${
                    accountOpen ? 'ring-2 ring-purple-400/50 bg-white/95 shadow-sm' : ''
                  }`}
                  aria-label="Menu Akun"
                >
                  <div className="relative">
                    {userPhoto ? (
                      <img
                        src={userPhoto}
                        alt={userDisplayName}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover ring-2 ring-purple-400/30 shadow-xs"
                      />
                    ) : (
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-white flex items-center justify-center text-xs font-black shadow-xs ${
                        effectiveIsAdmin ? 'bg-gradient-to-tr from-purple-600 to-pink-600 ring-2 ring-purple-400/30' : 'bg-gradient-to-tr from-slate-700 to-slate-900 ring-2 ring-slate-400/30'
                      }`}>
                        {userInitial}
                      </div>
                    )}
                    {effectiveIsAdmin && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border-2 border-white rounded-full" />
                    )}
                  </div>
                  {effectiveIsAdmin && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-black bg-purple-100/90 text-purple-700 px-2 py-0.5 rounded-full uppercase tracking-wider border border-purple-200/80 shadow-xs">
                      👑 ADMIN
                    </span>
                  )}
                  <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${accountOpen ? 'rotate-180 text-purple-600' : ''}`} />
                </button>

                {accountOpen && (
                  <div
                    onClick={e => e.stopPropagation()}
                    className="absolute right-0 top-full mt-2.5 w-68 glass-dropdown rounded-2xl z-50 overflow-hidden dropdown-fluid-in shadow-[0_20px_50px_-12px_rgba(15,23,42,0.18),0_0_0_1px_rgba(255,255,255,0.8)] border border-slate-200/80"
                  >
                    {/* User info header */}
                    <div className="p-3.5 border-b border-slate-200/60 bg-white/40">
                      <div className="flex items-center gap-3">
                        {userPhoto ? (
                          <img
                            src={userPhoto}
                            alt={userDisplayName}
                            className="w-10 h-10 rounded-xl object-cover shadow-xs shrink-0 ring-2 ring-purple-400/30"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center text-sm font-black shadow-xs shrink-0 ${
                            effectiveIsAdmin ? 'bg-gradient-to-tr from-purple-600 to-pink-600' : 'bg-gradient-to-tr from-slate-600 to-slate-800'
                          }`}>
                            {userInitial}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-slate-900 truncate">
                            {userDisplayName}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {userDisplayEmail}
                          </p>
                          <div className="flex items-center gap-1.5 text-[9px] text-slate-500 mt-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${effectiveIsAdmin ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                            <span className="font-semibold">{effectiveIsAdmin ? 'Super Admin' : 'Pelanggan Terverifikasi'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Game ID Badge if set */}
                      {userProfile?.defaultInGameId && (
                        <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-purple-700 font-semibold bg-purple-50/90 px-2.5 py-1 rounded-xl border border-purple-100">
                          <Gamepad2 size={13} className="text-purple-600 shrink-0" />
                          <span className="truncate">Game ID: <strong className="font-mono text-purple-900">{userProfile.defaultInGameId}</strong></span>
                        </div>
                      )}
                    </div>

                    <div className="py-1">
                      {/* Orders button */}
                      <button
                        onClick={() => {
                          setAccountOpen(false);
                          onOpenOrders(hasIssueOrders ? 'issue' : 'all');
                        }}
                        className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
                          hasIssueOrders ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold' : 'text-slate-700 hover:bg-purple-50/50'
                        }`}
                      >
                        {hasIssueOrders ? (
                          <AlertTriangle size={14} className="text-rose-600 animate-bounce" />
                        ) : (
                          <Package size={14} className="text-purple-500" />
                        )}
                        <span>Pesanan Saya</span>
                        <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          hasIssueOrders
                            ? 'text-rose-700 bg-rose-100 border-rose-200 animate-pulse'
                            : 'text-purple-600 bg-purple-50 border-purple-100'
                        }`}>
                          {hasIssueOrders ? `⚠️ Ada Kendala` : activeOrdersCount > 0 ? `${activeOrdersCount} Aktif` : `${userOrdersCount} Pesanan`}
                        </span>
                      </button>

                      {/* Admin dashboard link - only for admin */}
                      {effectiveIsAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setAccountOpen(false)}
                          className="w-full text-left px-3.5 py-2.5 text-xs font-semibold text-purple-700 hover:bg-purple-50/50 flex items-center gap-2.5 transition cursor-pointer"
                        >
                          <ShieldCheck size={14} className="text-purple-600" />
                          <span>👑 Admin Dashboard</span>
                          <span className="ml-auto text-[9px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded-full border border-purple-200">
                            ADMIN
                          </span>
                        </Link>
                      )}

                      {/* Account Settings modal trigger */}
                      <button
                        onClick={() => {
                          setAccountOpen(false);
                          onOpenAccount();
                        }}
                        className="w-full text-left px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-purple-50/50 flex items-center gap-2.5 transition cursor-pointer"
                      >
                        <Settings size={14} className="text-slate-400" />
                        <span>Pengaturan Akun</span>
                      </button>

                      <div className="mx-3 my-1 border-t border-slate-200/60" />

                      {/* Logout button */}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3.5 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50/70 flex items-center gap-2.5 transition cursor-pointer"
                      >
                        <LogOut size={14} className="text-red-500" />
                        <span>Keluar Akun</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        {mobileSearchOpen && (
          <div className="md:hidden pb-3 pt-1 border-t border-slate-200/60 modal-pop-in">
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari joki CDID, Blox Fruits, Robux, Gamepass..."
                value={searchQuery}
                onChange={e => handleSearchInput(e.target.value)}
                autoFocus
                className="w-full pl-8 pr-8 py-2 text-xs rounded-xl border border-slate-200/80 bg-white/70 backdrop-blur-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange?.('')}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="Hapus pencarian"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
