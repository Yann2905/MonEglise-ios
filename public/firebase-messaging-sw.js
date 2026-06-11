// Service worker Firebase Cloud Messaging
// Reçoit les notifications push quand l'app est fermée / en arrière-plan
//
// Note : Firebase ne lit pas process.env ici → on importe les SDK CDN
// avec la même config que .env.local (clés client = publiques par design).

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

// onBackgroundMessage : Firebase SDK affiche DÉJÀ la notification
// automatiquement quand le payload contient un champ `notification`.
// On n'affiche manuellement QUE pour les payloads data-only (sinon doublon).
messaging.onBackgroundMessage((payload) => {
  if (payload.notification) {
    // Firebase a déjà géré → on ne fait rien (sinon 2 notifs identiques)
    return;
  }
  const title = payload.data?.title || 'MonÉglise';
  const options = {
    body: payload.data?.message || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: payload.data?.type || 'moneglise',
    renotify: false,
    data: payload.data || {},
  };
  self.registration.showNotification(title, options);
});

// Clic sur la notif → ouvre l'app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
