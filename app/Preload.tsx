// app/Preload.tsx
import React, { useEffect, useState } from 'react';
import { View, Image, ActivityIndicator, StyleSheet, Text, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../Backend/firebase';
import { fetchUser } from '../Backend/controller/authController';
import { useRouter } from 'expo-router';

export default function Preload() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('Initializing...');
    const scaleAnim = React.useRef(new Animated.Value(1)).current;

    // Pulse animation for logo
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [scaleAnim]);

    useEffect(() => {
        const init = async () => {
            try {
                // 1️⃣ Warm up Firebase connection
                setStatus('Connecting to Firebase...');
                await warmupFirebase();

                // 2️⃣ Pre-warm Firestore
                setStatus('Preparing your ride...');
                await preloadFirestore();

                // 3️⃣ Simulate a login to establish database connection
                setStatus('Initializing database...');
                await simulateLogin();

                // 4️⃣ Check if Firebase has an active session
                setStatus('Checking authentication...');
                if (auth.currentUser) {
                    console.log('✅ Firebase session found, fetching user...');
                    const uid = auth.currentUser.uid;

                    // Try to fetch user (will use cache if available)
                    const result = await fetchUser(uid);

                    if (result?.userData) {
                        console.log('✅ User data loaded, navigating to MainLayout');
                        // Small delay for smooth transition
                        await new Promise(resolve => setTimeout(resolve, 500));
                        router.replace('/(tabs)/MainLayout');
                        return;
                    }
                }

                // 5️⃣ No active session, go to Login (Firebase is now warmed up)
                console.log('⚠️ No active session, going to Login');
                await new Promise(resolve => setTimeout(resolve, 500));
                router.replace('/Login');

            } catch (err) {
                console.error('❌ Preload error:', err);
                router.replace('/Login');
            } finally {
                setLoading(false);
            }
        };

        init();
    }, []);

    return (
        <LinearGradient
            colors={['#0A1A3A', '#0F2A52', '#0A1A3A']}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.8 }}
            style={styles.container}
        >
            <View style={styles.content}>
                {/* Animated Logo */}
                <Animated.View style={[styles.logoContainer, { transform: [{ scale: scaleAnim }] }]}>
                    <View style={{ justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                        <Image
                            style={{ height: 80, width: 80 }}
                            source={require('../components/img/MotoSphere Logo.png')}
                        />
                    </View>
                </Animated.View>

                {/* App Name */}
                <Text style={styles.appName}>MotoSphere</Text>
                <Text style={styles.tagline}>Ride Safe, Stay Connected</Text>

                {/* Status Container */}
                <View style={styles.statusContainer}>
                    <ActivityIndicator size="small" color="#06B6D4" />
                    <Text style={styles.status}>{status}</Text>
                </View>

                {/* Loading Dots */}
                <View style={styles.dotsContainer}>
                    <View style={[styles.dot, styles.dot1]} />
                    <View style={[styles.dot, styles.dot2]} />
                    <View style={[styles.dot, styles.dot3]} />
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.versionText}>v1.0.0</Text>
            </View>
        </LinearGradient>
    );
}

async function warmupFirebase() {
    try {
        const { getDb } = await import('../Backend/firebase');
        const db = getDb();
        console.log('✅ Firestore initialized');

        return new Promise<void>((resolve) => {
            const unsubscribe = auth.onAuthStateChanged(() => {
                unsubscribe();
                console.log('✅ Firebase Auth ready');
                resolve();
            });

            setTimeout(() => {
                unsubscribe();
                console.log('⚠️ Firebase Auth timeout');
                resolve();
            }, 5000);
        });
    } catch (err) {
        console.warn('⚠️ Firebase warm-up failed:', err);
    }
}

async function preloadFirestore() {
    try {
        const { getDb } = await import('../Backend/firebase');
        const { collection, getDocs, limit, query } = await import('firebase/firestore');

        const db = getDb();
        const testQuery = query(collection(db, 'users'), limit(1));

        await Promise.race([
            getDocs(testQuery),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), 3000)
            ),
        ]);

        console.log('✅ Firestore warmed up');
        return true;
    } catch (err) {
        console.warn('⚠️ Firestore preload warning:', err);
        return false;
    }
}

async function simulateLogin() {
    try {
        const { signInWithEmailAndPassword } = await import('firebase/auth');

        // Try to login with a dummy account to warm up auth
        // This will fail (intentionally) but establishes the connection
        await Promise.race([
            signInWithEmailAndPassword(auth, 'dummy@example.com', 'dummypassword').catch(() => {
                // Expected to fail - just warming up connection
                console.log('✅ Auth connection warmed up');
            }),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), 3000)
            ),
        ]);
    } catch (err) {
        console.warn('⚠️ Simulated login warning (non-critical):', err);
        // Don't throw - this is optional warm-up
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 80,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    logoContainer: {
        marginBottom: 30,
    },
    logoBackground: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(6, 182, 212, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(6, 182, 212, 0.3)',
    },
    logoText: {
        fontSize: 50,
    },
    appName: {
        fontSize: 32,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 8,
        letterSpacing: 1,
    },
    tagline: {
        fontSize: 14,
        color: '#9BB3D6',
        marginBottom: 50,
        fontWeight: '400',
    },
    statusContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    status: {
        color: '#9BB3D6',
        marginTop: 12,
        fontSize: 14,
        fontWeight: '500',
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 8,
        height: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#06B6D4',
    },
    dot1: {
        opacity: 0.3,
    },
    dot2: {
        opacity: 0.6,
    },
    dot3: {
        opacity: 1,
    },
    footer: {
        paddingBottom: 30,
        alignItems: 'center',
    },
    versionText: {
        color: '#475569',
        fontSize: 12,
    },
});