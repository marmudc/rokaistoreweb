import { useState, useEffect, useCallback } from 'react';
import { subscribeToUserProfile, saveUserProfileToFirestore } from '@/lib/firebaseSync';
import { LS_KEYS, getLocalItem, setLocalItem, subscribeToStorage } from '@/lib/localStorage';
import type { UserProfile } from '@/lib/types';

export const defaultUserProfile: UserProfile = {
  name: '',
  email: '',
  defaultInGameId: '',
  soundEnabled: true,
};

function getClientId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = localStorage.getItem('fablemart_client_id');
  if (!id) {
    id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem('fablemart_client_id', id);
  }
  return id;
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>(defaultUserProfile);

  useEffect(() => {
    // 1. Instant local load
    const cached = getLocalItem<UserProfile>(LS_KEYS.USER_PROFILE, defaultUserProfile);
    setProfile(cached);

    const unsubStorage = subscribeToStorage(LS_KEYS.USER_PROFILE, () => {
      setProfile(getLocalItem<UserProfile>(LS_KEYS.USER_PROFILE, defaultUserProfile));
    });

    // 2. Real-time listener for this specific client ID in Firestore
    const clientId = getClientId();
    const unsubFirestore = subscribeToUserProfile(clientId, (p) => {
      if (p && (p.name || p.email || p.defaultInGameId)) {
        setProfile(p);
        setLocalItem(LS_KEYS.USER_PROFILE, p);
      }
    });

    return () => {
      unsubStorage();
      unsubFirestore();
    };
  }, []);

  const updateProfile = useCallback(async (newProfile: UserProfile) => {
    setProfile(newProfile);
    setLocalItem(LS_KEYS.USER_PROFILE, newProfile);
    const clientId = getClientId();
    await saveUserProfileToFirestore(clientId, newProfile);
  }, []);

  return { profile, updateProfile };
}
