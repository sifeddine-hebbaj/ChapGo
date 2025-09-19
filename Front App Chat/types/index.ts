export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  avatar?: string;
  photoUrl?: string;
  status: string;
  isOnline: boolean;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'pdf' | 'location';
  mediaUrl?: string;
  // Optional location payload for 'location' type messages
  latitude?: number;
  longitude?: number;
  locationName?: string;
}

export interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
  isTyping: boolean;
  messages: Message[];
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isOnline: boolean;
}