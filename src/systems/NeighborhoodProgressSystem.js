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

const STATIC_PROGRESS_PROPS = [
  {
    key: "progress_dirty_planter_west",
    type: "dirty",
    texture: "dirty_trash_bags",
    pointKey: "west_rest_bench",
    replacedMapObjectKey: "west_rest_bench",
    fallback: { x: 827, y: 546 },
    width: 132,
    height: 79,
    showUntilLevel: 2,
    blocksMovement: true,
  },
  {
    key: "progress_dirty_planter_east",
    type: "dirty",
    texture: "dirty_cardboard_pile",
    pointKey: "park_tree_center_01",
    replacedMapObjectKey: "park_tree_center_01",
    fallback: { x: 1610, y: 734 },
    width: 128,
    height: 77,
    showUntilLevel: 3,
    blocksMovement: true,
  },
  {
    key: "progress_dirty_bench_spot",
    type: "dirty",
    texture: "dirty_spilled_bin",
    pointKey: "park_bench_south",
    replacedMapObjectKey: "park_bench_south",
    fallback: { x: 864, y: 904 },
    width: 138,
    height: 83,
    showUntilLevel: 4,
    blocksMovement: true,
  },
  {
    key: "progress_dirty_tree_spot",
    type: "dirty",
    texture: "dirty_soil_rubble",
    pointKey: "west_tree_rest",
    replacedMapObjectKey: "west_tree_rest",
    fallback: { x: 928, y: 770 },
    width: 126,
    height: 76,
    showUntilLevel: 5,
    blocksMovement: true,
  },
  {
    key: "progress_dirty_concrete_scrap",
    type: "dirty",
    texture: "dirty_concrete_scrap",
    fallback: { x: 612, y: 472 },
    width: 134,
    height: 80,
    showUntilLevel: 3,
    blocksMovement: true,
  },
  {
    key: "progress_dirty_paper_rubble",
    type: "dirty",
    texture: "dirty_paper_rubble",
    fallback: { x: 1440, y: 500 },
    width: 132,
    height: 79,
    showUntilLevel: 4,
    blocksMovement: true,
  },
  {
    key: "progress_old_trash_rose_01",
    type: "dirty",
    texture: "dirty_paper_rubble",
    dedicatedPointKey: "progress_rose_01",
    requiresDedicatedPoint: true,
    width: 92,
    height: 55,
    showUntilLevel: 4,
  },
  {
    key: "progress_rose_01",
    texture: "progress_rose_bush",
    frame: 0,
    growthFrames: true,
    requiresDedicatedPoint: true,
    width: 96,
    height: 96,
    showFromLevel: 5,
    depthOffset: -0.16,
  },
  {
    key: "progress_old_trash_rose_02",
    type: "dirty",
    texture: "dirty_soil_rubble",
    dedicatedPointKey: "progress_rose_02",
    requiresDedicatedPoint: true,
    width: 88,
    height: 53,
    showUntilLevel: 5,
  },
  {
    key: "progress_rose_02",
    texture: "progress_rose_bush",
    frame: 0,
    growthFrames: true,
    requiresDedicatedPoint: true,
    width: 96,
    height: 96,
    showFromLevel: 6,
    depthOffset: -0.16,
  },
  {
    key: "progress_old_trash_small_tree_01",
    type: "dirty",
    texture: "dirty_cardboard_pile",
    dedicatedPointKey: "progress_small_tree_01",
    requiresDedicatedPoint: true,
    width: 76,
    height: 46,
    showUntilLevel: 3,
  },
  {
    key: "progress_small_tree_01",
    texture: "progress_small_tree",
    frame: 0,
    growthFrames: true,
    requiresDedicatedPoint: true,
    width: 76,
    height: 76,
    showFromLevel: 4,
    depthOffset: -0.18,
  },
  {
    key: "progress_old_trash_small_tree_02",
    type: "dirty",
    texture: "dirty_concrete_scrap",
    dedicatedPointKey: "progress_small_tree_02",
    requiresDedicatedPoint: true,
    width: 76,
    height: 46,
    showUntilLevel: 4,
  },
  {
    key: "progress_small_tree_02",
    texture: "progress_small_tree",
    frame: 0,
    growthFrames: true,
    requiresDedicatedPoint: true,
    width: 76,
    height: 76,
    showFromLevel: 5,
    depthOffset: -0.18,
  },
  {
    key: "progress_old_trash_small_tree_03",
    type: "dirty",
    texture: "dirty_paper_rubble",
    dedicatedPointKey: "progress_small_tree_03",
    requiresDedicatedPoint: true,
    width: 76,
    height: 46,
    showUntilLevel: 5,
  },
  {
    key: "progress_small_tree_03",
    texture: "progress_small_tree",
    frame: 0,
    growthFrames: true,
    requiresDedicatedPoint: true,
    width: 76,
    height: 76,
    showFromLevel: 6,
    depthOffset: -0.18,
  },
  {
    key: "progress_old_trash_small_tree_04",
    type: "dirty",
    texture: "dirty_spilled_bin",
    dedicatedPointKey: "progress_small_tree_04",
    requiresDedicatedPoint: true,
    width: 76,
    height: 46,
    showUntilLevel: 6,
  },
  {
    key: "progress_small_tree_04",
    texture: "progress_small_tree",
    frame: 0,
    growthFrames: true,
    requiresDedicatedPoint: true,
    width: 76,
    height: 76,
    showFromLevel: 7,
    depthOffset: -0.18,
  },
  {
    key: "progress_old_trash_tree_01",
    type: "dirty",
    texture: "dirty_trash_bags",
    dedicatedPointKey: "progress_tree_01",
    requiresDedicatedPoint: true,
    width: 98,
    height: 59,
    showUntilLevel: 5,
  },
  {
    key: "progress_tree_01",
    texture: "progress_broad_tree_b",
    frame: 0,
    growthFrames: true,
    requiresDedicatedPoint: true,
    width: 132,
    height: 132,
    showFromLevel: 6,
    depthOffset: -0.14,
  },
  {
    key: "progress_old_trash_pine_01",
    type: "dirty",
    texture: "dirty_soil_rubble",
    dedicatedPointKey: "progress_pine_01",
    requiresDedicatedPoint: true,
    width: 96,
    height: 58,
    showUntilLevel: 6,
  },
  {
    key: "progress_pine_01",
    texture: "progress_pine_tree",
    frame: 0,
    growthFrames: true,
    requiresDedicatedPoint: true,
    width: 124,
    height: 124,
    showFromLevel: 7,
    depthOffset: -0.14,
  },
  {
    key: "progress_bench_recovered",
    texture: "sunisuni_bench",
    requiresDedicatedPoint: true,
    fallback: { x: 790, y: 670 },
    width: 116,
    height: 76,
    showFromLevel: 5,
  },
  {
    key: "progress_tree_recovered",
    texture: "progress_broad_tree_a",
    frame: 0,
    growthFrames: true,
    requiresDedicatedPoint: true,
    fallback: { x: 1280, y: 640 },
    width: 156,
    height: 156,
    showFromLevel: 6,
    depthOffset: -0.12,
  },
  {
    key: "progress_small_tree_recovered",
    texture: "progress_small_tree",
    frame: 0,
    growthFrames: true,
    requiresDedicatedPoint: true,
    fallback: { x: 500, y: 616 },
    width: 120,
    height: 120,
    showFromLevel: 3,
    depthOffset: -0.16,
  },
  {
    key: "progress_rose_recovered",
    texture: "progress_rose_bush",
    frame: 0,
    growthFrames: true,
    requiresDedicatedPoint: true,
    fallback: { x: 612, y: 472 },
    width: 120,
    height: 120,
    showFromLevel: 4,
    depthOffset: -0.16,
  },
  {
    key: "progress_pine_recovered",
    texture: "progress_pine_tree",
    frame: 0,
    growthFrames: true,
    requiresDedicatedPoint: true,
    fallback: { x: 1440, y: 500 },
    width: 142,
    height: 142,
    showFromLevel: 5,
    depthOffset: -0.16,
  },
  {
    key: "progress_lamp_recovered",
    texture: "street_lamp",
    requiresDedicatedPoint: true,
    fallback: { x: 965, y: 500 },
    width: 42,
    height: 104,
    showFromLevel: 7,
  },
];

