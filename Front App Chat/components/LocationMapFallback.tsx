import React from 'react';
import { View, StyleSheet, Text, Pressable, Linking } from 'react-native';
import { colors, borderRadius, typography } from '@/styles/globalStyles';

interface LocationMapFallbackProps {
  latitude: number;
  longitude: number;
  width?: number;
  height?: number;
}

export default function LocationMapFallback({ 
  latitude, 
  longitude, 
  width = 200, 
  height = 150 
}: LocationMapFallbackProps) {
  // Generate static map URL using OpenStreetMap tiles via a static map service
  const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+ff0000(${longitude},${latitude})/${longitude},${latitude},14,0/${width}x${height}@2x?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw`;
  
  const openInMaps = () => {
    const url = `https://maps.google.com/maps?q=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  return (
    <Pressable 
      style={[styles.container, { width, height }]}
      onPress={openInMaps}
    >
      <img 
        src={mapUrl}
        alt={`Localisation: ${latitude}, ${longitude}`}
        style={{ 
          width: '100%', 
          height: '100%', 
          borderRadius: borderRadius.md,
          objectFit: 'cover'
        }}
      />
      <View style={styles.overlay}>
        <Text style={styles.coordinates}>
          {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </Text>
        <Text style={styles.tapHint}>
          Appuyer pour ouvrir dans Maps
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.border,
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
  },
  coordinates: {
    ...typography.caption1,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  tapHint: {
    ...typography.caption2,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
