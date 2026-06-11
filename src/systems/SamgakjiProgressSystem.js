import {
  getSamgakjiLevelInfo,
  normalizeSamgakjiProgressState,
} from "../config/SamgakjiProgressData.js";
import { SceneState } from "../config/SceneState.js";

export default class SamgakjiProgressSystem {
  constructor(scene) {
    this.scene = scene;
    this.levelInfo = getSamgakjiLevelInfo(0);
    this.levelUpModal = null;
    this.levelUpKeyHandler = null;
    this.previousSceneState = null;
  }

  create() {
    this.refresh({ silent: true });
  }

  refresh({ silent = false, save = false } = {}) {
    const cleaned = this.scene.totalCleanedCount ?? 0;
    this.levelInfo = getSamgakjiLevelInfo(cleaned);
    this.scene.samgakjiProgress = normalizeSamgakjiProgressState(
      this.scene.samgakjiProgress,
      cleaned,
    );

    if (!silent) {
      this.maybeShowLevelUpPopup();
    }

    if (save && !silent) {
      this.scene.saveCheckpoint?.(`samgakji_level_${this.levelInfo.level}`);
    }

    return this.levelInfo;
  }

  getLevelInfo() {
    return this.levelInfo || this.refresh({ silent: true });
  }

  getCurrentLevel() {
    return this.getLevelInfo().level;
  }

  maybeShowLevelUpPopup() {
    const progress = this.scene.samgakjiProgress;
    const levelInfo = this.getLevelInfo();
    if (!progress || !levelInfo) return;
    if (this.levelUpModal) return;
    if (levelInfo.level <= (progress.lastAnnouncedLevel ?? 1)) return;

    this.showLevelUpPopup(levelInfo);
  }

  showLevelUpPopup(levelInfo) {
    const stage = document.querySelector(".game-stage");
    if (!stage) {
      this.acknowledgeLevel(levelInfo.level);
      return;
    }

    document.querySelectorAll(".samgakji-levelup-modal").forEach((el) => el.remove());

    this.previousSceneState = this.scene.stateManager?.current ?? SceneState.PLAYING;
    this.scene.stateManager?.set(SceneState.CUTSCENE);
    this.scene.sceneControlSystem?.blockWorldInput?.(true);

    const modal = document.createElement("div");
    modal.className = "samgakji-levelup-modal is-visible";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "삼각지 발전도 상승");
    modal.innerHTML = `
      <div class="samgakji-levelup-panel">
        <div class="samgakji-levelup-badge" aria-hidden="true">🏡</div>
        <div class="samgakji-levelup-kicker">삼각지가 달라졌어요</div>
        <h2>삼각지 Lv.${levelInfo.level}</h2>
        <strong>${levelInfo.name}</strong>
        <p>${this.getLevelUpMessage(levelInfo.level)}</p>
        <button type="button" class="samgakji-levelup-confirm">확인</button>
      </div>
    `;

    const stopInput = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };
    modal.addEventListener("pointerdown", stopInput);
    modal.addEventListener("touchstart", stopInput, { passive: false });

    const close = (event) => {
      stopInput(event);
      this.closeLevelUpPopup(levelInfo.level);
    };
    modal.querySelector(".samgakji-levelup-confirm")?.addEventListener("click", close);
    modal.querySelector(".samgakji-levelup-confirm")?.addEventListener("pointerdown", close);

    stage.appendChild(modal);
    this.levelUpModal = modal;
    this.levelUpKeyHandler = (event) => {
      if (!["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      this.closeLevelUpPopup(levelInfo.level);
    };
    window.addEventListener("keydown", this.levelUpKeyHandler);
    modal.querySelector(".samgakji-levelup-confirm")?.focus?.();
  }

  closeLevelUpPopup(level) {
    if (!this.levelUpModal) return;
    this.acknowledgeLevel(level);
    this.levelUpModal?.remove();
    this.levelUpModal = null;
    if (this.levelUpKeyHandler) {
      window.removeEventListener("keydown", this.levelUpKeyHandler);
      this.levelUpKeyHandler = null;
    }
    this.scene.sceneControlSystem?.blockWorldInput?.(false);
    this.scene.stateManager?.set(this.previousSceneState || SceneState.PLAYING);
    this.previousSceneState = null;
    this.scene.saveCheckpoint?.(`samgakji_level_${level}`);
  }

  acknowledgeLevel(level) {
    this.scene.samgakjiProgress = normalizeSamgakjiProgressState({
      ...this.scene.samgakjiProgress,
      lastAnnouncedLevel: Math.max(this.scene.samgakjiProgress?.lastAnnouncedLevel ?? 1, level),
    }, this.scene.totalCleanedCount ?? 0);
  }

  getLevelUpMessage(level) {
    if (level >= 15) return "삼각지가 많은 사람에게 사랑받는 곳이 되었어요.";
    if (level >= 13) return "삼각지를 찾는 사람이 점점 늘고 있어요.";
    if (level >= 11) return "잠깐 쉬어가고 싶은 동네가 되었어요.";
    if (level >= 9) return "삼각지가 환하게 빛나기 시작했어요.";
    if (level >= 7) return "깨끗한 길에 좋은 향기가 나는 것 같아요.";
    if (level >= 5) return "삼각지에 꽃이 더 많이 피고 있어요.";
    if (level >= 3) return "삼각지에 작은 새싹이 돋아났어요.";
    return "삼각지가 조금씩 깨어나고 있어요.";
  }
}
