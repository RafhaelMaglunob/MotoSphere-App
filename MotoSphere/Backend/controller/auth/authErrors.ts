export const getErrorMessage = (errorCode: string): string => {
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