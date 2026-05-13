const CACHE_NAME = "agrinexus-pwa-v4";

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => cache.add("/")),
      self.skipWaiting(),
    ]),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

function cacheableAssetPath(pathname) {
  return (
    pathname === "/manifest.webmanifest" ||
    pathname.startsWith("/icon") ||
    pathname === "/icon.svg"
  );
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  let url;
  try {
    url = new URL(event.request.url);
  } catch {
    return;
  }

  // Шрифт: директно от мрежата, без SW кеш.
  if (url.pathname.startsWith("/fonts/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // HTML навигация: винаги мрежа първо — иначе след деплой остава стар bundle („няма промяна“).
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((res) => res)
        .catch(() => caches.match("/")),
    );
    return;
  }

  // Само икони/manifest: кеш по желание; всичко друго (вкл. /_next/) — без кеш от този SW.
  if (!cacheableAssetPath(url.pathname)) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.ok && networkResponse.type === "basic") {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      });
    }),
  );
});
