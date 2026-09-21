// ==========================================
// FABLEMART — localStorage Helper
// ==========================================

export const LS_KEYS = {
  CART: 'fablemart_cart',
  USER_ROLE: 'fablemart_user_role',
  ADMIN_ORDERS: 'fablemart_admin_orders',
  ADMIN_PROMOS: 'fablemart_admin_promos',
  STORE_SETTINGS: 'fablemart_store_settings',
  USER_ORDERS: 'fablemart_user_orders',
  HERO_SLIDES: 'fablemart_hero_slides',
  HERO_THEME: 'fablemart_hero_theme',
  CUSTOM_PRODUCTS: 'fablemart_custom_products',
  PRODUCTS_CATALOG: 'fablemart_products_catalog',
  NOTIFICATIONS: 'fablemart_notifications',
  USER_PROFILE: 'fablemart_user_profile',
} as const;

export function getLocalItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    if (item === null) return fallback;
    return JSON.parse(item) as T;
  } catch {
    return fallback;
  }
}

export function getLocalString(key: string, fallback = ''): string {
  if (typeof window === 'undefined') return fallback;
  return localStorage.getItem(key) ?? fallback;
}

export function setLocalItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent('fablemart_storage', { detail: { key, value } }));
}

export function setLocalString(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, value);
  window.dispatchEvent(new CustomEvent('fablemart_storage', { detail: { key, value } }));
}

export function subscribeToStorage(
  keys: string | readonly string[] | string[],
  callback: () => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const keyList = Array.isArray(keys) ? keys : [keys as string];

  const handleCustom = (e: Event) => {
    const ce = e as CustomEvent<{ key: string }>;
    if (!ce.detail?.key || keyList.includes(ce.detail.key)) {
      callback();
    }
  };

  const handleStorage = (e: StorageEvent) => {
    if (!e.key || keyList.includes(e.key)) {
      callback();
    }
  };

  window.addEventListener('fablemart_storage', handleCustom);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener('fablemart_storage', handleCustom);
    window.removeEventListener('storage', handleStorage);
  };
}

export function purgeDummyData(): void {
  if (typeof window === 'undefined') return;
  // Clear demo orders and notifications
  localStorage.removeItem(LS_KEYS.USER_ORDERS);
  localStorage.removeItem(LS_KEYS.ADMIN_ORDERS);
  localStorage.removeItem(LS_KEYS.NOTIFICATIONS);
  // Reset dummy user profile
  const profile = getLocalItem<{ name?: string } | null>(LS_KEYS.USER_PROFILE, null);
  if (profile && profile.name === 'Dimas Pratama') {
    localStorage.removeItem(LS_KEYS.USER_PROFILE);
  }
  window.dispatchEvent(new CustomEvent('fablemart_storage', { detail: { key: 'all' } }));
}

export function clearAllLocalData(): void {
  if (typeof window === 'undefined') return;
  Object.values(LS_KEYS).forEach(key => localStorage.removeItem(key));
  window.dispatchEvent(new CustomEvent('fablemart_storage', { detail: { key: 'all' } }));
}

// Automatically purge residual dummy data directly on client load
if (typeof window !== 'undefined') {
  try {
    const dummyUserOrders = ['FM-89210', 'FM-88942', 'FM-87301'];
    const uOrders = localStorage.getItem(LS_KEYS.USER_ORDERS);
    if (uOrders && dummyUserOrders.some(id => uOrders.includes(id))) {
      localStorage.removeItem(LS_KEYS.USER_ORDERS);
    }

    const dummyAdminOrders = ['FM-9921', 'FM-9844', 'FM-9712', 'FM-9650', 'FM-9520', 'FM-9410'];
    const aOrders = localStorage.getItem(LS_KEYS.ADMIN_ORDERS);
    if (aOrders && dummyAdminOrders.some(id => aOrders.includes(id))) {
      localStorage.removeItem(LS_KEYS.ADMIN_ORDERS);
    }

    const dummyNotifs = ['notif-1', 'notif-2', 'notif-3'];
    const notifs = localStorage.getItem(LS_KEYS.NOTIFICATIONS);
    if (notifs && dummyNotifs.some(id => notifs.includes(id))) {
      localStorage.removeItem(LS_KEYS.NOTIFICATIONS);
    }

    const prof = localStorage.getItem(LS_KEYS.USER_PROFILE);
    if (prof && prof.includes('Dimas Pratama')) {
      localStorage.removeItem(LS_KEYS.USER_PROFILE);
    }
  } catch {
    // Ignore storage restriction errors
  }
}
