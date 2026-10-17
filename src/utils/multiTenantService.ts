import { collection, getDocs, doc, updateDoc, getDoc, setDoc, writeBatch, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SHOP_CONFIG } from '../config/shopConfig';

export interface ShopProfile {
  shopName: string;
  shortName: string;
  ownerName: string;
  phone: string;
  address: string;
  subTitle?: string;
  email?: string;
  updatedAt?: any;
}

export const DEFAULT_SHOP_PROFILE: ShopProfile = {
  shopName: SHOP_CONFIG.name,
  shortName: SHOP_CONFIG.shortName,
  ownerName: 'Shop Owner',
  phone: SHOP_CONFIG.phone,
  address: SHOP_CONFIG.address,
  subTitle: SHOP_CONFIG.subTitle,
};

/**
 * Claims any existing legacy documents or documents associated with this user's email
 * that do not yet have the current user's UID.
 * This guarantees that when a client logs in (e.g. with Google or Email), all of their
 * existing Firestore records immediately link to their account and appear in the UI.
 */
export async function claimLegacyDataForUser(uid: string, email?: string): Promise<number> {
  if (!uid) return 0;
  
  const cleanEmail = email ? email.toLowerCase().trim() : '';

  const collectionsToClaim = [
    'mobiles',
    'sales',
    'bills',
    'khata',
    'khataTransactions',
    'expenses'
  ];

  let totalClaimed = 0;

  for (const colName of collectionsToClaim) {
    try {
      const snap = await getDocs(collection(db, colName));
      const unassignedDocs = snap.docs.filter(d => {
        const data = d.data();
        
        // 1. If document already has this user's UID, no claim needed
        if (data.userId === uid) {
          return false;
        }

        // 2. If document has matching userEmail, claim it to this UID
        if (cleanEmail && data.userEmail && data.userEmail.toLowerCase().trim() === cleanEmail) {
          return true;
        }

        // 3. If document has neither userId nor userEmail (legacy unpartitioned data)
        if (!data.userId && !data.userEmail) {
          return true;
        }

        return false;
      });

      if (unassignedDocs.length > 0) {
        const chunkSize = 400;
        for (let i = 0; i < unassignedDocs.length; i += chunkSize) {
          const chunk = unassignedDocs.slice(i, i + chunkSize);
          const batch = writeBatch(db);
          chunk.forEach(d => {
            const data = d.data();
            batch.update(doc(db, colName, d.id), { 
              userId: uid,
              userEmail: cleanEmail || data.userEmail || ''
            });
          });
          await batch.commit();
          totalClaimed += chunk.length;
        }
      }
    } catch (err) {
      console.warn(`Could not check or claim legacy docs for collection ${colName}:`, err);
    }
  }

  return totalClaimed;
}

/**
 * Loads or initializes the shop profile for the given user.
 * Each email/UID has their own independent shop profile in /shops/{uid}.
 */
export async function getShopProfile(uid: string, defaultEmail?: string, defaultName?: string): Promise<ShopProfile> {
  if (!uid) return DEFAULT_SHOP_PROFILE;

  try {
    const shopRef = doc(db, 'shops', uid);
    const snap = await getDoc(shopRef);

    if (snap.exists()) {
      return { ...DEFAULT_SHOP_PROFILE, ...snap.data() } as ShopProfile;
    }

    // Default profile for new user / shopkeeper
    const initialProfile: ShopProfile = {
      shopName: defaultName ? `${defaultName}'s Mobile Shop` : DEFAULT_SHOP_PROFILE.shopName,
      shortName: 'AMZ',
      ownerName: defaultName || 'Owner',
      phone: DEFAULT_SHOP_PROFILE.phone,
      address: DEFAULT_SHOP_PROFILE.address,
      subTitle: DEFAULT_SHOP_PROFILE.subTitle,
      email: defaultEmail || '',
      updatedAt: serverTimestamp()
    };

    await setDoc(shopRef, initialProfile, { merge: true });
    return initialProfile;
  } catch (err) {
    console.error('Error fetching shop profile:', err);
    return DEFAULT_SHOP_PROFILE;
  }
}

/**
 * Updates the user's shop profile in Firestore.
 */
export async function updateShopProfile(uid: string, data: Partial<ShopProfile>): Promise<void> {
  if (!uid) return;
  const shopRef = doc(db, 'shops', uid);
  await setDoc(shopRef, {
    ...data,
    updatedAt: serverTimestamp()
  }, { merge: true });
}
