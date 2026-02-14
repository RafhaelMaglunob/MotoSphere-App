// app/ForgotPassword.tsx - RESPONSIVE VERSION
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
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
  useWindowDimensions,
  SafeAreaView,
} from 'react-native';
import { sendPasswordResetCode } from '../Backend/controller/auth/passwordResetService';

export default function ForgotPassword() {
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width < 380;
  const isLandscape = height < width;

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSendCode = async () => {
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    const emailPattern = /^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      console.log('📧 Sending password reset code to:', email);
      const result = await sendPasswordResetCode(email);

      if (result.success) {
        console.log('✅ Reset code sent');
        setSuccess(true);

        // Automatically navigate to verification screen after 1.5 seconds
        setTimeout(() => {
          router.push({
            pathname: '/VerifyResetCode',
            params: { email: email.toLowerCase() }
          });
        }, 1500);
      } else {
        setError(result.error || 'Failed to send reset code. Please try again.');
      }
    } catch (err: any) {
      console.error('❌ Error sending reset code:', err.message);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Responsive values
  const iconSize = isSmallScreen ? 40 : 50;
  const titleSize = isSmallScreen ? 22 : isLandscape ? 20 : 26;
  const subtitleSize = isSmallScreen ? 12 : 14;
  const buttonPadding = isSmallScreen ? 14 : 16;
  const cardPadding = isSmallScreen ? 20 : 30;
  const cardMargin = isSmallScreen ? 15 : 20;

  return (
    <ImageBackground
      source={require('../components/img/LoginCover.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Back Button */}
            <Pressable
              onPress={() => router.back()}
              style={[styles.backButton, { marginBottom: isSmallScreen ? 15 : 20 }]}
              disabled={loading}
            >
              <Text style={[styles.backButtonText, { fontSize: isSmallScreen ? 12 : 14 }]}>
                ← Back
              </Text>
            </Pressable>

            {/* Content Card */}
            <View style={[
              styles.card,
              {
                padding: cardPadding,
                marginHorizontal: cardMargin,
                marginVertical: isLandscape ? 10 : 0,
              }
            ]}>
              {/* Icon */}
              <View style={[styles.iconContainer, { marginBottom: isSmallScreen ? 15 : 20 }]}>
                <Text style={[styles.icon, { fontSize: iconSize }]}>🔐</Text>
              </View>

              {/* Title */}
              <Text style={[
                styles.title,
                {
                  fontSize: titleSize,
                  marginBottom: isSmallScreen ? 8 : 12,
                }
              ]}>
                Forgot Password?
              </Text>

              {/* Subtitle */}
              <Text style={[
                styles.subtitle,
                {
                  fontSize: subtitleSize,
                  marginBottom: isSmallScreen ? 20 : 28,
                  lineHeight: isSmallScreen ? 18 : 21,
                }
              ]}>
                No worries! Enter your email address and we'll send you a verification code to reset your password.
              </Text>

              {/* Success State */}
              {success && (
                <View style={[styles.successContainer, { marginBottom: isSmallScreen ? 15 : 20 }]}>
                  <Text style={[styles.successIcon, { fontSize: isSmallScreen ? 28 : 32 }]}>✅</Text>
                  <Text style={[
                    styles.successText,
                    { fontSize: subtitleSize, marginTop: isSmallScreen ? 6 : 8 }
                  ]}>
                    Verification code sent to {email}
                  </Text>
                </View>
              )}

              {/* Email Input */}
              {!success && (
                <>
                  <View style={[styles.inputGroup, { marginBottom: isSmallScreen ? 12 : 16 }]}>
                    <Text style={[styles.label, { fontSize: isSmallScreen ? 12 : 14, marginBottom: isSmallScreen ? 6 : 8 }]}>
                      Email Address
                    </Text>
                    <TextInput
                      placeholder="Enter your email"
                      placeholderTextColor="#666"
                      style={[
                        styles.input,
                        {
                          fontSize: isSmallScreen ? 14 : 16,
                          paddingHorizontal: isSmallScreen ? 12 : 16,
                          paddingVertical: isSmallScreen ? 12 : 14,
                        },
                        error ? styles.inputError : null
                      ]}
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        setError('');
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!loading}
                    />
                  </View>

                  {/* Error Message */}
                  {error && (
                    <View style={[styles.errorContainer, { marginBottom: isSmallScreen ? 12 : 16, padding: isSmallScreen ? 10 : 12 }]}>
                      <Text style={[styles.errorText, { fontSize: isSmallScreen ? 11 : 13 }]}>
                        ⚠️ {error}
                      </Text>
                    </View>
                  )}

                  {/* Send Code Button */}
                  <Pressable
                    onPress={handleSendCode}
                    disabled={loading || !email.trim()}
                    style={[
                      styles.button,
                      {
                        paddingVertical: buttonPadding,
                        marginBottom: isSmallScreen ? 12 : 16,
                      },
                      (loading || !email.trim()) && styles.buttonDisabled
                    ]}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={[styles.buttonText, { fontSize: isSmallScreen ? 14 : 16 }]}>
                        Send Verification Code
                      </Text>
                    )}
                  </Pressable>

                  {/* Info Box */}
                  <View style={[
                    styles.infoBox,
                    {
                      padding: isSmallScreen ? 10 : 12,
                      gap: isSmallScreen ? 8 : 10,
                    }
                  ]}>
                    <Text style={[styles.infoIcon, { fontSize: isSmallScreen ? 14 : 16 }]}>ℹ️</Text>
                    <Text style={[
                      styles.infoText,
                      {
                        fontSize: isSmallScreen ? 11 : 13,
                        lineHeight: isSmallScreen ? 16 : 18,
                      }
                    ]}>
                      Check your email (including spam folder) for the verification code
                    </Text>
                  </View>
                </>
              )}

              {/* Loading state */}
              {success && !loading && (
                <View style={[styles.redirectContainer, { paddingVertical: isSmallScreen ? 15 : 20 }]}>
                  <ActivityIndicator
                    size={isSmallScreen ? "small" : "large"}
                    color="#22D3EE"
                    style={{ marginBottom: isSmallScreen ? 8 : 10 }}
                  />
                  <Text style={[
                    styles.redirectText,
                    { fontSize: isSmallScreen ? 12 : 14 }
                  ]}>
                    Redirecting to verification...
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

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
  safeArea: {
    flex: 1,
    width: '100%',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 20,
    minHeight: '100%',
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(10, 14, 39, 0.4)',
  },
  backButtonText: {
    color: '#22D3EE',
    fontWeight: '600',
  },
  card: {
    width: '100%',
    maxWidth: 450,
    backgroundColor: 'rgba(15, 23, 41, 0.9)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.2)',
  },
  iconContainer: {
    alignItems: 'center',
  },
  icon: {
    fontWeight: '700',
  },
  title: {
    color: '#fff',
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#9BB3D6',
    textAlign: 'center',
  },
  inputGroup: {
    width: '100%',
  },
  label: {
    color: '#CBD5E1',
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(10, 14, 39, 0.5)',
    borderRadius: 10,
    color: '#fff',
    borderWidth: 2,
    borderColor: 'rgba(34, 211, 238, 0.3)',
  },
  inputError: {
    borderColor: '#F87171',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    borderRadius: 8,
  },
  errorText: {
    color: '#FCA5A5',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#06B6D4',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: 'rgba(6, 182, 212, 0.4)',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#22D3EE',
    borderRadius: 8,
  },
  infoIcon: {
    minWidth: 20,
  },
  infoText: {
    color: '#9BB3D6',
    flex: 1,
  },
  successContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 8,
  },
  successText: {
    color: '#86EFAC',
    fontWeight: '600',
    textAlign: 'center',
  },
  redirectContainer: {
    alignItems: 'center',
  },
  redirectText: {
    color: '#9BB3D6',
    textAlign: 'center',
  },
});