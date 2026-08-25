// Minimal service worker — just enough for "Add to Home Screen" installability and a basic
// offline-loads-the-shell experience. The actual submit still needs a live connection (it
// posts straight to the Apps Script endpoint); this only caches the static form itself.
// BUMP THIS EVERY TIME index.html CHANGES. The fetch handler below is cache-first
// (`cached || fetch`), so an installed phone serves the cached copy forever and never notices a
// new deploy. Changing the cache name is what makes `activate` delete the old one and refetch.
// v9 (2026-08-25): "Whose money?" on CE8866, the Money-in mode, and Rejig on both BUY and SELL.
const CACHE = "log-trade-v9";
const SHELL = ["./", "./index.html", "./manifest.json", "./icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;   // never cache POSTs to the Apps Script endpoint
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
