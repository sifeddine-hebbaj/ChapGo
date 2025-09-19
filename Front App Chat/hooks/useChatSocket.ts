import { Client, IMessage, StompSubscription, StompConfig } from '@stomp/stompjs';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { WS_URL, BASE_URL } from '@/lib/api';
import { getToken } from '@/lib/auth';
import SockJS from 'sockjs-client';

// Types for WebSocket payloads
type TypingPayload = {
  userId: string;
  conversationId: string;
  isTyping: boolean;
};

type ReadReceiptPayload = {
  userId: string;
  conversationId: string;
  messageId: string;
  readAt: string;
};

export interface ChatMessageDto {
  id?: string;
  text: string;
  senderId: string;
  conversationId?: string;
  timestamp?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  type?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'file';
  mediaUrl?: string | null;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

const CONNECTION_STATES = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error'
} as const;

type ConnectionState = typeof CONNECTION_STATES[keyof typeof CONNECTION_STATES];

interface UseChatSocketProps {
  onMessage: (msg: ChatMessageDto) => void;
  onTyping?: (payload: TypingPayload) => void;
  onRead?: (payload: ReadReceiptPayload) => void;
  onConnectionChange?: (isConnected: boolean) => void;
  onError?: (error: Error) => void;
}

export function useChatSocket(
  conversationId: string,
  handlersOrOnMessage: UseChatSocketProps | ((msg: ChatMessageDto) => void)
) {
  // Backward-compatible handlers: allow passing a single onMessage function
  const handlers = (typeof handlersOrOnMessage === 'function'
    ? { onMessage: handlersOrOnMessage }
    : handlersOrOnMessage) as UseChatSocketProps;
  const { onMessage, onTyping, onRead, onConnectionChange, onError } = handlers;
  // State and refs
  const [connectionState, setConnectionState] = useState<ConnectionState>(CONNECTION_STATES.DISCONNECTED);
  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<StompSubscription[]>([]);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const isConnected = connectionState === CONNECTION_STATES.CONNECTED;
  const isMounted = useRef(true);
  const pendingQueue = useRef<Array<{
    message: ChatMessageDto;
    resolve: () => void;
    reject: (error: Error) => void;
    timestamp: number;
  }>>([]);
  
  // Memoized callbacks
  const handleReconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.warn('[WS] Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
    reconnectAttempts.current++;
    
    console.log(`[WS] Reconnecting attempt ${reconnectAttempts.current} in ${delay}ms...`);
    
    reconnectTimeout.current = setTimeout(async () => {
      if (!isMounted.current) return;
      
      try {
        const client = clientRef.current;
        if (client) {
          await client.activate();
        }
      } catch (error) {
        console.error('[WS] Reconnection attempt failed:', error);
        handleReconnect();
      }
    }, delay);
  }, []);

  // WebSocket client configuration
  const getWebSocketConfig = useCallback((): StompConfig => {
    const config: StompConfig = {
      debug: (str) => {
        if (__DEV__) {
          console.log(`[WS] ${str}`);
        }
      },
      onConnect: (frame) => {
        console.log('[WS] Connected to WebSocket server');
        reconnectAttempts.current = 0;
        if (isMounted.current) {
          setConnectionState(CONNECTION_STATES.CONNECTED);
          onConnectionChange?.(true);
        }
      },
      onStompError: (frame) => {
        console.error('[WS] STOMP protocol error:', frame.headers.message);
        onError?.(new Error(frame.headers.message || 'STOMP protocol error'));
      },
      onDisconnect: () => {
        console.log('[WS] Disconnected from WebSocket server');
        if (isMounted.current) {
          setConnectionState(CONNECTION_STATES.DISCONNECTED);
          onConnectionChange?.(false);
        }
        handleReconnect();
      },
      onWebSocketError: (event) => {
        console.error('[WS] WebSocket error:', event);
        onError?.(new Error('WebSocket connection error'));
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    };

    // Configure WebSocket factory based on platform
    if (Platform.OS === 'web') {
      console.log('[WS] Platform: Web - Using SockJS');
      config.webSocketFactory = () => {
        try {
          return new SockJS(`${BASE_URL}/ws`) as unknown as WebSocket;
        } catch (error) {
          console.error('[WS] Failed to create SockJS connection:', error);
          throw error;
        }
      };
    } else {
      console.log('[WS] Platform: Native - Using WebSocket');
      console.log(`[WS] WebSocket URL: ${WS_URL}`);
      config.brokerURL = WS_URL;
      config.connectHeaders = {
        ...config.connectHeaders,
        'heart-beat': '4000,4000'
      };
    }

    return config;
  }, [onConnectionChange, onError, handleReconnect]);

  // Initialize WebSocket client
  useEffect(() => {
    if (clientRef.current) return;

    console.log('[WS] Initializing WebSocket client');
    
    // Create and configure the WebSocket client
    const client = new Client(getWebSocketConfig());
    clientRef.current = client;
    
    // Cleanup function
    return () => {
      console.log('[WS] Cleaning up WebSocket client');
      isMounted.current = false;
      
      // Clear any pending reconnection attempts
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
      
      // Unsubscribe from all subscriptions
      if (subscriptionsRef.current) {
        subscriptionsRef.current.forEach(sub => {
          try {
            if (sub && typeof sub.unsubscribe === 'function') {
              sub.unsubscribe();
            }
          } catch (error) {
            console.error('[WS] Error unsubscribing:', error);
          }
        });
        subscriptionsRef.current = [];
      }
      
      // Clear pending queue
      if (pendingQueue.current) {
        pendingQueue.current = [];
      }
      
      // Disconnect the client
      if (clientRef.current) {
        try {
          clientRef.current.deactivate();
        } catch (error) {
          console.error('[WS] Error during WebSocket deactivation:', error);
        }
        clientRef.current = null;
      }
    };
  }, [getWebSocketConfig]);
  
  // After initial client initialization, attempt connecting with auth headers
  // and handle lifecycle elsewhere. The duplicate block that used to exist here
  // has been removed to avoid syntax errors and duplicate hook declarations.
  useEffect(() => {
    const connect = async () => {
      const client = clientRef.current;
      if (!client) return;
      if (client.active || client.connected) return;
      try {
        const token = await getToken();
        if (!token) {
          console.warn('[WS] No authentication token available');
          return;
        }
        client.connectHeaders = {
          ...client.connectHeaders,
          Authorization: `Bearer ${token}`,
          'X-Client-Type': 'mobile-app',
          'X-Client-Version': '1.0.0',
        };
        if (isMounted.current) {
          setConnectionState(CONNECTION_STATES.CONNECTING);
        }
        await client.activate();
      } catch (error) {
        console.error('[WS] Failed to activate client:', error);
        if (isMounted.current) {
          setConnectionState(CONNECTION_STATES.ERROR);
          onConnectionChange?.(false);
        }
        handleReconnect();
      }
    };
    connect();
  }, [handleReconnect, onConnectionChange]);
  
  // When connected, set up subscriptions and process any queued messages
  useEffect(() => {
    if (isConnected) {
      (async () => {
        try {
          await setupSubscriptions();
        } catch (e) {
          console.error('[WS] Failed to setup subscriptions:', e);
        }
        try {
          await processPendingQueue();
        } catch {}
      })();
    }
  }, [isConnected]);

  // After removal of the duplicated block above, keep a single definition of pendingQueue
  
  // Process the pending message queue
  const processPendingQueue = useCallback(async () => {
    if (!isConnected || !clientRef.current || pendingQueue.current.length === 0) return;
    
    console.log(`[WS] Processing ${pendingQueue.current.length} pending messages`);
    
    // Filter out messages older than 5 minutes
    const now = Date.now();
    const recentMessages = pendingQueue.current.filter(
      ({ timestamp }) => now - timestamp < 5 * 60 * 1000 // 5 minutes
    );
    
    if (recentMessages.length < pendingQueue.current.length) {
      console.log(`[WS] Removed ${pendingQueue.current.length - recentMessages.length} expired messages from queue`);
    }
    
    // Update the queue with only recent messages
    pendingQueue.current = [];
    
    // Process each message in the queue
    for (const { message, resolve, reject } of recentMessages) {
      try {
        console.log('[WS] Sending queued message:', message);
        await sendMessage(message);
        resolve();
      } catch (error) {
        console.error('[WS] Failed to send queued message:', error);
        // Re-add to queue if sending failed
        pendingQueue.current.push({ 
          message, 
          resolve, 
          reject, 
          timestamp: Date.now() 
        });
      }
    }
  }, [isConnected]);


  // Setup WebSocket subscriptions
  const setupSubscriptions = useCallback(async () => {
    const client = clientRef.current;
    if (!client || !client.connected) {
      console.log('[WS] Cannot setup subscriptions: client not connected');
      return;
    }

    console.log(`[WS] Setting up subscriptions for conversation: ${conversationId}`);
    
    // Clear any existing subscriptions
    if (subscriptionsRef.current) {
      subscriptionsRef.current.forEach(sub => {
        try {
          if (sub && typeof sub.unsubscribe === 'function') {
            sub.unsubscribe();
          }
        } catch (error) {
          console.error('[WS] Error unsubscribing:', error);
        }
      });
      subscriptionsRef.current = [];
    }

    // Subscribe to conversation messages
    const messageSubscription = client.subscribe(
      `/topic/conversations/${conversationId}`,
      (message: IMessage) => {
        try {
          const body = JSON.parse(message.body) as ChatMessageDto;
          console.log('[WS] Received message:', body);
          onMessage(body);
        } catch (error) {
          console.error('[WS] Error parsing message:', error, 'Raw message:', message.body);
        }
      },
      { id: `sub-${conversationId}-messages` }
    );
    subscriptionsRef.current.push(messageSubscription);

    // Subscribe to typing notifications if handler provided
    if (onTyping) {
      const typingSubscription = client.subscribe(
        `/topic/conversations/${conversationId}/typing`,
        (message: IMessage) => {
          try {
            const payload = JSON.parse(message.body) as TypingPayload;
            onTyping(payload);
          } catch (error) {
            console.error('[WS] Error parsing typing notification:', error);
          }
        },
        { id: `typing-${conversationId}` }
      );
      subscriptionsRef.current.push(typingSubscription);
    }

    // Subscribe to read receipts if handler provided
    if (onRead) {
      const readSubscription = client.subscribe(
        `/topic/conversations/${conversationId}/read`,
        (message: IMessage) => {
          try {
            const payload = JSON.parse(message.body) as ReadReceiptPayload;
            onRead(payload);
          } catch (error) {
            console.error('[WS] Error parsing read receipt:', error);
          }
        },
        { id: `read-${conversationId}` }
      );
      subscriptionsRef.current.push(readSubscription);
    }
  }, [conversationId, onMessage, onTyping, onRead]);

  // Send a message through WebSocket
  const sendMessage = useCallback(async (message: Omit<ChatMessageDto, 'id' | 'timestamp' | 'status'>) => {
    return new Promise<void>((resolve, reject) => {
      const messageWithMetadata: ChatMessageDto = {
        ...message,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        status: 'sent',
      };

      // If not connected, add to queue and try to connect
      if (!isConnected || !clientRef.current?.connected) {
        console.log('[WS] Not connected, queueing message');
        pendingQueue.current.push({
          message: messageWithMetadata,
          resolve,
          reject,
          timestamp: Date.now(),
        });
        return;
      }

      try {
        console.log('[WS] Sending message:', messageWithMetadata);
        clientRef.current.publish({
          destination: `/app/chat.send/${conversationId}`,
          body: JSON.stringify({
            ...messageWithMetadata,
            conversationId,
          }),
          headers: { 'content-type': 'application/json' },
        });
        resolve();
      } catch (error) {
        console.error('[WS] Error sending message:', error);
        
        // Add to queue and try to reconnect
        pendingQueue.current.push({
          message: messageWithMetadata,
          resolve,
          reject,
          timestamp: Date.now(),
        });
        
        // Try to reconnect if not already connected or connecting
        if (connectionState !== CONNECTION_STATES.CONNECTED) {
          console.log('[WS] Attempting to reconnect after send failure...');
          const client = clientRef.current;
          if (client) {
            return client.activate().catch(err => {
              console.error('[WS] Reconnection failed:', err);
              reject(new Error('Failed to send message and reconnect'));
              return Promise.reject(err); // Ensure we don't accidentally resolve the outer promise
            });
          }
        } else {
          reject(error);
        }
      }
    });
  }, [isConnected, connectionState, conversationId]);

  // Send typing indicator
  const sendTyping = useCallback(async (isTyping: boolean, userId?: string) => {
    const client = clientRef.current;
    if (!client || !client.connected) return;
    try {
      const payload = {
        userId: userId || 'me',
        conversationId,
        isTyping,
      } as TypingPayload;
      client.publish({
        destination: `/app/chat.typing/${conversationId}`,
        body: JSON.stringify(payload),
        headers: { 'content-type': 'application/json' },
      });
    } catch (e) {
      console.warn('[WS] Failed to send typing event', e);
    }
  }, [conversationId]);

  // Send read receipt
  const sendRead = useCallback(async (messageId: string, userId?: string) => {
    const client = clientRef.current;
    if (!client || !client.connected) return;
    try {
      const payload = {
        userId: userId || 'me',
        conversationId,
        messageId,
        readAt: new Date().toISOString(),
      } as ReadReceiptPayload;
      client.publish({
        destination: `/app/chat.read`,
        body: JSON.stringify(payload),
        headers: { 'content-type': 'application/json' },
      });
    } catch (e) {
      console.warn('[WS] Failed to send read receipt', e);
    }
  }, [conversationId]);

  // Return the public API
  return {
    sendMessage,
    sendTyping,
    sendRead,
    isConnected,
    connectionState,
  };
}