import { useState } from "react";
import { Modal, View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: (oldPassword: string, newPassword: string) => Promise<void>;
}

export default function ChangePasswordModal({
  visible,
  onClose,
  onSuccess,
}: Props) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const [errors, setErrors] = useState({
    old: "",
    new: "",
    confirm: "",
  });

  const passwordPattern =
    /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\[\]{};':"\\|,.<>\/?~-]).{8,15}$/;

  // Live validation for new + confirm password
  const validateLive = (
    nextNew = newPassword,
    nextConfirm = confirmPassword
  ) => {
    const newErrors = { ...errors };

    // Validate new password strength
    if (nextNew && !passwordPattern.test(nextNew)) {
      newErrors.new =
        "8–15 chars, 1 uppercase, 1 number, 1 symbol required";
    } else {
      newErrors.new = "";
    }

    // Validate password match
    if (nextConfirm && nextNew !== nextConfirm) {
      newErrors.confirm = "Passwords do not match";
    } else {
      newErrors.confirm = "";
    }

    setErrors(newErrors);
  };

  const validateSubmit = () => {
    const newErrors = { old: "", new: "", confirm: "" };
    let isValid = true;

    // Validate old password
    if (!oldPassword.trim()) {
      newErrors.old = "Current password is required";
      isValid = false;
    }

    // Validate new password
    if (!newPassword.trim()) {
      newErrors.new = "New password is required";
      isValid = false;
    } else if (!passwordPattern.test(newPassword)) {
      newErrors.new = "8–15 chars, 1 uppercase, 1 number, 1 symbol required";
      isValid = false;
    }

    // Validate confirm password
    if (!confirmPassword.trim()) {
      newErrors.confirm = "Please confirm your new password";
      isValid = false;
    } else if (newPassword !== confirmPassword) {
      newErrors.confirm = "Passwords do not match";
      isValid = false;
    }

    // Check if new password is same as old
    if (oldPassword && newPassword && oldPassword === newPassword) {
      newErrors.new = "New password must be different from current password";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    setServerError("");

    if (!validateSubmit()) return;

    setIsLoading(true);

    try {
      await onSuccess(oldPassword, newPassword);

      // Reset form on success
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({ old: "", new: "", confirm: "" });
      setServerError("");
    } catch (error: any) {
      // Display the error message from the server
      const errorMessage = error?.message || "Failed to change password. Please try again.";
      setServerError(errorMessage);
      console.error("Password change failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form on close
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({ old: "", new: "", confirm: "" });
    setServerError("");
    onClose();
  };

  const renderPasswordInput = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    show: boolean,
    toggle: () => void,
    error?: string
  ) => (
    <View style={{ gap: 5 }}>
      <Text style={{ color: "#9BB3D6", fontSize: 12 }}>{label}</Text>

      <View
        style={{
          flexDirection: "row",
          backgroundColor: "#0A1A3A",
          borderRadius: 10,
          alignItems: "center",
          borderWidth: error ? 1 : 0,
          borderColor: "#EF4444",
        }}
      >
        <TextInput
          secureTextEntry={!show}
          value={value}
          onChangeText={onChange}
          style={{
            flex: 1,
            color: "#fff",
            paddingHorizontal: 15,
            height: 44,
          }}
          placeholderTextColor="#4B5563"
          editable={!isLoading}
        />

        <Pressable onPress={toggle} style={{ paddingHorizontal: 15 }} disabled={isLoading}>
          <Text style={{ color: "#22D3EE", fontSize: 12 }}>
            {show ? "HIDE" : "SHOW"}
          </Text>
        </Pressable>
      </View>

      {error ? (
        <Text style={{ color: "#EF4444", fontSize: 11 }}>{error}</Text>
      ) : null}
    </View>
  );

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
            Change Password
          </Text>

          {/* Server error message */}
          {serverError ? (
            <View
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                borderLeftWidth: 4,
                borderLeftColor: "#EF4444",
                borderRadius: 8,
                padding: 12,
              }}
            >
              <Text style={{ color: "#FCA5A5", fontSize: 12 }}>
                {serverError}
              </Text>
            </View>
          ) : null}

          {renderPasswordInput(
            "Current Password",
            oldPassword,
            (text) => {
              setOldPassword(text);
              setServerError("");
              if (errors.old) {
                setErrors({ ...errors, old: "" });
              }
            },
            showOld,
            () => setShowOld(!showOld),
            errors.old
          )}

          {renderPasswordInput(
            "New Password",
            newPassword,
            (text) => {
              setNewPassword(text);
              setServerError("");
              validateLive(text, confirmPassword);
            },
            showNew,
            () => setShowNew(!showNew),
            errors.new
          )}

          {renderPasswordInput(
            "Confirm New Password",
            confirmPassword,
            (text) => {
              setConfirmPassword(text);
              setServerError("");
              validateLive(newPassword, text);
            },
            showNew,
            () => setShowNew(!showNew),
            errors.confirm
          )}

          {/* Password requirements hint */}
          <View
            style={{
              backgroundColor: "rgba(34, 211, 238, 0.1)",
              borderRadius: 8,
              padding: 10,
            }}
          >
            <Text style={{ color: "#9BB3D6", fontSize: 11 }}>
              Password must contain:
            </Text>
            <Text style={{ color: "#9BB3D6", fontSize: 11, marginTop: 4 }}>
              • 8-15 characters
            </Text>
            <Text style={{ color: "#9BB3D6", fontSize: 11 }}>
              • At least 1 uppercase letter
            </Text>
            <Text style={{ color: "#9BB3D6", fontSize: 11 }}>
              • At least 1 number
            </Text>
            <Text style={{ color: "#9BB3D6", fontSize: 11 }}>
              • At least 1 special character (!@#$%^&*...)
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <Pressable
              onPress={handleClose}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 10,
                backgroundColor: isLoading ? "#334155" : "#1E293B",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#E5E7EB", fontWeight: "600" }}>
                Cancel
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSubmit}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 10,
                backgroundColor: isLoading ? "#0891B2" : "#22D3EE",
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {isLoading && <ActivityIndicator size="small" color="#0F172A" />}
              <Text style={{ color: "#0F172A", fontWeight: "700" }}>
                {isLoading ? "Saving..." : "Save"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}