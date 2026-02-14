import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  UserCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, getDb } from '../../firebase';
import { saveToken } from '../../secureStore';
import { getErrorMessage } from './authErrors';
import { deleteUserData } from '../../secureStore';
import { clearUserCache } from '../../authController';

export type UserRole = 'rider' | 'emergency contact';

/**
 * Check if email already exists in Firebase
 */
export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const db = getDb();
    const normalizedEmail = email.toLowerCase().trim();
    
    console.log('🔍 Checking if email exists:', normalizedEmail);
    
    const q = query(collection(db, 'users'), where('email', '==', normalizedEmail));
    const snapshot = await getDocs(q);
    
    const exists = !snapshot.empty;
    console.log(`📧 Email check result: ${exists ? 'EXISTS ✅' : 'NEW USER ❌'}`);
    console.log(`📧 Found ${snapshot.size} matching document(s)`);
    
    return exists;
  } catch (error: any) {
    console.error('❌ Error checking email:', error);
    throw new Error('Failed to check email availability');
  }
};

/**
 * ⭐ Send verification email BEFORE account creation (registration flow)
 */
export const sendPreRegistrationVerificationEmail = async (
  email: string,
  userName: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('📧 Sending pre-registration verification email to:', email);

    const db = getDb();
    const normalizedEmail = email.toLowerCase().trim();
    
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store code in Firestore with expiration
    await addDoc(collection(db, 'preRegistrationVerifications'), {
      email: normalizedEmail,
      code: code,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      used: false,
      verified: false
    });

    console.log('✅ Pre-registration verification code stored');

    // ⭐ SAME VERCEL CALL AS settingService
    console.log('🚀 Calling Vercel API...');
    console.log('📧 Target email:', normalizedEmail);
    console.log('🔢 Code:', code);

    const response = await fetch('https://email-backend-five-phi.vercel.app/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: normalizedEmail,
        code: code,
        userName: userName,
        emailType: 'preRegistration'
      })
    });

    console.log('📬 Response status:', response.status);
    const responseText = await response.text();
    console.log('📬 Response body:', responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Could not parse response as JSON:', responseText);
      throw new Error('Invalid response from server');
    }

    if (!response.ok) {
      console.error('❌ API returned error:', result);
      throw new Error(result.error || result.details || `HTTP ${response.status}`);
    }

    console.log('✅ Pre-registration verification email sent successfully');
    return { success: true };

  } catch (error: any) {
    console.error('❌ Failed to send pre-registration verification email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send verification email'
    };
  }
};

/**
 * ⭐ Verify the pre-registration code before creating account
 */
export const verifyPreRegistrationCode = async (
  email: string,
  inputCode: string
): Promise<boolean> => {
  try {
    console.log('🔐 Verifying pre-registration code for email:', email);

    const db = getDb();
    const normalizedEmail = email.toLowerCase().trim();
    
    const q = query(
      collection(db, 'preRegistrationVerifications'),
      where('email', '==', normalizedEmail),
      where('code', '==', inputCode.trim()),
      where('used', '==', false)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.error('❌ Invalid pre-registration code');
      return false;
    }

    const codeDoc = snapshot.docs[0];
    const data = codeDoc.data();

    const expiresAt = data.expiresAt?.toDate?.();
    if (expiresAt && expiresAt < new Date()) {
      console.error('❌ Pre-registration code expired');
      await setDoc(codeDoc.ref, { used: true }, { merge: true });
      return false;
    }

    // Mark as verified
    await setDoc(codeDoc.ref, { verified: true, used: true }, { merge: true });
    console.log('✅ Pre-registration code verified');

    return true;
  } catch (error: any) {
    console.error('❌ Error verifying pre-registration code:', error);
    throw new Error('Failed to verify email code');
  }
};

/**
 * Send verification email to new user during registration
 */
