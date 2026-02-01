import { useEffect, useState } from "react";
import { View, Text, ScrollView, Dimensions, Pressable, ActivityIndicator } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';

import UserIcon from "../../components/svg/ProfileIcon";
import MailIcon from "../../components/svg/MailIcon";
import PhoneIcon from "../../components/svg/PhoneIcon";
import ShieldIcon from "../../components/svg/ShieldIcon";
import LocationIcon from "../../components/svg/LocationIcon";
import CircleIcon from "../../components/svg/CircleIcon";
import BatteryIcon from "../../components/svg/BatteryIcon";
import SensorIcon from "../../components/svg/SensorIcon";
import RightArrowIcon from "../../components/svg/RightArrowIcon";

import EmailVerificationModal from "../../components/modals/EmailVerificationModal";

import { Sensor, User, TrustedContact } from "../../components/services/types";
import { getPendingVerificationCode } from "../../Backend/controller/auth/authService";
import { auth } from "../../Backend/firebase";

interface HomeProps {
    user: User;
    sensors: Sensor[];
    trustedContact: TrustedContact[];
    setActiveRoute: (route: string) => void;
    onUserRefresh?: () => Promise<void>;
    isNewRegistration?: boolean;
}

function formatNumberGroups(value: string) {
    return value
        .toString()
        .replace(/\D/g, "")
        .replace(/(.{4})/g, "$1 ")
        .trim();
}

