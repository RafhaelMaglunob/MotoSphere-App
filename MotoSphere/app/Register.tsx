import { useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Image, Text, TextInput, View, Pressable, ScrollView, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { registerUser } from '../Backend/controller/auth/authService';
import { useExitConfirmation } from '../components/navigation/BackButtonHandler';

export default function Register() {
    useExitConfirmation();

    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const [fullname, setFullname] = useState('');
    const [role, setRole] = useState<'Rider' | 'Emergency Contact'>('Rider');
    const [email, setEmail] = useState('');
    const [contact, setContact] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);

    const [error, setError] = useState({ fullName: '', email: '', contact: '', password: '', confirmPassword: '' });
    const allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com'];

    // Fullname validation
    const handleFullNameChange = (value: string) => {
        const cleaned = value.replace(/^\s+/, '').replace(/\s+$/, ' ');
        const normalized = cleaned.replace(/\s+/g, ' ');

        setFullname(normalized);

        const pattern = /^[A-Za-z\s]*$/;
        if (!pattern.test(normalized)) {
            setError(prev => ({ ...prev, fullName: 'Full Name can only contain letters and spaces.' }));
        } else if (normalized.length === 0) {
            setError(prev => ({ ...prev, fullName: 'Full Name is required.' }));
        } else {
            setError(prev => ({ ...prev, fullName: '' }));
        }
    };

    // Email validation
    const handleEmailChange = (value: string) => {
        setEmail(value);

        const emailPattern = /^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/;
        if (!emailPattern.test(value)) {
            setError(prev => ({ ...prev, email: 'Invalid email format.' }));
            return;
        }

        const domain = value.split('@')[1];
        if (!allowedDomains.includes(domain)) {
            setError(prev => ({ ...prev, email: `Email must be one of: ${allowedDomains.join(', ')}` }));
        } else {
            setError(prev => ({ ...prev, email: '' }));
        }
    };

    // Contact validation and formatting with fixed +63 prefix
    const formatContact = (value: string) => {
        // Remove all non-digits
        let digits = value.replace(/\D/g, '');

        // If starts with 63, keep it; if starts with 09, convert to 63; otherwise take as-is
        if (digits.startsWith('63')) {
            digits = digits.slice(2); // Remove 63 prefix to process
        } else if (digits.startsWith('09')) {
            digits = digits.slice(2); // Remove 09 prefix
        } else if (digits.startsWith('9')) {
            // Already without 0 or 63
        } else {
            digits = digits.slice(-10); // Take last 10 digits
        }

        // Limit to 10 digits (9 + 9 more digits)
        const limitedDigits = digits.slice(0, 10);

        // Format as +63 9XX XXX XXXX
        let formatted = '+63 ';
        if (limitedDigits.length > 0) {
            formatted += limitedDigits.slice(0, 1); // First digit (should be 9)
            if (limitedDigits.length > 1) {
                formatted += limitedDigits.slice(1, 4); // Next 3 digits
                if (limitedDigits.length > 4) {
                    formatted += ' ' + limitedDigits.slice(4, 7); // Next 3 digits
                    if (limitedDigits.length > 7) {
                        formatted += ' ' + limitedDigits.slice(7); // Last 3 digits
                    }
                }
            }
        }

        setContact(formatted);

        // Validation
        if (limitedDigits.length === 0) {
            setError(prev => ({ ...prev, contact: '' }));
        } else if (limitedDigits[0] !== '9') {
            setError(prev => ({ ...prev, contact: 'Second digit must be 9' }));
        } else if (limitedDigits.length === 10) {
            setError(prev => ({ ...prev, contact: '' }));
        } else {
            setError(prev => ({ ...prev, contact: `Contact must be 10 digits (${limitedDigits.length}/10)` }));
        }
    };
    // Utility function to format phone to 09XXXXXXXXX
    const formatPhoneForDatabase = (phone: string): string => {
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

    // Password validation
    const handlePasswordChange = (value: string) => {
        setPassword(value);

        const pattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\[\]{};':"\\|,.<>\/?~-]).+$/;
        let pwdError = '';
        if (!pattern.test(value)) pwdError = 'Password must have 1 capital letter, 1 digit, and 1 symbol';
        else if (value.length < 8 || value.length > 15) pwdError = 'Password must be 8-15 characters long';

        let confirmError = '';
        if (confirmPassword && value !== confirmPassword) confirmError = 'Passwords do not match';

        setError(prev => ({ ...prev, password: pwdError, confirmPassword: confirmError }));
    };

    const handleConfirmPasswordChange = (value: string) => {
        setConfirmPassword(value);
        if (value !== password) setError(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
        else setError(prev => ({ ...prev, confirmPassword: '' }));
    };

    // Firebase registration
    const handleRegister = async () => {
        const hasError = Object.values(error).some(e => e !== '');
        if (hasError || loading) return;

        if (!fullname || !email || !contact || !password || !confirmPassword) {
            setError(prev => ({
                ...prev,
                fullName: !fullname ? 'Full Name is required' : prev.fullName,
                email: !email ? 'Email is required' : prev.email,
                contact: !contact ? 'Contact is required' : prev.contact,
                password: !password ? 'Password is required' : prev.password,
                confirmPassword: !confirmPassword ? 'Confirm your password' : prev.confirmPassword,
            }));
            return;
        }

        // Show terms modal before registration
        setShowTerms(true);
    };

    const handleTermsAccept = () => {
        setTermsAccepted(true);
        setShowTerms(false);
        completeRegistration();
    };

    const handleTermsDecline = () => {
        setShowTerms(false);
    };

    // ⭐ UPDATED: Use router.replace() instead of router.push()
    const completeRegistration = async () => {
        try {
            setLoading(true);
            const formattedPhone = formatPhoneForDatabase(contact)
            
            const { uid } = await registerUser(
                fullname,
                email,
                password,
                formattedPhone,
                role.toLowerCase() === 'rider' ? 'rider' : 'emergency contact'
            );

            console.log('User registered with UID:', uid);

            // ⭐ Use router.replace() to prevent back navigation to Register
            router.replace({
                pathname: '/(tabs)/MainLayout',
                params: { uid }
            });
        } catch (err: any) {
            console.error('Registration failed:', err.message);
            setError(prev => ({ ...prev, email: err.message }));
            setTermsAccepted(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#0A0E27' }}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                <View style={styles.outerContainer}>
                    <View style={styles.loginContainer}>
                        <View style={{ justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                            <Image
                                style={{ height: 60, width: 60 }}
                                source={require('../components/img/MotoSphere Logo.png')}
                            />
                        </View>
                        <View>
                            <Text style={styles.title}>Register</Text>
                            <Text style={styles.subtitle}>Create your MotoSphere account</Text>
                        </View>

                        <ScrollView
                            style={styles.formScrollView}
                            contentContainerStyle={styles.formContainer}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={true}
                            nestedScrollEnabled={true}
                        >
                            {/* Full Name */}
                            <Text style={styles.label}>Full Name</Text>
                            <TextInput
                                placeholder="e.g Jheff Cruz"
                                placeholderTextColor="#CCCCCC"
                                style={styles.input}
                                value={fullname}
                                onChangeText={handleFullNameChange}
                            />
                            {error.fullName ? <Text style={styles.errorText}>{error.fullName}</Text> : null}

                            {/* Email */}
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                placeholder="e.g motosphere@gmail.com"
                                placeholderTextColor="#CCCCCC"
                                style={styles.input}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={handleEmailChange}
                            />
                            {error.email ? <Text style={styles.errorText}>{error.email}</Text> : null}

                            {/* Role Picker */}
                            <Text style={styles.label}>Role</Text>
                            <View style={{ flexDirection: 'row', marginTop: 10, gap: 10 }}>
                                {['Rider', 'Emergency Contact'].map((r) => (
                                    <Pressable
                                        key={r}
                                        onPress={() => setRole(r as 'Rider' | 'Emergency Contact')}
                                        style={{
                                            flex: 1,
                                            paddingVertical: 12,
                                            borderRadius: 8,
                                            backgroundColor: role === r ? '#06B6D4' : 'rgba(10,14,39,0.5)',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <Text style={{ color: role === r ? '#fff' : '#ccc', fontWeight: '500' }}>{r}</Text>
                                    </Pressable>
                                ))}
                            </View>

                            {/* Contact No. */}
                            <Text style={styles.label}>Contact No.</Text>
                            <TextInput
                                placeholder="+63 9XX XXX XXXX"
                                placeholderTextColor="#CCCCCC"
                                style={styles.input}
                                keyboardType="numeric"
                                value={contact}
                                onChangeText={formatContact}
                                maxLength={18}
                            />
                            {error.contact ? <Text style={styles.errorText}>{error.contact}</Text> : null}

                            {/* Password */}
                            <Text style={styles.label}>Password</Text>
                            <TextInput
                                placeholder="Enter your password"
                                placeholderTextColor="#CCCCCC"
                                secureTextEntry={!showPassword}
                                style={styles.input}
                                value={password}
                                onChangeText={handlePasswordChange}
                            />
                            {error.password ? <Text style={styles.errorText}>{error.password}</Text> : null}

                            {/* Confirm Password */}
                            <Text style={styles.label}>Confirm Password</Text>
                            <TextInput
                                placeholder="Confirm password"
                                placeholderTextColor="#CCCCCC"
                                secureTextEntry={!showPassword}
                                style={styles.input}
                                value={confirmPassword}
                                onChangeText={handleConfirmPasswordChange}
                            />
                            {error.confirmPassword ? <Text style={styles.errorText}>{error.confirmPassword}</Text> : null}

                            {/* Show Password */}
                            <View style={styles.row}>
                                <Pressable
                                    style={[styles.checkbox, { backgroundColor: showPassword ? '#3f99eeff' : '#fff' }]}
                                    onPress={() => setShowPassword(prev => !prev)}
                                />
                                <Text style={styles.checkboxLabel}>Show Password</Text>
                            </View>

                            {/* Register Button */}
                            <Pressable
                                onPress={handleRegister}
                                style={[
                                    styles.button,
                                    { backgroundColor: loading ? 'rgba(6,182,212,0.5)' : '#06B6D4' }
                                ]}
                                disabled={loading}
                            >
                                <Text style={styles.buttonText}>
                                    {loading ? 'Registering...' : 'Register'}
                                </Text>
                            </Pressable>

                            {/* Login Link */}
                            <View style={styles.rowCenter}>
                                <Text style={styles.subtitle}>Already have an account?</Text>
                                <Pressable onPress={() => router.replace('/Login')}>
                                    <Text style={styles.link}>Login Here</Text>
                                </Pressable>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </KeyboardAvoidingView>

            {/* Terms and Privacy Modal */}
            <Modal
                visible={showTerms}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowTerms(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Terms & Privacy Policy</Text>
                        <ScrollView style={styles.termsScroll}>
                            <Text style={styles.termsText}>
                                <Text style={styles.termsSectionTitle}>Terms of Service{'\n\n'}</Text>

                                By using MotoSphere, you agree to:{'\n\n'}

                                • Provide accurate and truthful information during registration{'\n'}
                                • Use the app responsibly and only for its intended purpose{'\n'}
                                • Not misuse the emergency features or false reporting{'\n'}
                                • Respect the privacy of other users{'\n'}
                                • Comply with all applicable laws while using the service{'\n\n'}

                                <Text style={styles.termsSectionTitle}>Privacy Policy{'\n\n'}</Text>

                                We collect and use your information to:{'\n\n'}

                                • Provide ride tracking and safety features{'\n'}
                                • Share your location with emergency contacts when needed{'\n'}
                                • Improve our services and user experience{'\n'}
                                • Send important notifications about your rides{'\n\n'}

                                Your data is:{'\n\n'}

                                • Encrypted and stored securely{'\n'}
                                • Never sold to third parties{'\n'}
                                • Only shared with your designated emergency contacts{'\n'}
                                • Accessible to you at any time{'\n\n'}

                                <Text style={styles.termsSectionTitle}>Location Data{'\n\n'}</Text>

                                MotoSphere requires location access to:{'\n\n'}

                                • Track your rides in real-time{'\n'}
                                • Provide accurate emergency location sharing{'\n'}
                                • Generate ride logs and statistics{'\n\n'}

                                You can disable location sharing at any time, but this will limit app functionality.{'\n\n'}

                                For full terms and privacy policy, visit: www.motosphere.com/terms
                            </Text>
                        </ScrollView>
                        <View style={styles.modalButtons}>
                            <Pressable onPress={handleTermsDecline} style={styles.declineButton}>
                                <Text style={styles.declineButtonText}>Decline</Text>
                            </Pressable>
                            <Pressable onPress={handleTermsAccept} style={styles.acceptButton}>
                                <Text style={styles.acceptButtonText}>Accept & Continue</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            <StatusBar style="auto" />
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    loginContainer: {
        width: '100%',
        maxWidth: 500,
        maxHeight: '85%',
        backgroundColor: 'rgba(15, 23, 41, 0.8)',
        borderRadius: 40,
        paddingHorizontal: 30,
        paddingVertical: 20,
        overflow: 'hidden'
    },
    formScrollView: { marginTop: 10 },
    formContainer: { paddingBottom: 20 },
    title: { color: '#fff', fontSize: 28, fontWeight: '900', textAlign: 'center' },
    subtitle: { color: '#94A3B8', textAlign: 'center', marginTop: 10 },
    label: { color: '#CBD5E1', marginTop: 15, fontSize: 15 },
    input: {
        backgroundColor: 'rgba(10, 14, 39, 0.5)',
        borderRadius: 8,
        color: '#fff',
        fontSize: 16,
        paddingHorizontal: 20,
        height: 48,
        marginTop: 5
    },
    errorText: { color: '#EF4444', marginTop: 5, fontSize: 13 },
    row: { flexDirection: 'row', alignItems: 'center', marginTop: 15 },
    rowCenter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
        marginTop: 25
    },
    checkbox: { width: 22, height: 22, borderRadius: 6 },
    checkboxLabel: { color: '#94A3B8', marginLeft: 8 },
    link: { color: '#22D3EE' },
    button: { marginTop: 20, backgroundColor: '#06B6D4', paddingVertical: 15, borderRadius: 10 },
    buttonText: { color: '#fff', fontWeight: '500', textAlign: 'center', fontSize: 18 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        backgroundColor: '#1E293B',
        borderRadius: 20,
        padding: 25,
        width: '100%',
        maxWidth: 500,
        maxHeight: '80%',
    },
    modalTitle: { color: '#fff', fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 15 },
    termsScroll: { maxHeight: 400, marginBottom: 20 },
    termsText: { color: '#CBD5E1', fontSize: 14, lineHeight: 22 },
    termsSectionTitle: { color: '#06B6D4', fontSize: 16, fontWeight: '600' },
    modalButtons: { flexDirection: 'row', gap: 10 },
    declineButton: {
        flex: 1,
        backgroundColor: '#475569',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    declineButtonText: { color: '#fff', fontSize: 16, fontWeight: '500' },
    acceptButton: {
        flex: 1,
        backgroundColor: '#06B6D4',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    acceptButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});