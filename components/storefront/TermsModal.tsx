'use client';
import React from 'react';
import { ShieldCheck, ShieldAlert, X, CheckCircle2, Lock, AlertTriangle, FileText } from 'lucide-react';

interface TermsModalProps {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export default function TermsModal({ open, onClose, onAccept }: TermsModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-[#140509] rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] overflow-hidden border border-rose-950/80 modal-pop-in z-10 flex flex-col max-h-[90vh] text-slate-100">
        {/* Top Gradient */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-rose-500 to-red-600" />

        {/* Header */}
        <div className="p-5 sm:p-6 pb-3 border-b border-rose-950/80 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-950/60 text-rose-400 border border-rose-900/50 flex items-center justify-center shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-white leading-tight">
                Syarat, Ketentuan &amp; Konsekuensi Layanan
              </h3>
              <p className="text-[11px] text-rose-300/60">Harap baca dengan cermat sebelum melanjutkan transaksi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-rose-950/60 flex items-center justify-center text-rose-400/70 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content - Scrollable */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto text-xs text-slate-300 leading-relaxed">
          {/* Important notice banner */}
          <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-900/50 text-amber-200/90 flex items-start gap-2.5">
            <ShieldAlert size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="leading-snug text-[11px]">
              <strong>Pernyataan Kesadaran Pengguna:</strong> Anda menyatakan telah yakin dan siap menerima segala konsekuensi yang berada di luar lingkup pengerjaan resmi Rokai Store.
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-[#1a070e]/90 border border-rose-950/80">
              <h4 className="font-bold text-white flex items-center gap-1.5 mb-1 text-xs">
                <Lock size={14} className="text-rose-400" />
                <span>1. Keamanan &amp; Kerahasiaan Data Akun Game</span>
              </h4>
              <p className="text-rose-200/70 text-[11px] leading-relaxed">
                Rokai Store berkomitmen menjaga kerahasiaan data kredensial (Username &amp; Password) akun game Anda. Data hanya diakses oleh admin/joki resmi selama masa pengerjaan dan tidak akan pernah dibagikan kepada pihak ketiga manapun.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#1a070e]/90 border border-rose-950/80">
              <h4 className="font-bold text-white flex items-center gap-1.5 mb-1 text-xs">
                <AlertTriangle size={14} className="text-amber-400" />
                <span>2. Batasan Tanggung Jawab &amp; Konsekuensi di Luar Toko</span>
              </h4>
              <p className="text-rose-200/70 text-[11px] leading-relaxed">
                Segala bentuk kendala yang timbul akibat aktivitas mandiri pembeli saat akun sedang dikerjakan (seperti login bersamaan), membagikan password ke pihak luar, atau perubahan di luar pengerjaan toko berada sepenuhnya di luar tanggung jawab Rokai Store. Pembeli diwajibkan <strong>mengganti kata sandi akun game setelah pengerjaan selesai</strong> demi keamanan optimal.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#1a070e]/90 border border-rose-950/80">
              <h4 className="font-bold text-white flex items-center gap-1.5 mb-1 text-xs">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>3. Verifikasi Dua Langkah (2FA)</span>
              </h4>
              <p className="text-rose-200/70 text-[11px] leading-relaxed">
                Jika akun game Anda mengaktifkan 2FA, Anda bersedia merespons permintaan kode verifikasi (via Email, Notifikasi Perangkat, atau WhatsApp) secara tepat waktu agar proses pengerjaan tidak terhambat.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#1a070e]/90 border border-rose-950/80">
              <h4 className="font-bold text-white flex items-center gap-1.5 mb-1 text-xs">
                <CheckCircle2 size={14} className="text-rose-400" />
                <span>4. Garansi Transaksi 100%</span>
              </h4>
              <p className="text-rose-200/70 text-[11px] leading-relaxed">
                Rokai Store memberikan jaminan uang kembali 100% jika terjadi kegagalan transaksi atau kesalahan sistem yang terbukti murni berasal dari pihak kami.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-rose-950/80 bg-[#17060b] flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-rose-900/60 text-rose-300 hover:text-white hover:bg-rose-950/50 text-xs font-bold transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              onAccept();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold transition shadow-md shadow-red-950/60 flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <CheckCircle2 size={15} />
            <span>Saya Mengerti &amp; Setuju</span>
          </button>
        </div>
      </div>
    </div>
  );
}
