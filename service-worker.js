// Minimal service worker — just enough for "Add to Home Screen" installability and a basic
// offline-loads-the-shell experience. The actual submit still needs a live connection (it
// posts straight to the Apps Script endpoint); this only caches the static form itself.
const CACHE = "log-trade-v7";
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
