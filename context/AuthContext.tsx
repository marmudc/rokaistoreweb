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
import { setLocalString, LS_KEYS } from '@/lib/localStorage';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string, inGameId?: string) => Promise<void>;
  loginWithGoogle: (inGameId?: string) => Promise<void>;
  linkWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
  formatAuthError: (error: any) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = [
  'admin@fablemart.com',
  (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase().trim(),
].filter(Boolean);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
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

            if (snap.exists()) {
              const data = snap.data() as UserProfile;
              const effectiveRole = data.role === 'admin' || isEmailAdmin ? 'admin' : 'customer';

              if (isEmailAdmin && data.role !== 'admin') {
                updateDoc(userDocRef, { role: 'admin' }).catch(() => {});
              }

              setUserProfile({ ...data, role: effectiveRole });

              // Sync role to localStorage
              if (effectiveRole === 'admin') {
                setLocalString(LS_KEYS.USER_ROLE, 'admin');
              } else {
                setLocalString(LS_KEYS.USER_ROLE, 'customer');
              }
            } else {
              // Document does not exist yet (e.g. first Google login), create it
              const newProfile: UserProfile = {
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || (isEmailAdmin ? 'Super Admin' : 'Pelanggan'),
                email: firebaseUser.email || '',
                photoURL: firebaseUser.photoURL || '',
                defaultInGameId: '',
                role: isEmailAdmin ? 'admin' : 'customer',
                provider: firebaseUser.providerData[0]?.providerId || 'password',
                googleLinked: firebaseUser.providerData.some(p => p.providerId === 'google.com'),
                soundEnabled: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              };
              await setDoc(userDocRef, newProfile).catch((e) => {
                console.warn('Could not auto-create user doc:', e);
              });
              setUserProfile(newProfile);

              if (isEmailAdmin) {
                setLocalString(LS_KEYS.USER_ROLE, 'admin');
              }
            }
          },
          (err) => {
            console.warn('Firestore user profile snapshot error:', err);
          }
        );

        setLoading(false);
      } else {
        setUserProfile(null);
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
    // Update last login
    if (cred.user) {
      const ref = doc(db, 'users', cred.user.uid);
      await updateDoc(ref, {
        updatedAt: serverTimestamp(),
      }).catch(() => {});
    }
  };

  // 2. Register with Email & Password + In-game ID
  const registerWithEmail = async (email: string, pass: string, name: string, inGameId?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    const u = cred.user;

    // Update Firebase Auth profile
    await updateFirebaseProfile(u, {
      displayName: name.trim(),
    }).catch((e) => {
      console.warn('Could not update displayName in Firebase Auth profile:', e);
    });

    // Save initial profile in Firestore
    const userDocRef = doc(db, 'users', u.uid);
    const initialProfile: UserProfile = {
      uid: u.uid,
      name: name.trim(),
      email: email.trim(),
      photoURL: '',
      defaultInGameId: inGameId ? inGameId.trim() : '',
      role: 'customer',
      provider: 'password',
      googleLinked: false,
      soundEnabled: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(userDocRef, initialProfile);
    setUserProfile(initialProfile);
  };

  // 3. Login with Google (Popup)
  const loginWithGoogle = async (inGameId?: string) => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const res = await signInWithPopup(auth, provider);
    const u = res.user;

    const userDocRef = doc(db, 'users', u.uid);
    const snap = await getDoc(userDocRef);

    if (!snap.exists()) {
      const newProf: UserProfile = {
        uid: u.uid,
        name: u.displayName || 'Pelanggan',
        email: u.email || '',
        photoURL: u.photoURL || '',
        defaultInGameId: inGameId ? inGameId.trim() : '',
        role: 'customer',
        provider: 'google.com',
        googleLinked: true,
        soundEnabled: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userDocRef, newProf);
      setUserProfile(newProf);
    } else {
      const existing = snap.data() as UserProfile;
      const updates: Partial<UserProfile> = {
        photoURL: u.photoURL || existing.photoURL,
        googleLinked: true,
        updatedAt: serverTimestamp(),
      };
      if (inGameId && !existing.defaultInGameId) {
        updates.defaultInGameId = inGameId.trim();
      }
      await updateDoc(userDocRef, updates);
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
    setUserProfile(null);
    setLocalString(LS_KEYS.USER_ROLE, 'customer');
  };

  // 7. Update User Profile Data
  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    const sanitized: Record<string, any> = {
      ...data,
      updatedAt: serverTimestamp(),
    };
    // If name changed, also update Firebase Auth displayName
    if (data.name && data.name !== user.displayName) {
      await updateFirebaseProfile(user, { displayName: data.name }).catch(() => {});
    }
    await updateDoc(userDocRef, sanitized);
    setUserProfile(prev => prev ? { ...prev, ...data } : null);
  };

  // 8. (Removed) Auto-create guest user record on checkout to prevent duplicate users in Firestore


  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
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
