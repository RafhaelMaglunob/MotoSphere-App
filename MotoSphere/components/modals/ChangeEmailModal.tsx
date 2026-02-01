import { useState } from "react";
import { Modal, View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";

interface Props {
  visible: boolean;
  currentEmail: string;
  onClose: () => void;
  onSuccess: (newEmail: string, password: string) => Promise<void>;
}

export default function ChangeEmailModal({
  visible,
  currentEmail,
  onClose,
  onSuccess,
}: Props) {
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com'];

  // Email validation
  const validateEmail = (email: string) => {
    // Check if email is empty
    if (!email.trim()) {
      return 'Email is required';
    }

    // Check email format
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email)) {
      return 'Please enter a valid email address';
    }

    // Check domain
    const domain = email.split('@')[1];
    if (!allowedDomains.includes(domain)) {
      return `Email must be one of: ${allowedDomains.join(', ')}`;
    }

    // Check if same as current email
    if (email.toLowerCase() === currentEmail.toLowerCase()) {
      return 'New email must be different from current email';
    }

    return '';
  };

  // Live validation for email
  const handleEmailChange = (value: string) => {
    setNewEmail(value);
    const error = validateEmail(value);
    setErrors(prev => ({ ...prev, email: error }));
  };

  // Validate password
  const validatePassword = (pwd: string) => {
    if (!pwd.trim()) {
      return 'Password is required to change email';
    }
    if (pwd.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return '';
  };

  const validateSubmit = () => {
    const newErrors = {
      email: validateEmail(newEmail),
      password: validatePassword(password)
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleSubmit = async () => {
    if (!validateSubmit()) return;

    setIsLoading(true);
    try {
      await onSuccess(newEmail, password);

      // Reset form on success
      setNewEmail("");
      setPassword("");
      setErrors({ email: "", password: "" });
    } catch (error) {
      console.error("Email change failed:", error);
      // Error is handled and shown as alert in parent component
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form on close
    setNewEmail("");
    setPassword("");
    setErrors({ email: "", password: "" });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.6)",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <View
          style={{
            backgroundColor: "#0F2A52",
            borderRadius: 16,
            padding: 20,
            gap: 14,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "600" }}>
            Change Email Address
          </Text>

          <Text style={{ color: "#9BB3D6", fontSize: 13 }}>
            A verification code will be sent to your new email address.
            You must verify it to complete the change.
          </Text>

          {/* Current Email (Read-only) */}
          <View style={{ gap: 5 }}>
            <Text style={{ color: "#9BB3D6", fontSize: 12 }}>Current Email</Text>
            <View
              style={{
                backgroundColor: "#0A1A3A",
                borderRadius: 10,
                paddingHorizontal: 15,
                paddingVertical: 12,
              }}
            >
              <Text style={{ color: "#6B7280", fontSize: 14 }}>
                {currentEmail}
              </Text>
            </View>
          </View>

          {/* New Email */}
          <View style={{ gap: 5 }}>
            <Text style={{ color: "#9BB3D6", fontSize: 12 }}>New Email Address</Text>
            <TextInput
              value={newEmail}
              onChangeText={handleEmailChange}
              editable={!isLoading}
              style={{
                backgroundColor: "#0A1A3A",
                borderRadius: 10,
                paddingHorizontal: 15,
                paddingVertical: 12,
                color: "#fff",
                fontSize: 14,
                borderWidth: errors.email ? 1 : 0,
                borderColor: errors.email ? "#EF4444" : "transparent",
              }}
              placeholder="Enter new email (gmail.com, yahoo.com, outlook.com)"
              placeholderTextColor="#4B5563"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {errors.email ? (
              <Text style={{ color: "#EF4444", fontSize: 11 }}>{errors.email}</Text>
            ) : null}
          </View>

          {/* Password Confirmation */}
          <View style={{ gap: 5 }}>
            <Text style={{ color: "#9BB3D6", fontSize: 12 }}>
              Confirm Your Password
            </Text>

            <View
              style={{
                flexDirection: "row",
                backgroundColor: "#0A1A3A",
                borderRadius: 10,
                alignItems: "center",
                borderWidth: errors.password ? 1 : 0,
                borderColor: errors.password ? "#EF4444" : "transparent",
              }}
            >
              <TextInput
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                editable={!isLoading}
                style={{
                  flex: 1,
                  color: "#fff",
                  paddingHorizontal: 15,
                  height: 44,
                }}
                placeholder="Enter your password"
                placeholderTextColor="#4B5563"
              />

              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={{ paddingHorizontal: 15 }}
                disabled={isLoading}
              >
                <Text style={{ color: "#22D3EE", fontSize: 12 }}>
                  {showPassword ? "HIDE" : "SHOW"}
                </Text>
              </Pressable>
            </View>

            {errors.password ? (
              <Text style={{ color: "#EF4444", fontSize: 11 }}>
                {errors.password}
              </Text>
            ) : null}
          </View>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <Pressable
              onPress={handleClose}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 10,
                backgroundColor: isLoading ? "#556583" : "#1E293B",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#E5E7EB", fontWeight: "600" }}>
                Cancel
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSubmit}
              disabled={isLoading || !!errors.email || !!errors.password}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 10,
                backgroundColor: (isLoading || errors.email || errors.password) ? "#556583" : "#22D3EE",
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {isLoading && <ActivityIndicator size="small" color="#0F172A" />}
              <Text style={{ color: "#0F172A", fontWeight: "700" }}>
                {isLoading ? "Changing..." : "Change Email"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}