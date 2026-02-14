// app/VerifyResetCode.tsx
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { verifyPasswordResetCode } from '../Backend/controller/auth/passwordResetService';

export default function VerifyResetCode() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Resend timer countdown
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  if (!email) {
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

  const handleVerifyCode = async () => {
    setError('');

    if (!code.trim()) {
      setError('Please enter the verification code');
      return;
    }

    if (code.length !== 6) {
      setError('Code must be 6 digits');
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 Verifying reset code...');
      const result = await verifyPasswordResetCode(email, code);

      if (result.valid) {
        console.log('✅ Code verified, redirecting to password reset...');
        // Navigate to password reset screen with email and token
        router.push({
          pathname: '/ResetPassword',
          params: { 
            email: email,
            token: result.token
          }
        });
      } else {
        setError('Invalid or expired code. Please try again.');
      }
    } catch (err: any) {
      console.error('❌ Verification error:', err.message);
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setLoading(true);

    try {
      console.log('📧 Resending verification code...');
      // Import the send function dynamically
      const { sendPasswordResetCode } = await import('../Backend/controller/auth/passwordResetService');
      const result = await sendPasswordResetCode(email);

      if (result.success) {
        console.log('✅ Code resent');
        setCode('');
        setCanResend(false);
        setResendTimer(60); // 60 second cooldown
      } else {
        setError(result.error || 'Failed to resend code');
      }
    } catch (err: any) {
      console.error('❌ Resend error:', err.message);
      setError(err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (value: string) => {
    const numbersOnly = value.replace(/[^0-9]/g, '');
    if (numbersOnly.length <= 6) {
      setCode(numbersOnly);
      setError('');
    }
  };

  const formatTime = (seconds: number) => {
    return `${seconds}s`;
  };

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
              <Text style={styles.icon}>📧</Text>
            </View>

            {/* Title */}
            <Text style={styles.title}>Verify Code</Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
              We sent a 6-digit verification code to
            </Text>
            <Text style={styles.email}>{email}</Text>

            {/* Code Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Verification Code</Text>
              <TextInput
                placeholder="000000"
                placeholderTextColor="#666"
                style={[
                  styles.codeInput,
                  error ? styles.inputError : null
                ]}
                value={code}
                onChangeText={handleCodeChange}
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
                textAlign="center"
                autoFocus
              />
            </View>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            )}

            {/* Verify Button */}
            <Pressable
              onPress={handleVerifyCode}
              disabled={loading || code.length !== 6}
              style={[
                styles.button,
                (loading || code.length !== 6) && styles.buttonDisabled
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify Code</Text>
              )}
            </Pressable>

            {/* Resend Section */}
            <View style={styles.resendSection}>
              <Text style={styles.resendText}>Didn't receive the code?</Text>
              <Pressable
                onPress={handleResendCode}
                disabled={!canResend || loading}
                style={styles.resendButton}
              >
                <Text style={[
                  styles.resendLink,
                  !canResend && styles.resendLinkDisabled
                ]}>
                  {canResend ? 'Send Again' : `Resend in ${formatTime(resendTimer)}`}
                </Text>
              </Pressable>
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>ℹ️</Text>
              <Text style={styles.infoText}>
                Code expires in 15 minutes. Check your spam folder if you don't see the email.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
    marginBottom: 4,
  },
  email: {
    color: '#22D3EE',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 28,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  codeInput: {
    backgroundColor: 'rgba(10, 14, 39, 0.5)',
    borderRadius: 10,
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: 'rgba(34, 211, 238, 0.3)',
    letterSpacing: 8,
  },
  inputError: {
    borderColor: '#F87171',
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
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(6, 182, 212, 0.4)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  resendText: {
    color: '#9BB3D6',
    fontSize: 13,
  },
  resendButton: {
    padding: 4,
  },
  resendLink: {
    color: '#22D3EE',
    fontSize: 13,
    fontWeight: '600',
  },
  resendLinkDisabled: {
    color: '#666',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#22D3EE',
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  infoIcon: {
    fontSize: 16,
  },
  infoText: {
    color: '#9BB3D6',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  errorMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
});