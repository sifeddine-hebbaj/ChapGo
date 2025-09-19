import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface ActiveConversationContextValue {
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
}

const ActiveConversationContext = createContext<ActiveConversationContextValue | undefined>(undefined);

export const ActiveConversationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeConversationId, setActiveConversationIdState] = useState<string | null>(null);

  const setActiveConversationId = useCallback((id: string | null) => {
    setActiveConversationIdState(id);
  }, []);

  const value = useMemo(() => ({ activeConversationId, setActiveConversationId }), [activeConversationId, setActiveConversationId]);

  return (
    <ActiveConversationContext.Provider value={value}>
      {children}
    </ActiveConversationContext.Provider>
  );
};

export function useActiveConversation() {
  const ctx = useContext(ActiveConversationContext);
  if (!ctx) throw new Error('useActiveConversation must be used within ActiveConversationProvider');
  return ctx;
}
