'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import type { CartItem } from '@/lib/types';
import { X, Gamepad2, Mail, User, Sparkles, ShieldAlert, Phone } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/context/AuthContext';

interface CheckoutModalProps {
  open: boolean;
  finalTotal: number;
  cart: CartItem[];
  discountAmount: number;
  appliedPromoCode: string;
  whatsappNumber: string;
  qrisImage: string;
  onClose: () => void;
  onConfirmPaid: (username: string, phone: string, email?: string, name?: string) => void;
}

export default function CheckoutModal({
  open,
  finalTotal,
  cart,
  discountAmount,
  appliedPromoCode,
  whatsappNumber,
  qrisImage,
  onClose,
  onConfirmPaid,
}: CheckoutModalProps) {
  const { profile, updateProfile } = useUserProfile();
  const { user, userProfile, updateProfileData } = useAuth();

  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (open) {
      setErrorMessage('');
      if (user) {
        setUsername(userProfile?.defaultInGameId || profile?.defaultInGameId || '');
        setName(userProfile?.name || user.displayName || profile?.name || '');
        setEmail(user?.email || userProfile?.email || profile?.email || '');
        setPhone(userProfile?.phone || profile?.phone || '');
      } else {
        setUsername(profile?.defaultInGameId || '');
        setName(profile?.name || '');
        setEmail(profile?.email || '');
        setPhone(profile?.phone || '');
      }
    }
  }, [open, user, userProfile, profile]);

  if (!open) return null;

  const handleConfirm = () => {
    setErrorMessage('');

    if (!username.trim()) {
      setErrorMessage('Harap masukkan Username / ID Akun Game Anda.');
      return;
    }

    if (!user && !email.trim()) {
      setErrorMessage('Harap masukkan alamat email untuk akun otomatis & bukti transaksi.');
      return;
    }

    // Save default inGameId for next checkouts
    if (user) {
      updateProfileData({
        defaultInGameId: username.trim(),
        phone: phone.trim(),
      }).catch(() => {});
    }
    updateProfile({
      ...profile,
      defaultInGameId: username.trim(),
      name: name.trim() || profile.name,
      email: email.trim() || profile.email,
      phone: phone.trim() || profile.phone,
    }).catch(() => {});

    onConfirmPaid(username.trim(), phone.trim(), email.trim(), name.trim());
    onClose();
  };

  const buildWhatsAppLink = () => {
    const itemsText = cart.map(i => {
      const vText = i.variantName ? ` [${i.variantName}]` : '';
      return `- ${i.title}${vText} (${i.quantity}x) = Rp ${(i.price * i.quantity).toLocaleString('id-ID')}`;
    }).join('%0A');
    const promoNote = appliedPromoCode ? `%0A(Diskon Promo ${appliedPromoCode}: -Rp ${discountAmount.toLocaleString('id-ID')})` : '';
    const userNote = username ? `%0AUsername/ID Game: ${encodeURIComponent(username)}` : '';
    const nameNote = name ? `%0ANama: ${encodeURIComponent(name)}` : '';
    const emailNote = email ? `%0AEmail: ${encodeURIComponent(email)}` : '';
    const phoneNote = phone ? `%0ANomor WA: ${encodeURIComponent(phone)}` : '';
    const msg = `Halo Admin FableMart! Saya ingin konfirmasi pembayaran pesanan:%0A%0A${itemsText}${promoNote}${userNote}${nameNote}${emailNote}${phoneNote}%0A%0ATotal: Rp ${finalTotal.toLocaleString('id-ID')}%0AMohon diproses, terima kasih!`;
    return `https://wa.me/${whatsappNumber}?text=${msg}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-y-auto max-h-[92vh] modal-pop-in">
        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Selesaikan Pembayaran</h3>
              <p className="text-[11px] text-slate-400">Scan QRIS &amp; lengkapi identitas akun game Anda</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* User status banner if logged in */}
          {user ? (
            <div className="p-3 rounded-2xl bg-purple-50/80 border border-purple-100 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {(userProfile?.name || user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {userProfile?.name || user?.displayName || 'Pelanggan'}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {user?.email}
                </p>
              </div>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-200">
                ✓ Akun Aktif
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100/80 text-[11px] text-purple-900 flex items-start gap-2">
              <Sparkles size={15} className="text-purple-600 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <strong>Akun Otomatis:</strong> Akun FableMart Anda akan langsung disiapkan menggunakan email &amp; ID Game ini agar pesanan Anda dapat dipantau setiap saat.
              </div>
            </div>
          )}

          {/* Total */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-50 to-purple-50 border border-purple-100 text-center">
            <p className="text-[11px] font-bold text-slate-400 mb-1">Total Pembayaran</p>
            <p className="text-3xl font-black text-pink-600">Rp {finalTotal.toLocaleString('id-ID')}</p>
            <p className="text-[10px] text-slate-500 mt-1">{cart.length} item • QRIS Instan / Semua E-Wallet &amp; Bank</p>
          </div>

          {/* QRIS Image */}
          <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white flex items-center justify-center p-3">
            <div className="relative w-48 h-48 sm:w-52 sm:h-52">
              <Image
                src={qrisImage}
                alt="QRIS FableMart"
                fill
                sizes="(max-width: 640px) 192px, 208px"
                loading="lazy"
                className="object-contain rounded-xl"
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-1 text-[11px] text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
            <p className="font-bold text-slate-800">Petunjuk Pembayaran:</p>
            <ol className="list-decimal list-inside space-y-0.5 text-slate-600 leading-relaxed">
              <li>Buka aplikasi m-Banking atau E-Wallet (GoPay, OVO, Dana, ShopeePay, BCA, dll).</li>
              <li>Scan kode QRIS di atas sesuai nominal <strong>Rp {finalTotal.toLocaleString('id-ID')}</strong>.</li>
              <li>Lengkapi ID Game Anda di bawah lalu klik <strong>&ldquo;Saya Sudah Transfer&rdquo;</strong>.</li>
            </ol>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <ShieldAlert size={15} className="shrink-0 text-red-500 mt-0.5" />
              <div className="leading-tight">{errorMessage}</div>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-3">
            {/* Game Account ID */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Gamepad2 size={13} className="text-purple-600" />
                  <span>Username / ID Akun Game *</span>
                </label>
                <span className="text-[9px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.2 rounded">
                  Wajib Diisi
                </span>
              </div>
              <input
                type="text"
                required
                placeholder="Contoh: roblox_username / username Minecraft..."
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 font-mono font-medium"
              />
              <p className="text-[9px] text-slate-400 mt-0.5">
                ID ini akan digunakan joki / admin untuk proses pengerjaan dan serah terima akun.
              </p>
            </div>

            {/* If guest, ask for Name and Email */}
            {!user && (
              <>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Nama Lengkap / Panggilan
                  </label>
                  <div className="relative">
                    <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Nama Anda"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Alamat Email (Untuk Akun &amp; Pelacakan) *
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="nama@email.com (Gmail disarankan)"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium"
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 mt-0.5">
                    Akun otomatis akan terhubung dengan email ini untuk akses mudah di masa depan.
                  </p>
                </div>
              </>
            )}

            {/* WhatsApp Phone input */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Nomor WhatsApp / Kontak (Opsional)
              </label>
              <div className="relative">
                <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2.5 pt-2">
            <a
              href={buildWhatsAppLink()}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs text-center transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Konfirmasi via WhatsApp
            </a>
            <button
              onClick={handleConfirm}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-sm shadow-md hover:shadow-lg transition cursor-pointer active:scale-[0.99]"
            >
              ✓ Saya Sudah Transfer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
