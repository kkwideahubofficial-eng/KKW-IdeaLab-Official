// Self-destructing service worker to clean up the old manual registration
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.registration.unregister().then(() => {
      console.log('Old service worker unregistered.');
      return self.clients.matchAll();
    }).then((clients) => {
      // Reload the page to let the new Vite PWA service worker take control
      clients.forEach((client) => {
        if (client.url && 'navigate' in client) {
          client.navigate(client.url);
        }
      });
    })
  );
});
