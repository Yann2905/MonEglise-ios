// Service worker Firebase Cloud Messaging
// - Reçoit les notifications push quand l'app est fermée / en arrière-plan
// - Incrémente la badge de l'icône PWA (App Badging API)
// - Deep-link sur clic vers la page concernée

importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyCDH4u5_DtAB9lwN_emU45Ecf90mhzsC4I',
  authDomain: 'moneglise-8c5c8.firebaseapp.com',
  projectId: 'moneglise-8c5c8',
  storageBucket: 'moneglise-8c5c8.firebasestorage.app',
  messagingSenderId: '1001792393824',
  appId: '1:1001792393824:web:72184bfb3a44aa7c542905',
});

const messaging = firebase.messaging();

// Met à jour la badge avec la valeur exacte fournie par le worker
async function setBadge(count) {
  try {
    if ('setAppBadge' in self.navigator && count > 0) {
      await self.navigator.setAppBadge(count);
    } else if ('clearAppBadge' in self.navigator && count === 0) {
      await self.navigator.clearAppBadge();
    }
  } catch (e) {
    // setAppBadge peut être absent ou non supporté → silence
  }
}

// onBackgroundMessage : DATA-ONLY (le worker envoie pas de champ
// notification au root). La SW affiche TOUJOURS manuellement.
messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const badgeCount = parseInt(data.badge_count || '1', 10);
  setBadge(badgeCount);

  const title = data.title || 'MonÉglise';
  const options = {
    body: data.message || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.type || 'moneglise',
    renotify: true,
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: data,
  };
  return self.registration.showNotification(title, options);
});

// Clic sur une notification → deep-link vers la page concernée + clear badge
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const link = data.link || data.FCM_MSG?.data?.link || '/';

  event.waitUntil(
    (async () => {
      // 1. Reset compteur SW (le client recalculera la vraie valeur ensuite)
      try {
        // @ts-ignore
        self.__badgeCount = 0;
        if ('clearAppBadge' in self.navigator) {
          // @ts-ignore
          await self.navigator.clearAppBadge();
        }
      } catch {}

      // 2. Focus une fenêtre existante OU en ouvre une nouvelle sur le link
      const clientList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      // Cherche une fenêtre déjà ouverte → naviguer dessus
      for (const client of clientList) {
        if ('focus' in client && 'navigate' in client) {
          try {
            await client.focus();
            // @ts-ignore : navigate existe sur WindowClient
            await client.navigate(link);
            return;
          } catch {
            // Si la navigation échoue (cross-origin par ex), on focus simplement
            return client.focus();
          }
        }
      }

      // Sinon ouvrir une nouvelle fenêtre
      if (self.clients.openWindow) {
        await self.clients.openWindow(link);
      }
    })()
  );
});
