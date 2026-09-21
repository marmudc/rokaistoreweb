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
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80 modal-pop-in z-10">
        {/* Top Gradient Banner */}
        <div className="h-2.5 w-full bg-gradient-to-r from-emerald-500 via-purple-600 to-pink-500" />

        <div className="p-5 sm:p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs shrink-0 border border-emerald-100">
                <Sparkles size={24} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
                  Pesanan #{orderId} Berhasil
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1 leading-tight">
                  Akun Anda Otomatis Siap! 🎉
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Untuk kenyamanan Anda melacak pesanan dan bertransaksi di masa mendatang, sistem telah menyiapkan profil akun dengan rincian berikut:
          </p>

          {/* Account Summary Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-purple-50/40 border border-slate-200/80 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Nama Pelanggan:</span>
              <strong className="text-slate-900 font-extrabold">{customerName}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1">
                <Mail size={12} className="text-purple-600" />
                <span>Email Akun:</span>
              </span>
              <strong className="text-purple-700 font-bold">{customerEmail || 'Sesuai pesanan'}</strong>
            </div>
            {inGameId && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1">
                  <Gamepad2 size={12} className="text-pink-600" />
                  <span>ID Akun Game:</span>
                </span>
                <span className="font-mono text-pink-700 font-black bg-pink-50 px-2 py-0.5 rounded-md border border-pink-100">
                  {inGameId}
                </span>
              </div>
            )}
          </div>

          {/* Google Login Tip Notice */}
          <div className="p-3 rounded-2xl bg-sky-50 border border-sky-100 text-[11px] text-sky-800 flex items-start gap-2">
            <ShieldCheck size={16} className="text-sky-600 shrink-0 mt-0.5" />
            <div className="leading-tight">
              <strong>Tips Akses Mudah:</strong> Jika email Anda ({customerEmail}) merupakan akun Google (Gmail), Anda bisa langsung masuk ke website dengan tombol <strong>&ldquo;Masuk dengan Google&rdquo;</strong> kapan saja!
            </div>
          </div>

          {/* Success Activated State */}
          {isSuccess ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <span>Kata Sandi Berhasil Disetel!</span>
              </div>
              <p className="leading-relaxed">
                Anda kini resmi memiliki akun aktif di FableMart. Anda dapat masuk menggunakan email dan sandi ini sewaktu-waktu.
              </p>
              <button
                type="button"
                onClick={handleOpenMyOrders}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer mt-1"
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
                    className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                  >
                    <KeyRound size={15} />
                    <span>Lengkapi Kata Sandi Akun Sekarang</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenMyOrders}
                    className="w-full py-2.5 px-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Package size={14} />
                    <span>Lacak Pesanan Saya Dulu</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSavePassword} className="space-y-3 pt-1 border-t border-slate-100">
                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                      <ShieldAlert size={15} className="shrink-0 text-red-500 mt-0.5" />
                      <div className="leading-tight">{errorMessage}</div>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Buat Kata Sandi Akun Baru
                    </label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        autoFocus
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Minimal 6 karakter..."
                        className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Security Advice Notice */}
                  <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[10px] text-amber-800 leading-tight">
                    💡 <strong>Catatan:</strong> Anda boleh menggunakan kata sandi yang sama dengan akun game Anda agar mudah diingat, namun kata sandi unik disarankan untuk proteksi maksimal.
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setWantsPassword(false)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                    >
                      Nanti Saja
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
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
