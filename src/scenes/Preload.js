import { EXTERNAL_ASSETS, SPRITESHEET_ASSETS, TILED_MAP, AUDIO_ASSETS, LAZY_IMAGE_KEYS, LAZY_AUDIO_KEYS } from "../config/AssetsData.js";

const TILED_TILESET_TEXT_KEY_PREFIX = "tiled_tileset_source:";

export default class Preload extends Phaser.Scene {
  constructor() {
    super("Preload");
  }

  preload() {
    EXTERNAL_ASSETS.forEach((asset) => {
      if (!LAZY_IMAGE_KEYS.includes(asset.key)) {
        this.load.image(asset.key, asset.path);
      }
    });
    SPRITESHEET_ASSETS.forEach((asset) => {
      this.load.spritesheet(asset.key, asset.path, {
        frameWidth: asset.frameWidth,
        frameHeight: asset.frameHeight,
      });
    });
    AUDIO_ASSETS.forEach((asset) => {
      if (!LAZY_AUDIO_KEYS.includes(asset.key)) {
        this.load.audio(asset.key, asset.path);
      }
    });
    this.load.json("dialogues", "src/data/dialogues.json");
    this.load.json(TILED_MAP.jsonKey, TILED_MAP.path);
    this.load.tilemapTiledJSON(TILED_MAP.key, TILED_MAP.path);
  }

  create() {
    const didQueueExternalTilesets = this.queueExternalTiledTilesetSources();
    if (didQueueExternalTilesets) {
      this.load.once(Phaser.Loader.Events.COMPLETE, () => {
        this.normalizeExternalTiledTilesets();
        this.queueTiledTilesetImagesThenFinish();
      });
      this.load.start();
      return;
    }

    this.normalizeExternalTiledTilesets();
    this.queueTiledTilesetImagesThenFinish();
  }

  queueTiledTilesetImagesThenFinish() {
    const didQueueTilesets = this.queueTiledTilesetImages();
    if (didQueueTilesets) {
      this.load.once(Phaser.Loader.Events.COMPLETE, () => this.finishCreate());
      this.load.start();
      return;
    }

    this.finishCreate();
  }

  finishCreate() {
    this.createMissingExternalTextures();
    this.createPlayerAnimations();
    this.createTrashAnimations();
    this.createVehicleAnimations();
    this.createTrafficLightAnimations();
    this.createBlockTexture("clean_tile", 32, 32, "#f6fff3", "#6fcf97");
    this.createBlockTexture("sweep_hitbox", 96, 72, "#fff3a3", "#f2c94c");

    this.scene.start("StartScene");
  }

  queueTiledTilesetImages() {
    const mapJson = this.cache.json.get(TILED_MAP.jsonKey);
    if (!mapJson?.tilesets?.length) return false;

    let queued = false;
    const queuedKeys = new Set();
    mapJson.tilesets.forEach((tileset) => {
      if (!tileset?.name || !tileset?.image) return;
      const textureKey = tileset.name;
      if (this.textures.exists(textureKey) || queuedKeys.has(textureKey)) return;

      this.load.image(textureKey, this.resolveTiledAssetPath(TILED_MAP.path, tileset.image));
      queuedKeys.add(textureKey);
      queued = true;
    });

    return queued;
  }

  queueExternalTiledTilesetSources() {
    const mapJson = this.cache.json.get(TILED_MAP.jsonKey);
    if (!mapJson?.tilesets?.length) return false;

    let queued = false;
    const queuedKeys = new Set();
    mapJson.tilesets.forEach((tileset) => {
      if (!tileset?.source || tileset.image) return;
      const sourcePath = this.resolveTiledAssetPath(TILED_MAP.path, tileset.source);
      const textKey = this.getTiledTilesetTextKey(sourcePath);
      if (this.cache.text.exists(textKey) || queuedKeys.has(textKey)) return;

      this.load.text(textKey, sourcePath);
      queuedKeys.add(textKey);
      queued = true;
    });

    return queued;
  }

