'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { subscribeToOrders } from '@/lib/firebaseSync';
import { LS_KEYS, getLocalItem, setLocalItem, subscribeToStorage } from '@/lib/localStorage';
import type { AdminOrder, UserOrder } from '@/lib/types';

export const defaultUserOrders: UserOrder[] = [];

export function mapAdminOrderToUserOrder(o: AdminOrder): UserOrder {
  const isUnpaid = o.status === 'Belum Dibayar';
  const isPending = o.status === 'Menunggu Konfirmasi' || o.status === 'Menunggu Verifikasi';
  const isQueued = o.status === 'Antrian';
  const isInProgress = o.status === 'Dalam Proses' || o.status === 'Diproses';
  const isIssue = o.status === 'Kendala';
  const isCompleted = o.status === 'Selesai';
  const isCancelled = o.status === 'Dibatalkan';

  let status: UserOrder['status'] = 'pending';
  let statusTitle = 'Menunggu Konfirmasi Pembayaran';
  let statusBadgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
  let statusPulseColor = 'bg-amber-500';
  let currentStep = 1;
  let estimatedTime = '~1-5 menit verifikasi';
  let customerNote = 'Bukti pembayaran telah berhasil dikirim ke admin. Mohon tunggu verifikasi admin sebelum pesanan masuk antrean pengerjaan.';

  if (isUnpaid) {
    status = 'unpaid';
    statusTitle = '⚠️ Belum Dibayar (Pembayaran Ditolak)';
    statusBadgeColor = 'bg-rose-50 text-rose-700 border-rose-300 font-extrabold shadow-xs';
    statusPulseColor = 'bg-rose-500';
    currentStep = 1;
    estimatedTime = 'Menunggu Pembayaran Ulang';
    customerNote = o.issueReason
      ? `Pembayaran ditolak admin: "${o.issueReason}". Silakan lakukan pembayaran ulang dengan bukti transfer yang sah.`
      : 'Pembayaran ditolak admin karena bukti transfer tidak sah atau mutasi tidak ditemukan. Silakan kirimkan bukti pembayaran yang sah.';
  } else if (isPending) {
    status = 'pending';
    statusTitle = 'Menunggu Konfirmasi Pembayaran';
    statusBadgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
    statusPulseColor = 'bg-amber-500';
    currentStep = 1;
    estimatedTime = '~1-5 menit verifikasi';
    customerNote = 'Bukti pembayaran telah berhasil dikirim ke admin. Mohon tunggu verifikasi admin sebelum pesanan masuk antrean pengerjaan.';
  } else if (isQueued) {
    status = 'queued';
    statusTitle = 'Dalam Antrean Pengerjaan';
    statusBadgeColor = 'bg-purple-50 text-purple-700 border-purple-200';
    statusPulseColor = 'bg-purple-500';
    currentStep = 2;
    estimatedTime = '~5-10 menit menunggu antrean';
    customerNote = 'Pembayaran disetujui! Akun game Anda kini berada dalam antrean pengerjaan joki / admin resmi Rokai Store.';
  } else if (isInProgress) {
    status = 'in_progress';
    statusTitle = 'Sedang Dalam Pengerjaan';
    statusBadgeColor = 'bg-sky-50 text-sky-700 border-sky-200';
    statusPulseColor = 'bg-sky-500';
    currentStep = 3;
    estimatedTime = '~10-30 menit pengerjaan';
    customerNote = 'Admin / Joki sedang aktif login dan memproses pesanan pada akun game Anda. Mohon jangan login ke game selama proses berlangsung.';
  } else if (isIssue) {
    status = 'issue';
    statusTitle = '⚠️ Ada Kendala Pengerjaan';
    statusBadgeColor = 'bg-rose-50 text-rose-700 border-rose-300 font-extrabold shadow-xs';
    statusPulseColor = 'bg-rose-500';
    currentStep = 3;
    estimatedTime = 'Menunggu Bantuan Pelanggan';
    customerNote = o.issueReason
      ? `Admin mendeteksi kendala: "${o.issueReason}". Silakan hubungi admin melalui tombol WhatsApp di bawah untuk menyelesaikan kendala ini.`
      : 'Admin mendeteksi kendala pada data akun game atau verifikasi 2FA Anda. Silakan hubungi admin melalui WhatsApp di bawah.';
  } else if (isCompleted) {
    status = 'completed';
    statusTitle = 'Pesanan Selesai & Diterima';
    statusBadgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    statusPulseColor = 'bg-emerald-500';
    currentStep = 4;
    estimatedTime = 'Selesai';
    customerNote = 'Pesanan telah selesai diserahterimakan dengan aman. Terima kasih telah mempercayakan layanan kepada Rokai Store!';
  } else if (isCancelled) {
    status = 'completed';
    statusTitle = 'Pesanan Dibatalkan';
    statusBadgeColor = 'bg-slate-100 text-slate-600 border-slate-200';
    statusPulseColor = 'bg-slate-400';
    currentStep = 1;
    estimatedTime = 'Dibatalkan';
    customerNote = o.issueReason
      ? `Pesanan dibatalkan dengan alasan: "${o.issueReason}".`
      : 'Pesanan ini telah dibatalkan oleh admin.';
  }

  return {
    id: o.id,
    date: o.date,
    product: o.product,
    variantName: o.variantName || 'Varian Terpilih',
    categoryLabel: o.category || 'LAYANAN',
    iconType: 'shield-check',
    amount: o.amount,
    formattedPrice: `Rp ${o.amount.toLocaleString('id-ID')}`,
    quantity: o.quantity || 1,
    status,
    statusTitle,
    statusBadgeColor,
    statusPulseColor,
    currentStep,
    estimatedTime,
    customerNote,
    securityNotice: 'Data kredensial akun Anda aman terenkripsi & transaksi bergaransi 100%.',
    inGameId: o.inGameId || o.phone || '',
    gamePassword: o.gamePassword,
    has2FA: o.has2FA,
    twoFAType: o.twoFAType,
    paymentConfirmationType: o.paymentConfirmationType,
    paymentUniqueCode: o.paymentUniqueCode,
    paymentProofImage: o.paymentProofImage,
    paymentRejected: o.paymentRejected ?? (o.status === 'Belum Dibayar'),
    issueReason: o.issueReason,
  };
}

