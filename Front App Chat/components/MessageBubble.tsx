import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, Modal, Platform, Linking } from 'react-native';
import { Audio, Sound } from 'expo-av';
import { VideoView, useVideoPlayer } from 'expo-video';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import { File, FileText, Volume2 } from 'lucide-react-native';

import { Message } from '@/types';
import { colors, typography, spacing, borderRadius, shadows } from '@/styles/globalStyles';
import { BASE_URL } from '@/lib/api';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const LocationCard: React.FC<{
    latitude: number;
    longitude: number;
    isOwn: boolean;
    label?: string;
  }> = ({ latitude, longitude, isOwn, label }) => {
    // Build a maps URL for external open
    const gmapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
    const osmEmbed = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.01}%2C${latitude-0.01}%2C${longitude+0.01}%2C${latitude+0.01}&layer=mapnik&marker=${latitude}%2C${longitude}`;
    return (
      <TouchableOpacity
        style={styles.mapCard}
        activeOpacity={0.85}
        onPress={async () => {
          try {
            if (Platform.OS === 'web') {
              Linking.openURL(gmapsUrl);
            } else {
              // Try native geo URI first, fallback to gmaps
              const geo = `geo:${latitude},${longitude}?q=${latitude},${longitude}`;
              const supported = await Linking.canOpenURL(geo);
              if (supported) await Linking.openURL(geo); else await Linking.openURL(gmapsUrl);
            }
          } catch {}
        }}
      >
        {Platform.OS === 'web' ? (
          <iframe src={osmEmbed} style={{ width: '100%', height: 160, border: 'none' }} />
        ) : (
          // WebView is not available on web platform
          <View style={{ height: 160, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }}>
            <Text style={{ fontSize: 14, color: '#666' }}>Map preview not available</Text>
            <Text style={{ fontSize: 12, color: '#999', marginTop: 4 }}>Tap to open in maps</Text>
          </View>
        )}
        <View style={[styles.mapInfoBar, { backgroundColor: isOwn ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.35)' }]}>
          <Text numberOfLines={1} style={[styles.mapTitle, isOwn ? styles.ownText : styles.otherText]}>
            {label || 'Localisation'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const DocumentCard: React.FC<{
    url: string;
    type: 'pdf' | 'document';
    isOwn: boolean;
    filename: string;
    onPress: () => void;
  }> = ({ url, type, isOwn, filename, onPress }) => {
    const [sizeLabel, setSizeLabel] = useState<string | null>(null);

    useEffect(() => {
      // Best-effort size fetch on web via HEAD request (same-origin only to avoid CORS errors)
      const fetchSize = async () => {
        if (Platform.OS !== 'web') return;
        try {
          const fileOrigin = new URL(url, window.location.href).origin;
          const appOrigin = window.location.origin;
          if (fileOrigin !== appOrigin) return; // skip cross-origin to avoid CORS console errors
          const res = await fetch(url, { method: 'HEAD' });
          const len = res.headers.get('content-length');
          if (len) {
            const bytes = parseInt(len, 10);
            if (!isNaN(bytes)) {
              const kb = bytes / 1024;
              const mb = kb / 1024;
              setSizeLabel(mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(kb))} kB`);
            }
          }
        } catch {}
      };
      fetchSize();
    }, [url]);

    return (
      <TouchableOpacity style={styles.docCardLarge} onPress={onPress} activeOpacity={0.8}>
        <View style={[styles.docPreview, { backgroundColor: isOwn ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)' }]}>
          <FileText size={40} color={isOwn ? colors.surface : colors.primary} />
        </View>
        <View style={styles.docInfoBar}>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[styles.docTitle, { color: isOwn ? colors.surface : colors.text }]}
          >
            {filename}
          </Text>
          <View style={styles.docMetaRow}>
            {sizeLabel && (
              <Text style={[styles.docMetaText, { color: isOwn ? 'rgba(255,255,255,0.8)' : colors.textSecondary }]}>
                {sizeLabel}
              </Text>
            )}
            <Text style={[styles.docMetaText, { color: isOwn ? 'rgba(255,255,255,0.8)' : colors.textSecondary }]}>
              {type.toUpperCase()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return '✓';
      case 'delivered': return '✓✓';
      case 'read': return '✓✓';
      default: return '';
    }
  };

  const [docVisible, setDocVisible] = useState(false);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [docType, setDocType] = useState<'image' | 'pdf' | 'document' | 'video' | null>(null);
  const [webBlobUrl, setWebBlobUrl] = useState<string | null>(null);

  const openDoc = (url: string, type: 'image' | 'pdf' | 'document' | 'video' = 'document') => {
    setDocUrl(url);
    setDocType(type);
    setDocVisible(true);
  };

  const closeDoc = () => {
    setDocVisible(false);
    setDocUrl(null);
    setDocType(null);
    if (Platform.OS === 'web' && webBlobUrl) {
      try { URL.revokeObjectURL(webBlobUrl); } catch {}
      setWebBlobUrl(null);
    }
  };

  // For web, when opening non-image docs, load as blob to bypass embed restrictions
  useEffect(() => {
    const loadBlob = async () => {
      if (Platform.OS !== 'web') return;
      if (!docVisible || !docUrl || !docType || docType === 'image') return;
      try {
        const res = await fetch(docUrl, { credentials: 'include' as any });
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setWebBlobUrl(url);
      } catch {
        setWebBlobUrl(null);
      }
    };
    loadBlob();
    // Cleanup on unmount or url change
    return () => {
      if (Platform.OS === 'web' && webBlobUrl) {
        try { URL.revokeObjectURL(webBlobUrl); } catch {}
        setWebBlobUrl(null);
      }
    };
  }, [docVisible, docUrl, docType]);

  const InlineVideo: React.FC<{ uri: string }> = ({ uri }) => {
    // expo-video is not supported on web, so we fallback to a different approach
    if (Platform.OS === 'web') {
      return (
        <TouchableOpacity onPress={() => openDoc(uri, 'video')}>
          <View style={[styles.mediaImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }]}>
            <Text style={{ color: 'white', fontSize: 16 }}>▶️ Video</Text>
          </View>
        </TouchableOpacity>
      );
    }
    
    try {
      const player = useVideoPlayer(uri, (player) => {
        player.loop = false;
        player.volume = 1.0;
      });
      return (
        <VideoView
          player={player}
          style={styles.mediaImage}
          nativeControls
          contentFit="contain"
        />
      );
    } catch (error) {
      // Fallback if video player fails
      return (
        <TouchableOpacity onPress={() => openDoc(uri, 'video')}>
          <View style={[styles.mediaImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }]}>
            <Text style={{ color: 'white', fontSize: 16 }}>▶️ Video</Text>
          </View>
        </TouchableOpacity>
      );
    }
  };

  const AudioPlayer: React.FC<{ uri: string; isOwn: boolean }> = ({ uri, isOwn }) => {
    const soundRef = useRef<Audio.Sound | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
      return () => {
        if (soundRef.current) {
          soundRef.current.unloadAsync().catch(() => {});
        }
      };
    }, []);

    // Web fallback: use native HTML5 audio element for reliability
    if (Platform.OS === 'web') {
      return (
        <View style={styles.audioContainer}>
          {/* @ts-ignore - web only element */}
          <audio controls src={uri} style={{ width: 200 }} />
        </View>
      );
    }

    const togglePlay = async () => {
      try {
        if (!soundRef.current) {
          setIsLoading(true);
          const { sound } = await Audio.Sound.createAsync({ uri });
          soundRef.current = sound;
          setIsLoading(false);
          await sound.playAsync();
          setIsPlaying(true);
          sound.setOnPlaybackStatusUpdate((status: any) => {
            if ('didJustFinish' in status && status.didJustFinish) {
              setIsPlaying(false);
            }
          });
        } else {
          const status = await soundRef.current.getStatusAsync();
          if ('isPlaying' in status && status.isPlaying) {
            await soundRef.current!.pauseAsync();
            setIsPlaying(false);
          } else {
            await soundRef.current!.playAsync();
            setIsPlaying(true);
          }
        }
      } catch (e) {
        Alert.alert('Audio', "Impossible de lire l'audio");
      }
    };

    return (
      <TouchableOpacity style={styles.audioContainer} onPress={togglePlay} disabled={isLoading}>
        <Volume2 size={24} color={isOwn ? colors.surface : colors.primary} />
        <Text style={[styles.audioText, isOwn ? styles.ownText : styles.otherText]}>
          {isLoading ? 'Chargement...' : isPlaying ? 'Pause' : 'Lire audio'}
        </Text>
      </TouchableOpacity>
    );
  };

  // Try to parse a location from text like "📍 Location: 34.062596, -6.792824"
  const parseLocationFromText = () => {
    if (!message.text) return null;
    const text = message.text.trim();
    const coordMatch = text.match(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/);
    if (!coordMatch) return null;
    const lat = parseFloat(coordMatch[1]);
    const lon = parseFloat(coordMatch[2]);
    if (isNaN(lat) || isNaN(lon)) return null;
    return { latitude: lat, longitude: lon, label: text.replace(/\s+/g, ' ').slice(0, 80) };
  };

  // Determine if text contains coordinates to avoid rendering raw text alongside the map
  const hasDetectedLocation = message.type !== 'location' && !!parseLocationFromText();

  const renderMediaContent = () => {
    // 1) Explicit location type takes precedence
    if (message.type === 'location' && message.latitude != null && message.longitude != null) {
      return (
        <LocationCard
          latitude={message.latitude}
          longitude={message.longitude}
          isOwn={isOwn}
          label={message.locationName || message.text}
        />
      );
    }

    // 2) Heuristic: detect coordinates in text and render map
    const detected = parseLocationFromText();
    if (detected) {
      return (
        <LocationCard
          latitude={detected.latitude}
          longitude={detected.longitude}
          isOwn={isOwn}
          label={detected.label}
        />
      );
    }

    if (!message.mediaUrl) return null;

    // Normalize to ensure server static path works when backend returns only a filename
    const normalizedPath = (() => {
      const raw = message.mediaUrl.trim();
      if (raw.startsWith('http')) return raw;
      if (raw.startsWith('/')) return raw;
      // bare filename -> serve from /uploads/<type>/<file> if type is known, else /uploads/<file>
      const t = (message.type || '').toLowerCase();
      const known = ['image','video','audio','document','pdf'];
      if (known.includes(t)) return `/uploads/${t}/${raw}`;
      return `/uploads/${raw}`;
    })();

    const fullMediaUrl = normalizedPath.startsWith('http')
      ? normalizedPath
      : `${BASE_URL}${normalizedPath}`;
    
    // Extract filename from URL
    const filename = fullMediaUrl.substring(fullMediaUrl.lastIndexOf('/') + 1);

    switch (message.type) {
      case 'image':
        return (
          <TouchableOpacity onPress={() => openDoc(fullMediaUrl, 'image')}>
            <Image 
              source={{ uri: fullMediaUrl }} 
              style={styles.mediaImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        );

      case 'video':
        return (
          <InlineVideo uri={fullMediaUrl} />
        );

      case 'audio':
        return <AudioPlayer uri={fullMediaUrl} isOwn={isOwn} />;

      case 'pdf':
      case 'document':
        return (
          <DocumentCard
            url={fullMediaUrl}
            type={message.type === 'pdf' ? 'pdf' : 'document'}
            isOwn={isOwn}
            filename={filename}
            onPress={async () => {
              const type = message.type === 'pdf' ? 'pdf' : 'document';
              if (Platform.OS === 'web') {
                try { Linking.openURL(fullMediaUrl); } catch {}
                return;
              }
              openDoc(fullMediaUrl, type);
            }}
          />
        );

      case 'location':
        // Already handled above; fallback to null
        return null;

      default:
        return (
          <TouchableOpacity 
            style={styles.documentContainer}
            onPress={async () => {
              if (Platform.OS === 'web') {
                try { Linking.openURL(fullMediaUrl); } catch {}
                return;
              }
              openDoc(fullMediaUrl, 'document');
            }}
          >
            <FileText size={24} color={isOwn ? colors.surface : colors.primary} />
            <Text style={[styles.documentText, isOwn ? styles.ownText : styles.otherText]}>
              {filename}
            </Text>
          </TouchableOpacity>
        );
    }
  };

  return (
    <View style={[
      styles.container,
      isOwn ? styles.ownContainer : styles.otherContainer
    ]}>
      <View style={[
        styles.bubble,
        isOwn ? styles.ownBubble : styles.otherBubble,
        shadows.sm
      ]}>
        {/* Contenu média */}
        {renderMediaContent()}
        
        {/* Texte du message */}
        {message.type === 'text' && !hasDetectedLocation && (
          <Text style={[
            styles.messageText,
            isOwn ? styles.ownText : styles.otherText,
            message.mediaUrl && styles.mediaMessageText
          ]}>
            {message.text}
          </Text>
        )}
        
        <View style={styles.messageInfo}>
          <Text style={[
            styles.timeText,
            isOwn ? styles.ownTimeText : styles.otherTimeText
          ]}>
            {formatTime(message.timestamp)}
          </Text>
          {isOwn && (
            <Text style={[
              styles.statusText,
              message.status === 'read' ? styles.readStatus : styles.sentStatus
            ]}>
              {getStatusIcon(message.status)}
            </Text>
          )}
        </View>
      </View>

      {/* Full-screen media viewer (image / pdf / document) */}
      <Modal visible={docVisible} animationType="slide" onRequestClose={closeDoc}>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ padding: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={async () => {
                if (!docUrl) return;
                try {
                  if (Platform.OS === 'web') {
                    Linking.openURL(docUrl);
                  } else {
                    await WebBrowser.openBrowserAsync(docUrl);
                  }
                } catch {}
              }}
              style={{ padding: spacing.sm }}
            >
              <Text style={{ color: colors.text }}>Ouvrir dans le navigateur</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={closeDoc} style={{ padding: spacing.sm }}>
              <Text style={{ color: colors.primary }}>Fermer</Text>
            </TouchableOpacity>
          </View>
          {docUrl && (
            (() => {
              // Prefer explicit type from state
              if (docType === 'image') {
                return (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Image
                      source={{ uri: docUrl }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="contain"
                    />
                  </View>
                );
              }
              if (Platform.OS === 'web') {
                // On web, use iframe for PDFs and other documents
                return (
                  <iframe src={docUrl} style={{ flex: 1, width: '100%', height: '100%', border: 'none' }} />
                );
              }
              // Native: open directly in WebView
              return (
                <WebView
                  source={{ uri: docUrl }}
                  originWhitelist={["*"]}
                  javaScriptEnabled
                  allowFileAccess
                  allowUniversalAccessFromFileURLs
                  setSupportMultipleWindows
                  startInLoadingState
                  style={{ flex: 1 }}
                />
              );
            })()
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  ownContainer: {
    alignItems: 'flex-end',
  },
  otherContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
  },
  ownBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: spacing.xs,
  },
  otherBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  ownText: {
    color: colors.surface,
  },
  otherText: {
    color: colors.text,
  },
  messageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  timeText: {
    ...typography.caption1,
  },
  ownTimeText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimeText: {
    color: colors.textSecondary,
  },
  statusText: {
    ...typography.caption1,
    marginLeft: spacing.xs,
  },
  sentStatus: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  readStatus: {
    color: colors.secondary,
  },
  mediaImage: {
    width: 200,
    height: 150,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  videoContainer: {
    position: 'relative',
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  audioText: {
    ...typography.body,
    marginLeft: spacing.sm,
  },
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  documentText: {
    ...typography.body,
    marginLeft: spacing.sm,
    flex: 1,
  },
  // Professional document card styles
  docCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: borderRadius.md,
  },
  docIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  docMeta: {
    flex: 1,
    justifyContent: 'center',
  },
  docBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  docBadgeText: {
    ...typography.caption1,
  },
  // Large document card (preview + info bar)
  docCardLarge: {
    width: 240,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    marginBottom: spacing.xs,
  },
  docPreview: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docInfoBar: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  docTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  docMetaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  docMetaText: {
    ...typography.caption1,
    marginRight: spacing.sm,
  },
  // Map location card styles
  mapCard: {
    width: 240,
    height: 160,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginBottom: spacing.xs,
  },
  mapInfoBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  mapTitle: {
    ...typography.body,
    fontWeight: '600',
  },
  mediaMessageText: {
    marginTop: 0,
  },
});
