import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Plus } from 'lucide-react-native';
import { colors, shadows, borderRadius } from '@/styles/globalStyles';

interface FABButtonProps {
  onPress: () => void;
  icon?: React.ReactNode;
}

export default function FABButton({ onPress, icon }: FABButtonProps) {
  return (
    <TouchableOpacity style={[styles.fab, shadows.lg]} onPress={onPress}>
      {icon || <Plus size={24} color={colors.surface} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});