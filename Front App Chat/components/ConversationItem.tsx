import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { Conversation } from '@/types';
import Avatar from './Avatar';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/globalStyles';

interface ConversationItemProps {
  conversation: Conversation;
  onPress: () => void;
}

export default function ConversationItem({ conversation, onPress }: ConversationItemProps) {
  // tick value forces a re-render periodically to keep relative time fresh
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setTick(t => t + 1), 30_000); // every 30s
    return () => clearInterval(i);
  }, []);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);

    if (diffMin < 1) return 'maintenant';
    if (diffHr < 1) return `${diffMin} min`;
    if (diffHr < 24) return `${diffHr}h`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <View style={[styles.container, shadows.sm]}>
        <Avatar 
          uri={conversation.avatar} 
          size={50} 
          showOnlineIndicator={true}
          isOnline={conversation.isOnline}
        />
        
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.name} numberOfLines={1}>
              {conversation.name}
            </Text>
            <Text style={styles.time}>
              {formatTime(conversation.lastMessageTime)}
            </Text>
          </View>
          
          <View style={styles.messageRow}>
            <Text style={styles.lastMessage} numberOfLines={2}>
              {conversation.lastMessage}
            </Text>
            {conversation.unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  name: {
    ...typography.headline,
    color: colors.text,
    flex: 1,
  },
  time: {
    ...typography.caption1,
    color: colors.textSecondary,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  lastMessage: {
    ...typography.subhead,
    color: colors.textSecondary,
    flex: 1,
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  badgeText: {
    ...typography.caption2,
    color: colors.surface,
    fontWeight: '600',
  },
});