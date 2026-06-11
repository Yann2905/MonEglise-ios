'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface ModalContextValue {
  modalOpen: boolean;
  open: () => void;
  close: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);

  const open = useCallback(() => setCount((c) => c + 1), []);
  const close = useCallback(() => setCount((c) => Math.max(0, c - 1)), []);

  return (
    <ModalContext.Provider value={{ modalOpen: count > 0, open, close }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used inside <ModalProvider>');
  return ctx;
}
