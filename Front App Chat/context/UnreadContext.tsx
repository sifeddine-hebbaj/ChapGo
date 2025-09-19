import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface UnreadMap { [conversationId: string]: number }

interface UnreadContextValue {
  get: (conversationId: string) => number;
  all: UnreadMap;
  increment: (conversationId: string, by?: number) => void;
  set: (conversationId: string, count: number) => void;
  clear: (conversationId: string) => void;
  clearAll: () => void;
}

const UnreadContext = createContext<UnreadContextValue | undefined>(undefined);

export const UnreadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [map, setMap] = useState<UnreadMap>({});

  const get = useCallback((id: string) => map[id] ?? 0, [map]);

  const increment = useCallback((id: string, by: number = 1) => {
    setMap(prev => ({ ...prev, [id]: (prev[id] ?? 0) + by }));
  }, []);

  const set = useCallback((id: string, count: number) => {
    setMap(prev => ({ ...prev, [id]: Math.max(0, count) }));
  }, []);

  const clear = useCallback((id: string) => {
    setMap(prev => {
      if (!(id in prev)) return prev;
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }, []);

  const clearAll = useCallback(() => setMap({}), []);

  const value = useMemo(() => ({ get, all: map, increment, set, clear, clearAll }), [get, map, increment, set, clear, clearAll]);

  return (
    <UnreadContext.Provider value={value}>{children}</UnreadContext.Provider>
  );
};

export function useUnread() {
  const ctx = useContext(UnreadContext);
  if (!ctx) throw new Error('useUnread must be used within UnreadProvider');
  return ctx;
}
