import {
  doc,
  setDoc,
  getDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { getDb } from '../../firebase';

export interface PasswordResetResult {
  success: boolean;
  error?: string;
  token?: string;
  valid?: boolean;
}

/**
 * ⭐ Send password reset code
 */
export const sendPasswordResetCode = async (
  email: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('📧 Sending password reset code to:', email);

    const db = getDb();
    const normalizedEmail = email.toLowerCase().trim();

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store reset code
    await addDoc(collection(db, 'passwordResetCodes'), {
      email: normalizedEmail,
      code,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      used: false,
      verified: false,
    });

    console.log('✅ Password reset code stored');

    // ⭐ SAME VERCEL CALL AS settingService
    console.log('🚀 Calling Vercel API...');
    console.log('📧 Target email:', normalizedEmail);
    console.log('🔢 Code:', code);

    const response = await fetch('https://email-backend-five-phi.vercel.app/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: normalizedEmail,
        code,
        emailType: 'passwordReset'
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

    console.log('✅ Password reset email sent successfully');
    return { success: true };

  } catch (error: any) {
    console.error('❌ Error in sendPasswordResetCode:', error);
    return { success: false, error: error.message };
  }
};

/**
 * ⭐ Verify password reset code
 */
export const verifyPasswordResetCode = async (
  email: string,
  inputCode: string
): Promise<{ valid: boolean; token?: string; error?: string }> => {
  try {
    console.log('🔐 Verifying password reset code...');

    const db = getDb();
    const normalizedEmail = email.toLowerCase().trim();

    const resetQuery = query(
      collection(db, 'passwordResetCodes'),
      where('email', '==', normalizedEmail),
      where('code', '==', inputCode.trim()),
      where('used', '==', false)
    );

    const snapshot = await getDocs(resetQuery);

    if (snapshot.empty) {
      return { valid: false, error: 'Invalid or expired code' };
    }

    const resetDoc = snapshot.docs[0];
    const resetData = resetDoc.data();

    const expiresAt = resetData.expiresAt?.toDate?.();
    if (expiresAt && expiresAt < new Date()) {
      await setDoc(resetDoc.ref, { used: true }, { merge: true });
      return { valid: false, error: 'Code expired' };
    }

    await setDoc(resetDoc.ref, { verified: true }, { merge: true });

    return { valid: true, token: resetDoc.id };
  } catch (error: any) {
    console.error('❌ Verify error:', error);
    return { valid: false, error: error.message };
  }
};

/**
 * ⭐ Complete password reset
 */
export const resetPassword = async (
  email: string,
  token: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🔐 Resetting password...');

    const db = getDb();
    const normalizedEmail = email.toLowerCase().trim();

    const resetRef = doc(db, 'passwordResetCodes', token);
    const resetSnap = await getDoc(resetRef);

    if (!resetSnap.exists()) {
      return { success: false, error: 'Invalid reset token' };
    }

    const resetData = resetSnap.data();

    if (
      resetData.email !== normalizedEmail ||
      !resetData.verified ||
      resetData.used
    ) {
      return { success: false, error: 'Invalid reset request' };
    }

    const expiresAt = resetData.expiresAt?.toDate?.();
    if (expiresAt && expiresAt < new Date()) {
      return { success: false, error: 'Code expired' };
    }

    await setDoc(
      resetRef,
      { used: true, usedAt: new Date().toISOString() },
      { merge: true }
    );

    console.log('✅ Password reset completed');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Reset error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * ⭐ Send email change verification code
 */
export const sendEmailChangeVerification = async (
  newEmail: string,
  userName: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('📧 Sending email change verification to:', newEmail);

    const db = getDb();
    const normalizedEmail = newEmail.toLowerCase().trim();

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store verification code
    await addDoc(collection(db, 'emailChangeVerifications'), {
      newEmail: normalizedEmail,
      code,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      used: false,
      verified: false,
    });

    console.log('✅ Email change code stored');

    // ⭐ SAME VERCEL CALL AS settingService
    console.log('🚀 Calling Vercel API...');
    console.log('📧 Target email:', normalizedEmail);
    console.log('🔢 Code:', code);

    const response = await fetch('https://email-backend-five-phi.vercel.app/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: normalizedEmail,
        code,
        userName,
        emailType: 'emailChange'
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

    console.log('✅ Email change verification sent');
    return { success: true };

  } catch (error: any) {
    console.error('❌ Error in sendEmailChangeVerification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * ⭐ Verify email change code
 */
export const verifyEmailChangeCode = async (
  newEmail: string,
  inputCode: string
): Promise<{ valid: boolean; token?: string; error?: string }> => {
  try {
    console.log('🔐 Verifying email change code...');

    const db = getDb();
    const normalizedEmail = newEmail.toLowerCase().trim();

    const q = query(
      collection(db, 'emailChangeVerifications'),
      where('newEmail', '==', normalizedEmail),
      where('code', '==', inputCode.trim()),
      where('used', '==', false)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { valid: false, error: 'Invalid or expired code' };
    }

    const codeDoc = snapshot.docs[0];
    const codeData = codeDoc.data();

    const expiresAt = codeData.expiresAt?.toDate?.();
    if (expiresAt && expiresAt < new Date()) {
      await setDoc(codeDoc.ref, { used: true }, { merge: true });
      return { valid: false, error: 'Code expired' };
    }

    await setDoc(codeDoc.ref, { verified: true }, { merge: true });
    console.log('✅ Email change code verified');

    return { valid: true, token: codeDoc.id };
  } catch (error: any) {
    console.error('❌ Verify error:', error);
    return { valid: false, error: error.message };
  }
};

/**
 * ⭐ Complete email change
 */
export const completeEmailChange = async (
  uid: string,
  oldEmail: string,
  newEmail: string,
  token: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🔄 Completing email change...');

    const db = getDb();
    const normalizedNewEmail = newEmail.toLowerCase().trim();
    const normalizedOldEmail = oldEmail.toLowerCase().trim();

    const changeRef = doc(db, 'emailChangeVerifications', token);
    const changeSnap = await getDoc(changeRef);

    if (!changeSnap.exists()) {
      return { success: false, error: 'Invalid token' };
    }

    const changeData = changeSnap.data();

    if (
      changeData.newEmail !== normalizedNewEmail ||
      !changeData.verified ||
      changeData.used
    ) {
      return { success: false, error: 'Invalid request' };
    }

    const expiresAt = changeData.expiresAt?.toDate?.();
    if (expiresAt && expiresAt < new Date()) {
      return { success: false, error: 'Code expired' };
    }

    // Update user email in Firestore
    const userRef = doc(db, 'users', uid);
    await setDoc(
      userRef,
      { email: normalizedNewEmail, updatedAt: new Date().toISOString() },
      { merge: true }
    );

    // Mark code as used
    await setDoc(
      changeRef,
      { used: true, usedAt: new Date().toISOString() },
      { merge: true }
    );

    console.log('✅ Email change completed');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Email change error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * ⭐ Validate password strength
 */
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) errors.push('Password must be at least 8 characters');
  if (password.length > 15) errors.push('Password must be no more than 15 characters');
  if (!/[A-Z]/.test(password)) errors.push('Must include uppercase letter');
  if (!/[0-9]/.test(password)) errors.push('Must include number');
  if (!/[!@#$%^&*()_+\[\]{};':"\\|,.<>\/?~-]/.test(password))
    errors.push('Must include symbol');

  return { isValid: errors.length === 0, errors };
};