'use client';

import { supabase } from './supabase';

// Firebase SDK est lazy-loadé uniquement quand subscribePush() est appelé
// → économise ~150 KB dans le bundle initial pour 99% des utilisateurs
// qui n'activent pas les notifications.

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

async function getApp() {
  const { initializeApp, getApps } = await import('firebase/app');
  if (getApps().length > 0) return getApps()[0];
  return initializeApp(config);
}

/**
 * Demande la permission, récupère le FCM token, et l'enregistre dans device_tokens.
 * Doit être appelé après un user gesture (clic bouton).
 */
export async function subscribePush(userId: string): Promise<{ ok: boolean; reason?: string }> {
  try {
    if (typeof window === 'undefined') return { ok: false, reason: 'not-browser' };
    // Lazy-import Firebase Messaging seulement maintenant
    const { getMessaging, getToken, isSupported } = await import('firebase/messaging');
    if (!(await isSupported())) return { ok: false, reason: 'unsupported' };
    if (!('Notification' in window)) return { ok: false, reason: 'no-notification-api' };
    if (!VAPID_KEY) return { ok: false, reason: 'no-vapid' };

    // Permission
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return { ok: false, reason: 'denied' };

    // Service worker doit être enregistré.
    // updateViaCache: 'none' force le browser à toujours fetcher la dernière
    // version au lieu d'utiliser le cache HTTP → fix iOS/Android qui gardent
    // une SW obsolète pendant 24h+.
    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      updateViaCache: 'none',
    });
    // Force un check de mise à jour à chaque appel pour récupérer les fix SW
    try {
      await reg.update();
    } catch {}

    const app = await getApp();
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: reg,
    });

    if (!token) return { ok: false, reason: 'no-token' };

    // Enregistre / update dans Supabase
    await supabase
      .from('device_tokens')
      .upsert(
        {
          user_id: userId,
          token,
          platform: 'web',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'token' }
      );

    // Foreground messages : iOS/Android SUPPRIMENT le banner systeme
    // quand l'app est ouverte (par design OS). On affiche manuellement
    // une notification via l'API Notification pour qu'on voie le
    // banner meme quand on est dans l'app.
    try {
      const { onMessage } = await import('firebase/messaging');
      onMessage(messaging, (payload) => {
        const data = (payload.data as Record<string, string>) || {};
        if (Notification.permission !== 'granted') return;
        const title = data.title || 'MonÉglise';
        const body = data.message || '';
        // showNotification via le registration SW pour avoir la meme
        // experience (tag unique, badge, icone, son via SW)
        reg.showNotification(title, {
          body,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          tag: data.notif_id || `moneglise-${Date.now()}`,
          renotify: true,
          requireInteraction: false,
          data,
        });
      });
    } catch {}

    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: e.message };
  }
}

/** Désinscription locale (le token reste en DB ; on supprime juste l'enregistrement service worker) */
export async function unsubscribePush(): Promise<void> {
  try {
    if (typeof window === 'undefined') return;
    const reg = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    if (reg) await reg.unregister();
  } catch {}
}
