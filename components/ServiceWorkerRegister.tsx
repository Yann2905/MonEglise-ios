'use client';
import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;

    const updateFcmSw = async () => {
      try {
        // 1. Si la SW est deja enregistree, force un update
        let fcmReg = await navigator.serviceWorker.getRegistration(
          '/firebase-messaging-sw.js'
        );
        if (fcmReg) {
          await fcmReg.update();
          // 2. Si une nouvelle version est en attente, force-la a prendre la main
          if (fcmReg.waiting) {
            fcmReg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          // 3. Si une nouvelle version est en cours d'installation, idem
          if (fcmReg.installing) {
            fcmReg.installing.addEventListener('statechange', (e: any) => {
              if (e.target?.state === 'installed') {
                e.target.postMessage?.({ type: 'SKIP_WAITING' });
              }
            });
          }
        } else {
          // Pas encore enregistree -> on l'enregistre (utile si user a active
          // les notifs sur une autre device et son nouveau device n'a pas
          // encore appele subscribePush)
          fcmReg = await navigator.serviceWorker.register(
            '/firebase-messaging-sw.js',
            { updateViaCache: 'none' }
          );
        }
      } catch {}
    };

    const timer = setTimeout(async () => {
      // Main app SW (offline caching)
      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch {}

      // SW FCM (push notifications) avec force-update
      await updateFcmSw();

      // 4. Si la SW controle deja la page mais une nouvelle version est
      // active maintenant, on reload pour que tout le SW soit a jour.
      // Detection : controllerchange event
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Une nouvelle SW vient de prendre la main → on reload silencieusement
        // pour s'assurer que tout le code utilise la nouvelle SW
        console.log('[SW] new version activated, reloading...');
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, []);
  return null;
}
