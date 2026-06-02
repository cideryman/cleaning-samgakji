import {
  JjookQuestState,
  RecycleQuestState,
  SunisuniQuestState,
} from "../config/QuestStates.js";

const DEFAULT_BLOOM_STATE = {
  stage: 0,
  unlockedStages: {
    stage1: false,
    stage2: false,
    stage3: false,
    stage4: false,
  },
};

const FLOWERBED_ANCHORS = [
  { key: "flowerbed_1", fallback: { x: 1030, y: 392 }, texture: "flowerbed_growth" },
  { key: "flowerbed_2", fallback: { x: 458, y: 595 }, texture: "flowerbed_growth2" },
  { key: "flowerbed_3", fallback: { x: 900, y: 306 }, texture: "flowerbed_growth" },
  { key: "flowerbed_4", fallback: { x: 1340, y: 720 }, texture: "flowerbed_growth2" },
];

const STAGE_FRAMES = [
  [0, 0, 0, 0],
  [1, 0, 0, 0],
  [2, 1, 0, 0],
  [3, 2, 1, 0],
  [3, 3, 3, 3],
];

const STAGE_MESSAGES = {
  1: "화단에 작은 꽃이 피었어요.",
  2: "삼각지가 조금 더 밝아졌어요.",
  3: "나비가 찾아왔어요.",
  4: "동네 화단이 풍성해졌어요.",
};

export default class NeighborhoodProgressSystem {
  constructor(scene) {
    this.scene = scene;
    this.flowerbeds = [];
    this.butterflies = [];
    this.lastEvaluatedStage = -1;
  }

  static createDefaultState() {
    return {
      stage: DEFAULT_BLOOM_STATE.stage,
      unlockedStages: { ...DEFAULT_BLOOM_STATE.unlockedStages },
    };
  }

  static normalizeState(value = {}) {
    const safeValue = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    const safeUnlocked = safeValue.unlockedStages && typeof safeValue.unlockedStages === "object" && !Array.isArray(safeValue.unlockedStages)
      ? safeValue.unlockedStages
      : {};

    return {
      stage: Phaser.Math.Clamp(Number(safeValue.stage) || 0, 0, 4),
      unlockedStages: {
        ...DEFAULT_BLOOM_STATE.unlockedStages,
        ...safeUnlocked,
      },
    };
  }

  create() {
    this.scene.neighborhoodBloom = NeighborhoodProgressSystem.normalizeState(this.scene.neighborhoodBloom);
    this.createFlowerbeds();
    this.refresh({ silent: true });
  }

  update() {
    const nextStage = this.getEligibleStage();
    if (nextStage === this.lastEvaluatedStage && nextStage === this.scene.neighborhoodBloom?.stage) return;
    this.refresh();
  }

  refresh({ silent = false } = {}) {
    const bloom = NeighborhoodProgressSystem.normalizeState(this.scene.neighborhoodBloom);
    const nextStage = Math.max(bloom.stage, this.getEligibleStage());
    const didAdvance = nextStage > bloom.stage;
    bloom.stage = nextStage;

    for (let stage = 1; stage <= nextStage; stage += 1) {
      bloom.unlockedStages[`stage${stage}`] = true;
    }

    this.scene.neighborhoodBloom = bloom;
    this.lastEvaluatedStage = nextStage;
    this.applyFlowerbedFrames(nextStage);
    this.syncButterflies(nextStage);

    if (didAdvance && !silent) {
      this.showStageMessage(nextStage);
      this.scene.saveCheckpoint?.(`neighborhood_bloom_stage_${nextStage}`);
    }
  }

  getEligibleStage() {
    const scene = this.scene;
    const cleaned = scene.totalCleanedCount ?? 0;
    const isRecycleCompleted = scene.yebiQuestSystem?.recycleQuest?.isCompleted
      || scene.yebiQuestSystem?.recycleQuest?.state === RecycleQuestState.COMPLETED;
    const isJjookCompleted = scene.jjookQuestState === JjookQuestState.COMPLETED;
    const isSunisuniCompleted = scene.sunisuniQuestState === SunisuniQuestState.QUEST_COMPLETE;

    if (cleaned >= 1800 && isSunisuniCompleted) return 4;
    if (cleaned >= 1000 && isJjookCompleted) return 3;
    if (cleaned >= 500 && isRecycleCompleted) return 2;
    if (cleaned >= 200) return 1;
    return 0;
  }

