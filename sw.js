// Service worker: makes Playpro installable and load fast / offline.
// Bump VERSION when you want every phone to drop its old cached copy.
const VERSION = "playpro-v4";
const SHELL = [
  "./",
  "index.html",
  "css/styles.css",
  "manifest.webmanifest",
  "icons/icon.svg",
  "js/vendor/supabase.js",
  "fonts/anybody.woff2",
  "fonts/familjen-grotesk.woff2",
];
const IMAGES = "playpro-images"; // posters; TMDB answers live in "playpro-tmdb-…" (js/lib/tmdb.js)
const MAX_IMAGES = 400;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== IMAGES && !k.startsWith("playpro-tmdb")).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function trimImages() {
  const cache = await caches.open(IMAGES);
  const keys = await cache.keys();
  for (const key of keys.slice(0, Math.max(0, keys.length - MAX_IMAGES))) await cache.delete(key);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Posters and logos: cache first (they never change).
  if (url.hostname === "image.tmdb.org") {
    event.respondWith(
      caches.open(IMAGES).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok || res.type === "opaque") {
          cache.put(req, res.clone());
          trimImages();
        }
        return res;
      }),
    );
    return;
  }

  // The app's own files: always ask the server for the newest version
  // ("no-cache" skips the browser's 10-minute copy), falling back to the
  // cached copy only when offline.
  if (url.origin === self.location.origin) {
    const fresh = req.mode === "navigate"
      ? new Request(req.url, { cache: "no-cache", credentials: "same-origin" })
      : new Request(req, { cache: "no-cache" });
    event.respondWith(
      fetch(fresh)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match("index.html"))),
    );
  }
  // Everything else (Supabase, TMDB API, OMDb) goes straight to the network.
});
