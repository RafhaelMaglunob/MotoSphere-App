import { useState } from "react";
import { Modal, View, Text, TextInput, Pressable } from "react-native";
import { User } from "../../components/services/types";
import { users } from "../../components/services/users";

interface Props {
  visible: boolean;
  userIndex: number;
  onClose: () => void;
  onSuccess: (updatedUser: Partial<User>) => void;
}

export default function ChangePasswordModal({
  visible,
  userIndex,
  onClose,
  onSuccess,
}: Props) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

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

    if (!passwordPattern.test(nextNew)) {
      newErrors.new =
        "8–15 chars, 1 capital letter, 1 number, 1 symbol required";
    } else {
      newErrors.new = "";
    }

    if (nextConfirm && nextNew !== nextConfirm) {
      newErrors.confirm = "Passwords do not match";
    } else {
      newErrors.confirm = "";
    }

    setErrors(newErrors);
  };

  const validateSubmit = () => {
    const user = users[userIndex];
    if (!user) return false;

    const newErrors = { ...errors };

    if (oldPassword !== user.password) {
      newErrors.old = "Old password is incorrect";
    } else {
      newErrors.old = "";
    }

    validateLive(newPassword, confirmPassword);

    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleSubmit = () => {
    if (!validateSubmit()) return;

    onSuccess({
      password: newPassword,
      lastChangePass: new Date().toISOString(),
    });

    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({ old: "", new: "", confirm: "" });
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
        />

        <Pressable onPress={toggle} style={{ paddingHorizontal: 15 }}>
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

          {renderPasswordInput(
            "Old Password",
            oldPassword,
            setOldPassword,
            showOld,
            () => setShowOld(!showOld),
            errors.old
          )}

          {renderPasswordInput(
            "New Password",
            newPassword,
            (text) => {
              setNewPassword(text);
              validateLive(text, confirmPassword);
            },
            showNew,
            () => setShowNew(!showNew),
            errors.new
          )}

          {renderPasswordInput(
            "Confirm Password",
            confirmPassword,
            (text) => {
              setConfirmPassword(text);
              validateLive(newPassword, text);
            },
            showNew,
            () => setShowNew(!showNew),
            errors.confirm
          )}

          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <Pressable
              onPress={onClose}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 10,
                backgroundColor: "#1E293B",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#E5E7EB", fontWeight: "600" }}>
                Cancel
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSubmit}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 10,
                backgroundColor: "#22D3EE",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#0F172A", fontWeight: "700" }}>
                Save
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
