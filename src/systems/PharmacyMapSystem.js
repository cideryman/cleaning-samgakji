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
    this.player = null;
    this.pharmacist = null;
    this.sunisuniCompanion = null;
    this.moveTarget = null;
    this.counterPoint = null;
    this.exitPoint = null;
    this.tiledObjectPoints = {};
    this.collisionRects = [];
    this.interactionMode = "quest";
    this.hasStartedCounterDialogue = false;
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
    this.cacheTiledObjectPoints();
    this.cacheTiledCollisionRects();
    this.addDim(centerX, centerY, viewportWidth, viewportHeight);
    this.addObjects();
    this.addNpcs();
    this.addInteriorPlayer();
    this.addSunisuniCompanion();
    this.addInteractionZones();
    return true;
  }

  update(time, delta = 16.67) {
    if (!this.group || this.scene.interiorSceneType !== "pharmacy") return;
    this.updateInteriorPlayer(delta);
  }

  setInteractionMode(mode = "quest") {
    this.interactionMode = mode;
    this.hasStartedCounterDialogue = false;
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
    dim.setDepth(59.5);
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
        if (this.isTiledControlObject(objectData)) return;
        const objectKey = this.getTiledObjectTextureKey(objectData, textureMap);
        if (!objectKey || !this.scene.textures.exists(objectKey)) return;
        const point = this.getTiledObjectScreenPoint(objectData);
        const image = this.scene.add.image(point.x, point.y, objectKey);
        image.setScrollFactor(0);
        image.setOrigin(0.5, 1);
        image.setDisplaySize(
          this.getTiledObjectDisplayWidth(objectData, image) * this.layout.scale,
          this.getTiledObjectDisplayHeight(objectData, image) * this.layout.scale,
        );
        image.setDepth(this.getObjectDepth(this.getTiledObjectDepthY(objectData), this.getTiledObjectDepthOffset(objectData, 0.1)));
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
      chair: "pharmacy_waiting_chair",
      shelf_care: "pharmacy_shelf_care",
      shelf_cold: "pharmacy_shelf_cold",
      shelf_general: "pharmacy_shelf_general",
      shelf_health: "pharmacy_shelf_health",
      waiting_chair: "pharmacy_waiting_chair",
      pharmacist: "pharmacist_sprite",
      npc_chemist: "pharmacist_sprite",
    };
  }

  getTiledObjectTextureKey(objectData, textureMap) {
    const propertyKey = objectData.properties?.find((property) => ["texture", "key", "asset"].includes(property.name))?.value;
    const rawKey = propertyKey || objectData.name || objectData.type;
    return textureMap[rawKey] || rawKey;
  }

  addNpcs() {
    const tiledNpcObjects = this.getTiledNpcObjects();
    if (tiledNpcObjects.length > 0) {
      tiledNpcObjects.forEach((objectData) => this.addNpcFromTiledObject(objectData));
      if (this.pharmacist) return;
    }

    PHARMACY_MAP_NPCS.forEach((entry) => {
      if (!this.scene.textures.exists(entry.key)) return;
      const point = this.toScreen(entry.x, entry.y);
      const npc = this.scene.add.sprite(point.x, point.y, entry.key, entry.frame || 0);
      npc.setScrollFactor(0);
      npc.setOrigin(entry.originX ?? 0.5, entry.originY ?? 1);
      npc.setDisplaySize(entry.width * this.layout.scale, entry.height * this.layout.scale);
      npc.setDepth(this.getObjectDepth(entry.y, entry.depthOffset));
      this.group.add(npc);
      if (entry.key === "pharmacist_sprite") {
        this.pharmacist = npc;
        this.setupPharmacistInteraction(npc);
      }
    });
  }

  addNpcFromTiledObject(objectData) {
    const textureMap = this.getTiledTextureMap();
    const key = this.getTiledObjectTextureKey(objectData, textureMap) || "pharmacist_sprite";
    if (!this.scene.textures.exists(key)) return;

    const point = this.getTiledObjectScreenPoint(objectData);
    const npc = this.scene.add.sprite(point.x, point.y, key, this.getTiledProperty(objectData, "frame", 0));
    npc.setScrollFactor(0);
    npc.setOrigin(0.5, 1);
    npc.setDisplaySize(
      this.getTiledObjectDisplayWidth(objectData, npc, 64) * this.layout.scale,
      this.getTiledObjectDisplayHeight(objectData, npc, 96) * this.layout.scale,
    );
    npc.setDepth(this.getObjectDepth(this.getTiledObjectDepthY(objectData), this.getTiledObjectDepthOffset(objectData, 0.28)));
    this.group.add(npc);

    if (this.isTiledObjectNamed(objectData, ["pharmacist", "npc_chemist", "chemist"])) {
      this.pharmacist = npc;
      this.setupPharmacistInteraction(npc);
    }
  }

  setupPharmacistInteraction(npc) {
    npc.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, npc.width, npc.height),
      Phaser.Geom.Rectangle.Contains,
    );
    npc.input.useHandCursor = true;
    npc.on("pointerover", () => {
      if (!this.scene.isInDialogue) npc.setTint(0xffeb3b);
    });
    npc.on("pointerout", () => {
      npc.clearTint();
    });
    npc.on("pointerdown", (pointer) => {
      pointer.event?.preventDefault?.();
      pointer.event?.stopPropagation?.();
      npc.clearTint();
      this.startCounterDialogueFromPharmacistTap();
    });
    this.addPharmacistTapZone(npc);
  }

  addPharmacistTapZone(npc) {
    const bounds = npc.getBounds();
    const zone = this.scene.add.zone(
      bounds.centerX,
      bounds.centerY,
      Math.max(bounds.width + 28 * this.layout.scale, 76 * this.layout.scale),
      Math.max(bounds.height + 34 * this.layout.scale, 112 * this.layout.scale),
    );
    zone.setScrollFactor(0);
    zone.setDepth(Math.max(npc.depth + 0.02, 68));
    zone.setInteractive({ useHandCursor: true });
    zone.on("pointerover", () => {
      if (!this.scene.isInDialogue && npc.active) npc.setTint(0xffeb3b);
    });
    zone.on("pointerout", () => {
      if (npc.active) npc.clearTint();
    });
    zone.on("pointerdown", (pointer) => {
      pointer.event?.preventDefault?.();
      pointer.event?.stopPropagation?.();
      if (npc.active) npc.clearTint();
      this.startCounterDialogueFromPharmacistTap();
    });
    this.group?.add(zone);
  }

  addInteriorPlayer() {
    const textureKey = this.scene.textures.exists("haenaem_walk_down") ? "haenaem_walk_down" : "player";
    const start = this.getTiledNamedPoint(["player_start", "haenaem_start"]) || this.toScreen(548, 336);
    const player = this.scene.add.sprite(start.x, start.y, textureKey, 1);
    player.setScrollFactor(0);
    player.setOrigin(0.5, 1);
    player.setDisplaySize(54 * this.layout.scale, 82 * this.layout.scale);
    player.setDepth(this.getScreenDepth(start.y, 0.22));
    this.group.add(player);
    this.player = player;
    this.counterPoint = this.getTiledNamedPoint(["counter_point", "counter", "pharmacy_counter"]) || this.toScreen(366, 326);
    this.exitPoint = this.getTiledNamedPoint(["exit", "pharmacy_exit"]) || this.toScreen(586, 340);
  }

  addSunisuniCompanion() {
    if (this.interactionMode !== "quest") return;
    const textureKey = this.scene.textures.exists("sunisuni_walk_down") ? "sunisuni_walk_down" : null;
    if (!textureKey) return;

    const point = this.getTiledNamedPoint(["sunisuni_start", "companion_start"]) || this.toScreen(254, 334);
    const sunisuni = this.scene.add.sprite(point.x, point.y, textureKey, 1);
    sunisuni.setScrollFactor(0);
    sunisuni.setOrigin(0.5, 1);
    sunisuni.setDisplaySize(52 * this.layout.scale, 78 * this.layout.scale);
    sunisuni.setDepth(this.getScreenDepth(point.y, 0.18));
    this.group.add(sunisuni);
    this.sunisuniCompanion = sunisuni;
  }

  addInteractionZones() {
    const scene = this.scene;
    const mapCenter = this.toScreen(PHARMACY_MAP_SOURCE.width / 2, PHARMACY_MAP_SOURCE.height / 2);
    const mapZone = scene.add.zone(
      mapCenter.x,
      mapCenter.y,
      PHARMACY_MAP_SOURCE.width * this.layout.scale,
      PHARMACY_MAP_SOURCE.height * this.layout.scale,
    );
    mapZone.setScrollFactor(0);
    mapZone.setInteractive();
    mapZone.setDepth(60.02);
    mapZone.on("pointerdown", (pointer) => this.handleInteriorPointer(pointer));
    this.group.add(mapZone);

    const exit = scene.add.circle(this.exitPoint.x, this.exitPoint.y, 24 * this.layout.scale, 0x73d98f, 0.28);
    exit.setStrokeStyle(3 * this.layout.scale, 0xffffff, 0.85);
    exit.setScrollFactor(0);
    exit.setDepth(67);
    exit.setInteractive({ useHandCursor: true });
    exit.on("pointerdown", (pointer) => {
      pointer.event?.stopPropagation?.();
      this.moveTarget = { ...this.exitPoint, action: "exit" };
    });
    this.group.add(exit);

    const exitLabel = scene.add.text(this.exitPoint.x, this.exitPoint.y + 22 * this.layout.scale, "나가기", {
      fontFamily: "sans-serif",
      fontSize: `${Math.round(13 * this.layout.scale)}px`,
      fontStyle: "700",
      color: "#ffffff",
      backgroundColor: "rgba(30, 60, 42, 0.78)",
      padding: { x: 8, y: 4 },
    });
    exitLabel.setOrigin(0.5, 0);
    exitLabel.setScrollFactor(0);
    exitLabel.setDepth(69);
    this.group.add(exitLabel);

  }

  handleInteriorPointer(pointer) {
    pointer.event?.stopPropagation?.();
    if (!this.player || this.scene.isInDialogue) return;
    const point = { x: pointer.x, y: pointer.y };
    if (this.isPointerOnPharmacist(point)) {
      this.startCounterDialogueFromPharmacistTap();
      return;
    }
    if (this.isNearScreenPoint(point, this.counterPoint, 84 * this.layout.scale)) {
      this.moveTarget = { ...this.counterPoint };
      return;
    }
    if (this.isNearScreenPoint(point, this.exitPoint, 74 * this.layout.scale)) {
      this.moveTarget = { ...this.exitPoint, action: "exit" };
      return;
    }
    this.moveTarget = this.clampScreenPointToMap(point.x, point.y);
  }

  updateInteriorPlayer(delta) {
    const scene = this.scene;
    if (!this.player?.active) return;

    if (scene.isInDialogue) {
      this.moveTarget = null;
      return;
    }

    const keyboardHorizontal =
      Number(scene.cursors?.right?.isDown || scene.keys?.right?.isDown) -
      Number(scene.cursors?.left?.isDown || scene.keys?.left?.isDown);
    const keyboardVertical =
      Number(scene.cursors?.down?.isDown || scene.keys?.down?.isDown) -
      Number(scene.cursors?.up?.isDown || scene.keys?.up?.isDown);
    const joystick = scene.joystickVector?.lengthSq?.() > 0 ? scene.joystickVector : null;
    const vector = new Phaser.Math.Vector2(
      keyboardHorizontal || joystick?.x || 0,
      keyboardVertical || joystick?.y || 0,
    );

    if (vector.lengthSq() > 0) {
      this.moveTarget = null;
      vector.normalize();
      this.moveInteriorPlayer(vector.x, vector.y, delta);
      this.updateInteriorPlayerDirection(vector.x, vector.y, true);
      return;
    }

    if (this.moveTarget) {
      const dx = this.moveTarget.x - this.player.x;
      const dy = this.moveTarget.y - this.player.y;
      const distance = Math.hypot(dx, dy);
      if (distance <= 8) {
        const action = this.moveTarget.action;
        this.moveTarget = null;
        this.stopInteriorPlayerAnimation();
        if (action === "exit") this.exitPharmacy();
        return;
      }
      const targetVector = new Phaser.Math.Vector2(dx, dy).normalize();
      this.moveInteriorPlayer(targetVector.x, targetVector.y, delta);
      this.updateInteriorPlayerDirection(targetVector.x, targetVector.y, true);
      return;
    }

    this.stopInteriorPlayerAnimation();
  }

  moveInteriorPlayer(x, y, delta) {
    const speed = 150 * this.layout.scale;
    const distance = speed * (delta / 1000);
    let next = this.clampScreenPointToMap(this.player.x + x * distance, this.player.y + y * distance);

    if (this.isScreenPointBlocked(next)) {
      const horizontal = this.clampScreenPointToMap(this.player.x + x * distance, this.player.y);
      const vertical = this.clampScreenPointToMap(this.player.x, this.player.y + y * distance);
      if (!this.isScreenPointBlocked(horizontal)) {
        next = horizontal;
      } else if (!this.isScreenPointBlocked(vertical)) {
        next = vertical;
      } else {
        next = { x: this.player.x, y: this.player.y };
        this.moveTarget = null;
      }
    }

    this.player.setPosition(next.x, next.y);
    this.player.setDepth(this.getScreenDepth(this.player.y, 0.22));
  }

  updateInteriorPlayerDirection(x, y, isMoving = false) {
    const scene = this.scene;
    const absX = Math.abs(x);
    const absY = Math.abs(y);
    const direction = absX > absY ? (x < 0 ? "left" : "right") : (y < 0 ? "up" : "down");
    const textureKey = `haenaem_walk_${direction}`;
    const animKey = `haenaem_walk_${direction}_anim`;
    if (scene.textures.exists(textureKey) && this.player.texture.key !== textureKey) {
      this.player.setTexture(textureKey, 1);
    }
    if (isMoving && scene.anims.exists(animKey)) {
      this.player.anims.play(animKey, true);
    }
  }

  stopInteriorPlayerAnimation() {
    this.player?.anims?.stop();
    if (this.player?.anims?.currentFrame) {
      this.player.setFrame(1);
    }
  }

  handlePrimaryAction() {
    if (!this.player?.active || this.scene.isInDialogue) return false;
    if (this.isPlayerNearExit()) {
      this.exitPharmacy();
      return true;
    }
    return false;
  }

  startCounterDialogueFromPharmacistTap() {
    if (!this.player?.active || this.scene.isInDialogue) return false;
    if (!this.isPlayerNearCounter()) {
      this.moveTarget = { ...this.counterPoint };
      return false;
    }
    if (this.hasStartedCounterDialogue && this.interactionMode !== "revisit") return true;
    this.hasStartedCounterDialogue = true;
    this.scene.sunisuniQuestSystem?.startPharmacyCounterDialogue?.(this.interactionMode);
    return true;
  }

  exitPharmacy() {
    if (this.scene.isInDialogue) return;
    this.scene.clearInteriorScene();
  }

  walkPlayerToExit(onComplete) {
    if (!this.player?.active || !this.exitPoint) {
      onComplete?.();
      return;
    }
    const companionTarget = this.sunisuniCompanion?.active
      ? { x: this.exitPoint.x - 42 * this.layout.scale, y: this.exitPoint.y }
      : null;
    let pendingTweens = companionTarget ? 2 : 1;
    const finishOne = () => {
      pendingTweens -= 1;
      if (pendingTweens <= 0) onComplete?.();
    };

    this.scene.tweens.add({
      targets: this.player,
      x: this.exitPoint.x,
      y: this.exitPoint.y,
      duration: 650,
      ease: "Sine.easeInOut",
      onUpdate: () => {
        this.player?.setDepth(this.getScreenDepth(this.player.y, 0.22));
      },
      onComplete: finishOne,
    });

    if (companionTarget) {
      const animKey = "sunisuni_walk_down_anim";
      if (this.scene.anims.exists(animKey)) this.sunisuniCompanion.anims.play(animKey, true);
      this.scene.tweens.add({
        targets: this.sunisuniCompanion,
        x: companionTarget.x,
        y: companionTarget.y,
        duration: 720,
        ease: "Sine.easeInOut",
        onUpdate: () => {
          this.sunisuniCompanion?.setDepth(this.getScreenDepth(this.sunisuniCompanion.y, 0.18));
        },
        onComplete: () => {
          this.sunisuniCompanion?.anims?.stop();
          if (this.sunisuniCompanion?.anims?.currentFrame) this.sunisuniCompanion.setFrame(1);
          finishOne();
        },
      });
    }
  }

  playTransferItem(textureKey, fromKey, toKey, options = {}) {
    const from = this.getActorPoint(fromKey);
    const to = this.getActorPoint(toKey);
    if (!from || !to || !this.scene.textures.exists(textureKey)) {
      options.onComplete?.();
      return;
    }

    const item = this.scene.add.image(from.x, from.y, textureKey);
    item.setScrollFactor(0);
    item.setDisplaySize(options.width || 92 * this.layout.scale, options.height || 68 * this.layout.scale);
    item.setDepth(74);
    item.setAlpha(0);
    this.group?.add(item);
    this.scene.playTone?.({ frequency: 880, duration: 0.08, type: "triangle", volume: 0.06 });
    this.scene.tweens.add({
      targets: item,
      alpha: 1,
      y: from.y - 24 * this.layout.scale,
      duration: 180,
      ease: "Back.easeOut",
      onComplete: () => {
        this.scene.tweens.add({
          targets: item,
          x: to.x,
          y: to.y - 24 * this.layout.scale,
          duration: options.duration ?? 620,
          ease: "Sine.easeInOut",
          onComplete: () => {
            this.scene.playTone?.({ frequency: 1240, duration: 0.08, type: "square", volume: 0.045 });
            this.scene.tweens.add({
              targets: item,
              alpha: 0,
              scaleX: item.scaleX * 0.55,
              scaleY: item.scaleY * 0.55,
              duration: 220,
              ease: "Cubic.easeIn",
              onComplete: () => {
                item.destroy();
                options.onComplete?.();
              },
            });
          },
        });
      },
    });
  }

  getActorPoint(key) {
    if (key === "player" && this.player?.active) {
      return { x: this.player.x, y: this.player.y - this.player.displayHeight * 0.55 };
    }
    if (key === "pharmacist" && this.pharmacist?.active) {
      return { x: this.pharmacist.x, y: this.pharmacist.y - this.pharmacist.displayHeight * 0.55 };
    }
    if (key === "sunisuni" && this.sunisuniCompanion?.active) {
      return { x: this.sunisuniCompanion.x, y: this.sunisuniCompanion.y - this.sunisuniCompanion.displayHeight * 0.55 };
    }
    if (key === "counter") return this.counterPoint;
    return null;
  }

  isPlayerNearCounter() {
    return this.isNearScreenPoint(this.player, this.counterPoint, 62 * this.layout.scale);
  }

  isPlayerNearExit() {
    return this.isNearScreenPoint(this.player, this.exitPoint, 58 * this.layout.scale);
  }

  isNearScreenPoint(a, b, distance) {
    if (!a || !b) return false;
    return Math.hypot(a.x - b.x, a.y - b.y) <= distance;
  }

  isPointerOnPharmacist(point) {
    if (!point || !this.pharmacist?.active) return false;
    const bounds = this.pharmacist.getBounds();
    const padding = 12 * this.layout.scale;
    const paddedBounds = new Phaser.Geom.Rectangle(
      bounds.x - padding,
      bounds.y - padding,
      bounds.width + padding * 2,
      bounds.height + padding * 2,
    );
    return Phaser.Geom.Rectangle.Contains(paddedBounds, point.x, point.y);
  }

  clampScreenPointToMap(x, y) {
    const paddingX = 34 * this.layout.scale;
    const topLimit = this.layout.top + 112 * this.layout.scale;
    const bottomLimit = this.layout.top + this.layout.mapHeight * this.layout.scale - 24 * this.layout.scale;
    return {
      x: Phaser.Math.Clamp(x, this.layout.left + paddingX, this.layout.left + this.layout.mapWidth * this.layout.scale - paddingX),
      y: Phaser.Math.Clamp(y, topLimit, bottomLimit),
    };
  }

  getObjectDepth(mapY, depthOffset = 0) {
    return 60 + (mapY || 0) / 1000 + depthOffset;
  }

  getScreenDepth(screenY, offset = 0) {
    if (!this.layout) return 60 + offset;
    const mapY = (screenY - this.layout.top) / this.layout.scale;
    return this.getObjectDepth(mapY, offset);
  }

  toScreen(sourceX, sourceY) {
    return {
      x: this.layout.left + sourceX * this.layout.scale,
      y: this.layout.top + sourceY * this.layout.scale,
    };
  }

  cacheTiledObjectPoints() {
    this.tiledObjectPoints = {};
    const objectLayers = this.map?.objects || [];
    objectLayers.forEach((layer) => {
      layer.objects?.forEach((objectData) => {
        const names = [
          objectData.name,
          objectData.type,
          this.getTiledProperty(objectData, "id"),
          this.getTiledProperty(objectData, "role"),
        ].filter(Boolean);
        const point = this.getTiledObjectScreenPoint(objectData);
        names.forEach((name) => {
          this.tiledObjectPoints[String(name)] = point;
        });
      });
    });
  }

  cacheTiledCollisionRects() {
    this.collisionRects = [];
    const objectLayers = this.map?.objects || [];
    objectLayers.forEach((layer) => {
      const isCollisionLayer = layer.name === "collision";
      layer.objects?.forEach((objectData) => {
        const role = this.getTiledProperty(objectData, "role");
        const collides = this.getTiledProperty(objectData, "collides", false);
        if (!isCollisionLayer && role !== "collision" && collides !== true) return;

        const rect = this.getTiledCollisionRect(objectData);
        if (rect.width > 0 && rect.height > 0) {
          this.collisionRects.push(rect);
        }
      });
    });
  }

  getTiledNamedPoint(names) {
    for (const name of names) {
      if (this.tiledObjectPoints?.[name]) return { ...this.tiledObjectPoints[name] };
    }
    return null;
  }

  getTiledNpcObjects() {
    const objectLayers = this.map?.objects || [];
    const npcObjects = [];
    objectLayers.forEach((layer) => {
      layer.objects?.forEach((objectData) => {
        const role = this.getTiledProperty(objectData, "role");
        if (role === "npc" || this.isTiledObjectNamed(objectData, ["pharmacist", "npc_chemist", "chemist"])) {
          npcObjects.push(objectData);
        }
      });
    });
    return npcObjects;
  }

  isTiledControlObject(objectData) {
    const role = this.getTiledProperty(objectData, "role");
    if (["point", "spawn", "exit", "npc"].includes(role)) return true;
    return this.isTiledObjectNamed(objectData, [
      "player_start",
      "haenaem_start",
      "sunisuni_start",
      "companion_start",
      "counter_point",
      "exit",
      "pharmacy_exit",
      "pharmacist",
      "npc_chemist",
      "chemist",
    ]);
  }

  isTiledObjectNamed(objectData, names) {
    const objectNames = [objectData.name, objectData.type, this.getTiledProperty(objectData, "id")].filter(Boolean);
    return objectNames.some((objectName) => names.includes(String(objectName)));
  }

  getTiledObjectScreenPoint(objectData) {
    const width = objectData.width || 0;
    const height = objectData.height || 0;
    const isPoint = objectData.point || (!width && !height);
    const origin = this.getTiledProperty(objectData, "origin", "bottom");
    let sourceX = objectData.x || 0;
    let sourceY = objectData.y || 0;

    if (!isPoint) {
      sourceX += width / 2;
      if (origin !== "center") {
        sourceY += height;
      } else {
        sourceY += height / 2;
      }
    }

    return this.toScreen(sourceX, sourceY);
  }

  getTiledCollisionRect(objectData) {
    const x = Number(this.getTiledProperty(objectData, "collisionX", objectData.x || 0));
    const y = Number(this.getTiledProperty(objectData, "collisionY", objectData.y || 0));
    const width = Number(this.getTiledProperty(objectData, "collisionWidth", objectData.width || 0));
    const height = Number(this.getTiledProperty(objectData, "collisionHeight", objectData.height || 0));
    return {
      x: this.layout.left + x * this.layout.scale,
      y: this.layout.top + y * this.layout.scale,
      width: width * this.layout.scale,
      height: height * this.layout.scale,
    };
  }

  isScreenPointBlocked(point) {
    if (!point || this.collisionRects.length === 0) return false;
    const footWidth = 18 * this.layout.scale;
    const footHeight = 10 * this.layout.scale;
    const footRect = {
      x: point.x - footWidth / 2,
      y: point.y - footHeight,
      width: footWidth,
      height: footHeight,
    };
    return this.collisionRects.some((rect) => this.rectsOverlap(footRect, rect));
  }

  rectsOverlap(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  getTiledObjectDisplayWidth(objectData, image, fallback = image?.width || 64) {
    return Number(this.getTiledProperty(objectData, "displayWidth", objectData.width || fallback));
  }

  getTiledObjectDisplayHeight(objectData, image, fallback = image?.height || 64) {
    return Number(this.getTiledProperty(objectData, "displayHeight", objectData.height || fallback));
  }

  getTiledObjectDepthY(objectData) {
    if (objectData.point) return objectData.y || 0;
    return (objectData.y || 0) + (objectData.height || 0);
  }

  getTiledObjectDepthOffset(objectData, fallback) {
    return Number(this.getTiledProperty(objectData, "depthOffset", fallback));
  }

  getTiledProperty(objectData, name, fallback = null) {
    const property = objectData.properties?.find((entry) => entry.name === name);
    return property?.value ?? fallback;
  }

  clear() {
    this.group?.clear(true, true);
    this.group = null;
    this.layout = null;
    this.map = null;
    this.player = null;
    this.pharmacist = null;
    this.sunisuniCompanion = null;
    this.moveTarget = null;
    this.counterPoint = null;
    this.exitPoint = null;
    this.tiledObjectPoints = {};
    this.collisionRects = [];
    this.hasStartedCounterDialogue = false;

    if (this.scene.interiorSceneType === "pharmacy") {
      this.scene.interiorSceneGroup = null;
      this.scene.interiorSpeaker = null;
      this.scene.interiorSceneType = null;
      document.body.classList.remove("interior-scene-active");
      delete document.body.dataset.interiorScene;
    }
  }
}
