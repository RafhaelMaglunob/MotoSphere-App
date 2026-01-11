import { PermissionsAndroid, Platform, Alert } from 'react-native';

export async function requestPermissions() {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);

    const allGranted = Object.values(granted).every(status => status === 'granted');
    if (!allGranted) {
      Alert.alert('Permissions required', 'Enable Bluetooth & Location permissions to scan devices.');
      return false;
    }
  }
  return true;
}
