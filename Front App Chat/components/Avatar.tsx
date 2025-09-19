import React, { useMemo, useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, shadows } from '@/styles/globalStyles';
import { BASE_URL } from '@/lib/api';

interface AvatarProps {
  uri?: string | null;
  size?: number;
  onPress?: () => void;
  showOnlineIndicator?: boolean;
  isOnline?: boolean;
}

export default function Avatar({ 
  uri, 
  size = 40, 
  onPress, 
  showOnlineIndicator = false, 
  isOnline = false 
}: AvatarProps) {
  const [error, setError] = useState(false);

  const normalizedUri = useMemo(() => {
    if (error || !uri || !String(uri).trim()) {
      return 'https://placehold.co/100x100';
    }
    const val = String(uri).trim();
    if (val.startsWith('http://') || val.startsWith('https://')) return val;
    if (val.startsWith('/')) return `${BASE_URL}${val}`;
    // Bare filename -> assume served under /uploads/image/
    return `${BASE_URL}/uploads/image/${val}`;
  }, [uri, error]);
  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const onlineIndicatorStyle = {
    width: size * 0.25,
    height: size * 0.25,
    borderRadius: (size * 0.25) / 2,
    position: 'absolute' as const,
    bottom: 0,
    right: 0,
    backgroundColor: isOnline ? colors.success : colors.textSecondary,
    borderWidth: 2,
    borderColor: colors.surface,
  };

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component onPress={onPress} style={styles.container}>
      <Image 
        source={{ uri: normalizedUri }} 
        style={[avatarStyle, shadows.sm]} 
        onError={() => setError(true)}
      />
      {showOnlineIndicator && (
        <View style={onlineIndicatorStyle} />
      )}
    </Component>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
});