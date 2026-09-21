'use client';
import React, { useState, useEffect } from 'react';
import type { UserOrder } from '@/lib/types';
import ProductIcon from '@/components/ui/ProductIcon';
import { X, Package, ChevronDown, ChevronUp, Download, ExternalLink, ShieldCheck } from 'lucide-react';

export type UserOrdersFilter = 'all' | 'in_progress' | 'pending' | 'completed';

const STEPS = [
  { num: 1, name: "Pesanan Dibuat", desc: "Data dicatat" },
  { num: 2, name: "Verifikasi Pembayaran", desc: "QRIS Terkonfirmasi" },
  { num: 3, name: "Proses Pengerjaan", desc: "Joki / Admin Aktif" },
  { num: 4, name: "Pesanan Selesai", desc: "Serah Terima" }
];

interface UserOrdersModalProps {
  open: boolean;
  userOrders: UserOrder[];
  onClose: () => void;
  showToast: (msg: string) => void;
  whatsappNumber: string;
  initialFilter?: UserOrdersFilter;
  focusOrderId?: string | null;
  onTrackOrder?: (orderId: string) => { success: boolean; message: string };
}

export default function UserOrdersModal({
  open,
  userOrders,
  onClose,
  showToast,
  whatsappNumber,
  initialFilter = 'all',
  focusOrderId = null,
  onTrackOrder,
}: UserOrdersModalProps) {
  const [filter, setFilter] = useState<UserOrdersFilter>(initialFilter);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(focusOrderId);
  const [trackInput, setTrackInput] = useState('');

  useEffect(() => {
    if (open) {
      setFilter(initialFilter);
      if (focusOrderId) {
        setExpandedOrderId(focusOrderId);
      }
    }
  }, [open, initialFilter, focusOrderId]);

  useEffect(() => {
    if (open && focusOrderId) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`user-order-${focusOrderId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [open, focusOrderId]);

  if (!open) return null;

  const allCount = userOrders.length;
  const inProgressCount = userOrders.filter(o => o.status === 'in_progress').length;
  const pendingCount = userOrders.filter(o => o.status === 'pending').length;
  const completedCount = userOrders.filter(o => o.status === 'completed').length;

  const filtered = filter === 'all'
    ? userOrders
    : userOrders.filter(o => o.status === filter);

  const tabs: { key: UserOrdersFilter; label: string; count: number }[] = [
    { key: 'all', label: 'Semua Pesanan', count: allCount },
    { key: 'in_progress', label: 'Sedang Berlangsung', count: inProgressCount },
    { key: 'pending', label: 'Menunggu Verifikasi', count: pendingCount },
    { key: 'completed', label: 'Selesai', count: completedCount },
  ];

  const handleDownloadReceipt = (order: UserOrder) => {
    const receiptContent = `========================================
           FABLEMART STORE
    BUKTI SERAH TERIMA & STRUK RESMI
========================================
ID Pesanan   : #${order.id}
Tanggal      : ${order.date}
Status       : ${order.statusTitle}
Layanan      : ${order.product}
Varian       : ${order.variantName}
Kategori     : ${order.categoryLabel}
ID Game/Akun : ${order.inGameId || '-'}
Jumlah       : ${order.quantity}x
Total Biaya  : ${order.formattedPrice}
----------------------------------------
Catatan Admin:
${order.customerNote}

Jaminan Garansi:
${order.securityNotice}

Kontak WhatsApp CS: +${whatsappNumber}
Terima kasih telah berbelanja di FableMart!
========================================`;

    try {
      const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `FableMart-Struk-${order.id}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`✓ Struk & bukti pesanan #${order.id} berhasil diunduh.`);
    } catch {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(receiptContent).then(() => {
          showToast(`✓ Teks struk #${order.id} disalin ke clipboard.`);
        }).catch(() => {
          showToast(`Struk pesanan #${order.id} siap. Hubungi CS WhatsApp untuk file aset.`);
        });
      } else {
        showToast(`Struk pesanan #${order.id} siap. Hubungi CS WhatsApp untuk file aset.`);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] modal-pop-in">

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Package size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Status & Pesanan Saya</h3>
              <p className="text-[10px] text-slate-400">Live tracking pesanan real-time & garansi transaksi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="px-4 sm:px-5 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                filter === tab.key ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.key === 'in_progress' && inProgressCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              )}
              <span>{tab.label} ({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Track order by ID input */}
        {onTrackOrder && (
          <div className="px-4 sm:px-5 pb-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!trackInput.trim()) return;
                const res = onTrackOrder(trackInput.trim());
                showToast(res.message);
                if (res.success) setTrackInput('');
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={trackInput}
                onChange={(e) => setTrackInput(e.target.value)}
                placeholder="Lacak ID Pesanan lain (cth: FM-12345)..."
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 font-mono"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs border border-purple-200 transition cursor-pointer shrink-0"
              >
                Lacak
              </button>
            </form>
          </div>
        )}

        {/* Orders list */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 pb-5 space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white rounded-2xl border border-slate-200/80 shadow-soft space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center">
                <Package size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-black text-slate-800">Tidak Ada Pesanan di Kategori Ini</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Semua pesanan yang Anda buat akan langsung terpantau secara transparan dan real-time di sini.
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                Mulai Belanja Layanan
              </button>
            </div>
          ) : (
            filtered.map((order, idx) => {
              const progressWidth = ((order.currentStep - 1) / (STEPS.length - 1)) * 100;
              const isExpanded = expandedOrderId === order.id;
              const isFocused = focusOrderId === order.id;

              const statusColorBox =
                order.status === 'in_progress' ? 'bg-sky-50/80 border-sky-100 text-sky-900'
                : order.status === 'pending' ? 'bg-amber-50/80 border-amber-100 text-amber-900'
                : 'bg-emerald-50/80 border-emerald-100 text-emerald-900';
              const statusIconColor =
                order.status === 'in_progress' ? 'text-sky-600'
                : order.status === 'pending' ? 'text-amber-600'
                : 'text-emerald-600';

              return (
                <div
                  key={`${order.id}-${order.product}-${order.variantName}-${idx}`}
                  id={`user-order-${order.id}`}
                  className={`bg-white rounded-2xl border shadow-soft p-4 sm:p-5 space-y-4 transition-all duration-300 ${
                    isFocused
                      ? 'border-purple-500 ring-2 ring-purple-200'
                      : 'border-slate-200/80 hover:border-purple-200'
                  }`}
                >

                  {/* Header row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs sm:text-sm font-black text-purple-700 bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-200/70">
                        #{order.id}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {order.date}
                      </span>
                    </div>
                    <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-bold border ${order.statusBadgeColor} shadow-sm self-start sm:self-auto`}>
                      <span className={`w-2 h-2 rounded-full ${order.statusPulseColor} ${order.status === 'in_progress' ? 'animate-ping' : ''}`} />
                      {order.statusTitle}
                    </div>
                  </div>

                  {/* Product row */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100 shadow-sm">
                        <ProductIcon type={order.iconType} className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] font-bold text-purple-600 uppercase tracking-wide">{order.categoryLabel}</span>
                          {order.variantName && (
                            <span className="text-[9px] font-bold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-full border border-purple-200">
                              {order.variantName}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate mt-0.5">{order.product}</h4>
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                          Target / ID Game: <strong className="text-slate-700">{order.inGameId || '-'}</strong>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block font-medium">Total Nominal</span>
                      <span className="text-sm sm:text-base font-black text-pink-600">{order.formattedPrice}</span>
                    </div>
                  </div>

                  {/* 4-Step Stepper */}
                  <div className="pt-2 pb-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Progres Pengerjaan Layanan:</div>
                    <div className="relative flex items-center justify-between">
                      <div className="absolute top-3.5 left-4 right-4 h-1 bg-slate-100" />
                      <div className="absolute top-3.5 left-4 h-1 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500" style={{ width: `${progressWidth}%` }} />
                      {STEPS.map(s => {
                        const isPast = s.num < order.currentStep;
                        const isCurrent = s.num === order.currentStep;
                        return (
                          <div key={s.num} className="flex flex-col items-center text-center z-10 w-1/4">
                            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                              isPast ? 'bg-purple-600 text-white ring-2 ring-purple-100 shadow-sm'
                              : isCurrent ? 'bg-gradient-to-tr from-pink-600 to-purple-600 text-white ring-4 ring-purple-100 shadow-md animate-pulse'
                              : 'bg-white text-slate-400 border-2 border-slate-200'
                            }`}>
                              {isPast ? '✓' : s.num}
                            </div>
                            <span className={`text-[10px] font-bold mt-1.5 leading-tight ${isCurrent ? 'text-purple-700 font-extrabold' : isPast ? 'text-slate-700' : 'text-slate-400'}`}>
                              {s.name}
                            </span>
                            <span className="text-[9px] text-slate-400 hidden sm:inline leading-none mt-0.5">{s.desc}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Security notice / status box */}
                  <div className={`p-3 rounded-xl border ${statusColorBox} text-xs flex items-start gap-2.5`}>
                    <svg className={`w-4 h-4 shrink-0 mt-0.5 ${statusIconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="font-bold flex items-center justify-between gap-2 flex-wrap">
                        <span>{order.customerNote}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/70 font-semibold">{order.estimatedTime}</span>
                      </div>
                      <p className="text-[11px] opacity-80 leading-relaxed">{order.securityNotice}</p>
                    </div>
                  </div>

                  {/* Expandable detailed info */}
                  {isExpanded && (
                    <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-2.5 text-xs modal-pop-in">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                        <span className="font-extrabold text-slate-800 text-[11px]">Rincian Lengkap Pesanan</span>
                        <span className="text-[10px] font-mono text-purple-700 font-bold">Ref: #{order.id}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 text-[11px]">
                        <div>
                          <span className="text-slate-400">Produk:</span>{' '}
                          <span className="font-bold text-slate-800">{order.product}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Varian:</span>{' '}
                          <span className="font-bold text-purple-700">{order.variantName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">ID / Username:</span>{' '}
                          <span className="font-mono font-bold text-slate-800">{order.inGameId || '-'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Estimasi Selesai:</span>{' '}
                          <span className="font-bold text-emerald-700">{order.estimatedTime}</span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-slate-400">Status Verifikasi:</span>{' '}
                          <span className="font-semibold text-slate-800">
                            {order.status === 'completed'
                              ? '✓ Pesanan telah diverifikasi selesai oleh sistem FableMart'
                              : order.status === 'in_progress'
                              ? '⚡ Sedang aktif dikerjakan oleh admin/joki'
                              : '⏳ Menunggu validasi transfer QRIS'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action footer */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                      <span>Garansi FableMart: Transaksi Terenkripsi &amp; Pengiriman Dijamin</span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <a
                        href={`https://wa.me/${whatsappNumber}?text=Halo%20Admin%20FableMart,%20saya%20ingin%20tanya%20progres%20pesanan%20saya%20%23${order.id}%20(${encodeURIComponent(order.product)}).%20Terima%20kasih!`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-200"
                      >
                        <ExternalLink size={13} />
                        <span>Hubungi CS WA</span>
                      </a>

                      <button
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                        className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer text-center flex items-center justify-center gap-1"
                      >
                        <span>{isExpanded ? 'Tutup Detail' : 'Lihat Detail'}</span>
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>

                      {order.status === 'completed' && (
                        <button
                          onClick={() => handleDownloadReceipt(order)}
                          className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Download size={13} />
                          <span>Unduh Struk</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
