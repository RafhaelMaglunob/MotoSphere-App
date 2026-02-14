// app/Login.tsx (OPTIMIZED - MUCH FASTER GOOGLE LOGIN)
import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  ImageBackground,
  Pressable,
  Image,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { useExitConfirmation } from '../components/navigation/BackButtonHandler';

import {
  loginUser,
  loginWithGoogle,
  completeTwoFactorLogin,
} from '../Backend/controller/auth/authService';

const extra = Constants.expoConfig?.extra as {
  WEB_CLIENT_ID: string;
};

try {
  if (!extra?.WEB_CLIENT_ID) {
    console.error('❌ WEB_CLIENT_ID is not configured!');
  } else {
    GoogleSignin.configure({
      webClientId: extra.WEB_CLIENT_ID,
      offlineAccess: true,
    });
    console.log('✅ GoogleSignin configured with Web Client ID');
  }
} catch (error) {
  console.error('❌ Error configuring GoogleSignin:', error);
}

export default function Login() {
  useExitConfirmation();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [pendingGoogleAuth, setPendingGoogleAuth] = useState<string | null>(null);
  const [googleIsNewUser, setGoogleIsNewUser] = useState(false);

  // 2FA States
  const [show2FA, setShow2FA] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [pendingUID, setPendingUID] = useState<string | null>(null);
  const [twoFAError, setTwoFAError] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    console.log('🔍 Login Component Mounted');
    console.log('🔍 WEB_CLIENT_ID:', extra?.WEB_CLIENT_ID ? 'Configured ✅' : 'Missing ❌');
  }, []);

  // =========================
  // Email + Password Login
  // =========================
  const handleLogin = async () => {
    if (loading) return;

    setError('');

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);

    try {
      const { uid, requiresTwoFA } = await loginUser(email, password);

      if (requiresTwoFA) {
        setPendingUID(uid);
        setTwoFACode('');
        setTwoFAError('');
        setShow2FA(true);
        console.log('📧 2FA code sent to:', email);
      } else {
        router.replace({ pathname: '/(tabs)/MainLayout', params: { uid } });
      }
    } catch (err: any) {
      console.error('❌ Login failed:', err.message);
      setError(err.message || 'Login failed. Please try again');
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // 2FA Verification
  // =========================
  const handle2FAVerification = async () => {
    if (!pendingUID) return;

    if (!twoFACode.trim()) {
      setTwoFAError('Please enter the 6-digit code');
      return;
    }

    if (twoFACode.length !== 6) {
      setTwoFAError('Code must be 6 digits');
      return;
    }

    setTwoFALoading(true);
    setTwoFAError('');

    try {
      await completeTwoFactorLogin(pendingUID, twoFACode);
      router.replace({ pathname: '/(tabs)/MainLayout', params: { uid: pendingUID } });
    } catch (err: any) {
      console.error('❌ 2FA verification failed:', err.message);
      setTwoFAError(err.message || 'Invalid code. Please try again.');
    } finally {
      setTwoFALoading(false);
    }
  };

  const handle2FAClose = () => {
    setShow2FA(false);
    setPendingUID(null);
    setTwoFACode('');
    setTwoFAError('');
  };

  // =========================
  // Google Sign-In (OPTIMIZED)
  // =========================
  const handleGoogleSignIn = async () => {
    setError('');

    if (!extra?.WEB_CLIENT_ID) {
      setError('Google Sign-In is not configured. Please check your app configuration.');
      return;
    }

    if (loading) return; // Prevent multiple clicks
    setLoading(true);

    try {
      console.log('🔵 Starting Google Sign-In...');

      // Sign out from any previous session (non-blocking)
      try {
        await GoogleSignin.signOut();
      } catch (e) {
        console.log('ℹ️ No previous session');
      }

      // Check play services
      await GoogleSignin.hasPlayServices();

      // Sign in
      console.log('📱 Initiating Google sign-in...');
      const response = await GoogleSignin.signIn();

      if (response.type !== 'success') {
        setError('Sign-in was cancelled');
        setLoading(false);
        return;
      }

      const idToken = response.data.idToken;

      if (!idToken) {
        console.error('❌ No ID token in response');
        setError('Failed to get authentication token');
        setLoading(false);
        return;
      }

      console.log('✅ ID Token received, signing in...');

      // ⚡ OPTIMIZATION: Sign in directly without email existence check
      // The backend will handle new vs existing users automatically
      await completeGoogleSignInDirect(idToken);

    } catch (err: any) {
      console.error('❌ Google Sign-In Error:', err);
      setLoading(false);

      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('ℹ️ Sign-in was cancelled by user');
        // Don't show error if user cancelled
      } else if (err.code === statusCodes.IN_PROGRESS) {
        setError('Sign-in already in progress');
      } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setError('Google Play Services not available');
      } else {
        setError(err.message || 'Google Sign-In failed. Please try again.');
      }
    }
  };

  // ⚡ OPTIMIZED: Direct sign-in without email check
  const completeGoogleSignInDirect = async (idToken: string) => {
    try {
      console.log('🔵 Completing Google Sign-In...');

      const { uid, isNewUser } = await loginWithGoogle(idToken);

      console.log('✅ Google login successful, UID:', uid);
      console.log('📊 Is new user:', isNewUser);

      // If new user, show Terms modal
      if (isNewUser) {
        console.log('📋 Showing Terms modal for new user');
        setPendingGoogleAuth(idToken);
        setGoogleIsNewUser(true);
        setShowTerms(true);
        setLoading(false);
      } else {
        // Existing user - go directly to app
        console.log('✅ Existing user - navigating to MainLayout');
        router.replace({ pathname: '/(tabs)/MainLayout', params: { uid } });
      }
    } catch (err: any) {
      console.error('❌ Google Login failed:', err);
      setError(err.message || 'Google login failed. Please try again');
      setLoading(false);
    }
  };

  const handleTermsAccept = async () => {
    setShowTerms(false);
    setLoading(true);

    try {
      if (!pendingGoogleAuth) {
        throw new Error('No pending auth token');
      }

      const { uid } = await loginWithGoogle(pendingGoogleAuth);
      console.log('✅ New user terms accepted, navigating...');
      router.replace({ pathname: '/(tabs)/MainLayout', params: { uid } });
    } catch (err: any) {
      console.error('❌ Error completing Google sign-in:', err);
      setError(err.message || 'Failed to complete sign-in');
      setLoading(false);
      setPendingGoogleAuth(null);
    }
  };

  const handleTermsDecline = async () => {
    setShowTerms(false);
    setPendingGoogleAuth(null);
    setGoogleIsNewUser(false);
    setError('You must accept the terms to continue');

    try {
      await GoogleSignin.signOut();
      console.log('✅ Signed out after declining terms');
    } catch (e) {
      console.log('ℹ️ Error signing out:', e);
    }
  };

  return (
    <ImageBackground
      source={require('../components/img/LoginCover.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <ScrollView
        style={styles.loginContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
          <Image
            style={{ height: 60, width: 60 }}
            source={require('../components/img/MotoSphere Logo.png')}
          />
        </View>
        <Text style={styles.text}>Log in to MotoSphere</Text>
        <Text style={{ color: '#94A3B8', textAlign: 'center', marginTop: 15 }}>
          Access your ride logs, live tracking, and emergency notifications.
        </Text>

        {/* Inputs */}
        <View style={{ flexDirection: 'column', marginTop: 40, gap: 20 }}>
          <View style={{ flexDirection: 'column', gap: 8 }}>
            <Text style={{ color: '#CBD5E1', fontSize: 15 }}>Email or Username</Text>
            <TextInput
              placeholder="e.g motosphere@example.com"
              placeholderTextColor="#CCCCCC"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              editable={!loading}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={{ flexDirection: 'column', gap: 8 }}>
            <Text style={{ color: '#CBD5E1', fontSize: 15 }}>Password</Text>
            <TextInput
              placeholder="Enter your password"
              placeholderTextColor="#CCCCCC"
              secureTextEntry={!showPassword}
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />
          </View>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        ) : null}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                backgroundColor: showPassword ? '#3f99eeff' : '#fff',
              }}
              onPress={() => setShowPassword((prev) => !prev)}
              disabled={loading}
            />
            <Text style={{ color: '#94A3B8' }}>Show Password</Text>
          </View>
          <Pressable
            onPress={() => router.push('/ForgotPassword')}
            disabled={loading}
          >
            <Text style={{ color: '#22D3EE' }}>Forgot Password?</Text>
          </Pressable>
        </View>

        <Pressable onPress={handleLogin} disabled={loading}>
          <Text style={[styles.loginButton, loading && { opacity: 0.6 }]}>
            {loading ? 'Logging In...' : 'Log In'}
          </Text>
        </Pressable>

        {/* Divider */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: '#475569' }} />
          <Text style={{ color: '#94A3B8', paddingHorizontal: 10, fontSize: 12 }}>OR</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: '#475569' }} />
        </View>

        {/* Google Button */}
        <Pressable
          onPress={handleGoogleSignIn}
          disabled={loading}
          style={[styles.googleButton, loading && { opacity: 0.6 }]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#1F2937" style={{ marginRight: 10 }} />
          ) : (
            <Image
              source={{ uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' }}
              style={{ width: 20, height: 20, marginRight: 10 }}
            />
          )}
          <Text style={styles.googleButtonText}>
            {loading ? 'Signing in...' : 'Continue with Google'}
          </Text>
        </Pressable>

        {/* Registration */}
        <View
          style={{
            flexDirection: 'row',
            gap: 15,
            justifyContent: 'center',
            width: '100%',
            marginTop: 20,
            paddingBottom: 20,
          }}
        >
          <Text style={{ color: '#94A3B8', fontSize: 12 }}>Don't have an account yet?</Text>
          <Pressable onPress={() => router.push('/Register')} disabled={loading}>
            <Text style={{ color: '#22D3EE', fontSize: 12 }}>Create an Account</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* 2FA Modal */}
      <Modal visible={show2FA} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.twoFAContainer}>
            <Text style={styles.twoFATitle}>🔐 Two-Factor Authentication</Text>
            <Text style={styles.twoFASubtitle}>
              Enter the 6-digit code sent to your email
            </Text>

            <View style={{ gap: 15, marginTop: 20 }}>
              <TextInput
                placeholder="000000"
                placeholderTextColor="#999"
                style={styles.twoFAInput}
                value={twoFACode}
                onChangeText={setTwoFACode}
                keyboardType="number-pad"
                maxLength={6}
                editable={!twoFALoading}
                textAlign="center"
              />

              {twoFAError ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>⚠️ {twoFAError}</Text>
                </View>
              ) : null}

              <Pressable
                onPress={handle2FAVerification}
                disabled={twoFALoading || twoFACode.length !== 6}
                style={[
                  styles.verifyButton,
                  (twoFALoading || twoFACode.length !== 6) && { opacity: 0.6 }
                ]}
              >
                {twoFALoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.verifyButtonText}>Verify Code</Text>
                )}
              </Pressable>

              <Pressable onPress={handle2FAClose} disabled={twoFALoading}>
                <Text style={{ color: '#9BB3D6', textAlign: 'center', fontSize: 14 }}>
                  Cancel
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Terms Modal - Only for NEW users */}
      <Modal visible={showTerms} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Terms & Privacy Policy</Text>
            <ScrollView style={styles.termsScroll}>
              <Text style={styles.termsText}>
                <Text style={styles.termsSectionTitle}>Terms of Service{'\n\n'}</Text>
                By using MotoSphere, you agree to our terms of service. We collect and process
                your data to provide ride tracking, emergency contact features, and improve our services.
                {'\n\n'}
                <Text style={styles.termsSectionTitle}>Privacy Policy{'\n\n'}</Text>
                Your privacy is important to us. We use your data only for the purposes of providing
                our services and will never share your personal information without your consent.
                {'\n\n'}
                <Text style={styles.termsSectionTitle}>Data Collection{'\n\n'}</Text>
                We collect location data, ride logs, and emergency contact information to ensure your
                safety while riding. This data is encrypted and securely stored.
                {'\n\n'}
                By clicking "Accept & Continue", you acknowledge that you have read and agree to our
                Terms of Service and Privacy Policy.
              </Text>
            </ScrollView>
            <View style={styles.modalButtons}>
              <Pressable onPress={handleTermsDecline} style={styles.declineButton}>
                <Text style={styles.declineButtonText}>Decline</Text>
              </Pressable>
              <Pressable
                onPress={handleTermsAccept}
                disabled={loading}
                style={[styles.acceptButton, loading && { opacity: 0.6 }]}
              >
                <Text style={styles.acceptButtonText}>
                  {loading ? 'Loading...' : 'Accept & Continue'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <StatusBar style="auto" />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  loginContainer: {
    width: '90%',
    maxHeight: '70%',
    backgroundColor: 'rgba(15, 23, 41, 0.8)',
    borderRadius: 40,
    paddingHorizontal: 30,
    paddingTop: 10
  },
  text: {
    color: '#fff',
    fontSize: 23,
    fontWeight: '700',
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(10, 14, 39, 0.5)',
    borderRadius: 8,
    color: '#fff',
    fontSize: 16,
    paddingHorizontal: 20,
    height: 48,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    borderRadius: 8,
    padding: 12,
    marginTop: 15,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '500',
  },
  loginButton: {
    marginTop: 25,
    marginBottom: 25,
    paddingVertical: 20,
    borderRadius: 10,
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    backgroundColor: '#06B6D4',
    color: '#fff',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  googleButtonText: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 15,
  },
  termsScroll: {
    maxHeight: 400,
    marginBottom: 20,
  },
  termsText: {
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 22,
  },
  termsSectionTitle: {
    color: '#06B6D4',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#475569',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  declineButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#06B6D4',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  twoFAContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 25,
    width: '90%',
    maxWidth: 400,
  },
  twoFATitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  twoFASubtitle: {
    color: '#9BB3D6',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  twoFAInput: {
    backgroundColor: 'rgba(10, 14, 39, 0.5)',
    borderRadius: 12,
    color: '#fff',
    fontSize: 32,
    fontWeight: '600',
    paddingVertical: 15,
    paddingHorizontal: 20,
    letterSpacing: 10,
    borderWidth: 2,
    borderColor: '#22D3EE',
  },
  verifyButton: {
    backgroundColor: '#06B6D4',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});