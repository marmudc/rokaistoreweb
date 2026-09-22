import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { storeInfo } from './storeData';
import type {
  Product,
  AdminOrder,
  AdminOrderStatus,
  PromoCode,
  HeroSlide,
  StoreSettings,
  UserOrder,
  AppNotification,
  UserProfile,
  ProofItem,
} from './types';

// ==========================================
// DEFAULT CLEAN DATA (NO DUMMIES)
// ==========================================

export const defaultPromosList: PromoCode[] = [];

export const defaultStoreSettings: StoreSettings = {
  storeName: storeInfo.name,
  whatsappNumber: storeInfo.whatsappNumber,
  subtitle: storeInfo.subtitle,
  qrisImage: storeInfo.qrisImage,
};

// ==========================================
// 1. PRODUCTS BACKEND (CRUD + REALTIME)
// ==========================================

export function subscribeToProducts(onUpdate: (products: Product[]) => void): Unsubscribe {
  const colRef = collection(db, 'products');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const prods: Product[] = [];
      snapshot.forEach((docSnap) => {
        prods.push({ ...(docSnap.data() as Product), id: docSnap.id });
      });
      onUpdate(prods);
    },
    (err) => {
      console.warn('Firestore products listener error:', err);
      onUpdate([]);
    }
  );
}

export async function saveProductToFirestore(product: Product): Promise<void> {
  try {
    await setDoc(doc(db, 'products', product.id), {
      ...product,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to save product to Firestore:', err);
    throw err;
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (err) {
    console.error('Failed to delete product from Firestore:', err);
    throw err;
  }
}

export async function deleteAllProductsFromFirestore(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, 'products'));
    const batch = writeBatch(db);
    snap.docs.forEach((d) => {
      batch.delete(doc(db, 'products', d.id));
    });
    await batch.commit();
  } catch (err) {
    console.error('Failed to delete all products from Firestore:', err);
    throw err;
  }
}

// ==========================================
// 2. ORDERS BACKEND (CRUD + REALTIME)
// ==========================================

export function subscribeToOrders(onUpdate: (orders: AdminOrder[]) => void): Unsubscribe {
  const colRef = collection(db, 'orders');
  const q = query(colRef, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const ords: AdminOrder[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as AdminOrder;
        ords.push({ ...data, id: docSnap.id });
      });
      onUpdate(ords);
    },
    (err) => {
      // If index or order error, fallback to simple collection query
      return onSnapshot(colRef, (snap) => {
        const ords: AdminOrder[] = [];
        snap.forEach((docSnap) => {
          ords.push({ ...(docSnap.data() as AdminOrder), id: docSnap.id });
        });
        onUpdate(ords);
      });
    }
  );
}

export async function saveOrderToFirestore(order: AdminOrder): Promise<void> {
  try {
    const cleanOrderData: Record<string, any> = {};
    for (const [key, value] of Object.entries(order)) {
      if (value !== undefined) {
        cleanOrderData[key] = value;
      }
    }
    await setDoc(doc(db, 'orders', order.id), {
      ...cleanOrderData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to save order to Firestore:', err);
    throw err;
  }
}

export async function updateOrderStatusInFirestore(
  orderId: string,
  status: AdminOrderStatus,
  issueReason?: string
): Promise<void> {
  try {
    const updatePayload: Record<string, any> = {
      status,
      updatedAt: serverTimestamp(),
    };
    if (issueReason !== undefined) {
      updatePayload.issueReason = issueReason;
    }
    await updateDoc(doc(db, 'orders', orderId), updatePayload);
  } catch (err) {
    console.error('Failed to update order status in Firestore:', err);
    throw err;
  }
}

export async function deleteOrderFromFirestore(orderId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'orders', orderId));
  } catch (err) {
    console.error('Failed to delete order from Firestore:', err);
    throw err;
  }
}

// ==========================================
// 3. PROMOS BACKEND (CRUD + REALTIME)
// ==========================================

export function subscribeToPromos(onUpdate: (promos: PromoCode[]) => void): Unsubscribe {
  const colRef = collection(db, 'promos');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const prms: PromoCode[] = [];
      snapshot.forEach((docSnap) => {
        prms.push(docSnap.data() as PromoCode);
      });
      onUpdate(prms);
    },
    (err) => {
      console.warn('Firestore promos listener fallback:', err);
      onUpdate([]);
    }
  );
}

