import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  name: "MotoSphere",
  slug: "motosphere",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/MotoSphere Logo.png",
  scheme: "motosphere",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  jsEngine: "hermes",

  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.motospheres.app",
    infoPlist: {
      NSBluetoothPeripheralUsageDescription: "This app uses Bluetooth to connect to Raspberry Pi devices.",
      NSBluetoothAlwaysUsageDescription: "This app uses Bluetooth to connect to devices.",
      NSCameraUsageDescription: "This app needs camera access for scanning QR codes.",
      NSLocationWhenInUseUsageDescription: "Location is used to track your rides.",
      NSLocationAlwaysAndWhenInUseUsageDescription: "Location is used for ride tracking and emergency services.",
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
    package: "com.motospheres.app",
    googleServicesFile: "./google-services.json",
    permissions: [
      // Bluetooth permissions (Android 12+)
      "android.permission.BLUETOOTH_SCAN",
      "android.permission.BLUETOOTH_CONNECT",
      // Location permissions (required for BLE scanning on Android 6+)
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_COARSE_LOCATION",
    ],
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },
    softwareKeyboardLayoutMode: "resize",
  },

  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },

  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-web-browser",
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
    "@react-native-google-signin/google-signin",
    "@react-native-firebase/app",
    "@react-native-firebase/auth",
  ],

  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },

  extra: {
    // Google
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
    WEB_CLIENT_ID: process.env.WEB_CLIENT_ID,
    IOS_CLIENT_ID: process.env.IOS_CLIENT_ID,

    // Firebase
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
    FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,

    // EmailJS
    EMAILJS_SERVICE_ID: process.env.EMAILJS_SERVICE_ID,
    EMAILJS_VERIFICATION_TEMPLATE: process.env.EMAILJS_VERIFICATION_TEMPLATE,
    EMAILJS_NOTIFICATION_TEMPLATE: process.env.EMAILJS_NOTIFICATION_TEMPLATE,
    EMAILJS_PUBLIC_KEY: process.env.EMAILJS_PUBLIC_KEY,

    // Other
    router: {},
    eas: { projectId: "d79e7d5d-7dda-4fa6-9151-443a406e97d7" },
  },
});