export const sendVerificationEmailToNewUser = async (
  email: string,
  uid: string,
  userName: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('📧 Sending verification email to new user:', email);

    const db = getDb();
    const normalizedEmail = email.toLowerCase().trim();
    
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store code in Firestore with expiration
    await addDoc(collection(db, 'verificationCodes'), {
      uid: uid,
      email: normalizedEmail,
      code: code,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      used: false
    });

    console.log('✅ Verification code stored in Firestore');

    // ⭐ SAME VERCEL CALL AS settingService
    console.log('🚀 Calling Vercel API...');
    console.log('📧 Target email:', normalizedEmail);
    console.log('🔢 Code:', code);

    const response = await fetch('https://email-backend-five-phi.vercel.app/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: normalizedEmail,
        code: code,
        userName: userName,
        emailType: 'verification'
      })
    });

    console.log('📬 Response status:', response.status);
    const responseText = await response.text();
    console.log('📬 Response body:', responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Could not parse response as JSON:', responseText);
      throw new Error('Invalid response from server');
    }

    if (!response.ok) {
      console.error('❌ API returned error:', result);
      throw new Error(result.error || result.details || `HTTP ${response.status}`);
    }

    console.log('✅ Verification email sent successfully to new user');
    return { success: true };

  } catch (error: any) {
    console.error('❌ Failed to send verification email to new user:', error);
    return {
      success: false,
      error: error.message || 'Failed to send verification email'
    };
  }
};

/**
 * Check for pending verification codes that haven't expired
 */
export const getPendingVerificationCode = async (uid: string): Promise<{
  hasPendingCode: boolean;
  email?: string;
  expiresAt?: Date;
  error?: string;
}> => {
  try {
    console.log('🔍 Checking for pending verification codes for uid:', uid);

    const db = getDb();
    const q = query(
      collection(db, 'verificationCodes'),
      where('uid', '==', uid),
      where('used', '==', false)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log('✅ No pending verification codes found');
      return { hasPendingCode: false };
    }

    const validCodes = snapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          uid: data.uid as string,
          email: data.email as string,
          code: data.code as string,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          expiresAt: data.expiresAt?.toDate?.() || new Date(),
          used: data.used as boolean
        };
      })
      .filter(data => {
        const isExpired = data.expiresAt < new Date();
        return !isExpired;
      })
      .sort((a, b) => b.expiresAt.getTime() - a.expiresAt.getTime());

    if (validCodes.length === 0) {
      console.log('✅ No active (non-expired) verification codes found');
      return { hasPendingCode: false };
    }

    const latestCode = validCodes[0];
    console.log('✅ Found pending verification code, expires at:', latestCode.expiresAt);

    return {
      hasPendingCode: true,
      email: latestCode.email,
      expiresAt: latestCode.expiresAt
    };

  } catch (error: any) {
    console.error('❌ Error checking pending verification codes:', error);
    return {
      hasPendingCode: false,
      error: error.message
    };
  }
};

/**
 * Send 2FA code via Vercel
 */
export const send2FACode = async (email: string, uid: string, userName?: string): Promise<void> => {
  try {
    console.log('📧 Sending 2FA code to:', email);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const db = getDb();
    
    await addDoc(collection(db, '2fa_codes'), {
      uid,
      email,
      code,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      used: false
    });

    console.log('✅ 2FA code stored in Firestore');

    // ⭐ SAME VERCEL CALL AS settingService
    console.log('🚀 Calling Vercel API...');
    console.log('📧 Target email:', email);
    console.log('🔢 Code:', code);

    const response = await fetch('https://email-backend-five-phi.vercel.app/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        code: code,
        userName: userName || 'User',
        emailType: '2fa'
      })
    });

    console.log('📬 Response status:', response.status);
    const responseText = await response.text();
    console.log('📬 Response body:', responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Response is not valid JSON');
      throw new Error('Email service returned invalid response');
    }

    if (!response.ok) {
      console.error('⚠️ Failed to send 2FA email:', result.error);
      throw new Error(result.error || 'Failed to send 2FA email');
    }

    console.log('✅ 2FA code sent via email successfully');

  } catch (error: any) {
    console.error('❌ Error in send2FACode:', error);
    throw new Error(error.message || 'Failed to send 2FA code');
  }
};

/**
 * Verify 2FA code
 */