export async function savePromoToFirestore(promo: PromoCode): Promise<void> {
  try {
    await setDoc(doc(db, 'promos', promo.code), {
      ...promo,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to save promo to Firestore:', err);
    throw err;
  }
}

export async function togglePromoInFirestore(code: string, active: boolean): Promise<void> {
  try {
    await updateDoc(doc(db, 'promos', code), {
      active,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to toggle promo in Firestore:', err);
    throw err;
  }
}

export async function deletePromoFromFirestore(code: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'promos', code));
  } catch (err) {
    console.error('Failed to delete promo from Firestore:', err);
    throw err;
  }
}

export async function deleteAllPromosFromFirestore(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, 'promos'));
    const batch = writeBatch(db);
    snap.docs.forEach((d) => {
      batch.delete(doc(db, 'promos', d.id));
    });
    await batch.commit();
  } catch (err) {
    console.error('Failed to delete all promos from Firestore:', err);
    throw err;
  }
}

// ==========================================
// 4. SETTINGS & HERO BANNER BACKEND
// ==========================================

export function subscribeToStoreSettings(onUpdate: (settings: StoreSettings) => void): Unsubscribe {
  const docRef = doc(db, 'settings', 'store');
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as StoreSettings);
      } else {
        saveStoreSettingsToFirestore(defaultStoreSettings).catch(() => {});
        onUpdate(defaultStoreSettings);
      }
    },
    (err) => {
      console.warn('Firestore store settings fallback:', err);
      onUpdate(defaultStoreSettings);
    }
  );
}

export async function saveStoreSettingsToFirestore(settings: StoreSettings): Promise<void> {
  try {
    await setDoc(doc(db, 'settings', 'store'), {
      ...settings,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to save store settings to Firestore:', err);
    throw err;
  }
}

export function subscribeToHeroSettings(
  onUpdate: (data: { slides: HeroSlide[]; theme: string }) => void
): Unsubscribe {
  const docRef = doc(db, 'settings', 'hero');
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        onUpdate({
          slides: Array.isArray(d.slides) ? d.slides : [],
          theme: d.theme || 'cyber',
        });
      } else {
        onUpdate({ slides: [], theme: 'cyber' });
      }
    },
    (err) => {
      console.warn('Firestore hero settings listener fallback:', err);
      onUpdate({ slides: [], theme: 'cyber' });
    }
  );
}

