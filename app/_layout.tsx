// app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Preload screen loads first */}
      <Stack.Screen name="Preload" />

      {/* Main app layout */}
      <Stack.Screen name="/(tabs)/Mainlayout" />

      {/* Login screen */}
      <Stack.Screen name="Login" />

      {/* Register screen */}
      <Stack.Screen name="Register" />
    </Stack>
  );
}