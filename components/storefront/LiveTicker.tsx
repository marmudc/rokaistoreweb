'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { subscribeToOrders } from '@/lib/firebaseSync';
import type { AdminOrder } from '@/lib/types';
import { CheckCircle2, Clock } from 'lucide-react';

const avatarGradients = [
  'from-purple-600 to-indigo-600',
  'from-pink-600 to-rose-600',
  'from-blue-600 to-cyan-600',
  'from-emerald-600 to-teal-600',
  'from-amber-600 to-orange-600',
];

export default function LiveTicker() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tickerIdx, setTickerIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Real-time listener for Firestore orders
  useEffect(() => {
    const unsub = subscribeToOrders((items) => {
      setOrders(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Format real orders into live transaction items
  const transactionItems = useMemo(() => {
    if (orders.length === 0) {
      return [];
    }

    return orders.map((o, idx) => {
      const parts = (o.customer || 'Pelanggan').trim().split(' ');
      const maskedName = parts.length > 1
        ? `${parts[0]} ${parts[1].charAt(0)}***`
        : `${(o.customer || 'User').slice(0, 4)}***`;

      const avatarBg = avatarGradients[idx % avatarGradients.length];
      const isCompleted = o.status === 'Selesai';
      const actionText = isCompleted ? 'Selesai Dikerjakan' : 'Sedang Diproses';

      return {
        id: o.id,
        user: maskedName,
        action: actionText,
        item: o.variantName ? `${o.product} (${o.variantName})` : o.product,
        amount: `Rp ${Number(o.amount || 0).toLocaleString('id-ID')}`,
        time: o.date || 'Baru Saja',
        category: o.payment || 'QRIS Instan',
        isCompleted,
        avatarBg,
        badgeColor: isCompleted
          ? 'text-emerald-700 bg-emerald-50/90 border-emerald-200/80'
          : 'text-amber-700 bg-amber-50/90 border-amber-200/80',
      };
    });
  }, [orders]);

  // Auto-cycle ticker every 4.5s (pause when hovered)
  useEffect(() => {
    if (isPaused || transactionItems.length <= 3) return;
    const timer = setInterval(() => {
      setTickerIdx(prev => (prev + 1) % transactionItems.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused, transactionItems.length]);

  if (loading || transactionItems.length === 0) {
    return null;
  }

  const visibleCount = Math.min(3, transactionItems.length);
  const visibleItems = Array.from({ length: visibleCount }).map((_, i) =>
    transactionItems[(tickerIdx + i) % transactionItems.length]
  );

  const prev = () => setTickerIdx(p => (p - 1 + transactionItems.length) % transactionItems.length);
  const next = () => setTickerIdx(p => (p + 1) % transactionItems.length);

  return (
    <div onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900">Transaksi Terkini</h2>
          <p className="text-[11px] text-slate-400 font-medium">
            {loading ? 'Menghubungkan ke server realtime Firestore...' : 'Aktivitas pemesanan real-time dari pelanggan FableMart'}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE
          </span>
          {transactionItems.length > 3 && (
            <>
              <button
                onClick={prev}
                className="w-7 h-7 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition shadow-xs text-xs cursor-pointer active:scale-95"
                aria-label="Sebelumnya"
              >
                ‹
              </button>
              <button
                onClick={next}
                className="w-7 h-7 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition shadow-xs text-xs cursor-pointer active:scale-95"
                aria-label="Selanjutnya"
              >
                ›
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-soft space-y-3 animate-shimmer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-200/70" />
                  <div className="space-y-1">
                    <div className="w-20 h-3.5 rounded bg-slate-200/70" />
                    <div className="w-14 h-2.5 rounded bg-slate-100" />
                  </div>
                </div>
                <div className="w-12 h-3 rounded bg-slate-100" />
              </div>
              <div className="w-3/4 h-4 rounded bg-slate-200/70" />
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="w-16 h-4 rounded-full bg-slate-200/70" />
                <div className="w-16 h-3.5 rounded bg-slate-200/70" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {visibleItems.map((tx, i) => (
            <div
              key={`${tx.id}-${tickerIdx}-${i}`}
              className="bg-slate-50/90 hover:bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 hover:border-purple-300 transition-all duration-300 shadow-soft hover:shadow-md flex flex-col justify-between gap-3 group hover:-translate-y-0.5 transform"
            >
              {/* User & Time */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${tx.avatarBg} text-white flex items-center justify-center text-xs font-black shadow-xs shrink-0`}>
                    {tx.user.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800 truncate">{tx.user}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                        tx.isCompleted ? 'text-emerald-700 bg-emerald-100/70' : 'text-amber-700 bg-amber-100/70'
                      }`}>
                        {tx.action}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-slate-400 shrink-0">{tx.time}</span>
              </div>

              {/* Item */}
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-purple-600 transition-colors truncate">
                {tx.item}
              </h4>

              {/* Category & Amount */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[10px]">
                <span className={`font-bold px-2 py-0.5 rounded-full border ${tx.badgeColor} uppercase tracking-wider`}>
                  {tx.category}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-800 text-xs">{tx.amount}</span>
                  {tx.isCompleted ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                      <CheckCircle2 size={11} />
                      Selesai
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                      <Clock size={11} />
                      Proses
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

