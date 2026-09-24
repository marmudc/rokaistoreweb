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
  AlertTriangle,
  Play,
  RotateCcw,
} from 'lucide-react';

type OrderFilter = 'all' | 'Antrian' | 'Dalam Proses' | 'Kendala' | 'Selesai' | 'Dibatalkan';

interface OrdersTabProps {
  adminOrders: AdminOrder[];
  loading?: boolean;
  onApprovePayment: (id: string) => void;
  onStartProcessing?: (id: string) => void;
  onReportIssue?: (id: string, reason: string) => void;
  onResolveIssue?: (id: string, targetStatus?: 'Antrian' | 'Dalam Proses') => void;
  onMarkComplete: (id: string) => void;
  onCancel?: (id: string, reason?: string) => void;
  onDelete: (id: string) => void;
  showToast: (msg: string) => void;
}

export default function OrdersTab({
  adminOrders,
  loading = false,
  onApprovePayment,
  onStartProcessing,
  onReportIssue,
  onResolveIssue,
  onMarkComplete,
  onCancel,
  onDelete,
  showToast,
}: OrdersTabProps) {
  const [filter, setFilter] = useState<OrderFilter>('all');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string } | null>(null);
  const [reportingIssueOrder, setReportingIssueOrder] = useState<AdminOrder | null>(null);
  const [issueInput, setIssueInput] = useState('');

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

  // Only display confirmed orders in this tab (orders not in pending confirmation and not unpaid)
  const confirmedOrders = adminOrders.filter(
    o => o.status !== 'Menunggu Konfirmasi' && o.status !== 'Menunggu Verifikasi' && o.status !== 'Belum Dibayar'
  );

  const filtered = filter === 'all'
    ? confirmedOrders
    : filter === 'Dalam Proses'
    ? confirmedOrders.filter(o => o.status === 'Dalam Proses' || o.status === 'Diproses')
    : confirmedOrders.filter(o => o.status === filter);

  const allCount = confirmedOrders.length;
  const antrianCount = confirmedOrders.filter(o => o.status === 'Antrian').length;
  const dalamProsesCount = confirmedOrders.filter(o => o.status === 'Dalam Proses' || o.status === 'Diproses').length;
  const kendalaCount = confirmedOrders.filter(o => o.status === 'Kendala').length;
  const selesaiCount = confirmedOrders.filter(o => o.status === 'Selesai').length;
  const dibatalkanCount = confirmedOrders.filter(o => o.status === 'Dibatalkan').length;

  const quickIssuePresets = [
    'Password akun game salah / tidak dapat login',
    'Kode verifikasi 2FA dibutuhkan / salah',
    'Akun sedang aktif dimainkan di perangkat lain',
    'Username / In-Game ID tidak ditemukan',
    'Pemberitahuan akun game terkena batas limit sesi',
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-slate-100">Kelola Pesanan (Antrean &amp; Pengerjaan)</h3>
          <p className="text-[11px] text-slate-400">
            {allCount} total pesanan • {antrianCount} antrean • {dalamProsesCount} sedang dikerjakan{kendalaCount > 0 ? ` • ${kendalaCount} kendala` : ''}
          </p>
        </div>
        {/* Filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {([
            { key: 'all', label: `Semua (${allCount})` },
            { key: 'Antrian', label: `Antrian (${antrianCount})` },
            { key: 'Dalam Proses', label: `Dalam Proses (${dalamProsesCount})` },
            { key: 'Kendala', label: `⚠️ Kendala (${kendalaCount})`, isWarning: kendalaCount > 0 },
            { key: 'Selesai', label: `Selesai (${selesaiCount})` },
            { key: 'Dibatalkan', label: `Dibatalkan (${dibatalkanCount})` },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                filter === tab.key
                  ? tab.key === 'Kendala'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-950/60'
                  : tab.key === 'Kendala' && kendalaCount > 0
                  ? 'bg-rose-950/80 text-rose-300 hover:bg-rose-900/80 border border-rose-700 animate-pulse font-extrabold'
                  : 'bg-[#1c2130] text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(n => (
              <div key={n} className="bg-[#151923] rounded-2xl border border-slate-800 p-4 sm:p-5 space-y-4 animate-pulse">
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-800" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-32 bg-slate-800 rounded" />
                      <div className="h-3 w-24 bg-slate-800/60 rounded" />
                    </div>
                  </div>
                  <div className="h-6 w-28 bg-slate-800 rounded-full" />
                </div>
                <div className="h-16 bg-[#1c2130] rounded-xl" />
                <div className="flex gap-2">
                  <div className="h-8 w-24 bg-slate-800 rounded-lg" />
                  <div className="h-8 w-24 bg-slate-800 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-[#151923] rounded-2xl border border-slate-800 shadow-sm">
            <p className="text-sm font-bold text-slate-300">Tidak ada pesanan terkonfirmasi di kategori ini</p>
            <p className="text-xs text-slate-400 mt-1">
              Pesanan yang menunggu verifikasi pembayaran berada di tab &quot;Konfirmasi Pesanan&quot;.
            </p>
          </div>
        ) : (
          filtered.map(order => {
            const isPasswordRevealed = !!revealedPasswords[order.id];

            return (
              <div
                key={order.id}
                className="bg-[#151923] rounded-2xl border border-slate-800 shadow-sm p-4 sm:p-5 hover:border-slate-700 transition space-y-4"
              >
                {/* Top row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-black shrink-0 border border-slate-700">
                      #
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-black text-rose-400">{order.id}</span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                            order.status === 'Selesai'
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                              : order.status === 'Dibatalkan'
                              ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                              : order.status === 'Kendala'
                              ? 'bg-rose-950/90 text-rose-300 border border-rose-700 font-extrabold shadow-xs'
                              : order.status === 'Dalam Proses' || order.status === 'Diproses'
                              ? 'bg-sky-950/80 text-sky-300 border border-sky-800/60 font-extrabold'
                              : 'bg-purple-950/80 text-purple-300 border border-purple-800/60 font-bold'
                          }`}
                        >
                          {order.status === 'Kendala' && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                          )}
                          {(order.status === 'Dalam Proses' || order.status === 'Diproses') && (
                            <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
                          )}
                          {order.status === 'Antrian'
                            ? '🕒 Antrian Pengerjaan'
                            : order.status === 'Dalam Proses' || order.status === 'Diproses'
                            ? '⚡ Dalam Proses (Sedang Dikerjakan)'
                            : order.status === 'Kendala'
                            ? '⚠️ Ada Kendala'
                            : order.status}
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
                    <p className="text-base font-black text-rose-400">Rp {order.amount.toLocaleString('id-ID')}</p>
                    <p className="text-[10px] text-slate-400">{order.payment}</p>
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
                      <span className="text-slate-400 font-medium">Nomor WhatsApp:</span>
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
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Produk &amp; Layanan</span>
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
                      Privasi Terjaga
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
                            <Mail size={12} className="text-sky-400" />
                            Ada 2FA (Verifikasi Email)
                          </>
                        ) : (
                          <>
                            <Smartphone size={12} className="text-purple-400" />
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

                {/* Kendala Alert Box (Admin view) */}
                {order.status === 'Kendala' && (
                  <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-rose-300 font-black">
                      <AlertTriangle size={15} className="text-rose-400 shrink-0" />
                      <span>Kendala Yang Sedang Dihadapi:</span>
                    </div>
                    <p className="text-rose-200 font-semibold pl-5 leading-relaxed">
                      &quot;{order.issueReason || 'Belum ada catatan kendala spesifik.'}&quot;
                    </p>
                    <p className="text-[10px] text-rose-400 pl-5">
                      *Tombol WhatsApp Admin saat ini aktif di akun pembeli agar pembeli dapat langsung menghubungi Anda.
                    </p>
                  </div>
                )}

                {/* Payment Confirmation (Code OR Proof Photo) */}
                <div className="p-3.5 bg-[#1c2130] rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Receipt size={13} className="text-rose-400" />
                      Verifikasi &amp; Bukti Pembayaran
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800/60">
                      {order.paymentConfirmationType === 'proof_photo' ? 'Foto Struk Transfer' : 'Kode Unik Referensi'}
                    </span>
                  </div>

                  {order.paymentConfirmationType === 'proof_photo' && order.paymentProofImage ? (
                    <div className="flex items-center gap-3 p-2 bg-[#151923] rounded-xl border border-slate-800">
                      {/* Thumbnail */}
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewImage({
                            src: order.paymentProofImage!,
                            title: `Bukti Pembayaran Pesanan #${order.id} - ${order.customer}`,
                          })
                        }
                        className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-800 shrink-0 group cursor-pointer"
                      >
                        <img
                          src={order.paymentProofImage}
                          alt="Bukti Transfer"
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                          <ExternalLink size={14} />
                        </div>
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-200">Foto Struk / Bukti Transfer Tersedia</p>
                        <p className="text-[10px] text-slate-400">Klik gambar untuk melihat struk ukuran penuh &amp; periksa nominal.</p>
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewImage({
                              src: order.paymentProofImage!,
                              title: `Bukti Pembayaran Pesanan #${order.id} - ${order.customer}`,
                            })
                          }
                          className="mt-1 text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink size={12} /> Buka Gambar Penuh
                        </button>
                      </div>
                    </div>
                  ) : order.paymentUniqueCode ? (
                    <div className="flex items-center justify-between p-2.5 bg-[#151923] rounded-xl border border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Kode Unik / Referensi Pengirim:</span>
                        <span className="font-mono font-black text-rose-400 text-sm">{order.paymentUniqueCode}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(order.paymentUniqueCode!, `code-${order.id}`, 'Kode Unik')}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                        title="Salin Kode Unik"
                      >
                        {copiedKey === `code-${order.id}` ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                  ) : (
                    <div className="p-2 bg-[#151923] rounded-xl border border-slate-800 text-[11px] text-slate-300">
                      Metode pembayaran: {order.payment}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                  {/* Status: Antrian */}
                  {order.status === 'Antrian' && (
                    <>
                      {onStartProcessing && (
                        <button
                          onClick={() => {
                            onStartProcessing(order.id);
                            showToast(`⚡ Pesanan #${order.id} mulai dikerjakan (Dalam Proses)`);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-black transition cursor-pointer shadow-sm flex items-center gap-1.5 active:scale-95"
                        >
                          <Play size={13} className="fill-white" />
                          <span>Mulai Kerjakan (Dalam Proses)</span>
                        </button>
                      )}
                      {onReportIssue && (
                        <button
                          onClick={() => {
                            setReportingIssueOrder(order);
                            setIssueInput('');
                          }}
                          className="px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 text-xs font-bold transition cursor-pointer border border-rose-800/60 flex items-center gap-1"
                        >
                          <AlertTriangle size={13} />
                          <span>Ada Kendala?</span>
                        </button>
                      )}
                    </>
                  )}

                  {/* Status: Dalam Proses / Diproses */}
                  {(order.status === 'Dalam Proses' || order.status === 'Diproses') && (
                    <>
                      <button
                        onClick={() => {
                          onMarkComplete(order.id);
                          showToast(`✓ Pesanan ${order.id} ditandai Selesai & sinkron ke pelanggan`);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer shadow-sm flex items-center gap-1.5 active:scale-95"
                      >
                        <CheckCircle2 size={15} />
                        <span>✓ Tandai Selesai</span>
                      </button>
                      {onReportIssue && (
                        <button
                          onClick={() => {
                            setReportingIssueOrder(order);
                            setIssueInput('');
                          }}
                          className="px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 text-xs font-bold transition cursor-pointer border border-rose-800/60 flex items-center gap-1"
                        >
                          <AlertTriangle size={13} />
                          <span>Laporkan Kendala</span>
                        </button>
                      )}
                    </>
                  )}

                  {/* Status: Kendala */}
                  {order.status === 'Kendala' && (
                    <>
                      {onResolveIssue && (
                        <>
                          <button
                            onClick={() => {
                              onResolveIssue(order.id, 'Dalam Proses');
                              showToast(`✓ Kendala #${order.id} terselesaikan! Status kembali ke 'Dalam Proses'`);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition cursor-pointer shadow-sm flex items-center gap-1.5 active:scale-95"
                          >
                            <CheckCircle2 size={14} />
                            <span>✓ Kendala Selesai &amp; Lanjut Kerjakan</span>
                          </button>
                          <button
                            onClick={() => {
                              onResolveIssue(order.id, 'Antrian');
                              showToast(`Kendala #${order.id} direset ke Antrian`);
                            }}
                            className="px-3 py-2 rounded-xl bg-[#1c2130] hover:bg-slate-800 text-rose-300 text-xs font-bold transition cursor-pointer border border-slate-800 flex items-center gap-1"
                          >
                            <RotateCcw size={13} />
                            <span>Kembalikan ke Antrian</span>
                          </button>
                        </>
                      )}
                    </>
                  )}

                  {/* Emergency WhatsApp Button (ADMIN ONLY) */}
                  <a
                    href={`https://wa.me/${order.phone.replace(/[^0-9]/g, '')}?text=Halo%20${encodeURIComponent(
                      order.customer
                    )},%20kami%20dari%20admin%20Rokai%20Store%20mengenai%20pesanan%20%23${order.id}%20(${encodeURIComponent(
                      order.product
                    )}).%20${
                      order.status === 'Kendala'
                        ? `Terdapat%20kendala:%20${encodeURIComponent(
                            order.issueReason || 'verifikasi%20akun%20game'
                          )}.%20Mohon%20bantuannya%20agar%20bisa%20kami%20lanjutkan.`
                        : order.has2FA && order.twoFAType === 'whatsapp'
                        ? 'Mohon%20siapkan%20kode%20verifikasi%202FA%20yang%20akan%20kami%20kirimkan%20segera.'
                        : 'Pesanan%20Anda%20sedang%20dalam%20antrean%20pengerjaan.'
                    }`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/50 text-emerald-300 text-xs font-bold transition cursor-pointer border border-emerald-800/60 flex items-center gap-1.5"
                    title="Kontak darurat khusus admin untuk koordinasi pengerjaan / kendala / 2FA"
                  >
                    <MessageSquare size={13} /> Chat WA Darurat
                  </a>

                  {onCancel && order.status !== 'Selesai' && order.status !== 'Dibatalkan' && (
                    <button
                      onClick={() => {
                        onCancel(order.id);
                        showToast(`Pesanan ${order.id} dibatalkan`);
                      }}
                      className="px-3 py-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/40 text-amber-300 text-xs font-bold transition cursor-pointer border border-amber-800/60"
                    >
                      Batalkan
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onDelete(order.id);
                      showToast(`Pesanan ${order.id} dihapus`);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/40 text-red-400 text-xs font-bold transition cursor-pointer border border-red-900/60 ml-auto"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reporting Issue Modal */}
      {reportingIssueOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-md w-full bg-[#151923] rounded-3xl overflow-hidden shadow-2xl border border-slate-800 p-5 sm:p-6 space-y-4 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-rose-400 font-black text-sm">
                <AlertTriangle size={18} />
                <span>Laporkan Kendala Pesanan #{reportingIssueOrder.id}</span>
              </div>
              <button
                type="button"
                onClick={() => setReportingIssueOrder(null)}
                className="w-7 h-7 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Saat pesanan ditandai sebagai <strong>Kendala</strong>, status di website pembeli akan berubah dan{' '}
              <strong>tombol WhatsApp Admin akan otomatis aktif di akun pembeli</strong> untuk koordinasi penyelesaian.
            </p>

            {/* Quick presets */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Pilih Template Cepat:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {quickIssuePresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setIssueInput(preset)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-[#1c2130] hover:bg-rose-950/80 hover:text-rose-300 text-slate-300 transition text-left cursor-pointer border border-slate-800"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom input */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Rincian Kendala:
              </label>
              <textarea
                rows={3}
                value={issueInput}
                onChange={(e) => setIssueInput(e.target.value)}
                placeholder="Tuliskan kendala akun / 2FA secara jelas untuk pembeli..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#0e1118] text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none font-medium placeholder-slate-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setReportingIssueOrder(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onReportIssue) {
                    onReportIssue(reportingIssueOrder.id, issueInput);
                    showToast(`⚠️ Pesanan #${reportingIssueOrder.id} ditandai Kendala & tombol WA pembeli aktif`);
                  }
                  setReportingIssueOrder(null);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs transition shadow-md shadow-red-950/60 cursor-pointer"
              >
                Tandai Kendala &amp; Aktifkan WA Pembeli
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}

