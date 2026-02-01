import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  AppState,
} from "react-native";

import { User } from "../../components/services/types";

import UserIcon from "../../components/svg/ProfileIcon";
import LockIcon from "../../components/svg/LockIcon";
import MailIcon from "../../components/svg/MailIcon";
import PhoneIcon from "../../components/svg/PhoneIcon";

import ChangePasswordModal from "../../components/modals/ChangePasswordModal";
import ChangeEmailModal from "../../components/modals/ChangeEmailModal";
import AddressModal, { AddressData } from "../../components/modals/AddressModal";

// Backend services
import {
  updateUserProfile,
  changeUserPassword,
  sendVerificationEmail,
  requestEmailChange,
  confirmEmailChange,
  cancelEmailChange,
  checkEmailVerification,
  verifyEmailCode,
} from "../../Backend/controller/user/settingService";
import {
  sendPhoneVerificationCode,
  verifyPhoneCode,
  resendPhoneCode,
} from "../../Backend/controller/auth/firebasePhoneAuth";
import { auth } from "../../Backend/firebase";

interface SettingsProps {
  user: User;
  currentUserEmail: string;
  setActiveRoute: (route: string) => void;
  onUserUpdate?: (updatedUser: User) => void;
  onRefresh?: () => Promise<void>;
}

interface Location {
  id: string;
  name: string;
  lat: string;
  lng: string;
}

const formatPhoneNumber = (phone: string): string => {
  // Remove all spaces and special characters
  const cleaned = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');

  // If starts with +63, replace with 0
  if (cleaned.startsWith('+63')) {
    return '0' + cleaned.slice(3);
  }

  // If starts with 63, replace with 0
  if (cleaned.startsWith('63')) {
    return '0' + cleaned.slice(2);
  }

  // If already starts with 0, return as is
  if (cleaned.startsWith('0')) {
    return cleaned;
  }

  // Otherwise, prepend 0
  return '0' + cleaned;
};

