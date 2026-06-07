import { PHARMACY_MAP_NPCS, PHARMACY_MAP_OBJECTS, PHARMACY_MAP_SOURCE } from "../config/PharmacyMapData.js";

const PHARMACY_MAP_KEY = "pharmacy_map";
const PHARMACY_TILESET_NAME = "pharmacy";
const PHARMACY_TILESET_KEY = "pharmacy_tiles";

export default class PharmacyMapSystem {
  constructor(scene) {
    this.scene = scene;
    this.group = null;
    this.layout = null;
    this.map = null;
  }

  show() {
    const scene = this.scene;
    if (!scene.textures.exists(PHARMACY_TILESET_KEY)) {
      return false;
    }

    this.clear();
    scene.interiorSceneSystem?.clear();

    document.querySelectorAll(".quest-toast").forEach((el) => el.remove());
    document.querySelectorAll(".money-reward-pop").forEach((el) => el.remove());
    document.querySelectorAll(".special-overlay-pop").forEach((el) => el.remove());

    document.body.classList.add("interior-scene-active");
    document.body.dataset.interiorScene = "pharmacy";
    scene.interiorSceneType = "pharmacy";
    scene.interiorSceneGroup = scene.add.group();
    this.group = scene.interiorSceneGroup;

    const viewportWidth = Math.max(768, scene.scale.width || 768);
    const viewportHeight = Math.max(480, scene.scale.height || 480);
    const centerX = viewportWidth / 2;
    const centerY = viewportHeight / 2;

    this.addSolidBackdrop(centerX, centerY, viewportWidth, viewportHeight);
    if (!this.addTiledMap(centerX, centerY, viewportWidth, viewportHeight)) {
      this.clear();
      return false;
    }
    this.addObjects();
    this.addNpcs();
    this.addDim(centerX, centerY, viewportWidth, viewportHeight);
    return true;
  }

  addSolidBackdrop(centerX, centerY, viewportWidth, viewportHeight) {
    const back = this.scene.add.rectangle(centerX, centerY, viewportWidth * 2, viewportHeight * 2, 0xe9ded2, 1);
    back.setScrollFactor(0);
    back.setDepth(58);
    this.group.add(back);
  }

  addTiledMap(centerX, centerY, viewportWidth, viewportHeight) {
    const map = this.scene.make.tilemap({ key: PHARMACY_MAP_KEY });
    const tileset = map.addTilesetImage(PHARMACY_TILESET_NAME, PHARMACY_TILESET_KEY);
    if (!tileset) return false;

    const mapWidth = map.widthInPixels || PHARMACY_MAP_SOURCE.width;
    const mapHeight = map.heightInPixels || PHARMACY_MAP_SOURCE.height;
    const scale = Math.min((viewportWidth * 0.98) / mapWidth, (viewportHeight * 0.94) / mapHeight);
    const left = centerX - (mapWidth * scale) / 2;
    const top = centerY - (mapHeight * scale) / 2;

    map.layers.forEach((layerData, index) => {
      const layer = map.createLayer(layerData.name, tileset, left, top);
      if (!layer) return;
      layer.setScrollFactor(0);
      layer.setScale(scale);
      layer.setDepth(59 + index * 0.01);
      this.group.add(layer);
    });

    this.layout = {
      scale,
      left,
      top,
      mapWidth,
      mapHeight,
    };
    this.map = map;
    return true;
  }

  addDim(centerX, centerY, viewportWidth, viewportHeight) {
    const dim = this.scene.add.rectangle(centerX, centerY, viewportWidth * 2, viewportHeight * 2, 0x000000, 0.16);
    dim.setScrollFactor(0);
    dim.setDepth(64);
    this.group.add(dim);
  }

  addObjects() {
    const didAddTiledObjects = this.addTiledObjects();
    if (didAddTiledObjects) return;

    PHARMACY_MAP_OBJECTS.forEach((entry) => {
      if (!this.scene.textures.exists(entry.key)) return;
      const point = this.toScreen(entry.x, entry.y);
      const object = this.scene.add.image(point.x, point.y, entry.key);
      object.setScrollFactor(0);
      object.setOrigin(entry.originX ?? 0.5, entry.originY ?? 1);
      object.setDisplaySize(entry.width * this.layout.scale, entry.height * this.layout.scale);
      object.setDepth(this.getObjectDepth(entry.y, entry.depthOffset));
      this.group.add(object);
    });
  }

