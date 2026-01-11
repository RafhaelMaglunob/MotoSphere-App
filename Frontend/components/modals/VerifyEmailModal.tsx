// VerifyEmailModal.tsx
import React, { useState } from "react";
import { Modal, View, Text, TextInput, Pressable } from "react-native";

interface VerifyEmailModalProps {
  visible: boolean;
  oldEmail: string;
  onVerify: (code: string) => void;
  onCancel: () => void;
}

export default function VerifyEmailModal({
  visible,
  oldEmail,
  onVerify,
  onCancel,
}: VerifyEmailModalProps) {
  const [code, setCode] = useState("");

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.6)",
          padding: 20,
        }}
      >
        <View
          style={{
            width: "100%",
            backgroundColor: "#0F2A52",
            borderRadius: 16,
            padding: 20,
            gap: 15,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            Enter verification code sent to {oldEmail}
          </Text>

          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="6-digit code"
            placeholderTextColor="#999"
            keyboardType="number-pad"
            style={{
              color: "#fff",
              backgroundColor: "#0A1A3A",
              padding: 12,
              borderRadius: 10,
            }}
          />

          <Pressable
            onPress={() => onVerify(code)}
            style={{
              backgroundColor: "#2EA8FF",
              padding: 14,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>Verify Email</Text>
          </Pressable>

          <Pressable
            onPress={onCancel}
            style={{
              marginTop: 10,
              padding: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#F87171", fontWeight: "bold" }}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
