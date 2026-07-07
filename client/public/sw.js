// Service Worker — handles incoming Web Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data = {};
  try { data = event.data.json(); } catch (e) { data = { title: 'New Offer Nearby!', body: event.data.text() }; }

  const { title, body, image, url } = data;

  event.waitUntil(
    self.registration.showNotification(title || 'WOW Lifestyle', {
      body:    body    || 'A new offer is available near you!',
      icon:    '/favicon.ico',
      image:   image   || null,
      badge:   '/favicon.ico',
      data:    { url: url || '/nearby' },
      vibrate: [200, 100, 200],
      actions: [
        { action: 'view',    title: 'View Offer' },
        { action: 'dismiss', title: 'Dismiss'    }
      ]
    })
  );
});

// Notification click — open the offer page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/nearby';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// Keep service worker active
self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
