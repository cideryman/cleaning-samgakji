import {
  getSamgakjiLevelInfo,
  normalizeSamgakjiProgressState,
} from "../config/SamgakjiProgressData.js";

export default class SamgakjiProgressSystem {
  constructor(scene) {
    this.scene = scene;
    this.levelInfo = getSamgakjiLevelInfo(0);
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
}
