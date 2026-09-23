'use client';
import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Gamepad2,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  showToast: (msg: string) => void;
}

export default function AuthModal({
  open,
  onClose,
  initialMode = 'login',
  showToast,
}: AuthModalProps) {
  const {
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    resetPassword,
    formatAuthError,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [inGameId, setInGameId] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!open) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    setInGameId('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSwitchMode = (newMode: 'login' | 'register' | 'forgot') => {
    setMode(newMode);
    setErrorMessage('');
    setSuccessMessage('');
  };

  // 1. Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Harap isi alamat email dan kata sandi.');
      return;
    }

    setLoading(true);
    try {
      await loginWithEmail(email, password);
      showToast('✓ Berhasil masuk! Selamat datang kembali.');
      resetForm();
      onClose();
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMessage(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!displayName.trim()) {
      setErrorMessage('Harap masukkan nama lengkap Anda.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Harap masukkan alamat email yang valid.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Kata sandi minimal harus 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      await registerWithEmail(email, password, displayName, inGameId);
      showToast(`✓ Akun berhasil dibuat! Selamat datang, ${displayName.trim()}.`);
      resetForm();
      onClose();
    } catch (err: any) {
      console.error('Register error:', err);
      setErrorMessage(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Google Sign-In
  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setLoading(true);
    try {
      await loginWithGoogle(inGameId);
      showToast('✓ Berhasil masuk dengan Akun Google!');
      resetForm();
      onClose();
    } catch (err: any) {
      console.error('Google login error:', err);
      setErrorMessage(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Forgot Password
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim()) {
      setErrorMessage('Harap masukkan alamat email akun Anda.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setSuccessMessage(
        `Tautan reset kata sandi telah dikirim ke ${email}. Silakan periksa kotak masuk atau spam email Anda.`
      );
      showToast('✓ Tautan reset kata sandi telah dikirim.');
    } catch (err: any) {
      console.error('Reset password error:', err);
      setErrorMessage(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-[#140509] rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] overflow-hidden border border-rose-950/80 modal-pop-in z-10 text-slate-100">
        {/* Top Gradient Banner */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-rose-500 to-red-600" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-0 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 text-white flex items-center justify-center shadow-md shadow-red-950/60 shrink-0">
              <Sparkles size={22} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                {mode === 'login' && 'Masuk ke Rokai Store'}
                {mode === 'register' && 'Daftar Akun Baru'}
                {mode === 'forgot' && 'Reset Kata Sandi'}
              </h3>
              <p className="text-xs text-rose-300/60 mt-0.5">
                {mode === 'login' && 'Akses pesanan, riwayat, dan profil game Anda'}
                {mode === 'register' && 'Buat akun untuk belanja cepat & lacak pesanan'}
                {mode === 'forgot' && 'Pulihkan akses akun Anda dengan email'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-rose-950/60 flex items-center justify-center text-rose-400/70 hover:text-white transition cursor-pointer"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Switcher Tabs (Only for login & register) */}
        {mode !== 'forgot' && (
          <div className="px-5 sm:px-6 pt-4">
            <div className="flex rounded-2xl bg-[#1a070e] p-1 border border-rose-950/80">
              <button
                type="button"
                onClick={() => handleSwitchMode('login')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm'
                    : 'text-rose-300/70 hover:text-white'
                }`}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => handleSwitchMode('register')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm'
                    : 'text-rose-300/70 hover:text-white'
                }`}
              >
                Daftar Akun
              </button>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-950/50 border border-red-800/80 text-red-200 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
              <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Success Alert */}
          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-800/80 text-emerald-200 text-xs flex items-start gap-2.5">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-400" />
              <div className="flex-1 font-medium leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* Google Sign-In Button (Available in login & register) */}
          {mode !== 'forgot' && (
            <>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-2xl border border-rose-900/60 bg-[#1a070e] hover:bg-rose-950/50 text-white text-xs font-bold transition flex items-center justify-center gap-3 shadow-xs hover:shadow-sm cursor-pointer active:scale-[0.99] disabled:opacity-60"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>
                  {mode === 'login' ? 'Masuk dengan Google' : 'Daftar Cepat dengan Google'}
                </span>
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-rose-950/80" />
                <span className="absolute bg-[#140509] px-3 text-[10px] font-bold text-rose-300/50 uppercase tracking-wider">
                  atau dengan email
                </span>
              </div>
            </>
          )}

          {/* ================= MODE: LOGIN ================= */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold text-rose-300/70 uppercase tracking-wider block mb-1">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-400/60" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-rose-900/60 bg-[#220a13] text-white placeholder-rose-300/30 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-rose-300/70 uppercase tracking-wider">
                    Kata Sandi
                  </label>
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('forgot')}
                    className="text-[10px] font-bold text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                  >
                    Lupa Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-400/60" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi..."
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

              {/* Login Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold transition shadow-md shadow-red-950/60 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-[0.99]"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Masuk ke Akun</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-rose-300/60 pt-1">
                Belum punya akun?{' '}
                <button
                  type="button"
                  onClick={() => handleSwitchMode('register')}
                  className="font-bold text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                >
                  Daftar Sekarang
                </button>
              </p>
            </form>
          )}

          {/* ================= MODE: REGISTER ================= */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-rose-300/70 uppercase tracking-wider block mb-1">
                  Nama Lengkap *
                </label>
                <div className="relative">
                  <UserIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-400/60" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Nama panggilan atau nama lengkap"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-rose-900/60 bg-[#220a13] text-white placeholder-rose-300/30 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-rose-300/70 uppercase tracking-wider block mb-1">
                  Alamat Email *
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-400/60" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-rose-900/60 bg-[#220a13] text-white placeholder-rose-300/30 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium transition"
                  />
                </div>
                <p className="text-[9px] text-rose-300/50 mt-0.5">
                  Jika email merupakan akun Google, Anda juga bisa langsung masuk via Google.
                </p>
              </div>

              {/* Game Account Integration Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-rose-300/70 uppercase tracking-wider flex items-center gap-1">
                    <Gamepad2 size={12} className="text-rose-400" />
                    <span>Username / ID Akun Game</span>
                  </label>
                  <span className="text-[9px] font-semibold text-rose-300 bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-900/60">
                    Praktis Checkout
                  </span>
                </div>
                <div className="relative">
                  <Gamepad2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-400/60" />
                  <input
                    type="text"
                    value={inGameId}
                    onChange={e => setInGameId(e.target.value)}
                    placeholder="Contoh: roblox_user123 / gamer_roblox88"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-rose-900/60 bg-[#220a13] text-white placeholder-rose-300/30 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono transition"
                  />
                </div>
                <p className="text-[9px] text-rose-300/50 mt-0.5">
                  ID game ini akan otomatis terisi setiap kali Anda checkout pesanan.
                </p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-rose-300/70 uppercase tracking-wider block mb-1">
                  Kata Sandi *
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-400/60" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-9 pr-10 py-2 text-xs rounded-xl border border-rose-900/60 bg-[#220a13] text-white placeholder-rose-300/30 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium transition"
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

              <div>
                <label className="text-[10px] font-bold text-rose-300/70 uppercase tracking-wider block mb-1">
                  Konfirmasi Kata Sandi *
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-400/60" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-rose-900/60 bg-[#220a13] text-white placeholder-rose-300/30 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium transition"
                  />
                </div>
              </div>

              {/* Security Hint Notice for Game Passwords */}
              <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-900/40 text-[10px] text-amber-200/90 flex items-start gap-2">
                <ShieldAlert size={14} className="shrink-0 text-amber-500 mt-0.5" />
                <div className="leading-tight">
                  <strong>Tips Keamanan:</strong> Anda diperbolehkan menggunakan kata sandi yang mudah diingat (atau sama dengan akun game Anda), namun kami sarankan kata sandi unik untuk perlindungan maksimal.
                </div>
              </div>

              {/* Register Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold transition shadow-md shadow-red-950/60 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-[0.99]"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Daftar Akun Rokai Store</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-rose-300/60 pt-1">
                Sudah memiliki akun?{' '}
                <button
                  type="button"
                  onClick={() => handleSwitchMode('login')}
                  className="font-bold text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                >
                  Masuk di Sini
                </button>
              </p>
            </form>
          )}

          {/* ================= MODE: FORGOT PASSWORD ================= */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <p className="text-xs text-rose-200/80 leading-relaxed">
                Masukkan alamat email yang terdaftar pada akun Anda. Kami akan mengirimkan tautan resmi dari Firebase untuk mengatur ulang kata sandi.
              </p>

              <div>
                <label className="text-[10px] font-bold text-rose-300/70 uppercase tracking-wider block mb-1">
                  Alamat Email Terdaftar
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-400/60" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-rose-900/60 bg-[#220a13] text-white placeholder-rose-300/30 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold transition shadow-md shadow-red-950/60 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-[0.99]"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Kirim Tautan Pemulihan</span>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => handleSwitchMode('login')}
                  className="text-xs font-bold text-rose-400 hover:text-rose-300 transition cursor-pointer"
                >
                  ← Kembali ke Halaman Masuk
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
