export default class SceneControlSystem {
  constructor(scene) {
    this.scene = scene;
    this.worldInputBlocked = false;
  }

  blockWorldInput(blocked = true) {
    this.worldInputBlocked = Boolean(blocked);
    if (this.worldInputBlocked) {
      this.scene.playerController?.cancelMoveTarget?.();
      this.scene.educationalGuideSystem?.hideWorldIcons?.();
    }
  }

  isWorldInputBlocked() {
    const scene = this.scene;
    return Boolean(
      this.worldInputBlocked
      || scene.isMissionComplete
      || scene.isInDialogue
      || scene.vendingMenuGroup
      || scene.clothingShopModal
      || scene.packingModal
      || scene.interiorSceneGroup
      || this.hasOpenDomOverlay()
      || (scene.stateManager && !scene.stateManager.canInteract()),
    );
  }

  hasOpenDomOverlay() {
    return [
      "#settingsModal",
      "#edu-notes-modal",
      "#edu-guide-modal",
      ".rest-stats-modal.is-visible",
      ".name-tag-modal",
      ".clothing-shop-modal",
      ".packing-modal",
      ".samgakji-levelup-modal.is-visible",
    ].some((selector) => this.isVisibleElement(document.querySelector(selector)));
  }

  isVisibleElement(element) {
    if (!element) return false;
    if (element.hidden || element.getAttribute("aria-hidden") === "true") return false;
    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
  }

  restartGame() {
    const scene = this.scene;
    scene.completeOverlay?.classList.remove("is-visible");
    scene.completeOverlay?.setAttribute("aria-hidden", "true");
    scene.restartButton?.removeEventListener("click", scene.restartHandler);
    scene.scene.restart();
  }

  toggleFullscreen(event) {
    event?.preventDefault();

    const target = document.querySelector(".game-shell") || document.documentElement;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
      document.body.classList.remove("app-fit-mode");
      this.unlockScreenOrientation();
      return;
    }

    if (target.requestFullscreen) {
      target
        .requestFullscreen()
        .then(() => this.lockLandscapeOrientation())
        .catch(() => this.toggleAppFitMode());
    } else if (target.webkitRequestFullscreen) {
      target.webkitRequestFullscreen();
      this.lockLandscapeOrientation();
    } else {
      this.toggleAppFitMode();
    }
  }

  handleFullscreenChange() {
    const scene = this.scene;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      document.body.classList.remove("app-fit-mode");
      this.unlockScreenOrientation();
    }

    scene.time.delayedCall(80, () => scene.scale.refresh());
  }

  toggleAppFitMode() {
    const scene = this.scene;
    document.body.classList.toggle("app-fit-mode");
    if (document.body.classList.contains("app-fit-mode")) {
      this.lockLandscapeOrientation();
    } else {
      this.unlockScreenOrientation();
    }

    window.scrollTo(0, 1);
    scene.scale.refresh();
  }

  lockLandscapeOrientation() {
    const orientation = screen.orientation;
    if (!orientation?.lock) return;

    orientation.lock("landscape").catch(() => {
      // Some mobile browsers, especially iOS Safari, do not allow web pages to lock orientation.
    });
  }

  unlockScreenOrientation() {
    const orientation = screen.orientation;
    if (!orientation?.unlock) return;

    orientation.unlock();
  }
}
