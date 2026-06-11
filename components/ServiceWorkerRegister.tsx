'use client';
import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;
    const timer = setTimeout(() => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }, 1500);
    return () => clearTimeout(timer);
  }, []);
  return null;
}
