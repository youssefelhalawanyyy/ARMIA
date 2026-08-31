'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import { AppUser } from '@/types';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: AppUser | null;
  loading: boolean;
  isAdmin: boolean;
  loginWithGoogle: () => Promise<FirebaseUser>;
  loginWithEmail: (email: string, pass: string) => Promise<FirebaseUser>;
  signupWithEmail: (email: string, pass: string, name: string) => Promise<FirebaseUser>;
  loginAdmin: (email: string, pass: string) => Promise<FirebaseUser>;
  registerAdmin: (email: string, pass: string, name: string) => Promise<FirebaseUser>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define default admin emails or keywords if needed
const ADMIN_EMAILS = [
  'admin@armia.com',
  'admin@armiaboutique.com',
  'armia.boutique.eg@gmail.com',
  'armiaboutique1@gmail.com',
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrCreateProfile = async (fbUser: FirebaseUser, fallbackRole: 'customer' | 'admin' = 'customer') => {
    try {
      const userRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userRef);

      const isKnownAdmin = fbUser.email && ADMIN_EMAILS.includes(fbUser.email.toLowerCase());
      const assignedRole = isKnownAdmin ? 'admin' : fallbackRole;

      if (snap.exists()) {
        const data = snap.data() as AppUser;
        // If it's an admin email, ensure role is admin
        if (isKnownAdmin && data.role !== 'admin') {
          await setDoc(userRef, { role: 'admin' }, { merge: true });
          data.role = 'admin';
        }
        setUserProfile(data);
      } else {
        const newProfile: AppUser = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || 'ARMIA Customer',
          photoURL: fbUser.photoURL || null,
          role: assignedRole,
          createdAt: serverTimestamp(),
        };
        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
      }
    } catch (err) {
      console.warn('Firestore profile fetch notice:', err);
      // Fallback local profile in case of network/rules delays
      const isKnownAdmin = fbUser.email && ADMIN_EMAILS.includes(fbUser.email.toLowerCase());
      setUserProfile({
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName || 'ARMIA Customer',
        role: isKnownAdmin ? 'admin' : fallbackRole,
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchOrCreateProfile(currentUser);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (): Promise<FirebaseUser> => {
    const res = await signInWithPopup(auth, googleProvider);
    await fetchOrCreateProfile(res.user, 'customer');
    return res.user;
  };

  const loginWithEmail = async (email: string, pass: string): Promise<FirebaseUser> => {
    const res = await signInWithEmailAndPassword(auth, email, pass);
    await fetchOrCreateProfile(res.user);
    return res.user;
  };

  const signupWithEmail = async (email: string, pass: string, name: string): Promise<FirebaseUser> => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    if (res.user) {
      await updateProfile(res.user, { displayName: name });
    }
    await fetchOrCreateProfile(res.user, 'customer');
    return res.user;
  };

  const loginAdmin = async (email: string, pass: string): Promise<FirebaseUser> => {
    const res = await signInWithEmailAndPassword(auth, email, pass);
    const isKnownAdmin = ADMIN_EMAILS.includes(email.toLowerCase());

    try {
      const userRef = doc(db, 'users', res.user.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data() as AppUser;
        if (data.role !== 'admin' && !isKnownAdmin) {
          throw new Error('Access denied. This account does not possess boutique administrator privileges.');
        }
        setUserProfile(data);
      } else {
        if (!isKnownAdmin) {
          throw new Error('Access denied. Unauthorized administrator account.');
        }
        const adminProfile: AppUser = {
          uid: res.user.uid,
          email: res.user.email,
          displayName: res.user.displayName || 'ARMIA Admin',
          role: 'admin',
          createdAt: serverTimestamp(),
        };
        await setDoc(userRef, adminProfile);
        setUserProfile(adminProfile);
      }
    } catch (err: unknown) {
      console.warn('Firestore admin check notice (falling back to email check):', err);
      if (!isKnownAdmin) {
        throw new Error('Access denied. This account does not possess administrator privileges.');
      }
      setUserProfile({
        uid: res.user.uid,
        email: res.user.email,
        displayName: res.user.displayName || 'ARMIA Admin',
        role: 'admin',
      });
    }
    return res.user;
  };

  const registerAdmin = async (email: string, pass: string, name: string): Promise<FirebaseUser> => {
    let resUser: FirebaseUser;
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      resUser = res.user;
    } catch (authErr: unknown) {
      const e = authErr as { code?: string };
      // If already registered in Auth, sign in directly with the credentials
      if (e.code === 'auth/email-already-in-use') {
        const signinRes = await signInWithEmailAndPassword(auth, email, pass);
        resUser = signinRes.user;
      } else {
        throw authErr;
      }
    }

    if (resUser) {
      try {
        await updateProfile(resUser, { displayName: name });
      } catch (err) {
        console.warn('Profile update notice:', err);
      }
    }

    const adminProfile: AppUser = {
      uid: resUser.uid,
      email: resUser.email,
      displayName: name || 'ARMIA Administrator',
      role: 'admin',
      createdAt: serverTimestamp(),
    };

    try {
      const userRef = doc(db, 'users', resUser.uid);
      await setDoc(userRef, adminProfile);
    } catch (err) {
      console.warn('Firestore setDoc notice (using memory admin session):', err);
    }

    setUserProfile(adminProfile);
    return resUser;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchOrCreateProfile(user);
    }
  };

  const isAdmin = Boolean(
    userProfile?.role === 'admin' ||
      (user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()))
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isAdmin,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        loginAdmin,
        registerAdmin,
        logout,
        refreshProfile,
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
