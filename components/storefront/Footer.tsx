'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Zap,
  Lock,
  MessageSquare,
  Package,
  ShoppingCart,
  HelpCircle,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import type { StoreSettings } from '@/lib/types';

interface FooterProps {
  storeName: string;
  storeSettings: StoreSettings;
  onOpenOrders: () => void;
  onOpenCart: () => void;
  onOpenAccount?: () => void;
}

export default function Footer({
  storeName,
  storeSettings,
  onOpenOrders,
  onOpenCart,
  onOpenAccount,
}: FooterProps) {
  const [logoError, setLogoError] = useState(false);
  const cleanStoreName = storeName.replace(/\.$/, '');
  const currentYear = new Date().getFullYear();
  const whatsappNumber = storeSettings.whatsappNumber || '6281234567890';
  const subtitle =
    storeSettings.subtitle ||
    'Marketplace terpercaya untuk kebutuhan Joki CDID, Setup Modded Server, dan aset game resmi. Transaksi aman, proses instan & bergaransi 100%.';

  const scrollToSection = (id: string) => {
    if (typeof window !== 'undefined') {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <footer className="mt-16 sm:mt-24 border-t border-slate-200/80 bg-white relative overflow-hidden">
      {/* Decorative top glowing accent bar identical to Header */}
      <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-purple-500/40 via-pink-500/40 to-transparent pointer-events-none" />

      {/* Main Footer Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 sm:pt-16 sm:pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-12 border-b border-slate-100">

          {/* Col 1: Store Brand Identity (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Elevated Brand Logo - 100% Identical to Header */}
            <Link href="/" className="inline-flex items-center gap-2.5 group cursor-pointer">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/40 via-indigo-500/30 to-purple-600/40 rounded-2xl blur-xs opacity-60 group-hover:opacity-100 transition duration-500" />
                <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/95 backdrop-blur-md flex items-center justify-center shadow-[0_4px_14px_-2px_rgba(43,89,255,0.2),0_1px_3px_rgba(0,0,0,0.06)] border border-blue-100/80 ring-1 ring-slate-900/5 group-hover:scale-105 transition-all duration-300 overflow-hidden p-1.5">
                  {!logoError ? (
                    <img
                      src="/logo.png"
                      alt={cleanStoreName}
                      className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(43,89,255,0.25)] transition-transform duration-300 group-hover:scale-105"
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    <span className="text-blue-600 font-black text-base sm:text-lg drop-shadow-sm">F</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center">
                  <span className="font-black text-slate-900 text-lg sm:text-xl tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text">
                    {cleanStoreName}
                  </span>
                  <span className="text-blue-600 font-black text-lg sm:text-xl animate-pulse">.</span>
                </div>
                <span className="text-[9px] font-extrabold text-blue-600 -mt-1 tracking-wider uppercase flex items-center gap-1">
                  <span>Verified Official Store</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </span>
              </div>
            </Link>

            {/* Dynamic Store Slogan / Subtitle */}
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              {subtitle}
            </p>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck size={12} className="text-emerald-600" />
                Garansi Resmi 100%
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                <Lock size={12} className="text-purple-600" />
                Enkripsi 256-Bit
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                <Zap size={12} className="text-sky-600" />
                Proses Instan
              </span>
            </div>
          </div>

          {/* Col 2: Quick Navigation (3 cols on lg) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Navigasi Layanan
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('products-section')}
                  className="hover:text-purple-600 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronRight size={13} className="text-slate-400" />
                  <span>Katalog Layanan &amp; Top Up</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenOrders}
                  className="hover:text-purple-600 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronRight size={13} className="text-slate-400" />
                  <span>Lacak Pesanan Saya (Live Tracking)</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenCart}
                  className="hover:text-purple-600 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronRight size={13} className="text-slate-400" />
                  <span>Keranjang Belanja Layanan</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('proof-section')}
                  className="hover:text-purple-600 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronRight size={13} className="text-slate-400" />
                  <span>Galeri Bukti Transaksi Sukses</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('faq-section')}
                  className="hover:text-purple-600 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronRight size={13} className="text-slate-400" />
                  <span>FAQ &amp; Cara Transaksi</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Payment Gateways (3 cols on lg) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Metode Pembayaran
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Menerima pembayaran resmi berbasis QRIS instan dari seluruh bank dan dompet digital di Indonesia:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['QRIS Instan', 'BCA', 'Mandiri', 'BRI', 'BNI', 'GoPay', 'OVO', 'DANA', 'ShopeePay', 'LinkAja'].map((method) => (
                <span
                  key={method}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200/80"
                >
                  {method}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-bold bg-emerald-50/80 p-2 rounded-xl border border-emerald-200/60 mt-2">
              <Sparkles size={13} className="text-emerald-600 shrink-0" />
              <span>Verifikasi otomatis murni berbasis web &amp; instan</span>
            </div>
          </div>

          {/* Col 4: Customer Care & Hours (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Bantuan &amp; Kontak
            </h4>
            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <Clock size={14} className="text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block text-[11px]">Jam Operasional:</span>
                  <span className="text-[11px] text-slate-500">24 Jam Non-Stop / Setiap Hari</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MessageSquare size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block text-[11px]">Konsultasi CS:</span>
                  <a
                    href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=Halo%20Admin%20${encodeURIComponent(
                      cleanStoreName
                    )},%20saya%20ingin%20konsultasi%20mengenai%20layanan%20toko.`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>WhatsApp CS</span>
                    <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Terms */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <span>
              &copy; {currentYear} <strong>{cleanStoreName}</strong>. Seluruh hak cipta dilindungi undang-undang.
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <button
              type="button"
              onClick={() => scrollToSection('faq-section')}
              className="hover:text-purple-600 transition cursor-pointer"
            >
              Syarat &amp; Ketentuan
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => scrollToSection('faq-section')}
              className="hover:text-purple-600 transition cursor-pointer"
            >
              Kebijakan Privasi
            </button>
            <span>•</span>
            <Link
              href="/admin"
              className="text-purple-600 hover:text-purple-800 font-bold transition flex items-center gap-1"
            >
              <span>Admin Panel</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
