import { GAME_CONFIG, TILED_MAP_CONFIG, WORLD_TILED_MAP_CONFIGS } from "../config/GameConstants.js";

export default class TiledMapSystem {
  constructor(scene) {
    this.scene = scene;
  }

  createMap() {
    const scene = this.scene;
    scene.objectWalls = scene.physics.add.staticGroup();
    scene.objectCollisionRects = [];
    scene.mapObjects = {};
    scene.mapPoints = scene.mapPoints || {};
    scene.mapPointMeta = {};
    scene.currentWorldMapId = scene.currentWorldMapId || TILED_MAP_CONFIG.id;

    if (this.createTiledMap()) {
      return;
    }

    this.createFallbackMap();
  }

  createFallbackMap() {
    const scene = this.scene;
    scene.physics.world.setBounds(0, 0, GAME_CONFIG.worldWidth, GAME_CONFIG.worldHeight);
    scene.cameras.main.setBounds(0, 0, GAME_CONFIG.worldWidth, GAME_CONFIG.worldHeight);

    scene.add.rectangle(768, 480, GAME_CONFIG.worldWidth, GAME_CONFIG.worldHeight, 0x6c7a55);
    this.addTiledRect(768, 480, GAME_CONFIG.worldWidth, GAME_CONFIG.worldHeight, "grass_tile");

    this.addTiledRect(475, 420, 1200, 118, "path_tile");
    this.addTiledRect(652, 392, 122, 386, "path_tile");
    this.addTiledRect(870, 300, 910, 104, "path_tile", -18);
    this.addTiledRect(1012, 512, 690, 78, "sidewalk_tile", -14);
    this.addTiledRect(480, 625, 830, 82, "sidewalk_tile", -18);
    this.addTiledRect(176, 650, 352, 82, "path_tile");
    this.addTiledRect(168, 760, 336, 88, "sidewalk_tile", -18);
    scene.add.ellipse(650, 420, 194, 154, 0xd8c59a);

    scene.add.rectangle(1090, 690, 426, 274, 0xb8c1bd);
    this.addTiledRect(1090, 690, 342, 190, "building_tile");
    scene.add.rectangle(1090, 575, 240, 18, 0xe8f3ef);
    scene.add.rectangle(1390, 480, 292, GAME_CONFIG.worldHeight, 0x52645d);
    this.addTiledRect(1442, 480, 112, GAME_CONFIG.worldHeight, "road_tile");
    scene.add.rectangle(1478, 480, 6, 900, 0xffffff).setAngle(-12);

    scene.add.rectangle(310, 226, 500, 96, 0x60704c);
    scene.add.rectangle(260, 710, 460, 92, 0x60704c);
    scene.add.rectangle(934, 226, 140, 62, 0x60704c);

    this.addTiledRect(158, 342, 316, 172, "garden_tile");
    this.addTiledRect(180, 540, 360, 128, "garden_tile");
    this.addTiledRect(502, 350, 170, 84, "garden_tile");
    this.addTiledRect(246, 526, 270, 148, "garden_tile");
    this.addTiledRect(1030, 418, 310, 132, "garden_tile");
    this.addTiledRect(1028, 496, 286, 110, "grass_tile");

    scene.walls = scene.physics.add.staticGroup();
    this.addWall(768, 30, GAME_CONFIG.worldWidth, 60);
    this.addWall(768, 930, GAME_CONFIG.worldWidth, 60);
    this.addWall(30, 480, 60, GAME_CONFIG.worldHeight);
    this.addWall(1506, 480, 60, GAME_CONFIG.worldHeight);
    this.addWall(370, 226, 360, 86);
    this.addWall(330, 710, 310, 82);
    this.addWall(1090, 690, 410, 258);
    this.addWall(1390, 480, 292, GAME_CONFIG.worldHeight);
    this.addWall(934, 226, 130, 52);
  }

  addWall(x, y, width, height) {
    const scene = this.scene;
    const wall = scene.add.rectangle(x, y, width, height, 0x6c7a55);
    wall.setVisible(false);
    scene.physics.add.existing(wall, true);
    scene.walls.add(wall);
  }