  normalizeExternalTiledTilesets() {
    const mapJson = this.cache.json.get(TILED_MAP.jsonKey);
    if (!mapJson?.tilesets?.length) return;

    let didChange = false;
    const normalizedTilesets = mapJson.tilesets.map((tileset) => {
      if (!tileset?.source || tileset.image) return tileset;

      const sourcePath = this.resolveTiledAssetPath(TILED_MAP.path, tileset.source);
      const textKey = this.getTiledTilesetTextKey(sourcePath);
      const tilesetText = this.cache.text.get(textKey);
      const externalTileset = this.parseTiledTilesetSource(tilesetText, sourcePath);
      if (!externalTileset) {
        console.warn(`Unable to read external Tiled tileset: ${tileset.source}`);
        return tileset;
      }

      didChange = true;
      return {
        firstgid: tileset.firstgid,
        ...externalTileset,
      };
    });

    if (!didChange) return;

    mapJson.tilesets = normalizedTilesets;
    const tilemapCacheEntry = this.cache.tilemap.get(TILED_MAP.key);
    const tilemapData = tilemapCacheEntry?.data || tilemapCacheEntry;
    if (tilemapData?.tilesets) {
      tilemapData.tilesets = normalizedTilesets.map((tileset) => ({ ...tileset }));
    }
  }

  parseTiledTilesetSource(tilesetText, sourcePath) {
    if (!tilesetText || typeof DOMParser === "undefined") return null;

    const doc = new DOMParser().parseFromString(tilesetText, "application/xml");
    if (doc.querySelector("parsererror")) return null;

    const tileset = doc.querySelector("tileset");
    const image = doc.querySelector("tileset > image");
    if (!tileset?.getAttribute("name") || !image?.getAttribute("source")) return null;

    return {
      columns: Number(tileset.getAttribute("columns") || 0),
      image: this.resolveTiledAssetPath(sourcePath, image.getAttribute("source")),
      imageheight: Number(image.getAttribute("height") || 0),
      imagewidth: Number(image.getAttribute("width") || 0),
      margin: Number(tileset.getAttribute("margin") || 0),
      name: tileset.getAttribute("name"),
      spacing: Number(tileset.getAttribute("spacing") || 0),
      tilecount: Number(tileset.getAttribute("tilecount") || 0),
      tileheight: Number(tileset.getAttribute("tileheight") || 32),
      tilewidth: Number(tileset.getAttribute("tilewidth") || 32),
    };
  }

  getTiledTilesetTextKey(sourcePath) {
    return `${TILED_TILESET_TEXT_KEY_PREFIX}${sourcePath}`;
  }

  resolveTiledAssetPath(mapPath, assetPath) {
    if (/^(https?:)?\/\//.test(assetPath) || assetPath.startsWith("/")) {
      return assetPath;
    }

    const normalizedAssetPath = assetPath.replaceAll("\\", "/");
    if (/^(assets|src|vendor)\//.test(normalizedAssetPath)) {
      return normalizedAssetPath;
    }

    const baseParts = mapPath.split("/").slice(0, -1);
    const parts = [...baseParts, ...normalizedAssetPath.split("/")];
    const normalized = [];
    parts.forEach((part) => {
      if (!part || part === ".") return;
      if (part === "..") {
        normalized.pop();
        return;
      }
      normalized.push(part);
    });
    return normalized.join("/");
  }

