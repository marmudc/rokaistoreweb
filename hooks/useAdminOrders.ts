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

  const markComplete = useCallback(async (orderId: string) => {
    // Optimistic UI update
    setAdminOrders(prev =>
      prev.map(o => o.id === orderId ? { ...o, status: 'Selesai' as const } : o)
    );

    // Update in Firestore
    await updateOrderStatusInFirestore(orderId, 'Selesai');

    // Add notification to Firestore
    await addNotificationToFirestore({
      title: `Pesanan #${orderId} Selesai 🎉`,
      message: `Layanan Anda telah selesai dikerjakan oleh admin FableMart. Terima kasih atas kepercayaan Anda!`,
      type: 'order',
      linkAction: 'open_orders',
      orderId,
    });
  }, []);

  const cancelOrder = useCallback(async (orderId: string) => {
    setAdminOrders(prev =>
      prev.map(o => o.id === orderId ? { ...o, status: 'Dibatalkan' as const } : o)
    );

    await updateOrderStatusInFirestore(orderId, 'Dibatalkan');

    await addNotificationToFirestore({
      title: `Pesanan #${orderId} Dibatalkan`,
      message: `Pesanan #${orderId} telah dibatalkan oleh admin. Hubungi CS WhatsApp kami untuk bantuan pengembalian dana.`,
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

  const activeOrdersCount = adminOrders.filter(o => o.status === 'Diproses').length;

  return {
    adminOrders,
    adminPromos,
    activeOrdersCount,
    loading,
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