const STAGE_FRAMES = [
  [0, 0, 0, 0],
  [1, 0, 0, 0],
  [2, 1, 0, 0],
  [3, 2, 1, 0],
  [3, 3, 3, 3],
];

const STAGE_MESSAGES = {
  1: "삼각지에 작은 꽃이 피고 있어요.",
  2: "삼각지에 꽃이 더 많이 피고 있어요.",
  3: "삼각지에 나비가 오고 있어요.",
  4: "삼각지가 꽃과 나비로 더 밝아지고 있어요.",
};

export default class NeighborhoodProgressSystem {
  constructor(scene) {
    this.scene = scene;
    this.flowerbeds = [];
    this.butterflies = [];
    this.progressProps = [];
    this.lastEvaluatedStage = -1;
    this.lastVisualLevel = -1;
    this.progressColliders = [];
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
    this.createProgressProps();
    this.refresh({ silent: true });
  }

  update() {
    const nextStage = this.getEligibleStage();
    const nextVisualLevel = this.getVisualLevel();
    if (
      nextStage === this.lastEvaluatedStage
      && nextStage === this.scene.neighborhoodBloom?.stage
      && nextVisualLevel === this.lastVisualLevel
    ) {
      return;
    }
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
    this.lastVisualLevel = this.getVisualLevel();
    this.applyFlowerbedFrames(nextStage);
    this.applyProgressPropVisibility(this.lastVisualLevel);
    this.syncButterflies(nextStage);

    if (didAdvance && !silent) {
      this.showStageMessage(nextStage);
      this.scene.saveCheckpoint?.(`neighborhood_bloom_stage_${nextStage}`);
    }
  }

