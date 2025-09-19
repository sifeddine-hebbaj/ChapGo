import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Contact } from '@/types';
import Avatar from './Avatar';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/globalStyles';

interface ContactItemProps {
  contact: Contact;
  onPress: () => void;
}

export default function ContactItem({ contact, onPress }: ContactItemProps) {
  return (
    <TouchableOpacity style={[styles.container, shadows.sm]} onPress={onPress}>
      <Avatar 
        uri={contact.avatar} 
        size={45} 
        showOnlineIndicator={true}
        isOnline={contact.isOnline}
      />
      
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {contact.name}
        </Text>
        <Text style={styles.email} numberOfLines={1}>
          {contact.email}
        </Text>
      </View>
      
      <View style={styles.statusContainer}>
        <Text style={[
          styles.status,
          { color: contact.isOnline ? colors.success : colors.textSecondary }
        ]}>
          {contact.isOnline ? 'En ligne' : 'Hors ligne'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    ...typography.headline,
    color: colors.text,
    marginBottom: 2,
  },
  email: {
    ...typography.subhead,
    color: colors.textSecondary,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  status: {
    ...typography.caption1,
    fontWeight: '500',
  },
});