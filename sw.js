const CACHE_NAME = "cleaning-samgakji-v20260519-04";

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./styles.css?v=61",
  "./manifest.webmanifest",
  "./vendor/phaser.min.js",
  "./src/pwa.js?v=3",
  "./src/main.js?v=34",
  "./src/main.js",
  "./src/scenes/Preload.js",
  "./src/scenes/StartScene.js",
  "./src/scenes/PrologueScene.js",
  "./src/scenes/PrologueScene.js?v=2",
  "./src/scenes/PlayScene.js",
  "./src/controllers/PlayerController.js",
  "./src/config/GameConstants.js",
  "./src/config/SceneState.js",
  "./src/systems/DialogueSystem.js",
  "./src/systems/CleaningSystem.js",
  "./src/systems/InteractionSystem.js",
  "./src/systems/MoneySystem.js",
  "./src/systems/PortraitManager.js",
  "./src/systems/QuestManager.js",
  "./src/systems/SlimeSystem.js",
  "./src/systems/UIManager.js",
  "./src/utils/distance.js",
  "./assets/maps/chapter1-samgakji-map.json",
  "./assets/tilesets/samgakji-tiles.png",
  "./assets/sprites/player.png",
  "./assets/sprites/playerleft.png",
  "./assets/sprites/playerright.png",
  "./assets/sprites/playerback.png",
  "./assets/sprites/haenaem-walk-down-new.png",
  "./assets/sprites/haenaem-walk-up-new.png",
  "./assets/sprites/haenaem-walk-left-new.png",
  "./assets/sprites/haenaem-walk-right-new.png",
  "./assets/sprites/trash-slime.png",
  "./assets/sprites/trash-slime2.png",
  "./assets/sprites/trash-can.png",
  "./assets/sprites/trash-can2.png",
  "./assets/sprites/trash-can3.png",
  "./assets/sprites/plastic.png",
  "./assets/sprites/yebi-npc.png",
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
  "./assets/portraits/jjook-default.png",
  "./assets/portraits/jjook-wallet-lost.png",
  "./assets/portraits/jjook-wallet-found.png",
  "./assets/portraits/jjook-smile.png",
  "./assets/portraits/jjook-expectant.png",
  "./assets/portraits/jjook-playful.png",
  "./assets/portraits/jjook-plogging.png",
  "./assets/portraits/haenaem-default.png",
  "./assets/portraits/haenaem-confused.png",
  "./assets/portraits/haenaem-touched.png",
  "./assets/portraits/haenaem-determined.png",
  "./assets/portraits/haenaem-surprised.png",
  "./assets/portraits/haenaem-phone.png",
  "./assets/portraits/haenaem-sleepy-phone.png",
  "./assets/portraits/haenaem-sweat.png",
  "./assets/portraits/haenaem-dazed.png",
  "./assets/portraits/mother-calm.png",
  "./assets/portraits/mother-smile.png",
  "./assets/portraits/mother-worried.png",
  "./assets/portraits/yeobi-default.png",
  "./assets/portraits/hospital-doctor.png",
  "./assets/portraits/hospital-staff.png",
  "./assets/portraits/pharmacist.png",
  "./assets/portraits/sunisuni-sick.png",
  "./assets/portraits/sunisuni-smile.png",
  "./assets/portraits/sunisuni-worried.png",
  "./assets/objects/sunisuni_portrait.png",
  "./assets/objects/sunisuni_full.png",
  "./assets/objects/sunisuni-bench.png",
  "./assets/objects/sunisuni-tree.png",
  "./assets/objects/prescription.png",
  "./assets/objects/medicine_bag.png",
  "./assets/objects/bill-5000.png",
  "./assets/backgrounds/prologue-room-messy.png",
  "./assets/backgrounds/prologue-room-window.png",
  "./assets/backgrounds/prologue-desk.png",
  "./assets/backgrounds/prologue-travel.png",
  "./assets/backgrounds/prologue-entrance.png",
  "./assets/ui/broom-button.png",
  "./assets/ui/yebi-button.png",
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
  "./assets/audio/prologue-room.wav",
  "./assets/audio/prologue-summer.wav",
  "./assets/audio/prologue-park.wav",
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