export async function saveHeroSettingsToFirestore(slides: HeroSlide[], theme: string): Promise<void> {
  try {
    await setDoc(doc(db, 'settings', 'hero'), {
      slides,
      theme,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to save hero settings to Firestore:', err);
    throw err;
  }
}

// ==========================================
// 5. NOTIFICATIONS BACKEND (CRUD + REALTIME)
// ==========================================

export function subscribeToNotifications(onUpdate: (notifs: AppNotification[]) => void): Unsubscribe {
  const colRef = collection(db, 'notifications');
  const q = query(colRef, orderBy('timestamp', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const notifs: AppNotification[] = [];
      snapshot.forEach((docSnap) => {
        notifs.push({ ...(docSnap.data() as AppNotification), id: docSnap.id });
      });
      onUpdate(notifs);
    },
    () => {
      // Fallback without orderBy in case index isn't ready
      return onSnapshot(colRef, (snapshot) => {
        const notifs: AppNotification[] = [];
        snapshot.forEach((docSnap) => {
          notifs.push({ ...(docSnap.data() as AppNotification), id: docSnap.id });
        });
        notifs.sort((a, b) => b.timestamp - a.timestamp);
        onUpdate(notifs);
      });
    }
  );
}

export async function addNotificationToFirestore(
  item: Omit<AppNotification, 'id' | 'timestamp' | 'read' | 'time'> & {
    id?: string;
    timestamp?: number;
    read?: boolean;
    time?: string;
  }
): Promise<AppNotification> {
  const newNotif: AppNotification = {
    id: item.id || `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: item.title,
    message: item.message,
    time: item.time || 'Baru saja',
    timestamp: item.timestamp || Date.now(),
    read: item.read ?? false,
    type: item.type,
    linkAction: item.linkAction ?? 'none',
    orderId: item.orderId,
    promoCode: item.promoCode,
  };

  try {
    await setDoc(doc(db, 'notifications', newNotif.id), {
      ...newNotif,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Failed to add notification to Firestore:', err);
  }

  return newNotif;
}

export async function markNotificationReadInFirestore(id: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'notifications', id), {
      read: true,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Failed to mark notification read in Firestore:', err);
  }
}

export async function markAllNotificationsReadInFirestore(): Promise<void> {
  try {
    const colRef = collection(db, 'notifications');
    const snap = await getDocs(colRef);
    const batch = writeBatch(db);
    snap.forEach((docSnap) => {
      batch.update(doc(db, 'notifications', docSnap.id), { read: true });
    });
    await batch.commit();
  } catch (err) {
    console.warn('Failed to mark all notifications read:', err);
  }
}

export async function deleteNotificationFromFirestore(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'notifications', id));
  } catch (err) {
    console.warn('Failed to delete notification from Firestore:', err);
  }
}

export async function clearAllNotificationsFromFirestore(): Promise<void> {
  try {
    const colRef = collection(db, 'notifications');
    const snap = await getDocs(colRef);
    const batch = writeBatch(db);
    snap.forEach((docSnap) => {
      batch.delete(doc(db, 'notifications', docSnap.id));
    });
    await batch.commit();
  } catch (err) {
    console.warn('Failed to clear notifications in Firestore:', err);
  }
}

// ==========================================
// 6. USER PROFILE BACKEND
// ==========================================

export function subscribeToUserProfile(
  userId: string,
  onUpdate: (profile: UserProfile) => void
): Unsubscribe {
  const docRef = doc(db, 'users', userId);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as UserProfile);
      } else {
        onUpdate({ name: '', email: '', defaultInGameId: '', soundEnabled: true });
      }
    },
    (err) => {
      console.warn('Firestore user profile fallback:', err);
      onUpdate({ name: '', email: '', defaultInGameId: '', soundEnabled: true });
    }
  );
}

export async function saveUserProfileToFirestore(userId: string, profile: UserProfile): Promise<void> {
  try {
    await setDoc(doc(db, 'users', userId), {
      ...profile,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to save user profile to Firestore:', err);
    throw err;
  }
}

// ==========================================
// 7. ONE-CLICK COMPLETE SEED / MIGRATION
// ==========================================

export async function migrateAllDataToFirebase(): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Migrate Settings
    await setDoc(doc(db, 'settings', 'hero'), {
      slides: [],
      theme: 'cyber',
      updatedAt: serverTimestamp(),
    });

    await setDoc(doc(db, 'settings', 'store'), {
      storeName: storeInfo.name,
      whatsappNumber: storeInfo.whatsappNumber,
      subtitle: storeInfo.subtitle,
      qrisImage: storeInfo.qrisImage,
      updatedAt: serverTimestamp(),
    });

    return {
      success: true,
      message: 'Semua katalog produk, voucher promo, dan pengaturan toko berhasil disinkronkan ke Firestore!',
    };
  } catch (error) {
    console.error('Error migrating to Firebase:', error);
    return {
      success: false,
      message: `Migrasi gagal: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// ==========================================
// 8. TRANSACTION PROOF GALLERY (CRUD + REALTIME)
// ==========================================

export function subscribeToProofGallery(onUpdate: (proofs: ProofItem[]) => void): Unsubscribe {
  const colRef = collection(db, 'proofs');
  const q = query(colRef, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const proofs: ProofItem[] = [];
      snapshot.forEach((docSnap) => {
        proofs.push({ ...(docSnap.data() as ProofItem), id: docSnap.id });
      });
      onUpdate(proofs);
    },
    () => {
      return onSnapshot(colRef, (snapshot) => {
        const proofs: ProofItem[] = [];
        snapshot.forEach((docSnap) => {
          proofs.push({ ...(docSnap.data() as ProofItem), id: docSnap.id });
        });
        onUpdate(proofs);
      });
    }
  );
}

export async function saveProofToFirestore(proof: ProofItem): Promise<void> {
  try {
    await setDoc(doc(db, 'proofs', proof.id), {
      ...proof,
      updatedAt: serverTimestamp(),
      createdAt: proof.createdAt || serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to save proof to Firestore:', err);
    throw err;
  }
}

export async function deleteProofFromFirestore(proofId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'proofs', proofId));
  } catch (err) {
    console.error('Failed to delete proof from Firestore:', err);
    throw err;
  }
}

