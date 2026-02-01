// Create this file: types/google-signin.d.ts
// This extends the Google Sign-In types to include idToken

declare module '@react-native-google-signin/google-signin' {
  export interface GoogleSigninUser {
    idToken: string | null;
    serverAuthCode: string | null;
    scopes?: string[];
    user: {
      email: string;
      id: string;
      givenName: string | null;
      familyName: string | null;
      photo: string | null;
      name: string | null;
    };
  }

  export interface SignInSuccessResponse {
    type: 'success';
    data: GoogleSigninUser;
  }

  export interface SignInCancelledResponse {
    type: 'cancelled';
  }

  export type SignInResponse = SignInSuccessResponse | SignInCancelledResponse;

  export const GoogleSignin: {
    configure: (options: {
      webClientId: string;
      offlineAccess?: boolean;
      forceCodeForRefreshToken?: boolean;
      accountName?: string;
      scopes?: string[];
    }) => void;
    hasPlayServices: (options?: { showPlayServicesUpdateDialog?: boolean }) => Promise<boolean>;
    signIn: () => Promise<SignInResponse>;
    signInSilently: () => Promise<GoogleSigninUser>;
    signOut: () => Promise<null>;
    revokeAccess: () => Promise<null>;
    isSignedIn: () => Promise<boolean>;
    getCurrentUser: () => Promise<GoogleSigninUser | null>;
    getTokens: () => Promise<{ idToken: string; accessToken: string }>;
  };

  export const statusCodes: {
    SIGN_IN_CANCELLED: string;
    IN_PROGRESS: string;
    PLAY_SERVICES_NOT_AVAILABLE: string;
  };

  export class GoogleAuthProvider {
    static credential(idToken: string | null, accessToken?: string | null): any;
  }
}