  createFlowerbeds() {
    this.destroyFlowerbeds();

    FLOWERBED_ANCHORS.forEach((anchor, index) => {
      const point = this.getFlowerbedPoint(anchor);
      const textureKey = this.getAvailableFlowerbedTexture(anchor.texture);
      const flowerbed = textureKey
        ? this.scene.add.sprite(point.x, point.y, textureKey, 0)
        : this.createFallbackFlowerbed(point.x, point.y);

      if (!flowerbed) return;
      flowerbed.setOrigin(0.5, 1);
      flowerbed.setDisplaySize(112, 67);
      flowerbed.setData("depthSortY", point.y - 8);
      flowerbed.setData("neighborhoodDecoration", true);
      flowerbed.setDepth(this.scene.getWorldDepth(point.y - 8, -0.35));
      flowerbed.setName(anchor.key);
      this.flowerbeds[index] = flowerbed;
    });
  }

  getFlowerbedPoint(anchor) {
    return this.scene.getMapPoint?.(anchor.key, anchor.fallback) || anchor.fallback;
  }

  getAvailableFlowerbedTexture(preferredTexture) {
    if (this.scene.textures.exists(preferredTexture)) return preferredTexture;
    if (this.scene.textures.exists("flowerbed_growth")) return "flowerbed_growth";
    if (this.scene.textures.exists("flowerbed_growth2")) return "flowerbed_growth2";
    return null;
  }

  createFallbackFlowerbed(x, y) {
    const group = this.scene.add.group();
    const base = this.scene.add.rectangle(x, y - 18, 112, 28, 0x8c6f42, 0.92);
    const soil = this.scene.add.rectangle(x, y - 24, 96, 14, 0x4a3226, 0.92);
    group.addMultiple([base, soil]);
    group.setData?.("isFallbackFlowerbed", true);
    return {
      setOrigin: () => {},
      setDisplaySize: () => {},
      setData: (...args) => group.setData?.(...args),
      getData: (...args) => group.getData?.(...args),
      setDepth: (depth) => group.getChildren().forEach((child) => child.setDepth(depth)),
      setName: () => {},
      setFrame: () => {},
      destroy: () => group.destroy(true),
    };
  }

  applyFlowerbedFrames(stage) {
    const frames = STAGE_FRAMES[stage] || STAGE_FRAMES[0];
    this.flowerbeds.forEach((flowerbed, index) => {
      if (!flowerbed?.setFrame) return;
      flowerbed.setFrame(frames[index] ?? 0);
    });
  }

  syncButterflies(stage) {
    const targetCount = stage >= 4 ? 3 : stage >= 3 ? 1 : 0;

    while (this.butterflies.length > targetCount) {
      const butterfly = this.butterflies.pop();
      butterfly?.tween?.remove?.();
      butterfly?.sprite?.destroy?.();
    }

    if (!this.scene.textures.exists("butterfly_idle")) return;
    this.ensureButterflyAnimation();

    while (this.butterflies.length < targetCount) {
      this.createButterfly(this.butterflies.length);
    }
  }

  ensureButterflyAnimation() {
    if (this.scene.anims.exists("butterfly_idle_anim")) return;
    this.scene.anims.create({
      key: "butterfly_idle_anim",
      frames: this.scene.anims.generateFrameNumbers("butterfly_idle", { frames: [0, 1, 2, 1] }),
      frameRate: 6,
      repeat: -1,
    });
  }

  createButterfly(index) {
    const anchor = this.flowerbeds[index + 1] || this.flowerbeds[index] || this.flowerbeds[0];
    if (!anchor) return;

    const baseX = (anchor.x ?? this.getFlowerbedPoint(FLOWERBED_ANCHORS[index]).x) + Phaser.Math.Between(-16, 22);
    const baseY = (anchor.y ?? this.getFlowerbedPoint(FLOWERBED_ANCHORS[index]).y) - Phaser.Math.Between(58, 74);
    const sprite = this.scene.add.sprite(baseX, baseY, "butterfly_idle");
    sprite.setDisplaySize(38, 38);
    sprite.setDepth(this.scene.getWorldDepth(baseY, 0.65));
    sprite.setData("neighborhoodDecoration", true);
    sprite.anims.play("butterfly_idle_anim");

    const tween = this.scene.tweens.add({
      targets: sprite,
      x: baseX + Phaser.Math.Between(20, 40),
      y: baseY + Phaser.Math.Between(-12, 12),
      duration: Phaser.Math.Between(1450, 2200),
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.butterflies.push({ sprite, tween });
  }

  showStageMessage(stage) {
    const message = STAGE_MESSAGES[stage];
    if (!message) return;
    this.scene.showQuestToast?.(message, 3600);
  }

  destroyFlowerbeds() {
    this.flowerbeds.forEach((flowerbed) => flowerbed?.destroy?.());
    this.flowerbeds = [];
  }

  destroy() {
    this.destroyFlowerbeds();
    this.butterflies.forEach((butterfly) => {
      butterfly?.tween?.remove?.();
      butterfly?.sprite?.destroy?.();
    });
    this.butterflies = [];
  }
}