  addTiledRect(x, y, width, height, texture, angle = 0) {
    const tile = this.scene.add.tileSprite(x, y, width, height, texture);
    tile.setAngle(angle);
    return tile;
  }

  createTiledMap() {
    const scene = this.scene;
    const mapConfig = this.getActiveMapConfig();
    if (!scene.cache.tilemap.exists(mapConfig.key)) {
      return false;
    }

    const map = scene.make.tilemap({ key: mapConfig.key });
    const tilesets = this.createTiledTilesets(map, mapConfig);
    if (!tilesets.length) {
      return false;
    }

    scene.activeTilemap = map;
    scene.tiledMapLayers = [];
    const worldWidth = map.widthInPixels || GAME_CONFIG.worldWidth;
    const worldHeight = map.heightInPixels || GAME_CONFIG.worldHeight;
    scene.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    scene.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

    mapConfig.visibleLayers.forEach((layerName, index) => {
      const layer = map.getLayer(layerName);
      if (layer) {
        const createdLayer = map.createLayer(layerName, tilesets, 0, 0).setDepth(index);
        scene.tiledMapLayers.push(createdLayer);
      }
    });

    const collisionSource = map.getLayer(mapConfig.collisionLayer);
    if (collisionSource) {
      scene.walls = map.createLayer(mapConfig.collisionLayer, tilesets, 0, 0);
      scene.walls.setVisible(false);
      scene.walls.setCollisionByExclusion([-1]);
      scene.tiledMapLayers.push(scene.walls);
    } else {
      scene.walls = scene.physics.add.staticGroup();
    }

    this.applyTiledObjects(map, mapConfig);
    this.createTiledMapObjects(map, mapConfig);
    if (mapConfig.enableCodeDecorations !== false) {
      this.createCodeMapDecorations();
    }
    return true;
  }

  getActiveMapConfig() {
    return WORLD_TILED_MAP_CONFIGS[this.scene.currentWorldMapId] || TILED_MAP_CONFIG;
  }

  switchMap(mapId, spawnKey, fallbackSpawn = null) {
    const scene = this.scene;
    const nextConfig = WORLD_TILED_MAP_CONFIGS[mapId];
    if (!nextConfig) return false;

    const previousMapId = scene.currentWorldMapId || TILED_MAP_CONFIG.id;
    const previousSpawn = scene.player?.active
      ? { x: scene.player.x, y: scene.player.y }
      : scene.playerStart;

    this.destroyCurrentTiledMap();
    scene.currentWorldMapId = nextConfig.id;
    scene.objectWalls = scene.physics.add.staticGroup();
    scene.objectCollisionRects = [];
    scene.mapObjects = {};
    scene.mapPoints = {};
    scene.mapPointMeta = {};

    if (!this.createTiledMap()) {
      this.restorePreviousMap(previousMapId, previousSpawn);
      return false;
    }

    const spawn = this.getMapPoint(spawnKey, fallbackSpawn || scene.playerStart || { x: 320, y: 544 });
    if (spawn) {
      scene.playerStart = { x: spawn.x, y: spawn.y };
      if (scene.player) {
        scene.player.setPosition(spawn.x, spawn.y);
        scene.player.body?.reset?.(spawn.x, spawn.y);
        scene.playerController?.cancelMoveTarget?.();
        scene.mouseMoveTarget = null;
      }
    }

    if (scene.player && scene.walls) {
      scene.physics.add.collider(scene.player, scene.walls);
    }
    if (scene.player && scene.objectWalls) {
      scene.physics.add.collider(scene.player, scene.objectWalls);
    }
    scene.pathfindingSystem?.create?.();
    scene.updateCameraZoom?.();
    return true;
  }

