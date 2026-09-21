'use client';
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import type { CartItem, TwoFAType, PaymentConfirmationType } from '@/lib/types';
import {
  X,
  Gamepad2,
  Lock,
  Eye,
  EyeOff,
  Mail,
  User,
  Phone,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Upload,
  QrCode,
  Smartphone,
  MessageSquare,
  Receipt,
  Trash2,
} from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/context/AuthContext';
import TermsModal from '@/components/storefront/TermsModal';

export interface CheckoutCustomerData {
  username: string;
  gamePassword?: string;
  has2FA: boolean;
  twoFAType?: TwoFAType;
  phone: string;
  email?: string;
  name?: string;
  paymentConfirmationType: PaymentConfirmationType;
  paymentUniqueCode?: string;
  paymentProofImage?: string;
}

interface CheckoutModalProps {
  open: boolean;
  finalTotal: number;
  cart: CartItem[];
  discountAmount: number;
  appliedPromoCode: string;
  whatsappNumber: string;
  qrisImage: string;
  onClose: () => void;
  onConfirmPaid: (data: CheckoutCustomerData) => void;
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

  // Multi-step state: 1 = Formulir Data & Akun Game, 2 = Pembayaran & Konfirmasi
  const [step, setStep] = useState<1 | 2>(1);
  const prevOpenRef = useRef(false);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Form Fields - Step 1
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gameUsername, setGameUsername] = useState('');
  const [gamePassword, setGamePassword] = useState('');
  const [showGamePassword, setShowGamePassword] = useState(false);

  // 2FA Options (Wajib)
  const [has2FA, setHas2FA] = useState<boolean | null>(null);
  const [twoFAType, setTwoFAType] = useState<TwoFAType>('whatsapp');

  // Rules & Terms
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);

  // Form Fields - Step 2 (Payment Confirmation)
  const [confirmationType, setConfirmationType] = useState<PaymentConfirmationType>('unique_code');
  const [uniqueCode, setUniqueCode] = useState('');
  const [proofImage, setProofImage] = useState('');
  const [compressingProof, setCompressingProof] = useState(false);
  const proofFileInputRef = useRef<HTMLInputElement>(null);

  // Errors
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Only reset state and prefill fields when modal is freshly opened
    if (open && !prevOpenRef.current) {
      setStep(1);
      setErrorMessage('');
      setAgreedToTerms(false);
      setHas2FA(null);
      setConfirmationType('unique_code');
      setUniqueCode('');
      setProofImage('');

      if (user) {
        setGameUsername(userProfile?.defaultInGameId || profile?.defaultInGameId || '');
        setName(userProfile?.name || user.displayName || profile?.name || '');
        setEmail(user?.email || userProfile?.email || profile?.email || '');
        setPhone(userProfile?.phone || profile?.phone || '');
      } else {
        setGameUsername(profile?.defaultInGameId || '');
        setName(profile?.name || '');
        setEmail(profile?.email || '');
        setPhone(profile?.phone || '');
      }
    }
    prevOpenRef.current = open;
  }, [open, user, userProfile, profile]);

  if (!open) return null;

  // Compress proof image on hidden canvas (<100KB)
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const maxDim = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleProofFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Harap unggah file foto bukti berupa gambar (JPG, PNG, WEBP).');
      return;
    }

    setCompressingProof(true);
    setErrorMessage('');
    try {
      const compressed = await compressImage(file);
      setProofImage(compressed);
    } catch (err) {
      console.error('Error compressing proof:', err);
      setErrorMessage('Gagal memproses foto bukti. Silakan coba lagi.');
    } finally {
      setCompressingProof(false);
      if (proofFileInputRef.current) proofFileInputRef.current.value = '';
    }
  };

  // Step 1 Validation -> Proceed to Payment (Step 2)
  const handleProceedToPayment = () => {
    setErrorMessage('');

    if (!phone.trim()) {
      setErrorMessage('Harap isi Nomor WhatsApp Anda untuk koordinasi pesanan.');
      return;
    }

    if (!user && !email.trim()) {
      setErrorMessage('Harap isi Alamat Email Anda untuk pengiriman bukti dan akun otomatis.');
      return;
    }

    if (!gameUsername.trim()) {
      setErrorMessage('Harap isi Username / ID Akun Game Anda.');
      return;
    }

    if (!gamePassword.trim()) {
      setErrorMessage('Harap isi Password Akun Game untuk pengerjaan joki/setup.');
      return;
    }

    if (has2FA === null) {
      setErrorMessage('Harap pilih apakah akun game Anda memiliki 2FA (Verifikasi Dua Langkah) atau tidak.');
      return;
    }

    if (!agreedToTerms) {
      setTermsModalOpen(true);
      return;
    }

    setStep(2);
    if (modalContentRef.current) {
      modalContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBackToStep1 = () => {
    setStep(1);
    if (modalContentRef.current) {
      modalContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Step 2 Submission -> Confirm Paid
  const handleFinalSubmit = () => {
    setErrorMessage('');

    if (confirmationType === 'unique_code' && !uniqueCode.trim()) {
      setErrorMessage('Harap masukkan Kode Unik Transaksi atau 4-6 digit terakhir referensi transfer Anda.');
      return;
    }

    if (confirmationType === 'proof_photo' && !proofImage) {
      setErrorMessage('Harap unggah Foto Bukti Pembayaran / Struk transfer Anda.');
      return;
    }

    // Save default inGameId for future convenience upon final order submission
    if (user) {
      updateProfileData({
        defaultInGameId: gameUsername.trim(),
        phone: phone.trim(),
      }).catch(() => {});
    }
    updateProfile({
      ...profile,
      defaultInGameId: gameUsername.trim(),
      name: name.trim() || profile.name,
      email: email.trim() || profile.email,
      phone: phone.trim() || profile.phone,
    }).catch(() => {});

    const payload: CheckoutCustomerData = {
      username: gameUsername.trim(),
      gamePassword: gamePassword.trim(),
      has2FA: !!has2FA,
      twoFAType: has2FA ? twoFAType : undefined,
      phone: phone.trim(),
      email: email.trim(),
      name: name.trim(),
      paymentConfirmationType: confirmationType,
      paymentUniqueCode: confirmationType === 'unique_code' ? uniqueCode.trim() : undefined,
      paymentProofImage: confirmationType === 'proof_photo' ? proofImage : undefined,
    };

    onConfirmPaid(payload);
    onClose();
  };

  const buildWhatsAppLink = () => {
    const itemsText = cart.map(i => {
      const vText = i.variantName ? ` [${i.variantName}]` : '';
      return `- ${i.title}${vText} (${i.quantity}x) = Rp ${(i.price * i.quantity).toLocaleString('id-ID')}`;
    }).join('%0A');
    const promoNote = appliedPromoCode ? `%0A(Diskon Promo ${appliedPromoCode}: -Rp ${discountAmount.toLocaleString('id-ID')})` : '';
    const userNote = `%0AUsername/ID Game: ${encodeURIComponent(gameUsername)}`;
    const passNote = `%0APassword Game: [SUDAH DISERAHKAN VIA SISTEM]`;
    const twoFANote = has2FA ? `%0AStatus 2FA: Ada (${twoFAType})` : '%0AStatus 2FA: Tidak Ada';
    const confNote = confirmationType === 'unique_code'
      ? `%0AKode Unik / Ref: ${encodeURIComponent(uniqueCode)}`
      : '%0ABukti Pembayaran: [Foto diunggah di sistem]';
    const contactNote = `%0ANomor WA: ${encodeURIComponent(phone)}`;
    const msg = `Halo Admin FableMart! Saya ingin konfirmasi pembayaran pesanan:%0A%0A${itemsText}${promoNote}${userNote}${passNote}${twoFANote}${confNote}${contactNote}%0A%0ATotal: Rp ${finalTotal.toLocaleString('id-ID')}%0ASaya sudah menyetujui syarat & ketentuan layanan. Mohon diproses, terima kasih!`;
    return `https://wa.me/${whatsappNumber}?text=${msg}`;
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />

        {/* Modal Card */}
        <div ref={modalContentRef} className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-y-auto max-h-[94vh] modal-pop-in flex flex-col">
          {/* Top Step Progress Bar */}
          <div className="h-1.5 w-full bg-slate-100 shrink-0">
            <div
              className="h-full bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 transition-all duration-300"
              style={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                    Langkah {step} dari 2
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {step === 1 ? 'Data Akun & Keamanan' : 'Pembayaran QRIS'}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  {step === 1 ? 'Lengkapi Data Akun Game' : 'Selesaikan Pembayaran QRIS'}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error Message Notice */}
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <ShieldAlert size={15} className="shrink-0 text-red-500 mt-0.5" />
                <div className="leading-snug">{errorMessage}</div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 1: FORM DATA AKUN GAME & 2FA & TERMS                                */}
            {/* ========================================================================= */}
            {step === 1 && (
              <div className="space-y-4">
                {/* 1. Identitas Pemesan */}
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-3">
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <User size={14} className="text-purple-600" />
                    <span>1. Identitas &amp; Kontak Pemesan</span>
                  </h4>

                  {user ? (
                    <div className="p-3 rounded-xl bg-white border border-purple-100 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
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
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        ✓ Akun Login
                      </span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Nama Lengkap / Panggilan
                        </label>
                        <input
                          type="text"
                          placeholder="Nama Anda"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Alamat Email *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="nama@email.com"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white font-medium"
                        />
                      </div>
                    </div>
                  )}

                  {/* WhatsApp Phone */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Nomor WhatsApp Aktif * (Untuk Koordinasi Serah Terima)
                    </label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        required
                        placeholder="Contoh: 081234567890 / 6281234567890"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white font-mono font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Data Akun Game (Wajib Dijaga Rahasia) */}
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Gamepad2 size={14} className="text-pink-600" />
                      <span>2. Data Kredensial Akun Game</span>
                    </h4>
                    <span className="text-[9px] font-bold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-full border border-purple-200">
                      🔒 Terenkripsi Aman
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Username / ID Akun Game * (Roblox / Minecraft / dll)
                    </label>
                    <div className="relative">
                      <Gamepad2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="Contoh: username_roblox88 / ID Akun"
                        value={gameUsername}
                        onChange={e => setGameUsername(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white font-mono font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Password Akun Game * (Untuk Pengerjaan Joki / Setup)
                    </label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showGamePassword ? 'text' : 'password'}
                        required
                        placeholder="Masukkan kata sandi akun game..."
                        value={gamePassword}
                        onChange={e => setGamePassword(e.target.value)}
                        className="w-full pl-8 pr-9 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white font-mono font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowGamePassword(!showGamePassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showGamePassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Security Badge */}
                  <div className="p-2.5 rounded-xl bg-purple-50/80 border border-purple-100 text-[10px] text-purple-900 flex items-start gap-2">
                    <ShieldCheck size={14} className="text-purple-600 shrink-0 mt-0.5" />
                    <div className="leading-tight">
                      <strong>Jaminan Keamanan FableMart:</strong> Kredensial akun game Anda dijaga kerahasiaannya dengan proteksi tinggi dan hanya diakses joki resmi untuk pengerjaan pesanan.
                    </div>
                  </div>
                </div>

                {/* 3. Pilihan Wajib 2FA */}
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Smartphone size={14} className="text-purple-600" />
                      <span>3. Verifikasi Dua Langkah (2FA)</span>
                    </h4>
                    <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Wajib Dipilih
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Apakah akun game Anda memiliki keamanan Verifikasi 2 Langkah (2FA/PIN/Kode OTP)?
                  </p>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setHas2FA(false)}
                      className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                        has2FA === false
                          ? 'border-purple-600 bg-purple-50/90 text-purple-900 ring-2 ring-purple-300/40 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        has2FA === false ? 'border-purple-600 bg-purple-600' : 'border-slate-300'
                      }`}>
                        {has2FA === false && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold">Tidak Ada 2FA</p>
                        <p className="text-[9px] text-slate-400">Login langsung tanpa kode</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setHas2FA(true)}
                      className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                        has2FA === true
                          ? 'border-purple-600 bg-purple-50/90 text-purple-900 ring-2 ring-purple-300/40 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        has2FA === true ? 'border-purple-600 bg-purple-600' : 'border-slate-300'
                      }`}>
                        {has2FA === true && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold">Ada 2FA</p>
                        <p className="text-[9px] text-slate-400">Memerlukan kode OTP</p>
                      </div>
                    </button>
                  </div>

                  {/* Sub-choice if has2FA is true */}
                  {has2FA === true && (
                    <div className="pt-2 border-t border-slate-200/70 space-y-2 modal-pop-in">
                      <label className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block">
                        Pilih Metode Verifikasi 2FA Akun Anda: *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[
                          {
                            id: 'whatsapp' as TwoFAType,
                            label: 'Khusus via WhatsApp',
                            desc: 'Admin chat WA minta kode',
                            icon: <MessageSquare size={13} className="text-emerald-600" />,
                          },
                          {
                            id: 'email' as TwoFAType,
                            label: 'Kode via Email',
                            desc: 'Kode masuk ke email',
                            icon: <Mail size={13} className="text-purple-600" />,
                          },
                          {
                            id: 'device' as TwoFAType,
                            label: 'Verifikasi HP',
                            desc: 'Notifikasi pop-up HP',
                            icon: <Smartphone size={13} className="text-sky-600" />,
                          },
                        ].map(t => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setTwoFAType(t.id)}
                            className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                              twoFAType === t.id
                                ? 'border-purple-600 bg-white text-purple-900 ring-2 ring-purple-300/40 shadow-xs'
                                : 'border-slate-200 bg-white/70 text-slate-600 hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              {t.icon}
                              <span className="text-[11px] font-bold">{t.label}</span>
                            </div>
                            <span className="text-[9px] text-slate-400">{t.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Rules & Terms Checkbox */}
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                  <div
                    onClick={() => {
                      if (!agreedToTerms) setTermsModalOpen(true);
                      else setAgreedToTerms(false);
                    }}
                    className="flex items-start gap-2.5 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      id="checkout-terms"
                      checked={agreedToTerms}
                      onChange={() => {}}
                      className="w-4 h-4 mt-0.5 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer pointer-events-none"
                    />
                    <div className="text-xs text-slate-700 leading-snug">
                      Saya telah membaca, yakin, dan menyetujui{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTermsModalOpen(true);
                        }}
                        className="font-black text-purple-700 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>Syarat, Ketentuan &amp; Konsekuensi Layanan</span>
                        <FileText size={12} />
                      </button>{' '}
                      termasuk menerima segala konsekuensi di luar lingkup pengerjaan resmi toko.
                    </div>
                  </div>
                  {!agreedToTerms && (
                    <p className="text-[10px] text-amber-700 ml-6">
                      ⚠️ Anda wajib membuka &amp; menyetujui ketentuan di atas agar tombol pembayaran aktif.
                    </p>
                  )}
                </div>

                {/* 5. Tombol Lanjut ke Pembayaran */}
                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  disabled={!agreedToTerms}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-md shadow-purple-500/25 hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
                >
                  <span>Lanjut ke Pembayaran</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 2: PEMBAYARAN QRIS & PILIHAN KODE UNIK / FOTO BUKTI                 */}
            {/* ========================================================================= */}
            {step === 2 && (
              <div className="space-y-4 modal-pop-in">
                {/* Total Bayar Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-50 to-purple-50 border border-purple-100 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Total yang Harus Dibayar
                  </p>
                  <p className="text-3xl font-black text-pink-600">
                    Rp {finalTotal.toLocaleString('id-ID')}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {cart.length} item • Scan QRIS via GoPay, OVO, Dana, BCA, dll
                  </p>
                </div>

                {/* QRIS Image Display */}
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white flex items-center justify-center p-3 shadow-xs">
                  <div className="relative w-48 h-48 sm:w-52 sm:h-52">
                    <Image
                      src={qrisImage}
                      alt="QRIS Pembayaran"
                      fill
                      unoptimized
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
                    <li>Scan QRIS di atas dengan nominal pas <strong>Rp {finalTotal.toLocaleString('id-ID')}</strong>.</li>
                    <li>Pilih metode konfirmasi di bawah: masukkan <strong>Kode Unik</strong> transaksi atau unggah <strong>Foto Bukti Transfer</strong>.</li>
                  </ol>
                </div>

                {/* PILIHAN WAJIB: KODE UNIK vs FOTO BUKTI PEMBAYARAN */}
                <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Receipt size={14} className="text-purple-600" />
                      <span>Metode Konfirmasi Pembayaran (Wajib)</span>
                    </label>
                    <span className="text-[9px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                      Pilih Salah Satu
                    </span>
                  </div>

                  {/* Tabs / Radio Selection */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmationType('unique_code')}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        confirmationType === 'unique_code'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>1. Kode Unik / Ref</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirmationType('proof_photo')}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        confirmationType === 'proof_photo'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Upload size={13} />
                      <span>2. Foto Bukti Transfer</span>
                    </button>
                  </div>

                  {/* OPTION 1: KODE UNIK */}
                  {confirmationType === 'unique_code' && (
                    <div className="space-y-1.5 pt-1 modal-pop-in">
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                        Masukkan Kode Referensi / 4-6 Digit Terakhir Transaksi *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: 9842 atau REF-88123"
                        value={uniqueCode}
                        onChange={e => setUniqueCode(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 font-mono font-medium bg-white"
                      />
                      <p className="text-[9px] text-slate-400 leading-relaxed">
                        Dapat dilihat pada rincian struk transfer di aplikasi m-Banking atau E-Wallet Anda.
                      </p>
                    </div>
                  )}

                  {/* OPTION 2: FOTO BUKTI PEMBAYARAN */}
                  {confirmationType === 'proof_photo' && (
                    <div className="space-y-2 pt-1 modal-pop-in">
                      <input
                        ref={proofFileInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={handleProofFileSelect}
                        className="hidden"
                      />

                      {proofImage ? (
                        <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center gap-3">
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                            <img
                              src={proofImage}
                              alt="Bukti Transfer"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              ✓ Foto Bukti Terunggah
                            </span>
                            <p className="text-[10px] text-slate-400 mt-1 truncate">
                              Gambar struk telah dioptimalkan
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setProofImage('')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="Hapus Foto"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={compressingProof}
                          onClick={() => proofFileInputRef.current?.click()}
                          className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-purple-200 bg-white hover:bg-purple-50/50 text-purple-700 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                        >
                          {compressingProof ? (
                            <span className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Upload size={16} />
                          )}
                          <span>{compressingProof ? 'Mengoptimalkan Gambar...' : 'Unggah Foto Struk Transfer'}</span>
                        </button>
                      )}
                      <p className="text-[9px] text-slate-400 leading-relaxed">
                        Format PNG, JPG, atau WEBP. Foto otomatis dioptimalkan agar ringan dan terkirim cepat.
                      </p>
                    </div>
                  )}
                </div>

                {/* Final Actions */}
                <div className="flex flex-col gap-2 pt-1">
                  <a
                    href={buildWhatsAppLink()}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs text-center transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    <span>Konfirmasi Lengkap via WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleFinalSubmit}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs shadow-md hover:shadow-lg transition cursor-pointer active:scale-[0.99] flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 size={16} />
                    <span>✓ Saya Sudah Transfer (Selesaikan Pesanan)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBackToStep1}
                    className="w-full py-2 text-slate-500 hover:text-slate-800 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft size={13} />
                    <span>Kembali ke Data Akun Game</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rules & Terms Dedicated Modal */}
      <TermsModal
        open={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        onAccept={() => setAgreedToTerms(true)}
      />
    </>
  );
}
