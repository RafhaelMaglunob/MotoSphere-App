// app/Preload.tsx
import React, { useEffect, useState } from 'react';
import { View, Image, ActivityIndicator, StyleSheet, Text, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../Backend/firebase';
import { fetchUser } from '../Backend/controller/user/userService';
import { useRouter } from 'expo-router';
import { User } from 'firebase/auth';

export default function Preload() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('Initializing...');
    const scaleAnim = React.useRef(new Animated.Value(1)).current;
    
    // Dot animations
    const dot1Anim = React.useRef(new Animated.Value(0.3)).current;
    const dot2Anim = React.useRef(new Animated.Value(0.6)).current;
    const dot3Anim = React.useRef(new Animated.Value(1)).current;

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

        // Animated dots sequence
        const animateDots = () => {
            Animated.loop(
                Animated.sequence([
                    // Dot 1 lights up
                    Animated.timing(dot1Anim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    // Dot 2 lights up
                    Animated.timing(dot2Anim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    // Dot 3 lights up
                    Animated.timing(dot3Anim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    // All fade back
                    Animated.parallel([
                        Animated.timing(dot1Anim, {
                            toValue: 0.3,
                            duration: 300,
                            useNativeDriver: true,
                        }),
                        Animated.timing(dot2Anim, {
                            toValue: 0.3,
                            duration: 300,
                            useNativeDriver: true,
                        }),
                        Animated.timing(dot3Anim, {
                            toValue: 0.3,
                            duration: 300,
                            useNativeDriver: true,
                        }),
                    ]),
                ])
            ).start();
        };

        animateDots();
    }, [scaleAnim, dot1Anim, dot2Anim, dot3Anim]);

    useEffect(() => {
        const init = async () => {
            try {
                console.log('🚀 Preload: Starting initialization...');
                
                // 1️⃣ Warm up Firebase connection
                setStatus('Connecting to Firebase...');
                await warmupFirebase();

                // 2️⃣ Pre-warm Firestore
                setStatus('Preparing your ride...');
                await preloadFirestore();

                // 3️⃣ Simulate a login to establish database connection
                setStatus('Initializing database...');
                await simulateLogin();

                // 4️⃣ Wait for Firebase Auth to be ready (increased timeout)
                setStatus('Checking authentication...');
                const user = await waitForAuthReady();
                
                console.log('📊 Auth state:', {
                    hasUser: !!user,
                    uid: user?.uid,
                    email: user?.email
                });
                
                if (user) {
                    console.log('✅ Firebase session found, fetching user data for UID:', user.uid);
                    
                    // Try to fetch user data
                    const result = await fetchUser(user.uid);
                    
                    console.log('📊 fetchUser result:', {
                        hasResult: !!result,
                        hasUserData: !!result?.userData,
                        resultKeys: result ? Object.keys(result) : [],
                        userData: result?.userData
                    });

                    if (result?.userData) {
                        console.log('✅ User data loaded successfully, navigating to MainLayout');
                        // Small delay for smooth transition
                        await new Promise(resolve => setTimeout(resolve, 500));
                        console.log('🔄 Executing router.replace to /(tabs)/MainLayout');
                        router.replace('./(tabs)/MainLayout');
                        return;
                    } else {
                        console.warn('⚠️ User authenticated but no user data found in fetchUser result');
                        console.warn('⚠️ Redirecting to Login due to missing userData');
                    }
                } else {
                    console.log('⚠️ No user returned from waitForAuthReady');
                }

                // 5️⃣ No active session, go to Login (Firebase is now warmed up)
                console.log('⚠️ No active session, going to Login');
                await new Promise(resolve => setTimeout(resolve, 500));
                console.log('🔄 Executing router.replace to /Login');
                router.replace('/Login');

            } catch (err) {
                console.error('❌ Preload error:', err);
                console.error('❌ Error stack:', err instanceof Error ? err.stack : 'No stack');
                router.replace('./Login');
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

                {/* Animated Loading Dots */}
                <View style={styles.dotsContainer}>
                    <Animated.View style={[styles.dot, { opacity: dot1Anim }]} />
                    <Animated.View style={[styles.dot, { opacity: dot2Anim }]} />
                    <Animated.View style={[styles.dot, { opacity: dot3Anim }]} />
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

/**
 * Wait for Firebase Auth to initialize and return the current user (if any)
 * This prevents race conditions by waiting for onAuthStateChanged to fire
 */
async function waitForAuthReady(): Promise<User | null> {
    return new Promise((resolve) => {
        // Check if auth is already initialized
        const currentUser = auth.currentUser;
        if (currentUser) {
            console.log(`✅ Auth already ready - User: ${currentUser.uid}`);
            resolve(currentUser);
            return;
        }

        console.log('⏳ Waiting for auth state change...');
        
        const unsubscribe = auth.onAuthStateChanged((user) => {
            console.log(user ? `✅ Auth ready - User: ${user.uid}` : '✅ Auth ready - No user');
            unsubscribe();
            resolve(user);
        });

        // Increased timeout to 20 seconds to allow AsyncStorage to load
        setTimeout(() => {
            console.warn('⚠️ Auth initialization timeout (20s)');
            unsubscribe();
            resolve(null);
        }, 20000);
    });
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
    footer: {
        paddingBottom: 30,
        alignItems: 'center',
    },
    versionText: {
        color: '#475569',
        fontSize: 12,
    },
});