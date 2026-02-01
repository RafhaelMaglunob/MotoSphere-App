// Backend/controller/cache/userCache.ts
import { User, TrustedContact } from '../../../components/services/types';
import { getUserData, saveUserData } from '../../secureStore';

interface CachedData {
  userData: User;
  trustedContacts: TrustedContact[];
  timestamp: number; // When was this cached
  lastFetchedAt: string; // ISO timestamp
}

let userCache: CachedData | null = null;
let cacheUid: string | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Check if cache is still valid (not expired)
 */
const isCacheValid = (cachedData: CachedData): boolean => {
  const now = Date.now();
  const age = now - cachedData.timestamp;
  const isValid = age < CACHE_DURATION;

  if (!isValid) {
    console.log('⏰ Cache expired:', {
      age: Math.round(age / 1000) + 's',
      maxAge: Math.round(CACHE_DURATION / 1000) + 's'
    });
  }

  return isValid;
};

/**
 * Get user data from memory cache first, then SecureStore
 * Returns null if cache is expired or doesn't exist
 */
export const getUserCache = async (uid: string): Promise<CachedData | null> => {
  // 1️⃣ Check memory cache (fastest)
  if (userCache && cacheUid === uid) {
    if (isCacheValid(userCache)) {
      console.log('✅ Found valid data in memory cache');
      return userCache;
    } else {
      console.log('⚠️ Memory cache expired');
      userCache = null;
      cacheUid = null;
    }
  }

  // 2️⃣ Check SecureStore (persistent)
  console.log('⚠️ Memory cache miss, checking SecureStore...');
  const stored = await getUserData();

  if (stored?.userData?.uid === uid && stored.timestamp) {
    if (isCacheValid(stored)) {
      console.log('✅ Found valid data in SecureStore, restoring to memory');
      // Restore to memory cache for faster future access
      userCache = stored;
      cacheUid = uid;
      return stored;
    } else {
      console.log('⚠️ SecureStore cache expired');
    }
  }

  console.log('❌ No valid cached data found');
  return null;
};

/**
 * Save user data to BOTH memory cache AND SecureStore with timestamp
 */
export const setUserCache = async (
  uid: string,
  data: { userData: User; trustedContacts: TrustedContact[] }
): Promise<void> => {
  const cachedData: CachedData = {
    ...data,
    timestamp: Date.now(),
    lastFetchedAt: new Date().toISOString()
  };

  console.log('💾 Saving to cache:', {
    user: data.userData.name,
    trustedContactsCount: data.trustedContacts.length,
    timestamp: cachedData.lastFetchedAt
  });

  // Save to memory (fast access)
  userCache = cachedData;
  cacheUid = uid;
  console.log('✅ Saved to memory cache');

  // Save to SecureStore (persistent)
  try {
    await saveUserData(cachedData);
    console.log('✅ Saved to SecureStore (persistent)');
  } catch (err) {
    console.error('❌ Failed to save to SecureStore:', err);
  }
};

/**
 * Force refresh - invalidate cache and require fresh fetch
 */
export const invalidateUserCache = async (uid?: string): Promise<void> => {
  console.log('🔄 Invalidating cache for uid:', uid || 'all');

  if (uid && cacheUid !== uid) {
    console.log('⚠️ Cache UID mismatch, skipping invalidation');
    return;
  }

  // Clear memory
  userCache = null;
  cacheUid = null;
  console.log('🗑️ Memory cache invalidated');

  // Clear SecureStore
  try {
    await saveUserData(null);
    console.log('🗑️ SecureStore cache invalidated');
  } catch (err) {
    console.error('❌ Failed to invalidate SecureStore:', err);
  }
};

/**
 * Clear all cached data (use on logout)
 */
export const clearUserCache = async (uid: string): Promise<void> => {
  console.log('🗑️ Clearing cache for user:', uid);

  // Clear memory cache
  userCache = null;
  cacheUid = null;
  console.log('✅ Memory cache cleared');

  // Clear SecureStore
  try {
    await saveUserData(null);
    console.log('✅ SecureStore cache cleared');
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
  }
};
/**
 * Get cache age in seconds
 */
export const getCacheAge = (): number | null => {
  if (!userCache) return null;
  return Math.round((Date.now() - userCache.timestamp) / 1000);
};

/**
 * Check if cache exists and is valid
 */
export const hasFreshCache = async (uid: string): Promise<boolean> => {
  const cached = await getUserCache(uid);
  return cached !== null;
};
