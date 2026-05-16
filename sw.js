const CACHE_NAME = "cleaning-samgakji-v20260516-15";

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./styles.css?v=57",
  "./manifest.webmanifest",
  "./vendor/phaser.min.js",
  "./src/pwa.js?v=2",
  "./src/main.js?v=31",
  "./src/scenes/Preload.js?v=40",
  "./src/scenes/StartScene.js?v=2",
  "./src/systems/DialogueSystem.js?v=7",
  "./src/systems/MoneySystem.js?v=3",
  "./src/systems/QuestManager.js?v=8",
  "./src/scenes/PlayScene.js?v=76",
  "./assets/maps/chapter1-samgakji-map.json",
  "./assets/tilesets/samgakji-tiles.png",
  "./assets/sprites/player.png",
  "./assets/sprites/playerleft.png",
  "./assets/sprites/playerright.png",
  "./assets/sprites/playerback.png",
  "./assets/sprites/trash-slime.png",
  "./assets/sprites/trash-slime2.png",
  "./assets/sprites/trash-can.png",
  "./assets/sprites/trash-can2.png",
  "./assets/sprites/trash-can3.png",
  "./assets/sprites/plastic.png",
  "./assets/sprites/sangcheori-npc.png",
  "./assets/sprites/broom.png",
  "./assets/sprites/flower.png",
  "./assets/sprites/sunisuni-front.png",
  "./assets/sprites/sunisuni-back.png",
  "./assets/sprites/sunisuni-left.png",
  "./assets/sprites/sunisuni-right.png",
  "./assets/sprites/sunisuni-sick.png",
  "./assets/sprites/sunisuni-recovered.png",
  "./assets/sprites/sweat-effect.png",
  "./assets/sprites/star-effect.png",
  "./assets/sprites/heart-effect.png",
  "./assets/objects/normal.png",
  "./assets/objects/can.png",
  "./assets/objects/plastic.png",
  "./assets/objects/recycling center.png",
  "./assets/objects/vending machine.png",
  "./assets/objects/jjookf.png",
  "./assets/objects/jjookface.png",
  "./assets/objects/vms.png",
  "./assets/objects/vmmenu.png",
  "./assets/objects/wallet.png",
  "./assets/objects/cola.png",
  "./assets/objects/cider.png",
  "./assets/objects/water.png",
  "./assets/objects/1000won.png",
  "./assets/objects/acceleration.png",
  "./assets/objects/hospital-building.png",
  "./assets/objects/pharmacy-building.png",
  "./assets/objects/hospital-interior.png",
  "./assets/objects/pharmacy-interior.png",
  "./assets/objects/hospital-doctor.png",
  "./assets/objects/hospital-staff.png",
  "./assets/objects/chemist.png",
  "./assets/objects/sunisuni-portrait-sick.png",
  "./assets/objects/sunisuni_portrait.png",
  "./assets/objects/sunisuni_full.png",
  "./assets/objects/sunisuni-bench.png",
  "./assets/objects/sunisuni-tree.png",
  "./assets/objects/prescription.png",
  "./assets/objects/medicine-bag.png",
  "./assets/objects/bill-5000.png",
  "./assets/ui/broom-button.png",
  "./assets/ui/sangcheori-button.png",
  "./assets/ui/10000won.png",
  "./assets/ui/1000won.png",
  "./assets/ui/500WON.png",
  "./assets/ui/100WON.png",
  "./assets/ui/trash.png",
  "./assets/ui/plastic.png",
  "./assets/ui/trash-can.png",
  "./assets/ui/bacchus.png",
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
