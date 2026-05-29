export default class HtmlUiBindingSystem {
  constructor(scene) {
    this.scene = scene;
  }

  lookupElements() {
    const scene = this.scene;
    scene.cleanProgressEls = Array.from(document.querySelectorAll("#cleanProgress span"));
    scene.canProgressEls = Array.from(document.querySelectorAll("#canProgress span"));
    scene.missionCountEl = document.querySelector("#missionCount");
    scene.sweepButton = document.querySelector("#sweepButton");
    scene.specialButton = document.querySelector("#specialButton");
    scene.bacchusButton = document.querySelector("#bacchusButton");
    scene.bacchusTimerEl = document.querySelector("#bacchusTimer");
    scene.movePad = document.querySelector("#movePad");
    scene.moveKnob = document.querySelector("#moveKnob");
    scene.fullscreenButton = document.querySelector("#fullscreenButton");
    scene.completeOverlay = document.querySelector("#completeOverlay");
    scene.specialToast = document.querySelector("#specialToast");
    scene.speedBuffHudEl = document.querySelector("#speedBuffHud");
    scene.speedBuffTimerEl = document.querySelector("#speedBuffTimer");
    scene.jjookFollowHudEl = document.querySelector("#jjookFollowHud");
    scene.jjookFollowTimerEl = document.querySelector("#jjookFollowTimer");
    scene.travelPrepHudEl = document.querySelector("#travelPrepHud");
    scene.travelPrepBagIconEl = document.querySelector("#travelPrepBagIcon");
    scene.travelPrepCountEl = document.querySelector("#travelPrepCount");
    scene.travelPrepFanEl = document.querySelector("#travelPrepFan");
    scene.resultTrashCountEl = document.querySelector("#resultTrashCount");
    scene.resultCanCountEl = document.querySelector("#resultCanCount");
    scene.resultHelpUsedEl = document.querySelector("#resultHelpUsed");
    scene.inventoryNormalCountEl = document.querySelector("#inventoryNormalCount");
    scene.inventoryPlasticCountEl = document.querySelector("#inventoryPlasticCount");
    scene.inventoryCanCountEl = document.querySelector("#inventoryCanCount");
    scene.restartButton = document.querySelector("#restartButton");

    // 핸들러 바인딩 및 씬 등록
    scene.restartHandler = () => scene.restartGame();
    scene.sweepHandler = (event) => {
      event?.preventDefault();
      event?.stopPropagation();
      if (scene.sceneControlSystem?.isWorldInputBlocked()) return;
      scene.handlePrimaryAction();
    };
    scene.specialHandler = (event) => {
      event?.preventDefault();
      event?.stopPropagation();
      if (scene.sceneControlSystem?.isWorldInputBlocked()) return;
      scene.useYebiItem();
    };
    scene.bacchusHandler = (event) => {
      event?.preventDefault();
      event?.stopPropagation();
      if (scene.sceneControlSystem?.isWorldInputBlocked()) return;
      scene.useBacchusItem();
    };
    scene.travelPrepHandler = (event) => {
      event?.preventDefault();
      event?.stopPropagation();
      scene.toggleTravelPrepFan();
    };
    scene.moveStartHandler = (event) => scene.startFloatingJoystick(event);
    scene.moveUpdateHandler = (event) => scene.updateJoystick(event);
    scene.moveStopHandler = (event) => scene.stopJoystick(event);
    scene.fullscreenHandler = (event) => scene.toggleFullscreen(event);
    scene.fullscreenChangeHandler = () => scene.handleFullscreenChange();
    scene.resizeHandler = () => scene.updateCameraZoom();
    scene.audioUnlockHandler = () => scene.unlockAudio();
    scene.devKeyHandler = (event) => scene.handleDevKeydown(event);
    scene.pageAudioStopHandler = () => scene.stopAudioForPageExit();
    scene.visibilityChangeHandler = () => {
      if (document.hidden) scene.stopAudioForPageExit();
    };
  }

  bind() {
    const scene = this.scene;
    scene.restartButton?.addEventListener("click", scene.restartHandler);
    scene.sweepButton?.addEventListener("pointerdown", scene.sweepHandler);
    scene.specialButton?.addEventListener("pointerdown", scene.specialHandler);
    scene.bacchusButton?.addEventListener("pointerdown", scene.bacchusHandler);
    scene.travelPrepHudEl?.addEventListener("pointerdown", scene.travelPrepHandler);
    window.addEventListener("pointerdown", scene.audioUnlockHandler, { passive: true });
    window.addEventListener("keydown", scene.audioUnlockHandler);
    window.addEventListener("keydown", scene.devKeyHandler, true);
    window.addEventListener("pointerdown", scene.moveStartHandler);
    window.addEventListener("pointermove", scene.moveUpdateHandler);
    window.addEventListener("pointerup", scene.moveStopHandler);
    window.addEventListener("pointercancel", scene.moveStopHandler);
    scene.fullscreenButton?.addEventListener("click", scene.fullscreenHandler);
    document.addEventListener("fullscreenchange", scene.fullscreenChangeHandler);
    document.addEventListener("webkitfullscreenchange", scene.fullscreenChangeHandler);
    window.addEventListener("resize", scene.resizeHandler);
    window.addEventListener("orientationchange", scene.resizeHandler);
    scene.scale.on(Phaser.Scale.Events.RESIZE, scene.resizeHandler);
    window.addEventListener("pagehide", scene.pageAudioStopHandler);
    window.addEventListener("beforeunload", scene.pageAudioStopHandler);
    document.addEventListener("visibilitychange", scene.visibilityChangeHandler);
  }

  unbind() {
    const scene = this.scene;
    scene.restartButton?.removeEventListener("click", scene.restartHandler);
    scene.sweepButton?.removeEventListener("pointerdown", scene.sweepHandler);
    scene.specialButton?.removeEventListener("pointerdown", scene.specialHandler); // 기존 레거시의 bacchusHandler 오인성 버그 정정
    scene.bacchusButton?.removeEventListener("pointerdown", scene.bacchusHandler);
    scene.travelPrepHudEl?.removeEventListener("pointerdown", scene.travelPrepHandler);
    window.removeEventListener("pointerdown", scene.audioUnlockHandler);
    window.removeEventListener("keydown", scene.audioUnlockHandler);
    window.removeEventListener("keydown", scene.devKeyHandler, true);
    window.removeEventListener("pointerdown", scene.moveStartHandler);
    window.removeEventListener("pointermove", scene.moveUpdateHandler);
    window.removeEventListener("pointerup", scene.moveStopHandler);
    window.removeEventListener("pointercancel", scene.moveStopHandler);
    scene.fullscreenButton?.removeEventListener("click", scene.fullscreenHandler);
    document.removeEventListener("fullscreenchange", scene.fullscreenChangeHandler);
    document.removeEventListener("webkitfullscreenchange", scene.fullscreenChangeHandler);
    window.removeEventListener("resize", scene.resizeHandler);
    window.removeEventListener("orientationchange", scene.resizeHandler);
    scene.scale.off(Phaser.Scale.Events.RESIZE, scene.resizeHandler);
    window.removeEventListener("pagehide", scene.pageAudioStopHandler);
    window.removeEventListener("beforeunload", scene.pageAudioStopHandler);
    document.removeEventListener("visibilitychange", scene.visibilityChangeHandler);
  }

  reset() {
    const scene = this.scene;
    scene.bacchusButton?.setAttribute("hidden", "");
    scene.bacchusButton?.classList.remove("is-active");
    if (scene.bacchusTimerEl) scene.bacchusTimerEl.textContent = "";
    scene.travelPrepHudEl?.classList.remove("is-visible", "is-open");
    scene.travelPrepHudEl?.setAttribute("aria-hidden", "true");
    if (scene.travelPrepFanEl) {
      scene.travelPrepFanEl.innerHTML = "";
      scene.travelPrepFanEl.setAttribute("aria-hidden", "true");
    }
    scene.speedBuffHudEl?.classList.remove("is-visible");
    scene.jjookFollowHudEl?.classList.remove("is-visible");
    if (scene.speedBuffTimerEl) scene.speedBuffTimerEl.textContent = "";
    if (scene.jjookFollowTimerEl) scene.jjookFollowTimerEl.textContent = "";
  }
}
