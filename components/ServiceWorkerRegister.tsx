'use client';
import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;
    const timer = setTimeout(async () => {
      // Main app SW
      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch {}

      // Force update de la SW FCM si déjà enregistrée (push notifications).
      // Évite que les users restent sur une vieille SW pendant 24h+ qui
      // a un bug d'affichage des notifs. iOS et Android Chrome cachent
      // les SW sinon.
      try {
        const fcmReg = await navigator.serviceWorker.getRegistration(
          '/firebase-messaging-sw.js'
        );
        if (fcmReg) await fcmReg.update();
      } catch {}
    }, 1500);
    return () => clearTimeout(timer);
  }, []);
  return null;
}
