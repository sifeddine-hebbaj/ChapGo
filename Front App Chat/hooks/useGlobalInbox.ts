import { Client, IMessage, StompConfig, StompSubscription } from '@stomp/stompjs';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import SockJS from 'sockjs-client';
import { BASE_URL, WS_URL, apiGet } from '@/lib/api';
import { getToken } from '@/lib/auth';

export type InboxMessage = {
  id: string;
  text: string;
  senderId: string;
  senderName?: string | null;
  conversationId: string;
  conversationName?: string | null;
  timestamp?: string;
  type?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'file' | 'pdf';
  mediaUrl?: string | null;
};

interface UseGlobalInboxOptions {
  onIncomingMessage: (msg: InboxMessage) => void;
}

export function useGlobalInbox({ onIncomingMessage }: UseGlobalInboxOptions) {
  const clientRef = useRef<Client | null>(null);
  const subsRef = useRef<StompSubscription[]>([]);
  const [connected, setConnected] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const configFactory = useCallback((): StompConfig => {
    const config: StompConfig = {
      debug: (str) => { if (__DEV__) console.log(`[InboxWS] ${str}`); },
      onConnect: () => setConnected(true),
      onDisconnect: () => setConnected(false),
      reconnectDelay: 6000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    };
    if (Platform.OS === 'web') {
      config.webSocketFactory = () => new SockJS(`${BASE_URL}/ws`) as unknown as WebSocket;
    } else {
      config.brokerURL = WS_URL;
    }
    return config;
  }, []);

  const setupSubs = useCallback(() => {
    const c = clientRef.current;
    if (!c || !c.connected || !userId) return;

    // Clear old subs
    subsRef.current.forEach(s => { try { s.unsubscribe(); } catch {} });
    subsRef.current = [];

    // Prefer per-user queue
    const s1 = c.subscribe(`/user/queue/inbox`, (m: IMessage) => {
      try {
        const payload = JSON.parse(m.body) as InboxMessage;
        if (__DEV__) console.log('[InboxWS] /user/queue/inbox message:', payload);
        onIncomingMessage(payload);
      } catch (e) {
        console.warn('[InboxWS] failed to parse inbox message', e);
      }
    }, { id: `inbox-${userId}` });
    subsRef.current.push(s1);

    // Fallback topics that some servers use
    const s2 = c.subscribe(`/topic/users/${userId}/messages`, (m: IMessage) => {
      try {
        const payload = JSON.parse(m.body) as InboxMessage;
        if (__DEV__) console.log('[InboxWS] /topic/users/{id}/messages message:', payload);
        onIncomingMessage(payload);
      } catch {}
    }, { id: `user-msg-${userId}` });
    subsRef.current.push(s2);
  }, [onIncomingMessage, userId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await apiGet<any>('/api/me');
        if (!cancelled && me?.id) setUserId(String(me.id));
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!userId) return;
    if (clientRef.current) return;

    const client = new Client(configFactory());
    clientRef.current = client;

    (async () => {
      try {
        const token = await getToken();
        client.connectHeaders = {
          Authorization: token ? `Bearer ${token}` : '',
          'X-Client-Type': 'mobile-app',
        };
        if (__DEV__) console.log('[InboxWS] activating with headers, userId=', userId);
        await client.activate();
      } catch (e) {
        console.warn('[InboxWS] activate failed', e);
      }
    })();

    return () => {
      subsRef.current.forEach(s => { try { s.unsubscribe(); } catch {} });
      subsRef.current = [];
      if (clientRef.current) {
        try { clientRef.current.deactivate(); } catch {}
        clientRef.current = null;
      }
    };
  }, [userId, configFactory]);

  useEffect(() => {
    if (__DEV__) console.log('[InboxWS] connected=', connected);
    if (connected) setupSubs();
  }, [connected, setupSubs]);

  return { connected };
}
