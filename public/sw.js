self.addEventListener('push', function (event) {
  if (!event.data) return;
  const data = event.data.json();
  const title = data.title || 'Locust';
  const options = {
    body: data.body || 'Alert',
    icon: '/locus_foreground.png',
    badge: '/locus_foreground.png',
    data: data.data || {},
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
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
