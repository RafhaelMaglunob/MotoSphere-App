//LiveGps.tsx

import { useState, useEffect } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import { GpsMetrics } from "../../components/services/types";

interface LiveGpsProps {
  metrics: GpsMetrics[];
}

// Conditional import for maps
const MapView = Platform.OS !== "web" ? require("react-native-maps").default : null;
const Marker = Platform.OS !== "web" ? require("react-native-maps").Marker : null;

// Icons
import { HistoryIcon } from "../../components/svg/HistoryIcon";
import { ShareIcon } from "../../components/svg/ShareIcon";

// Reusable button
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

export default function LiveGps({metrics}: LiveGpsProps) {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
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
      }
    })();
  }, []);

  return (
    <View style={{ flexDirection: "column", gap: 18 }}>
      <Text style={{ color: "#fff", fontSize: 25, fontWeight: "600" }}>Live Tracking</Text>
      <Text style={{ color: "#9BB3D6", fontSize: 13, fontWeight: "300" }}>
        Real-time location monitoring and route history.
      </Text>

      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 15 }}>
        <ActionButton
          icon={HistoryIcon}
          title="History"
          bgColor="#0F2A52"
          onPress={() => console.log("History pressed")}
        />
        <ActionButton
          icon={ShareIcon}
          title="Share"
          bgColor="#2EA8FF"
          onPress={() => console.log("Share pressed")}
        />
      </View>

      <LinearGradient
        colors={["#000000", "#000000", "#1a1c1fff", "#000000"]}
        locations={[0, 0.33, 0.67, 1]}
        start={{ x: 0, y: 0.3 }}
        end={{ x: 0, y: 1 }}
        style={{ flex: 1, padding: 15, borderRadius: 15 }}
      >
        <View style={{ height: 250, borderRadius: 12, overflow: "hidden", marginTop: 10 }}>
          {location ? (
            <MapView
              key={location ? "map-ready" : "map-loading"}
              style={{ flex: 1 }}
              initialRegion={{
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              showsUserLocation={true}
              followsUserLocation={true}
              customMapStyle={[
                { elementType: "geometry", stylers: [{ color: "#000000" }] },
                { elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
                { elementType: "labels.text.stroke", stylers: [{ color: "#000000" }] },
                {
                  featureType: "road",
                  elementType: "geometry",
                  stylers: [{ color: "#3566b6ff" }],
                },
                {
                  featureType: "road",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#9BB3D6" }],
                },
                {
                  featureType: "water",
                  elementType: "geometry",
                  stylers: [{ color: "#000000" }],
                },
              ]}
            >
              <Marker 
                coordinate={location} 
                tracksViewChanges={false} // Add this line
              />
            </MapView>
          ) : (
            <View
              style={{
                flex: 1,
                backgroundColor: "#0F2A52",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff" }}>{errorMsg || "Getting current location..."}</Text>
            </View>
          )}
        </View>

        <View 
          style={{
            backgroundColor: '#0F2A52',
            padding: 20,
            marginTop: 20,
            borderRadius: 10
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              padding: 0,
              gap: 'auto'
            }}
          >
            {metrics.map((metric, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10
                }}
              >
                <Text 
                  style={{ 
                    color: '#9BB3D6', 
                    fontWeight: 'bold', 
                    fontSize: 13
                  }}
                >
                    {metric.name}
                </Text>

                <View style={{ flexDirection: 'row', gap:5, alignItems: 'flex-end'}}>
                  <Text 
                    style={{ 
                      color: '#fff', 
                      fontWeight: '800', 
                      fontSize: 17,
                    }}
                  >    
                    {metric.value}
                  </Text>

                  <Text
                    style={{
                      color: '#9BB3D6',
                      fontSize: 11
                    }}
                  >
                    {metric.unit}
                  </Text>            
                </View>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
