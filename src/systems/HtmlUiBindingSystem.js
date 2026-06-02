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
    
    scene.settingsButton = document.querySelector("#settingsButton");
    scene.settingsModal = document.querySelector("#settingsModal");
    scene.settingsClose = document.querySelector("#settings-close");
    scene.settingsOk = document.querySelector("#settings-ok");
    scene.settingsSaveExit = document.querySelector("#settings-save-exit");
    scene.settingToggleText = document.querySelector("#setting-toggle-text");
    scene.settingToggleTts = document.querySelector("#setting-toggle-tts");
    scene.settingToggleJoystick = document.querySelector("#setting-toggle-joystick");
    scene.settingToggleFullscreen = document.querySelector("#setting-toggle-fullscreen");
    scene.settingToggleSound = document.querySelector("#setting-toggle-sound");
    scene.settingOpenNotes = document.querySelector("#setting-open-notes");
    scene.eduNotesModal = document.querySelector("#edu-notes-modal");
    scene.eduNotesClose = document.querySelector("#edu-notes-close");
    scene.eduNotesOk = document.querySelector("#edu-notes-ok");
    scene.eduNotesList = document.querySelector("#edu-notes-list");

    scene.completeOverlay = document.querySelector("#completeOverlay");
    scene.specialToast = document.querySelector("#specialToast");
    scene.speedBuffHudEl = document.querySelector("#speedBuffHud");
    scene.speedBuffTimerEl = document.querySelector("#speedBuffTimer");
    scene.jjookFollowHudEl = document.querySelector("#jjookFollowHud");
    scene.jjookFollowTimerEl = document.querySelector("#jjookFollowTimer");
    scene.travelPrepHudEl = document.querySelector("#travelPrepHud");
    scene.travelPrepBagIconEl = document.querySelector("#travelPrepBagIcon");
    scene.travelPrepCountEl = document.querySelector("#travelPrepCount");
    scene.travelPrepModal = document.querySelector("#travelPrepModal");
    scene.travelPrepCloseBtn = document.querySelector("#travel-prep-close");
    scene.travelPrepOkBtn = document.querySelector("#travel-prep-ok");
    scene.resultTrashCountEl = document.querySelector("#resultTrashCount");
    scene.resultCanCountEl = document.querySelector("#resultCanCount");
    scene.resultHelpUsedEl = document.querySelector("#resultHelpUsed");
    scene.inventoryNormalCountEl = document.querySelector("#inventoryNormalCount");
    scene.inventoryPlasticCountEl = document.querySelector("#inventoryPlasticCount");
    scene.inventoryCanCountEl = document.querySelector("#inventoryCanCount");
    scene.restartButton = document.querySelector("#restartButton");

    // Thin Bridge wraps
    scene.toggleSettingsModal = () => this.toggleSettings();
    scene.hideSettingsModal = () => this.hideSettings();
    scene.updateSettingsLabels = () => this.updateLabels();
    scene.toggleTravelPrepModal = () => this.toggleTravelPrep();
    scene.showTravelPrepModal = () => this.showTravelPrep();
    scene.hideTravelPrepModal = () => this.hideTravelPrep();

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
      scene.toggleTravelPrepModal();
    };
    scene.moveStartHandler = (event) => scene.startFloatingJoystick(event);
    scene.moveUpdateHandler = (event) => scene.updateJoystick(event);
    scene.moveStopHandler = (event) => scene.stopJoystick(event);
    scene.fullscreenChangeHandler = () => {
      scene.handleFullscreenChange();
      this.updateLabels();
    };
    scene.resizeHandler = () => scene.updateCameraZoom();
    scene.audioUnlockHandler = () => scene.unlockAudio();
    scene.devKeyHandler = (event) => scene.handleDevKeydown(event);
    scene.pageAudioStopHandler = () => scene.stopAudioForPageExit();
    scene.visibilityChangeHandler = () => {
      if (document.hidden) scene.stopAudioForPageExit();
    };

    scene.settingsHandler = (event) => {
      event?.preventDefault();
      event?.stopPropagation();
      this.toggleSettings();
    };
    scene.domOverlayInputTrapHandler = (event) => {
      event?.stopPropagation();
    };
    scene.settingOpenNotesHandler = (event) => {
      event?.preventDefault();
      event?.stopPropagation();
      this.hideSettings();
      scene.educationalGuideSystem?.renderLearningNotes?.();
      this.showLearningNotes();
    };
    scene.eduNotesCloseHandler = () => {
      this.hideLearningNotes();
      this.showSettings();
    };
    scene.settingsCloseHandler = () => {
      this.hideSettings();
    };
    scene.settingsSaveExitHandler = (event) => {
      event?.preventDefault();
      event?.stopPropagation();
      scene.saveCheckpoint?.("manual_exit");
      scene.stopAudioForPageExit?.();
      this.hideSettings();
      scene.scene.start("StartScene");
    };
    scene.settingToggleTextHandler = () => {
      const large = scene.registry.get("textSizeLarge") !== true;
      scene.registry.set("textSizeLarge", large);
      window.localStorage?.setItem("samgakji_text_size_large", large ? "true" : "false");
      if (large) {
        document.body.classList.add("ui-large-text");
      } else {
        document.body.classList.remove("ui-large-text");
      }
      this.updateLabels();
    };
    scene.settingToggleTtsHandler = () => {
      const tts = scene.registry.get("ttsEnabled") !== true;
      scene.registry.set("ttsEnabled", tts);
      window.localStorage?.setItem("samgakji_tts_enabled", tts ? "true" : "false");
      this.updateLabels();
    };
    scene.settingToggleSoundHandler = () => {
      const soundEnabled = scene.registry.get("soundEnabled") !== false;
      const nextSound = !soundEnabled;
      scene.registry.set("soundEnabled", nextSound);
      window.localStorage?.setItem("samgakji_sound_enabled", nextSound ? "true" : "false");
      
      if (!nextSound) {
        scene.sound.mute = true;
        scene.audioManager?.stopChapterMusic();
        scene.audioManager?.stopSceneMusic({ resumeChapter: false });
      } else {
        scene.sound.mute = false;
        if (scene.audioContext?.state === "suspended") {
          scene.audioContext.resume();
        }
        if (scene.scene.key === "PlayScene") {
          scene.audioManager?.startChapterMusic();
        }
      }
      this.updateLabels();
    };
    scene.settingToggleJoystickHandler = () => {
      const joy = scene.registry.get("joystickEnabled") !== false;
      scene.registry.set("joystickEnabled", !joy);
      window.localStorage?.setItem("samgakji_joystick_enabled", !joy ? "true" : "false");
      this.updateLabels();
    };
    scene.settingToggleFullscreenHandler = (event) => {
      scene.toggleFullscreen(event);
      setTimeout(() => this.updateLabels(), 150);
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
    
    scene.settingsButton?.addEventListener("click", scene.settingsHandler);
    scene.settingsModal?.addEventListener("pointerdown", scene.domOverlayInputTrapHandler);
    scene.settingsModal?.addEventListener("touchstart", scene.domOverlayInputTrapHandler);
    scene.eduNotesModal?.addEventListener("pointerdown", scene.domOverlayInputTrapHandler);
    scene.eduNotesModal?.addEventListener("touchstart", scene.domOverlayInputTrapHandler);
    scene.settingsClose?.addEventListener("click", scene.settingsCloseHandler);
    scene.settingsOk?.addEventListener("click", scene.settingsCloseHandler);
    scene.settingsSaveExit?.addEventListener("click", scene.settingsSaveExitHandler);
    scene.settingToggleText?.addEventListener("click", scene.settingToggleTextHandler);
    scene.settingToggleTts?.addEventListener("click", scene.settingToggleTtsHandler);
    scene.settingToggleJoystick?.addEventListener("click", scene.settingToggleJoystickHandler);
    scene.settingToggleFullscreen?.addEventListener("click", scene.settingToggleFullscreenHandler);
    scene.settingToggleSound?.addEventListener("click", scene.settingToggleSoundHandler);
    scene.settingOpenNotes?.addEventListener("click", scene.settingOpenNotesHandler);
    scene.eduNotesClose?.addEventListener("click", scene.eduNotesCloseHandler);
    scene.eduNotesOk?.addEventListener("click", scene.eduNotesCloseHandler);

    scene.travelPrepModal?.addEventListener("pointerdown", scene.domOverlayInputTrapHandler);
    scene.travelPrepModal?.addEventListener("touchstart", scene.domOverlayInputTrapHandler);
    scene.travelPrepCloseBtn?.addEventListener("click", () => scene.hideTravelPrepModal?.());
    scene.travelPrepOkBtn?.addEventListener("click", () => scene.hideTravelPrepModal?.());

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
    scene.specialButton?.removeEventListener("pointerdown", scene.specialHandler);
    scene.bacchusButton?.removeEventListener("pointerdown", scene.bacchusHandler);
    scene.travelPrepHudEl?.removeEventListener("pointerdown", scene.travelPrepHandler);
    window.removeEventListener("pointerdown", scene.audioUnlockHandler);
    window.removeEventListener("keydown", scene.audioUnlockHandler);
    window.removeEventListener("keydown", scene.devKeyHandler, true);
    window.removeEventListener("pointerdown", scene.moveStartHandler);
    window.removeEventListener("pointermove", scene.moveUpdateHandler);
    window.removeEventListener("pointerup", scene.moveStopHandler);
    window.removeEventListener("pointercancel", scene.moveStopHandler);
    
    scene.settingsButton?.removeEventListener("click", scene.settingsHandler);
    scene.settingsModal?.removeEventListener("pointerdown", scene.domOverlayInputTrapHandler);
    scene.settingsModal?.removeEventListener("touchstart", scene.domOverlayInputTrapHandler);
    scene.eduNotesModal?.removeEventListener("pointerdown", scene.domOverlayInputTrapHandler);
    scene.eduNotesModal?.removeEventListener("touchstart", scene.domOverlayInputTrapHandler);
    scene.settingsClose?.removeEventListener("click", scene.settingsCloseHandler);
    scene.settingsOk?.removeEventListener("click", scene.settingsCloseHandler);
    scene.settingsSaveExit?.removeEventListener("click", scene.settingsSaveExitHandler);
    scene.settingToggleText?.removeEventListener("click", scene.settingToggleTextHandler);
    scene.settingToggleTts?.removeEventListener("click", scene.settingToggleTtsHandler);
    scene.settingToggleJoystick?.removeEventListener("click", scene.settingToggleJoystickHandler);
    scene.settingToggleFullscreen?.removeEventListener("click", scene.settingToggleFullscreenHandler);
    scene.settingToggleSound?.removeEventListener("click", scene.settingToggleSoundHandler);
    scene.settingOpenNotes?.removeEventListener("click", scene.settingOpenNotesHandler);
    scene.eduNotesClose?.removeEventListener("click", scene.eduNotesCloseHandler);
    scene.eduNotesOk?.removeEventListener("click", scene.eduNotesCloseHandler);

    scene.travelPrepCloseBtn?.removeEventListener("click", () => scene.hideTravelPrepModal?.());
    scene.travelPrepOkBtn?.removeEventListener("click", () => scene.hideTravelPrepModal?.());

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
    scene.speedBuffHudEl?.classList.remove("is-visible");
    scene.jjookFollowHudEl?.classList.remove("is-visible");
    if (scene.speedBuffTimerEl) scene.speedBuffTimerEl.textContent = "";
    if (scene.jjookFollowTimerEl) scene.jjookFollowTimerEl.textContent = "";
    this.hideSettings();
    this.hideLearningNotes();
    this.hideTravelPrep();
  }

  toggleSettings() {
    const scene = this.scene;
    const modal = scene.settingsModal;
    if (!modal) return;

    if (modal.style.display === "none") {
      this.showSettings();
    } else {
      this.hideSettings();
    }
  }

  showSettings() {
    const scene = this.scene;
    const modal = scene.settingsModal;
    if (!modal) return;

    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
    scene.sceneControlSystem?.blockWorldInput?.(true);

    this.updateLabels();
  }

  hideSettings() {
    const scene = this.scene;
    const modal = scene.settingsModal;
    if (!modal) return;

    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
    scene.sceneControlSystem?.blockWorldInput?.(false);
  }

  showLearningNotes() {
    const scene = this.scene;
    const modal = scene.eduNotesModal;
    if (!modal) return;

    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
    scene.sceneControlSystem?.blockWorldInput?.(true);
  }

  hideLearningNotes() {
    const scene = this.scene;
    const modal = scene.eduNotesModal;
    if (!modal) return;

    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
    scene.sceneControlSystem?.blockWorldInput?.(false);
  }

  updateLabels() {
    const scene = this.scene;
    if (scene.settingToggleText) {
      const isLarge = scene.registry.get("textSizeLarge") === true;
      scene.settingToggleText.textContent = isLarge ? "글자 크기: 크게" : "글자 크기: 보통";
      scene.settingToggleText.classList.toggle("is-off", !isLarge);
    }
    if (scene.settingToggleTts) {
      const isTts = scene.registry.get("ttsEnabled") === true;
      scene.settingToggleTts.textContent = isTts ? "음성 안내: 켜기" : "음성 안내: 끄기";
      scene.settingToggleTts.classList.toggle("is-off", !isTts);
    }
    if (scene.settingToggleJoystick) {
      const isJoy = scene.registry.get("joystickEnabled") !== false;
      scene.settingToggleJoystick.textContent = isJoy ? "조이스틱: 켜기" : "조이스틱: 끄기";
      scene.settingToggleJoystick.classList.toggle("is-off", !isJoy);
    }
    if (scene.settingToggleFullscreen) {
      const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement);
      scene.settingToggleFullscreen.textContent = isFull ? "전체화면: 켜기" : "전체화면: 끄기";
      scene.settingToggleFullscreen.classList.toggle("is-off", !isFull);
    }
    if (scene.settingToggleSound) {
      const isSound = scene.registry.get("soundEnabled") !== false;
      scene.settingToggleSound.textContent = isSound ? "소리: 켜기" : "소리: 끄기";
      scene.settingToggleSound.classList.toggle("is-off", !isSound);
    }
  }

  toggleTravelPrep() {
    const scene = this.scene;
    const modal = scene.travelPrepModal;
    if (!modal) return;

    if (modal.style.display === "none") {
      this.showTravelPrep();
    } else {
      this.hideTravelPrep();
    }
  }

  showTravelPrep() {
    const scene = this.scene;
    const modal = scene.travelPrepModal;
    if (!modal) return;

    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
    scene.sceneControlSystem?.blockWorldInput?.(true);

    scene.clothingShopSystem?.renderTravelPrepList?.();
  }

  hideTravelPrep() {
    const scene = this.scene;
    const modal = scene.travelPrepModal;
    if (!modal) return;

    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
    scene.sceneControlSystem?.blockWorldInput?.(false);
    scene.game.canvas?.focus?.();
  }
}
