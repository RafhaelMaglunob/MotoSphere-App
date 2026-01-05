import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Platform,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { BluetoothIcon } from "../../components/svg/BluetoothIcon";
import { ScanIcon } from "../../components/svg/ScanIcon";
import { requestPermissions } from "../../components/utils/permission";

// Only import types for BLE
import type { BleManager, Device, BleError } from "react-native-ble-plx";

// Initialize BLE manager safely
let manager: BleManager | null = null;
if (Platform.OS !== "web") {
  try {
    const { BleManager: BleManagerClass } = require("react-native-ble-plx");
    manager = new BleManagerClass();
  } catch (e) {
    console.log("BLE not available in Expo Go:", e);
  }
}

export default function Devices() {
  const [foundDevices, setFoundDevices] = useState<Device[]>([]);
  const [scanning, setScanning] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [connectingDevice, setConnectingDevice] = useState<string | null>(null);

  const steps = [
    "Turn on your smart helmet by holding the power button for 3 seconds",
    "Wait for the blue LED indicator to start blinking rapidly.",
    "Click 'Scan for Devices' and select your helmet from the list.",
  ];

  // Automatically prompt Bluetooth on Android
  const enableBluetooth = async (): Promise<boolean> => {
    if (!manager || Platform.OS !== "android") return true;

    try {
      const state = await manager.state();
      if (state !== "PoweredOn") {
        return new Promise((resolve) => {
          Alert.alert(
            "Bluetooth is Off",
            "You need to turn on Bluetooth to scan for devices.",
            [
              { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
              {
                text: "Turn On",
                onPress: async () => {
                  try {
                    await manager!.enable();
                    resolve(true);
                  } catch {
                    resolve(false);
                  }
                },
              },
            ],
            { cancelable: false }
          );
        });
      }
    } catch (e) {
      console.log("Error checking Bluetooth state:", e);
      return false;
    }

    return true;
  };

  // Scan for BLE devices
  const handleScan = async () => {
    if (!manager) {
      return Alert.alert("BLE Not Supported", "Bluetooth scanning is not available in Expo Go or Web.");
    }
    if (scanning) return;

    const btEnabled = await enableBluetooth();
    if (!btEnabled) return;

    const granted = await requestPermissions();
    if (!granted) return;

    setScanning(true);
    setFoundDevices([]);
    setModalVisible(true);

    manager.startDeviceScan(null, null, (error: BleError | null, device: Device | null) => {
      if (error) {
        console.log("Scan error:", error.message);
        manager?.stopDeviceScan();
        setScanning(false);
        return;
      }

      if (device && device.name?.startsWith("MS") && !foundDevices.find((d) => d.id === device.id)) {
        setFoundDevices((prev) => {
          if (prev.length >= 7) return prev;
          return [...prev, device];
        });
      }
    });

    setTimeout(() => {
      manager?.stopDeviceScan();
      setScanning(false);
    }, 10000);
  };

  // Connect to a device
  const handleConnect = async (device: Device) => {
    if (!manager) return;
    try {
      setConnectingDevice(device.id);
      const connectedDevice = await manager.connectToDevice(device.id);
      await connectedDevice.discoverAllServicesAndCharacteristics();
      Alert.alert("Connected", `Successfully connected to ${device.name || device.id}`);
      setConnectingDevice(null);
      setModalVisible(false);
    } catch (error: any) {
      console.log("Connect error:", error.message);
      Alert.alert("Connection Failed", `Failed to connect to ${device.name || device.id}`);
      setConnectingDevice(null);
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 20 }} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={{ color: "#fff", fontSize: 25, fontWeight: "600", marginBottom: 8 }}>
        Device Pairing
      </Text>
      <Text style={{ color: "#9BB3D6", fontSize: 13, fontWeight: "300", marginBottom: 20 }}>
        Connect your smart helmet to access all features.
      </Text>

      {/* How to Pair */}
      <View style={{ backgroundColor: "#0F2A52", padding: 25, borderRadius: 13, marginBottom: 20 }}>
        <Text style={{ color: "#fff", fontSize: 17, fontWeight: "600", marginBottom: 15 }}>
          How to Pair
        </Text>
        {steps.map((step, index) => (
          <View key={index} style={{ flexDirection: "row", marginBottom: 12, alignItems: "flex-start" }}>
            <View
              style={{
                backgroundColor: "rgba(6, 182, 212, 0.2)",
                width: 30,
                height: 30,
                borderRadius: 15,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 10,
              }}
            >
              <Text style={{ color: "#22D3EE", fontWeight: "600" }}>{index + 1}</Text>
            </View>
            <Text style={{ flex: 1, color: "#9BB3D6" }}>{step}</Text>
          </View>
        ))}
      </View>

      {/* Scan Section */}
      <View style={{ backgroundColor: "#0F2A52", padding: 25, borderRadius: 13, alignItems: "center" }}>
        <View
          style={{
            backgroundColor: "#0A1A3A",
            width: 70,
            height: 70,
            borderRadius: 35,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 15,
          }}
        >
          <BluetoothIcon />
        </View>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 5 }}>Ready to Pair</Text>
        <Text
          style={{
            color: "#9BB3D6",
            fontSize: 15,
            fontWeight: "200",
            textAlign: "center",
            marginBottom: 15,
          }}
        >
          Make sure your helmet is turned on and within range.
        </Text>

        <Pressable onPress={handleScan} disabled={scanning || !manager}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              backgroundColor: "#2EA8FF",
              paddingHorizontal: 30,
              paddingVertical: 15,
              borderRadius: 13,
              opacity: scanning || !manager ? 0.6 : 1,
              marginBottom: 15,
            }}
          >
            <ScanIcon />
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "bold" }}>
              {scanning ? "Scanning..." : "Scan for Devices"}
            </Text>
          </View>
        </Pressable>

        {!manager && <Text style={{ color: "red", marginTop: 10 }}>BLE not supported in Expo Go / Web</Text>}
      </View>

      {/* Modal for scanned devices */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 20 }}>
          <View style={{ backgroundColor: "#0F2A52", borderRadius: 13, padding: 20, maxHeight: "80%" }}>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 15 }}>
              Select a Device
            </Text>
            {foundDevices.length === 0 && scanning && <ActivityIndicator size="large" color="#2EA8FF" />}
            {foundDevices.map((device) => (
              <Pressable
                key={device.id}
                onPress={() => handleConnect(device)}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 10,
                  backgroundColor: "#0A1A3A",
                  borderRadius: 10,
                  marginBottom: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ color: "#22D3EE", fontSize: 16 }}>{device.name || "Unknown Device"}</Text>
                {connectingDevice === device.id && <ActivityIndicator color="#22D3EE" />}
              </Pressable>
            ))}

            <Pressable onPress={() => setModalVisible(false)} style={{ marginTop: 10 }}>
              <Text style={{ color: "#fff", textAlign: "center", fontSize: 16 }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
