'use client';
import { useState, useEffect, useCallback } from 'react';
import { LS_KEYS, getLocalString, setLocalString, subscribeToStorage } from '@/lib/localStorage';

export type UserRole = 'admin' | 'customer';

export function useRole() {
  const [role, setRole] = useState<UserRole>('customer');

  useEffect(() => {
    const stored = getLocalString(LS_KEYS.USER_ROLE, 'customer') as UserRole;
    setRole(stored);

    return subscribeToStorage(LS_KEYS.USER_ROLE, () => {
      const updated = getLocalString(LS_KEYS.USER_ROLE, 'customer') as UserRole;
      setRole(updated);
    });
  }, []);

  const isAdmin = role === 'admin';

  const setAdmin = useCallback(() => {
    setLocalString(LS_KEYS.USER_ROLE, 'admin');
    setRole('admin');
  }, []);

  const logoutAdmin = useCallback(() => {
    setLocalString(LS_KEYS.USER_ROLE, 'customer');
    setRole('customer');
  }, []);

  return { role, isAdmin, setAdmin, logoutAdmin };
}
