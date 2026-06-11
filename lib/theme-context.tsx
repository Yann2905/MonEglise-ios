'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const LS_KEY = 'moneglise_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Toujours commencer en light (évite hydration mismatch + défaut clair)
  const [theme, setThemeState] = useState<Theme>('light');

  // Au mount : charge le choix sauvegardé (sinon reste light)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(LS_KEY) as Theme | null;
    if (saved === 'dark') {
      setThemeState('dark');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Synchronise la classe sur <html>
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    if (typeof window !== 'undefined') localStorage.setItem(LS_KEY, t);
  }, []);

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') localStorage.setItem(LS_KEY, next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
