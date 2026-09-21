'use client';
import React from 'react';

interface ToastProps {
  message: string;
  visible: boolean;
}

export default function Toast({ message, visible }: ToastProps) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex items-center gap-2.5 bg-slate-900/95 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-xl backdrop-blur-sm border border-white/10 max-w-xs sm:max-w-md">
        <span className="text-emerald-400 text-sm">✓</span>
        <span>{message}</span>
      </div>
    </div>
  );
}
