// services/authController.ts
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';

type UserRole = 'rider' | 'emergency contact';

export const loginUser = async (email: string, password: string): Promise<{ uid: string }> => {
  if (Platform.OS === 'web') throw new Error('Web not supported');

  if (!email || !password) throw new Error('Email and password are required');

  // 1️⃣ Firebase Auth login
  const userCredential = await signInWithEmailAndPassword(auth!, email, password);
  const user = userCredential.user;

  // 2️⃣ Fetch user document
  const userDoc = await getDoc(doc(db!, 'users', user.uid));
  if (!userDoc.exists()) throw new Error('User not found in database');

  const userData = userDoc.data();
  if (!['rider', 'emergency contact'].includes(userData.role))
    throw new Error('You are not authorized to log in');

  return { uid: user.uid };
};

export const registerUser = async (
  name: string,
  email: string,
  password: string,
  role: UserRole
): Promise<{ uid: string }> => {
  if (Platform.OS === 'web') throw new Error('Web not supported');

  if (!name || !email || !password) throw new Error('All fields are required');

  // 1️⃣ Firebase Auth signup
  const userCredential = await createUserWithEmailAndPassword(auth!, email, password);
  const user = userCredential.user;

  // 2️⃣ Add to Firestore
  await setDoc(doc(db!, 'users', user.uid), {
    name,
    email,
    role,
    createdAt: new Date(),
  });

  return { uid: user.uid };
};
