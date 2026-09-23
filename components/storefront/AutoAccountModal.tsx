'use client';
import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Gamepad2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Package,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface AutoAccountModalProps {
  open: boolean;
  onClose: () => void;
  customerName: string;
  customerEmail: string;
  inGameId: string;
  orderId: string;
  onOpenOrders: () => void;
  showToast: (msg: string) => void;
}

export default function AutoAccountModal({
  open,
  onClose,
  customerName,
  customerEmail,
  inGameId,
  orderId,
  onOpenOrders,
  showToast,
}: AutoAccountModalProps) {
  const { registerWithEmail, resetPassword, formatAuthError } = useAuth();

  const [wantsPassword, setWantsPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!open) return null;

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (password.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      return;
    }

    setLoading(true);
    try {
      await registerWithEmail(customerEmail, password, customerName, inGameId);
      setIsSuccess(true);
      showToast('✓ Akun Anda berhasil diaktifkan! Anda kini sudah login.');
    } catch (err: any) {
      console.error('Auto account password setup error:', err);
      // If email already in use, offer reset password
      if (err.code === 'auth/email-already-in-use') {
        try {
          await resetPassword(customerEmail);
          setErrorMessage(
            'Email ini sudah terdaftar sebelumnya. Tautan akses telah dikirimkan ke email Anda untuk login instan.'
          );
        } catch {
          setErrorMessage('Email ini sudah terdaftar. Silakan login pada menu akun.');
        }
      } else {
        setErrorMessage(formatAuthError(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMyOrders = () => {
    onClose();
    onOpenOrders();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-[#140509] rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] overflow-hidden border border-rose-950/80 modal-pop-in z-10 text-slate-100">
        {/* Top Gradient Banner */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-rose-500 to-red-600" />

        <div className="p-5 sm:p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-950/80 text-rose-400 flex items-center justify-center shadow-xs shrink-0 border border-rose-900/60">
                <Sparkles size={24} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-300 bg-rose-950/80 px-2.5 py-0.5 rounded-full border border-rose-900/60">
                  Pesanan #{orderId} Berhasil
                </span>
                <h3 className="text-base sm:text-lg font-black text-white mt-1 leading-tight">
                  Akun Anda Otomatis Siap! 🎉
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-rose-950/60 flex items-center justify-center text-rose-400/70 hover:text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <p className="text-xs text-rose-300/70 leading-relaxed">
            Untuk kenyamanan Anda melacak pesanan dan bertransaksi di masa mendatang, sistem telah menyiapkan profil akun dengan rincian berikut:
          </p>

          {/* Account Summary Card */}
          <div className="p-4 rounded-2xl bg-[#1a070e]/90 border border-rose-950/80 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-rose-300/70">Nama Pelanggan:</span>
              <strong className="text-white font-extrabold">{customerName}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-rose-300/70 flex items-center gap-1">
                <Mail size={12} className="text-rose-400" />
                <span>Email Akun:</span>
              </span>
              <strong className="text-rose-300 font-bold">{customerEmail || 'Sesuai pesanan'}</strong>
            </div>
            {inGameId && (
              <div className="flex items-center justify-between">
                <span className="text-rose-300/70 flex items-center gap-1">
                  <Gamepad2 size={12} className="text-rose-400" />
                  <span>ID Akun Game:</span>
                </span>
                <span className="font-mono text-rose-300 font-black bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-900/60">
                  {inGameId}
                </span>
              </div>
            )}
          </div>

          {/* Google Login Tip Notice */}
          <div className="p-3 rounded-2xl bg-rose-950/30 border border-rose-900/40 text-[11px] text-rose-200 flex items-start gap-2">
            <ShieldCheck size={16} className="text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-tight">
              <strong>Tips Akses Mudah:</strong> Jika email Anda ({customerEmail}) merupakan akun Google (Gmail), Anda bisa langsung masuk ke website dengan tombol <strong>&ldquo;Masuk dengan Google&rdquo;</strong> kapan saja!
            </div>
          </div>

          {/* Success Activated State */}
          {isSuccess ? (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-white">
                <CheckCircle2 size={18} className="text-emerald-400" />
                <span>Kata Sandi Berhasil Disetel!</span>
              </div>
              <p className="leading-relaxed text-rose-300/80">
                Anda kini resmi memiliki akun aktif di Rokai Store. Anda dapat masuk menggunakan email dan sandi ini sewaktu-waktu.
              </p>
              <button
                type="button"
                onClick={handleOpenMyOrders}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs transition shadow-md shadow-red-950/60 flex items-center justify-center gap-1.5 cursor-pointer mt-1"
              >
                <Package size={14} />
                <span>Buka &amp; Lacak Pesanan Sekarang</span>
              </button>
            </div>
          ) : (
            <>
              {/* Optional Set Password Form */}
              {!wantsPassword ? (
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setWantsPassword(true)}
                    className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold transition shadow-md shadow-red-950/60 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                  >
                    <KeyRound size={15} />
                    <span>Lengkapi Kata Sandi Akun Sekarang</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenMyOrders}
                    className="w-full py-2.5 px-4 rounded-2xl border border-rose-900/60 bg-[#1a070e] hover:bg-rose-950/50 text-rose-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Package size={14} />
                    <span>Lacak Pesanan Saya Dulu</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSavePassword} className="space-y-3 pt-1 border-t border-rose-950/80">
                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-start gap-2">
                      <ShieldAlert size={15} className="shrink-0 text-red-400 mt-0.5" />
                      <div className="leading-tight">{errorMessage}</div>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-bold text-rose-300/80 uppercase tracking-wider block mb-1">
                      Buat Kata Sandi Akun Baru
                    </label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-400/60" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        autoFocus
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Minimal 6 karakter..."
                        className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-rose-900/60 bg-[#220a13] text-white placeholder-rose-300/30 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-400/60 hover:text-rose-200 cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Security Advice Notice */}
                  <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/50 text-[10px] text-amber-200/90 leading-tight">
                    💡 <strong>Catatan:</strong> Anda boleh menggunakan kata sandi yang sama dengan akun game Anda agar mudah diingat, namun kata sandi unik disarankan untuk proteksi maksimal.
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setWantsPassword(false)}
                      className="flex-1 py-2.5 rounded-xl border border-rose-900/60 bg-[#1a070e] hover:bg-rose-950/50 text-rose-300 text-xs font-bold transition cursor-pointer"
                    >
                      Nanti Saja
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold transition shadow-md shadow-red-950/60 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      {loading ? (
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Aktifkan Akun</span>
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
