'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  subscribeToNotifications,
  addNotificationToFirestore,
} from '@/lib/firebaseSync';
import { LS_KEYS, getLocalItem, setLocalItem, getLocalString } from '@/lib/localStorage';
import { playNotificationSound } from '@/lib/notifications';
import type { AppNotification } from '@/lib/types';

export function useNotifications() {
  const [rawNotifications, setRawNotifications] = useState<AppNotification[]>([]);
  const [readNotifIds, setReadNotifIds] = useState<string[]>([]);
  const [dismissedNotifIds, setDismissedNotifIds] = useState<string[]>([]);
  const [userOrderIds, setUserOrderIds] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setReadNotifIds(getLocalItem<string[]>('fablemart_read_notifs', []));
    setDismissedNotifIds(getLocalItem<string[]>('fablemart_dismissed_notifs', []));
    setUserOrderIds(getLocalItem<string[]>(LS_KEYS.USER_ORDERS, []));
    setIsAdmin(getLocalString(LS_KEYS.USER_ROLE, 'customer') === 'admin');

    // Real-time listener for Firestore notifications
    const unsub = subscribeToNotifications((notifs) => {
      setRawNotifications(notifs);
    });

    return () => unsub();
  }, []);

  // Filter and map notifications for this specific client
  const notifications = useMemo(() => {
    return rawNotifications
      .filter((n) => !dismissedNotifIds.includes(n.id))
      .filter((n) => {
        // Admin sees all notifications
        if (isAdmin) return true;
        // Non-orders (promos, system) are visible to all visitors
        if (n.type !== 'order') return true;
        // Order notifications only visible if the order belongs to this user
        return Boolean(n.orderId && userOrderIds.includes(n.orderId));
      })
      .map((n) => ({
        ...n,
        read: n.read || readNotifIds.includes(n.id),
      }));
  }, [rawNotifications, dismissedNotifIds, readNotifIds, userOrderIds, isAdmin]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setReadNotifIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      setLocalItem('fablemart_read_notifs', updated);
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    const allIds = notifications.map((n) => n.id);
    setReadNotifIds((prev) => {
      const updated = Array.from(new Set([...prev, ...allIds]));
      setLocalItem('fablemart_read_notifs', updated);
      return updated;
    });
  }, [notifications]);

  const deleteNotification = useCallback((id: string) => {
    setDismissedNotifIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      setLocalItem('fablemart_dismissed_notifs', updated);
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    const allIds = notifications.map((n) => n.id);
    setDismissedNotifIds((prev) => {
      const updated = Array.from(new Set([...prev, ...allIds]));
      setLocalItem('fablemart_dismissed_notifs', updated);
      return updated;
    });
  }, [notifications]);

  const addNotification = useCallback(
    async (
      item: Omit<AppNotification, 'id' | 'timestamp' | 'read' | 'time'> & {
        id?: string;
        timestamp?: number;
        read?: boolean;
        time?: string;
      }
    ) => {
      const created = await addNotificationToFirestore(item);
      playNotificationSound();
      return created;
    },
    []
  );

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    addNotification,
  };
}
