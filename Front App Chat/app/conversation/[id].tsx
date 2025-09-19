import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, FlatList, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Text, Image } from 'react-native';
import SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';
import { useLocalSearchParams, router } from 'expo-router';
import { useActiveConversation } from '@/context/ActiveConversationContext';
import { useUnread } from '@/context/UnreadContext';
import { Send, Paperclip, Mic, Camera, Image as ImageIcon, FileText, MapPin, Phone, Video as VideoIcon } from 'lucide-react-native';
import MessageBubble from '@/components/MessageBubble';
import HeaderBar from '@/components/HeaderBar';
import { colors, spacing, borderRadius, shadows, typography } from '@/styles/globalStyles';
import { Message } from '@/types';
import { apiGet, apiPost, BASE_URL } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { useChatSocket } from '@/hooks/useChatSocket';
import { 
  takePhoto, 
  selectImage, 
  selectVideo, 
  selectDocument, 
  getCurrentLocation,
  startAudioRecording,
  stopAudioRecording,
  testUpload,
  MediaUploadResult 
} from '@/lib/mediaService';
import { Audio } from 'expo-av';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { setActiveConversationId } = useActiveConversation();
  const unread = useUnread();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [conversation, setConversation] = useState<any>(null);
  const [headerTitle, setHeaderTitle] = useState<string>('Conversation');
  const [headerAvatar, setHeaderAvatar] = useState<string | undefined>(undefined);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [showMediaOptions, setShowMediaOptions] = useState<boolean>(false);
  const listRef = useRef<FlatList<Message>>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const { sendMessage, sendTyping, sendRead, isConnected } = useChatSocket(
    String(id ?? ''),
    {
      onMessage: (msg) => {
        // 1) Si c'est un écho de mes propres messages -> marquer comme "delivered"
        if (currentUserId && msg.senderId === currentUserId) {
          setMessages((prev) => {
            // Essayez d'associer par id si renvoyé, sinon par heuristique (texte + type + mediaUrl)
            const idxById = msg.id ? prev.findIndex(m => m.id === msg.id) : -1;
            if (idxById >= 0) {
              const clone = [...prev];
              clone[idxById] = { ...clone[idxById], status: 'delivered' };
              return clone;
            }
            const idx = prev.findIndex(m => (
              m.senderId === currentUserId &&
              (m.status === 'sent' || m.status === 'sending') &&
              m.type === (msg.type as Message['type'] ?? 'text') &&
              m.text === (msg.text ?? '') &&
              (m.mediaUrl ?? null) === (msg.mediaUrl ?? null)
            ));
            if (idx >= 0) {
              const clone = [...prev];
              clone[idx] = { ...clone[idx], id: msg.id ?? clone[idx].id, status: 'delivered' };
              return clone;
            }
            return prev;
          });
          return;
        }

        // 2) Message entrant d'un autre utilisateur -> afficher et envoyer l'accusé de lecture
        const mapped: Message = {
          id: msg.id ?? Date.now().toString(),
          text: msg.text,
          senderId: msg.senderId,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
          status: (msg.status as Message['status']) ?? 'sent',
          type: (msg.type as Message['type']) ?? 'text',
          mediaUrl: msg.mediaUrl ?? undefined,
        };

        setMessages((prev) => {
          if (mapped.id && prev.some((m) => m.id === mapped.id)) return prev;
          return [...prev, mapped];
        });

        // Envoyer l'accusé de lecture immédiatement si l'utilisateur est dans la conversation
        if (mapped.id) {
          try {
            sendRead(mapped.id, currentUserId ?? undefined);
            // Marquer localement comme lu pour un feedback instantané
            setMessages((prev) => prev.map(m => m.id === mapped.id ? { ...m, status: 'read' } : m));
          } catch (e) {
            // Ignorer silencieusement si l'envoi échoue, la lecture sera synchronisée plus tard
          }
        }
      },
      onRead: (payload) => {
        // Un autre utilisateur a lu un message -> si c'est un de MES messages, marquer comme 'read'
        if (!payload?.messageId || !currentUserId) return;
        setMessages((prev) => prev.map(m => (
          m.id === payload.messageId && m.senderId === currentUserId
            ? { ...m, status: 'read' }
            : m
        )));
      },
    }
  );

  // Centralized fetch function for messages
  const fetchMessages = useCallback(async () => {
    if (!id) return;
    try {
      const items = await apiGet<any[]>(`/api/conversations/${id}/messages`);
      console.log('[ConversationScreen] messages payload count =', Array.isArray(items) ? items.length : 'n/a');
      if (Array.isArray(items) && items.length) {
        console.log('[ConversationScreen] first message sample =', items[0]);
      }
      const mapped: Message[] = (items || []).map((m) => ({
        id: String(m.id ?? m.messageId ?? m.uuid ?? Date.now()),
        text: m.text ?? m.body ?? m.content ?? '',
        senderId: String(m.senderId ?? m.sender?.id ?? m.fromId ?? ''),
        timestamp: new Date(m.timestamp ?? m.sentAt ?? m.createdAt ?? Date.now()),
        status: (m.status ?? 'sent') as Message['status'],
        type: (m.type ?? 'text') as Message['type'],
        mediaUrl: m.mediaUrl ?? m.attachmentUrl ?? undefined,
      }));
      mapped.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      setMessages(mapped);
    } catch (e) {
      console.warn('Failed to load conversation/messages', e);
    }
  }, [id]);

  useEffect(() => {
    // Mark this conversation as active to avoid showing global banners for it
    if (id) setActiveConversationId(String(id));
    if (id) unread.clear(String(id));
    return () => {
      setActiveConversationId(null);
    };
  }, [id]);

  useEffect(() => {
    // Charger l'utilisateur courant (depuis l'API)
    (async () => {
      try {
        const me = await apiGet<any>('/api/me');
        if (me?.id) setCurrentUserId(String(me.id));
      } catch (e) {
        console.warn('Failed to load current user', e);
      }
    })();

    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const conv = await apiGet<any>(`/api/conversations/${id}`);
        if (cancelled) return;
        console.log('[ConversationScreen] /conversations/:id payload =', conv);
        setConversation(conv);
        // Déterminer le titre et l'avatar à afficher selon la forme des données du backend
        const participants: any[] = Array.isArray(conv?.participants) ? conv.participants : (Array.isArray(conv?.users) ? conv.users : []);
        if (participants.length) {
          const other = currentUserId
            ? (participants.find((p: any) => String(p?.id) !== String(currentUserId)) ?? participants[0])
            : participants[0];
          const name = other?.name || other?.fullName || other?.username || conv?.name || 'Conversation';
          const avatar = other?.avatar || other?.photoUrl || other?.image || conv?.avatar;
          setHeaderTitle(name);
          setHeaderAvatar(avatar);
        } else {
          const name = conv?.name || conv?.title || 'Conversation';
          const avatar = conv?.avatar || conv?.photoUrl;
          setHeaderTitle(name);
          setHeaderAvatar(avatar);
        }
        if (!cancelled) await fetchMessages();
      } catch (e) {
        console.warn('Failed to load conversation/messages', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, currentUserId, fetchMessages]);

  // Polling refresh when WebSocket is disconnected
  useEffect(() => {
    if (!id) return;
    if (isConnected) return; // no polling needed when real-time is active
    const interval = setInterval(() => {
      fetchMessages();
    }, 8000); // every 8s
    return () => clearInterval(interval);
  }, [id, isConnected, fetchMessages]);


  // Effet pour le défilement automatique vers le bas lors de l'ajout de nouveaux messages
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  // Si l'utilisateur courant arrive après la conversation, recalculer le header
  useEffect(() => {
    if (!conversation) return;
    const participants: any[] = Array.isArray(conversation?.participants)
      ? conversation.participants
      : (Array.isArray(conversation?.users) ? conversation.users : []);
    if (participants.length) {
      const other = currentUserId
        ? (participants.find((p: any) => String(p?.id) !== String(currentUserId)) ?? participants[0])
        : participants[0];
      const name = other?.name || other?.fullName || other?.username || conversation?.name || 'Conversation';
      const avatar = other?.avatar || other?.photoUrl || other?.image || conversation?.avatar;
      setHeaderTitle(name);
      setHeaderAvatar(avatar);
    }
  }, [currentUserId, conversation]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    if (!currentUserId) return; // attendre l'utilisateur courant

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      senderId: currentUserId,
      timestamp: new Date(),
      status: 'sent',
      type: 'text',
    };

    // Optimistic UI
    setMessages(prevMessages => [...prevMessages, newMessage]);
    setInputText('');

    // Envoi via WebSocket
    try {
      sendMessage({ text: newMessage.text, senderId: currentUserId, type: 'text' });
    } catch (e) {
      console.warn('WS send failed, message kept locally', e);
      // Fallback REST pour persister le message si WebSocket indisponible
      (async () => {
        try {
          await apiPost(`/api/conversations/${id}/messages`, {
            text: newMessage.text,
            senderId: currentUserId,
            type: 'text',
          });
          // Ensure UI sync when server acknowledges
          await fetchMessages();
        } catch (err) {
          console.warn('REST send failed', err);
        }
      })();
    }
  };

  const sendMediaMessage = async (mediaResult: MediaUploadResult, messageType: 'image' | 'video' | 'audio' | 'document' = 'image') => {
    if (!currentUserId) return;

    // Generate a temporary ID for optimistic UI
    const tempMessageId = Date.now().toString();
    const newMessage: Message = {
      id: tempMessageId,
      text: mediaResult.originalName,
      senderId: currentUserId,
      timestamp: new Date(),
      status: 'sending', // Start with 'sending' state
      type: messageType,
      mediaUrl: mediaResult.url,
    };

    // Optimistic UI update
    setMessages(prevMessages => [...prevMessages, newMessage]);

    // First try to send via WebSocket
    try {
      console.log('Attempting to send media message via WebSocket...');
      const wsMessage = {
        text: mediaResult.originalName,
        senderId: currentUserId,
        type: messageType,
        mediaUrl: mediaResult.url,
        conversationId: id,
      };

      // Try WebSocket first
      try {
        await sendMessage(wsMessage);
        console.log('Media message sent successfully via WebSocket');
        
        // Update message status to sent
        setMessages(prev => prev.map(msg => 
          msg.id === tempMessageId ? { ...msg, status: 'sent' } : msg
        ));
        return;
      } catch (wsError) {
        console.warn('WebSocket send failed, falling back to REST API', wsError);
        // Continue to REST fallback
      }

      // Fallback to REST API if WebSocket fails
      console.log('Falling back to REST API for media message');
      try {
        const response = await apiPost(`/api/conversations/${id}/messages`, {
          text: mediaResult.originalName,
          senderId: currentUserId,
          type: messageType,
          mediaUrl: mediaResult.url,
        });

        // Update the message with the server response
        if (response && response.id) {
          setMessages(prev => prev.map(msg => 
            msg.id === tempMessageId 
              ? { ...msg, id: response.id, status: 'sent' } 
              : msg
          ));
        } else {
          // If no ID in response, just mark as sent
          setMessages(prev => prev.map(msg => 
            msg.id === tempMessageId ? { ...msg, status: 'sent' } : msg
          ));
        }
        // Refresh to reflect server-side fields and normalized urls
        await fetchMessages();
      } catch (restError) {
        console.error('REST API send failed:', restError);
        // Update message status to failed
        setMessages(prev => prev.map(msg => 
          msg.id === tempMessageId ? { ...msg, status: 'error' } : msg
        ));
        throw restError;
      }
    } catch (error) {
      console.error('Failed to send media message:', error);
      // The error is already handled in the catch blocks above
      throw error;
    }
  };

  const handleAttachment = () => {
    setShowMediaOptions(!showMediaOptions);
  };

  const handleVoiceMessage = async () => {
    try {
      if (isRecording && recordingRef.current) {
        // Arrêter l'enregistrement
        setIsRecording(false);
        const mediaResult = await stopAudioRecording(recordingRef.current);
        recordingRef.current = null;
        
        if (mediaResult) {
          await sendMediaMessage(mediaResult, 'audio');
        }
      } else {
        // Commencer l'enregistrement
        const recording = await startAudioRecording();
        recordingRef.current = recording;
        setIsRecording(true);
      }
    } catch (error) {
      setIsRecording(false);
      recordingRef.current = null;
      Alert.alert('Erreur', (error as Error).message);
    }
  };

  const handleTakePhoto = async () => {
    setShowMediaOptions(false);
    try {
      const mediaResult = await takePhoto();
      if (mediaResult) {
        await sendMediaMessage(mediaResult, 'image');
      }
    } catch (error) {
      Alert.alert('Erreur', (error as Error).message);
    }
  };

  const handleSelectImage = async () => {
    setShowMediaOptions(false);
    try {
      const mediaResult = await selectImage();
      if (mediaResult) {
        await sendMediaMessage(mediaResult, 'image');
      }
    } catch (error) {
      Alert.alert('Erreur', (error as Error).message);
    }
  };

  const handleSelectVideo = async () => {
    setShowMediaOptions(false);
    try {
      const mediaResult = await selectVideo();
      if (mediaResult) {
        await sendMediaMessage(mediaResult, 'video');
      }
    } catch (error) {
      Alert.alert('Erreur', (error as Error).message);
    }
  };

  const handleSelectDocument = async () => {
    setShowMediaOptions(false);
    try {
      const mediaResult = await selectDocument();
      if (mediaResult) {
        await sendMediaMessage(mediaResult, 'document');
      }
    } catch (error) {
      Alert.alert('Erreur', (error as Error).message);
    }
  };


  const handleShareLocation = async () => {
    setShowMediaOptions(false);
    try {
      const location = await getCurrentLocation();
      if (location) {
        const locationText = `📍 Location: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
        
        if (!currentUserId) return;

        const newMessage: Message = {
          id: Date.now().toString(),
          text: locationText,
          senderId: currentUserId,
          timestamp: new Date(),
          status: 'sent',
          type: 'text',
        };

        // Optimistic UI
        setMessages(prevMessages => [...prevMessages, newMessage]);
        setInputText('');

        // Envoi via WebSocket
        try {
          sendMessage({ text: locationText, senderId: currentUserId, type: 'text' });
        } catch (e) {
          console.warn('WS send failed, message kept locally', e);
          // Fallback REST
          (async () => {
            try {
              await apiPost(`/api/conversations/${id}/messages`, {
                text: locationText,
                senderId: currentUserId,
                type: 'text',
              });
            } catch (err) {
              console.warn('REST send failed', err);
            }
          })();
        }
      }
    } catch (error) {
      Alert.alert('Erreur', (error as Error).message);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble 
      message={item} 
      isOwn={!!currentUserId && item.senderId === currentUserId} 
    />
  );

  // Function to handle call button press
  const handleCall = () => {
    // TODO: Implement call functionality
    router.push({ pathname: '/call', params: { mode: 'audio', roomId: String(id) } });
  };

  // Function to handle video call button press
  const handleVideoCall = () => {
    // TODO: Implement video call functionality
    router.push({ pathname: '/call', params: { mode: 'video', roomId: String(id) } });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          {headerAvatar ? (
            <Image source={{ uri: headerAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>{headerTitle?.charAt(0)}</Text>
            </View>
          )}
          <Text style={styles.headerTitle} numberOfLines={1}>
            {headerTitle}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleCall} style={styles.iconButton}>
            <Phone size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleVideoCall} style={[styles.iconButton, { marginLeft: spacing.md }]}>
            <VideoIcon size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages List */}
      <View style={styles.messagesOuterContainer}>
        <FlatList
          ref={listRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={[styles.messagesList, { backgroundColor: colors.background }]}
          contentContainerStyle={styles.messagesContentContainer}
          inverted={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => {
            if (messages.length > 0) {
              requestAnimationFrame(() => {
                listRef.current?.scrollToEnd({ animated: true });
              });
            }
          }}
          onLayout={() => {
            if (messages.length > 0) {
              requestAnimationFrame(() => {
                listRef.current?.scrollToEnd({ animated: true });
              });
            }
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucun message</Text>
            </View>
          }
        />
      </View>
      
      {/* Media Options */}
      {showMediaOptions && (
        <View style={styles.mediaOptionsContainer}>
          <TouchableOpacity style={styles.mediaOption} onPress={handleTakePhoto}>
            <Camera size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.mediaOption} onPress={handleSelectImage}>
            <ImageIcon size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.mediaOption} onPress={handleSelectVideo}>
            <VideoIcon size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.mediaOption} onPress={handleSelectDocument}>
            <FileText size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.mediaOption} onPress={handleShareLocation}>
            <MapPin size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}
      
      {/* Input Container */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.keyboardAvoidingView}
      >
        <View style={[styles.inputContainer, shadows.lg]}>
          <TouchableOpacity 
            style={[styles.attachButton, showMediaOptions && styles.attachButtonActive]}
            onPress={handleAttachment}
          >
            <Paperclip size={20} color={showMediaOptions ? colors.surface : colors.primary} />
          </TouchableOpacity>
          
          <TextInput
            style={styles.textInput}
            placeholder="Tapez votre message..."
            placeholderTextColor={colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />
          
          <TouchableOpacity 
            style={[
              styles.voiceButton,
              isRecording && styles.voiceButtonRecording
            ]}
            onPress={handleVoiceMessage}
          >
            <Mic size={20} color={isRecording ? colors.surface : colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.sendButton,
              inputText.trim() ? styles.sendButtonActive : styles.sendButtonInactive
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || !currentUserId}
          >
            <Send size={18} color={inputText.trim() ? colors.surface : colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: spacing.sm,
  },
  backButtonText: {
    fontSize: 24,
    color: colors.text,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.sm,
  },
  avatarPlaceholder: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTitle: {
    ...typography.title3,
    color: colors.text,
    flex: 1,
  },
  iconButton: {
    padding: spacing.xs,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.subhead,
    color: colors.textSecondary,
  },
  keyboardAvoidingView: {
    width: '100%',
    backgroundColor: colors.surface,
  },
  messagesOuterContainer: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
  },
  messagesList: {
    flex: 1,
    width: '100%',
  },
  messagesContentContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  callButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  audioCallButton: {
    backgroundColor: colors.primary,
    marginRight: spacing.sm,
  },
  videoCallButton: {
    backgroundColor: colors.secondary,
  },
  callButtonText: {
    color: 'white',
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    minHeight: 70,
    width: '100%',
  },
  attachButton: {
    padding: spacing.sm,
    marginRight: spacing.xs,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  attachButtonActive: {
    backgroundColor: colors.primary,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : spacing.xs,
    marginHorizontal: spacing.xs,
    maxHeight: 100,
    minHeight: 40,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
    textAlignVertical: 'center',
  },
  voiceButton: {
    padding: spacing.sm,
    marginLeft: spacing.xs,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  voiceButtonRecording: {
    backgroundColor: colors.error,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
  sendButtonActive: {
    backgroundColor: colors.primary,
  },
  sendButtonInactive: {
    backgroundColor: colors.border,
  },
  mediaOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  mediaOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});