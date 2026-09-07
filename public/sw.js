const CACHE_PREFIX = "yucheon-calculator-";
const CACHE_NAME = CACHE_PREFIX + "v2";
const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/yucheon-enviro-logo.png",
  "/pwa-icon-192.png",
  "/pwa-icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL.map((url) => new Request(url, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  // Next.js partial responses must never replace the cached HTML document.
  if (request.headers.has("RSC") || url.searchParams.has("_rsc")) return;

  const responseTask = (async () => {
    try {
      const response = await fetch(request, { cache: "no-store" });
      if (response.ok) {
        try {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        } catch {
          // Storage limits must not prevent the online page from loading.
        }
      }
      return response;
    } catch {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) return cached;
      if (request.mode === "navigate" && url.pathname === "/") {
        const home = await cache.match("/");
        if (home) return home;
      }
      return Response.error();
    }
  })();
  event.respondWith(responseTask);
});
