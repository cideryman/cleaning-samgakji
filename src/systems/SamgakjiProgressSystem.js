import {
  getSamgakjiLevelInfo,
  getSamgakjiLevelNameByLevel,
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
    this.scene.events.once("shutdown", () => this.destroy());
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

  advanceDevLevel() {
    const levelInfo = this.getLevelInfo();
    if (!levelInfo?.next) {
      this.scene.showQuestToast?.("개발 치트: 삼각지가 이미 최고 레벨이에요.");
      return;
    }

    this.scene.totalCleanedCount = Math.max(
      this.scene.totalCleanedCount ?? 0,
      levelInfo.next.requiredCleaned,
    );
    const nextInfo = this.refresh({ silent: false, save: true });
    this.scene.neighborhoodProgressSystem?.refresh?.();
    this.scene.updateHud?.();
    this.scene.showQuestToast?.(`개발 치트: 삼각지 Lv.${nextInfo.level} 달성`);
  }

  maybeShowLevelUpPopup() {
    const progress = this.scene.samgakjiProgress;
    const levelInfo = this.getLevelInfo();
    if (!progress || !levelInfo) return;
    if (this.levelUpModal) return;
    const lastAnnouncedLevel = progress.lastAnnouncedLevel ?? 1;
    if (levelInfo.level <= lastAnnouncedLevel) return;

    const lastAnnouncedName = getSamgakjiLevelNameByLevel(lastAnnouncedLevel);
    if (levelInfo.name === lastAnnouncedName) {
      this.acknowledgeLevel(levelInfo.level);
      return;
    }

    if (!this.isMainWorldMap()) {
      this.showNonBlockingLevelNotice(levelInfo);
      return;
    }

    this.showLevelUpPopup(levelInfo);
  }

  isMainWorldMap() {
    const mapId = this.scene.currentWorldMapId;
    return !mapId || mapId === "main" || mapId === "chapter1_map";
  }

  showNonBlockingLevelNotice(levelInfo) {
    this.removeLevelUpPopup();
    document.querySelectorAll(".samgakji-levelup-modal.is-visible").forEach((el) => el.remove());
    this.scene.sceneControlSystem?.blockWorldInput?.(false);
    if (this.scene.stateManager?.current === SceneState.CUTSCENE) {
      this.scene.stateManager.set(SceneState.PLAYING);
    }

    this.acknowledgeLevel(levelInfo.level);
    this.scene.showQuestToast?.(`삼각지 Lv.${levelInfo.level}: ${levelInfo.name}`, 4200);
    this.scene.saveCheckpoint?.(`samgakji_level_${levelInfo.level}`);
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
    this.removeLevelUpPopup();
    this.scene.sceneControlSystem?.blockWorldInput?.(false);
    this.scene.stateManager?.set(this.previousSceneState || SceneState.PLAYING);
    this.previousSceneState = null;
    this.scene.saveCheckpoint?.(`samgakji_level_${level}`);
  }

  removeLevelUpPopup() {
    this.levelUpModal?.remove();
    this.levelUpModal = null;
    if (this.levelUpKeyHandler) {
      window.removeEventListener("keydown", this.levelUpKeyHandler);
      this.levelUpKeyHandler = null;
    }
  }

  destroy() {
    this.removeLevelUpPopup();
    this.scene.sceneControlSystem?.blockWorldInput?.(false);
    this.previousSceneState = null;
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