export const verify2FACode = async (uid: string, inputCode: string): Promise<boolean> => {
  try {
    console.log('🔐 Verifying 2FA code for uid:', uid);

    const db = getDb();
    const q = query(
      collection(db, '2fa_codes'),
      where('uid', '==', uid),
      where('code', '==', inputCode.trim()),
      where('used', '==', false)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.error('❌ Invalid 2FA code');
      return false;
    }

    const codeDoc = snapshot.docs[0];
    const data = codeDoc.data();

    const expiresAt = data.expiresAt?.toDate();
    if (expiresAt && expiresAt < new Date()) {
      console.error('❌ 2FA code expired');
      await setDoc(codeDoc.ref, { used: true }, { merge: true });
      return false;
    }

    await setDoc(codeDoc.ref, { used: true }, { merge: true });
    console.log('✅ 2FA code verified');

    return true;
  } catch (error: any) {
    console.error('❌ Error verifying 2FA code:', error);
    throw new Error('Failed to verify 2FA code');
  }
};

/**
 * Send Welcome Email
 */
export const sendWelcomeEmail = async (email: string, userName: string): Promise<void> => {
  try {
    console.log('📧 Sending welcome email to:', email);

    // ⭐ SAME VERCEL CALL AS settingService
    const response = await fetch('https://email-backend-five-phi.vercel.app/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        userName: userName,
        emailType: 'welcome',
        templateParams: {
          activationLink: `${process.env.EXPO_PUBLIC_APP_URL || 'https://motosphere.app'}/activate`
        }
      })
    });

    const responseText = await response.text();
    let result;
    
    try {
      result = JSON.parse(responseText);
    } catch {
      console.error('⚠️ Welcome email response not JSON');
      return;
    }

    if (!response.ok) {
      console.error('⚠️ Failed to send welcome email:', result.error);
      return;
    }

    console.log('✅ Welcome email sent');
  } catch (error: any) {
    console.error('⚠️ Error sending welcome email:', error.message);
  }
};

/**
 * ⭐ Register user only AFTER email verification
 */
export const registerUser = async (
  name: string,
  email: string,
  password: string,
  contactNo: string,
  role: UserRole
): Promise<{ uid: string; verificationEmailSent: boolean }> => {
  if (!name?.trim()) throw new Error('Please enter your name');
  if (!email?.trim()) throw new Error('Please enter a valid email');
  if (!contactNo?.trim()) throw new Error('Please enter a valid contact number');
  if (password.length < 6) throw new Error('Password must be at least 6 characters');

  try {
    const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const db = getDb();
    const normalizedEmail = email.toLowerCase().trim();

    await setDoc(doc(db, 'users', user.uid), {
      name,
      email: normalizedEmail,
      contactNo,
      role,
      deviceId: 'None',
      emailVerified: true,
      createdAt: new Date().toISOString(),
      provider: 'email'
    });

    saveToken(user.uid);
    console.log('✅ User registered:', user.uid);

    try {
      const q = query(
        collection(db, 'preRegistrationVerifications'),
        where('email', '==', normalizedEmail),
        where('verified', '==', true)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        await setDoc(snapshot.docs[0].ref, { cleaned: true }, { merge: true });
        console.log('✅ Cleaned up pre-registration record');
      }
    } catch (cleanupError) {
      console.warn('⚠️ Could not cleanup pre-registration record:', cleanupError);
    }

    return { 
      uid: user.uid,
      verificationEmailSent: true
    };
  } catch (error: any) {
    console.error('❌ Register error:', error.code);
    throw new Error(getErrorMessage(error.code));
  }
};

/**
 * Regular email/password login with 2FA
 */
