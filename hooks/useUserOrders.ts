'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { subscribeToOrders } from '@/lib/firebaseSync';
import { LS_KEYS, getLocalItem, setLocalItem, subscribeToStorage } from '@/lib/localStorage';
import type { AdminOrder, UserOrder } from '@/lib/types';

export const defaultUserOrders: UserOrder[] = [];

export function mapAdminOrderToUserOrder(o: AdminOrder): UserOrder {
  const isCompleted = o.status === 'Selesai';
  const isCancelled = o.status === 'Dibatalkan';
  const isPendingVerification = o.status === 'Menunggu Verifikasi';

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
    status: isCompleted ? 'completed' : isCancelled ? 'completed' : isPendingVerification ? 'pending' : 'in_progress',
    statusTitle: isCompleted
      ? 'Pesanan Selesai & Diterima'
      : isCancelled
      ? 'Pesanan Dibatalkan'
      : isPendingVerification
      ? 'Menunggu Verifikasi Pembayaran'
      : 'Masuk Antrean & Sedang Dikerjakan',
    statusBadgeColor: isCompleted
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : isCancelled
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : isPendingVerification
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-sky-50 text-sky-700 border-sky-200',
    statusPulseColor: isCompleted
      ? 'bg-emerald-500'
      : isCancelled
      ? 'bg-rose-500'
      : isPendingVerification
      ? 'bg-amber-500'
      : 'bg-sky-500',
    currentStep: isCompleted ? 4 : isCancelled ? 1 : isPendingVerification ? 2 : 3,
    estimatedTime: isCompleted
      ? 'Selesai'
      : isCancelled
      ? 'Dibatalkan'
      : isPendingVerification
      ? '~1-5 menit verifikasi'
      : '~5-15 menit pengerjaan',
    customerNote: isCompleted
      ? 'Pesanan telah selesai diserahterimakan.'
      : isCancelled
      ? 'Pesanan dibatalkan. Hubungi CS WhatsApp untuk bantuan garansi/refund.'
      : isPendingVerification
      ? 'Bukti pembayaran telah berhasil dikirim ke admin. Mohon tunggu verifikasi admin sebelum pesanan masuk ke antrean pengerjaan.'
      : 'Pembayaran telah disetujui admin! Akun game Anda kini berada dalam antrean pengerjaan joki / admin resmi.',
    securityNotice: 'Data kredensial akun Anda aman terenkripsi & transaksi bergaransi 100%.',
    inGameId: o.inGameId || o.phone || '',
    gamePassword: o.gamePassword,
    has2FA: o.has2FA,
    twoFAType: o.twoFAType,
    paymentConfirmationType: o.paymentConfirmationType,
    paymentUniqueCode: o.paymentUniqueCode,
    paymentProofImage: o.paymentProofImage,
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