  restorePreviousMap(previousMapId, previousSpawn = null) {
    const scene = this.scene;

    this.destroyCurrentTiledMap();
    scene.currentWorldMapId = previousMapId || TILED_MAP_CONFIG.id;
    scene.objectWalls = scene.physics.add.staticGroup();
    scene.objectCollisionRects = [];
    scene.mapObjects = {};
    scene.mapPoints = {};
    scene.mapPointMeta = {};

    if (!this.createTiledMap()) {
      this.createFallbackMap();
    }

    const spawn = previousSpawn || scene.playerStart || { x: 320, y: 544 };
    scene.playerStart = { x: spawn.x, y: spawn.y };
    if (scene.player) {
      scene.player.setPosition(spawn.x, spawn.y);
      scene.player.body?.reset?.(spawn.x, spawn.y);
      scene.playerController?.cancelMoveTarget?.();
      scene.mouseMoveTarget = null;
    }

    if (scene.player && scene.walls) {
      scene.physics.add.collider(scene.player, scene.walls);
    }
    if (scene.player && scene.objectWalls) {
      scene.physics.add.collider(scene.player, scene.objectWalls);
    }
    scene.pathfindingSystem?.create?.();
    scene.updateCameraZoom?.();
  }

  destroyCurrentTiledMap() {
    const scene = this.scene;

    scene.tiledMapLayers?.forEach((layer) => layer?.destroy?.());
    scene.tiledMapLayers = [];

    Object.values(scene.mapObjects || {}).forEach((object) => object?.destroy?.());
    scene.mapObjects = {};

    scene.walls?.destroy?.();
    scene.objectWalls?.clear?.(true, true);
    scene.objectWalls?.destroy?.();
    scene.objectCollisionRects = [];
    scene.activeTilemap = null;
  }

  createTiledTilesets(map, mapConfig = this.getActiveMapConfig()) {
    return map.tilesets
      .map((sourceTileset) => {
        const textureKey = this.getTiledTilesetTextureKey(sourceTileset, mapConfig);
        if (!textureKey) return null;
        return map.addTilesetImage(sourceTileset.name, textureKey);
      })
      .filter(Boolean);
  }

  getTiledTilesetTextureKey(sourceTileset, mapConfig = this.getActiveMapConfig()) {
    const scene = this.scene;
    if (scene.textures.exists(sourceTileset.name)) {
      return sourceTileset.name;
    }

    if (
      sourceTileset.name === mapConfig.tilesetName
      && scene.textures.exists(mapConfig.tilesetImageKey)
    ) {
      return mapConfig.tilesetImageKey;
    }

    console.warn(`Missing tileset texture: ${sourceTileset.name}`);
    return null;
  }

  applyTiledObjects(map, mapConfig = this.getActiveMapConfig()) {
    const scene = this.scene;
    const objectLayer = map.getObjectLayer(mapConfig.objectLayer);
    if (!objectLayer) {
      return;
    }

    const slimeSpawnPoints = [];
    const flowerPositions = [];

    objectLayer.objects.forEach((object) => {
      const objectType = object.type || object.name;
      const x = object.x + (object.width || 0) / 2;
      const y = object.y + (object.height || 0) / 2;
      this.setMapPoint(object.name, x, y, object);
      if (objectType !== "logic_point") {
        this.setMapPoint(objectType, x, y, object);
      }

      if (objectType === "player_start") {
        scene.playerStart = { x, y };
      } else if (objectType === "broom_upgrade") {
        scene.broomSpawn = { x, y };
      } else if (objectType === "slime_spawn") {
        slimeSpawnPoints.push([x, y]);
      } else if (objectType === "flower") {
        flowerPositions.push([x, y]);
      }
    });

    scene.slimeSpawnPoints = slimeSpawnPoints;
    scene.finalFlowerPositions = flowerPositions.length > 0 ? flowerPositions : null;
  }

  setMapPoint(key, x, y, object = null) {
    if (!key || key === "slime_spawn" || key === "flower") return;
    this.scene.mapPoints[key] = { x, y };
    if (object) {
      this.scene.mapPointMeta = this.scene.mapPointMeta || {};
      this.scene.mapPointMeta[key] = {
        name: object.name || "",
        type: object.type || "",
        width: object.width || 0,
        height: object.height || 0,
        properties: this.getTiledObjectProperties(object),
      };
    }
  }

  getMapPoint(key, fallback) {
    return this.scene.mapPoints?.[key] || fallback;
  }

