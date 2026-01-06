import { useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TextInput, View, Pressable, ScrollView, Dimensions } from 'react-native';

import { addUser, users } from '@/components/services/users';

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const screenHeight = Dimensions.get('window').height;

    const [role, setRole] = useState('Rider');
    const [email, setEmail] = useState('');
    const [contact, setContact] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [error, setError] = useState({ email: '', contact: '', password: '', confirmPassword: '' });
    const allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com'];

    const handleEmailChange = (value: string) => {
        setEmail(value);

        // Simple email pattern check
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(value)) {
            setError(prev => ({ ...prev, email: 'Invalid email format.' }));
            return;
        }

        // Extract domain after @
        const domain = value.split('@')[1];
        if (!allowedDomains.includes(domain)) {

            setError(prev => ({ ...prev, email: `Email must be one of: ${allowedDomains.join(', ')}` }));
        } else {
            setError(prev => ({ ...prev, email: '' }));
        }
    };

    const formatContact = (value: string) => {
        // Remove all non-digit characters
        const digits = value.replace(/\D/g, '');

        // Limit to 11 digits
        const limitedDigits = digits.slice(0, 11);

        // Format as 09## ### ####
        let formatted = limitedDigits;
        if (limitedDigits.length > 4) {
            formatted = `${limitedDigits.slice(0, 4)} ${limitedDigits.slice(4)}`;
        }
        if (limitedDigits.length > 7) {
            formatted = `${limitedDigits.slice(0, 4)} ${limitedDigits.slice(4, 7)} ${limitedDigits.slice(7)}`;
        }

        setContact(formatted);

        // Validate after user input
        if (limitedDigits.length === 0) {
            setError(prev => ({ ...prev, contact: '' }));
        } else if (limitedDigits.length === 11) {
            if (!limitedDigits.startsWith('09')) {
                setError(prev => ({ ...prev, contact: 'Contact must start with 09' }));
            } else {
                setError(prev => ({ ...prev, contact: '' }));
            }
        } else {

            setError(prev => ({ ...prev, contact: 'Contact must be 11 digits starting with 09' }));
        }
    };

    const handlePasswordChange = (value: string) => {
        setPassword(value);

        const pattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\[\]{};':"\\|,.<>\/?~-]).+$/;

        // Validate password pattern and length
        let pwdError = '';
        if (!pattern.test(value)) {
            pwdError = 'Password must have 1 capital letter, 1 digit, and 1 symbol';
        } else if (value.length < 8 || value.length > 15) {
            pwdError = 'Password must be 8-15 characters long';
        }

        // Validate confirm password match
        let confirmError = '';
        if (confirmPassword && value !== confirmPassword) {
            confirmError = 'Password do not match';
        }

        setError(prev => ({
            ...prev,
            password: pwdError,
            confirmPassword: confirmError,
        }));
    };


    const handleConfirmPasswordChange = (value: string) => {
        setConfirmPassword(value)

        if (value !== password) {
            setError(prev => ({ ...prev, confirmPassword: 'Password do not match' }))
        } else {
            setError(prev => ({ ...prev, confirmPassword: '' }))
        }
    }

    const handleRegister = () => {
        const hasError = Object.values(error).some((e) => e !== '');

        if (hasError) return;

        if (!email || !contact || !password || !confirmPassword) {
            setError(prev => ({
                ...prev,
                email: !email ? 'Email is required' : prev.email,
                contact: !contact ? 'Contact is required' : prev.contact,
                password: !password ? 'Password is required' : prev.password,
                confirmPassword: !confirmPassword ? 'Confirm your password' : prev.confirmPassword,
            }));
            return;
        }

        // Check if email already exists
        const emailExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
        if (emailExists) {
            setError(prev => ({ ...prev, email: 'This email is already registered.' }));
            return;
        }
        // Here, add the user to the in-memory storage
        const newUser = addUser({
            name: email.split('@')[0], // default name from email
            email,
            password,
            contactNo: contact.replace(/\s/g, ''), // remove spaces
            role
        });

        const userIndex = users.findIndex(u => u.email.toLowerCase() === newUser.email.toLowerCase());
        console.log('New User:', newUser); // optional: check user in console

        // redirect to main layout
        router.push({
            pathname: '/(tabs)/MainLayout',
            params: { index: userIndex }
        });
    };


    return (
        <View style={{ flex: 1, justifyContent: 'center' }}>
            <ScrollView
                contentContainerStyle={[styles.outerContainer, { flexGrow: 1 }]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.loginContainer}>
                    <Text style={styles.title}>Register</Text>
                    <Text style={styles.subtitle}>Create your MotoSphere account</Text>

                    {/* Scrollable form inside loginContainer */}
                    <ScrollView
                        style={styles.formScrollView}
                        contentContainerStyle={styles.formContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Email */}
                        <Text style={styles.label}>Email or Username</Text>
                        <TextInput
                            placeholder="e.g motosphere@gmail.com"
                            placeholderTextColor="#CCCCCC"
                            style={{
                                backgroundColor: 'rgba(10, 14, 39, 0.5)',
                                borderRadius: 8,
                                color: '#fff',
                                fontSize: 16,
                                paddingHorizontal: 20,
                                height: 48,
                                marginTop: 5,
                            }}
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
                                    onPress={() => setRole(r)}
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
                            placeholder="09## ### ####"
                            placeholderTextColor="#CCCCCC"
                            style={styles.input}
                            keyboardType="numeric"
                            value={contact}
                            onChangeText={formatContact}
                            maxLength={17}
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

                        <View style={styles.row}>
                            <Pressable
                                style={[styles.checkbox, { backgroundColor: showPassword ? '#3f99eeff' : '#fff' }]}
                                onPress={() => setShowPassword((prev) => !prev)}
                            />
                            <Text style={styles.checkboxLabel}>Show Password</Text>
                        </View>

                        <Pressable onPress={handleRegister} style={styles.button}>
                            <Text style={styles.buttonText}>Register</Text>
                        </Pressable>

                        <View style={styles.rowCenter}>
                            <Text style={styles.subtitle}>Already have an account?</Text>
                            <Pressable onPress={() => router.replace('/Login')}>
                                <Text style={styles.link}>Login Here</Text>
                            </Pressable>
                        </View>
                    </ScrollView>
                </View>
                <StatusBar style="auto" />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0A0E27',
        padding: 1
    },
    loginContainer: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: 'rgba(15, 23, 41, 0.8)',
        borderRadius: 40,
        padding: 30,
    },
    formScrollView: {
        flex: 1,
    },
    formContent: {
        paddingVertical: 20,
        flexGrow: 1,
    },
    title: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '900',
        textAlign: 'center'
    },
    subtitle: {
        color: '#94A3B8',
        textAlign: 'center',
        marginTop: 10
    },
    label: {
        color: '#CBD5E1',
        marginTop: 15,
        fontSize: 15
    },
    input: {
        backgroundColor: 'rgba(10, 14, 39, 0.5)',
        borderRadius: 8,
        color: '#fff',
        fontSize: 16,
        paddingHorizontal: 20,
        height: 48,
        marginTop: 5
    },
    errorText: {
        color: '#EF4444',
        marginTop: 5,
        fontSize: 13,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 15
    },
    rowCenter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
        marginTop: 25
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6
    },
    checkboxLabel: {
        color: '#94A3B8',
        marginLeft: 8
    },
    link: {
        color: '#22D3EE'
    },
    button: {
        marginTop: 20,
        backgroundColor: '#06B6D4',
        paddingVertical: 15,
        borderRadius: 10
    },
    buttonText: {
        color: '#fff',
        fontWeight: '500',
        textAlign: 'center',
        fontSize: 18
    },
});