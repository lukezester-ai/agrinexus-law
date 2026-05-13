const CACHE_NAME = "agrinexus-pwa-v3";
const APP_SHELL = ["/", "/manifest.webmanifest", "/icon.svg", "/icon-192", "/icon-512"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // Шрифтове за PDF: без SW кеш/логика — избягва грешни отговори и опростява зареждането.
  try {
    const u = new URL(event.request.url);
    if (u.pathname.startsWith("/fonts/")) {
      event.respondWith(fetch(event.request));
      return;
    }
  } catch {
    /* ignore */
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
            return networkResponse;
          }

          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return networkResponse;
        })
        .catch(() => {
          // Не подменяй шрифтове/API с HTML от „/“ — това чупи pdf-lib (изглежда като мрежа/шрифт).
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }
          return Response.error();
        });
    }),
  );
});
