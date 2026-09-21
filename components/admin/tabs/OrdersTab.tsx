'use client';
import React, { useState } from 'react';
import type { AdminOrder } from '@/lib/types';

type OrderFilter = 'all' | 'Diproses' | 'Selesai' | 'Dibatalkan';

interface OrdersTabProps {
  adminOrders: AdminOrder[];
  onMarkComplete: (id: string) => void;
  onCancel?: (id: string) => void;
  onDelete: (id: string) => void;
  showToast: (msg: string) => void;
}

export default function OrdersTab({ adminOrders, onMarkComplete, onCancel, onDelete, showToast }: OrdersTabProps) {
  const [filter, setFilter] = useState<OrderFilter>('all');

  const filtered = filter === 'all' ? adminOrders : adminOrders.filter(o => o.status === filter);
  const allCount = adminOrders.length;
  const diprosesCount = adminOrders.filter(o => o.status === 'Diproses').length;
  const selesaiCount = adminOrders.filter(o => o.status === 'Selesai').length;
  const dibatalkanCount = adminOrders.filter(o => o.status === 'Dibatalkan').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-slate-900">Manajemen Pesanan</h3>
          <p className="text-[11px] text-slate-400">{allCount} total pesanan masuk</p>
        </div>
        {/* Filter tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {([
            { key: 'all', label: `Semua (${allCount})` },
            { key: 'Diproses', label: `Diproses (${diprosesCount})` },
            { key: 'Selesai', label: `Selesai (${selesaiCount})` },
            { key: 'Dibatalkan', label: `Dibatalkan (${dibatalkanCount})` },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                filter === tab.key ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders table */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/80 shadow-soft">
            <p className="text-sm font-bold text-slate-500">Tidak ada pesanan di kategori ini</p>
          </div>
        ) : (
          filtered.map(order => (
            <div key={order.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-4 sm:p-5 hover:border-purple-200 transition">
              {/* Top row */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xs font-black shrink-0 border border-purple-100">#</div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black text-purple-700">{order.id}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        order.status === 'Selesai'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : order.status === 'Dibatalkan'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-sky-50 text-sky-700 border border-sky-200'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{order.date} • {order.payment}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-black text-pink-600">Rp {order.amount.toLocaleString('id-ID')}</p>
                  <p className="text-[10px] text-slate-400">{order.payment}</p>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3">
                <div>
                  <span className="text-slate-400 font-medium">Pelanggan:</span>
                  <span className="ml-1.5 font-bold text-slate-800">{order.customer}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">HP:</span>
                  <span className="ml-1.5 font-bold text-slate-800">{order.phone}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 font-medium">Produk:</span>
                  <span className="ml-1.5 font-bold text-slate-800">{order.product}</span>
                  {order.variant && <span className="ml-1 text-purple-600">({order.variant})</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
                {order.status === 'Diproses' && (
                  <>
                    <button
                      onClick={() => { onMarkComplete(order.id); showToast(`✓ Pesanan ${order.id} ditandai Selesai & sinkron ke pelanggan`); }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition cursor-pointer shadow-sm"
                    >
                      ✓ Tandai Selesai
                    </button>
                    {onCancel && (
                      <button
                        onClick={() => { onCancel(order.id); showToast(`Pesanan ${order.id} dibatalkan`); }}
                        className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold transition cursor-pointer border border-amber-200"
                      >
                        Batalkan
                      </button>
                    )}
                  </>
                )}
                <a
                  href={`https://wa.me/${order.phone}?text=Halo%20${encodeURIComponent(order.customer)},%20pesanan%20Anda%20%23${order.id}%20(${encodeURIComponent(order.product)}).%20Terima%20kasih%20telah%20memesan%20di%20FableMart!`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition cursor-pointer border border-emerald-200"
                >
                  Chat WA
                </a>
                <button
                  onClick={() => { onDelete(order.id); showToast(`Pesanan ${order.id} dihapus`); }}
                  className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition cursor-pointer border border-red-200 ml-auto"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
