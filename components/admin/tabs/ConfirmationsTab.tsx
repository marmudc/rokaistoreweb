'use client';
import React, { useState } from 'react';
import type { AdminOrder } from '@/lib/types';
import {
  Gamepad2,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Mail,
  MessageSquare,
  Receipt,
  ExternalLink,
  X,
  FileCheck,
  AlertCircle,
  AlertTriangle,
  Inbox,
} from 'lucide-react';

interface ConfirmationsTabProps {
  adminOrders: AdminOrder[];
  onApprovePayment: (id: string) => void;
  onRejectProof?: (id: string, reason: string) => void;
  onCancel?: (id: string) => void;
  onDelete: (id: string) => void;
  showToast: (msg: string) => void;
}

export default function ConfirmationsTab({
  adminOrders,
  onApprovePayment,
  onRejectProof,
  onCancel,
  onDelete,
  showToast,
}: ConfirmationsTabProps) {
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string } | null>(null);
  const [rejectingOrder, setRejectingOrder] = useState<AdminOrder | null>(null);
  const [selectedReason, setSelectedReason] = useState('Bukti transfer tidak sah / tidak ditemukan dalam mutasi rekening');
  const [customReason, setCustomReason] = useState('');

  // Filter ONLY orders awaiting payment verification / confirmation
  const pendingOrders = adminOrders.filter(
    o => o.status === 'Menunggu Konfirmasi' || o.status === 'Menunggu Verifikasi'
  );

  const togglePassword = (orderId: string) => {
    setRevealedPasswords(prev => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const copyToClipboard = (text: string, key: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      showToast(`✓ ${label} disalin ke clipboard`);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#1c2130] border border-amber-900/40">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-950/60 text-amber-400 flex items-center justify-center shrink-0 border border-amber-800/60 shadow-xs">
            <Receipt size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-slate-100">Konfirmasi Pembayaran Pesanan</h3>
              {pendingOrders.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                  {pendingOrders.length} Menunggu Persetujuan
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Periksa bukti transfer dan data akun di bawah. Setelah Anda menyetujui pembayaran, data pesanan akan
              otomatis berpindah ke halaman <strong className="text-slate-200">Kelola Pesanan</strong> (Antrean Pengerjaan).
            </p>
          </div>
        </div>
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {pendingOrders.length === 0 ? (
          <div className="text-center py-14 bg-[#151923] rounded-2xl border border-slate-800 shadow-sm space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-950/60 text-emerald-400 flex items-center justify-center border border-emerald-800/60 shadow-xs">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-100">Semua Pembayaran Telah Dikonfirmasi!</p>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Tidak ada pesanan baru yang sedang menunggu verifikasi pembayaran saat ini. Semua pesanan yang disetujui
                tersedia di halaman <strong className="text-slate-300">Kelola Pesanan</strong>.
              </p>
            </div>
          </div>
        ) : (
          pendingOrders.map(order => {
            const isPasswordRevealed = !!revealedPasswords[order.id];

            return (
              <div
                key={order.id}
                className="bg-[#151923] rounded-2xl border border-amber-900/40 shadow-sm p-4 sm:p-5 hover:border-amber-700/60 transition space-y-4"
              >
                {/* Top row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-950/60 text-amber-400 flex items-center justify-center text-xs font-black shrink-0 border border-amber-800/60">
                      #
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-black text-rose-400">{order.id}</span>
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-700/60 flex items-center gap-1.5 shadow-xs">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                          Menunggu Verifikasi Pembayaran
                        </span>
                        {order.agreedToTerms && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1c2130] text-slate-300 border border-slate-800 flex items-center gap-1">
                            <FileCheck size={10} className="text-emerald-400" /> Syarat Disetujui
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {order.date} • {order.payment}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">Nominal Transfer</span>
                    <p className="text-lg font-black text-rose-400">Rp {order.amount.toLocaleString('id-ID')}</p>
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Customer Info */}
                  <div className="p-3 bg-[#1c2130] rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Identitas Pembeli</span>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Nama:</span>
                      <span className="font-bold text-slate-200">{order.customer}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">WhatsApp:</span>
                      <span className="font-bold text-slate-200 font-mono">{order.phone}</span>
                    </div>
                    {order.customerEmail && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Email:</span>
                        <span className="font-bold text-slate-200 truncate max-w-[170px]">{order.customerEmail}</span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-3 bg-[#1c2130] rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Pesanan Layanan</span>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-slate-400 font-medium">Produk:</span>
                      <span className="font-bold text-slate-200 text-right">{order.product}</span>
                    </div>
                    {order.variantName && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Varian Paket:</span>
                        <span className="font-bold text-rose-400">{order.variantName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Game Credentials & Security (CONFIDENTIAL) */}
                <div className="p-3.5 bg-[#171a26] rounded-2xl border border-purple-900/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-purple-300 font-black text-xs">
                      <Gamepad2 size={15} className="text-purple-400" />
                      Data Akun Game Pembeli (Rahasia Joki)
                    </div>
                    <span className="text-[10px] font-bold text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded-full border border-purple-800/60">
                      Terenkripsi
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {/* Game ID / Username */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-[#11141d] border border-purple-900/40">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">ID / Username Akun:</span>
                        <span className="font-mono font-bold text-slate-200 text-xs select-all">
                          {order.inGameId || '-'}
                        </span>
                      </div>
                      {order.inGameId && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(order.inGameId!, `id-${order.id}`, 'ID Game')}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                          title="Salin ID Game"
                        >
                          {copiedKey === `id-${order.id}` ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        </button>
                      )}
                    </div>

                    {/* Game Password */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-[#11141d] border border-purple-900/40">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Password Game:</span>
                        <span className="font-mono font-bold text-slate-200 text-xs select-all">
                          {order.gamePassword ? (isPasswordRevealed ? order.gamePassword : '••••••••••••') : '(Tanpa Password / Direct ID)'}
                        </span>
                      </div>
                      {order.gamePassword && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => togglePassword(order.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                            title={isPasswordRevealed ? 'Sembunyikan Password' : 'Lihat Password'}
                          >
                            {isPasswordRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(order.gamePassword!, `pwd-${order.id}`, 'Password Game')}
                            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                            title="Salin Password Game"
                          >
                            {copiedKey === `pwd-${order.id}` ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2FA Status Row */}
                  <div className="flex items-center justify-between pt-1 text-xs border-t border-purple-900/40">
                    <span className="text-slate-400 font-medium">Status Keamanan 2FA Akun:</span>
                    {order.has2FA ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-purple-950/80 text-purple-300 border border-purple-800/60">
                        {order.twoFAType === 'whatsapp' ? (
                          <>
                            <MessageSquare size={12} className="text-emerald-400" />
                            Ada 2FA (Khusus via WhatsApp)
                          </>
                        ) : order.twoFAType === 'email' ? (
                          <>
                            <Mail size={12} className="text-sky-600" />
                            Ada 2FA (Verifikasi Email)
                          </>
                        ) : (
                          <>
                            <Smartphone size={12} className="text-purple-600" />
                            Ada 2FA (Verifikasi Perangkat)
                          </>
                        )}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                        <ShieldCheck size={12} className="text-emerald-400" />
                        Tanpa 2FA (Bisa langsung login)
                      </span>
                    )}
                  </div>
                </div>

                {/* Bukti Pembayaran yang Dikirim Pelanggan */}
                <div className="p-3.5 bg-[#1c2130] rounded-2xl border border-amber-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Receipt size={13} className="text-amber-400" />
                      Bukti Pembayaran dari Pelanggan
                    </span>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-700/60">
                      {order.paymentConfirmationType === 'proof_photo' ? 'Foto Struk Transfer' : 'Kode Unik Referensi'}
                    </span>
                  </div>

                  {order.paymentConfirmationType === 'proof_photo' && order.paymentProofImage ? (
                    <div className="flex items-center gap-3 p-2 bg-[#151923] rounded-xl border border-slate-800 shadow-xs">
                      {/* Thumbnail */}
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewImage({
                            src: order.paymentProofImage!,
                            title: `Bukti Pembayaran Pesanan #${order.id} - ${order.customer}`,
                          })
                        }
                        className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-800 shrink-0 group cursor-pointer"
                      >
                        <img
                          src={order.paymentProofImage}
                          alt="Bukti Transfer"
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                          <ExternalLink size={15} />
                        </div>
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-slate-100">Foto Struk Transfer Siap Diperiksa</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Klik gambar untuk membuka struk dalam ukuran penuh dan mencocokkan mutasi rekening Anda.
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewImage({
                              src: order.paymentProofImage!,
                              title: `Bukti Pembayaran Pesanan #${order.id} - ${order.customer}`,
                            })
                          }
                          className="mt-1.5 text-xs font-extrabold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink size={13} /> Buka Gambar Penuh
                        </button>
                      </div>
                    </div>
                  ) : order.paymentUniqueCode ? (
                    <div className="flex items-center justify-between p-3 bg-[#151923] rounded-xl border border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Kode Unik / Referensi Pengirim:</span>
                        <span className="font-mono font-black text-rose-400 text-base">{order.paymentUniqueCode}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(order.paymentUniqueCode!, `code-${order.id}`, 'Kode Unik')}
                        className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                        title="Salin Kode Unik"
                      >
                        {copiedKey === `code-${order.id}` ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                      </button>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-[#151923] rounded-xl border border-slate-800 text-xs text-slate-300">
                      Metode: {order.payment}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      onApprovePayment(order.id);
                      showToast(`✓ Pembayaran #${order.id} disetujui! Pesanan berpindah ke halaman Kelola Pesanan.`);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-black transition cursor-pointer shadow-md shadow-red-950/60 flex items-center gap-2 active:scale-95"
                  >
                    <CheckCircle2 size={16} />
                    <span>✓ Setujui Pembayaran &amp; Masukkan ke Antrean Order</span>
                  </button>

                  {(onRejectProof || onCancel) && (
                    <button
                      onClick={() => {
                        setRejectingOrder(order);
                        setSelectedReason('Bukti transfer tidak sah / tidak ditemukan dalam mutasi rekening');
                        setCustomReason('');
                      }}
                      className="px-3.5 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 text-xs font-bold transition cursor-pointer border border-rose-800/60 flex items-center gap-1.5"
                    >
                      <AlertTriangle size={13} />
                      <span>Tolak Bukti (Tidak Sah)</span>
                    </button>
                  )}

                  {/* Emergency WhatsApp Button (ADMIN ONLY) */}
                  <a
                    href={`https://wa.me/${order.phone.replace(/[^0-9]/g, '')}?text=Halo%20${encodeURIComponent(
                      order.customer
                    )},%20kami%20dari%20admin%20Rokai%20Store%20mengenai%20verifikasi%20pembayaran%20pesanan%20%23${order.id}%20(${encodeURIComponent(
                      order.product
                    )}).%20${
                      order.has2FA && order.twoFAType === 'whatsapp'
                        ? 'Mohon%20siapkan%20kode%20verifikasi%202FA%20yang%20akan%20kami%20kirimkan%20segera.'
                        : 'Mohon%20konfirmasi%20terkait%20bukti%20transfer%20Anda.'
                    }`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2.5 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/50 text-emerald-300 text-xs font-bold transition cursor-pointer border border-emerald-800/60 flex items-center gap-1.5 ml-auto"
                    title="Kontak darurat khusus admin untuk koordinasi kode atau kendala mutasi"
                  >
                    <MessageSquare size={13} /> Chat WA Darurat
                  </a>

                  <button
                    onClick={() => {
                      onDelete(order.id);
                      showToast(`Pesanan ${order.id} dihapus`);
                    }}
                    className="px-3 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/40 text-red-400 text-xs font-bold transition cursor-pointer border border-red-900/60"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Lightbox Modal for Payment Proof Photo */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-2xl w-full bg-[#151923] rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#151923] shrink-0">
              <div className="min-w-0 pr-4">
                <h4 className="text-sm font-bold text-white truncate">{previewImage.title}</h4>
                <p className="text-[11px] text-slate-400">Bukti struk transfer asli yang diunggah oleh pelanggan</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Image Viewer */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/70">
              <img
                src={previewImage.src}
                alt="Bukti Transfer Penuh"
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
              />
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-800 bg-[#151923] flex items-center justify-between text-xs text-slate-400 shrink-0">
              <span>Periksa kesesuaian nominal &amp; nomor rekening tujuan</span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Payment Proof Modal */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-lg w-full bg-[#151923] rounded-3xl overflow-hidden shadow-2xl border border-slate-800 p-5 sm:p-6 space-y-4 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-rose-400 font-black text-sm">
                <AlertTriangle size={18} />
                <span>Tolak Bukti Pembayaran #{rejectingOrder.id}</span>
              </div>
              <button
                type="button"
                onClick={() => setRejectingOrder(null)}
                className="w-7 h-7 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Order summary info */}
            <div className="p-3 bg-[#1c2130] rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Pelanggan:</span>
                <span className="font-bold text-slate-200">{rejectingOrder.customer} ({rejectingOrder.inGameId})</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Layanan:</span>
                <span className="font-bold text-rose-400">{rejectingOrder.product}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tagihan:</span>
                <span className="font-black text-rose-400">Rp {rejectingOrder.amount.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Pesanan ini akan <strong>dibatalkan &amp; otomatis dihapus</strong> dari daftar konfirmasi antrean admin, dan dikembalikan ke status <strong className="text-rose-400 font-bold">&quot;Belum Dibayar&quot;</strong>. Pelanggan akan menerima notifikasi peringatan resmi dan petunjuk bayar ulang.
            </p>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Pilih Alasan Penolakan:
              </label>
              <div className="flex flex-col gap-1.5">
                {[
                  'Bukti transfer tidak sah / tidak ditemukan dalam mutasi rekening',
                  'Nominal transfer tidak sesuai dengan total tagihan pesanan',
                  'Foto bukti struk transfer buram, palsu, atau hasil editan',
                  'Kode unik transaksi tidak valid atau kedaluwarsa',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setSelectedReason(preset);
                      setCustomReason('');
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition border cursor-pointer ${
                      selectedReason === preset && !customReason
                        ? 'bg-rose-950/80 border-rose-600 text-rose-200 font-bold ring-1 ring-rose-500/30'
                        : 'bg-[#1c2130] border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    • {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Atau Tuliskan Alasan Kustom:
              </label>
              <textarea
                rows={2}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Alasan khusus penolakan pembayaran..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0e1118] text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none font-medium placeholder-slate-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setRejectingOrder(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const finalReason = customReason.trim() || selectedReason.trim();
                  if (onRejectProof) {
                    onRejectProof(rejectingOrder.id, finalReason);
                  } else if (onCancel) {
                    onCancel(rejectingOrder.id);
                  }
                  showToast(`✓ Bukti pesanan #${rejectingOrder.id} ditolak. Pesanan dikembalikan ke Belum Dibayar.`);
                  setRejectingOrder(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs transition shadow-md shadow-red-950/60 cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <AlertTriangle size={14} />
                <span>Tolak Pembayaran &amp; Kembalikan ke Belum Dibayar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