  getEligibleStage() {
    const level = this.getVisualLevel();
    if (level >= 9) return 4;
    if (level >= 7) return 3;
    if (level >= 5) return 2;
    if (level >= 3) return 1;
    return 0;
  }

  getVisualLevel() {
    const fromSystem = this.scene.samgakjiProgressSystem?.getCurrentLevel?.();
    const fromState = this.scene.samgakjiProgress?.currentLevel;
    const level = Number(fromSystem || fromState || 1);
    return Phaser.Math.Clamp(Number.isFinite(level) ? level : 1, 1, 16);
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

  createProgressProps() {
    this.destroyProgressProps();

    this.getProgressPropConfigs().forEach((config) => {
      const point = this.getProgressPropPoint(config);
      if (!point) return;
      const resolvedConfig = this.getProgressPropConfig(config);
      const prop = resolvedConfig.type === "dirty"
        ? this.createDirtyProgressProp(point.x, point.y, resolvedConfig)
        : this.createTextureProgressProp(point.x, point.y, resolvedConfig);

      if (!prop) return;
      const depthY = point.y + (resolvedConfig.depthSortOffsetY ?? 0);
      prop.setData?.("depthSortY", depthY);
      prop.setData?.("neighborhoodDecoration", true);
      prop.setData?.("progressConfig", resolvedConfig);
      prop.setDepth?.(this.scene.getWorldDepth(depthY, resolvedConfig.depthOffset ?? -0.2));
      prop.setName?.(resolvedConfig.key);
      if (resolvedConfig.blocksMovement) {
        prop.setData?.("progressCollider", this.createProgressPropCollider(point.x, point.y, resolvedConfig));
      }
      this.progressProps.push(prop);
    });
  }

  getProgressPropConfigs() {
    return [
      ...STATIC_PROGRESS_PROPS,
      ...this.getTiledProgressPropConfigs(),
    ];
  }

  getTiledProgressPropConfigs() {
    const metaEntries = Object.entries(this.scene.mapPointMeta || {});
    const staticKeys = new Set(STATIC_PROGRESS_PROPS.flatMap((config) => [
      config.key,
      config.dedicatedPointKey,
    ]).filter(Boolean));

    return metaEntries
      .filter(([anchorKey, meta]) => {
        if (staticKeys.has(anchorKey)) return false;
        return this.isTruthy(meta?.properties?.progressObject);
      })
      .map(([anchorKey, meta]) => this.createTiledProgressPropConfig(anchorKey, meta))
      .filter(Boolean);
  }

  createTiledProgressPropConfig(anchorKey, meta) {
    const props = meta?.properties || {};
    const texture = typeof props.texture === "string" ? props.texture.trim() : "";
    if (!texture) return null;

    const key = typeof props.progressKey === "string" && props.progressKey.trim()
      ? props.progressKey.trim()
      : anchorKey;
    const progressType = typeof props.progressType === "string" ? props.progressType.trim() : "";
    const width = Number(meta?.width) > 0 ? Number(meta.width) : 96;
    const height = Number(meta?.height) > 0 ? Number(meta.height) : 96;

    return {
      key,
      dedicatedPointKey: anchorKey,
      requiresDedicatedPoint: true,
      texture,
      type: progressType === "dirty" ? "dirty" : undefined,
      width,
      height,
      showFromLevel: 1,
      showUntilLevel: 16,
    };
  }

  getProgressPropConfig(config) {
    const meta = this.getProgressPropMeta(config);
    const props = meta?.properties || {};
    const resolved = { ...config };

    this.assignStringProp(resolved, props, "texture");
    this.assignNumberProp(resolved, props, "width");
    this.assignNumberProp(resolved, props, "height");
    this.assignNumberProp(resolved, props, "displayWidth", "width");
    this.assignNumberProp(resolved, props, "displayHeight", "height");
    this.assignNumberProp(resolved, props, "frame");
    this.assignNumberProp(resolved, props, "showFromLevel");
    this.assignNumberProp(resolved, props, "showUntilLevel");
    this.assignNumberProp(resolved, props, "growthStartLevel");
    this.assignNumberProp(resolved, props, "maxFrame");
    this.assignNumberProp(resolved, props, "originX");
    this.assignNumberProp(resolved, props, "originY");
    this.assignNumberProp(resolved, props, "depthOffset");
    this.assignNumberProp(resolved, props, "depthSortOffsetY");
    this.assignNumberProp(resolved, props, "collisionWidth");
    this.assignNumberProp(resolved, props, "collisionHeight");
    this.assignNumberProp(resolved, props, "collisionOffsetX");
    this.assignNumberProp(resolved, props, "collisionOffsetY");
    this.assignBooleanProp(resolved, props, "blocksMovement");
    this.assignBooleanProp(resolved, props, "growthFrames");

    if (Number(meta?.width) > 0 && props.width === undefined && props.displayWidth === undefined) {
      resolved.width = Number(meta.width);
    }
    if (Number(meta?.height) > 0 && props.height === undefined && props.displayHeight === undefined) {
      resolved.height = Number(meta.height);
    }

    return resolved;
  }

  getProgressPropMeta(config) {
    const meta = this.scene.mapPointMeta || {};
    return meta[config.key] || meta[config.dedicatedPointKey] || null;
  }

  assignStringProp(target, props, propName, targetName = propName) {
    if (typeof props[propName] === "string" && props[propName].trim()) {
      target[targetName] = props[propName].trim();
    }
  }

  assignNumberProp(target, props, propName, targetName = propName) {
    if (props[propName] === undefined || props[propName] === null || props[propName] === "") return;
    const value = Number(props[propName]);
    if (Number.isFinite(value)) target[targetName] = value;
  }

  assignBooleanProp(target, props, propName, targetName = propName) {
    if (props[propName] === undefined || props[propName] === null || props[propName] === "") return;
    const value = props[propName];
    target[targetName] = this.isTruthy(value);
  }

  isTruthy(value) {
    return value === true || value === "true" || value === 1 || value === "1";
  }

  createProgressPropCollider(x, y, config) {
    if (!this.scene.objectWalls) {
      this.scene.objectWalls = this.scene.physics.add.staticGroup();
    }

    const width = config.collisionWidth ?? Math.max(42, (config.width ?? 96) * 0.62);
    const height = config.collisionHeight ?? Math.max(24, (config.height ?? 64) * 0.38);
    const centerX = x + (config.collisionOffsetX ?? 0);
    const centerY = y - height / 2 + (config.collisionOffsetY ?? 0);
    const zone = this.scene.add.zone(centerX, centerY, width, height);
    this.scene.physics.add.existing(zone, true);
    zone.setName(`${config.key}_collider`);
    zone.setData("progressColliderKey", config.key);
    this.scene.objectWalls.add(zone);
    this.progressColliders.push(zone);
    return zone;
  }

  getProgressPropPoint(config) {
    const dedicatedPoint = this.scene.mapPoints?.[config.key]
      || this.scene.mapPoints?.[config.dedicatedPointKey];
    if (dedicatedPoint) return dedicatedPoint;

    if (config.requiresDedicatedPoint) return null;

    const pointKeys = [
      config.pointKey,
      config.replacedMapObjectKey,
    ].filter(Boolean);

    const mapPoints = this.scene.mapPoints || {};
    const explicitKey = pointKeys.find((key) => mapPoints[key]);
    if (explicitKey) return mapPoints[explicitKey];

    return config.fallback;
  }

  createTextureProgressProp(x, y, config) {
    if (!config.texture || !this.scene.textures.exists(config.texture)) return null;
    const prop = Number.isInteger(config.frame)
      ? this.scene.add.sprite(x, y, config.texture, config.frame)
      : this.scene.add.image(x, y, config.texture);
    prop.setOrigin(config.originX ?? 0.5, config.originY ?? 1);
    prop.setDisplaySize(config.width, config.height);
    return prop;
  }

  createDirtyProgressProp(x, y, config) {
    return this.createTextureProgressProp(x, y, config)
      || this.createFallbackDirtyProp(x, y, config);
  }

  createFallbackDirtyProp(x, y, config) {
    const container = this.scene.add.container(x, y);
    const width = config.width ?? 128;
    const height = config.height ?? 44;
    const base = this.scene.add.ellipse(0, -height * 0.35, width, height, 0x5f5547, 0.78);
    const soil = this.scene.add.ellipse(-width * 0.18, -height * 0.42, width * 0.55, height * 0.52, 0x3e342c, 0.68);
    const scrap = this.scene.add.rectangle(width * 0.18, -height * 0.58, width * 0.34, height * 0.18, 0x8a8274, 0.8);
    const weed = this.scene.add.ellipse(width * 0.03, -height * 0.76, width * 0.18, height * 0.42, 0x4e6d3b, 0.75);
    scrap.setAngle(-8);
    weed.setAngle(18);
    container.add([base, soil, scrap, weed]);
    container.setSize(width, height);
    return container;
  }

  applyProgressPropVisibility(level) {
    let didCollisionStateChange = false;
    this.applyReplacedMapObjectVisibility(level);
    this.progressProps.forEach((prop) => {
      const config = prop.getData?.("progressConfig") || {};
      const showFromLevel = config.showFromLevel ?? 1;
      const showUntilLevel = config.showUntilLevel ?? 16;
      const isVisible = level >= showFromLevel && level <= showUntilLevel;
      const wasVisible = prop.getData?.("progressWasVisible");
      prop.setVisible?.(isVisible);
      prop.setData?.("progressWasVisible", isVisible);
      this.applyProgressPropFrame(prop, config, level);
      if (wasVisible !== isVisible && prop.getData?.("progressCollider")) {
        didCollisionStateChange = true;
      }
      this.syncProgressCollider(prop.getData?.("progressCollider"), isVisible);
    });

    if (didCollisionStateChange) {
      this.scene.pathfindingSystem?.initializeGrid?.();
    }
  }

  applyProgressPropFrame(prop, config, level) {
    if (!config.growthFrames || !prop?.setFrame) return;

    const startLevel = config.growthStartLevel ?? config.showFromLevel ?? 1;
    const maxFrame = config.maxFrame ?? 3;
    const frame = Phaser.Math.Clamp(level - startLevel, 0, maxFrame);
    prop.setFrame(frame);
  }

  applyReplacedMapObjectVisibility(level) {
    this.getProgressPropConfigs().forEach((config) => {
      if (!config.replacedMapObjectKey) return;
      const mapObject = this.scene.mapObjects?.[config.replacedMapObjectKey];
      if (!mapObject) return;

      const revealLevel = config.revealMapObjectFromLevel ?? ((config.showUntilLevel ?? 0) + 1);
      const isVisible = level >= revealLevel;
      mapObject.setVisible?.(isVisible);
      mapObject.setActive?.(isVisible);
    });
  }

  syncProgressCollider(collider, isActive) {
    if (!collider?.body) return;
    collider.body.enable = Boolean(isActive);
    this.removeProgressCollisionRect(collider);
    if (!isActive) return;

    this.scene.objectCollisionRects = this.scene.objectCollisionRects || [];
    const rect = new Phaser.Geom.Rectangle(
      collider.x - collider.width / 2,
      collider.y - collider.height / 2,
      collider.width,
      collider.height,
    );
    rect.progressColliderKey = collider.getData?.("progressColliderKey");
    this.scene.objectCollisionRects.push(rect);
  }

  removeProgressCollisionRect(collider) {
    const key = collider?.getData?.("progressColliderKey");
    if (!key || !Array.isArray(this.scene.objectCollisionRects)) return;
    this.scene.objectCollisionRects = this.scene.objectCollisionRects.filter((rect) => rect.progressColliderKey !== key);
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

  destroyProgressProps() {
    this.progressColliders.forEach((collider) => {
      this.removeProgressCollisionRect(collider);
      collider?.destroy?.();
    });
    this.progressColliders = [];
    this.progressProps.forEach((prop) => prop?.destroy?.());
    this.progressProps = [];
  }

  destroy() {
    this.destroyFlowerbeds();
    this.destroyProgressProps();
    this.butterflies.forEach((butterfly) => {
      butterfly?.tween?.remove?.();
      butterfly?.sprite?.destroy?.();
    });
    this.butterflies = [];
  }
}
