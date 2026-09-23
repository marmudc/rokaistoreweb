'use client';
import React, { useState } from 'react';
import Link from 'next/link';
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
  const subtitle =
    storeSettings.subtitle ||
    'Marketplace profesional untuk kebutuhan Joki CDID, Blox Fruits, Robux & Gamepass, serta Joki Akun Roblox. Transaksi aman, legal, proses instan & bergaransi 100%.';

  return (
    <footer className="mt-14 sm:mt-20 border-t border-rose-950/80 bg-[#0a0204]/95 backdrop-blur-xl py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-950/90 border border-rose-900/60 flex items-center justify-center overflow-hidden shadow-md group-hover:border-rose-500/60 transition duration-300">
            {!logoError ? (
              <img
                src="/logo.png"
                alt={cleanStoreName}
                className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(225,29,72,0.3)]"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="text-rose-500 font-black text-base">
                {cleanStoreName.charAt(0)}
              </span>
            )}
          </div>
          <span className="font-black text-white text-lg tracking-tight group-hover:text-rose-400 transition-colors">
            {cleanStoreName}
            <span className="text-rose-500">.</span>
          </span>
        </Link>
        <p className="text-xs text-rose-200/60 mt-2.5 max-w-lg leading-relaxed">
          {subtitle}
        </p>
        <p className="text-xs text-rose-300/40 mt-4 font-medium">
          &copy; {currentYear} {cleanStoreName}. Seluruh hak cipta dilindungi.
        </p>
      </div>
    </footer>
  );
}
