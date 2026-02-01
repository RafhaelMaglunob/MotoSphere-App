// Backend/controller/user/passwordResetService.ts

import { 
  confirmPasswordReset,
  sendPasswordResetEmail as firebaseSendPasswordReset,
  verifyPasswordResetCode
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, getDb, functions } from "../../firebase";
import { getUserCache, setUserCache } from "../cache/userCache";

/**
 * Generate a secure reset token
 */
const generateResetToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Request password reset - sends email with reset link
 */
export const requestPasswordReset = async (
  email: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🔐 Password reset requested for:', email);

    const db = getDb();
    
    // Check if user exists
    const usersRef = collection(db, 'users');
    const userQuery = query(usersRef, where('email', '==', email));
    const userSnapshot = await getDocs(userQuery);
    
    if (userSnapshot.empty) {
      // Don't reveal if email exists for security
      console.log('⚠️ Email not found, but returning success for security');
      return { success: true };
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    const uid = userDoc.id;

    // Generate reset token
    const resetToken = generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token in Firestore
    const resetRef = doc(db, 'passwordResets', uid);
    await setDoc(resetRef, {
      email: email,
      token: resetToken,
      expiresAt: expiresAt.toISOString(),
      used: false,
      createdAt: new Date().toISOString()
    });

    console.log('✅ Reset token stored in Firestore');

    // Send reset email via Cloud Function
    const sendResetEmailFunction = httpsCallable(functions, 'sendPasswordResetEmail');
    await sendResetEmailFunction({
      email: email,
      fullname: userData.name || userData.fullName || 'User',
      resetToken: resetToken,
      userType: userData.role || 'user' // 'admin', 'employee', or 'user'
    });

    console.log('✅ Password reset email sent');
    return { success: true };

  } catch (error: any) {
    console.error('❌ Error requesting password reset:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send reset email' 
    };
  }
};

/**
 * Verify reset token validity
 */
export const verifyResetToken = async (
  token: string
): Promise<{ 
  success: boolean; 
  uid?: string;
  email?: string;
  error?: string 
}> => {
  try {
    console.log('🔍 Verifying reset token');

    const db = getDb();
    
    // Find reset document with this token
    const resetsRef = collection(db, 'passwordResets');
    const tokenQuery = query(resetsRef, where('token', '==', token));
    const tokenSnapshot = await getDocs(tokenQuery);

    if (tokenSnapshot.empty) {
      return { success: false, error: 'Invalid or expired reset link' };
    }

    const resetDoc = tokenSnapshot.docs[0];
    const resetData = resetDoc.data();
    const uid = resetDoc.id;

    // Check if already used
    if (resetData.used) {
      return { success: false, error: 'This reset link has already been used' };
    }

    // Check if expired
    const expiresAt = new Date(resetData.expiresAt);
    if (new Date() > expiresAt) {
      // Clean up expired token
      await deleteDoc(doc(db, 'passwordResets', uid));
      return { success: false, error: 'Reset link has expired. Please request a new one.' };
    }

    console.log('✅ Reset token is valid');
    return { 
      success: true, 
      uid: uid,
      email: resetData.email 
    };

  } catch (error: any) {
    console.error('❌ Error verifying reset token:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to verify reset token' 
    };
  }
};

/**
 * Reset password using token
 */
export const resetPasswordWithToken = async (
  token: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🔐 Resetting password with token');

    // Verify token first
    const verification = await verifyResetToken(token);
    if (!verification.success || !verification.uid) {
      return { 
        success: false, 
        error: verification.error || 'Invalid reset token' 
      };
    }

    const uid = verification.uid;
    const email = verification.email!;

    const db = getDb();

    // Get user document
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();

    // Update password in Firebase Auth using Cloud Function
    // (Direct password update requires admin SDK in Cloud Functions)
    const updatePasswordFunction = httpsCallable(functions, 'updateUserPassword');
    await updatePasswordFunction({
      uid: uid,
      newPassword: newPassword
    });

    console.log('✅ Password updated in Firebase Auth');

    // Update lastChangePass timestamp
    const now = new Date().toISOString();
    await updateDoc(userRef, {
      lastChangePass: now,
    });

    console.log('✅ Password change timestamp updated');

    // Mark token as used
    const resetRef = doc(db, 'passwordResets', uid);
    await updateDoc(resetRef, {
      used: true,
      usedAt: now
    });

    // Send confirmation email
    try {
      const sendConfirmationFunction = httpsCallable(functions, 'sendPasswordChangedEmail');
      await sendConfirmationFunction({
        email: email,
        fullname: userData.name || userData.fullName || 'User'
      });
      console.log('✅ Password change confirmation email sent');
    } catch (emailError) {
      console.warn('⚠️ Failed to send confirmation email:', emailError);
      // Don't fail the password reset if email fails
    }

    // Update cache
    const cached = await getUserCache(uid);
    if (cached) {
      const updatedUser = {
        ...cached.userData,
        lastChangePass: now
      };

      await setUserCache(uid, {
        userData: updatedUser,
        trustedContacts: cached.trustedContacts || []
      });
      console.log('✅ Cache updated');
    }

    // Clean up old reset tokens for this user
    setTimeout(async () => {
      try {
        await deleteDoc(resetRef);
        console.log('🧹 Cleaned up used reset token');
      } catch (cleanupError) {
        console.warn('⚠️ Failed to cleanup reset token:', cleanupError);
      }
    }, 5000);

    return { success: true };

  } catch (error: any) {
    console.error('❌ Error resetting password:', error);

    if (error.code === 'auth/weak-password') {
      return { success: false, error: 'Password is too weak. Use at least 6 characters.' };
    }

    return { 
      success: false, 
      error: error.message || 'Failed to reset password' 
    };
  }
};

/**
 * Cancel password reset (invalidate token)
 */
export const cancelPasswordReset = async (
  token: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const db = getDb();
    
    // Find and delete reset document
    const resetsRef = collection(db, 'passwordResets');
    const tokenQuery = query(resetsRef, where('token', '==', token));
    const tokenSnapshot = await getDocs(tokenQuery);

    if (!tokenSnapshot.empty) {
      const resetDoc = tokenSnapshot.docs[0];
      await deleteDoc(doc(db, 'passwordResets', resetDoc.id));
      console.log('✅ Reset token cancelled');
    }

    return { success: true };

  } catch (error: any) {
    console.error('❌ Error cancelling reset:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to cancel reset' 
    };
  }
};

/**
 * Clean up expired reset tokens (run periodically)
 */
export const cleanupExpiredResets = async (): Promise<void> => {
  try {
    const db = getDb();
    const now = new Date().toISOString();
    
    const resetsRef = collection(db, 'passwordResets');
    const expiredQuery = query(resetsRef, where('expiresAt', '<', now));
    const expiredSnapshot = await getDocs(expiredQuery);

    const deletePromises = expiredSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    console.log(`🧹 Cleaned up ${expiredSnapshot.size} expired reset tokens`);

  } catch (error) {
    console.error('❌ Error cleaning up expired resets:', error);
  }
};