export default function Home({
    user,
    sensors,
    trustedContact,
    setActiveRoute,
    onUserRefresh,
    isNewRegistration = false,
}: HomeProps) {
    const screenHeight = Dimensions.get('window').height;

    // ========== EMAIL VERIFICATION STATE ==========
    const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
    const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
    const [verificationExpiresAt, setVerificationExpiresAt] = useState<Date | undefined>();
    const [hasCheckedVerification, setHasCheckedVerification] = useState(false);

    // Get user first name safely
    const firstName = user?.name ? user.name.split(' ')[0] : 'User';
    const deviceID = user?.deviceID || 'N/A';
    const lastOnline = user?.lastOnline || 'Never';
    const battery = user?.battery || 0;

    // Determine which email to show based on user role
    const isRider = user?.role?.toLowerCase() === 'rider';

    // ========== AUTO-OPEN MODAL AFTER REGISTRATION ==========
    useEffect(() => {
        if (isNewRegistration && !user.emailVerified && !hasCheckedVerification) {
            checkForPendingVerification(true);
        }
    }, [isNewRegistration]);

    // ========== FUNCTIONS ==========

    const checkForPendingVerification = async (autoOpen = false) => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            console.log('🔍 Checking for pending verification codes...');

            const result = await getPendingVerificationCode(currentUser.uid);

            if (result.hasPendingCode) {
                console.log('✅ Found pending verification code');
                setPendingVerificationEmail(result.email || null);
                setVerificationExpiresAt(result.expiresAt);

                if (autoOpen) {
                    console.log('📱 Auto-opening modal for new registration');
                    setShowEmailVerificationModal(true);
                }
            } else {
                console.log('✅ No pending verification codes');
            }

            setHasCheckedVerification(true);
        } catch (error) {
            console.error('❌ Error checking verification status:', error);
            setHasCheckedVerification(true);
        }
    };

    const handleVerificationSuccess = async () => {
        console.log('✅ Email verified successfully!');
        setPendingVerificationEmail(null);
        setShowEmailVerificationModal(false);

        if (onUserRefresh) {
            try {
                await onUserRefresh();
            } catch (error) {
                console.error('❌ Error refreshing user data:', error);
            }
        }
    };

    return (
        <View style={{ flex: 1 }}>
            {/* Email Verification Modal */}
            <EmailVerificationModal
                visible={showEmailVerificationModal}
                email={pendingVerificationEmail || user.email}
                expiresAt={verificationExpiresAt}
                onClose={() => setShowEmailVerificationModal(false)}
                onSuccess={handleVerificationSuccess}
                onUserRefresh={onUserRefresh}
            />

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                <View
                    style={{
                        flexDirection: 'column',
                        gap: 15,
                        paddingBottom: 50
                    }}
                >

                    {/* 1st Column (Welcoming User) */}
                    <LinearGradient
                        colors={['#0F2A52', '#0A1A3A']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                            padding: 20,
                            borderRadius: 10
                        }}
                    >
                        <Text
                            style={{
                                color: 'white',
                                fontSize: 22,
                                fontWeight: 'bold',
                                letterSpacing: 1.2
                            }}
                        >
                            Welcome Back, {firstName}
                        </Text>

                        <Text
                            style={{
                                color: '#9BB3D6',
                                fontSize: 11,
                                marginTop: 5
                            }}
                        >
                            {isRider
                                ? 'Your helmet is connected and systems are optimized.'
                                : 'View riders who have added you as their emergency contact.'}
                        </Text>

                        {/* Email Verification Status Banner */}
                        {user.emailVerified ? (
                            // ✅ Email Verified - Show green banner
                            <View
                                style={{
                                    marginTop: 12,
                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                    borderRadius: 8,
                                    padding: 12,
                                    borderLeftWidth: 4,
                                    borderLeftColor: '#10B981',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 10,
                                }}
                            >
                                <View
                                    style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: 3,
                                        backgroundColor: '#10B981',
                                    }}
                                />
                                <Text style={{ color: '#A7F3D0', fontSize: 11, flex: 1 }}>
                                    Email verified ✓
                                </Text>
                            </View>
                        ) : !isNewRegistration ? (
                            // ❌ Email Not Verified - Show yellow banner (only if not newly registered)
                            <Pressable
                                onPress={() => setShowEmailVerificationModal(true)}
                                style={{
                                    marginTop: 12,
                                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                    borderRadius: 8,
                                    padding: 12,
                                    borderLeftWidth: 4,
                                    borderLeftColor: '#F59E0B',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 10,
                                }}
                            >
                                <View
                                    style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: 3,
                                        backgroundColor: '#F59E0B',
                                    }}
                                />
                                <Text style={{ color: '#FCD34D', fontSize: 11, flex: 1 }}>
                                    Complete email verification to unlock all features
                                </Text>
                                <Text style={{ color: '#F59E0B', fontSize: 11, fontWeight: '600' }}>
                                    Verify
                                </Text>
                            </Pressable>
                        ) : null}
                    </LinearGradient>

                    {/* 2nd Column (Showing user connection, battery, sensors)*/}
                    {user.role === 'rider' &&
                        <LinearGradient
                            colors={['#0F2A52', '#0A1A3A']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                                padding: 20,
                                borderRadius: 10
                            }}
                        >
                            {/* ShieldIcon + Connection Output */}
                            <View
                                style={{ flexDirection: 'row', justifyContent: 'space-between' }}
                            >
                                <View
                                    style={{
                                        backgroundColor: '#0A1A3A',
                                        padding: 10,
                                        width: 'auto',
                                        borderRadius: 13,
                                    }}
                                >
                                    <ShieldIcon size={30} />
                                </View>

                                <View
                                    style={{
                                        backgroundColor: 'rgba(236, 57, 25, 0.1)',
                                        paddingHorizontal: 17,
                                        paddingVertical: 3,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 10,
                                        alignSelf: 'flex-start',
                                        borderRadius: 20
                                    }}
                                >
                                    <CircleIcon size={10} color="#b32020" />
                                    <Text
                                        style={{
                                            color: '#b32020'
                                        }}
                                    >
                                        Not Connected
                                    </Text>
                                </View>
                            </View>

                            {/* User Hardware Device ID and battery and sensors connection */}
                            <View style={{ marginTop: 15, flexDirection: 'column', gap: 3 }}>
                                <Text
                                    style={{
                                        color: '#fff',
                                        fontSize: 19,
                                        fontWeight: 'bold',
                                        letterSpacing: 1.2
                                    }}
                                >
                                    Smart Helmet {deviceID}
                                </Text>
                                <Text
                                    style={{
                                        color: '#9BB3D6',
                                        fontSize: 12
                                    }}
                                >
                                    Last synced: {lastOnline}
                                </Text>

                                {/* Scrollable section with fixed height */}
                                <View
                                    style={{
                                        height: screenHeight * 0.12,
                                        marginTop: 20
                                    }}
                                >
                                    <ScrollView
                                        contentContainerStyle={{
                                            flexDirection: 'row',
                                            flexWrap: 'wrap',
                                            justifyContent: 'space-between',
                                        }}
                                        showsVerticalScrollIndicator={true}
                                    >
                                        {/* Battery card */}
                                        <View
                                            style={{
                                                width: '48%',
                                                marginBottom: 10,
                                                backgroundColor: '#0A1A3A',
                                                padding: 10,
                                                borderRadius: 8,
                                                flexDirection: 'column'
                                            }}
                                        >
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                <BatteryIcon />
                                                <Text style={{ color: '#9BB3D6' }}>Battery</Text>
                                            </View>
                                            <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 19, letterSpacing: 1.1 }}>
                                                {battery}%
                                            </Text>
                                        </View>

                                        {/* Sensors */}
                                        {sensors && sensors.length > 0 ? (
                                            sensors.map((sensor, index) => (
                                                <View
                                                    key={index}
                                                    style={{
                                                        width: '48%',
                                                        marginBottom: 10,
                                                        backgroundColor: '#0A1A3A',
                                                        padding: 10,
                                                        borderRadius: 8,
                                                        flexDirection: 'column'
                                                    }}
                                                >
                                                    <View style={{ flexDirection: 'row', gap: 6 }}>
                                                        <SensorIcon />
                                                        <Text style={{ color: '#9BB3D6' }}>
                                                            {sensor.name?.charAt(0).toUpperCase() + sensor.name?.slice(1)}
                                                        </Text>
                                                    </View>
                                                    <Text
                                                        style={{
                                                            color: sensor.status === "active" ? "#4ADE80" : "#ca3f3aff",
                                                            fontWeight: '600',
                                                            fontSize: 19,
                                                            letterSpacing: 1.1
                                                        }}
                                                    >
                                                        {sensor.status?.charAt(0).toUpperCase() + sensor.status?.slice(1)}
                                                    </Text>
                                                </View>
                                            ))
                                        ) : null}
                                    </ScrollView>
                                </View>
                            </View>
                        </LinearGradient>
                    }

                    {/* Live Tracking */}
                    <LinearGradient
                        colors={['#000', '#0F2A52']}
                        start={{ x: 0.01, y: 0.001 }}
                        end={{ x: 0, y: 1 }}
                        style={{
                            padding: 20,
                            borderRadius: 10,
                            flexDirection: 'column',
                            gap: 12
                        }}
                    >
                        <View
                            style={{
                                backgroundColor: 'rgba(6, 182, 212, 0.2)',
                                padding: 10,
                                alignSelf: 'flex-start',
                                flexDirection: 'row',
                                borderRadius: 13
                            }}
                        >
                            <LocationIcon />
                        </View>

                        <Text
                            style={{
                                color: '#fff',
                                fontSize: 18,
                                fontWeight: '500',
                                letterSpacing: 1.1
                            }}
                        >
                            Live Tracking
                        </Text>

                        <Text
                            style={{
                                color: '#9BB3D6',
                                fontSize: 12
                            }}
                        >
                            View real-time location and ride history
                        </Text>

                        <Pressable onPress={() => setActiveRoute('LiveGps')}>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    gap: 12,
                                    alignItems: 'center'
                                }}
                            >
                                <Text style={{ color: '#22D3EE', fontSize: 12, fontWeight: '600' }}>
                                    Open Map
                                </Text>
                                <RightArrowIcon />
                            </View>
                        </Pressable>
                    </LinearGradient>

                    {/* Trusted Contacts */}
                    <View>
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                marginBottom: 12
                            }}
                        >
                            <Text
                                style={{
                                    color: '#fff',
                                    fontWeight: '700',
                                    fontSize: 16
                                }}
                            >
                                {isRider ? 'Emergency Contacts' : 'Riders'}
                            </Text>
                            <Pressable onPress={() => setActiveRoute('ContactPersons')}>
                                <Text
                                    style={{
                                        color: '#22D3EE',
                                        fontSize: 12
                                    }}
                                >
                                    View All
                                </Text>
                            </Pressable>
                        </View>

                        <View style={{ flexDirection: 'column', gap: 20 }}>

                            {/* Maximum can be shown is 2 contacts */}
                            {trustedContact && trustedContact.length > 0 ? (
                                <>
                                    {trustedContact.slice(0, 2).map((contact, index) => (
                                        <View
                                            key={contact.id || index}
                                            style={{
                                                backgroundColor: '#0F2A52',
                                                padding: 20,
                                                flexDirection: 'column',
                                                borderRadius: 20,
                                                shadowColor: 'rgba(46, 168, 255, 0.5)',
                                                shadowOpacity: 0.2,
                                                shadowOffset: { width: 0, height: 1 },
                                                shadowRadius: 20,
                                                elevation: 12,
                                            }}
                                        >
                                            {/* Contacts Name and relation */}
                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    gap: 15
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        backgroundColor: '#0A1A3A',
                                                        padding: 10,
                                                        alignSelf: 'flex-start',
                                                        borderRadius: 11
                                                    }}
                                                >
                                                    <UserIcon width={30} height={30} />
                                                </View>
                                                <View
                                                    style={{
                                                        flexDirection: 'column',
                                                        justifyContent: 'space-evenly'
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            color: '#fff',
                                                            fontWeight: '600',
                                                            fontSize: 15,
                                                            letterSpacing: 0.4
                                                        }}
                                                    >
                                                        {contact.name || 'Unknown'}
                                                    </Text>
                                                    <View
                                                        style={{
                                                            backgroundColor: 'rgba(6, 182, 212, 0.1)',
                                                            alignSelf: 'flex-start',
                                                            paddingHorizontal: 14,
                                                            paddingVertical: 1,
                                                            borderRadius: 4
                                                        }}
                                                    >
                                                        <Text
                                                            style={{ color: '#22D3EE', fontWeight: '300', fontSize: 11 }}
                                                        >
                                                            {contact.relation || 'Contact'}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>

                                            {/* Contacts Email and Contact Number */}
                                            <View
                                                style={{
                                                    flexDirection: 'column',
                                                    gap: 12,
                                                    marginTop: 20
                                                }}
                                            >
                                                {/* Contact Number */}
                                                <View
                                                    style={{
                                                        flexDirection: 'row',
                                                        gap: 13,
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    <PhoneIcon />
                                                    <Text style={{ color: '#9BB3D6', fontSize: 12 }}>
                                                        {contact.contactNo ? formatNumberGroups(contact.contactNo) : 'N/A'}
                                                    </Text>
                                                </View>

                                                {/* Email - Show correct email based on user role */}
                                                <View
                                                    style={{
                                                        flexDirection: 'row',
                                                        gap: 13,
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    <MailIcon />
                                                    <Text style={{ color: '#9BB3D6', fontSize: 12 }}>
                                                        {isRider ? (contact.email || 'N/A') : (contact.contactEmail || 'N/A')}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    ))}

                                    {/* Total contacts that still not been shown */}
                                    {trustedContact.length > 2 && (
                                        <Text
                                            style={{
                                                textAlign: 'center',
                                                color: '#94A3B8'
                                            }}
                                        >
                                            and {trustedContact.length - 2} other{trustedContact.length - 2 !== 1 ? 's' : ''} not shown
                                        </Text>
                                    )}
                                </>
                            ) : (
                                <Text
                                    style={{
                                        textAlign: 'center',
                                        color: '#94A3B8',
                                        paddingVertical: 20
                                    }}
                                >
                                    {isRider
                                        ? 'No emergency contacts added yet. Add your first contact to get started.'
                                        : 'No riders have added you as their emergency contact yet.'}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}