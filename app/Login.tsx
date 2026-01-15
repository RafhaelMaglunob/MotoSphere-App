import React,{ useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TextInput, View, ImageBackground, Pressable } from 'react-native';

import { loginUser } from '../Backend/controller/authController';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    try {
      // Call the authController
      const { uid } = await loginUser(email, password);

      setError(''); // clear error

      // Navigate to MainLayout
      router.push({
        pathname: './(tabs)/MainLayout',
        params: { uid }
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <ImageBackground
      source={require('../components/img/LoginCover.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.loginContainer}>
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
            />
          </View>
        </View>

        {error ? <Text style={{ color: '#EF4444', marginTop: 8 }}>{error}</Text> : null}

        {/* Checkbox */}
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
            />
            <Text style={{ color: '#94A3B8' }}>Show Password</Text>
          </View>
          <Pressable>
            <Text style={{ color: '#22D3EE' }}>Forgot Password?</Text>
          </Pressable>
        </View>

        {/* Login Button */}
        <Pressable onPress={handleLogin}>
          <Text style={styles.loginButton}>Log In</Text>
        </Pressable>

        {/* Registration */}
        <View style={{ flexDirection: 'row', gap: 15, justifyContent: 'center', width: '100%' }}>
          <Text style={{ color: '#94A3B8', fontSize: 12 }}>Don't have an account yet?</Text>
          <Pressable onPress={() => router.push('./Register')}>
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
    boxShadow: '0px 4px 10px rgba(0, 212, 255, 0.5)',
  },
});