export const loginUser = async (
  email: string, 
  password: string,
  userName?: string
): Promise<{ uid: string; requiresTwoFA: boolean }> => {
  if (!email?.trim()) throw new Error('Please enter your email');
  if (!password?.trim()) throw new Error('Please enter your password');

  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log('✅ User authenticated:', user.uid);

    const db = getDb();
    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (userDoc.exists() && userDoc.data()?.emailVerified) {
      console.log('📧 Email verified - sending 2FA code');
      
      const firestoreEmail = userDoc.data()?.email || email;
      const userName_data = userName || userDoc.data()?.name;
      
      console.log('📧 Using Firestore email for 2FA:', firestoreEmail);
      
      await send2FACode(firestoreEmail, user.uid, userName_data);
      
      return { uid: user.uid, requiresTwoFA: true };
    } else {
      console.log('✅ Email not verified - skipping 2FA');
      
      await saveToken(user.uid);
      
      return { uid: user.uid, requiresTwoFA: false };
    }
  } catch (error: any) {
    console.error('❌ Login error:', error.code || error.message);
    throw new Error(getErrorMessage(error.code) || error.message || 'Login failed');
  }
};

/**
 * Complete login after 2FA verification
 */
export const completeTwoFactorLogin = async (uid: string, code: string): Promise<void> => {
  try {
    console.log('🔐 Completing 2FA login');

    const isValid = await verify2FACode(uid, code);

    if (!isValid) {
      throw new Error('Invalid or expired 2FA code');
    }

    await saveToken(uid);
    console.log('✅ 2FA login completed');
  } catch (error: any) {
    console.error('❌ 2FA completion error:', error);
    throw new Error(error.message || 'Failed to complete 2FA login');
  }
};

/**
 * Google Sign-In with email matching
 */
export const loginWithGoogle = async (idToken: string): Promise<{ uid: string; isNewUser: boolean }> => {
  try {
    console.log('🔵 Starting Google Sign-In...');

    if (!idToken) {
      throw new Error('No ID token provided');
    }

    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential: UserCredential = await signInWithCredential(auth, credential);
    const googleUser = userCredential.user;
    
    console.log('✅ Firebase sign-in successful, Google UID:', googleUser.uid);
    console.log('✅ Google Email:', googleUser.email);

    const db = getDb();
    const normalizedEmail = googleUser.email?.toLowerCase() || '';

    console.log('🔍 Checking if email exists in Firestore:', normalizedEmail);
    
    let existingUid: string | null = null;

    try {
      const emailQuery = query(
        collection(db, 'users'),
        where('email', '==', normalizedEmail)
      );
      const emailSnapshot = await getDocs(emailQuery);

      if (!emailSnapshot.empty) {
        existingUid = emailSnapshot.docs[0].id;
        console.log('✅ Found existing account with this email, UID:', existingUid);
        
        await saveToken(existingUid);
        
        return {
          uid: existingUid,
          isNewUser: false
        };
      }
    } catch (queryError: any) {
      console.warn('⚠️ Could not query existing emails:', queryError.message);
    }

    console.log('✅ Email not found, creating new account with Google UID');

    const userDocRef = doc(db, 'users', googleUser.uid);
    
    try {
      await setDoc(userDocRef, {
        name: googleUser.displayName || 'Google User',
        email: normalizedEmail,
        contactNo: '',
        role: 'rider',
        createdAt: new Date().toISOString(),
        provider: 'google',
        photoURL: googleUser.photoURL || null,
        emailVerified: true
      });
      
      console.log('✅ New Google user created:', googleUser.uid);
      
      await saveToken(googleUser.uid);

      return {
        uid: googleUser.uid,
        isNewUser: true
      };

    } catch (docError: any) {
      console.error('⚠️ Error creating user document:', docError.message);
      
      await saveToken(googleUser.uid);
      
      return {
        uid: googleUser.uid,
        isNewUser: true
      };
    }
    
  } catch (error: any) {
    console.error('❌ Google login error:', error.message);

    let errorMessage = 'Google login failed. ';

    switch (error.code) {
      case 'auth/invalid-credential':
        errorMessage += 'Invalid Google credentials.';
        break;
      case 'auth/network-request-failed':
        errorMessage += 'Network error. Check your connection.';
        break;
      case 'auth/user-disabled':
        errorMessage += 'This account has been disabled.';
        break;
      case 'auth/operation-not-allowed':
        errorMessage += 'Google Sign-In is not enabled.';
        break;
      default:
        errorMessage += error.message || 'Please try again.';
    }

    throw new Error(errorMessage);
  }
};