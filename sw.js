const CACHE_NAME = "cleaning-samgakji-v20260510-12";

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./styles.css?v=36",
  "./manifest.webmanifest",
  "./vendor/phaser.min.js",
  "./src/pwa.js?v=1",
  "./src/main.js?v=27",
  "./src/scenes/Preload.js?v=34",
  "./src/scenes/StartScene.js?v=1",
  "./src/scenes/PlayScene.js?v=34",
  "./assets/maps/chapter1-samgakji-map.json",
  "./assets/tilesets/samgakji-tiles.png",
  "./assets/sprites/player.png",
  "./assets/sprites/trash-slime.png",
  "./assets/sprites/trash-can.png",
  "./assets/sprites/sangcheori-npc.png",
  "./assets/sprites/broom.png",
  "./assets/sprites/flower.png",
  "./assets/ui/broom-button.png",
  "./assets/ui/sangcheori-button.png",
  "./assets/audio/thanks.mp3",
  "./assets/audio/collect-cans.mp3",
  "./assets/audio/i-will-help.mp3",
  "./assets/audio/clear-slime.mp3",
  "./assets/audio/chapter1.mp3",
  "./assets/icons/icon-180.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/maskable-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
    }),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html")),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(request).then((response) => {
        if (response.ok && new URL(request.url).origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