export default function Settings({
  user,
  setActiveRoute,
  currentUserEmail,
  onUserUpdate,
  onRefresh,
}: SettingsProps) {
  // ========== PROFILE STATE ==========
  const [isActive, setActive] = useState("profile");
  const [username, setUsername] = useState(user.name);
  const [contactNo, setContactNo] = useState(user.contactNo);
  const [email, setEmail] = useState(user.email);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);

  const [phoneError, setPhoneError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  // ========== ADDRESS STATE ==========
  const [addressData, setAddressData] = useState<AddressData | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // ========== EMAIL CHANGE STATE ==========
  const [pendingEmailChange, setPendingEmailChange] = useState<string | null>(null);
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [showEmailVerificationInput, setShowEmailVerificationInput] = useState(false);
  const [isEmailChanging, setIsEmailChanging] = useState(false);

  // ========== EMAIL VERIFICATION STATE ==========
  const [verificationCode, setVerificationCode] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);

  // ========== SMS VERIFICATION STATE ==========
  const [smsCodeInput, setSmsCodeInput] = useState("");
  const [showSmsCodeInput, setShowSmsCodeInput] = useState(false);
  const [smsTimer, setSmsTimer] = useState(0);
  const [smsLoading, setSmsLoading] = useState(false);

  // ========== LOCATION STATE ==========
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const timerIntervalRef = useRef<any>(null);
  const emailCheckIntervalRef = useRef<any>(null);

  const buttons = [{ type: "profile", name: "Profile Settings", icon: UserIcon }];

  // ========== EFFECTS ==========

  // SMS Timer countdown
  useEffect(() => {
    if (smsTimer > 0) {
      timerIntervalRef.current = setInterval(() => {
        setSmsTimer((prev) => prev - 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [smsTimer]);

  // Check verification status on component mount
  useEffect(() => {
    checkVerificationStatus();
  }, []);

  // Update local state when user prop changes
  useEffect(() => {
    setUsername(user.name);
    setContactNo(formatPhoneNumber(user.contactNo));
    setEmail(user.email);

    // Update address if user has one
    if (user.address) {
      setAddressData(user.address);
    }

    // Check if there's a pending email change
    if (user.pendingEmail) {
      setPendingEmailChange(user.pendingEmail);
      setShowEmailVerificationInput(true);
      startEmailVerificationPolling();
    } else {
      stopEmailVerificationPolling();
    }
  }, [user]);

  // Monitor app state changes (when user returns from email app)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      stopEmailVerificationPolling();
    };
  }, [pendingEmailChange]);

  // ========== APP STATE HANDLER ==========
  const handleAppStateChange = async (nextAppState: string) => {
    if (nextAppState === 'active' && pendingEmailChange) {
      console.log('📱 App became active, checking email verification...');
      await checkEmailChangeStatus();
    }
  };

  // ========== EMAIL VERIFICATION POLLING ==========
  const startEmailVerificationPolling = () => {
    // Check every 5 seconds for email verification
    if (!emailCheckIntervalRef.current) {
      console.log('🔄 Starting email verification polling...');
      emailCheckIntervalRef.current = setInterval(async () => {
        await checkEmailChangeStatus();
      }, 5000); // Check every 5 seconds
    }
  };

  const stopEmailVerificationPolling = () => {
    if (emailCheckIntervalRef.current) {
      console.log('⏹️ Stopping email verification polling');
      clearInterval(emailCheckIntervalRef.current);
      emailCheckIntervalRef.current = null;
    }
  };

  const checkEmailChangeStatus = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Reload user to get latest data
      await currentUser.reload();

      const newEmail = currentUser.email;
      const isVerified = currentUser.emailVerified;

      console.log('📧 Current email in Firebase Auth:', newEmail);
      console.log('✅ Email verified:', isVerified);

      // If email changed and is verified, update everything
      if (newEmail && newEmail === pendingEmailChange && isVerified) {
        console.log('🎉 Email change verified! Updating...');

        setPendingEmailChange(null);
        setShowEmailVerificationInput(false);
        setEmailVerificationCode('');
        setEmail(newEmail); // ✅ Now safe because we checked newEmail is not null
        setIsEmailVerified(true);

        stopEmailVerificationPolling();

        Alert.alert(
          'Success',
          'Your email has been successfully changed and verified!',
          [
            {
              text: 'OK',
              onPress: () => refreshUserData()
            }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Error checking email status:', error);
    }
  };

  // ========== ADDRESS HANDLER ==========

  const handleAddressChange = async (newAddress: AddressData) => {
    console.log("📍 Address changed:", newAddress);
    setAddressData(newAddress);
    setIsSavingAddress(true);

    try {
      const result = await updateUserProfile(user.uid, {
        address: {
          region: newAddress.region,
          regionCode: newAddress.regionCode,
          city: newAddress.city,
          cityCode: newAddress.cityCode,
          barangay: newAddress.barangay,
          barangayCode: newAddress.barangayCode,
          street: newAddress.street,
          postalCode: newAddress.postalCode,
        },
      });

      if (result.success) {
        console.log("✅ Address saved to Firestore");
        Alert.alert("Success", "Address updated successfully");
        await refreshUserData();
      } else {
        Alert.alert("Error", result.error || "Failed to save address");
      }
    } catch (error) {
      console.error("❌ Error saving address:", error);
      Alert.alert("Error", "Failed to save address");
    } finally {
      setIsSavingAddress(false);
    }
  };

  // ========== LOCATION HANDLER ==========

  const handleLocationSelect = async (location: Location) => {
    console.log("📍 Location selected:", location);
    setSelectedLocation(location);

    try {
      const result = await updateUserProfile(user.uid, {
        location: {
          name: location.name,
          lat: location.lat,
          lng: location.lng,
        }
      });

      if (result.success) {
        console.log("✅ Location saved to Firestore");
        Alert.alert("Success", "Location saved successfully");
        await refreshUserData();
      } else {
        Alert.alert("Error", result.error || "Failed to save location");
      }
    } catch (error) {
      console.error("❌ Error saving location:", error);
      Alert.alert("Error", "Failed to save location");
    }
  };

  // ========== PROFILE FUNCTIONS ==========

  const refreshUserData = async () => {
    try {
      if (onRefresh) {
        console.log("🔄 Refreshing user data from Firebase...");
        await onRefresh();
        console.log("✅ User data refreshed successfully");
      }
    } catch (error) {
      console.error("❌ Error refreshing user data:", error);
    }
  };

  const checkVerificationStatus = async () => {
    setIsCheckingEmail(true);
    try {
      const result = await checkEmailVerification();
      setIsEmailVerified(result.isVerified);
    } catch (error) {
      console.error("Error checking verification status:", error);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setContactNo(formatted);

    if (!/^09\d{9}$/.test(formatted)) {
      setPhoneError("Phone must start with 09 and be 11 digits");
    } else {
      setPhoneError("");
    }
  };

  const isInvalid = !!phoneError || !username || !contactNo;

  const handleSaveProfile = async () => {
    if (isInvalid) return;

    setIsSaving(true);

    try {
      // Format phone before saving
      const formattedPhone = formatPhoneNumber(contactNo);

      const result = await updateUserProfile(user.uid, {
        name: username,
        contactNo: formattedPhone,
      });

      if (result.success) {
        Alert.alert("Success", "Profile updated successfully");
        await refreshUserData();
      } else {
        Alert.alert("Error", result.error || "Failed to update profile");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update profile. Please try again.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // ========== EMAIL CHANGE HANDLERS ==========

  const handleEmailChangeRequest = async (newEmail: string, password: string) => {
    setIsEmailChanging(true);
    try {
      console.log('📧 Requesting email change to', newEmail);

      const result = await requestEmailChange(newEmail, password);

      if (result.success) {
        setPendingEmailChange(result.pendingEmail || newEmail);
        setShowChangeEmail(false);
        setShowEmailVerificationInput(true);

        // Start polling for email verification
        startEmailVerificationPolling();

        Alert.alert(
          'Verification Link Sent',
          `A verification link has been sent to ${newEmail}. Please check your email and click the link to complete the email change.\n\nThe link will be checked automatically.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to request email change');
      }
    } catch (error: any) {
      console.error('❌ Error requesting email change:', error);
      Alert.alert('Error', error.message || 'Failed to request email change');
    } finally {
      setIsEmailChanging(false);
    }
  };

  const handleConfirmEmailChange = async () => {
    // Manual check for email verification
    await checkEmailChangeStatus();
  };

  const handleCancelEmailChange = async () => {
    Alert.alert(
      'Cancel Email Change',
      'Are you sure you want to cancel the email change process?',
      [
        {
          text: 'No',
          style: 'cancel'
        },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              const result = await cancelEmailChange();
              if (result.success) {
                setPendingEmailChange(null);
                setShowEmailVerificationInput(false);
                setEmailVerificationCode('');
                stopEmailVerificationPolling();
                Alert.alert('Cancelled', 'Email change has been cancelled');
              } else {
                Alert.alert('Error', result.error || 'Failed to cancel email change');
              }
            } catch (error: any) {
              console.error('Error cancelling email change:', error);
              Alert.alert('Error', 'Failed to cancel email change');
            }
          }
        }
      ]
    );
  };

  // ========== SMS VERIFICATION FUNCTIONS ==========

  const handleSendSMSCode = async () => {
    const formattedPhone = formatPhoneNumber(contactNo);

    if (!formattedPhone || formattedPhone.length !== 11) {
      Alert.alert("Error", "Please enter a valid 11-digit phone number");
      return;
    }

    setSmsLoading(true);
    try {
      console.log("📱 Sending SMS via Firebase to:", formattedPhone);

      await sendPhoneVerificationCode(formattedPhone);

      setShowSmsCodeInput(true);
      setSmsTimer(600); // 10 minutes
      Alert.alert("Success", `Verification code sent to ${formattedPhone}`);
      console.log("✅ SMS sent successfully");
    } catch (error: any) {
      console.error("❌ SMS send error:", error);
      Alert.alert("Error", error.message || "Failed to send verification code");
    } finally {
      setSmsLoading(false);
    }
  };

  const handleVerifySMSCode = async () => {
    if (!smsCodeInput || smsCodeInput.length !== 6) {
      Alert.alert("Error", "Please enter a valid 6-digit code");
      return;
    }

    setSmsLoading(true);
    try {
      console.log("🔐 Verifying SMS code...");

      const result = await verifyPhoneCode(smsCodeInput);

      if (result.success) {
        Alert.alert("Success", "Phone number verified successfully!");
        setShowSmsCodeInput(false);
        setSmsCodeInput("");
        setIsPhoneVerified(true);

        await refreshUserData();
      } else {
        Alert.alert("Error", "Verification failed");
      }
    } catch (error: any) {
      console.error("❌ SMS verification error:", error);
      Alert.alert("Error", error.message || "Failed to verify code");
    } finally {
      setSmsLoading(false);
    }
  };

  const handleResendSMSCode = async () => {
    if (smsTimer > 0) return;

    setSmsLoading(true);
    try {
      console.log("📱 Resending SMS code...");

      const formattedPhone = formatPhoneNumber(contactNo);
      await resendPhoneCode(formattedPhone);

      setSmsTimer(600);
      Alert.alert("Success", "New verification code sent");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to resend code");
    } finally {
      setSmsLoading(false);
    }
  };

  // ========== EMAIL VERIFICATION FUNCTIONS ==========

  const handleSendVerification = async () => {
    try {
      const result = await sendVerificationEmail();

      if (result.success) {
        setShowCodeInput(true);
        Alert.alert(
          "Verification Code Sent",
          "A 6-digit verification code has been sent to your email. Please enter it below.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("Error", result.error || "Failed to send verification code");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to send verification code");
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert("Error", "Please enter a valid 6-digit code");
      return;
    }

    try {
      const result = await verifyEmailCode(verificationCode);

      if (result.success) {
        Alert.alert("Success", "Email verified successfully!");
        setShowCodeInput(false);
        setVerificationCode("");
        setIsEmailVerified(true);

        await refreshUserData();
      } else {
        Alert.alert("Error", result.error || "Failed to verify code");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to verify code");
    }
  };

  // ========== PASSWORD CHANGE FUNCTION ==========

  const handlePasswordChange = async (oldPassword: string, newPassword: string) => {
    try {
      const result = await changeUserPassword(oldPassword, newPassword);

      if (result.success) {
        Alert.alert("Success", "Password changed successfully!");
        setShowChangePassword(false);

        await refreshUserData();
      } else {
        Alert.alert("Error", result.error || "Failed to change password");
        throw new Error(result.error);
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  // ========== LOGOUT FUNCTION ==========

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              stopEmailVerificationPolling();
              await auth.signOut();
              setActiveRoute("Login");
            } catch (error) {
              console.error("❌ Logout error:", error);
              Alert.alert("Error", "Failed to logout");
            }
          }
        }
      ]
    );
  };

  // ========== RENDER ==========

  return (
    <ScrollView style={{ flex: 1 }}>
      <Text style={{ color: "#fff", fontSize: 25, fontWeight: "600", marginBottom: 20 }}>
        Settings
      </Text>

      {isActive === "profile" && (
        <View style={{ flexDirection: "column", gap: 12 }}>
          {/* ========== PROFILE INFORMATION SECTION ========== */}
          <View
            style={{
              padding: 25,
              borderRadius: 12,
              backgroundColor: "#0F2A52",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 15 }}>
              Profile Information
            </Text>

            {/* Profile Avatar */}
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", marginTop: 30 }}>
              <View
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 9999,
                  backgroundColor: "#0A1A3A",
                  borderColor: "#06B6D4",
                  borderWidth: 0.5,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <UserIcon width={30} height={30} weight={1} />
              </View>
            </View>

            {/* User Info */}
            <View style={{ justifyContent: "center", alignItems: "center" }}>
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 14 }}>{user.name}</Text>
              <Text style={{ color: "#9BB3D6" }}>{user.role}</Text>
            </View>

            {/* Editable Fields */}
            <View style={{ flexDirection: "column", gap: 20 }}>
              {/* Full Name */}
              <View style={{ flexDirection: "column", gap: 7 }}>
                <Text style={{ color: "#9BB3D6", fontSize: 11 }}>Full Name</Text>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  style={{
                    color: "#fff",
                    fontSize: 14,
                    letterSpacing: 0.9,
                    backgroundColor: "#0A1A3A",
                    borderRadius: 11,
                    paddingHorizontal: 15,
                    paddingVertical: 12,
                  }}
                />
              </View>

              {/* Phone Number */}
              <View style={{ flexDirection: "column", gap: 7 }}>
                <Text style={{ color: "#9BB3D6", fontSize: 11 }}>Phone Number</Text>
                <TextInput
                  value={contactNo}
                  onChangeText={handlePhoneChange}
                  placeholder="09XXXXXXXXX"
                  placeholderTextColor="#666"
                  style={{
                    color: "#fff",
                    fontSize: 14,
                    letterSpacing: 0.9,
                    backgroundColor: "#0A1A3A",
                    borderRadius: 11,
                    paddingHorizontal: 15,
                    paddingVertical: 12,
                  }}
                  keyboardType="phone-pad"
                  maxLength={11}
                />
                {phoneError ? <Text style={{ color: "#F87171", fontSize: 11 }}>{phoneError}</Text> : null}
              </View>

              {/* Address Section */}
              <View style={{ flexDirection: "column", gap: 7 }}>
                <Text style={{ color: "#9BB3D6", fontSize: 11 }}>Address</Text>
                <Pressable
                  onPress={() => setShowAddressModal(true)}
                  disabled={isSavingAddress}
                  style={{
                    backgroundColor: "#0A1A3A",
                    borderRadius: 11,
                    paddingHorizontal: 15,
                    paddingVertical: 12,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    opacity: isSavingAddress ? 0.6 : 1,
                  }}
                >
                  <Text
                    style={{
                      color: addressData ? "#22D3EE" : "#9BB3D6",
                      fontSize: 14,
                      flex: 1
                    }}
                    numberOfLines={1}
                  >
                    {addressData
                      ? `${addressData.barangay}, ${addressData.city}, ${addressData.region}`
                      : "Select Address"}
                  </Text>
                  {isSavingAddress ? (
                    <ActivityIndicator size="small" color="#22D3EE" />
                  ) : (
                    <Text style={{ color: "#22D3EE", fontSize: 12, marginLeft: 10 }}>Change</Text>
                  )}
                </Pressable>
              </View>

              {/* Email Address */}
              <View style={{ flexDirection: "column", gap: 7 }}>
                <Text style={{ color: "#9BB3D6", fontSize: 11 }}>Email Address</Text>
                <View
                  style={{
                    backgroundColor: "#0A1A3A",
                    borderRadius: 11,
                    paddingHorizontal: 15,
                    paddingVertical: 12,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 14, flex: 1 }} numberOfLines={1}>
                    {email}
                  </Text>
                  <Pressable
                    onPress={() => setShowChangeEmail(true)}
                    disabled={isEmailChanging || showEmailVerificationInput || isEmailVerified}
                  >
                    <Text
                      style={{
                        color: isEmailVerified ? "#10B981" : "#22D3EE",
                        fontSize: 12,
                        marginLeft: 10
                      }}
                    >
                      {isEmailVerified ? "Verified ✓" : "Change"}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Email Change Verification Status */}
              {pendingEmailChange && showEmailVerificationInput && (
                <View style={{
                  backgroundColor: "#0A1A3A",
                  borderRadius: 11,
                  padding: 15,
                  gap: 10,
                  marginTop: 5
                }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <ActivityIndicator size="small" color="#22D3EE" />
                    <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600", flex: 1 }}>
                      Waiting for Email Verification
                    </Text>
                  </View>

                  <Text style={{ color: "#9BB3D6", fontSize: 11 }}>
                    Verification link sent to:{' '}
                    <Text style={{ color: "#22D3EE", fontWeight: "600" }}>{pendingEmailChange}</Text>
                  </Text>

                  <Text style={{ color: "#9BB3D6", fontSize: 11, fontStyle: "italic" }}>
                    Please check your email and click the verification link. This will be detected automatically.
                  </Text>

                  <Pressable
                    onPress={handleConfirmEmailChange}
                    disabled={isEmailChanging}
                    style={{
                      backgroundColor: isEmailChanging ? "#555" : "#22D3EE",
                      padding: 12,
                      borderRadius: 8,
                      alignItems: "center",
                    }}
                  >
                    {isEmailChanging ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 13 }}>
                        Check Verification Status
                      </Text>
                    )}
                  </Pressable>

                  <Pressable
                    onPress={handleCancelEmailChange}
                    disabled={isEmailChanging}
                    style={{
                      backgroundColor: "#555",
                      padding: 10,
                      borderRadius: 8,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 12 }}>
                      Cancel Email Change
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* Save Profile Button */}
              <Pressable
                onPress={handleSaveProfile}
                style={{
                  backgroundColor: isInvalid || isSaving ? "#555" : "#2EA8FF",
                  padding: 13,
                  borderRadius: 14,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                  marginTop: 10
                }}
                disabled={isInvalid || isSaving}
              >
                {isSaving && <ActivityIndicator size="small" color="#fff" />}
                <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 15 }}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* ========== SECURITY SECTION ========== */}
          <View
            style={{
              padding: 25,
              borderRadius: 12,
              backgroundColor: "#0F2A52",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 15 }}>Security</Text>

            {/* Phone Verification */}
            <View style={{ backgroundColor: "#0A1A3A", borderRadius: 18, padding: 18, gap: 15 }}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View
                  style={{
                    backgroundColor: "#1E293B",
                    alignSelf: "flex-start",
                    padding: 10,
                    borderRadius: 8,
                  }}
                >
                  <PhoneIcon />
                </View>
                <View style={{ flexDirection: "column", alignSelf: "center", flex: 1 }}>
                  <Text style={{ color: "#fff", fontSize: 14 }}>Phone Verification</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: isPhoneVerified ? "#10B981" : "#F59E0B",
                      }}
                    />
                    <Text style={{ color: "#9BB3D6", fontSize: 12, fontWeight: "200" }}>
                      {isPhoneVerified ? "Verified" : "Not Verified"}
                    </Text>
                  </View>
                </View>
              </View>

              {!isPhoneVerified && (
                <>
                  {!showSmsCodeInput ? (
                    <Pressable
                      onPress={handleSendSMSCode}
                      disabled={smsLoading || !contactNo || !!phoneError}
                      style={{ opacity: smsLoading || !contactNo || !!phoneError ? 0.5 : 1 }}
                    >
                      <Text style={{ color: "#22D3EE", fontSize: 12, fontWeight: "400" }}>
                        {smsLoading ? "Sending..." : "Send SMS Verification Code"}
                      </Text>
                    </Pressable>
                  ) : (
                    <>
                      <View style={{ flexDirection: "column", gap: 7 }}>
                        <Text style={{ color: "#9BB3D6", fontSize: 11 }}>Enter 6-digit code</Text>
                        <TextInput
                          value={smsCodeInput}
                          onChangeText={setSmsCodeInput}
                          placeholder="000000"
                          placeholderTextColor="#555"
                          keyboardType="number-pad"
                          maxLength={6}
                          editable={!smsLoading}
                          style={{
                            color: "#fff",
                            fontSize: 18,
                            letterSpacing: 8,
                            backgroundColor: "#1E293B",
                            borderRadius: 11,
                            paddingHorizontal: 15,
                            paddingVertical: 12,
                            textAlign: "center",
                          }}
                        />
                      </View>

                      <Pressable
                        onPress={handleVerifySMSCode}
                        disabled={smsLoading || smsCodeInput.length !== 6}
                        style={{
                          backgroundColor:
                            smsLoading || smsCodeInput.length !== 6 ? "#555" : "#22D3EE",
                          padding: 10,
                          borderRadius: 8,
                          alignItems: "center",
                        }}
                      >
                        {smsLoading ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={{ color: "#fff", fontWeight: "bold" }}>Verify Code</Text>
                        )}
                      </Pressable>

                      <Pressable
                        onPress={handleResendSMSCode}
                        disabled={smsTimer > 0 || smsLoading}
                        style={{ opacity: smsTimer > 0 || smsLoading ? 0.5 : 1 }}
                      >
                        <Text style={{ color: "#9BB3D6", fontSize: 11, textAlign: "center" }}>
                          {smsTimer > 0 ? `Resend in ${smsTimer}s` : "Didn't receive code? Resend"}
                        </Text>
                      </Pressable>
                    </>
                  )}
                </>
              )}
            </View>

            {/* Email Verification */}
            <View style={{ backgroundColor: "#0A1A3A", borderRadius: 18, padding: 18, gap: 15 }}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View
                  style={{
                    backgroundColor: "#1E293B",
                    alignSelf: "flex-start",
                    padding: 10,
                    borderRadius: 8,
                  }}
                >
                  <MailIcon />
                </View>
                <View style={{ flexDirection: "column", alignSelf: "center", flex: 1 }}>
                  <Text style={{ color: "#fff", fontSize: 14 }}>Email Verification</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                    {isCheckingEmail ? (
                      <ActivityIndicator size="small" color="#22D3EE" />
                    ) : (
                      <>
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: isEmailVerified ? "#10B981" : "#F59E0B",
                          }}
                        />
                        <Text style={{ color: "#9BB3D6", fontSize: 12, fontWeight: "200" }}>
                          {isEmailVerified ? "Verified" : "Not Verified"}
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              </View>

              {!isEmailVerified && (
                <>
                  {!showCodeInput ? (
                    <Pressable onPress={handleSendVerification} disabled={isCheckingEmail}>
                      <Text style={{ color: "#22D3EE", fontSize: 12, fontWeight: "400" }}>
                        Send Verification Code
                      </Text>
                    </Pressable>
                  ) : (
                    <>
                      <View style={{ flexDirection: "column", gap: 7 }}>
                        <Text style={{ color: "#9BB3D6", fontSize: 11 }}>Enter 6-digit code</Text>
                        <TextInput
                          value={verificationCode}
                          onChangeText={setVerificationCode}
                          placeholder="000000"
                          placeholderTextColor="#555"
                          keyboardType="number-pad"
                          maxLength={6}
                          style={{
                            color: "#fff",
                            fontSize: 18,
                            letterSpacing: 8,
                            backgroundColor: "#1E293B",
                            borderRadius: 11,
                            paddingHorizontal: 15,
                            paddingVertical: 12,
                            textAlign: "center",
                          }}
                        />
                      </View>

                      <Pressable
                        onPress={handleVerifyCode}
                        disabled={verificationCode.length !== 6}
                        style={{
                          backgroundColor: verificationCode.length !== 6 ? "#555" : "#22D3EE",
                          padding: 10,
                          borderRadius: 8,
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ color: "#fff", fontWeight: "bold" }}>Verify Code</Text>
                      </Pressable>

                      <Pressable onPress={handleSendVerification}>
                        <Text style={{ color: "#9BB3D6", fontSize: 11, textAlign: "center" }}>
                          Didn't receive code? Resend
                        </Text>
                      </Pressable>
                    </>
                  )}

                  <Pressable onPress={checkVerificationStatus} disabled={isCheckingEmail}>
                    <Text style={{ color: "#9BB3D6", fontSize: 12, fontWeight: "400" }}>
                      {isCheckingEmail ? "Checking..." : "Refresh Verification Status"}
                    </Text>
                  </Pressable>
                </>
              )}
            </View>

            {/* Password */}
            <View style={{ backgroundColor: "#0A1A3A", borderRadius: 18, padding: 18, gap: 15 }}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View
                  style={{
                    backgroundColor: "#1E293B",
                    alignSelf: "flex-start",
                    padding: 10,
                    borderRadius: 8,
                  }}
                >
                  <LockIcon />
                </View>
                <View style={{ flexDirection: "column", alignSelf: "center" }}>
                  <Text style={{ color: "#fff", fontSize: 14 }}>Password</Text>
                  <Text style={{ color: "#9BB3D6", fontSize: 12, fontWeight: "200" }}>
                    Last changed {user.lastChangePass || "Never"}
                  </Text>
                </View>
              </View>

              <Pressable onPress={() => setShowChangePassword(true)}>
                <Text style={{ color: "#22D3EE", fontSize: 12, fontWeight: "400" }}>Change</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Logout Button */}
      <Pressable
        onPress={handleLogout}
        style={({ pressed }) => ({
          backgroundColor: pressed ? "rgba(239, 68, 68, 1)" : "rgba(239, 68, 68, 0.1)",
          padding: 15,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 15,
          borderRadius: 12,
          marginTop: 20,
          marginBottom: 30,
        })}
      >
        <Image
          source={require("../../components/img/Logout.png")}
          style={{ width: 16, height: 16, marginRight: 5 }}
        />
        <Text style={{ color: "#F87171", fontSize: 14 }}>Log Out</Text>
      </Pressable>

      {/* Modals */}
      <ChangePasswordModal
        visible={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSuccess={handlePasswordChange}
      />

      <ChangeEmailModal
        visible={showChangeEmail}
        currentEmail={email}
        onClose={() => setShowChangeEmail(false)}
        onSuccess={handleEmailChangeRequest}
      />

      <AddressModal
        visible={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onSave={handleAddressChange}
        currentAddress={addressData || undefined}
      />
    </ScrollView>
  );
}