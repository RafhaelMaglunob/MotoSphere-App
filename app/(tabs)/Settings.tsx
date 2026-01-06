import { useState } from "react";
import { View, Text, Pressable, TextInput, Image, Alert } from "react-native";

import { User } from "@/components/services/types";

import UserIcon from "@/components/svg/ProfileIcon";
import LockIcon from "@/components/svg/LockIcon";
import { BellIcon } from "@/components/svg/BellIcon";

import VerifyEmailModal from "@/components/modals/VerifyEmailModal";
import ChangePasswordModal from "@/components/modals/ChangePasswordModal";

interface SettingsProps {
  userIndex: number;
  user: User;
  setActiveRoute: (route: string) => void;
  updateUser: (updateUser: Partial<User>) => void;
}

export default function Settings({ userIndex, user, setActiveRoute, updateUser }: SettingsProps) {
  const [isActive, setActive] = useState('profile');
  const [username, setUsername] = useState(user.name);
  const [contactNo, setContactNo] = useState(user.contactNo);
  const [email, setEmail] = useState(user.email);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");

  const buttons = [
    { type: 'profile', name: 'Profile Settings', icon: UserIcon },
    { type: 'notification', name: 'Notifications', icon: BellIcon }
  ];

  // Live email validation
  const handleEmailChange = (value: string) => {
    setEmail(value);
    // Accept gmail.co or yahoo.co
    const regex = /^[^\s@]+@(gmail\.co|yahoo\.co)$/i;
    if (!regex.test(value)) {
      setEmailError("Email must be @gmail.co or @yahoo.co");
    } else {
      setEmailError("");
    }
  };

  // Live phone validation
  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, "");
    setContactNo(digits);

    if (!/^09\d{9}$/.test(digits)) {
      setPhoneError("Phone must start with 09 and be 11 digits");
    } else {
      setPhoneError("");
    }
  };

  const isInvalid = !!phoneError || !!emailError || !username || !contactNo || !email;

  /** ---------- PROFILE SAVE ---------- */
  const handleSaveProfile = () => {
    if (isInvalid) return;

    // Only send email verification if email changed
    if (email !== user.email) {
      setNewEmail(email);
      sendEmailVerification(user.email); // send to old email
      setIsVerifyingEmail(true);
      return;
    }

    // Update name and contact
    const updatedUser = { ...user, name: username, contactNo };
    updateUser && updateUser(updatedUser);
    Alert.alert("Success", "Profile updated successfully");
  };

  const sendEmailVerification = (oldEmail: string) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`Verification code sent to ${oldEmail}: ${code}`);
    Alert.alert("Email Verification", `A code was sent to ${oldEmail} (mock)`);
    setEmailCode(code);
  };

  const handleVerifyEmail = (inputCode: string) => {
    if (inputCode === emailCode) {
      const updatedUser = { ...user, email: newEmail, name: username, contactNo };
      updateUser && updateUser(updatedUser);
      setIsVerifyingEmail(false);
      Alert.alert("Success", "Email verified and profile updated!");
    } else {
      Alert.alert("Error", "Invalid verification code");
    }
  };

  /** ---------- LOGOUT ---------- */
  const handleLogout = () => {
    setActiveRoute("Login");
  };

  return (
    <View style={{ flexDirection: 'column', gap: 10 }}>
      <Text style={{ color: "#fff", fontSize: 25, fontWeight: "600" }}>Settings</Text>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: 30
        }}
      >
        {buttons.map((button, index) => (
          <Pressable
            onPress={() => setActive(button.type)}
            key={index}
            style={{
              backgroundColor:
                isActive === button.type
                  ? 'rgba(6, 182, 212, 0.1)'
                  : "#0F2A52",
              flexDirection: 'row',
              gap: 6,
              width: `${(100 / buttons.length) - 2}%`,
              paddingVertical: 10,
              justifyContent: 'center',
              borderRadius: 10
            }}
          >
            <button.icon color={isActive === button.type ? "#22D3EE" : "#9BB3D6"} />
            <Text style={{ color: isActive === button.type ? '#22D3EE' : "#9BB3D6" }}>{button.name}</Text>
          </Pressable>
        ))}
      </View>

      {isActive === "profile" &&
        <View style={{ flexDirection: 'column', gap: 12 }}>
          {/* Profile Information */}
          <View style={{ padding: 25, borderRadius: 12, backgroundColor: '#0F2A52', flexDirection: 'column', gap: 12 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Profile Information</Text>

            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 30 }}>
              <View style={{
                width: 70,
                height: 70,
                borderRadius: 9999,
                backgroundColor: '#0A1A3A',
                borderColor: '#06B6D4',
                borderWidth: 0.5,
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <UserIcon width={30} height={30} weight={1} />
              </View>
            </View>

            {/* User Info */}
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>{user.name}</Text>
              <Text style={{ color: '#9BB3D6' }}>{user.role}</Text>
            </View>

            {/* Editable Fields */}
            <View style={{ flexDirection: 'column', gap: 20 }}>
              {/* Name */}
              <View style={{ flexDirection: 'column', gap: 7 }}>
                <Text style={{ color: '#9BB3D6', fontSize: 11 }}>Full Name</Text>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  style={{
                    color: '#fff',
                    fontSize: 14,
                    letterSpacing: 0.9,
                    backgroundColor: '#0A1A3A',
                    borderRadius: 11,
                    paddingHorizontal: 15
                  }}
                />
              </View>

              {/* Phone */}
              <View style={{ flexDirection: 'column', gap: 7 }}>
                <Text style={{ color: '#9BB3D6', fontSize: 11 }}>Phone Number</Text>
                <TextInput
                  value={contactNo}
                  onChangeText={handlePhoneChange}
                  style={{
                    color: '#fff',
                    fontSize: 14,
                    letterSpacing: 0.9,
                    backgroundColor: '#0A1A3A',
                    borderRadius: 11,
                    paddingHorizontal: 15
                  }}
                  keyboardType="phone-pad"
                />
                {phoneError ? <Text style={{ color: "#F87171", fontSize: 11 }}>{phoneError}</Text> : null}
              </View>

              {/* Email */}
              <View style={{ flexDirection: 'column', gap: 7 }}>
                <Text style={{ color: '#9BB3D6', fontSize: 11 }}>Email Address</Text>
                <TextInput
                  value={email}
                  onChangeText={handleEmailChange}
                  style={{
                    color: '#fff',
                    fontSize: 14,
                    letterSpacing: 0.9,
                    backgroundColor: '#0A1A3A',
                    borderRadius: 11,
                    paddingHorizontal: 15
                  }}
                  autoCapitalize="none"
                />
                {emailError ? <Text style={{ color: "#F87171", fontSize: 11 }}>{emailError}</Text> : null}
              </View>

              <Pressable
                onPress={handleSaveProfile}
                style={{
                  backgroundColor: isInvalid ? '#555' : '#2EA8FF',
                  padding: 13,
                  borderRadius: 14,
                  alignItems: 'center',
                }}
                disabled={isInvalid}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Save Changes</Text>
              </Pressable>
            </View>
          </View>

          {/* Security */}
          <View style={{ padding: 25, borderRadius: 12, backgroundColor: '#0F2A52', flexDirection: 'column', gap: 12 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Security</Text>

            <View style={{ backgroundColor: '#0A1A3A', borderRadius: 18, padding: 18, gap: 15 }}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ backgroundColor: '#1E293B', alignSelf: 'flex-start', padding: 10, borderRadius: 8 }}>
                  <LockIcon />
                </View>
                <View style={{ flexDirection: 'column', alignSelf: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 14 }}>Password</Text>
                  <Text style={{ color: '#9BB3D6', fontSize: 12, fontWeight: '200' }}>Last changes {user.lastChangePass}</Text>
                </View>
              </View>

              <Pressable onPress={() => setShowChangePassword(true)}>
                <Text style={{ color: '#22D3EE', fontSize: 12, fontWeight: '400' }}>Change</Text>
              </Pressable>
            </View>
          </View>
        </View>
      }

      <Pressable
        onPress={handleLogout}
        style={({ pressed }) => ({
          backgroundColor: pressed ? 'rgba(239, 68, 68, 1)' : 'rgba(239, 68, 68, 0.1)',
          padding: 15,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 15,
          borderRadius: 12
        })}
      >
        <Image
          source={require("../../components/img/Logout.png")}
          style={{ width: 16, height: 16, marginRight: 5 }}
        />
        <Text style={{ color: '#F87171', fontSize: 14 }}>Log Out</Text>
      </Pressable>

      <VerifyEmailModal
        visible={isVerifyingEmail}
        oldEmail={user.email}
        onVerify={handleVerifyEmail}
        onCancel={() => setIsVerifyingEmail(false)}
      />

      <ChangePasswordModal
        visible={showChangePassword}
        userIndex={userIndex}
        onClose={() => setShowChangePassword(false)}
        onSuccess={(updatedFields) => updateUser(updatedFields)}
      />
    </View>
  );
}
