import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { router } from 'expo-router';

export type InAppNotification = {
  id: string;
  title: string;
  body: string;
  senderName?: string;
  conversationId?: string;
  conversationName?: string;
  timestamp?: Date;
  onPress?: () => void;
};

interface NotificationContextValue {
  notification: InAppNotification | null;
  showNotification: (n: Omit<InAppNotification, 'id'>) => void;
  hideNotification: () => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }>= ({ children }) => {
  const [notification, setNotification] = useState<InAppNotification | null>(null);

  const hideNotification = useCallback(() => setNotification(null), []);

  const showNotification = useCallback((n: Omit<InAppNotification, 'id'>) => {
    const id = Date.now().toString();
    setNotification({ id, ...n });
  }, []);

  const value = useMemo(() => ({ notification, showNotification, hideNotification }), [notification, showNotification, hideNotification]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}
