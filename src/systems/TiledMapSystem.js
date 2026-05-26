import { GAME_CONFIG, TILED_MAP_CONFIG } from "../config/GameConstants.js";

export default class TiledMapSystem {
  constructor(scene) {
    this.scene = scene;
  }

  createMap() {
    const scene = this.scene;
    scene.objectWalls = scene.physics.add.staticGroup();
    scene.objectCollisionRects = [];
    scene.mapObjects = {};

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
    if (!scene.cache.tilemap.exists(TILED_MAP_CONFIG.key)) {
      return false;
    }

    const map = scene.make.tilemap({ key: TILED_MAP_CONFIG.key });
    const tilesets = this.createTiledTilesets(map);
    if (!tilesets.length) {
      return false;
    }

    const worldWidth = map.widthInPixels || GAME_CONFIG.worldWidth;
    const worldHeight = map.heightInPixels || GAME_CONFIG.worldHeight;
    scene.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    scene.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

    TILED_MAP_CONFIG.visibleLayers.forEach((layerName, index) => {
      const layer = map.getLayer(layerName);
      if (layer) {
        map.createLayer(layerName, tilesets, 0, 0).setDepth(index);
      }
    });

    const collisionSource = map.getLayer(TILED_MAP_CONFIG.collisionLayer);
    if (collisionSource) {
      scene.walls = map.createLayer(TILED_MAP_CONFIG.collisionLayer, tilesets, 0, 0);
      scene.walls.setVisible(false);
      scene.walls.setCollisionByExclusion([-1]);
    } else {
      scene.walls = scene.physics.add.staticGroup();
    }

    this.applyTiledObjects(map);
    this.createTiledMapObjects(map);
    return true;
  }

  createTiledTilesets(map) {
    return map.tilesets
      .map((sourceTileset) => {
        const textureKey = this.getTiledTilesetTextureKey(sourceTileset);
        if (!textureKey) return null;
        return map.addTilesetImage(sourceTileset.name, textureKey);
      })
      .filter(Boolean);
  }

  getTiledTilesetTextureKey(sourceTileset) {
    const scene = this.scene;
    if (scene.textures.exists(sourceTileset.name)) {
      return sourceTileset.name;
    }

    if (
      sourceTileset.name === TILED_MAP_CONFIG.tilesetName
      && scene.textures.exists(TILED_MAP_CONFIG.tilesetImageKey)
    ) {
      return TILED_MAP_CONFIG.tilesetImageKey;
    }

    console.warn(`Missing tileset texture: ${sourceTileset.name}`);
    return null;
  }

  applyTiledObjects(map) {
    const scene = this.scene;
    const objectLayer = map.getObjectLayer(TILED_MAP_CONFIG.objectLayer);
    if (!objectLayer) {
      return;
    }

    const slimeSpawnPoints = [];
    const flowerPositions = [];

    objectLayer.objects.forEach((object) => {
      const objectType = object.type || object.name;
      const x = object.x + (object.width || 0) / 2;
      const y = object.y + (object.height || 0) / 2;
      this.setMapPoint(object.name, x, y);
      if (objectType !== "logic_point") {
        this.setMapPoint(objectType, x, y);
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

  setMapPoint(key, x, y) {
    if (!key || key === "slime_spawn" || key === "flower") return;
    this.scene.mapPoints[key] = { x, y };
  }

  getMapPoint(key, fallback) {
    return this.scene.mapPoints?.[key] || fallback;
  }

  getTiledObjectProperties(object) {
    return Object.fromEntries((object.properties || []).map((property) => [property.name, property.value]));
  }

  createTiledMapObjects(map) {
    const scene = this.scene;
    const objectLayer = map.getObjectLayer(TILED_MAP_CONFIG.mapObjectsLayer);
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
      const image = props.animation
        ? scene.add.sprite(x, y, textureKey, Number(props.frame || 0))
        : scene.add.image(x, y, textureKey);

      image.setOrigin(originX, originY);
      image.setDisplaySize(displayWidth, displayHeight);
      const sortY = Number(props.sortY ?? scene.getDepthSortY(image));
      image.setData("depthSortY", sortY);
      image.setDepth(scene.getWorldDepth(sortY, Number(props.depthOffset ?? 0)));
      if (props.name) image.setName(props.name);
      const objectKey = props.name || object.name;
      if (objectKey) scene.mapObjects[objectKey] = image;
      if (props.animation && image.anims) {
        image.anims.play(props.animation);
      }

      if (this.shouldMapObjectCollide(object, props, textureKey)) {
        this.addMapObjectCollider(object, props, x, y, displayWidth, displayHeight, textureKey);
      }
    });
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
}
