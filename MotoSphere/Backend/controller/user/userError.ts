// Backend/controller/user/userError.ts

/**
 * Maps Firebase error codes to user-friendly messages
 */
export const getUserFriendlyError = (error: any): string => {
  const errorCode = error?.code || '';
  const errorMessage = error?.message || '';

  // Authentication Errors
  switch (errorCode) {
    // Password errors
    case 'auth/wrong-password':
      return 'The password you entered is incorrect. Please try again.';
    
    case 'auth/weak-password':
      return 'Password must be at least 8 characters with 1 uppercase letter, 1 number, and 1 symbol.';
    
    // Email errors
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please use a different email or try logging in.';
    
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    
    case 'auth/user-not-found':
      return 'No account found with this email. Please check your email or create a new account.';
    
    // Account errors
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support for assistance.';
    
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method.';
    
    // Session errors
    case 'auth/requires-recent-login':
      return 'For security reasons, please log out and log back in to continue.';
    
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later or reset your password.';
    
    // Network errors
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.';
    
    case 'auth/timeout':
      return 'Request timed out. Please check your connection and try again.';
    
    // Token errors
    case 'auth/invalid-credential':
      return 'Invalid credentials. Please check your email and password.';
    
    case 'auth/credential-already-in-use':
      return 'This credential is already associated with a different account.';
    
    // Email verification errors
    case 'auth/invalid-action-code':
      return 'This verification link has expired or is invalid. Please request a new one.';
    
    case 'auth/expired-action-code':
      return 'This verification link has expired. Please request a new verification email.';
    
    // Firestore errors
    case 'permission-denied':
      return 'You do not have permission to perform this action.';
    
    case 'not-found':
      return 'The requested data was not found.';
    
    case 'already-exists':
      return 'This data already exists.';
    
    case 'resource-exhausted':
      return 'Service is temporarily unavailable. Please try again later.';
    
    case 'failed-precondition':
      return 'Operation cannot be completed in the current state.';
    
    case 'aborted':
      return 'Operation was aborted. Please try again.';
    
    case 'out-of-range':
      return 'Invalid input value provided.';
    
    case 'unimplemented':
      return 'This feature is not yet available.';
    
    case 'internal':
      return 'An internal error occurred. Please try again later.';
    
    case 'unavailable':
      return 'Service is currently unavailable. Please try again later.';
    
    case 'data-loss':
      return 'Data loss detected. Please contact support.';
    
    case 'unauthenticated':
      return 'Please log in to continue.';
    
    // Default fallback
    default:
      // If we have a custom error message, use it
      if (errorMessage && !errorMessage.includes('Firebase')) {
        return errorMessage;
      }
      
      // Generic fallback
      return 'An unexpected error occurred. Please try again.';
  }
};

/**
 * Validates password strength
 */
export const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }
  
  if (password.length > 15) {
    return { valid: false, error: 'Password must not exceed 15 characters' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  
  if (!/[!@#$%^&*()_+\[\]{};':"\\|,.<>\/?~-]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character' };
  }
  
  return { valid: true };
};

/**
 * Validates email format
 */
export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email) {
    return { valid: false, error: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }
  
  return { valid: true };
};

/**
 * Validates phone number (Philippine format)
 */
export const validatePhoneNumber = (phone: string): { valid: boolean; error?: string } => {
  if (!phone) {
    return { valid: false, error: 'Phone number is required' };
  }
  
  const digits = phone.replace(/\D/g, '');
  
  if (!/^09\d{9}$/.test(digits)) {
    return { valid: false, error: 'Phone number must start with 09 and be 11 digits long' };
  }
  
  return { valid: true };
};

/**
 * Validates full name
 */
export const validateFullName = (name: string): { valid: boolean; error?: string } => {
  if (!name || !name.trim()) {
    return { valid: false, error: 'Full name is required' };
  }
  
  if (name.trim().length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters long' };
  }
  
  if (name.trim().length > 50) {
    return { valid: false, error: 'Name must not exceed 50 characters' };
  }
  
  return { valid: true };
};