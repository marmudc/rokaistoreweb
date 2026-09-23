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
  const waUrl = `https://wa.me/${cleanPhone}?text=Halo%20Admin%20Rokai%20Store,%20saya%20ingin%20konfirmasi%20kendala%20pada%20pesanan%20%23${order.id}%20(${encodeURIComponent(
    order.product
  )}).%20Kendala:%20${encodeURIComponent(order.issueReason || 'Mohon petunjuk kendala kredensial akun / 2FA')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md modal-fade-in">
      <div
        className="relative w-full max-w-lg bg-[#140509] rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] border border-rose-950/80 overflow-hidden modal-pop-in text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top decorative hazard ribbon */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-rose-950/60 hover:bg-rose-900/60 text-rose-400/70 hover:text-white flex items-center justify-center transition cursor-pointer z-10"
          aria-label="Tutup Peringatan"
        >
          <X size={16} />
        </button>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/60 text-rose-400 flex items-center justify-center shrink-0 border border-rose-900/50 shadow-xs">
              <AlertTriangle size={24} className="animate-pulse" />
            </div>
            <div className="min-w-0 pr-6">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-950/80 text-rose-300 border border-rose-900/60">
                  Peringatan Kendala
                </span>
                <span className="text-xs font-mono font-black text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded-lg border border-rose-900/60">
                  #{order.id}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-1 leading-tight">
                Pengerjaan Pesanan Mengalami Kendala
              </h3>
              <p className="text-xs text-rose-300/60 mt-0.5">
                Admin mendeteksi kendala pada pesanan Anda sehingga proses pengerjaan sementara tertunda.
              </p>
            </div>
          </div>

          {/* Order Summary Pill */}
          <div className="p-3.5 rounded-2xl bg-[#1a070e] border border-rose-950/80 flex items-center justify-between gap-3 text-xs">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-rose-300/60 uppercase tracking-wider">Produk / Layanan</p>
              <p className="font-extrabold text-white truncate">{order.product} ({order.variantName})</p>
            </div>
            {order.inGameId && (
              <div className="text-right shrink-0">
                <p className="text-[10px] font-bold text-rose-300/60 uppercase tracking-wider">ID Game</p>
                <p className="font-mono font-bold text-rose-400">{order.inGameId}</p>
              </div>
            )}
          </div>

          {/* Issue Reason Highlight Box */}
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-900/50 space-y-2.5 text-amber-200/90">
            <p className="text-[11px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <span>Laporan Kendala Dari Admin:</span>
            </p>
            <div className="p-3 rounded-xl bg-[#140509] border border-amber-900/60 shadow-xs">
              <p className="text-xs sm:text-sm font-black text-amber-300 italic leading-relaxed">
                &ldquo;{order.issueReason || 'Terdapat kendala data akun game atau verifikasi 2FA Anda. Mohon koordinasi dengan Admin.'}&rdquo;
              </p>
            </div>
            <div className="text-[11px] text-amber-200/80 space-y-0.5 pt-1">
              <p className="font-bold text-amber-300">Langkah Yang Perlu Dilakukan:</p>
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
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-98 text-white font-black text-xs sm:text-sm transition shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 cursor-pointer"
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
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#220a13] hover:bg-rose-950/50 text-rose-300 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 border border-rose-900/60"
              >
                <span>Buka Detail Pesanan</span>
                <ArrowRight size={13} />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 text-rose-300/80 font-bold text-xs transition cursor-pointer border border-rose-950"
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
