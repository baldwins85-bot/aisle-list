// Minimal, conservative service worker for offline app-shell support.
// - Navigations: network-first, fall back to cached shell when offline.
// - Next static assets (immutable, hashed): cache-first.
// - Everything else (API, Clerk, cross-origin): left to the network.
const CACHE = "aisle-list-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // don't touch Clerk/etc.
  if (url.pathname.startsWith("/api/")) return; // always live

  // Immutable hashed assets: cache-first.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      })
    );
    return;
  }

  // Page navigations: network-first, cache fallback for offline.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(request);
          const cache = await caches.open(CACHE);
          cache.put(request, res.clone());
          return res;
        } catch {
          const cache = await caches.open(CACHE);
          const cached = await cache.match(request);
          return cached || cache.match("/") || Response.error();
        }
      })()
    );
  }
});
