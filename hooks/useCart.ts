'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { LS_KEYS, getLocalItem, setLocalItem, subscribeToStorage } from '@/lib/localStorage';
import type { CartItem, PromoCode } from '@/lib/types';

export function useCart(adminPromos: PromoCode[] = []) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeDiscountPercent, setActiveDiscountPercent] = useState(0);
  const [appliedPromoCode, setAppliedPromoCode] = useState('');

  // Hydration-safe initial load and storage listener
  useEffect(() => {
    setCart(getLocalItem<CartItem[]>(LS_KEYS.CART, []));

    return subscribeToStorage(LS_KEYS.CART, () => {
      setCart(getLocalItem<CartItem[]>(LS_KEYS.CART, []));
    });
  }, []);

  const saveCart = useCallback((newCart: CartItem[]) => {
    setLocalItem(LS_KEYS.CART, newCart);
    setCart(newCart);
  }, []);

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      let next: CartItem[];
      if (existing) {
        next = prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      } else {
        next = [...prev, { ...item, quantity: 1 }];
      }
      setLocalItem(LS_KEYS.CART, next);
      return next;
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart(prev => {
      const next = prev.filter(i => i.id !== id);
      setLocalItem(LS_KEYS.CART, next);
      return next;
    });
  }, []);

  const updateQuantity = useCallback((id: string, change: number) => {
    setCart(prev => {
      const item = prev.find(i => i.id === id);
      if (!item) return prev;
      if (item.quantity + change <= 0) {
        const next = prev.filter(i => i.id !== id);
        setLocalItem(LS_KEYS.CART, next);
        return next;
      }
      const next = prev.map(i => i.id === id ? { ...i, quantity: i.quantity + change } : i);
      setLocalItem(LS_KEYS.CART, next);
      return next;
    });
  }, []);

  const totalCount = useMemo(() => cart.reduce((sum, i) => sum + i.quantity, 0), [cart]);
  const subtotal = useMemo(() => cart.reduce((sum, i) => sum + (i.price * i.quantity), 0), [cart]);

  const applyPromo = useCallback((code: string): { success: boolean; message: string } => {
    const upper = code.trim().toUpperCase();
    if (!upper) return { success: false, message: 'Silakan masukkan kode voucher' };

    const found = adminPromos.find(p =>
      p.code.toUpperCase() === upper &&
      (p.status === 'Aktif' || p.active === true)
    );

    if (!found) {
      return { success: false, message: 'Kode voucher tidak valid atau telah berakhir' };
    }

    if (found.minSpend && subtotal < found.minSpend) {
      return {
        success: false,
        message: `Minimal belanja untuk voucher ${found.code} adalah Rp ${found.minSpend.toLocaleString('id-ID')}`
      };
    }

    setActiveDiscountPercent(found.discount);
    setAppliedPromoCode(found.code);
    return { success: true, message: `🎉 Voucher ${found.code} berhasil! Diskon ${found.discount}% diterapkan.` };
  }, [adminPromos, subtotal]);

  // Ensure applied promo is still valid if subtotal drops below minSpend
  const appliedPromo = adminPromos.find(p => p.code.toUpperCase() === appliedPromoCode.toUpperCase() && (p.status === 'Aktif' || p.active === true));
  const isPromoValid = appliedPromo && (!appliedPromo.minSpend || subtotal >= appliedPromo.minSpend);
  const effectiveDiscountPercent = isPromoValid ? activeDiscountPercent : 0;
  const discountAmount = Math.round(subtotal * (effectiveDiscountPercent / 100));
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const clearCart = useCallback(() => {
    setLocalItem(LS_KEYS.CART, []);
    setCart([]);
    setActiveDiscountPercent(0);
    setAppliedPromoCode('');
  }, []);

  return {
    cart,
    totalCount,
    subtotal,
    discountAmount,
    finalTotal,
    activeDiscountPercent: effectiveDiscountPercent,
    appliedPromoCode: isPromoValid ? appliedPromoCode : '',
    addToCart,
    removeFromCart,
    updateQuantity,
    applyPromo,
    clearCart,
    saveCart,
  };
}
