'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  ShieldCheck,
  Package,
  ShoppingCart,
  Check,
  Settings,
  Volume2,
  VolumeX,
  LogOut,
  LogIn,
  Gamepad2,
  Mail,
  User as UserIcon,
  Sparkles,
  Link as LinkIcon,
} from 'lucide-react';
import { useUserProfile, defaultUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/context/AuthContext';
import { playNotificationSound } from '@/lib/notifications';
import type { UserProfile } from '@/lib/types';

interface AccountModalProps {
  open: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onOpenOrders: (filter?: 'all' | 'in_progress' | 'pending' | 'completed') => void;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
  userOrdersCount: number;
  activeOrdersCount: number;
  cartCount: number;
  showToast: (msg: string) => void;
}

export default function AccountModal({
  open,
  onClose,
  isAdmin,
  onOpenOrders,
  onOpenAuth,
  userOrdersCount,
  activeOrdersCount,
  cartCount,
  showToast,
}: AccountModalProps) {
  const { profile: storedProfile, updateProfile } = useUserProfile();
  const { user, userProfile, updateProfileData, linkWithGoogle, logout, formatAuthError } = useAuth();

  const [profile, setProfile] = useState<UserProfile>(defaultUserProfile);
  const [linkingGoogle, setLinkingGoogle] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (userProfile) {
        setProfile({
          name: userProfile.name || '',
          email: userProfile.email || user?.email || '',
          defaultInGameId: userProfile.defaultInGameId || '',
          soundEnabled: userProfile.soundEnabled !== false,
          phone: userProfile.phone || '',
        });
      } else {
        setProfile(storedProfile);
      }
    }
  }, [open, userProfile, storedProfile, user]);

  if (!open) return null;

  const effectiveIsAdmin = isAdmin || userProfile?.role === 'admin';
  const isGoogleLinked = user?.providerData.some(p => p.providerId === 'google.com') || userProfile?.googleLinked;

  const handleSave = async () => {
    setSaving(true);
    try {
      if (user) {
        await updateProfileData({
          name: profile.name.trim(),
          defaultInGameId: profile.defaultInGameId?.trim() || '',
          soundEnabled: profile.soundEnabled !== false,
        });
      }
      await updateProfile(profile);
      showToast('✓ Profil & Pengaturan Akun berhasil disimpan!');
    } catch (err: any) {
      console.error('Save profile error:', err);
      showToast('Gagal menyimpan profil: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setSaving(false);
    }
  };

  const handleLinkGoogle = async () => {
    setLinkingGoogle(true);
    try {
      await linkWithGoogle();
      showToast('✓ Akun Google berhasil ditautkan ke akun Anda!');
    } catch (err: any) {
      console.error('Link Google error:', err);
      showToast(formatAuthError(err));
    } finally {
      setLinkingGoogle(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
      showToast('✓ Anda telah berhasil keluar dari akun.');
    } catch (err) {
      console.error('Logout error:', err);
      showToast('Gagal keluar akun. Silakan coba lagi.');
    }
  };

  const handleTestSound = () => {
    if (profile.soundEnabled !== false) {
      playNotificationSound();
      showToast('🔔 Suara notifikasi aktif.');
    } else {
      showToast('🔇 Suara notifikasi dinonaktifkan.');
    }
  };

  const userInitial = effectiveIsAdmin
    ? 'A'
    : (profile.name ? profile.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'P'));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-y-auto max-h-[92vh] modal-pop-in">
        <div className="p-5 sm:p-6 space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <Settings size={18} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">Profil & Pengaturan Akun</h3>
                <p className="text-[11px] text-slate-400">Kelola identitas dan preferensi akun Anda</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* User Profile Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-purple-50/50 border border-slate-200/80 flex items-center gap-4">
            <div className="relative shrink-0">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={profile.name || 'User'}
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-purple-300 shadow-md"
                />
              ) : (
                <div className={`w-14 h-14 rounded-2xl text-white flex items-center justify-center text-xl font-black shadow-md ${
                  effectiveIsAdmin ? 'bg-gradient-to-tr from-purple-600 to-pink-600' : 'bg-gradient-to-tr from-slate-700 to-slate-900'
                }`}>
                  {userInitial}
                </div>
              )}
              {effectiveIsAdmin && (
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] text-white font-bold" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-extrabold text-slate-900 truncate">
                  {effectiveIsAdmin ? 'Super Admin' : (profile.name || user?.displayName || 'Pelanggan')}
                </h4>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                  effectiveIsAdmin
                    ? 'bg-purple-100 text-purple-700 border-purple-200'
                    : user
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {effectiveIsAdmin ? '👑 Super Admin' : user ? '✓ Akun Terverifikasi' : '👤 Mode Tamu'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {user?.email || profile.email || 'Belum masuk ke akun'}
              </p>
              <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500 font-semibold flex-wrap">
                <span className="flex items-center gap-1">
                  <Package size={12} className="text-purple-600" />
                  {userOrdersCount} Pesanan ({activeOrdersCount} Aktif)
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <ShoppingCart size={12} className="text-pink-600" />
                  {cartCount} di Keranjang
                </span>
              </div>
            </div>
          </div>

          {/* Guest notice banner if unauthenticated */}
          {!user && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-indigo-500/10 border border-purple-200/80 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-purple-600" />
                  <span>Ingin menyimpan riwayat pesanan?</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Masuk atau buat akun untuk akses pesanan di perangkat manapun.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth?.('login');
                }}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
              >
                Masuk / Daftar
              </button>
            </div>
          )}

          {/* Profile Form Fields */}
          <div className="space-y-3.5 p-4 rounded-2xl bg-white border border-slate-200/80">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Nama Lengkap / Panggilan
              </label>
              <div className="relative">
                <UserIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={profile.name}
                  onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                  placeholder="Nama Anda"
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Alamat Email
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={user?.email || profile.email}
                  disabled={!!user}
                  onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                  placeholder="email@domain.com"
                  className={`w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium ${
                    user ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-purple-300'
                  }`}
                />
              </div>
              {user && (
                <p className="text-[9px] text-slate-400 mt-1">
                  Email akun login terlindungi oleh Firebase Auth.
                </p>
              )}
            </div>

            {/* In-Game Account ID Integration */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Gamepad2 size={13} className="text-purple-600" />
                  <span>Default Username / ID Akun Game</span>
                </label>
                <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-100">
                  Autofill Checkout
                </span>
              </div>
              <div className="relative">
                <Gamepad2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={profile.defaultInGameId || ''}
                  onChange={e => setProfile(p => ({ ...p, defaultInGameId: e.target.value }))}
                  placeholder="Contoh: gamer_roblox88 / ID Roblox"
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white font-mono"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                ID Roblox ini akan otomatis terisi setiap kali Anda checkout pesanan.
              </p>
            </div>

            {/* Google Account Linking (for logged-in users) */}
            {user && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Akun Google</span>
                    <span className="text-[10px] text-slate-400">
                      {isGoogleLinked ? 'Sudah ditautkan untuk login 1-klik' : 'Tautkan untuk kemudahan login'}
                    </span>
                  </div>
                </div>

                {isGoogleLinked ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg flex items-center gap-1">
                    <Check size={12} />
                    <span>Terhubung</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={linkingGoogle}
                    onClick={handleLinkGoogle}
                    className="text-[11px] font-bold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <LinkIcon size={12} />
                    <span>{linkingGoogle ? 'Menghubungkan...' : 'Tautkan'}</span>
                  </button>
                )}
              </div>
            )}

            {/* Sound Notification Toggle */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  {profile.soundEnabled !== false ? <Volume2 size={14} className="text-purple-600" /> : <VolumeX size={14} className="text-slate-400" />}
                  <span>Efek Suara Notifikasi</span>
                </div>
                <p className="text-[10px] text-slate-400">Mainkan nada lembut saat pesanan diperbarui atau promo tiba</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestSound}
                  className="text-[10px] font-bold text-purple-600 hover:text-purple-800 px-2 py-1 rounded-lg hover:bg-purple-50 transition cursor-pointer"
                >
                  Tes
                </button>
                <button
                  type="button"
                  onClick={() => setProfile(p => ({ ...p, soundEnabled: p.soundEnabled === false }))}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    profile.soundEnabled !== false ? 'bg-purple-600' : 'bg-slate-300'
                  }`}
                  aria-label="Toggle suara notifikasi"
                >
                  <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    profile.soundEnabled !== false ? 'left-6' : 'left-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenOrders('all');
                }}
                className="flex-1 py-2.5 px-3 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Package size={14} />
                <span>Buka Pesanan Saya ({userOrdersCount})</span>
              </button>

              {effectiveIsAdmin && (
                <Link
                  href="/admin"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <ShieldCheck size={14} />
                  <span>👑 Admin Dashboard</span>
                </Link>
              )}
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow transition cursor-pointer disabled:opacity-60"
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan Akun'}
            </button>

            {user && (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2 rounded-xl text-red-600 hover:bg-red-50 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut size={13} />
                <span>Keluar dari Akun</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
