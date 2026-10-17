import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword,
         createUserWithEmailAndPassword, signOut, GoogleAuthProvider,
         signInWithPopup, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { ShopProfile, getShopProfile, claimLegacyDataForUser, updateShopProfile } from '../utils/multiTenantService';

interface AuthContextType {
  user: User | null;
  shopProfile: ShopProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfileData: (data: Partial<ShopProfile>) => Promise<void>;
  claimData: () => Promise<number>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [shopProfile, setShopProfile] = useState<ShopProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function ensureUserDoc(firebaseUser: User, name?: string) {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: name || firebaseUser.displayName || '',
        role: 'admin',
        createdAt: serverTimestamp(),
      });
    }
  }

  const loadUserProfile = async (firebaseUser: User, customName?: string) => {
    try {
      await ensureUserDoc(firebaseUser, customName);
      
      // Auto-claim any unassigned or email-matched legacy data so the user's data is never missing
      try {
        await claimLegacyDataForUser(firebaseUser.uid, firebaseUser.email || '');
      } catch (claimErr) {
        console.warn("Legacy claim warning:", claimErr);
      }

      const profile = await getShopProfile(
        firebaseUser.uid, 
        firebaseUser.email || '', 
        customName || firebaseUser.displayName || ''
      );
      setShopProfile(profile);
    } catch (err) {
      console.error("Error loading user shop profile:", err);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await loadUserProfile(firebaseUser);
      } else {
        setUser(null);
        setShopProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signIn = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    if (cred.user) {
      await loadUserProfile(cred.user);
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(firebaseUser, { displayName: name });
    await loadUserProfile(firebaseUser, name);
  };

  const signInGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const { user: firebaseUser } = await signInWithPopup(auth, provider);
    await loadUserProfile(firebaseUser);
  };

  const logout = () => signOut(auth);

  const updateProfileData = async (data: Partial<ShopProfile>) => {
    if (!user) return;
    await updateShopProfile(user.uid, data);
    setShopProfile(prev => prev ? { ...prev, ...data } : null);
  };

  const claimData = async () => {
    if (!user) return 0;
    return await claimLegacyDataForUser(user.uid, user.email || '');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      shopProfile, 
      loading, 
      signIn, 
      signUp, 
      signInGoogle, 
      logout,
      updateProfileData,
      claimData
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
