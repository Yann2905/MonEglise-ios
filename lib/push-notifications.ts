'use client';

import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { supabase } from './supabase';

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

function getApp() {
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
    if (!(await isSupported())) return { ok: false, reason: 'unsupported' };
    if (!('Notification' in window)) return { ok: false, reason: 'no-notification-api' };
    if (!VAPID_KEY) return { ok: false, reason: 'no-vapid' };

    // Permission
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return { ok: false, reason: 'denied' };

    // Service worker doit être enregistré
    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    const app = getApp();
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

    // Foreground messages : silencieux côté Notification API (sinon doublons
    // avec le service worker qui montre déjà la notif). Le Realtime Supabase
    // s'occupe de mettre à jour l'UI en temps réel (badges, listes, etc.).

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
