// services/authController.ts
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, UserCredential } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';
import { saveToken, getToken, deleteToken } from '../secureStore';

export type UserRole = 'rider' | 'emergency contact';

// ------------------ Login User ------------------
export const loginUser = async (email: string, password: string): Promise<{ uid: string }> => {
  if (Platform.OS === 'web') throw new Error('Web not supported');
  if (!email || !password) throw new Error('Email and password are required');

  const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (!userDoc.exists()) throw new Error('User not found in database');

  const userData = userDoc.data();
  if (!userData?.role || !['rider', 'emergency contact'].includes(userData.role)) {
    throw new Error('You are not authorized to log in');
  }

  // Save token locally
  await saveToken(user.uid);

  return { uid: user.uid };
};

// ------------------ Register User ------------------
export const registerUser = async (
  name: string,
  email: string,
  password: string,
  role: UserRole
): Promise<{ uid: string }> => {
  if (Platform.OS === 'web') throw new Error('Web not supported');
  if (!name || !email || !password) throw new Error('All fields are required');

  const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Add user to Firestore
  await setDoc(doc(db, 'users', user.uid), {
    name,
    email,
    role,
    createdAt: new Date(),
  });

  // Save token locally
  await saveToken(user.uid);

  return { uid: user.uid };
};

// ------------------ Logout User ------------------
export const logoutUser = async () => {
  await deleteToken();
};