  getTiledObjectProperties(object) {
    return Object.fromEntries((object.properties || []).map((property) => [property.name, property.value]));
  }

  createTiledMapObjects(map, mapConfig = this.getActiveMapConfig()) {
    const scene = this.scene;
    const objectLayer = map.getObjectLayer(mapConfig.mapObjectsLayer);
    if (!objectLayer) return;

    objectLayer.objects.forEach((object) => {
      const props = this.getTiledObjectProperties(object);
      const textureKey = props.texture || object.type || object.name;
      if (!textureKey || !scene.textures.exists(textureKey)) return;

      const originX = Number(props.originX ?? 0.5);
      const originY = Number(props.originY ?? 1);
      const displayWidth = Number(props.displayWidth || object.width || 96);
      const displayHeight = Number(props.displayHeight || object.height || 96);
      const x = object.x + (object.width || displayWidth) * originX;
      const y = object.y + (object.height || displayHeight) * originY;
      const resolvedTexture = this.resolveMapObjectTexture(textureKey, object, props);
      const image = props.animation || Number.isInteger(resolvedTexture.frame)
        ? scene.add.sprite(x, y, resolvedTexture.key, Number(props.frame ?? resolvedTexture.frame ?? 0))
        : scene.add.image(x, y, resolvedTexture.key);

      image.setOrigin(originX, originY);
      image.setDisplaySize(displayWidth, displayHeight);
      const sortY = Number(props.sortY ?? scene.getDepthSortY(image));
      image.setData("depthSortY", sortY);
      image.setDepth(scene.getWorldDepth(sortY, Number(props.depthOffset ?? 0)));
      if (props.name) image.setName(props.name);
      const objectKey = props.name || object.name;
      if (objectKey) {
        scene.mapObjects[objectKey] = image;
        this.setMapPoint(objectKey, x, y);
        if (["hospital", "pharmacy", "clothing_store", "convenience_store"].includes(objectKey)) {
          this.setupBuildingInteractive(image, objectKey);
        }
      }
      if (props.animation && image.anims) {
        image.anims.play(props.animation);
      }

      if (this.shouldMapObjectCollide(object, props, textureKey)) {
        this.addMapObjectCollider(object, props, x, y, displayWidth, displayHeight, textureKey);
      }
    });
  }

  resolveMapObjectTexture(textureKey, object, props = {}) {
    if (props.textureOverride && this.scene.textures.exists(props.textureOverride)) {
      return {
        key: props.textureOverride,
        frame: Number.isFinite(Number(props.frame)) ? Number(props.frame) : undefined,
      };
    }

    if (textureKey === "sunisuni_tree") {
      const treeTextures = [
        "progress_broad_tree_a",
        "progress_broad_tree_b",
        "progress_broad_tree_c",
        "progress_pine_tree",
      ].filter((key) => this.scene.textures.exists(key));

      if (treeTextures.length > 0) {
        const name = object.name || "";
        const hash = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0);
        return {
          key: treeTextures[hash % treeTextures.length],
          frame: 3,
        };
      }
    }

