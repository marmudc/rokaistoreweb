'use client';
import { useAuth, defaultUserProfile } from '@/context/AuthContext';
import type { UserProfile } from '@/lib/types';

export { defaultUserProfile };

export function useUserProfile() {
  const { userProfile, updateProfileData, isGuest, user, loading, logout } = useAuth();

  return {
    profile: userProfile,
    updateProfile: updateProfileData,
    isGuest,
    user,
    loading,
    logout,
  };
}
