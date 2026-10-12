import { collection, getDocs, doc, updateDoc, getDoc, setDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
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
 * Claims any existing legacy documents that do not have a userId
 * and associates them with the given user's UID.
 */
export async function claimLegacyDataForUser(uid: string): Promise<number> {
  if (!uid) return 0;
  
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
        return !data.userId;
      });

      if (unassignedDocs.length > 0) {
        // Update in chunks of 400 for Firestore batch limits
        const chunkSize = 400;
        for (let i = 0; i < unassignedDocs.length; i += chunkSize) {
          const chunk = unassignedDocs.slice(i, i + chunkSize);
          const batch = writeBatch(db);
          chunk.forEach(d => {
            batch.update(doc(db, colName, d.id), { userId: uid });
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
 */
export async function getShopProfile(uid: string, defaultEmail?: string, defaultName?: string): Promise<ShopProfile> {
  if (!uid) return DEFAULT_SHOP_PROFILE;

  try {
    const shopRef = doc(db, 'shops', uid);
    const snap = await getDoc(shopRef);

    if (snap.exists()) {
      return { ...DEFAULT_SHOP_PROFILE, ...snap.data() } as ShopProfile;
    }

    // Default profile for new user
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