export function useUserOrders() {
  const [allFirestoreOrders, setAllFirestoreOrders] = useState<AdminOrder[]>([]);
  const [userOrderIds, setUserOrderIds] = useState<string[]>([]);

  useEffect(() => {
    setUserOrderIds(getLocalItem<string[]>(LS_KEYS.USER_ORDERS, []));

    const unsubStorage = subscribeToStorage(LS_KEYS.USER_ORDERS, () => {
      setUserOrderIds(getLocalItem<string[]>(LS_KEYS.USER_ORDERS, []));
    });

    // Real-time sync from Firestore orders collection
    const unsubFirestore = subscribeToOrders((orders: AdminOrder[]) => {
      setAllFirestoreOrders(orders);
    });

    return () => {
      unsubStorage();
      unsubFirestore();
    };
  }, []);

  const userOrders = useMemo(() => {
    if (userOrderIds.length === 0) return [];
    return allFirestoreOrders
      .filter(o => userOrderIds.includes(o.id))
      .map(mapAdminOrderToUserOrder);
  }, [allFirestoreOrders, userOrderIds]);

  const addUserOrder = useCallback((order: UserOrder) => {
    const existing = getLocalItem<string[]>(LS_KEYS.USER_ORDERS, []);
    const updated = Array.from(new Set([order.id, ...existing]));
    setLocalItem(LS_KEYS.USER_ORDERS, updated);
    setUserOrderIds(updated);
  }, []);

  const addUserOrders = useCallback((orders: UserOrder[]) => {
    const newIds = orders.map(o => o.id);
    const existing = getLocalItem<string[]>(LS_KEYS.USER_ORDERS, []);
    const updated = Array.from(new Set([...newIds, ...existing]));
    setLocalItem(LS_KEYS.USER_ORDERS, updated);
    setUserOrderIds(updated);
  }, []);

  const trackOrder = useCallback((orderId: string): { success: boolean; message: string } => {
    const cleanId = orderId.trim().toUpperCase();
    if (!cleanId) return { success: false, message: 'Masukkan nomor pesanan (contoh: FM-12345)' };
    const found = allFirestoreOrders.find(o => o.id.toUpperCase() === cleanId);
    if (!found) {
      return { success: false, message: `Pesanan #${cleanId} tidak ditemukan di sistem.` };
    }
    const existing = getLocalItem<string[]>(LS_KEYS.USER_ORDERS, []);
    if (!existing.includes(found.id)) {
      const updated = [found.id, ...existing];
      setLocalItem(LS_KEYS.USER_ORDERS, updated);
      setUserOrderIds(updated);
    }
    return { success: true, message: `✓ Pesanan #${found.id} berhasil dilacak!` };
  }, [allFirestoreOrders]);

  const activeCount = userOrders.filter(o => o.status === 'in_progress' || o.status === 'pending').length;

  return { userOrders, activeCount, addUserOrder, addUserOrders, trackOrder };
}
