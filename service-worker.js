// Minimal service worker — just enough for "Add to Home Screen" installability and a basic
// offline-loads-the-shell experience. The actual submit still needs a live connection (it
// posts straight to the Apps Script endpoint); this only caches the static form itself.
// BUMP THIS EVERY TIME index.html CHANGES. The fetch handler below is cache-first
// (`cached || fetch`), so an installed phone serves the cached copy forever and never notices a
// new deploy. Changing the cache name is what makes `activate` delete the old one and refetch.
// v9 (2026-08-25): "Whose money?" on CE8866, the Money-in mode, and Rejig on both BUY and SELL.
// v10 (2026-08-26): the Wint-coupon picker.
// v11 (2026-08-27): the picker's data comes from the Apps Script, not a cached file. sleeves.json
//   was briefly in this list, which would have 404'd on the Pages host -- and worse, would have
//   required publishing the family's coupon schedule to a PUBLIC repo to work at all. The list is
//   financial data; it travels over the token-checked endpoint and is cached in localStorage.
const CACHE = "log-trade-v11";
const SHELL = ["./", "./index.html", "./manifest.json", "./icon.svg"];

// Nothing here needs freshness any more: the only thing that goes stale by design -- the list of
// coupons still to be logged -- is now fetched from the Apps Script on every load, not served as
// a file. The shell is cache-first; it changes only when the app is redeployed.
const FRESH_FIRST = [];

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
  const url = new URL(event.request.url);
  if (FRESH_FIRST.some((name) => url.pathname.endsWith(name))) {
    event.respondWith(
      fetch(event.request)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(event.request, copy));
          return resp;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
