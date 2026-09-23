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
    'Marketplace terpercaya untuk kebutuhan Joki CDID, Blox Fruits, Robux & Gamepass, serta Joki Akun Roblox. Transaksi aman, legal, proses instan & bergaransi 100%.';

  return (
    <footer className="mt-8 border-t border-slate-200/80 bg-white py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/95 flex items-center justify-center overflow-hidden">
            {!logoError ? (
              <img
                src="/logo.png"
                alt={cleanStoreName}
                className="w-full h-full object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="text-blue-600 font-black text-base">
                {cleanStoreName.charAt(0)}
              </span>
            )}
          </div>
          <span className="font-black text-slate-900 text-lg">{cleanStoreName}</span>
        </Link>
        <p className="text-xs text-slate-500 mt-2">{subtitle}</p>
        <p className="text-xs text-slate-400 mt-4">
          © {currentYear} {cleanStoreName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
