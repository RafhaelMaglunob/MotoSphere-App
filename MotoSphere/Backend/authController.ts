// Backend/controller/authController.ts
import { auth, getDb } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, UserCredential } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { User, TrustedContact } from '../components/services/types';
import { saveToken, saveUserData, deleteUserData, getUserData } from './secureStore';

export type UserRole = 'rider' | 'emergency contact';

// Map Firebase error codes to user-friendly messages
const getErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address';
    case 'auth/user-disabled':
      return 'This account has been disabled';
    case 'auth/user-not-found':
      return 'Email not registered. Please create an account';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check and try again';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please try again later';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection';
    case 'auth/operation-not-allowed':
      return 'Login is currently disabled. Please try again later';
    case 'auth/email-already-in-use':
      return 'This email is already registered';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters';
    case 'auth/missing-email':
      return 'Please enter your email';
    case 'auth/missing-password':
      return 'Please enter your password';
    default:
      return 'An error occurred. Please try again';
  }
};

// Cache in memory to avoid repeated AsyncStorage calls
let userCache: { userData: User; trustedContacts: TrustedContact[] } | null = null;
let cacheUid: string | null = null;

// Fetch user with cache-first strategy
export const fetchUser = async (uid: string): Promise<{ userData: User; trustedContacts: TrustedContact[] } | null> => {
  try {
    // 1️⃣ Check memory cache first (instant)
    if (userCache && cacheUid === uid) {
      console.log('✅ Loaded user from memory cache');
      return userCache;
    }

    // 2️⃣ Check AsyncStorage cache
    console.log('🔄 Checking AsyncStorage cache...');
    const cached = await getUserData();
    if (cached?.userData && cached.userData.uid === uid) {
      console.log('✅ Loaded user from AsyncStorage cache');
      userCache = cached;
      cacheUid = uid;
      return cached;
    }

    // 3️⃣ Fetch from Firestore if no cache
    console.log('🔄 Fetching user from Firestore...');
    const db = getDb();
    
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.warn('❌ User document not found in Firestore');
      return null;
    }

    const userData = {
      ...docSnap.data(),
      uid
    } as unknown as User;

    // 4️⃣ Fetch trusted contacts in parallel
    let trustedContacts: TrustedContact[] = [];
    if (userData.email) {
      try {
        const tcQuery = query(
          collection(db, 'TrustedContact'),
          where('ownerEmail', '==', userData.email)
        );
        const tcSnapshot = await getDocs(tcQuery);
        trustedContacts = tcSnapshot.docs.map(d => d.data() as TrustedContact);
        console.log(`✅ Fetched ${trustedContacts.length} trusted contacts`);
      } catch (contactErr) {
        console.warn('⚠️ Failed to fetch trusted contacts:', contactErr);
      }
    }

    const fullData = { userData, trustedContacts };
    
    // 5️⃣ Save to AsyncStorage and memory cache
    await saveUserData(fullData);
    userCache = fullData;
    cacheUid = uid;
    console.log('✅ User data saved to cache');
    
    return fullData;
  } catch (err) {
    console.error('❌ Failed to fetch user:', err);
    
    // Fallback: Try to return AsyncStorage cache
    try {
      const cached = await getUserData();
      if (cached?.userData) {
        console.log('✅ Fallback: Using cached user data');
        userCache = cached;
        cacheUid = cached.userData.uid;
        return cached;
      }
    } catch (cacheErr) {
      console.error('❌ Failed to get cached data:', cacheErr);
    }
    
    return null;
  }
};

// Clear memory cache when logging out
export const clearUserCache = () => {
  userCache = null;
  cacheUid = null;
  console.log('🗑️ User cache cleared');
};

// Login
export const loginUser = async (email: string, password: string): Promise<{ uid: string }> => {
  // Validate inputs
  if (!email || !email.trim()) {
    throw new Error('Please enter your email');
  }
  if (!password || !password.trim()) {
    throw new Error('Please enter your password');
  }

  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await saveToken(user.uid);
    console.log('✅ User logged in:', user.uid);

    return { uid: user.uid };
  } catch (err: any) {
    console.error('❌ Login error:', err.code, err.message);
    
    // Get user-friendly error message
    const errorMessage = getErrorMessage(err.code);
    const error = new Error(errorMessage);
    throw error;
  }
};

// Register
export const registerUser = async (
  name: string,
  email: string,
  password: string,
  role: UserRole
): Promise<{ uid: string }> => {
  // Validate inputs
  if (!name || !name.trim()) {
    throw new Error('Please enter your name');
  }
  if (!email || !email.trim()) {
    throw new Error('Please enter a valid email');
  }
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  try {
    const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await saveToken(user.uid);
    console.log('✅ User registered:', user.uid);

    return { uid: user.uid };
  } catch (err: any) {
    console.error('❌ Register error:', err.code, err.message);
    
    // Get user-friendly error message
    const errorMessage = getErrorMessage(err.code);
    const error = new Error(errorMessage);
    throw error;
  }
};

// Logout
export const logoutUser = async () => {
  try {
    await deleteUserData();
    await saveToken('');
    clearUserCache();
    console.log('✅ User logged out');
  } catch (err) {
    console.error('❌ Logout error:', err);
    throw err;
  }
};