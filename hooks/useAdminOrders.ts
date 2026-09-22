'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  subscribeToOrders,
  subscribeToPromos,
  saveOrderToFirestore,
  updateOrderStatusInFirestore,
  deleteOrderFromFirestore,
  savePromoToFirestore,
  togglePromoInFirestore,
  deletePromoFromFirestore,
  deleteAllPromosFromFirestore,
  addNotificationToFirestore,
  defaultPromosList,
} from '@/lib/firebaseSync';
import type { AdminOrder, PromoCode } from '@/lib/types';

export const defaultAdminOrders: AdminOrder[] = [];
export const defaultAdminPromos: PromoCode[] = [];

export function useAdminOrders() {
  const [adminOrders, setAdminOrders] = useState<AdminOrder[]>([]);
  const [adminPromos, setAdminPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time listener for Firestore orders
    const unsubOrders = subscribeToOrders((orders) => {
      setAdminOrders(orders);
      setLoading(false);
    });

    // Real-time listener for Firestore promos
    const unsubPromos = subscribeToPromos((promos) => {
      setAdminPromos(promos);
    });

    return () => {
      unsubOrders();
      unsubPromos();
    };
  }, []);

  const saveOrders = useCallback(async (orders: AdminOrder[]) => {
    setAdminOrders(orders);
    for (const order of orders) {
      await saveOrderToFirestore(order);
    }
  }, []);

  const approvePayment = useCallback(async (orderId: string) => {
    // Optimistic UI update - moves to 'Antrian'
    setAdminOrders(prev =>
      prev.map(o => o.id === orderId ? { ...o, status: 'Antrian' as const, issueReason: undefined } : o)
    );

    // Update in Firestore
    await updateOrderStatusInFirestore(orderId, 'Antrian', '');

    // Add notification to Firestore
    await addNotificationToFirestore({
      title: `Pembayaran Pesanan #${orderId} Disetujui ✅`,
      message: `Admin telah memverifikasi pembayaran Anda. Pesanan sekarang telah resmi masuk ke antrean pengerjaan!`,
      type: 'order',
      linkAction: 'open_orders',
      orderId,
    });
  }, []);

  const startProcessing = useCallback(async (orderId: string) => {
    // Optimistic UI update - moves to 'Dalam Proses'
    setAdminOrders(prev =>
      prev.map(o => o.id === orderId ? { ...o, status: 'Dalam Proses' as const } : o)
    );

    // Update in Firestore
    await updateOrderStatusInFirestore(orderId, 'Dalam Proses');

    // Add notification to Firestore
    await addNotificationToFirestore({
      title: `Pesanan #${orderId} Mulai Dikerjakan ⚡`,
      message: `Admin / Joki FableMart telah aktif memulai pengerjaan akun game Anda. Pantau live status di web!`,
      type: 'order',
      linkAction: 'open_orders',
      orderId,
    });
  }, []);

  const reportIssue = useCallback(async (orderId: string, reason: string) => {
    const defaultReason = reason.trim() || 'Terdapat kendala data akun game / verifikasi 2FA.';
    // Optimistic UI update - moves to 'Kendala'
    setAdminOrders(prev =>
      prev.map(o => o.id === orderId ? { ...o, status: 'Kendala' as const, issueReason: defaultReason } : o)
    );

    // Update in Firestore
    await updateOrderStatusInFirestore(orderId, 'Kendala', defaultReason);

    // Add notification to Firestore
    await addNotificationToFirestore({
      title: `Kendala Pengerjaan Pesanan #${orderId} ⚠️`,
      message: `Admin melaporkan kendala: "${defaultReason}". Silakan buka menu Pesanan Saya dan tekan tombol WhatsApp Admin untuk menyelesaikan kendala.`,
      type: 'order',
      linkAction: 'open_orders',
      orderId,
    });
  }, []);

  const resolveIssue = useCallback(async (orderId: string, targetStatus: 'Antrian' | 'Dalam Proses' = 'Dalam Proses') => {
    // Optimistic UI update - returns to targetStatus
    setAdminOrders(prev =>
      prev.map(o => o.id === orderId ? { ...o, status: targetStatus, issueReason: undefined } : o)
    );

    // Update in Firestore
    await updateOrderStatusInFirestore(orderId, targetStatus, '');

    // Add notification to Firestore
    await addNotificationToFirestore({
      title: `Kendala Pesanan #${orderId} Terselesaikan ✅`,
      message: `Pengerjaan pesanan Anda dilanjutkan ke status ${targetStatus}. Terima kasih atas kerja samanya!`,
      type: 'order',
      linkAction: 'open_orders',
      orderId,
    });
  }, []);

  const markComplete = useCallback(async (orderId: string) => {
    // Optimistic UI update
    setAdminOrders(prev =>
      prev.map(o => o.id === orderId ? { ...o, status: 'Selesai' as const, issueReason: undefined } : o)
    );

    // Update in Firestore
    await updateOrderStatusInFirestore(orderId, 'Selesai', '');

    // Add notification to Firestore
    await addNotificationToFirestore({
      title: `Pesanan #${orderId} Selesai 🎉`,
      message: `Layanan Anda telah selesai dikerjakan oleh admin FableMart. Terima kasih atas kepercayaan Anda!`,
      type: 'order',
      linkAction: 'open_orders',
      orderId,
    });
  }, []);

  const cancelOrder = useCallback(async (orderId: string, cancelReason?: string) => {
    setAdminOrders(prev =>
      prev.map(o => o.id === orderId ? { ...o, status: 'Dibatalkan' as const, issueReason: cancelReason } : o)
    );

    await updateOrderStatusInFirestore(orderId, 'Dibatalkan', cancelReason);

    await addNotificationToFirestore({
      title: `Pesanan #${orderId} Dibatalkan`,
      message: cancelReason ? `Pesanan dibatalkan: ${cancelReason}` : `Pesanan #${orderId} telah dibatalkan oleh admin.`,
      type: 'order',
      linkAction: 'open_orders',
      orderId,
    });
  }, []);

  const deleteOrder = useCallback(async (orderId: string) => {
    setAdminOrders(prev => prev.filter(o => o.id !== orderId));
    await deleteOrderFromFirestore(orderId);
  }, []);

  const addOrder = useCallback(async (order: AdminOrder) => {
    setAdminOrders(prev => [order, ...prev]);
    await saveOrderToFirestore(order);
  }, []);

  const togglePromo = useCallback(async (code: string) => {
    const target = adminPromos.find(p => p.code === code);
    const willBeActive = target ? !target.active : false;

    setAdminPromos(prev =>
      prev.map(p => p.code === code ? { ...p, active: !p.active } : p)
    );

    await togglePromoInFirestore(code, willBeActive);

    if (willBeActive && target) {
      await addNotificationToFirestore({
        title: `Voucher ${code} Aktif Kembali!`,
        message: `Gunakan kode ${code} untuk mendapatkan diskon ${target.discount}% di keranjang belanja.`,
        type: 'promo',
        linkAction: 'view_promo',
        promoCode: code,
      });
    }
  }, [adminPromos]);

  const addPromo = useCallback(async (promo: PromoCode) => {
    setAdminPromos(prev => [promo, ...prev]);
    await savePromoToFirestore(promo);

    await addNotificationToFirestore({
      title: `Promo Baru: Diskon ${promo.discount}%!`,
      message: `Gunakan kode ${promo.code} untuk mendapatkan diskon ${promo.discount}%. Aktif sekarang!`,
      type: 'promo',
      linkAction: 'view_promo',
      promoCode: promo.code,
    });
  }, []);

  const deletePromo = useCallback(async (code: string) => {
    try {
      await deletePromoFromFirestore(code);
      setAdminPromos(prev => prev.filter(p => p.code !== code));
    } catch (err) {
      console.error('Failed to delete promo:', err);
      throw err;
    }
  }, []);

  const clearAllPromos = useCallback(async () => {
    try {
      await deleteAllPromosFromFirestore();
      setAdminPromos([]);
    } catch (err) {
      console.error('Failed to clear promos:', err);
      throw err;
    }
  }, []);

  const pendingConfirmationsCount = adminOrders.filter(
    o => o.status === 'Menunggu Konfirmasi' || o.status === 'Menunggu Verifikasi'
  ).length;

  const antrianOrdersCount = adminOrders.filter(
    o => o.status === 'Antrian'
  ).length;

  const inProgressOrdersCount = adminOrders.filter(
    o => o.status === 'Dalam Proses' || o.status === 'Diproses'
  ).length;

  const issueOrdersCount = adminOrders.filter(
    o => o.status === 'Kendala'
  ).length;

  // Active orders = orders currently in Antrian, Dalam Proses, or Kendala
  const activeOrdersCount = antrianOrdersCount + inProgressOrdersCount + issueOrdersCount;

  return {
    adminOrders,
    adminPromos,
    activeOrdersCount,
    pendingConfirmationsCount,
    antrianOrdersCount,
    inProgressOrdersCount,
    issueOrdersCount,
    loading,
    approvePayment,
    startProcessing,
    reportIssue,
    resolveIssue,
    markComplete,
    cancelOrder,
    deleteOrder,
    addOrder,
    saveOrders,
    togglePromo,
    addPromo,
    deletePromo,
    clearAllPromos,
  };
}
