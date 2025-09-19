import { User, Conversation, Contact, Message } from '@/types';

export const currentUser: User = {
  id: '1',
  name: 'John Doe',
  email: 'john.doe@email.com',
  avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
  status: 'Disponible pour discuter 💬',
  isOnline: true,
};

export const mockMessages: Message[] = [
  {
    id: '1',
    text: 'Salut ! Comment ça va ?',
    senderId: '2',
    timestamp: new Date(Date.now() - 3600000),
    status: 'read',
    type: 'text',
  },
  {
    id: '2',
    text: 'Ça va super bien ! Et toi ?',
    senderId: '1',
    timestamp: new Date(Date.now() - 3000000),
    status: 'read',
    type: 'text',
  },
  {
    id: '3',
    text: 'Très bien aussi ! Tu es libre pour déjeuner demain ?',
    senderId: '2',
    timestamp: new Date(Date.now() - 1800000),
    status: 'read',
    type: 'text',
  },
  {
    id: '4',
    text: 'Oui parfait ! Où veux-tu qu\'on se retrouve ?',
    senderId: '1',
    timestamp: new Date(Date.now() - 900000),
    status: 'delivered',
    type: 'text',
  },
];

export const mockConversations: Conversation[] = [
  {
    id: '1',
    name: 'Marie Dupont',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    lastMessage: 'Oui parfait ! Où veux-tu qu\'on se retrouve ?',
    lastMessageTime: new Date(Date.now() - 900000),
    unreadCount: 0,
    isOnline: true,
    isTyping: false,
    messages: mockMessages,
  },
  {
    id: '2',
    name: 'Paul Martin',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    lastMessage: 'Super ! À bientôt 👋',
    lastMessageTime: new Date(Date.now() - 7200000),
    unreadCount: 2,
    isOnline: false,
    isTyping: false,
    messages: [],
  },
  {
    id: '3',
    name: 'Équipe Design',
    avatar: 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    lastMessage: 'La nouvelle maquette est prête',
    lastMessageTime: new Date(Date.now() - 14400000),
    unreadCount: 5,
    isOnline: true,
    isTyping: true,
    messages: [],
  },
  {
    id: '4',
    name: 'Sophie Bernard',
    avatar: 'https://images.pexels.com/photos/762020/pexels-photo-762020.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    lastMessage: 'Merci pour ton aide !',
    lastMessageTime: new Date(Date.now() - 28800000),
    unreadCount: 0,
    isOnline: false,
    isTyping: false,
    messages: [],
  },
];

export const mockContacts: Contact[] = [
  {
    id: '2',
    name: 'Marie Dupont',
    email: 'marie.dupont@email.com',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    isOnline: true,
  },
  {
    id: '3',
    name: 'Paul Martin',
    email: 'paul.martin@email.com',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    isOnline: false,
  },
  {
    id: '4',
    name: 'Sophie Bernard',
    email: 'sophie.bernard@email.com',
    avatar: 'https://images.pexels.com/photos/762020/pexels-photo-762020.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    isOnline: false,
  },
  {
    id: '5',
    name: 'Lucas Petit',
    email: 'lucas.petit@email.com',
    avatar: 'https://images.pexels.com/photos/1212984/pexels-photo-1212984.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    isOnline: true,
  },
];