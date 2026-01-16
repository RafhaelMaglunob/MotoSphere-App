// Backend/firebase.ts
import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  // @ts-ignore - getReactNativePersistence exists at runtime but may have type issues
  getReactNativePersistence,
} from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra as {
  FIREBASE_API_KEY: string;
  FIREBASE_AUTH_DOMAIN: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_STORAGE_BUCKET: string;
  FIREBASE_MESSAGING_SENDER_ID: string;
  FIREBASE_APP_ID: string;
  FIREBASE_MEASUREMENT_ID: string;
};

const firebaseConfig = {
  apiKey: extra.FIREBASE_API_KEY,
  authDomain: extra.FIREBASE_AUTH_DOMAIN,
  projectId: extra.FIREBASE_PROJECT_ID,
  storageBucket: extra.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: extra.FIREBASE_MESSAGING_SENDER_ID,
  appId: extra.FIREBASE_APP_ID,
  measurementId: extra.FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase once and keep it in memory
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

console.log('✅ Firebase Auth initialized with AsyncStorage persistence');

// Keep Firestore instance persistent
let db: Firestore | null = null;
let dbInitialized = false;

export const getDb = (): Firestore => {
  if (!db) {
    db = getFirestore(app);
    dbInitialized = true;
    console.log('✅ Firestore instance created and cached');
  }
  return db;
};

// Check if Firestore is initialized
export const isFirestoreReady = (): boolean => {
  return dbInitialized && db !== null;
};

// Monitor auth state changes
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('🔥 Firebase Auth: User session active -', user.uid);
  } else {
    console.log('🔥 Firebase Auth: No active user session');
  }
});

// Keep Firebase connection alive with periodic heartbeat
setInterval(() => {
  if (auth.currentUser && isFirestoreReady()) {
    console.log('💓 Firebase connection heartbeat');
  }
}, 60000); // Every 60 seconds

export { app, auth };
export default app;