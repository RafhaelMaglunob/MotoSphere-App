// Backend/controller/auth/authService.ts
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

const VERCEL_EMAIL_API = 'https://email-backend-five-phi.vercel.app/api/send-email';

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
 * Send verification email to new user (similar to sendVerificationEmail but for registration)
 * ⭐ Used during registration to auto-send verification
 */
export const sendVerificationEmailToNewUser = async (
  email: string,
  uid: string,
  userName: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('📧 Sending verification email to new user:', email);

    const db = getDb();
    
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store code in Firestore with expiration
    await addDoc(collection(db, 'verificationCodes'), {
      uid: uid,
      email: email.toLowerCase(),
      code: code,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      used: false
    });

    console.log('✅ Verification code stored in Firestore');

    // Call Vercel API to send email
    console.log('🚀 Calling Vercel API to send verification email...');
    console.log('📧 Target email:', email.toLowerCase());
    console.log('🔢 Code:', code);

    const response = await fetch(VERCEL_EMAIL_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.toLowerCase(),
        code: code,
        userName: userName,
        emailType: 'verification'
      })
    });

    console.log('📬 Response status:', response.status);
    const responseText = await response.text();
    console.log('📬 Response body:', responseText);

    // Try to parse as JSON
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
 * ⭐ Used to auto-show verification modal if code exists
 * ✅ FIXED: Proper type handling for email property
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

    // ✅ FIXED: Explicitly map all fields to ensure types are correct
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
 * Send 2FA code via Vercel Email Handler
 */
export const send2FACode = async (email: string, uid: string, userName?: string): Promise<void> => {
  try {
    console.log('📧 Sending 2FA code to:', email);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const db = getDb();
    
    addDoc(collection(db, '2fa_codes'), {
      uid,
      email,
      code,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      used: false
    });

    console.log('✅ 2FA code stored in Firestore');

    try {
      console.log('📤 Calling Vercel API:', VERCEL_EMAIL_API);
      
      const response = await fetch(VERCEL_EMAIL_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          code: code,
          userName: userName || 'User',
          emailType: '2fa'
        })
      });

      console.log('📬 Response Status:', response.status);
      const responseText = await response.text();

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
    } catch (emailError: any) {
      console.error('⚠️ Email sending error:', emailError.message);
      throw new Error(`Failed to send 2FA code: ${emailError.message}`);
    }
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

    const response = await fetch(VERCEL_EMAIL_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
 * Regular email/password registration with automatic verification email
 * ⭐ NEW: Automatically sends verification email to new user
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

    await setDoc(doc(db, 'users', user.uid), {
      name,
      email: email.toLowerCase(),
      contactNo,
      role,
      deviceId: 'None',
      emailVerified: false,
      createdAt: new Date().toISOString(),
      provider: 'email'
    });

    saveToken(user.uid);
    console.log('✅ User registered:', user.uid);

    // ⭐ AUTOMATICALLY SEND VERIFICATION EMAIL
    let verificationEmailSent = false;
    try {
      console.log('📧 Auto-sending verification email to new user...');
      const emailResult = await sendVerificationEmailToNewUser(
        email.toLowerCase(),
        user.uid,
        name
      );
      
      if (emailResult.success) {
        verificationEmailSent = true;
        console.log('✅ Verification email sent successfully');
      } else {
        console.error('⚠️ Failed to send verification email:', emailResult.error);
        // Don't fail registration if email fails - user is still created
      }
    } catch (emailError: any) {
      console.error('⚠️ Error sending verification email (non-blocking):', emailError.message);
      // Don't throw - registration should succeed even if email fails
    }

    return { 
      uid: user.uid,
      verificationEmailSent
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
      
      // ⭐ IMPROVEMENT: Use email from Firestore (user's actual current email)
      // This ensures 2FA goes to the right place even if they changed their email
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
 * ⭐ If email exists, return that account's UID (don't update anything)
 * If email doesn't exist, create new account with Google UID
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

    // ⭐ Step 1: Check if this email already exists in database
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
        
        // ⭐ Return existing account's UID - user will login as that account
        await saveToken(existingUid);
        
        return {
          uid: existingUid,  // ← Use existing account's UID
          isNewUser: false
        };
      }
    } catch (queryError: any) {
      console.warn('⚠️ Could not query existing emails:', queryError.message);
      // Continue to create new account
    }

    // ⭐ Step 2: No existing email found - create new account with Google UID
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
      
      // Even if document fails, return UID (user authenticated in Firebase Auth)
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