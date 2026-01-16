// LiveGps.tsx

import { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import MapView, { Marker, Camera, PROVIDER_GOOGLE } from "react-native-maps";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";

import { TrustedContact, GpsMetrics } from "../../components/services/types";
import { HistoryIcon } from "../../components/svg/HistoryIcon";
import { ShareIcon } from "../../components/svg/ShareIcon";
import { useLiveGpsMetrics } from "../../components/services/useLiveGpsMetrics";

interface LiveGpsProps {
  trustedContact: TrustedContact[];
}

// Reusable Action Button
const ActionButton = ({ icon: Icon, title, bgColor, onPress }: any) => (
  <Pressable style={{ flex: 1 }} onPress={onPress}>
    <View
      style={{
        backgroundColor: bgColor,
        paddingVertical: 15,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 11,
        flexDirection: "row",
        gap: 14,
      }}
    >
      <Icon size={20} />
      <Text style={{ color: "#fff", fontSize: 17, fontWeight: "600" }}>{title}</Text>
    </View>
  </Pressable>
);

export default function LiveGps({ trustedContact }: LiveGpsProps) {
  const metrics = useLiveGpsMetrics(); // ✅ Live speed & altitude
  const mapRef = useRef<MapView | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [camera, setCamera] = useState({ pitch: 55, heading: 0, zoom: 17 });
  const [initialAnimationDone, setInitialAnimationDone] = useState(false);

  // Get initial location
  useEffect(() => {
    if (Platform.OS === "web") return;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    })();
  }, []);

  // Animate map from world view to user location
  useEffect(() => {
    if (mapRef.current && location && !initialAnimationDone) {
      const worldCamera: Camera = {
        center: { latitude: 0, longitude: 0 },
        pitch: 0,
        heading: 0,
        zoom: 1,
      };
      mapRef.current.animateCamera(worldCamera, { duration: 800 });

      setTimeout(() => {
        const userCamera: Camera = {
          center: location,
          pitch: camera.pitch,
          heading: camera.heading,
          zoom: camera.zoom,
        };
        mapRef.current?.animateCamera(userCamera, { duration: 1200 });
        setInitialAnimationDone(true);
      }, 800);
    }
  }, [location, initialAnimationDone]);

  return (
    <View style={{ flexDirection: "column", gap: 18 }}>
      {/* Title */}
      <Text style={{ color: "#fff", fontSize: 25, fontWeight: "600" }}>Live Tracking</Text>
      <Text style={{ color: "#9BB3D6", fontSize: 13, fontWeight: "300" }}>
        Real-time location monitoring and route history.
      </Text>

      {/* Action Buttons */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 15 }}>
        <ActionButton icon={HistoryIcon} title="History" bgColor="#0F2A52" onPress={() => console.log("History pressed")} />
        <ActionButton icon={ShareIcon} title="Share" bgColor="#2EA8FF" onPress={() => console.log("Share pressed")} />
      </View>

      {/* Map + Metrics */}
      <LinearGradient
        colors={["#000000", "#000000", "#1a1c1fff", "#000000"]}
        locations={[0, 0.33, 0.67, 1]}
        start={{ x: 0, y: 0.3 }}
        end={{ x: 0, y: 1 }}
        style={{ flex: 1, padding: 15, borderRadius: 15 }}
      >
        {/* Map */}
        <View style={{ height: 250, borderRadius: 12, overflow: "hidden", marginTop: 10 }}>
          {location ? (
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={{ flex: 1 }}
              showsUserLocation={true}
              followsUserLocation={true}
              pitchEnabled={true}
              rotateEnabled={true}
              mapType="standard"
            >
              <Marker coordinate={location} tracksViewChanges={false} />
            </MapView>
          ) : (
            <View style={{ flex: 1, backgroundColor: "#0F2A52", justifyContent: "center", alignItems: "center" }}>
              <Text style={{ color: "#fff" }}>{errorMsg || "Getting current location..."}</Text>
            </View>
          )}
        </View>

        {/* Metrics Panel */}
        <View style={{ backgroundColor: "#0F2A52", padding: 20, marginTop: 20, borderRadius: 10 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 15 }}>
            {metrics.map((metric, index) => (
              <View key={index} style={{ flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <Text style={{ color: "#9BB3D6", fontWeight: "bold", fontSize: 13 }}>{metric.name}</Text>
                <View style={{ flexDirection: "row", gap: 5, alignItems: "flex-end" }}>
                  <Text style={{ color: "#fff", fontWeight: "800", fontSize: 17 }}>{metric.value}</Text>
                  <Text style={{ color: "#9BB3D6", fontSize: 11 }}>{metric.unit}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>

      {/* Emergency Contacts */}
      <View
        style={{
          backgroundColor: "#0F2A52",
          flexDirection: "column",
          gap: 10,
          paddingVertical: 15,
          paddingHorizontal: 30,
          borderRadius: 12,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontSize: 17, fontWeight: "bold", alignSelf: "flex-start", marginBottom: 12 }}>
          Emergency Contact's
        </Text>
        {trustedContact.map((contact, index) => (
          <Pressable
            key={index}
            style={({ pressed }) => ({
              padding: 10,
              backgroundColor: pressed ? "rgba(7, 18, 31, 0.5)" : "#07121fff",
              borderRadius: 11,
              width: "auto",
              minWidth: "100%",
            })}
          >
            <Text style={{ fontSize: 14, fontWeight: "bold", color: "#fff", textAlign: "center" }}>{contact.name}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}