  createPlayerAnimations() {
    const walkAnimations = [
      ["haenaem_walk_down_anim", "haenaem_walk_down"],
      ["haenaem_walk_up_anim", "haenaem_walk_up"],
      ["haenaem_walk_left_anim", "haenaem_walk_left"],
      ["haenaem_walk_right_anim", "haenaem_walk_right"],
      ["yeobi_walk_down_anim", "yeobi_walk_down"],
      ["yeobi_walk_up_anim", "yeobi_walk_up"],
      ["yeobi_walk_left_anim", "yeobi_walk_left"],
      ["yeobi_walk_right_anim", "yeobi_walk_right"],
      ["sunisuni_walk_down_anim", "sunisuni_walk_down"],
      ["sunisuni_walk_up_anim", "sunisuni_walk_up"],
      ["sunisuni_walk_left_anim", "sunisuni_walk_left"],
      ["sunisuni_walk_right_anim", "sunisuni_walk_right"],
      ["jjook_walk_down_anim", "jjook_walk_down"],
      ["jjook_walk_up_anim", "jjook_walk_up"],
      ["jjook_walk_left_anim", "jjook_walk_left"],
      ["jjook_walk_right_anim", "jjook_walk_right"],
    ];

    walkAnimations.forEach(([animKey, textureKey]) => {
      if (!this.textures.exists(textureKey) || this.anims.exists(animKey)) return;
      this.anims.create({
        key: animKey,
        frames: this.anims.generateFrameNumbers(textureKey, { frames: [0, 1, 2, 1] }),
        frameRate: 7,
        repeat: -1,
      });
    });

    const sweepAnimations = [
      ["haenaem_sweep_down_anim", "haenaem_sweep_down", 3, 8],
      ["haenaem_sweep_up_anim", "haenaem_sweep_up", 3, 8],
      ["haenaem_sweep_left_anim", "haenaem_sweep_left", 3, 8],
      ["haenaem_sweep_right_anim", "haenaem_sweep_right", 3, 8],
    ];

    sweepAnimations.forEach(([animKey, textureKey, frameCount, frameRate]) => {
      if (!this.textures.exists(textureKey) || this.anims.exists(animKey)) return;
      const frames = [];
      for (let i = 0; i < frameCount; i++) {
        frames.push(i);
      }
      this.anims.create({
        key: animKey,
        frames: this.anims.generateFrameNumbers(textureKey, { frames }),
        frameRate,
        repeat: 0,
      });
    });
  }

  createTrashAnimations() {
    const trashAnimations = [
      ["trash_slime_anim", "trash_slime", 4, 5],
      ["trash_slime_2_anim", "trash_slime_2", 3, 4],
      ["trash_can_anim", "trash_can", 3, 4],
      ["trash_can_2_anim", "trash_can_2", 3, 4],
      ["trash_can_3_anim", "trash_can_3", 4, 5],
      ["trash_plastic_anim", "trash_plastic", 3, 4],
    ];

    trashAnimations.forEach(([animKey, textureKey, frameCount, frameRate]) => {
      if (!this.textures.exists(textureKey) || this.anims.exists(animKey)) return;
      const frames = [];
      for (let i = 0; i < frameCount; i++) {
        frames.push(i);
      }
      this.anims.create({
        key: animKey,
        frames: this.anims.generateFrameNumbers(textureKey, { frames }),
        frameRate,
        repeat: -1,
      });
    });
  }

  createTrafficLightAnimations() {
    if (this.anims.exists("pedestrian_light_cycle") || !this.textures.exists("pedestrian_light")) return;

    this.anims.create({
      key: "pedestrian_light_cycle",
      frames: this.anims.generateFrameNumbers("pedestrian_light", { frames: [0] }),
      frameRate: 1,
      repeat: -1,
    });
  }

  createVehicleAnimations() {
    const vehicleAnimations = [
      ["bus_right_drive", "bus_right", [0, 1, 2, 1], 6],
      ["car_yellow_left_drive", "car_yellow_left", [0, 1, 2, 1], 5],
      ["car_blue_left_drive", "car_blue_left", [0, 1, 2, 1], 5],
      ["car_white_left_drive", "car_white_left", [0, 1, 2, 1], 5],
      ["car_red_right_drive", "car_red_right", [0, 1, 2, 1], 5],
      ["car_white_right_drive", "car_white_right", [0, 1, 2, 1], 5],
    ];

    vehicleAnimations.forEach(([animKey, textureKey, frames, frameRate]) => {
      if (this.anims.exists(animKey) || !this.textures.exists(textureKey)) return;
      this.anims.create({
        key: animKey,
        frames: this.anims.generateFrameNumbers(textureKey, { frames }),
        frameRate,
        repeat: -1,
      });
    });
  }

