// components/modals/VerifyEmailCodeModal.tsx
import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet
} from "react-native";

interface VerifyEmailCodeModalProps {
  visible: boolean;
  onClose: () => void;
  onVerify: (email: string, code: string) => Promise<void>;
  email: string;
}

export default function VerifyEmailCodeModal({
  visible,
  onClose,
  onVerify,
  email
}: VerifyEmailCodeModalProps) {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    setError("");

    if (!code || code.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setIsVerifying(true);

    try {
      await onVerify(email, code);
      setCode("");
      setError("");
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setCode("");
    setError("");
    onClose();
  };

  const handleCodeChange = (value: string) => {
    // Only allow numbers
    const numbersOnly = value.replace(/[^0-9]/g, "");
    if (numbersOnly.length <= 6) {
      setCode(numbersOnly);
      setError("");
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Verify Your Email</Text>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>📧</Text>
            </View>

            <Text style={styles.description}>
              We've sent a 6-digit verification code to
            </Text>
            <Text style={styles.email}>{email}</Text>

            <Text style={styles.instruction}>
              Enter the code below to verify your email address
            </Text>

            {/* Code Input */}
            <TextInput
              value={code}
              onChangeText={handleCodeChange}
              placeholder="000000"
              placeholderTextColor="#666"
              keyboardType="number-pad"
              maxLength={6}
              style={[
                styles.codeInput,
                error ? styles.codeInputError : null
              ]}
              autoFocus
            />

            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            <Text style={styles.expiryNote}>
              ⏱️ Code expires in 15 minutes
            </Text>

            {/* Verify Button */}
            <Pressable
              onPress={handleVerify}
              disabled={isVerifying || code.length !== 6}
              style={({ pressed }) => [
                styles.verifyButton,
                (isVerifying || code.length !== 6) && styles.verifyButtonDisabled,
                pressed && styles.verifyButtonPressed
              ]}
            >
              {isVerifying ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify Email</Text>
              )}
            </Pressable>

            {/* Resend */}
            <Pressable onPress={handleClose} style={styles.resendContainer}>
              <Text style={styles.resendText}>
                Didn't receive the code?{" "}
                <Text style={styles.resendLink}>Send Again</Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  modalContainer: {
    backgroundColor: "#0F2A52",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    overflow: "hidden"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1E3A5F"
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold"
  },
  closeButton: {
    padding: 5
  },
  closeButtonText: {
    color: "#9BB3D6",
    fontSize: 24
  },
  content: {
    padding: 25
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 20
  },
  icon: {
    fontSize: 60
  },
  description: {
    color: "#9BB3D6",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 5
  },
  email: {
    color: "#22D3EE",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20
  },
  instruction: {
    color: "#fff",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 25
  },
  codeInput: {
    backgroundColor: "#0A1A3A",
    borderRadius: 12,
    padding: 16,
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    letterSpacing: 10,
    textAlign: "center",
    fontFamily: "monospace",
    borderWidth: 2,
    borderColor: "#22D3EE"
  },
  codeInputError: {
    borderColor: "#F87171"
  },
  errorText: {
    color: "#F87171",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8
  },
  expiryNote: {
    color: "#9BB3D6",
    fontSize: 12,
    textAlign: "center",
    marginTop: 15,
    marginBottom: 25
  },
  verifyButton: {
    backgroundColor: "#2EA8FF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center"
  },
  verifyButtonDisabled: {
    backgroundColor: "#555"
  },
  verifyButtonPressed: {
    opacity: 0.8
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold"
  },
  resendContainer: {
    marginTop: 20,
    alignItems: "center"
  },
  resendText: {
    color: "#9BB3D6",
    fontSize: 13
  },
  resendLink: {
    color: "#22D3EE",
    fontWeight: "600"
  }
});