  addTiledObjects() {
    const objectLayers = this.map?.objects || [];
    const textureMap = this.getTiledTextureMap();
    let didAdd = false;

    objectLayers.forEach((layer) => {
      layer.objects?.forEach((objectData) => {
        const objectKey = this.getTiledObjectTextureKey(objectData, textureMap);
        if (!objectKey || !this.scene.textures.exists(objectKey)) return;
        const point = this.toScreen(objectData.x, objectData.y);
        const image = this.scene.add.image(point.x, point.y, objectKey);
        image.setScrollFactor(0);
        image.setOrigin(0.5, 1);
        image.setDisplaySize(
          (objectData.width || image.width) * this.layout.scale,
          (objectData.height || image.height) * this.layout.scale,
        );
        image.setDepth(this.getObjectDepth(objectData.y, 0.1));
        this.group.add(image);
        didAdd = true;
      });
    });

    return didAdd;
  }

  getTiledTextureMap() {
    return {
      counter: "pharmacy_counter",
      medicine_bag: "pharmacy_medicine_bag_display",
      pharmacy_counter: "pharmacy_counter",
      pharmacy_medicine_bag_display: "pharmacy_medicine_bag_display",
      pharmacy_plant: "pharmacy_plant",
      pharmacy_poster: "pharmacy_poster",
      pharmacy_prescription_drop: "pharmacy_prescription_drop",
      pharmacy_shelf_care: "pharmacy_shelf_care",
      pharmacy_shelf_cold: "pharmacy_shelf_cold",
      pharmacy_shelf_general: "pharmacy_shelf_general",
      pharmacy_shelf_health: "pharmacy_shelf_health",
      pharmacy_waiting_chair: "pharmacy_waiting_chair",
      plant: "pharmacy_plant",
      poster: "pharmacy_poster",
      prescription: "pharmacy_prescription_drop",
      prescription_drop: "pharmacy_prescription_drop",
      shelf_care: "pharmacy_shelf_care",
      shelf_cold: "pharmacy_shelf_cold",
      shelf_general: "pharmacy_shelf_general",
      shelf_health: "pharmacy_shelf_health",
      waiting_chair: "pharmacy_waiting_chair",
    };
  }

  getTiledObjectTextureKey(objectData, textureMap) {
    const propertyKey = objectData.properties?.find((property) => ["texture", "key", "asset"].includes(property.name))?.value;
    const rawKey = propertyKey || objectData.name || objectData.type;
    return textureMap[rawKey] || rawKey;
  }

  addNpcs() {
    PHARMACY_MAP_NPCS.forEach((entry) => {
      if (!this.scene.textures.exists(entry.key)) return;
      const point = this.toScreen(entry.x, entry.y);
      const npc = this.scene.add.sprite(point.x, point.y, entry.key, entry.frame || 0);
      npc.setScrollFactor(0);
      npc.setOrigin(entry.originX ?? 0.5, entry.originY ?? 1);
      npc.setDisplaySize(entry.width * this.layout.scale, entry.height * this.layout.scale);
      npc.setDepth(this.getObjectDepth(entry.y, entry.depthOffset));
      this.group.add(npc);
    });
  }

  getObjectDepth(mapY, depthOffset = 0) {
    return 60 + (mapY || 0) / 1000 + depthOffset;
  }

  toScreen(sourceX, sourceY) {
    return {
      x: this.layout.left + sourceX * this.layout.scale,
      y: this.layout.top + sourceY * this.layout.scale,
    };
  }

  clear() {
    this.group?.clear(true, true);
    this.group = null;
    this.layout = null;
    this.map = null;

    if (this.scene.interiorSceneType === "pharmacy") {
      this.scene.interiorSceneGroup = null;
      this.scene.interiorSpeaker = null;
      this.scene.interiorSceneType = null;
      document.body.classList.remove("interior-scene-active");
      delete document.body.dataset.interiorScene;
    }
  }
}
