// MonÉglise — Service Worker pour Web Push (FCM via VAPID)
// VERSION : 2026-06-30-v2
//
// Note : on n'utilise PLUS le SDK Firebase dans la SW. On gère le
// push event directement → fonctionne sur iOS PWA + Android PWA
// sans dépendance de runtime, et plus aucun risque d'early-return
// du SDK. Le Firebase SDK reste utilisé dans la PAGE pour récupérer
// le FCM token (lib/push-notifications.ts).

// Force la nouvelle SW à prendre la main immédiatement
self.addEventListener('install', () => {
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

async function setBadge(count) {
  try {
    if ('setAppBadge' in self.navigator && count > 0) {
      await self.navigator.setAppBadge(count);
    } else if ('clearAppBadge' in self.navigator && count === 0) {
      await self.navigator.clearAppBadge();
    }
  } catch (e) {
    // setAppBadge non supporté → silence
  }
}

// Gestionnaire principal : déclenché par CHAQUE push FCM reçu
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    // Fallback texte si le JSON n'est pas parseable
    payload = { data: { title: 'MonÉglise', message: event.data.text() } };
  }

  // FCM envoie soit data-only soit {notification, data}
  // On supporte les deux pour robustesse
  const data = payload.data || {};
  const notif = payload.notification || {};

  const title = data.title || notif.title || 'MonÉglise';
  const body = data.message || notif.body || '';
  const badgeCount = parseInt(data.badge_count || '1', 10);

  // Tag UNIQUE = notif_id ou timestamp → chaque notif fait son banner + son
  const tag = data.notif_id || `moneglise-${Date.now()}`;

  event.waitUntil(
    Promise.all([
      setBadge(badgeCount),
      self.registration.showNotification(title, {
        body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag,
        renotify: true,
        requireInteraction: false,
        vibrate: [200, 100, 200],
        silent: false,
        data,
      }),
    ])
  );
});

// Clic sur une notification → deep-link vers la page concernée + clear badge
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const link = data.link || data.FCM_MSG?.data?.link || '/';

  event.waitUntil(
    (async () => {
      // Reset badge (le client recalculera la vraie valeur)
      try {
        if ('clearAppBadge' in self.navigator) {
          await self.navigator.clearAppBadge();
        }
      } catch {}

      // Focus une fenêtre existante OU en ouvre une nouvelle
      const clientList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      for (const client of clientList) {
        if ('focus' in client && 'navigate' in client) {
          try {
            await client.focus();
            await client.navigate(link);
            return;
          } catch {
            return client.focus();
          }
        }
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(link);
      }
    })()
  );
});
