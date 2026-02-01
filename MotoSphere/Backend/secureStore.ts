// Backend/secureStore.ts
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ========== TOKEN STORAGE (Secure) ==========
// Store auth token in SecureStore (encrypted on device)
export async function saveToken(token: string) {
  try {
    if (token === '') {
      // Clear token if empty string
      await SecureStore.deleteItemAsync('userToken');
      console.log('🗑️ Token cleared');
    } else {
      await SecureStore.setItemAsync('userToken', token);
      console.log('✅ Token saved to SecureStore');
    }
  } catch (err) {
    console.error('❌ Failed to save token:', err);
    throw err;
  }
}

export async function getToken(): Promise<string | null> {
  try {
    const token = await SecureStore.getItemAsync('userToken');
    if (token) {
      console.log('✅ Token retrieved from SecureStore');
    }
    return token;
  } catch (err) {
    console.error('❌ Failed to get token:', err);
    return null;
  }
}

export async function deleteToken() {
  try {
    await SecureStore.deleteItemAsync('userToken');
    console.log('✅ Token deleted from SecureStore');
  } catch (err) {
    console.error('❌ Failed to delete token:', err);
    throw err;
  }
}

// ========== USER DATA CACHE (AsyncStorage) ==========
// Store user data in AsyncStorage for fast access
const USER_DATA_KEY = 'motosphere_user_data';

export async function saveUserData(userData: any) {
  try {
    const jsonData = JSON.stringify(userData);
    await AsyncStorage.setItem(USER_DATA_KEY, jsonData);
    console.log('✅ User data saved to AsyncStorage');
    return true;
  } catch (err) {
    console.error('❌ Failed to save user data:', err);
    throw err;
  }
}

export async function getUserData(): Promise<any | null> {
  try {
    const data = await AsyncStorage.getItem(USER_DATA_KEY);
    if (data) {
      console.log('✅ User data retrieved from AsyncStorage');
      return JSON.parse(data);
    }
    console.log('⚠️ No user data found in AsyncStorage');
    return null;
  } catch (err) {
    console.error('❌ Failed to get user data:', err);
    return null;
  }
}

export async function deleteUserData() {
  try {
    await AsyncStorage.removeItem(USER_DATA_KEY);
    console.log('✅ User data deleted from AsyncStorage');
    return true;
  } catch (err) {
    console.error('❌ Failed to delete user data:', err);
    throw err;
  }
}

// ========== UTILITY FUNCTIONS ==========

// Clear all stored data (logout)
export async function clearAllStorage() {
  try {
    await deleteToken();
    await deleteUserData();
    console.log('🗑️ All storage cleared');
    return true;
  } catch (err) {
    console.error('❌ Failed to clear all storage:', err);
    throw err;
  }
}

// Check if user has stored data
export async function hasStoredUser(): Promise<boolean> {
  try {
    const token = await getToken();
    const userData = await getUserData();
    return !!(token && userData);
  } catch (err) {
    console.error('❌ Error checking stored user:', err);
    return false;
  }
}

// Get stored auth state
export async function getAuthState(): Promise<{ token: string; user: any } | null> {
  try {
    const token = await getToken();
    const user = await getUserData();
    
    if (token && user) {
      return { token, user };
    }
    return null;
  } catch (err) {
    console.error('❌ Error getting auth state:', err);
    return null;
  }
}