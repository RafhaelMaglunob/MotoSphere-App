import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TextInput, View, ImageBackground, Pressable, Image } from 'react-native';

import { loginUser } from '../Backend/controller/authController';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (loading) return;
    
    // Clear previous error
    setError('');
    
    // Basic validation before API call
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 Starting login...');
      const { uid } = await loginUser(email, password);
      console.log('✅ Login successful, navigating...');

      // Firebase is already warm, so navigation is instant
      router.replace({
        pathname: '/(tabs)/MainLayout',
        params: { uid }
      });
    } catch (err: any) {
      console.error('Login failed:', err.message);
      setError(err.message || 'Login failed. Please try again');
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../components/img/LoginCover.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.loginContainer}>
        <View style={{ justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
          <Image
            style={{ height: 60, width: 60 }}
            source={require('../components/img/MotoSphere Logo.png')}
          />
        </View>
        <Text style={styles.text}>Log in to MotoSphere</Text>
        <Text style={{ color: '#94A3B8', textAlign: 'center', marginTop: 15 }}>
          Access your ride logs, live tracking, and emergency notifications.
        </Text>

        {/* Inputs */}
        <View style={{ flexDirection: 'column', marginTop: 40, gap: 20 }}>
          <View style={{ flexDirection: 'column', gap: 8 }}>
            <Text style={{ color: '#CBD5E1', fontSize: 15 }}>Email or Username</Text>
            <TextInput
              placeholder="e.g motosphere@example.com"
              placeholderTextColor="#CCCCCC"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              editable={!loading}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={{ flexDirection: 'column', gap: 8 }}>
            <Text style={{ color: '#CBD5E1', fontSize: 15 }}>Password</Text>
            <TextInput
              placeholder="Enter your password"
              placeholderTextColor="#CCCCCC"
              secureTextEntry={!showPassword}
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />
          </View>
        </View>

        {/* Error Message */}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        ) : null}

        {/* Show/Hide Password */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                backgroundColor: showPassword ? '#3f99eeff' : '#fff',
              }}
              onPress={() => setShowPassword(prev => !prev)}
              disabled={loading}
            />
            <Text style={{ color: '#94A3B8' }}>Show Password</Text>
          </View>
          <Pressable disabled={loading}>
            <Text style={{ color: '#22D3EE' }}>Forgot Password?</Text>
          </Pressable>
        </View>

        {/* Login Button */}
        <Pressable onPress={handleLogin} disabled={loading}>
          <Text style={[styles.loginButton, loading && { opacity: 0.6 }]}>
            {loading ? 'Logging In...' : 'Log In'}
          </Text>
        </Pressable>

        {/* Registration */}
        <View style={{ flexDirection: 'row', gap: 15, justifyContent: 'center', width: '100%' }}>
          <Text style={{ color: '#94A3B8', fontSize: 12 }}>Don't have an account yet?</Text>
          <Pressable onPress={() => router.push('/Register')} disabled={loading}>
            <Text style={{ color: '#22D3EE', fontSize: 12 }}>Create an Account</Text>
          </Pressable>
        </View>
      </View>
      <StatusBar style="auto" />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' },
  loginContainer: { width: '90%', backgroundColor: 'rgba(15, 23, 41, 0.8)', borderRadius: 40, padding: 30 },
  text: { color: '#fff', fontSize: 23, fontWeight: '700', textAlign: 'center' },
  input: { backgroundColor: 'rgba(10, 14, 39, 0.5)', borderRadius: 8, color: '#fff', fontSize: 16, paddingHorizontal: 20, height: 48 },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    borderRadius: 8,
    padding: 12,
    marginTop: 15,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '500',
  },
  loginButton: {
    marginTop: 25,
    marginBottom: 50,
    paddingVertical: 20,
    borderRadius: 10,
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    backgroundColor: '#06B6D4',
    color: '#fff',
  },
});