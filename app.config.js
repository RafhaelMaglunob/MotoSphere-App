import 'dotenv/config'; // Only runs at build time (Expo CLI), not in app code

export default ({ config }) => ({
  ...config,
  name: "MotoSphere",
  slug: "motosphere-app",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/MotoSphere Logo.png",
  scheme: "motosphere",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    infoPlist: {
      NSBluetoothAlwaysUsageDescription: "This app uses Bluetooth to connect to devices.",
      NSCameraUsageDescription: "This app needs camera access for scanning QR codes.",
      NSLocationWhenInUseUsageDescription: "Location is used to track your rides.",
      ITSAppUsesNonExemptEncryption: false,
    },
    config: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/MotoSphere Logo.png",
      backgroundImage: "./assets/images/android-icon-background.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    permissions: [
      "android.permission.BLUETOOTH",
      "android.permission.BLUETOOTH_ADMIN",
      "android.permission.BLUETOOTH_CONNECT",
    ],
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },
    package: "com.motospheres.app",
    "softwareKeyboardLayoutMode": "resize"
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: { backgroundColor: "#000000" },
      },
    ],
    "react-native-ble-plx",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
    FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,
    router: {},
    eas: { projectId: "60e49d04-18bb-41bd-838a-fe5328c42def" },
  },
});
