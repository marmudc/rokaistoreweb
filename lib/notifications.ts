// ==========================================
// FABLEMART — Notifications Helper
// ==========================================

import {
  addNotificationToFirestore,
  markNotificationReadInFirestore,
  markAllNotificationsReadInFirestore,
  deleteNotificationFromFirestore,
  clearAllNotificationsFromFirestore,
} from './firebaseSync';
import type { AppNotification } from './types';

export const defaultNotifications: AppNotification[] = [];

export function playNotificationSound(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Pleasant chime tone 1 (587.33 Hz - D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Pleasant chime tone 2 (880 Hz - A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.1);
    gain2.gain.setValueAtTime(0.1, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.5);
  } catch {
    // Autoplay restrictions or audio unsupported
  }
}

export async function addNotification(
  item: Omit<AppNotification, 'id' | 'timestamp' | 'read' | 'time'> & {
    id?: string;
    timestamp?: number;
    read?: boolean;
    time?: string;
  }
): Promise<AppNotification> {
  const notif = await addNotificationToFirestore(item);
  playNotificationSound();
  return notif;
}

export async function markNotificationRead(id: string): Promise<void> {
  await markNotificationReadInFirestore(id);
}

export async function markAllNotificationsRead(): Promise<void> {
  await markAllNotificationsReadInFirestore();
}

export async function deleteNotificationById(id: string): Promise<void> {
  await deleteNotificationFromFirestore(id);
}

export async function clearAllNotifications(): Promise<void> {
  await clearAllNotificationsFromFirestore();
}
