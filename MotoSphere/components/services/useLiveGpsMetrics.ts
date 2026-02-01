// useLiveGpsMetrics.ts
import { useState, useEffect } from "react";
import * as Location from "expo-location";
import { GpsMetrics } from "./types";

export function useLiveGpsMetrics() {
  const [metrics, setMetrics] = useState<GpsMetrics[]>([
    { name: "Speed", unit: "km/h", value: 0 },
    { name: "Altitude", unit: "m", value: 0 },
    { name: "Distance", unit: "km", value: 0 },
  ]);

  const [lastLocation, setLastLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Highest, timeInterval: 1000, distanceInterval: 1 },
        (loc) => {
          const speedKmh = loc.coords.speed != null ? loc.coords.speed * 3.6 : 0; // m/s to km/h
          const altitudeM = loc.coords.altitude ?? 0;

          let distanceKm = 0;
          if (lastLocation) {
            const dx = loc.coords.latitude - lastLocation.coords.latitude;
            const dy = loc.coords.longitude - lastLocation.coords.longitude;
            const dz = (loc.coords.altitude ?? 0) - (lastLocation.coords.altitude ?? 0);
            // simple Pythagoras approximation for short distances
            distanceKm = Math.sqrt(dx * dx + dy * dy + dz * dz) * 111; // rough km
          }

          setMetrics([
            { name: "Speed", unit: "km/h", value: parseFloat(speedKmh.toFixed(1)) },
            { name: "Altitude", unit: "m", value: parseFloat(altitudeM.toFixed(1)) },
            { name: "Distance", unit: "km", value: parseFloat(distanceKm.toFixed(2)) },
          ]);

          setLastLocation(loc);
        }
      );

      return () => subscription.remove();
    })();
  }, [lastLocation]);

  return metrics;
}
