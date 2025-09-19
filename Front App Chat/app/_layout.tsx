import React, { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { NotificationProvider, useNotification } from '@/context/NotificationContext';
import { ActiveConversationProvider, useActiveConversation } from '@/context/ActiveConversationContext';
import { UnreadProvider, useUnread } from '@/context/UnreadContext';
import InAppBanner from '@/components/InAppBanner';
import { useGlobalInbox } from '@/hooks/useGlobalInbox';
import { apiGet } from '@/lib/api';

function GlobalInboxListener() {
  const { showNotification } = useNotification();
  const { activeConversationId } = useActiveConversation();
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const unread = useUnread();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await apiGet<any>('/api/me');
        if (!cancelled && me?.id) setCurrentUserId(String(me.id));
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  useGlobalInbox({
    onIncomingMessage: (m) => {
      // Do not notify if I am the sender (shouldn't happen but safe guard)
      if (currentUserId && m.senderId === currentUserId) return;
      
      // Do not notify if the conversation is currently open
      const isActiveConversation = activeConversationId && String(activeConversationId) === String(m.conversationId);
      
      // Create message preview
      const preview = m.type === 'text' 
        ? (m.text || '') 
        : (m.type === 'image' ? '📷 Photo' : 
           m.type === 'video' ? '🎥 Vidéo' : 
           m.type === 'audio' ? '🔊 Message vocal' : 
           m.type === 'document' ? '📄 Document' : 
           m.type === 'file' ? '📁 Fichier' : 
           m.type === 'location' ? '📍 Localisation' : 
           'Nouveau message');

      // Only increment unread count if not in the active conversation
      if (m.conversationId && !isActiveConversation) {
        unread.increment(String(m.conversationId), 1);
      }

      // Don't show notification if it's the active conversation
      if (isActiveConversation) return;

      // Create a more informative notification
      showNotification({
        title: m.conversationName || 'Nouvelle conversation',
        body: preview,
        senderName: m.senderName || 'Expéditeur inconnu',
        conversationId: m.conversationId,
        conversationName: m.conversationName,
        timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
        onPress: () => {
          if (m.conversationId) {
            router.push({ 
              pathname: '/conversation/[id]', 
              params: { 
                id: String(m.conversationId),
                title: m.conversationName || 'Conversation'
              } 
            });
          }
        },
      });
    },
  });

  return null;
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <NotificationProvider>
      <ActiveConversationProvider>
        <UnreadProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="+not-found" />
          </Stack>
          <GlobalInboxListener />
          <InAppBanner />
          <StatusBar style="auto" />
        </UnreadProvider>
      </ActiveConversationProvider>
    </NotificationProvider>
  );
}
