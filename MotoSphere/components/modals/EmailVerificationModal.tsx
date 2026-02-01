// components/modals/EmailVerificationModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { verifyEmailCode } from '../../Backend/controller/user/settingService';
import { sendVerificationEmail } from '../../Backend/controller/user/settingService';

interface EmailVerificationModalProps {
  visible: boolean;
  email: string;
  expiresAt?: Date;
  onClose: () => void;
  onSuccess: () => void;
  onUserRefresh?: () => Promise<void>;
}

export default function EmailVerificationModal({
  visible,
  email,
  expiresAt,
  onClose,
  onSuccess,
  onUserRefresh,
}: EmailVerificationModalProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const timerRef = useRef<any>(null);

  // Calculate remaining time
  useEffect(() => {
    if (visible && expiresAt) {
      const calculateTimer = () => {
        const now = new Date().getTime();
        const expirationTime = new Date(expiresAt).getTime();
        const remaining = Math.max(0, Math.floor((expirationTime - now) / 1000));
        setTimer(remaining);

        if (remaining <= 0) {
          clearInterval(timerRef.current);
        }
      };

      calculateTimer();
      timerRef.current = setInterval(calculateTimer, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [visible, expiresAt]);

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔐 Verifying email code...');
      const result = await verifyEmailCode(code);

      if (result.success) {
        // ⭐ Refresh user data after successful verification
        if (onUserRefresh) {
          try {
            console.log('🔄 Refreshing user data...');
            await onUserRefresh();
            console.log('✅ User data refreshed');
          } catch (refreshError) {
            console.error('⚠️ Error refreshing user data:', refreshError);
          }
        }

        Alert.alert(
          'Success',
          'Email verified successfully! 🎉',
          [
            {
              text: 'OK',
              onPress: () => {
                setCode('');
                onSuccess();
                onClose();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to verify code');
      }
    } catch (error: any) {
      console.error('❌ Verification error:', error);
      Alert.alert('Error', error.message || 'Failed to verify code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    try {
      console.log('📧 Resending verification code...');
      const result = await sendVerificationEmail();

      if (result.success) {
        Alert.alert('Success', 'Verification code sent to your email!');
        setCode('');
        setTimer(900); // Reset to 15 minutes
      } else {
        Alert.alert('Error', result.error || 'Failed to resend code');
      }
    } catch (error: any) {
      console.error('❌ Resend error:', error);
      Alert.alert('Error', error.message || 'Failed to resend code');
    } finally {
      setResendLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <LinearGradient
            colors={['#0F2A52', '#0A1A3A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalContainer}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Verify Your Email</Text>
              <Text style={styles.subtitle}>
                A 6-digit code has been sent to
              </Text>
              <Text style={styles.emailText}>{email}</Text>
            </View>

            {/* Code Input */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>Enter 6-digit code</Text>
              <TextInput
                value={code}
                onChangeText={(text) => {
                  // Only allow numbers, max 6 digits
                  const numericValue = text.replace(/[^0-9]/g, '').slice(0, 6);
                  setCode(numericValue);
                }}
                placeholder="000000"
                placeholderTextColor="#555"
                keyboardType="number-pad"
                maxLength={6}
                editable={!isLoading}
                style={styles.codeInput}
              />

              {/* Timer */}
              <View style={styles.timerContainer}>
                <View
                  style={[
                    styles.timerDot,
                    {
                      backgroundColor: timer > 300 ? '#10B981' : timer > 60 ? '#F59E0B' : '#EF4444',
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.timerText,
                    {
                      color: timer > 300 ? '#10B981' : timer > 60 ? '#F59E0B' : '#EF4444',
                    },
                  ]}
                >
                  {timer > 0 ? `Expires in ${formatTime(timer)}` : 'Code expired'}
                </Text>
              </View>
            </View>

            {/* Verify Button */}
            <Pressable
              onPress={handleVerifyCode}
              disabled={isLoading || code.length !== 6 || timer === 0}
              style={({ pressed }) => [
                styles.verifyButton,
                {
                  backgroundColor:
                    isLoading || code.length !== 6 || timer === 0 ? '#555' : '#22D3EE',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify Code</Text>
              )}
            </Pressable>

            {/* Resend Code */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendLabel}>Didn't receive code?</Text>
              <Pressable
                onPress={handleResendCode}
                disabled={resendLoading || timer > 0}
                style={{ opacity: resendLoading || timer > 0 ? 0.5 : 1 }}
              >
                {resendLoading ? (
                  <ActivityIndicator size="small" color="#22D3EE" />
                ) : (
                  <Text style={styles.resendLink}>
                    {timer > 0 ? `Resend in ${formatTime(timer)}` : 'Resend Code'}
                  </Text>
                )}
              </Pressable>
            </View>

            {/* Close Button */}
            <Pressable
              onPress={onClose}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.closeButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </LinearGradient>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    borderRadius: 16,
    padding: 24,
    gap: 20,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#9BB3D6',
    fontSize: 12,
    fontWeight: '400',
  },
  emailText: {
    color: '#22D3EE',
    fontSize: 13,
    fontWeight: '600',
  },
  inputSection: {
    gap: 12,
  },
  label: {
    color: '#9BB3D6',
    fontSize: 11,
    fontWeight: '500',
  },
  codeInput: {
    color: '#fff',
    fontSize: 24,
    letterSpacing: 12,
    textAlign: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#22D3EE',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  timerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  verifyButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  resendLabel: {
    color: '#9BB3D6',
    fontSize: 12,
    fontWeight: '400',
  },
  resendLink: {
    color: '#22D3EE',
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(226, 232, 240, 0.1)',
  },
  closeButtonText: {
    color: '#9BB3D6',
    fontSize: 14,
    fontWeight: '600',
  },
});