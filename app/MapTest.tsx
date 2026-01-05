import React from 'react';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { View, StyleSheet } from 'react-native';

export default function MapTest() {
  return (
    <View style={{ height: 300, width: '100%' }}> 
        <MapView 
            style={StyleSheet.absoluteFillObject}
            provider="google"
        />
        </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});