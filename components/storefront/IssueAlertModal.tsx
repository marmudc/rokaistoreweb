'use client';
import React from 'react';
import type { UserOrder } from '@/lib/types';
import { AlertTriangle, X, MessageSquare, ArrowRight } from 'lucide-react';

interface IssueAlertModalProps {
  open: boolean;
  order: UserOrder | null;
  whatsappNumber: string;
  onClose: () => void;
  onOpenOrders: (orderId: string) => void;
}

export default function IssueAlertModal({
  open,
  order,
  whatsappNumber,
  onClose,
  onOpenOrders,
}: IssueAlertModalProps) {
  if (!open || !order) return null;

  const cleanPhone = whatsappNumber.replace(/[^0-9]/g, '');
  const waUrl = `https://wa.me/${cleanPhone}?text=Halo%20Admin%20FableMart,%20saya%20ingin%20konfirmasi%20kendala%20pada%20pesanan%20%23${order.id}%20(${encodeURIComponent(
    order.product
  )}).%20Kendala:%20${encodeURIComponent(order.issueReason || 'Mohon petunjuk kendala kredensial akun / 2FA')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm modal-fade-in">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-rose-200 overflow-hidden modal-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top decorative hazard ribbon */}
        <div className="h-2 w-full bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer z-10"
          aria-label="Tutup Peringatan"
        >
          <X size={16} />
        </button>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200 ring-4 ring-rose-50 shadow-xs">
              <AlertTriangle size={24} className="animate-pulse" />
            </div>
            <div className="min-w-0 pr-6">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                  Peringatan Kendala
                </span>
                <span className="text-xs font-mono font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100">
                  #{order.id}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1 leading-tight">
                Pengerjaan Pesanan Mengalami Kendala
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Admin mendeteksi kendala pada pesanan Anda sehingga proses pengerjaan sementara tertunda.
              </p>
            </div>
          </div>

          {/* Order Summary Pill */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Produk / Layanan</p>
              <p className="font-extrabold text-slate-900 truncate">{order.product} ({order.variantName})</p>
            </div>
            {order.inGameId && (
              <div className="text-right shrink-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ID Game</p>
                <p className="font-mono font-bold text-purple-700">{order.inGameId}</p>
              </div>
            )}
          </div>

          {/* Issue Reason Highlight Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 via-rose-50/70 to-amber-50 border border-rose-200 space-y-2.5 ring-1 ring-rose-200">
            <p className="text-[11px] font-black uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
              <span>Laporan Kendala Dari Admin:</span>
            </p>
            <div className="p-3 rounded-xl bg-white/95 border border-rose-200/80 shadow-xs">
              <p className="text-xs sm:text-sm font-black text-rose-900 italic leading-relaxed">
                &ldquo;{order.issueReason || 'Terdapat kendala data akun game atau verifikasi 2FA Anda. Mohon koordinasi dengan Admin.'}&rdquo;
              </p>
            </div>
            <div className="text-[11px] text-rose-800/90 space-y-0.5 pt-1">
              <p className="font-bold">Langkah Yang Perlu Dilakukan:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] opacity-90">
                <li>Pastikan akun Anda tidak sedang dimainkan (logout terlebih dahulu).</li>
                <li>Siapkan kode verifikasi 2FA jika akun mengaktifkan 2-faktor.</li>
                <li>Hubungi Admin langsung melalui tombol WhatsApp di bawah.</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-1">
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              onClick={onClose}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-98 text-white font-black text-xs sm:text-sm transition shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageSquare size={16} />
              <span>Hubungi Admin via WhatsApp Sekarang</span>
            </a>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenOrders(order.id);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 border border-purple-200"
              >
                <span>Buka Detail Pesanan</span>
                <ArrowRight size={13} />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
