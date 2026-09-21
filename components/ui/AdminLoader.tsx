'use client';
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Activity } from 'lucide-react';

interface AdminLoaderProps {
  loading: boolean;
  storeName?: string;
}

const adminPhrases = [
  'Mengamankan otorisasi admin & koneksi Firestore...',
  'Menyinkronkan pesanan aktif & transaksi realtime...',
  'Memuat katalog produk & kontrol inventaris...',
  'Menyiapkan dashboard FableMart Admin Console...',
];

export default function AdminLoader({
  loading,
  storeName = 'FableMart.',
}: AdminLoaderProps) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % adminPhrases.length);
    }, 850);
    return () => clearInterval(interval);
  }, [loading]);

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
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 backdrop-blur-2xl transition-all duration-500 ease-out ${
        fading ? 'opacity-0 scale-102 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* High-tech ambient glowing grid & blobs */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-purple-600/15 blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute w-[350px] h-[350px] rounded-full bg-pink-600/15 blur-[100px] pointer-events-none" />

      {/* Cyber card */}
      <div className="relative flex flex-col items-center text-center p-8 max-w-sm w-full mx-4 bg-slate-900/70 border border-purple-500/30 rounded-3xl shadow-[0_0_50px_-12px_rgba(168,85,247,0.3)] backdrop-blur-xl">
        
        {/* Animated Cyber Core / Shield */}
        <div className="relative mb-6">
          {/* Outer rotating dashed ring */}
          <div className="absolute -inset-4 border border-purple-500/30 rounded-full animate-spin-slow" />
          
          {/* Middle glowing pulse ring */}
          <div className="absolute -inset-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-xs opacity-70 animate-pulse" />

          {/* Shield Icon Container */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center shadow-xl ring-2 ring-white/30">
            <ShieldCheck size={36} className="text-white drop-shadow-md" />
          </div>

          {/* Live Activity Badge */}
          <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/60 flex items-center gap-1 shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">LIVE</span>
          </div>
        </div>

        {/* Title */}
        <div className="flex items-center gap-2 mb-1.5">
          <h2 className="font-black text-lg sm:text-xl text-white tracking-tight">
            {storeName.replace(/\.$/, '')}
          </h2>
          <span className="text-[10px] font-black text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded-full border border-purple-500/50 shadow-xs uppercase tracking-wider">
            ADMIN CONSOLE
          </span>
        </div>

        {/* Subtitle */}
        <p className="text-[11px] font-medium text-slate-400 mb-6">
          Sistem Kontrol &amp; Sinkronisasi Data Cloud
        </p>

        {/* Cyberpunk Progress Beam */}
        <div className="w-full max-w-[220px] h-1.5 bg-slate-800 rounded-full overflow-hidden relative shadow-inner mb-4 border border-slate-700/50">
          <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-400 rounded-full w-full animate-loader-beam shadow-[0_0_15px_rgba(217,70,239,0.8)]" />
        </div>

        {/* Dynamic status phrase */}
        <div className="h-5 flex items-center justify-center">
          <p className="text-[11px] font-medium text-purple-300 animate-pulse transition-all duration-300">
            {adminPhrases[phraseIndex]}
          </p>
        </div>
      </div>
    </div>
  );
}
