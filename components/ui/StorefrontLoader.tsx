'use client';
import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface StorefrontLoaderProps {
  loading: boolean;
  storeName?: string;
}

const statusPhrases = [
  'Menghubungkan ke Cloud Firestore...',
  'Menyiapkan katalog layanan & varian...',
  'Menyinkronkan voucher & penawaran eksklusif...',
  'Memuat etalase FableMart...',
];

export default function StorefrontLoader({
  loading,
  storeName = 'FableMart.',
}: StorefrontLoaderProps) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);

  // Cycle through status phrases
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % statusPhrases.length);
    }, 900);
    return () => clearInterval(interval);
  }, [loading]);

  // Handle smooth exit transition
  useEffect(() => {
    if (!loading) {
      setFading(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 550);
      return () => clearTimeout(timer);
    } else {
      setVisible(true);
      setFading(false);
    }
  }, [loading]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#fafbfc]/90 backdrop-blur-xl transition-all duration-500 ease-out ${
        fading ? 'opacity-0 scale-102 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Iridescent background ambient glow */}
      <div className="absolute w-96 h-96 rounded-full bg-gradient-to-tr from-pink-500/20 via-purple-500/20 to-indigo-500/20 blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute w-72 h-72 rounded-full bg-gradient-to-br from-amber-400/15 via-rose-500/15 to-purple-600/15 blur-2xl pointer-events-none" />

      {/* Main card */}
      <div className="relative flex flex-col items-center text-center p-8 max-w-sm w-full mx-4">
        
        {/* Animated Holographic Logo */}
        <div className="relative mb-6">
          {/* Rotating halo ring */}
          <div className="absolute -inset-3 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 rounded-3xl blur-md opacity-60 animate-spin-slow" />
          
          {/* Inner glowing pulse ring */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 rounded-2xl blur-xs opacity-80 animate-pulse" />

          {/* Logo container */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/95 backdrop-blur-md flex items-center justify-center shadow-xl ring-2 ring-white/80 overflow-hidden p-2 sm:p-2.5">
            <img
              src="/logo.png"
              alt={storeName}
              className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(43,89,255,0.3)]"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          {/* Floating sparkle badge */}
          <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white/90 shadow-md border border-purple-200 flex items-center justify-center text-purple-600 animate-bounce">
            <Sparkles size={14} className="text-amber-500" />
          </div>
        </div>

        {/* Brand typography */}
        <div className="flex items-center mb-2">
          <h1 className="font-black text-xl sm:text-2xl tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-transparent">
            {storeName.replace(/\.$/, '')}
          </h1>
          <span className="text-blue-600 font-black text-xl sm:text-2xl animate-pulse">.</span>
        </div>

        {/* Tagline */}
        <p className="text-xs font-semibold text-purple-700/80 mb-6 tracking-wide">
          Official Digital Marketplace &amp; Game Services
        </p>

        {/* Futuristic glowing progress bar */}
        <div className="w-full max-w-[220px] h-1.5 bg-slate-200/80 rounded-full overflow-hidden relative shadow-inner mb-4">
          <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-500 rounded-full w-full animate-loader-beam shadow-[0_0_12px_rgba(168,85,247,0.7)]" />
        </div>

        {/* Dynamic status text with smooth transition */}
        <div className="h-5 flex items-center justify-center">
          <p className="text-[11px] font-bold text-slate-500 animate-pulse transition-all duration-300">
            {statusPhrases[phraseIndex]}
          </p>
        </div>
      </div>
    </div>
  );
}
