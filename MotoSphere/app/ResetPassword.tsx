// app/ResetPassword.tsx
import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  ImageBackground,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { resetPassword } from '../Backend/controller/auth/passwordResetService';

export default function ResetPassword() {
  const router = useRouter();
  const { email, token } = useLocalSearchParams<{ email: string; token: string }>();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  if (!email || !token) {
    return (
      <ImageBackground
        source={require('../components/img/LoginCover.png')}
        style={styles.container}
        resizeMode="cover"
      >
        <View style={styles.errorMessage}>
          <Text style={styles.errorText}>Invalid request. Please try again.</Text>
          <Pressable onPress={() => router.push('/Login')} style={styles.button}>
            <Text style={styles.buttonText}>Back to Login</Text>
          </Pressable>
        </View>
      </ImageBackground>
    );
  }

  const validatePassword = () => {
    if (!password.trim()) {
      setError('Please enter a new password');
      return false;
    }

    if (password.length < 8 || password.length > 15) {
      setError('Password must be 8-15 characters long');
      return false;
    }

    const pattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\[\]{};':"\\|,.<>\/?~-]).+$/;
    if (!pattern.test(password)) {
      setError('Password must contain at least 1 uppercase letter, 1 digit, and 1 symbol');
      return false;
    }

    if (!confirmPassword.trim()) {
      setError('Please confirm your password');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleResetPassword = async () => {
    setError('');

    if (!validatePassword()) {
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 Resetting password...');
      const result = await resetPassword(email, token, password);

      if (result.success) {
        console.log('✅ Password reset successful');
        setShowSuccessModal(true);

        // Navigate to login after 2 seconds
        setTimeout(() => {
          router.replace('/Login');
        }, 2000);
      } else {
        setError(result.error || 'Failed to reset password. Please try again.');
      }
    } catch (err: any) {
      console.error('❌ Reset error:', err.message);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (!password) return null;

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*()_+\[\]{};':"\\|,.<>\/?~-]/.test(password)) strength++;

    if (strength <= 1) return { text: 'Weak', color: '#EF4444' };
    if (strength === 2) return { text: 'Fair', color: '#F59E0B' };
    if (strength === 3) return { text: 'Good', color: '#22D3EE' };
    return { text: 'Strong', color: '#10B981' };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <ImageBackground
      source={require('../components/img/LoginCover.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            disabled={loading}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </Pressable>

          {/* Content Card */}
          <View style={styles.card}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🔑</Text>
            </View>

            {/* Title */}
            <Text style={styles.title}>Create New Password</Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
              Enter a strong password to secure your account
            </Text>

            {/* New Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  placeholder="Enter new password"
                  placeholderTextColor="#666"
                  style={[
                    styles.input,
                    error && styles.inputError
                  ]}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError('');
                  }}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  style={styles.eyeButton}
                >
                  <Text style={styles.eyeIcon}>
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </Text>
                </Pressable>
              </View>

              {/* Password Strength */}
              {passwordStrength && password && (
                <View style={styles.strengthContainer}>
                  <View style={[
                    styles.strengthBar,
                    { backgroundColor: passwordStrength.color }
                  ]} />
                  <Text style={[
                    styles.strengthText,
                    { color: passwordStrength.color }
                  ]}>
                    Strength: {passwordStrength.text}
                  </Text>
                </View>
              )}

              {/* Password Requirements */}
              <View style={styles.requirementsBox}>
                <RequirementItem
                  met={password.length >= 8}
                  text="At least 8 characters"
                />
                <RequirementItem
                  met={/[A-Z]/.test(password)}
                  text="One uppercase letter"
                />
                <RequirementItem
                  met={/[0-9]/.test(password)}
                  text="One number"
                />
                <RequirementItem
                  met={/[!@#$%^&*()_+\[\]{};':"\\|,.<>\/?~-]/.test(password)}
                  text="One symbol"
                />
              </View>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  placeholder="Confirm your password"
                  placeholderTextColor="#666"
                  style={[
                    styles.input,
                    error && styles.inputError
                  ]}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setError('');
                  }}
                  secureTextEntry={!showConfirmPassword}
                  editable={!loading}
                />
                <Pressable
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                  style={styles.eyeButton}
                >
                  <Text style={styles.eyeIcon}>
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </Text>
                </Pressable>
              </View>

              {/* Password Match Indicator */}
              {confirmPassword && password !== confirmPassword && (
                <Text style={styles.mismatchText}>
                  ⚠️ Passwords do not match
                </Text>
              )}
              {confirmPassword && password === confirmPassword && (
                <Text style={styles.matchText}>
                  ✅ Passwords match
                </Text>
              )}
            </View>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            )}

            {/* Reset Button */}
            <Pressable
              onPress={handleResetPassword}
              disabled={loading || !password || !confirmPassword || password !== confirmPassword}
              style={[
                styles.button,
                (loading || !password || !confirmPassword || password !== confirmPassword) && styles.buttonDisabled
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Reset Password</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successTitle}>Password Reset Successful!</Text>
            <Text style={styles.successText}>
              Your password has been successfully reset. Redirecting to login...
            </Text>
            <ActivityIndicator size="small" color="#10B981" style={{ marginTop: 16 }} />
          </View>
        </View>
      </Modal>

      <StatusBar style="auto" />
    </ImageBackground>
  );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <Text style={{ fontSize: 14 }}>
        {met ? '✅' : '❌'}
      </Text>
      <Text style={[
        { fontSize: 13 },
        met ? { color: '#86EFAC' } : { color: '#9BB3D6' }
      ]}>
        {text}
      </Text>
    </View>
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
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(10, 14, 39, 0.4)',
    marginBottom: 20,
  },
  backButtonText: {
    color: '#22D3EE',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    width: '100%',
    maxWidth: 450,
    backgroundColor: 'rgba(15, 23, 41, 0.9)',
    borderRadius: 20,
    padding: 30,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.2)',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 50,
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: '#9BB3D6',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(10, 14, 39, 0.5)',
    borderRadius: 10,
    color: '#fff',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: 'rgba(34, 211, 238, 0.3)',
    paddingRight: 45,
  },
  inputError: {
    borderColor: '#F87171',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    padding: 8,
  },
  eyeIcon: {
    fontSize: 18,
  },
  strengthContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  requirementsBox: {
    backgroundColor: 'rgba(34, 211, 238, 0.08)',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#22D3EE',
  },
  mismatchText: {
    color: '#FCA5A5',
    fontSize: 12,
    marginTop: 6,
  },
  matchText: {
    color: '#86EFAC',
    fontSize: 12,
    marginTop: 6,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#06B6D4',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(6, 182, 212, 0.4)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModal: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  successIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  successTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  successText: {
    color: '#9BB3D6',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});