    return { key: textureKey };
  }

  shouldMapObjectCollide(object, props, textureKey) {
    return props.codeCollides === true
      || props.codeCollides === "true"
      || props.collides === "code"
      || props.collisionSource === "code";
  }

  addMapObjectCollider(object, props, x, y, displayWidth, displayHeight, textureKey) {
    const defaults = this.getMapObjectColliderDefaults(object, textureKey, displayWidth, displayHeight);
    const width = Number(props.collisionWidth ?? defaults.width);
    const height = Number(props.collisionHeight ?? defaults.height);
    const offsetX = Number(props.collisionOffsetX ?? defaults.offsetX);
    const offsetY = Number(props.collisionOffsetY ?? defaults.offsetY);

    this.addObjectCollider(
      `${object.name || props.texture || "map_object"}_collider`,
      x + offsetX,
      y + offsetY,
      width,
      height,
    );
  }

  getMapObjectColliderDefaults(object, textureKey, displayWidth, displayHeight) {
    const name = `${object.name || ""} ${textureKey || ""}`.toLowerCase();

    if (name.includes("tree")) {
      const height = Math.max(24, displayHeight * 0.16);
      return {
        width: Math.max(32, displayWidth * 0.25),
        height,
        offsetX: 0,
        offsetY: -height * 0.65,
      };
    }

    if (name.includes("bench")) {
      const height = Math.max(26, displayHeight * 0.36);
      return {
        width: Math.max(82, displayWidth * 0.86),
        height,
        offsetX: 0,
        offsetY: -height * 0.55,
      };
    }

    if (["traffic", "pedestrian", "stop_sign", "crosswalk_sign"].some((keyword) => name.includes(keyword))) {
      const height = Math.max(18, displayHeight * 0.2);
      return {
        width: Math.max(18, displayWidth * 0.44),
        height,
        offsetX: 0,
        offsetY: -height * 0.55,
      };
    }

    const height = Math.max(32, displayHeight * 0.28);
    return {
      width: Math.max(96, displayWidth * 0.82),
      height,
      offsetX: 0,
      offsetY: -height * 0.5,
    };
  }

  addObjectCollider(name, x, y, width, height) {
    const scene = this.scene;
    if (!scene.objectWalls) {
      scene.objectWalls = scene.physics.add.staticGroup();
    }

    const zone = scene.add.zone(x, y, width, height);
    scene.physics.add.existing(zone, true);
    zone.setName(name);
    scene.objectWalls.add(zone);
    scene.objectCollisionRects.push(new Phaser.Geom.Rectangle(
      x - width / 2,
      y - height / 2,
      width,
      height,
    ));
    return zone;
  }

  createCodeMapDecorations() {
    this.createConvenienceStoreDecoration();
    this.createRecyclingCenterDecorations();
    this.createStreetLampDecorations();
  }

  createConvenienceStoreDecoration() {
    const scene = this.scene;
    const start = this.getMapPoint("player_start", scene.playerStart || { x: 320, y: 544 });
    const store = this.createDecorationObject({
      key: "convenience_store",
      pointKey: "convenience_store",
      textureKey: "convenience_store",
      fallback: { x: start.x + 104, y: start.y + 248 },
      displayWidth: 224,
      displayHeight: 168,
      collides: true,
      collisionWidth: 158,
      collisionHeight: 42,
      collisionOffsetY: -20,
    });
    if (store) {
      this.setupBuildingInteractive(store, "convenience_store");
    }
  }

  createRecyclingCenterDecorations() {
    const scene = this.scene;
    const center = this.getMapPoint("recycling_center", GAME_CONFIG.recyclingCenter);

    this.createDecorationObject({
      key: "recycling_center_sign",
      pointKey: "recycling_center_sign",
      textureKey: "recycling_center_sign",
      fallback: { x: center.x - 232, y: center.y + 34 },
      displayWidth: 134,
      displayHeight: 72,
      collides: true,
      collisionWidth: 78,
      collisionHeight: 24,
      collisionOffsetY: -16,
    });
  }

  createStreetLampDecorations() {
    const scene = this.scene;
    const center = this.getMapPoint("recycling_center", GAME_CONFIG.recyclingCenter);
    const vending = this.getMapPoint("vending_machine", GAME_CONFIG.vendingMachine);
    const crosswalk = this.getMapPoint("crosswalk_west", { x: 728, y: 236 });

    [
      {
        key: "street_lamp_recycling",
        pointKey: "street_lamp_recycling",
        fallback: { x: center.x + 266, y: center.y + 124 },
      },
      {
        key: "street_lamp_vending",
        pointKey: "street_lamp_vending",
        fallback: { x: vending.x + 92, y: vending.y + 54 },
      },
      {
        key: "street_lamp_crosswalk",
        pointKey: "street_lamp_crosswalk",
        fallback: { x: crosswalk.x - 60, y: crosswalk.y + 92 },
      },
    ].forEach((config) => {
      this.createDecorationObject({
        ...config,
        textureKey: "street_lamp",
        displayWidth: 42,
        displayHeight: 104,
        collides: true,
        collisionWidth: 24,
        collisionHeight: 24,
        collisionOffsetY: -12,
      });
    });
  }

  createDecorationObject({
    key,
    pointKey,
    textureKey,
    fallback,
    displayWidth,
    displayHeight,
    depthOffset = 0,
    collides = false,
    collisionWidth = 48,
    collisionHeight = 28,
    collisionOffsetX = 0,
    collisionOffsetY = 0,
  }) {
    const scene = this.scene;
    if (!key || scene.mapObjects?.[key] || !scene.textures.exists(textureKey)) {
      return null;
    }

    const point = this.getMapPoint(pointKey || key, fallback);
    if (!point) return null;

    const image = scene.add.image(point.x, point.y, textureKey);
    image.setOrigin(0.5, 1);
    image.setDisplaySize(displayWidth, displayHeight);
    image.setData("depthSortY", point.y);
    image.setDepth(scene.getWorldDepth(point.y, depthOffset));
    image.setName(key);
    scene.mapObjects[key] = image;

    if (collides) {
      this.addObjectCollider(
        `${key}_collider`,
        point.x + collisionOffsetX,
        point.y + collisionOffsetY,
        collisionWidth,
        collisionHeight,
      );
    }

    return image;
  }

  setupBuildingInteractive(image, key) {
    const scene = this.scene;
    image.setInteractive({ useHandCursor: true });
    image.on("pointerover", () => {
      image.setTint(0xffeb3b);
    });
    image.on("pointerout", () => {
      image.clearTint();
    });
    image.on("pointerdown", (pointer) => {
      const button = pointer.event?.button ?? pointer.button;
      if (button !== 0) return;
      if (!scene.player?.active || scene.sceneControlSystem?.isWorldInputBlocked()) return;
      if (!scene.stateManager?.canMove()) return;
      if (scene.isMissionComplete || scene.isInDialogue || scene.vendingMenuGroup || scene.clothingShopModal || scene.packingModal || scene.interiorSceneGroup) return;
      if (key === "convenience_store" && scene.hasCheckedConvenienceStore) return;

      pointer.event?.preventDefault();
      pointer.event?.stopPropagation();

      // 1. 이미 근처에 있다면 즉시 상호작용 실행!
      if (key === "hospital" && scene.interactionSystem?.isPlayerNearHospitalDoor()) {
        scene.handleHospitalInteraction();
        return;
      }
      if (key === "pharmacy" && scene.interactionSystem?.isPlayerNearPharmacyDoor()) {
        scene.handlePharmacyInteraction();
        return;
      }
      if (key === "clothing_store" && scene.interactionSystem?.isPlayerNearClothingStoreDoor()) {
        scene.handleClothingStoreInteraction();
        return;
      }
      if (key === "convenience_store" && scene.interactionSystem?.isPlayerNearConvenienceStoreDoor()) {
        scene.handleConvenienceStoreInteraction();
        return;
      }

      // 2. 멀리 있다면 A* 자율주행 시동!
      let doorPoint = null;
      if (key === "hospital") {
        doorPoint = scene.getMapPoint("hospital_door", GAME_CONFIG.hospitalDoor);
      } else if (key === "pharmacy") {
        doorPoint = scene.getMapPoint("pharmacy_door", GAME_CONFIG.pharmacyDoor);
      } else if (key === "clothing_store") {
        doorPoint = scene.getMapPoint("clothing_store_door", GAME_CONFIG.clothingStoreDoor);
      } else if (key === "convenience_store") {
        doorPoint = scene.getMapPoint("convenience_store_door", GAME_CONFIG.convenienceStoreDoor);
      }

      if (doorPoint && scene.pathfindingSystem) {
        const path = scene.pathfindingSystem.findPath(scene.player.x, scene.player.y, doorPoint.x, doorPoint.y);
        if (path && path.length > 0) {
          scene.playerController.movePath = path;
          scene.playerController.currentPathIndex = 0;
          scene.playerController.cleanTarget = null;
          scene.playerController.interactionTarget = key;
          scene.mouseMoveTarget = null;
        }
      }
    });
  }
}
