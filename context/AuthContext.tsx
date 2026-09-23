'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  linkWithPopup,
  updateProfile as updateFirebaseProfile,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { setLocalString, setLocalItem, getLocalItem, LS_KEYS, subscribeToStorage } from '@/lib/localStorage';

export const defaultUserProfile: UserProfile = {
  name: '',
  email: '',
  phone: '',
  defaultInGameId: '',
  soundEnabled: true,
  role: 'customer',
};

export interface AuthContextType {
  user: User | null;
  userProfile: UserProfile;
  isGuest: boolean;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string, inGameId?: string, phone?: string) => Promise<void>;
  loginWithGoogle: (inGameId?: string, phone?: string) => Promise<void>;
  linkWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
  formatAuthError: (error: any) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = [
  'admin@rokai.store',
  (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase().trim(),
].filter(Boolean);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>(defaultUserProfile);
  const [loading, setLoading] = useState(true);

  // Helper: map Firebase auth error code to friendly Indonesian message
  const formatAuthError = useCallback((error: any): string => {
    if (!error) return 'Terjadi kesalahan. Silakan coba lagi.';
    const code = error.code || '';
    switch (code) {
      case 'auth/configuration-not-found':
        return 'Layanan Autentikasi belum diaktifkan di Firebase Console. Buka Firebase Console -> Authentication -> Klik "Get Started / Mulai" -> Aktifkan "Email/Password".';
      case 'auth/operation-not-allowed':
        return 'Metode pendaftaran/login ini belum diaktifkan di Firebase Console. Buka tab Sign-in Method di Firebase Console dan aktifkan Email/Password atau Google.';
      case 'auth/admin-restricted-operation':
        return 'Operasi ini dibatasi oleh administrator proyek Firebase.';
      case 'auth/api-key-not-valid':
        return 'Kunci API Firebase tidak valid. Periksa konfigurasi NEXT_PUBLIC_FIREBASE_API_KEY.';
      case 'auth/invalid-credential':
        return 'Email atau kata sandi salah. Silakan periksa kembali.';
      case 'auth/user-not-found':
        return 'Akun dengan email ini belum terdaftar.';
      case 'auth/wrong-password':
        return 'Kata sandi tidak sesuai. Silakan gunakan tautan Lupa Password jika lupa.';
      case 'auth/email-already-in-use':
        return 'Alamat email ini sudah terdaftar. Silakan login atau gunakan email lain.';
      case 'auth/weak-password':
        return 'Kata sandi terlalu pendek. Masukkan minimal 6 karakter.';
      case 'auth/invalid-email':
        return 'Format email tidak valid (contoh: nama@domain.com).';
      case 'auth/popup-closed-by-user':
        return 'Jendela login Google ditutup sebelum selesai.';
      case 'auth/cancelled-popup-request':
        return 'Permintaan login dibatalkan.';
      case 'auth/popup-blocked':
        return 'Pop-up login diblokir oleh browser. Izinkan pop-up untuk melanjutkan.';
      case 'auth/too-many-requests':
        return 'Terlalu banyak percobaan login gagal. Mohon tunggu beberapa saat.';
      case 'auth/network-request-failed':
        return 'Koneksi jaringan terputus. Pastikan perangkat Anda terhubung ke internet.';
      case 'auth/credential-already-in-use':
        return 'Akun Google ini sudah terhubung ke pengguna lain.';
      default:
        return error.message || 'Terjadi kesalahan pada proses autentikasi.';
    }
  }, []);

  // Initialize cached guest profile on mount
  useEffect(() => {
    const cached = getLocalItem<UserProfile>(LS_KEYS.USER_PROFILE, defaultUserProfile);
    if (cached) {
      setUserProfile(prev => ({
        ...defaultUserProfile,
        ...prev,
        ...cached,
      }));
    }

    const unsubStorage = subscribeToStorage(LS_KEYS.USER_PROFILE, () => {
      const updated = getLocalItem<UserProfile>(LS_KEYS.USER_PROFILE, defaultUserProfile);
      setUserProfile(prev => ({
        ...prev,
        ...updated,
      }));
    });

    return () => unsubStorage();
  }, []);

  // Listen to Auth State
  useEffect(() => {
    let unsubDoc: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);

      if (unsubDoc) {
        unsubDoc();
        unsubDoc = null;
      }

      if (firebaseUser) {
        // Sync with Firestore users collection
        const userDocRef = doc(db, 'users', firebaseUser.uid);

        // Realtime listener for the user profile document with error handling
        unsubDoc = onSnapshot(
          userDocRef,
          async (snap) => {
            const isEmailAdmin = !!(firebaseUser.email && ADMIN_EMAILS.includes(firebaseUser.email.toLowerCase()));
            const currentGuest = getLocalItem<UserProfile>(LS_KEYS.USER_PROFILE, defaultUserProfile);

            if (snap.exists()) {
              const data = snap.data() as UserProfile;
              const effectiveRole = data.role === 'admin' || isEmailAdmin ? 'admin' : 'customer';

              // Auto-merge guest fields if Firestore doc is missing them
              const mergeUpdates: Record<string, any> = {};
              if (!data.defaultInGameId && currentGuest.defaultInGameId) {
                mergeUpdates.defaultInGameId = currentGuest.defaultInGameId.trim();
              }
              if (!data.phone && currentGuest.phone) {
                mergeUpdates.phone = currentGuest.phone.trim();
              }
              if (isEmailAdmin && data.role !== 'admin') {
                mergeUpdates.role = 'admin';
              }

              if (Object.keys(mergeUpdates).length > 0) {
                await updateDoc(userDocRef, {
                  ...mergeUpdates,
                  updatedAt: serverTimestamp(),
                }).catch(() => {});
              }

              const mergedProfile: UserProfile = {
                uid: firebaseUser.uid,
                name: data.name || firebaseUser.displayName || currentGuest.name || (isEmailAdmin ? 'Super Admin' : 'Pelanggan'),
                email: data.email || firebaseUser.email || currentGuest.email || '',
                photoURL: data.photoURL || firebaseUser.photoURL || '',
                defaultInGameId: data.defaultInGameId || mergeUpdates.defaultInGameId || currentGuest.defaultInGameId || '',
                phone: data.phone || mergeUpdates.phone || currentGuest.phone || '',
                role: effectiveRole,
                provider: data.provider || firebaseUser.providerData[0]?.providerId || 'password',
                googleLinked: data.googleLinked || firebaseUser.providerData.some(p => p.providerId === 'google.com'),
                soundEnabled: data.soundEnabled !== false,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
              };

              setUserProfile(mergedProfile);
              setLocalItem(LS_KEYS.USER_PROFILE, mergedProfile);
              setLocalString(LS_KEYS.USER_ROLE, effectiveRole);
            } else {
              // Document does not exist yet (e.g. first Google login), create it
              const newProfile: UserProfile = {
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || currentGuest.name || (isEmailAdmin ? 'Super Admin' : 'Pelanggan'),
                email: firebaseUser.email || currentGuest.email || '',
                photoURL: firebaseUser.photoURL || '',
                defaultInGameId: currentGuest.defaultInGameId || '',
                phone: currentGuest.phone || '',
                role: isEmailAdmin ? 'admin' : 'customer',
                provider: firebaseUser.providerData[0]?.providerId || 'password',
                googleLinked: firebaseUser.providerData.some(p => p.providerId === 'google.com'),
                soundEnabled: currentGuest.soundEnabled !== false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              };
              await setDoc(userDocRef, newProfile, { merge: true }).catch((e) => {
                console.warn('Could not auto-create user doc:', e);
              });
              setUserProfile(newProfile);
              setLocalItem(LS_KEYS.USER_PROFILE, newProfile);
              setLocalString(LS_KEYS.USER_ROLE, newProfile.role || 'customer');
            }
          },
          (err) => {
            console.warn('Firestore user profile snapshot error:', err);
          }
        );

        setLoading(false);
      } else {
        // Guest mode - retain cached guest profile
        const guest = getLocalItem<UserProfile>(LS_KEYS.USER_PROFILE, defaultUserProfile);
        const guestProfile: UserProfile = {
          ...defaultUserProfile,
          ...guest,
          uid: undefined,
          role: 'customer',
        };
        setUserProfile(guestProfile);
        setLocalString(LS_KEYS.USER_ROLE, 'customer');
        setLoading(false);
      }
    });

    return () => {
      if (unsubDoc) unsubDoc();
      unsubAuth();
    };
  }, []);

  // 1. Login with Email & Password
  const loginWithEmail = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    if (cred.user) {
      const ref = doc(db, 'users', cred.user.uid);
      await updateDoc(ref, {
        updatedAt: serverTimestamp(),
      }).catch(() => {});
    }
  };

  // 2. Register with Email & Password + In-game ID + Phone
  const registerWithEmail = async (email: string, pass: string, name: string, inGameId?: string, phone?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    const u = cred.user;

    await updateFirebaseProfile(u, {
      displayName: name.trim(),
    }).catch((e) => {
      console.warn('Could not update displayName in Firebase Auth profile:', e);
    });

    const guestProfile = getLocalItem<UserProfile>(LS_KEYS.USER_PROFILE, defaultUserProfile);
    const resolvedInGameId = inGameId?.trim() || guestProfile.defaultInGameId || '';
    const resolvedPhone = phone?.trim() || guestProfile.phone || '';
    const isEmailAdmin = !!(email && ADMIN_EMAILS.includes(email.toLowerCase().trim()));

    const userDocRef = doc(db, 'users', u.uid);
    const initialProfile: UserProfile = {
      uid: u.uid,
      name: name.trim(),
      email: email.trim(),
      photoURL: '',
      defaultInGameId: resolvedInGameId,
      phone: resolvedPhone,
      role: isEmailAdmin ? 'admin' : 'customer',
      provider: 'password',
      googleLinked: false,
      soundEnabled: guestProfile.soundEnabled !== false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(userDocRef, initialProfile, { merge: true });
    setUserProfile(initialProfile);
    setLocalItem(LS_KEYS.USER_PROFILE, initialProfile);
  };

  // 3. Login with Google (Popup)
  const loginWithGoogle = async (inGameId?: string, phone?: string) => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const res = await signInWithPopup(auth, provider);
    const u = res.user;

    const userDocRef = doc(db, 'users', u.uid);
    const snap = await getDoc(userDocRef);
    const guestProfile = getLocalItem<UserProfile>(LS_KEYS.USER_PROFILE, defaultUserProfile);

    const resolvedInGameId = inGameId?.trim() || guestProfile.defaultInGameId || '';
    const resolvedPhone = phone?.trim() || guestProfile.phone || '';

    if (!snap.exists()) {
      const isEmailAdmin = !!(u.email && ADMIN_EMAILS.includes(u.email.toLowerCase()));
      const newProf: UserProfile = {
        uid: u.uid,
        name: u.displayName || guestProfile.name || (isEmailAdmin ? 'Super Admin' : 'Pelanggan'),
        email: u.email || '',
        photoURL: u.photoURL || '',
        defaultInGameId: resolvedInGameId,
        phone: resolvedPhone,
        role: isEmailAdmin ? 'admin' : 'customer',
        provider: 'google.com',
        googleLinked: true,
        soundEnabled: guestProfile.soundEnabled !== false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userDocRef, newProf, { merge: true });
      setUserProfile(newProf);
      setLocalItem(LS_KEYS.USER_PROFILE, newProf);
    } else {
      const existing = snap.data() as UserProfile;
      const updates: Partial<UserProfile> = {
        photoURL: u.photoURL || existing.photoURL,
        googleLinked: true,
        updatedAt: serverTimestamp(),
      };
      if (resolvedInGameId && !existing.defaultInGameId) {
        updates.defaultInGameId = resolvedInGameId;
      }
      if (resolvedPhone && !existing.phone) {
        updates.phone = resolvedPhone;
      }
      await setDoc(userDocRef, updates, { merge: true });
    }
  };

  // 4. Link Google account to current email account
  const linkWithGoogle = async () => {
    if (!auth.currentUser) throw new Error('Anda belum login.');
    const provider = new GoogleAuthProvider();
    const result = await linkWithPopup(auth.currentUser, provider);
    const u = result.user;

    const userDocRef = doc(db, 'users', u.uid);
    await updateDoc(userDocRef, {
      googleLinked: true,
      photoURL: u.photoURL || '',
      updatedAt: serverTimestamp(),
    });
  };

  // 5. Send Password Reset Email
  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  // 6. Sign Out
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    const resetGuest: UserProfile = { ...defaultUserProfile };
    setUserProfile(resetGuest);
    setLocalItem(LS_KEYS.USER_PROFILE, resetGuest);
    setLocalString(LS_KEYS.USER_ROLE, 'customer');
  };

  // 7. Update User Profile Data (Unified: writes to state, localStorage, and Firestore if authenticated)
  const updateProfileData = async (data: Partial<UserProfile>) => {
    const sanitized: Record<string, any> = {};
    if (data.name !== undefined) sanitized.name = data.name.trim();
    if (data.email !== undefined) sanitized.email = data.email.trim();
    if (data.phone !== undefined) sanitized.phone = data.phone.trim();
    if (data.defaultInGameId !== undefined) sanitized.defaultInGameId = data.defaultInGameId.trim();
    if (data.soundEnabled !== undefined) sanitized.soundEnabled = data.soundEnabled;
    if (data.photoURL !== undefined) sanitized.photoURL = data.photoURL;

    // Immediately update local state & localStorage
    setUserProfile(prev => {
      const next: UserProfile = { ...prev, ...sanitized };
      setLocalItem(LS_KEYS.USER_PROFILE, next);
      return next;
    });

    // If authenticated, also persist to Firestore users collection
    if (auth.currentUser) {
      if (sanitized.name && sanitized.name !== auth.currentUser.displayName) {
        await updateFirebaseProfile(auth.currentUser, { displayName: sanitized.name }).catch(() => {});
      }
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userDocRef, {
        ...sanitized,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isGuest: !user,
        loading,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        linkWithGoogle,
        resetPassword,
        logout,
        updateProfileData,
        formatAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
