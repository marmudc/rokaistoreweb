'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, CheckCircle2, Database, Package, ShieldCheck } from 'lucide-react';

interface StorefrontLoaderProps {
  loading: boolean;
  storeName?: string;
  settingsLoaded?: boolean;
  productsLoaded?: boolean;
  heroLoaded?: boolean;
  authLoaded?: boolean;
}

export default function StorefrontLoader({
  loading,
  storeName = 'Rokai Store',
  settingsLoaded = false,
  productsLoaded = false,
  heroLoaded = false,
  authLoaded = false,
}: StorefrontLoaderProps) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  // Calculate real synchronization progress percentage based on database readiness
  const targetPercent = useMemo(() => {
    if (!loading) return 100;
    let p = 15; // Initial boot
    if (settingsLoaded) p += 25;
    if (productsLoaded) p += 35;
    if (heroLoaded) p += 15;
    if (authLoaded) p += 10;
    return Math.min(p, 98); // cap at 98% until loading actually becomes false
  }, [loading, settingsLoaded, productsLoaded, heroLoaded, authLoaded]);

  // Smoothly animated progress counter
  const [displayPercent, setDisplayPercent] = useState(15);
  useEffect(() => {
    const timer = setInterval(() => {
      setDisplayPercent((curr) => {
        if (curr < targetPercent) {
          const step = Math.max(1, Math.floor((targetPercent - curr) / 3));
          return Math.min(curr + step, targetPercent);
        } else if (!loading) {
          return 100;
        }
        return curr;
      });
    }, 40);
    return () => clearInterval(timer);
  }, [targetPercent, loading]);

  // Status message determined by real database progress
  const currentStatus = useMemo(() => {
    if (!loading || displayPercent >= 100) {
      return '✓ Data berhasil disinkronkan, memuat etalase...';
    }
    if (!settingsLoaded) {
      return 'Menghubungkan ke Cloud Firestore...';
    }
    if (!productsLoaded) {
      return 'Mengumpulkan katalog layanan & varian Roblox...';
    }
    if (!heroLoaded) {
      return 'Menyiapkan hero banner & penawaran eksklusif...';
    }
    if (!authLoaded) {
      return 'Menyelaraskan sesi akun & profil...';
    }
    return 'Memverifikasi kelengkapan etalase resmi...';
  }, [loading, displayPercent, settingsLoaded, productsLoaded, heroLoaded, authLoaded]);

  // Handle smooth cinematic exit transition when all data is ready
  useEffect(() => {
    if (!loading) {
      // Allow progress to snap to 100%
      setDisplayPercent(100);
      const timerFade = setTimeout(() => {
        setFading(true);
      }, 180);

      const timerUnmount = setTimeout(() => {
        setVisible(false);
      }, 750);

      return () => {
        clearTimeout(timerFade);
        clearTimeout(timerUnmount);
      };
    } else {
      setVisible(true);
      setFading(false);
    }
  }, [loading]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#090204]/96 backdrop-blur-2xl transition-all duration-600 cubic-bezier(0.16, 1, 0.3, 1) ${
        fading
          ? 'opacity-0 scale-[1.03] blur-sm pointer-events-none'
          : 'opacity-100 scale-100 blur-0'
      }`}
      aria-live="polite"
      aria-busy={loading}
    >
      {/* Majestic Crimson ambient lighting effects */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-red-600/20 via-rose-600/15 to-red-950/20 blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute w-80 h-80 rounded-full bg-gradient-to-br from-amber-500/10 via-rose-600/15 to-transparent blur-2xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative flex flex-col items-center text-center p-6 sm:p-8 max-w-sm w-full mx-4">
        
        {/* Animated Holographic Logo */}
        <div className="relative mb-6">
          {/* Rotating halo ring */}
          <div className="absolute -inset-3.5 bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 rounded-3xl blur-md opacity-60 animate-spin-slow" />
          
          {/* Inner glowing pulse ring */}
          <div className="absolute -inset-1 bg-gradient-to-r from-red-500 via-rose-500 to-red-600 rounded-2xl blur-xs opacity-80 animate-pulse" />

          {/* Logo container */}
          <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-[#0d0205] backdrop-blur-md flex items-center justify-center shadow-2xl ring-2 ring-rose-500/40 overflow-hidden p-2 sm:p-2.5">
            <img
              src="/logo.png"
              alt={storeName}
              className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(225,29,72,0.5)]"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          {/* Floating sparkle badge */}
          <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#1c060d] shadow-lg border border-rose-500/60 flex items-center justify-center text-amber-400 animate-bounce">
            <Sparkles size={14} />
          </div>
        </div>

        {/* Brand typography */}
        <div className="flex items-center mb-1">
          <h1 className="font-black text-2xl sm:text-3xl tracking-tight text-white">
            {storeName.replace(/\.$/, '')}
          </h1>
          <span className="text-rose-500 font-black text-2xl sm:text-3xl animate-pulse">.</span>
        </div>

        {/* Tagline */}
        <p className="text-[11px] sm:text-xs font-semibold text-rose-300/80 mb-5 tracking-wide">
          Official Roblox Marketplace &amp; Game Services
        </p>

        {/* Dynamic Progress Bar with percentage */}
        <div className="w-full max-w-[240px] space-y-2 mb-4">
          <div className="flex items-center justify-between text-[10px] font-bold text-rose-300/80 px-1">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              <span>Sinkronisasi</span>
            </span>
            <span className="font-mono text-white text-xs">{displayPercent}%</span>
          </div>

          <div className="w-full h-2 bg-rose-950/70 rounded-full overflow-hidden relative shadow-inner border border-rose-900/50 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(225,29,72,0.8)] ${
                displayPercent >= 100
                  ? 'bg-gradient-to-r from-emerald-500 via-rose-500 to-emerald-400'
                  : 'bg-gradient-to-r from-red-600 via-rose-500 to-amber-500'
              }`}
              style={{ width: `${displayPercent}%` }}
            />
          </div>
        </div>

        {/* Dynamic status text */}
        <div className="h-6 flex items-center justify-center mb-5">
          <p className="text-[11px] sm:text-xs font-semibold text-rose-200/90 transition-all duration-300">
            {currentStatus}
          </p>
        </div>

        {/* Mini Real-Time Stage Indicators */}
        <div className="flex items-center justify-center gap-2 pt-2 border-t border-rose-950/60 w-full">
          <div
            className={`flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md border transition-colors ${
              settingsLoaded
                ? 'bg-rose-950/80 text-rose-200 border-rose-800/60'
                : 'bg-black/40 text-rose-400/40 border-rose-950/40'
            }`}
          >
            <Database size={10} className={settingsLoaded ? 'text-emerald-400' : 'text-rose-400/40'} />
            <span>Database</span>
            {settingsLoaded && <CheckCircle2 size={9} className="text-emerald-400 ml-0.5" />}
          </div>

          <div
            className={`flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md border transition-colors ${
              productsLoaded
                ? 'bg-rose-950/80 text-rose-200 border-rose-800/60'
                : 'bg-black/40 text-rose-400/40 border-rose-950/40'
            }`}
          >
            <Package size={10} className={productsLoaded ? 'text-emerald-400' : 'text-rose-400/40'} />
            <span>Katalog</span>
            {productsLoaded && <CheckCircle2 size={9} className="text-emerald-400 ml-0.5" />}
          </div>

          <div
            className={`flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md border transition-colors ${
              heroLoaded && authLoaded
                ? 'bg-rose-950/80 text-rose-200 border-rose-800/60'
                : 'bg-black/40 text-rose-400/40 border-rose-950/40'
            }`}
          >
            <ShieldCheck size={10} className={heroLoaded && authLoaded ? 'text-emerald-400' : 'text-rose-400/40'} />
            <span>Etalase</span>
            {heroLoaded && authLoaded && <CheckCircle2 size={9} className="text-emerald-400 ml-0.5" />}
          </div>
        </div>

      </div>
    </div>
  );
}