  createMissingExternalTextures() {
    EXTERNAL_ASSETS.forEach((asset) => {
      if (asset.fallback && !this.textures.exists(asset.key)) {
        this[asset.fallback]();
      }
    });
  }

  createPlayerTexture() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    this.drawEllipse(g, 32, 108, 68, 12, "#21352c", 0.22);
    this.drawRect(g, 96, 32, 8, 72, "#6b451f");
    this.drawRect(g, 104, 32, 4, 72, "#b8792f");
    this.drawRect(g, 96, 100, 24, 8, "#f2c94c");
    this.drawRect(g, 100, 108, 18, 12, "#f2994a");
    this.drawRect(g, 48, 20, 32, 10, "#4a2c1f");
    this.drawRect(g, 44, 28, 40, 22, "#4a2c1f");
    this.drawRect(g, 48, 42, 32, 24, "#f0b27f");
    this.drawRect(g, 44, 50, 8, 12, "#f0b27f");
    this.drawRect(g, 76, 50, 8, 12, "#f0b27f");
    this.drawRect(g, 52, 50, 4, 4, "#21352c");
    this.drawRect(g, 72, 50, 4, 4, "#21352c");
    this.drawRect(g, 60, 60, 12, 4, "#b46c55");
    this.drawRect(g, 52, 66, 24, 8, "#f0b27f");
    this.drawRect(g, 36, 72, 56, 44, "#244a87");
    this.drawRect(g, 40, 76, 48, 36, "#2f80ed");
    this.drawRect(g, 48, 72, 32, 40, "#fff7df");
    this.drawRect(g, 44, 84, 40, 4, "#9fd1ff");
    this.drawRect(g, 52, 96, 24, 4, "#e0ecff");
    this.drawRect(g, 28, 76, 12, 32, "#f0b27f");
    this.drawRect(g, 88, 76, 12, 32, "#f0b27f");
    this.drawRect(g, 92, 92, 8, 8, "#d89064");
    this.drawRect(g, 44, 116, 16, 12, "#244a87");
    this.drawRect(g, 68, 116, 16, 12, "#244a87");
    this.drawRect(g, 40, 124, 20, 4, "#17243a");
    this.drawRect(g, 68, 124, 20, 4, "#17243a");
    this.drawRect(g, 40, 72, 4, 36, "#8ec5ff");
    this.drawRect(g, 84, 72, 4, 36, "#1c5fb8");
    g.generateTexture("player", 128, 128);
    g.destroy();
  }

  createTrashSlimeTexture() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    this.drawEllipse(g, 20, 100, 88, 20, "#21352c", 0.28);
    this.drawRect(g, 56, 8, 20, 16, "#101418");
    this.drawRect(g, 48, 20, 36, 16, "#101418");
    this.drawRect(g, 32, 36, 68, 12, "#101418");
    this.drawRect(g, 20, 48, 92, 16, "#101418");
    this.drawRect(g, 12, 64, 108, 36, "#101418");
    this.drawRect(g, 16, 100, 100, 12, "#101418");
    this.drawRect(g, 60, 12, 12, 12, "#3d4652");
    this.drawRect(g, 52, 24, 28, 12, "#424c5a");
    this.drawRect(g, 36, 40, 60, 16, "#46515f");
    this.drawRect(g, 24, 52, 84, 20, "#3a4350");
    this.drawRect(g, 16, 68, 100, 28, "#333b47");
    this.drawRect(g, 24, 96, 84, 8, "#2c333e");
    this.drawRect(g, 40, 44, 16, 4, "#627081");
    this.drawRect(g, 80, 48, 16, 4, "#627081");
    this.drawRect(g, 36, 64, 12, 4, "#566373");
    this.drawRect(g, 68, 68, 12, 4, "#566373");
    this.drawRect(g, 36, 68, 20, 16, "#15191f");
    this.drawRect(g, 76, 68, 20, 16, "#15191f");
    this.drawRect(g, 40, 72, 12, 8, "#ffe34d");
    this.drawRect(g, 80, 72, 12, 8, "#ffe34d");
    this.drawRect(g, 48, 72, 4, 4, "#fff6a2");
    this.drawRect(g, 88, 72, 4, 4, "#fff6a2");
    this.drawRect(g, 16, 76, 12, 20, "#2f80ed");
    this.drawRect(g, 20, 72, 12, 4, "#79c6ff");
    this.drawRect(g, 28, 76, 12, 20, "#eb5757");
    this.drawRect(g, 96, 72, 16, 16, "#6fcf97");
    this.drawRect(g, 104, 68, 8, 8, "#a7f0aa");
    this.drawRect(g, 60, 92, 12, 4, "#171b21");
    this.drawRect(g, 28, 100, 20, 4, "#0f1318");
    this.drawRect(g, 84, 100, 20, 4, "#0f1318");
    g.generateTexture("trash_slime", 128, 128);
    g.destroy();
  }

  createBroomTexture() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    this.drawEllipse(g, 28, 100, 72, 16, "#21352c", 0.22);
    this.drawRect(g, 80, 16, 4, 16, "#fff3a3");
    this.drawRect(g, 72, 24, 20, 4, "#fff3a3");
    this.drawRect(g, 100, 40, 4, 12, "#ffe34d");
    this.drawRect(g, 96, 44, 12, 4, "#ffe34d");
    for (let i = 0; i < 13; i += 1) {
      this.drawRect(g, 28 + i * 4, 18 + i * 4, 8, 8, "#6b451f");
      this.drawRect(g, 32 + i * 4, 18 + i * 4, 4, 4, "#c48237");
    }
    this.drawPolygon(g, [[72, 60], [108, 80], [96, 116], [52, 100]], "#6b451f");
    this.drawPolygon(g, [[72, 64], [104, 80], [92, 108], [56, 96]], "#f2c94c");
    this.drawRect(g, 60, 96, 8, 20, "#f2994a");
    this.drawRect(g, 72, 100, 8, 20, "#f2994a");
    this.drawRect(g, 84, 100, 8, 16, "#c46d2d");
    this.drawRect(g, 52, 88, 52, 8, "#ffe34d");
    g.generateTexture("broom_item", 128, 128);
    g.destroy();
  }

  createTrashCanTexture() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    this.drawRect(g, 26, 28, 76, 14, "#21352c");
    this.drawRect(g, 18, 42, 92, 66, "#21352c");
    this.drawRect(g, 26, 108, 76, 10, "#21352c");
    this.drawRect(g, 30, 34, 68, 12, "#d8e5e8");
    this.drawRect(g, 24, 48, 80, 58, "#b9ccd1");
    this.drawRect(g, 32, 54, 12, 46, "#8ea4aa");
    this.drawRect(g, 50, 52, 30, 10, "#e9f3f4");
    this.drawRect(g, 86, 54, 10, 46, "#6f878d");
    this.drawRect(g, 36, 72, 18, 18, "#f2c94c");
    this.drawRect(g, 58, 70, 22, 22, "#2f80ed");
    this.drawRect(g, 82, 72, 12, 18, "#eb5757");
    this.drawRect(g, 48, 98, 34, 6, "#6fcf97");
    this.drawRect(g, 28, 112, 72, 6, "#101418");
    g.generateTexture("trash_can", 128, 128);
    g.destroy();
  }

  createFlowerTexture() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    this.drawEllipse(g, 36, 104, 56, 12, "#2f8f5b", 0.35);
    this.drawRect(g, 60, 56, 8, 48, "#2f8f5b");
    this.drawRect(g, 48, 80, 16, 8, "#48b85f");
    this.drawRect(g, 68, 72, 16, 8, "#48b85f");
    this.drawRect(g, 60, 28, 8, 8, "#fff3a3");
    this.drawRect(g, 48, 36, 12, 12, "#f2994a");
    this.drawRect(g, 68, 36, 12, 12, "#f2994a");
    this.drawRect(g, 56, 48, 16, 16, "#f2c94c");
    this.drawRect(g, 60, 44, 8, 8, "#fff3a3");
    g.generateTexture("flower", 128, 128);
    g.destroy();
  }

  createGrassTileTexture() {
    this.createTileTexture("grass_tile", "#9acb87", [
      ["rect", 3, 5, 4, 2, "#a9d895"],
      ["rect", 22, 9, 3, 2, "#8fbd7d"],
      ["rect", 12, 23, 4, 2, "#8fbd7d"],
      ["rect", 28, 26, 3, 2, "#b2dc9f"],
    ]);
  }

  createPathTileTexture() {
    this.createTileTexture("path_tile", "#d8c59a", [
      ["rect", 0, 0, 32, 1, "#e2d0a8"],
      ["rect", 6, 9, 5, 2, "#cab68c"],
      ["rect", 19, 20, 6, 2, "#e6d5ae"],
      ["rect", 28, 7, 3, 2, "#c8b185"],
    ]);
  }

  createSidewalkTileTexture() {
    this.createTileTexture("sidewalk_tile", "#cbbd95", [
      ["rect", 0, 15, 32, 1, "#b6a982"],
      ["rect", 15, 0, 1, 32, "#d6caa5"],
      ["rect", 4, 4, 2, 2, "#ded2ad"],
    ]);
  }

  createBuildingTileTexture() {
    this.createTileTexture("building_tile", "#8e9b98", [
      ["rect", 2, 2, 11, 11, "#aebbb8"],
      ["rect", 20, 4, 10, 8, "#768581"],
      ["rect", 5, 20, 22, 4, "#dbe5e2"],
    ]);
  }

  createGardenTileTexture() {
    this.createTileTexture("garden_tile", "#b2d18d", [
      ["rect", 5, 7, 4, 2, "#8fbd7d"],
      ["rect", 16, 14, 6, 2, "#c6e2a3"],
      ["rect", 24, 24, 4, 2, "#7fb46d"],
    ]);
  }

  createRoadTileTexture() {
    this.createTileTexture("road_tile", "#303a37", [
      ["rect", 15, 0, 2, 32, "#4b5955"],
      ["rect", 25, 4, 3, 8, "#f1f1e6"],
      ["rect", 25, 20, 3, 8, "#f1f1e6"],
    ]);
  }

  createTileTexture(key, fill, marks) {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    this.drawRect(g, 0, 0, 32, 32, fill);
    marks.forEach((mark) => {
      const [, x, y, width, height, color] = mark;
      this.drawRect(g, x, y, width, height, color);
    });
    g.generateTexture(key, 32, 32);
    g.destroy();
  }

  createBlockTexture(key, width, height, fill, stroke) {
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(Phaser.Display.Color.HexStringToColor(fill).color, 1);
    graphics.fillRoundedRect(2, 2, width - 4, height - 4, 6);
    graphics.lineStyle(3, Phaser.Display.Color.HexStringToColor(stroke).color, 1);
    graphics.strokeRoundedRect(2, 2, width - 4, height - 4, 6);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }

  drawRect(graphics, x, y, width, height, fill, alpha = 1) {
    graphics.fillStyle(Phaser.Display.Color.HexStringToColor(fill).color, alpha);
    graphics.fillRect(x, y, width, height);
  }

  drawEllipse(graphics, x, y, width, height, fill, alpha = 1) {
    graphics.fillStyle(Phaser.Display.Color.HexStringToColor(fill).color, alpha);
    graphics.fillEllipse(x + width / 2, y + height / 2, width, height);
  }

  drawPolygon(graphics, points, fill, alpha = 1) {
    graphics.fillStyle(Phaser.Display.Color.HexStringToColor(fill).color, alpha);
    graphics.beginPath();
    graphics.moveTo(points[0][0], points[0][1]);
    points.slice(1).forEach(([x, y]) => graphics.lineTo(x, y));
    graphics.closePath();
    graphics.fillPath();
  }
}
