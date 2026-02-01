// Backend/controller/auth/firebasePhoneAuth.ts
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

let confirmationResult: FirebaseAuthTypes.ConfirmationResult | null = null;

// Format phone to +63XXXXXXXXXX
function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  
  // Validate phone number length
  if (digits.length < 10 || digits.length > 11) {
    throw new Error('Phone number must be 10 or 11 digits');
  }
  
  if (digits.startsWith('09')) {
    return `+63${digits.slice(1)}`;
  }
  if (digits.startsWith('63')) {
    return `+${digits}`;
  }
  
  // If it's 10 digits, assume it's without leading 0
  if (digits.length === 10) {
    return `+63${digits}`;
  }
  
  return `+63${digits}`;
}

// Validate phone number format
function validatePhoneNumber(phone: string): { valid: boolean; error?: string } {
  if (!phone || phone.trim() === '') {
    return { valid: false, error: 'Phone number is required' };
  }

  const digits = phone.replace(/\D/g, '');
  
  // Check if it's a valid Philippine number
  if (!digits.startsWith('09') && !digits.startsWith('63')) {
    return { valid: false, error: 'Phone number must start with 09 or 63' };
  }
  
  // Check length
  if (digits.startsWith('09') && digits.length !== 11) {
    return { valid: false, error: 'Phone number must be 11 digits (09XXXXXXXXX)' };
  }
  
  if (digits.startsWith('63') && digits.length !== 12) {
    return { valid: false, error: 'Phone number must be 12 digits (63XXXXXXXXXX)' };
  }
  
  return { valid: true };
}

// Send code - Firebase sends real SMS
export const sendPhoneVerificationCode = async (phoneNumber: string): Promise<void> => {
  try {
    // Validate phone number first
    const validation = validatePhoneNumber(phoneNumber);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const formatted = formatPhone(phoneNumber);
    console.log('📱 Sending SMS to:', formatted);

    // Firebase automatically sends SMS
    confirmationResult = await auth().signInWithPhoneNumber(formatted);
    
    if (!confirmationResult) {
      throw new Error('Failed to send verification code. Please try again.');
    }
    
    console.log('✅ SMS sent successfully');
  } catch (error: any) {
    console.error('❌ SMS Error:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'auth/invalid-phone-number') {
      throw new Error('Invalid phone number format. Please check and try again.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many attempts detected. Please wait 24 hours or use a different device.');
    } else if (error.code === 'auth/quota-exceeded') {
      throw new Error('SMS quota exceeded. Please contact support or try again tomorrow.');
    } else if (error.code === 'auth/user-disabled') {
      throw new Error('This account has been disabled. Please contact support.');
    } else if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Phone authentication is not enabled. Please contact support.');
    } else if (error.code === 'auth/missing-phone-number') {
      throw new Error('Phone number is required.');
    } else if (error.code === 'auth/captcha-check-failed') {
      throw new Error('reCAPTCHA verification failed. Please try again.');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your connection and try again.');
    } else if (error.message) {
      // If it's already our custom error, throw it as is
      throw new Error(error.message);
    }
    
    // Generic error
    throw new Error('Failed to send verification code. Please try again later.');
  }
};

// Verify code
export const verifyPhoneCode = async (code: string): Promise<{ 
  success: boolean; 
  uid: string; 
  phoneNumber: string | null 
}> => {
  try {
    // Validate code input
    if (!code || code.trim() === '') {
      throw new Error('Verification code is required');
    }
    
    if (code.length !== 6) {
      throw new Error('Verification code must be 6 digits');
    }
    
    if (!/^\d{6}$/.test(code)) {
      throw new Error('Verification code must contain only numbers');
    }

    if (!confirmationResult) {
      throw new Error('No verification in progress. Please request a new code.');
    }

    console.log('🔐 Verifying code...');
    const userCredential = await confirmationResult.confirm(code);
    
    // Add null check
    if (!userCredential || !userCredential.user) {
      throw new Error('Verification failed - no user returned. Please try again.');
    }
    
    // Clear confirmation result after successful verification
    confirmationResult = null;
    console.log('✅ Phone verified successfully');

    return {
      success: true,
      uid: userCredential.user.uid,
      phoneNumber: userCredential.user.phoneNumber
    };
  } catch (error: any) {
    console.error('❌ Verification Error:', error);

    // Handle specific Firebase errors
    if (error.code === 'auth/invalid-verification-code') {
      throw new Error('Invalid verification code. Please check and try again.');
    } else if (error.code === 'auth/code-expired') {
      confirmationResult = null; // Clear expired confirmation
      throw new Error('Verification code expired. Please request a new one.');
    } else if (error.code === 'auth/session-expired') {
      confirmationResult = null;
      throw new Error('Session expired. Please request a new verification code.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many failed attempts. Please wait before trying again.');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your connection and try again.');
    } else if (error.message) {
      // If it's already our custom error, throw it as is
      throw new Error(error.message);
    }
    
    // Generic error
    throw new Error('Verification failed. Please try again.');
  }
};

// Resend code
export const resendPhoneCode = async (phoneNumber: string): Promise<void> => {
  try {
    // Validate before resending
    const validation = validatePhoneNumber(phoneNumber);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Clear previous confirmation
    confirmationResult = null;
    
    // Send new code
    await sendPhoneVerificationCode(phoneNumber);
    console.log('✅ Verification code resent successfully');
  } catch (error: any) {
    console.error('❌ Resend Error:', error);
    
    if (error.message) {
      throw error;
    }
    
    throw new Error('Failed to resend verification code. Please try again.');
  }
};

// Cancel verification
export const cancelPhoneVerification = (): void => {
  confirmationResult = null;
  console.log('🚫 Phone verification cancelled');
};

// Check if there's an active verification session
export const hasActiveVerification = (): boolean => {
  return confirmationResult !== null;
};

// Export validation function for use in UI
export const isValidPhoneNumber = (phone: string): boolean => {
  return validatePhoneNumber(phone).valid;
};