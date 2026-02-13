import { PermissionsAndroid, Platform, Alert } from 'react-native';

export const requestPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return true;
  }

  if (Platform.OS === 'android') {
    const androidVersion = Platform.Version;
    
    try {
      // Android 12+ (API 31+) requires new Bluetooth permissions
      if (androidVersion >= 31) {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ];

        console.log('🔐 Requesting Android 12+ permissions:', permissions);
        
        const granted = await PermissionsAndroid.requestMultiple(permissions);
        
        console.log('✓ Permission results:', granted);
        
        const allGranted = Object.values(granted).every(
          status => status === PermissionsAndroid.RESULTS.GRANTED
        );

        if (!allGranted) {
          console.log('❌ Some permissions were denied');
          Object.entries(granted).forEach(([perm, status]) => {
            console.log(`  ${perm}: ${status}`);
          });

          Alert.alert(
            'Permissions Required',
            'Bluetooth and Location permissions are required to scan for devices. Please enable them in Settings → Apps → [Your App] → Permissions.',
            [{ text: 'OK' }]
          );
          return false;
        }

        console.log('✅ All permissions granted');
        return true;
      } else {
        // Android 11 and below - only need location permission for BLE
        const permissions = [
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ];

        console.log('🔐 Requesting Android 11- permissions:', permissions);
        
        const granted = await PermissionsAndroid.requestMultiple(permissions);
        
        console.log('✓ Permission results:', granted);
        
        const allGranted = Object.values(granted).every(
          status => status === PermissionsAndroid.RESULTS.GRANTED
        );

        if (!allGranted) {
          console.log('❌ Some permissions were denied');
          Alert.alert(
            'Permissions Required',
            'Bluetooth and Location permissions are required to scan for devices. Please enable them in Settings.',
            [{ text: 'OK' }]
          );
          return false;
        }

        console.log('✅ All permissions granted');
        return true;
      }
    } catch (err: any) {
      console.error('❌ Permission request error:', err);
      Alert.alert(
        'Permission Error',
        'Failed to request permissions. Please enable them manually in Settings → Apps → [Your App] → Permissions.'
      );
      return false;
    }
  }

  // iOS needs NSBluetoothPeripheralUsageDescription in Info.plist
  if (Platform.OS === 'ios') {
    console.log('ℹ️ iOS detected - BLE permissions handled by Info.plist');
    return true;
  }

  return true;
};

// Helper function to check if permissions are already granted
export const checkPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const androidVersion = Platform.Version;

    if (androidVersion >= 31) {
      const scanGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
      );
      const connectGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
      );
      const locationGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

      console.log('🔍 Permission check (Android 12+):', {
        BLUETOOTH_SCAN: scanGranted,
        BLUETOOTH_CONNECT: connectGranted,
        ACCESS_FINE_LOCATION: locationGranted,
      });

      return scanGranted && connectGranted && locationGranted;
    } else {
      const locationGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

      console.log('🔍 Permission check (Android 11-):', {
        ACCESS_FINE_LOCATION: locationGranted,
      });

      return locationGranted;
    }
  } catch (err: any) {
    console.error('❌ Permission check error:', err);
    return false;
  }
};