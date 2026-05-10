const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: 768,
  height: 480,
  backgroundColor: "#9acb87",
  pixelArt: true,
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
  scene: [Preload, StartScene, PlayScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

function startGame() {
  document.addEventListener("contextmenu", (event) => event.preventDefault());
  document.addEventListener(
    "touchmove",
    (event) => {
      if (event.target instanceof Element && event.target.closest(".game-shell")) {
        event.preventDefault();
      }
    },
    { passive: false },
  );

  new Phaser.Game(config);
}

if (document.readyState === "complete") {
  startGame();
} else {
  window.addEventListener("load", startGame);
}
