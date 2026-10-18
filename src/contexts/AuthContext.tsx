import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import {
  ShopProfile,
  getShopProfile,
  updateShopProfile,
  DEFAULT_ARSHAD_PROFILE,
  ensureLegacyDataLinkedToArshad,
  ARSHAD_SHOP_ID,
} from '../utils/multiTenantService';
import { updateAppBranding } from '../utils/brandIdentity';
import { getGoogleDriveAccessToken } from '../utils/googleAuthHelper';

interface AuthContextType {
  user: User | null;
  shopProfile: ShopProfile;
  currentShopId: string;
  loading: boolean;
  googleAccessToken: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  connectGoogleDrive: () => Promise<string>;
  logout: () => Promise<void>;
  updateProfileData: (data: Partial<ShopProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

let cachedDriveToken: string | null = null;

const getInitialProfile = (): ShopProfile => {
  try {
    const cachedName = localStorage.getItem('cached_shop_name');
    const cachedShort = localStorage.getItem('cached_shop_short_name');
    const cachedSub = localStorage.getItem('cached_shop_subtitle');
    if (cachedName) {
      return {
        ...DEFAULT_ARSHAD_PROFILE,
        shopName: cachedName,
        shortName: cachedShort || 'MZ',
        subTitle: cachedSub || '',
      };
    }
  } catch (e) {
    // ignore
  }
  return DEFAULT_ARSHAD_PROFILE;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [shopProfile, setShopProfile] = useState<ShopProfile>(getInitialProfile);
  const [loading, setLoading] = useState(true);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

  async function ensureUserDoc(firebaseUser: User, name?: string) {
    try {
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
    } catch (err) {
      console.warn('Error in ensureUserDoc:', err);
    }
  }

  const loadUserProfile = async (firebaseUser: User, customName?: string) => {
    try {
      await ensureUserDoc(firebaseUser, customName);
      const profile = await getShopProfile(
        firebaseUser.uid,
        firebaseUser.email || '',
        customName || firebaseUser.displayName || ''
      );
      setShopProfile(profile);

      // Cache shop details and update manifest & touch icons
      try {
        localStorage.setItem('cached_shop_name', profile.shopName);
        localStorage.setItem('cached_shop_short_name', profile.shortName);
        if (profile.subTitle) localStorage.setItem('cached_shop_subtitle', profile.subTitle);
      } catch (e) {
        // ignore
      }
      updateAppBranding(profile.shopName, profile.shortName);

      // If this is Arshad Mobile Zone, stamp any legacy unassigned records in background
      if (profile.shopId === ARSHAD_SHOP_ID) {
        ensureLegacyDataLinkedToArshad().catch(console.warn);
      }
    } catch (err) {
      console.error('Error loading shop profile:', err);
    }
  };

  useEffect(() => {
    // Initial dynamic branding based on initial profile
    updateAppBranding(shopProfile.shopName, shopProfile.shortName);

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await loadUserProfile(firebaseUser);
      } else {
        setUser(null);
        const initial = getInitialProfile();
        setShopProfile(initial);
        setGoogleAccessToken(null);
        cachedDriveToken = null;
        updateAppBranding(initial.shopName, initial.shortName);
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
    provider.addScope('https://www.googleapis.com/auth/drive.file');
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedDriveToken = credential.accessToken;
      setGoogleAccessToken(credential.accessToken);
    }
    if (result.user) {
      await loadUserProfile(result.user);
    }
  };

  const connectGoogleDrive = async (): Promise<string> => {
    if (cachedDriveToken) {
      return cachedDriveToken;
    }
    const token = await getGoogleDriveAccessToken(user?.email || undefined);
    if (!token) {
      throw new Error('Failed to obtain Google Drive authorization.');
    }
    cachedDriveToken = token;
    setGoogleAccessToken(token);
    return token;
  };

  const logout = async () => {
    await signOut(auth);
    cachedDriveToken = null;
    setGoogleAccessToken(null);
  };

  const updateProfileData = async (data: Partial<ShopProfile>) => {
    if (!user) return;
    await updateShopProfile(user.uid, data);
    setShopProfile((prev) => {
      const updated = { ...prev, ...data };
      try {
        if (updated.shopName) localStorage.setItem('cached_shop_name', updated.shopName);
        if (updated.shortName) localStorage.setItem('cached_shop_short_name', updated.shortName);
        if (updated.subTitle) localStorage.setItem('cached_shop_subtitle', updated.subTitle);
      } catch (e) {
        // ignore
      }
      updateAppBranding(updated.shopName, updated.shortName);
      return updated;
    });
  };

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        shopProfile,
        currentShopId: shopProfile.shopId,
        loading,
        googleAccessToken,
        signIn,
        signUp,
        signInGoogle,
        connectGoogleDrive,
        logout,
        updateProfileData,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
