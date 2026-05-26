import Preload from "./scenes/Preload.js";
import StartScene from "./scenes/StartScene.js";
import PrologueScene from "./scenes/PrologueScene.js?v=2";
import PlayScene from "./scenes/PlayScene.js";

const BASE_GAME_WIDTH = 768;
const BASE_GAME_HEIGHT = 480;
const BASE_GAME_RATIO = BASE_GAME_WIDTH / BASE_GAME_HEIGHT;
const MOBILE_LANDSCAPE_MIN_WIDTH = 900;
const MOBILE_LANDSCAPE_MAX_WIDTH = 1120;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function isTouchDevice() {
  return navigator.maxTouchPoints > 0 || window.matchMedia?.("(pointer: coarse)")?.matches;
}

function getResponsiveGameSize() {
  const viewport = window.visualViewport;
  const viewportWidth = Math.max(Math.round(viewport?.width || window.innerWidth || BASE_GAME_WIDTH), 320);
  const viewportHeight = Math.max(Math.round(viewport?.height || window.innerHeight || BASE_GAME_HEIGHT), 240);
  const viewportRatio = viewportWidth / viewportHeight;

  if (isTouchDevice()) {
    if (viewportRatio > 1.35) {
      return {
        width: clamp(Math.round(BASE_GAME_HEIGHT * viewportRatio), MOBILE_LANDSCAPE_MIN_WIDTH, MOBILE_LANDSCAPE_MAX_WIDTH),
        height: BASE_GAME_HEIGHT,
      };
    }

    return {
      width: BASE_GAME_WIDTH,
      height: BASE_GAME_HEIGHT,
    };
  }

  if (viewportRatio >= BASE_GAME_RATIO) {
    return {
      width: Math.round(BASE_GAME_HEIGHT * viewportRatio),
      height: BASE_GAME_HEIGHT,
    };
  }

  return {
    width: BASE_GAME_WIDTH,
    height: Math.round(BASE_GAME_WIDTH / viewportRatio),
  };
}

const initialGameSize = getResponsiveGameSize();

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: initialGameSize.width,
  height: initialGameSize.height,
  backgroundColor: "#9acb87",
  pixelArt: true,
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
  scene: [Preload, StartScene, PrologueScene, PlayScene],
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

  const game = new Phaser.Game(config);
  const prologueSkipButton = document.querySelector("#prologueSkipButton");
  const syncPrologueSkipButton = () => {
    if (!prologueSkipButton) return;
    prologueSkipButton.hidden = !document.body.classList.contains("prologue-scene-active");
  };

  if (prologueSkipButton) {
    prologueSkipButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const prologueScene = game.scene.getScene("PrologueScene");
      if (prologueScene?.skipPrologue) {
        prologueScene.skipPrologue();
        return;
      }

      prologueSkipButton.hidden = true;
      game.scene.stop("PrologueScene");
      game.scene.start("PlayScene");
    });
    new MutationObserver(syncPrologueSkipButton).observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });
    syncPrologueSkipButton();
  }

  window.addEventListener("resize", () => {
    const nextSize = getResponsiveGameSize();
    game.scale.resize(nextSize.width, nextSize.height);
  });
  window.addEventListener("orientationchange", () => {
    window.setTimeout(() => {
      const nextSize = getResponsiveGameSize();
      game.scale.resize(nextSize.width, nextSize.height);
    }, 120);
  });
  window.visualViewport?.addEventListener("resize", () => {
    const nextSize = getResponsiveGameSize();
    game.scale.resize(nextSize.width, nextSize.height);
  });
}

if (document.readyState === "complete") {
  startGame();
} else {
  window.addEventListener("load", startGame);
}
