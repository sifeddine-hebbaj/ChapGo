import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Alert, Text } from 'react-native';
import { router } from 'expo-router';
import { Search } from 'lucide-react-native';
import ConversationItem from '@/components/ConversationItem';
import HeaderBar from '@/components/HeaderBar';
import FABButton from '@/components/FABButton';
import { colors, spacing } from '@/styles/globalStyles';
import { Conversation } from '@/types';
import { useEffect } from 'react';
import { apiGet } from '@/lib/api';
import { getToken, clearToken } from '@/lib/auth';
import { useFocusEffect } from '@react-navigation/native';
import { useUnread } from '@/context/UnreadContext';
import { useGlobalInbox, InboxMessage } from '@/hooks/useGlobalInbox';

export default function ConversationsScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const unread = useUnread();

  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    // If user is not authenticated, go to login
    const token = await getToken();
    if (!token) {
      router.replace('/(auth)/login');
      return;
    }
    try {
      // load current user (to compute counterpart display)
      try {
        const me = await apiGet<any>('/api/me');
        console.log('[Conversations] /api/me response =', me);
        if (me?.id) setCurrentUserId(String(me.id));
      } catch (e) {
        console.warn('[Conversations] failed to load /api/me:', e);
        setError(`Failed to load user info: ${(e as Error)?.message}`);
      }
      
      const raw = await apiGet<any>(`/api/conversations/summary`);
      console.log('[Conversations] /api/conversations/summary raw response =', raw);
      // Unwrap common list shapes: array | {content|items|data|results}
      const items: any[] = Array.isArray(raw)
        ? raw
        : (raw?.content || raw?.items || raw?.data || raw?.results || []);
      console.log('[Conversations] list payload count =', Array.isArray(items) ? items.length : 'n/a');
      if (Array.isArray(items) && items[0]) {
        console.log('[Conversations] first item sample =', items[0]);
      }
      
      const mapped: Conversation[] = items.map((c) => {
        const counterpart = c.counterpart ?? {};
        const last = c.lastMessage ?? {};
        return {
          id: String(c.conversationId ?? c.id ?? Date.now()),
          name: counterpart.name ?? 'Conversation',
          avatar: counterpart.avatar ?? 'https://placehold.co/100x100',
          lastMessage: last.text ?? '',
          lastMessageTime: c.lastActivityAt ? new Date(c.lastActivityAt) : (last.timestamp ? new Date(last.timestamp) : new Date()),
          unreadCount: c.unreadCount ?? 0,
          isOnline: !!counterpart.online,
          isTyping: false,
          messages: [],
        } as Conversation;
      });
      // trier par activité récente (dernier message le plus récent en haut)
      mapped.sort((a, b) => (b.lastMessageTime?.getTime() ?? 0) - (a.lastMessageTime?.getTime() ?? 0));
      console.log('[Conversations] mapped conversations count =', mapped.length);
      setConversations(mapped);
    } catch (e) {
      console.error('[Conversations] Failed to load conversations:', e);
      const msg = (e as Error)?.message || '';
      setError(`Failed to load conversations: ${msg}`);
      if (msg.includes('401') || msg.includes('403')) {
        router.replace('/(auth)/login');
      } else {
        Alert.alert('Erreur', `Impossible de charger les conversations: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Recharger quand l'onglet gagne le focus (revient de la conversation après le 1er message)
  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations])
  );

  const handleConversationPress = (conversation: Conversation) => {
    // Clear unread count immediately for better UX
    unread.clear(String(conversation.id));
    router.push({
      pathname: '/conversation/[id]',
      params: { id: conversation.id }
    });
  };

  const handleNewConversation = () => {
    router.push('/(tabs)/contacts');
  };

  // Real-time reorder and preview update when new messages arrive globally
  useGlobalInbox({
    onIncomingMessage: (m: InboxMessage) => {
      setConversations(prev => {
        const idx = prev.findIndex(c => String(c.id) === String(m.conversationId));
        const now = m.timestamp ? new Date(m.timestamp) : new Date();
        let updated: Conversation;
        if (idx >= 0) {
          updated = {
            ...prev[idx],
            lastMessage: m.type === 'text' ? (m.text ?? '') : (m.type?.toUpperCase() || ''),
            lastMessageTime: now,
          } as Conversation;
          const clone = [...prev];
          clone.splice(idx, 1);
          // Insert at top
          return [updated, ...clone];
        } else {
          // If conversation not present (e.g., new direct), append and then sort by time
          const newConv: Conversation = {
            id: String(m.conversationId),
            name: m.conversationName || 'Conversation',
            avatar: 'https://placehold.co/100x100',
            lastMessage: m.type === 'text' ? (m.text ?? '') : (m.type?.toUpperCase() || ''),
            lastMessageTime: now,
            unreadCount: 0,
            isOnline: false,
            isTyping: false,
            messages: [],
          } as Conversation;
          const list = [newConv, ...prev];
          // Ensure order by lastMessageTime desc
          list.sort((a, b) => (b.lastMessageTime?.getTime() ?? 0) - (a.lastMessageTime?.getTime() ?? 0));
          return list;
        }
      });
    }
  });

  const handleSearch = () => {
    Alert.alert('Recherche', 'Fonction de recherche à implémenter');
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const liveUnread = unread.get(String(item.id));
    const merged: Conversation = { ...item, unreadCount: (item.unreadCount ?? 0) + (liveUnread ?? 0) };
    return (
      <ConversationItem
        conversation={merged}
        onPress={() => handleConversationPress(item)}
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <HeaderBar
          title="Discussions"
          showSearchButton
          onSearchPress={handleSearch}
          showLogoutButton
          onLogoutPress={async () => {
            await clearToken();
            router.replace('/(auth)/login');
          }}
        />
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
        <FABButton onPress={handleNewConversation} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <HeaderBar
          title="Discussions"
          showSearchButton
          onSearchPress={handleSearch}
          showLogoutButton
          onLogoutPress={async () => {
            await clearToken();
            router.replace('/(auth)/login');
          }}
        />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Erreur: {error}</Text>
          <Text style={styles.retryText} onPress={loadConversations}>Réessayer</Text>
        </View>
        <FABButton onPress={handleNewConversation} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderBar
        title="Discussions"
        showSearchButton
        onSearchPress={handleSearch}
        showLogoutButton
        onLogoutPress={async () => {
          await clearToken();
          router.replace('/(auth)/login');
        }}
      />
      
      {conversations.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Aucune conversation</Text>
          <Text style={styles.emptySubText}>Commencez une nouvelle conversation</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      <FABButton onPress={handleNewConversation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryText: {
    fontSize: 16,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  emptyText: {
    fontSize: 18,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySubText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  listContainer: {
    paddingVertical: spacing.sm,
  },
});