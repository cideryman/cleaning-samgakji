const GAME_CONFIG = {
  worldWidth: 1536,
  worldHeight: 960,
  playerSpeed: 135,
  waveSize: 30,
  totalGoal: 30,
  canCount: 10,
  sangcheoriCanGoal: 10,
  sangcheoriRemoveCount: 10,
  broomUpgradeGoal: 10,
  playerDisplaySize: 50,
  slimeDisplaySize: 54,
  broomItemDisplaySize: 52,
  sangcheoriNpcDisplaySize: 72,
  baseSweepWidth: 112,
  baseSweepHeight: 84,
  upgradedSweepMultiplier: 2,
  sweepCooldownMs: 420,
  feedbackSparkleCount: 14,
  canFeedbackSparkleCount: 18,
  slimeSpawnMinDistance: 72,
  wideCameraZoom: 1.24,
  joystickRadius: 78,
};

const TILED_MAP_CONFIG = {
  key: "chapter1_map",
  chapter: 1,
  title: "챕터 1",
  mapName: "삼각지 복지관",
  tilesetName: "samgakji_tiles",
  tilesetImageKey: "samgakji_tiles",
  visibleLayers: ["ground", "objects"],
  collisionLayer: "collision",
  objectLayer: "spawn",
};

class PlayScene extends Phaser.Scene {
  constructor() {
    super("PlayScene");
    this.totalCleanedCount = 0;
    this.waveCleanedCount = 0;
    this.currentWave = 0;
    this.hasBroomUpgrade = false;
    this.hasDroppedBroomUpgrade = false;
    this.cleanedCanCount = 0;
    this.hasUnlockedSangcheori = false;
    this.hasUsedSangcheori = false;
    this.isMissionComplete = false;
    this.lastDirection = new Phaser.Math.Vector2(1, 0);
    this.joystickVector = new Phaser.Math.Vector2(0, 0);
    this.activeJoystickPointerId = null;
    this.joystickBase = { x: 0, y: 0 };
    this.canSweep = true;
    this.audioContext = null;
    this.thanksAudioBuffer = null;
    this.collectCansAudioBuffer = null;
    this.helpAudioBuffer = null;
    this.bgmAudio = null;
    this.bgmIndex = 1;
    this.bgmObjectUrl = null;
    this.hasStartedAudioLoad = false;
    this.playerStart = { x: 170, y: 424 };
    this.broomSpawn = { x: 650, y: 420 };
    this.slimeSpawnPoints = [];
    this.finalFlowerPositions = null;
  }

  create() {
    this.resetRunState();
    document.body.classList.remove("start-screen");

    this.cleanProgressEls = Array.from(document.querySelectorAll("#cleanProgress span"));
    this.canProgressEls = Array.from(document.querySelectorAll("#canProgress span"));
    this.missionCountEl = document.querySelector("#missionCount");
    this.sweepButton = document.querySelector("#sweepButton");
    this.specialButton = document.querySelector("#specialButton");
    this.movePad = document.querySelector("#movePad");
    this.moveKnob = document.querySelector("#moveKnob");
    this.fullscreenButton = document.querySelector("#fullscreenButton");
    this.completeOverlay = document.querySelector("#completeOverlay");
    this.specialToast = document.querySelector("#specialToast");
    this.resultTrashCountEl = document.querySelector("#resultTrashCount");
    this.resultCanCountEl = document.querySelector("#resultCanCount");
    this.resultHelpUsedEl = document.querySelector("#resultHelpUsed");
    this.restartButton = document.querySelector("#restartButton");
    this.restartHandler = () => this.restartGame();
    this.sweepHandler = (event) => {
      event?.preventDefault();
      event?.stopPropagation();
      this.trySweep();
    };
    this.specialHandler = (event) => {
      event?.preventDefault();
      event?.stopPropagation();
      this.useSangcheoriItem();
    };
    this.moveStartHandler = (event) => this.startFloatingJoystick(event);
    this.moveUpdateHandler = (event) => this.updateJoystick(event);
    this.moveStopHandler = (event) => this.stopJoystick(event);
    this.fullscreenHandler = (event) => this.toggleFullscreen(event);
    this.fullscreenChangeHandler = () => this.handleFullscreenChange();
    this.resizeHandler = () => this.updateCameraZoom();
    this.audioUnlockHandler = () => this.unlockAudio();
    this.restartButton?.addEventListener("click", this.restartHandler);
    this.sweepButton?.addEventListener("pointerdown", this.sweepHandler);
    this.specialButton?.addEventListener("pointerdown", this.specialHandler);
    window.addEventListener("pointerdown", this.audioUnlockHandler, { passive: true });
    window.addEventListener("keydown", this.audioUnlockHandler);
    window.addEventListener("pointerdown", this.moveStartHandler);
    window.addEventListener("pointermove", this.moveUpdateHandler);
    window.addEventListener("pointerup", this.moveStopHandler);
    window.addEventListener("pointercancel", this.moveStopHandler);
    this.fullscreenButton?.addEventListener("click", this.fullscreenHandler);
    document.addEventListener("fullscreenchange", this.fullscreenChangeHandler);
    document.addEventListener("webkitfullscreenchange", this.fullscreenChangeHandler);
    window.addEventListener("resize", this.resizeHandler);
    window.addEventListener("orientationchange", this.resizeHandler);
    this.completeOverlay?.classList.remove("is-visible");
    this.completeOverlay?.setAttribute("aria-hidden", "true");
    this.specialToast?.classList.remove("is-visible");
    this.specialToast?.setAttribute("aria-hidden", "true");
    this.hideJoystick();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.stopChapterMusic();
      this.restartButton?.removeEventListener("click", this.restartHandler);
      this.sweepButton?.removeEventListener("pointerdown", this.sweepHandler);
      this.specialButton?.removeEventListener("pointerdown", this.specialHandler);
      window.removeEventListener("pointerdown", this.audioUnlockHandler);
      window.removeEventListener("keydown", this.audioUnlockHandler);
      window.removeEventListener("pointerdown", this.moveStartHandler);
      window.removeEventListener("pointermove", this.moveUpdateHandler);
      window.removeEventListener("pointerup", this.moveStopHandler);
      window.removeEventListener("pointercancel", this.moveStopHandler);
      this.fullscreenButton?.removeEventListener("click", this.fullscreenHandler);
      document.removeEventListener("fullscreenchange", this.fullscreenChangeHandler);
      document.removeEventListener("webkitfullscreenchange", this.fullscreenChangeHandler);
      window.removeEventListener("resize", this.resizeHandler);
      window.removeEventListener("orientationchange", this.resizeHandler);
    });

    this.createMap();
    this.createLargeBenchOverlays();
    this.createSangcheoriNpc();
    this.createPlayer();
    this.trashSlimes = this.physics.add.staticGroup();
    this.spawnTrashWave();
    this.createInput();
    this.updateHud();
    this.updateCameraZoom();

    this.physics.add.collider(this.player, this.walls);
    this.startChapterMusic();
    this.time.delayedCall(800, () => this.showFirstGuide());
  }

  resetRunState() {
    this.totalCleanedCount = 0;
    this.waveCleanedCount = 0;
    this.currentWave = 0;
    this.hasBroomUpgrade = false;
    this.hasDroppedBroomUpgrade = false;
    this.cleanedCanCount = 0;
    this.hasUnlockedSangcheori = false;
    this.hasUsedSangcheori = false;
    this.isMissionComplete = false;
    this.lastDirection.set(1, 0);
    this.joystickVector.set(0, 0);
    this.activeJoystickPointerId = null;
    this.joystickBase = { x: 0, y: 0 };
    this.canSweep = true;
    this.thanksAudioBuffer = null;
    this.collectCansAudioBuffer = null;
    this.helpAudioBuffer = null;
    this.hasStartedAudioLoad = false;
    this.playerStart = { x: 170, y: 424 };
    this.broomSpawn = { x: 650, y: 420 };
    this.slimeSpawnPoints = [];
    this.finalFlowerPositions = null;
  }

  update() {
    this.handleMovement();
  }

  createMap() {
    if (this.createTiledMap()) {
      return;
    }

    this.createFallbackMap();
  }

  createTiledMap() {
    if (!this.cache.tilemap.exists(TILED_MAP_CONFIG.key) || !this.textures.exists(TILED_MAP_CONFIG.tilesetImageKey)) {
      return false;
    }

    const map = this.make.tilemap({ key: TILED_MAP_CONFIG.key });
    const sourceTileset = this.findTiledTileset(map);
    if (!sourceTileset) {
      return false;
    }

    const tileset = map.addTilesetImage(sourceTileset.name, TILED_MAP_CONFIG.tilesetImageKey);
    if (!tileset) {
      return false;
    }

    const worldWidth = map.widthInPixels || GAME_CONFIG.worldWidth;
    const worldHeight = map.heightInPixels || GAME_CONFIG.worldHeight;
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

    TILED_MAP_CONFIG.visibleLayers.forEach((layerName, index) => {
      const layer = map.getLayer(layerName);
      if (layer) {
        map.createLayer(layerName, tileset, 0, 0).setDepth(index);
      }
    });

    const collisionSource = map.getLayer(TILED_MAP_CONFIG.collisionLayer);
    if (collisionSource) {
      this.walls = map.createLayer(TILED_MAP_CONFIG.collisionLayer, tileset, 0, 0);
      this.walls.setVisible(false);
      this.walls.setCollisionByExclusion([-1]);
    } else {
      this.walls = this.physics.add.staticGroup();
    }

    this.applyTiledObjects(map);
    return true;
  }

  findTiledTileset(map) {
    return map.tilesets.find((tileset) => {
      return tileset.name === TILED_MAP_CONFIG.tilesetName || tileset.name === TILED_MAP_CONFIG.tilesetImageKey;
    }) || map.tilesets[0];
  }

  applyTiledObjects(map) {
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

      if (objectType === "player_start") {
        this.playerStart = { x, y };
      } else if (objectType === "broom_upgrade") {
        this.broomSpawn = { x, y };
      } else if (objectType === "slime_spawn") {
        slimeSpawnPoints.push([x, y]);
      } else if (objectType === "flower") {
        flowerPositions.push([x, y]);
      }
    });

    this.slimeSpawnPoints = slimeSpawnPoints;
    this.finalFlowerPositions = flowerPositions.length > 0 ? flowerPositions : null;
  }

  createLargeBenchOverlays() {
    const benchPositions = [
      [585, 592],
      [990, 374],
    ];

    benchPositions.forEach(([x, y]) => {
      const bench = this.add.image(x, y, "bench_tile");
      bench.setDisplaySize(96, 54);
      bench.setDepth(2.5);
    });
  }

  createSangcheoriNpc() {
    const positions = [
      [420, 226],
      [756, 310],
      [1028, 354],
      [560, 650],
      [1120, 602],
      [310, 760],
    ].filter(([x, y]) => !this.isBlockedSpawnPoint(x, y));
    const [x, y] = Phaser.Utils.Array.GetRandom(positions);

    this.sangcheoriNpc = this.add.image(x, y, "sangcheori_npc");
    this.sangcheoriNpc.setDisplaySize(
      GAME_CONFIG.sangcheoriNpcDisplaySize,
      GAME_CONFIG.sangcheoriNpcDisplaySize,
    );
    this.sangcheoriNpc.setDepth(3.5);
    this.sangcheoriNpc.setInteractive({ useHandCursor: true });
    this.sangcheoriNpc.on("pointerdown", (pointer) => {
      pointer.event?.preventDefault();
      pointer.event?.stopPropagation();
      this.showNpcSpeech();
    });
    this.tweens.add({
      targets: this.sangcheoriNpc,
      y: y - 5,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  createFallbackMap() {
    this.physics.world.setBounds(0, 0, GAME_CONFIG.worldWidth, GAME_CONFIG.worldHeight);
    this.cameras.main.setBounds(0, 0, GAME_CONFIG.worldWidth, GAME_CONFIG.worldHeight);

    this.add.rectangle(768, 480, GAME_CONFIG.worldWidth, GAME_CONFIG.worldHeight, 0x6c7a55);
    this.addTiledRect(768, 480, GAME_CONFIG.worldWidth, GAME_CONFIG.worldHeight, "grass_tile");

    this.addTiledRect(475, 420, 1200, 118, "path_tile");
    this.addTiledRect(652, 392, 122, 386, "path_tile");
    this.addTiledRect(870, 300, 910, 104, "path_tile", -18);
    this.addTiledRect(1012, 512, 690, 78, "sidewalk_tile", -14);
    this.addTiledRect(480, 625, 830, 82, "sidewalk_tile", -18);
    this.addTiledRect(176, 650, 352, 82, "path_tile");
    this.addTiledRect(168, 760, 336, 88, "sidewalk_tile", -18);
    this.add.ellipse(650, 420, 194, 154, 0xd8c59a);

    this.add.rectangle(1090, 690, 426, 274, 0xb8c1bd);
    this.addTiledRect(1090, 690, 342, 190, "building_tile");
    this.add.rectangle(1090, 575, 240, 18, 0xe8f3ef);
    this.add.rectangle(1390, 480, 292, GAME_CONFIG.worldHeight, 0x52645d);
    this.addTiledRect(1442, 480, 112, GAME_CONFIG.worldHeight, "road_tile");
    this.add.rectangle(1478, 480, 6, 900, 0xffffff).setAngle(-12);

    this.add.rectangle(310, 226, 500, 96, 0x60704c);
    this.add.rectangle(260, 710, 460, 92, 0x60704c);
    this.add.rectangle(934, 226, 140, 62, 0x60704c);

    this.addTiledRect(158, 342, 316, 172, "garden_tile");
    this.addTiledRect(180, 540, 360, 128, "garden_tile");
    this.addTiledRect(502, 350, 170, 84, "garden_tile");
    this.addTiledRect(246, 526, 270, 148, "garden_tile");
    this.addTiledRect(1030, 418, 310, 132, "garden_tile");
    this.addTiledRect(1028, 496, 286, 110, "grass_tile");

    this.createTrees();

    this.walls = this.physics.add.staticGroup();
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
    const wall = this.add.rectangle(x, y, width, height, 0x6c7a55);
    wall.setVisible(false);
    this.physics.add.existing(wall, true);
    this.walls.add(wall);
  }

  addTiledRect(x, y, width, height, texture, angle = 0) {
    const tile = this.add.tileSprite(x, y, width, height, texture);
    tile.setAngle(angle);
    return tile;
  }

  createTrees() {
    const treePositions = [
      [180, 205],
      [225, 655],
      [402, 566],
      [516, 246],
      [744, 210],
      [806, 520],
      [930, 370],
      [1165, 330],
      [1224, 560],
      [690, 705],
    ];

    treePositions.forEach(([x, y]) => {
      this.add.circle(x, y, 34, 0x5f8b57);
      this.add.circle(x - 16, y + 8, 24, 0x4f7b4c);
      this.add.rectangle(x, y + 32, 12, 24, 0x8d5a24);
    });
  }

  createPlayer() {
    this.player = this.physics.add.sprite(this.playerStart.x, this.playerStart.y, "player");
    this.player.setDisplaySize(GAME_CONFIG.playerDisplaySize, GAME_CONFIG.playerDisplaySize);
    this.playerBaseScale = { x: this.player.scaleX, y: this.player.scaleY };
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(5);
    this.player.body.setSize(72, 76);
    this.player.body.setOffset(28, 30);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
  }

  updateCameraZoom() {
    const width = window.innerWidth || this.scale.width;
    const height = window.innerHeight || this.scale.height;
    const isWideView = width / Math.max(height, 1) > 1.35;
    const zoom = isWideView ? GAME_CONFIG.wideCameraZoom : 1;

    this.cameras.main.setZoom(zoom);
  }

  spawnTrashWave() {
    this.waveCleanedCount = 0;
    this.currentWave += 1;
    const positions = this.createRandomSlimePositions();
    const canIndexes = new Set(Phaser.Utils.Array.Shuffle(
      Array.from({ length: positions.length }, (_, index) => index),
    ).slice(0, Math.min(GAME_CONFIG.canCount, positions.length)));

    positions.forEach(([x, y], index) => {
      const isCan = canIndexes.has(index);
      const slime = this.trashSlimes.create(x, y, isCan ? "trash_can" : "trash_slime");
      slime.setDisplaySize(
        isCan ? GAME_CONFIG.slimeDisplaySize * 0.88 : GAME_CONFIG.slimeDisplaySize,
        isCan ? GAME_CONFIG.slimeDisplaySize * 0.88 : GAME_CONFIG.slimeDisplaySize,
      );
      slime.refreshBody();
      slime.setDepth(4);
      slime.setData("cleaned", false);
      slime.setData("trashType", isCan ? "can" : "slime");
      slime.setAlpha(0);
      slime.setScale(0.35);
      this.tweens.add({
        targets: slime,
        alpha: 1,
        scaleX: GAME_CONFIG.slimeDisplaySize / slime.width,
        scaleY: GAME_CONFIG.slimeDisplaySize / slime.height,
        duration: 220,
        ease: "Back.easeOut",
        onComplete: () => {
          this.tweens.add({
            targets: slime,
            y: y - 5,
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
          });
        },
      });
    });

    this.updateHud();
  }

  createRandomSlimePositions() {
    if (this.slimeSpawnPoints.length > 0) {
      const positions = Phaser.Utils.Array.Shuffle([...this.slimeSpawnPoints]);
      if (positions.length >= GAME_CONFIG.waveSize) {
        return positions.slice(0, GAME_CONFIG.waveSize);
      }

      const extraPositions = this.createFallbackSlimePositions(GAME_CONFIG.waveSize - positions.length, positions);
      return [...positions, ...extraPositions];
    }

    return this.createFallbackSlimePositions(GAME_CONFIG.waveSize);
  }

  createFallbackSlimePositions(count, existingPositions = []) {
    const positions = [];
    const spawnAreas = [
      { left: 150, right: 1040, top: 360, bottom: 470 },
      { left: 540, right: 760, top: 238, bottom: 610 },
      { left: 680, right: 1250, top: 220, bottom: 356 },
      { left: 300, right: 870, top: 570, bottom: 704 },
      { left: 860, right: 1250, top: 460, bottom: 565 },
      { left: 160, right: 460, top: 488, bottom: 620 },
    ];
    const allPositions = [...existingPositions];

    let attempts = 0;
    while (positions.length < count && attempts < 600) {
      attempts += 1;
      const area = spawnAreas[attempts % spawnAreas.length];
      const x = Phaser.Math.Between(area.left, area.right);
      const y = Phaser.Math.Between(area.top, area.bottom);
      const isFarEnough = allPositions.every(([otherX, otherY]) => {
        return Phaser.Math.Distance.Between(x, y, otherX, otherY) >= GAME_CONFIG.slimeSpawnMinDistance;
      });

      if (isFarEnough && !this.isBlockedSpawnPoint(x, y)) {
        positions.push([x, y]);
        allPositions.push([x, y]);
      }
    }

    while (positions.length < count) {
      const area = spawnAreas[Phaser.Math.Between(0, spawnAreas.length - 1)];
      positions.push([
        Phaser.Math.Between(area.left, area.right),
        Phaser.Math.Between(area.top, area.bottom),
      ]);
    }

    return positions;
  }

  isBlockedSpawnPoint(x, y) {
    const blockedAreas = [
      { left: 190, right: 550, top: 175, bottom: 277 },
      { left: 175, right: 485, top: 665, bottom: 760 },
      { left: 875, right: 1295, top: 558, bottom: 824 },
      { left: 1210, right: 1435, top: 80, bottom: 900 },
      { left: 865, right: 1002, top: 184, bottom: 278 },
      { left: 48, right: 90, top: 70, bottom: 890 },
      { left: 1446, right: 1490, top: 70, bottom: 890 },
    ];

    return blockedAreas.some((area) => {
      return x >= area.left && x <= area.right && y >= area.top && y <= area.bottom;
    });
  }

  createInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      sweep: Phaser.Input.Keyboard.KeyCodes.SPACE,
      specialEnter: Phaser.Input.Keyboard.KeyCodes.ENTER,
    });

    this.keys.sweep.on("down", () => this.handleSpaceAction());
    this.keys.specialEnter.on("down", () => this.useSangcheoriItem());
  }

  handleSpaceAction() {
    if (this.isPlayerNearSangcheoriNpc()) {
      this.showNpcSpeech();
      return;
    }

    this.trySweep();
  }

  isPlayerNearSangcheoriNpc() {
    if (!this.player || !this.sangcheoriNpc) return false;

    return Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.sangcheoriNpc.x,
      this.sangcheoriNpc.y,
    ) < 120;
  }

  showFirstGuide() {
    if (this.isMissionComplete || !this.sangcheoriNpc) return;

    this.showNpcSpeech("슬라임을 치우자");
  }

  handleMovement() {
    let horizontal =
      Number(this.cursors.right.isDown || this.keys.right.isDown) -
      Number(this.cursors.left.isDown || this.keys.left.isDown);
    let vertical =
      Number(this.cursors.down.isDown || this.keys.down.isDown) -
      Number(this.cursors.up.isDown || this.keys.up.isDown);

    if (horizontal === 0 && vertical === 0 && this.joystickVector.lengthSq() > 0) {
      horizontal = this.joystickVector.x;
      vertical = this.joystickVector.y;
    }

    const velocity = new Phaser.Math.Vector2(horizontal, vertical);
    if (velocity.lengthSq() > 0) {
      velocity.normalize();
      this.lastDirection.copy(velocity);
      this.updatePlayerDirection(velocity);
    }

    this.player.setVelocity(
      velocity.x * GAME_CONFIG.playerSpeed,
      velocity.y * GAME_CONFIG.playerSpeed,
    );
  }

  updatePlayerDirection(velocity) {
    if (Math.abs(velocity.x) > Math.abs(velocity.y)) {
      this.player.setFlipX(velocity.x < 0);
      this.player.setScale(
        this.playerBaseScale.x,
        this.playerBaseScale.y * 0.98,
      );
      this.player.clearTint();
      return;
    }

    this.player.setFlipX(false);
    if (velocity.y < 0) {
      this.player.setScale(this.playerBaseScale.x * 0.94, this.playerBaseScale.y * 1.06);
      this.player.setTint(0xd8ecff);
    } else {
      this.player.setScale(this.playerBaseScale.x, this.playerBaseScale.y);
      this.player.clearTint();
    }
  }

  startFloatingJoystick(event) {
    if (this.isMissionComplete || this.activeJoystickPointerId !== null) return;
    if (!this.isJoystickStartEvent(event)) return;

    event.preventDefault();
    this.activeJoystickPointerId = event.pointerId;
    this.joystickBase = { x: event.clientX, y: event.clientY };
    this.showJoystick(event.clientX, event.clientY);
    this.updateJoystick(event);
  }

  isJoystickStartEvent(event) {
    if (event.pointerType === "mouse") {
      return false;
    }

    if (event.clientX > window.innerWidth / 2) {
      return false;
    }

    const blockedTarget = event.target.closest?.(
      "#sweepButton, #specialButton, #fullscreenButton, #restartButton, .touch-controls, .game-header, .complete-overlay",
    );
    return !blockedTarget;
  }

  updateJoystick(event) {
    if (this.activeJoystickPointerId !== event.pointerId || !this.movePad) return;

    event.preventDefault();
    const radius = GAME_CONFIG.joystickRadius;
    const dx = event.clientX - this.joystickBase.x;
    const dy = event.clientY - this.joystickBase.y;
    const distance = Math.min(Math.hypot(dx, dy), radius);
    const angle = Math.atan2(dy, dx);
    const knobX = Math.cos(angle) * distance;
    const knobY = Math.sin(angle) * distance;

    this.joystickVector.set(knobX / radius, knobY / radius);
    this.movePad.style.left = `${event.clientX}px`;
    this.movePad.style.top = `${event.clientY}px`;
    this.moveKnob.style.transform = "translate(-50%, -50%)";
  }

  stopJoystick(event) {
    if (this.activeJoystickPointerId !== event.pointerId) return;

    event.preventDefault();
    this.activeJoystickPointerId = null;
    this.joystickVector.set(0, 0);
    this.hideJoystick();
  }

  showJoystick(x, y) {
    if (!this.movePad || !this.moveKnob) return;

    this.movePad.style.left = `${x}px`;
    this.movePad.style.top = `${y}px`;
    this.movePad.classList.add("is-visible");
    this.movePad.setAttribute("aria-hidden", "false");
    this.moveKnob.style.transform = "translate(-50%, -50%)";
  }

  hideJoystick() {
    if (!this.movePad) return;

    this.movePad.classList.remove("is-visible");
    this.movePad.setAttribute("aria-hidden", "true");
    if (this.moveKnob) {
      this.moveKnob.style.transform = "translate(-50%, -50%)";
    }
  }

  trySweep() {
    if (!this.canSweep || this.isMissionComplete) return;
    this.unlockAudio();

    this.canSweep = false;
    this.time.delayedCall(GAME_CONFIG.sweepCooldownMs, () => {
      this.canSweep = true;
    });

    const multiplier = this.hasBroomUpgrade ? GAME_CONFIG.upgradedSweepMultiplier : 1;
    const width = GAME_CONFIG.baseSweepWidth * multiplier;
    const height = GAME_CONFIG.baseSweepHeight * multiplier;
    const offset = 42 * multiplier;
    const sweepX = this.player.x + this.lastDirection.x * offset;
    const sweepY = this.player.y + this.lastDirection.y * offset;

    const sweepZone = this.add.zone(sweepX, sweepY, width, height);
    this.physics.add.existing(sweepZone);
    sweepZone.body.setAllowGravity(false);

    this.playSweepSound();
    this.showSweepEffect(sweepX, sweepY, width, height);

    this.physics.overlap(sweepZone, this.trashSlimes, (_, slime) => {
      this.cleanTrash(slime);
    });

    this.time.delayedCall(80, () => sweepZone.destroy());
  }

  showSweepEffect(x, y, width, height) {
    const sweepFlash = this.add.ellipse(x, y, width, height, 0xfff3a3, 0.42);
    sweepFlash.setStrokeStyle(5, 0xf2c94c, 0.9);
    sweepFlash.setDepth(6);

    const broomGhost = this.add.image(x, y, "broom_item");
    broomGhost.setDisplaySize(58, 58);
    broomGhost.setAlpha(0.75);
    broomGhost.setDepth(7);
    broomGhost.setRotation(this.lastDirection.angle() + 0.8);
    const broomGhostScale = broomGhost.scaleX;

    this.tweens.add({
      targets: sweepFlash,
      alpha: 0,
      scaleX: 1.18,
      scaleY: 1.18,
      duration: 180,
      ease: "Cubic.easeOut",
      onComplete: () => sweepFlash.destroy(),
    });

    this.tweens.add({
      targets: broomGhost,
      alpha: 0,
      angle: broomGhost.angle + 38,
      scaleX: broomGhostScale * 1.18,
      scaleY: broomGhostScale * 1.18,
      duration: 180,
      ease: "Cubic.easeOut",
      onComplete: () => broomGhost.destroy(),
    });

    for (let i = 0; i < 7; i += 1) {
      const dust = this.add.circle(
        x + Phaser.Math.Between(-width / 3, width / 3),
        y + Phaser.Math.Between(-height / 3, height / 3),
        Phaser.Math.Between(3, 6),
        0xffffff,
        0.8,
      );
      dust.setDepth(7);
      this.tweens.add({
        targets: dust,
        x: dust.x + Phaser.Math.Between(-18, 18),
        y: dust.y + Phaser.Math.Between(-18, 18),
        alpha: 0,
        duration: 260,
        onComplete: () => dust.destroy(),
      });
    }
  }

  cleanTrash(slime) {
    if (slime.getData("cleaned")) return;

    slime.setData("cleaned", true);
    const slimeX = slime.x;
    const slimeY = slime.y;
    slime.body.enable = false;
    this.totalCleanedCount += 1;
    this.waveCleanedCount += 1;
    const isCanTrash = slime.getData("trashType") === "can";
    if (isCanTrash) {
      this.cleanedCanCount += 1;
    }

    if (isCanTrash) {
      this.playCanCleanSound();
    } else {
      this.playCleanSound();
    }
    this.showSlimePop(slime);
    this.showCleanFeedback(slimeX, slimeY, isCanTrash);
    this.updateHud();
    this.checkSangcheoriUnlock();

    if (
      this.totalCleanedCount === GAME_CONFIG.broomUpgradeGoal &&
      !this.hasDroppedBroomUpgrade
    ) {
      this.dropBroomUpgrade();
    }

    if (this.totalCleanedCount >= GAME_CONFIG.totalGoal) {
      this.time.delayedCall(360, () => this.showMissionComplete());
      return;
    }

  }

  showSlimePop(slime) {
    this.tweens.killTweensOf(slime);
    slime.setDepth(8);

    this.tweens.add({
      targets: slime,
      y: slime.y - 18,
      scaleX: 1.2,
      scaleY: 0.8,
      alpha: 0,
      duration: 220,
      ease: "Back.easeIn",
      onComplete: () => slime.destroy(),
    });
  }

  showCleanFeedback(x, y, isCanFeedback = false) {
    const cleanRing = this.add.circle(x, y, 8, 0xffffff, 0);
    cleanRing.setStrokeStyle(4, isCanFeedback ? 0x9fd1ff : 0xffffff, 0.95);
    cleanRing.setDepth(6);

    this.tweens.add({
      targets: cleanRing,
      alpha: 0,
      radius: 34,
      duration: 320,
      ease: "Cubic.easeOut",
      onComplete: () => cleanRing.destroy(),
    });

    const sparkleCount = isCanFeedback ? GAME_CONFIG.canFeedbackSparkleCount : GAME_CONFIG.feedbackSparkleCount;
    const sparkleColor = isCanFeedback ? 0x9fd1ff : 0xfff3a3;
    for (let i = 0; i < sparkleCount; i += 1) {
      const sparkle = this.add.circle(x, y, Phaser.Math.Between(3, 5), sparkleColor, 1);
      sparkle.setDepth(7);
      this.tweens.add({
        targets: sparkle,
        x: x + Phaser.Math.Between(-42, 42),
        y: y + Phaser.Math.Between(-42, 42),
        alpha: 0,
        duration: 460,
        onComplete: () => sparkle.destroy(),
      });
    }
  }

  dropBroomUpgrade() {
    this.hasDroppedBroomUpgrade = true;

    const itemX = this.broomSpawn.x;
    const itemY = this.broomSpawn.y;
    const item = this.physics.add.sprite(itemX, itemY, "broom_item");
    item.setDisplaySize(GAME_CONFIG.broomItemDisplaySize, GAME_CONFIG.broomItemDisplaySize);
    item.body.setSize(78, 78);
    item.body.setOffset(25, 25);
    item.setImmovable(true);
    item.setDepth(4);
    item.setAlpha(0);
    const itemScale = item.scaleX;
    item.setScale(itemScale * 0.35);

    for (let i = 0; i < 18; i += 1) {
      const sparkle = this.add.circle(itemX, itemY, Phaser.Math.Between(3, 6), 0xfff3a3, 1);
      sparkle.setDepth(7);
      this.tweens.add({
        targets: sparkle,
        x: itemX + Phaser.Math.Between(-58, 58),
        y: itemY + Phaser.Math.Between(-48, 48),
        alpha: 0,
        duration: 620,
        ease: "Cubic.easeOut",
        onComplete: () => sparkle.destroy(),
      });
    }

    this.tweens.add({
      targets: item,
      alpha: 1,
      scaleX: itemScale,
      scaleY: itemScale,
      duration: 360,
      ease: "Back.easeOut",
    });

    this.tweens.add({
      targets: item,
      y: itemY - 14,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.physics.add.overlap(this.player, item, () => {
      if (this.hasBroomUpgrade) return;
      this.hasBroomUpgrade = true;
      item.destroy();
      this.playItemPickupSound();
      this.showCleanFeedback(this.player.x, this.player.y);
      this.showUpgradePulse();
      this.updateHud();
    });
  }

  showMissionComplete() {
    if (this.isMissionComplete) return;

    this.isMissionComplete = true;
    this.player.setVelocity(0, 0);
    this.playMissionCompleteSound();

    const flowerPositions = this.finalFlowerPositions ?? [
      [820, 510],
      [910, 486],
      [1010, 500],
      [1110, 522],
      [930, 430],
      [1048, 422],
      [780, 610],
      [910, 630],
      [1040, 620],
      [1170, 620],
      [690, 420],
      [610, 520],
    ];

    flowerPositions.forEach(([x, y], index) => {
      const flower = this.add.image(x, y, "flower");
      flower.setDepth(3);
      flower.setScale(0.15);
      flower.setAlpha(0);

      this.tweens.add({
        targets: flower,
        alpha: 1,
        scale: 1,
        duration: 360,
        delay: index * 90,
        ease: "Back.easeOut",
      });
    });

    for (let i = 0; i < 38; i += 1) {
      const sparkle = this.add.circle(
        Phaser.Math.Between(620, 1220),
        Phaser.Math.Between(400, 675),
        Phaser.Math.Between(3, 6),
        0xfff3a3,
        1,
      );
      sparkle.setDepth(7);
      this.tweens.add({
        targets: sparkle,
        y: sparkle.y - Phaser.Math.Between(18, 42),
        alpha: 0,
        duration: Phaser.Math.Between(520, 900),
        delay: Phaser.Math.Between(0, 420),
        ease: "Cubic.easeOut",
        onComplete: () => sparkle.destroy(),
      });
    }

    const pulse = this.add.rectangle(960, 540, 620, 310, 0xfff3a3, 0.18);
    pulse.setDepth(2);
    this.tweens.add({
      targets: pulse,
      alpha: 0,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 720,
      ease: "Cubic.easeOut",
      onComplete: () => pulse.destroy(),
    });

    this.updateHud();
    this.showCompleteOverlay();
  }

  showCompleteOverlay() {
    if (this.resultTrashCountEl) {
      this.resultTrashCountEl.textContent = `쓰레기 ${this.totalCleanedCount}개`;
    }
    if (this.resultCanCountEl) {
      this.resultCanCountEl.textContent = `캔 ${this.cleanedCanCount}개`;
    }
    if (this.resultHelpUsedEl) {
      this.resultHelpUsedEl.textContent = this.hasUsedSangcheori ? "상처리 도움 완료" : "상처리 도움 미사용";
    }
    this.completeOverlay?.classList.add("is-visible");
    this.completeOverlay?.setAttribute("aria-hidden", "false");
  }

  checkSangcheoriUnlock() {
    if (
      this.hasUnlockedSangcheori ||
      this.hasUsedSangcheori ||
      this.cleanedCanCount < GAME_CONFIG.sangcheoriCanGoal
    ) {
      return;
    }

    this.hasUnlockedSangcheori = true;
    this.specialButton.hidden = false;
    this.specialButton.setAttribute("aria-hidden", "false");
    this.specialButton.classList.add("is-ready");
    this.playItemPickupSound();
    this.showSangcheoriUnlockToast();
    this.playThanksVoice();
    this.showCleanFeedback(this.player.x, this.player.y);
  }

  showSangcheoriUnlockToast() {
    if (!this.specialToast) return;

    this.specialToast.classList.remove("is-visible");
    this.specialToast.setAttribute("aria-hidden", "false");
    void this.specialToast.offsetWidth;
    this.specialToast.classList.add("is-visible");
    window.setTimeout(() => {
      this.specialToast?.classList.remove("is-visible");
      this.specialToast?.setAttribute("aria-hidden", "true");
    }, 1400);
  }

  showNpcSpeech(message = "캔을 모으자") {
    if (!this.sangcheoriNpc) return;

    if (message === "캔을 모으자") {
      this.playCollectCansVoice();
    }

    this.npcSpeechGroup?.destroy(true);
    const bubble = this.add.container(this.sangcheoriNpc.x, this.sangcheoriNpc.y - 62);
    const panel = this.add.rectangle(0, 0, 146, 42, 0xffffff, 0.96);
    panel.setStrokeStyle(4, 0x21352c);
    const text = this.add.text(0, -1, message, {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#21352c",
      fontStyle: "bold",
    }).setOrigin(0.5);
    const tail = this.add.rectangle(0, 24, 16, 12, 0xffffff, 0.96);
    tail.setStrokeStyle(3, 0x21352c);
    tail.setAngle(45);
    bubble.add([panel, text, tail]);
    bubble.setDepth(8);
    bubble.setAlpha(0);
    this.npcSpeechGroup = bubble;

    this.tweens.add({
      targets: bubble,
      alpha: 1,
      y: bubble.y - 8,
      duration: 160,
      ease: "Back.easeOut",
    });

    this.time.delayedCall(1600, () => {
      this.tweens.add({
        targets: bubble,
        alpha: 0,
        y: bubble.y - 8,
        duration: 180,
        onComplete: () => {
          bubble.destroy(true);
          if (this.npcSpeechGroup === bubble) {
            this.npcSpeechGroup = null;
          }
        },
      });
    });
  }

  useSangcheoriItem() {
    if (!this.hasUnlockedSangcheori || this.hasUsedSangcheori || this.isMissionComplete) {
      return;
    }

    this.hasUsedSangcheori = true;
    this.hasUnlockedSangcheori = false;
    this.specialButton.hidden = true;
    this.specialButton.setAttribute("aria-hidden", "true");
    this.specialButton.classList.remove("is-ready");
    this.playHelpVoice();
    this.playSpecialUseSound();
    this.showSangcheoriCleanCutscene();

    const remainingTrash = this.trashSlimes
      .getChildren()
      .filter((trash) => trash.active && !trash.getData("cleaned"));
    const targets = Phaser.Utils.Array.Shuffle(remainingTrash).slice(
      0,
      GAME_CONFIG.sangcheoriRemoveCount,
    );

    targets.forEach((trash, index) => {
      this.time.delayedCall(index * 80, () => {
        this.autoCleanTrash(trash);
      });
    });
  }

  showSangcheoriCleanCutscene() {
    const npc = this.add.image(384, 220, "sangcheori_npc");
    npc.setScrollFactor(0);
    npc.setDisplaySize(112, 112);
    npc.setDepth(50);
    npc.setAlpha(0);
    npc.setScale(0.35);

    const flash = this.add.ellipse(384, 240, 230, 160, 0xfff3a3, 0.36);
    flash.setScrollFactor(0);
    flash.setStrokeStyle(6, 0xf2c94c, 0.92);
    flash.setDepth(49);
    flash.setAlpha(0);

    const captionPanel = this.add.rectangle(384, 132, 164, 42, 0xffffff, 0.96);
    captionPanel.setScrollFactor(0);
    captionPanel.setStrokeStyle(4, 0x21352c);
    captionPanel.setDepth(51);
    captionPanel.setAlpha(0);

    const captionText = this.add.text(384, 131, "내가 도울께", {
      fontFamily: "Arial",
      fontSize: "22px",
      color: "#21352c",
      fontStyle: "bold",
    });
    captionText.setOrigin(0.5);
    captionText.setScrollFactor(0);
    captionText.setDepth(52);
    captionText.setAlpha(0);

    this.tweens.add({
      targets: [npc, flash, captionPanel, captionText],
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 180,
      ease: "Back.easeOut",
    });

    for (let i = 0; i < 28; i += 1) {
      const sparkle = this.add.circle(
        384,
        240,
        Phaser.Math.Between(3, 6),
        i % 2 === 0 ? 0xffffff : 0xfff3a3,
        0.95,
      );
      sparkle.setScrollFactor(0);
      sparkle.setDepth(51);
      this.tweens.add({
        targets: sparkle,
        x: 384 + Phaser.Math.Between(-150, 150),
        y: 240 + Phaser.Math.Between(-95, 105),
        alpha: 0,
        duration: Phaser.Math.Between(520, 820),
        ease: "Cubic.easeOut",
        onComplete: () => sparkle.destroy(),
      });
    }

    this.time.delayedCall(780, () => {
      this.tweens.add({
        targets: [npc, flash, captionPanel, captionText],
        alpha: 0,
        scaleX: 1.08,
        scaleY: 1.08,
        duration: 220,
        onComplete: () => {
          npc.destroy();
          flash.destroy();
          captionPanel.destroy();
          captionText.destroy();
        },
      });
    });
  }

  autoCleanTrash(trash) {
    if (!trash.active || trash.getData("cleaned")) return;

    trash.setData("cleaned", true);
    trash.body.enable = false;
    this.totalCleanedCount += 1;
    this.waveCleanedCount += 1;
    if (trash.getData("trashType") === "can") {
      this.cleanedCanCount += 1;
    }

    this.showCleanFeedback(trash.x, trash.y);
    this.showSlimePop(trash);
    this.updateHud();

    if (this.totalCleanedCount >= GAME_CONFIG.totalGoal) {
      this.time.delayedCall(360, () => this.showMissionComplete());
    }
  }

  restartGame() {
    this.completeOverlay?.classList.remove("is-visible");
    this.completeOverlay?.setAttribute("aria-hidden", "true");
    this.restartButton?.removeEventListener("click", this.restartHandler);
    this.scene.restart();
  }

  toggleFullscreen(event) {
    event?.preventDefault();

    const target = document.querySelector(".game-shell") || document.documentElement;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
      document.body.classList.remove("app-fit-mode");
      this.unlockScreenOrientation();
      return;
    }

    if (target.requestFullscreen) {
      target
        .requestFullscreen()
        .then(() => this.lockLandscapeOrientation())
        .catch(() => this.toggleAppFitMode());
    } else if (target.webkitRequestFullscreen) {
      target.webkitRequestFullscreen();
      this.lockLandscapeOrientation();
    } else {
      this.toggleAppFitMode();
    }
  }

  handleFullscreenChange() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      document.body.classList.remove("app-fit-mode");
      this.unlockScreenOrientation();
    }

    this.time.delayedCall(80, () => this.scale.refresh());
  }

  toggleAppFitMode() {
    document.body.classList.toggle("app-fit-mode");
    if (document.body.classList.contains("app-fit-mode")) {
      this.lockLandscapeOrientation();
    } else {
      this.unlockScreenOrientation();
    }

    window.scrollTo(0, 1);
    this.scale.refresh();
  }

  lockLandscapeOrientation() {
    const orientation = screen.orientation;
    if (!orientation?.lock) return;

    orientation.lock("landscape").catch(() => {
      // Some mobile browsers, especially iOS Safari, do not allow web pages to lock orientation.
    });
  }

  unlockScreenOrientation() {
    const orientation = screen.orientation;
    if (!orientation?.unlock) return;

    orientation.unlock();
  }

  showUpgradePulse() {
    const pulse = this.add.ellipse(
      this.player.x,
      this.player.y,
      GAME_CONFIG.baseSweepWidth * GAME_CONFIG.upgradedSweepMultiplier,
      GAME_CONFIG.baseSweepHeight * GAME_CONFIG.upgradedSweepMultiplier,
      0xfff3a3,
      0.24,
    );
    pulse.setStrokeStyle(5, 0xf2c94c, 0.9);
    pulse.setDepth(6);

    this.tweens.add({
      targets: pulse,
      alpha: 0,
      scaleX: 1.12,
      scaleY: 1.12,
      duration: 520,
      ease: "Cubic.easeOut",
      onComplete: () => pulse.destroy(),
    });
  }

  getAudioContext() {
    if (!this.audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      this.audioContext = new AudioContextClass();
    }

    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }

    return this.audioContext;
  }

  isSoundEnabled() {
    return this.registry.get("soundEnabled") !== false;
  }

  unlockAudio() {
    if (!this.isSoundEnabled()) return;

    const context = this.getAudioContext();
    if (context?.state === "suspended") {
      context.resume();
    }

    if (this.sound?.context?.state === "suspended") {
      this.sound.context.resume();
    }

    this.loadThanksAudioBuffer();
  }

  loadThanksAudioBuffer() {
    if (!this.isSoundEnabled()) return;
    if (this.hasStartedAudioLoad || this.thanksAudioBuffer) return;

    const context = this.getAudioContext();
    if (!context) return;

    this.hasStartedAudioLoad = true;
    fetch(new URL("assets/audio/thanks.mp3", window.location.href))
      .then((response) => response.arrayBuffer())
      .then((buffer) => context.decodeAudioData(buffer))
      .then((decodedBuffer) => {
        this.thanksAudioBuffer = decodedBuffer;
      })
      .catch(() => {
        this.hasStartedAudioLoad = false;
      });
  }

  loadAudioBuffer(path, assign) {
    const context = this.getAudioContext();
    if (!context) return Promise.reject(new Error("AudioContext unavailable"));

    return fetch(new URL(path, window.location.href))
      .then((response) => response.arrayBuffer())
      .then((buffer) => context.decodeAudioData(buffer))
      .then((decodedBuffer) => {
        this[assign] = decodedBuffer;
        return decodedBuffer;
      });
  }

  playAudioBuffer(buffer) {
    const context = this.getAudioContext();
    if (!this.isSoundEnabled() || !context || !buffer) return false;

    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    gain.gain.value = 0.95;
    source.connect(gain);
    gain.connect(context.destination);
    source.start();
    return true;
  }

  playTone({ frequency, duration, type = "sine", volume = 0.08, delay = 0 }) {
    if (!this.isSoundEnabled()) return;

    const context = this.getAudioContext();
    if (!context) return;
    if (context.state === "suspended") {
      context.resume();
    }

    const startTime = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.02);
  }

  playSweepSound() {
    this.playTone({ frequency: 520, duration: 0.08, type: "triangle", volume: 0.05 });
    this.playTone({ frequency: 260, duration: 0.11, type: "sawtooth", volume: 0.025, delay: 0.03 });
  }

  playCleanSound() {
    this.playTone({ frequency: 740, duration: 0.09, type: "square", volume: 0.045 });
    this.playTone({ frequency: 980, duration: 0.12, type: "triangle", volume: 0.055, delay: 0.06 });
  }

  playCanCleanSound() {
    this.playTone({ frequency: 880, duration: 0.07, type: "square", volume: 0.045 });
    this.playTone({ frequency: 1175, duration: 0.1, type: "triangle", volume: 0.05, delay: 0.05 });
  }

  playItemPickupSound() {
    this.playTone({ frequency: 660, duration: 0.08, type: "triangle", volume: 0.055 });
    this.playTone({ frequency: 880, duration: 0.1, type: "triangle", volume: 0.06, delay: 0.06 });
    this.playTone({ frequency: 1320, duration: 0.12, type: "sine", volume: 0.045, delay: 0.13 });
  }

  playSpecialUseSound() {
    this.playTone({ frequency: 392, duration: 0.16, type: "triangle", volume: 0.06 });
    this.playTone({ frequency: 784, duration: 0.22, type: "triangle", volume: 0.07, delay: 0.08 });
    this.playTone({ frequency: 1175, duration: 0.24, type: "sine", volume: 0.055, delay: 0.18 });
  }

  playMissionCompleteSound() {
    [523, 659, 784, 1046].forEach((frequency, index) => {
      this.playTone({
        frequency,
        duration: 0.24,
        type: "triangle",
        volume: 0.07,
        delay: index * 0.12,
      });
    });
  }

  playThanksVoice() {
    if (!this.isSoundEnabled()) return;

    this.unlockAudio();
    if (this.playAudioBuffer(this.thanksAudioBuffer)) {
      return;
    }

    this.loadAudioBuffer("assets/audio/thanks.mp3", "thanksAudioBuffer")
      .then(() => this.playThanksVoice())
      .catch(() => {
        this.playTone({ frequency: 659, duration: 0.16, type: "triangle", volume: 0.07 });
        this.playTone({ frequency: 880, duration: 0.18, type: "triangle", volume: 0.07, delay: 0.12 });
      });
  }

  playCollectCansVoice() {
    if (!this.isSoundEnabled()) return;

    this.unlockAudio();
    if (this.playAudioBuffer(this.collectCansAudioBuffer)) {
      return;
    }

    this.loadAudioBuffer("assets/audio/collect-cans.mp3", "collectCansAudioBuffer")
      .then(() => this.playCollectCansVoice())
      .catch(() => {
        this.playTone({ frequency: 392, duration: 0.14, type: "triangle", volume: 0.06 });
        this.playTone({ frequency: 523, duration: 0.16, type: "triangle", volume: 0.06, delay: 0.1 });
      });
  }

  playHelpVoice() {
    if (!this.isSoundEnabled()) return;

    this.unlockAudio();
    if (this.playAudioBuffer(this.helpAudioBuffer)) {
      return;
    }

    this.loadAudioBuffer("assets/audio/i-will-help.mp3", "helpAudioBuffer")
      .then(() => this.playHelpVoice())
      .catch(() => {
        this.playTone({ frequency: 523, duration: 0.14, type: "triangle", volume: 0.06 });
        this.playTone({ frequency: 659, duration: 0.16, type: "triangle", volume: 0.06, delay: 0.1 });
      });
  }

  startChapterMusic() {
    if (!this.isSoundEnabled()) return;

    this.stopChapterMusic();
    this.bgmIndex = TILED_MAP_CONFIG.chapter;
    this.playNextChapterTrack();
  }

  playNextChapterTrack() {
    if (!this.isSoundEnabled()) return;

    const cachedKey = `chapter${this.bgmIndex}_bgm`;
    if (this.cache.audio.exists(cachedKey)) {
      this.bgmAudio = this.sound.add(cachedKey, { volume: 0.32 });
      this.bgmAudio.once("complete", () => {
        this.bgmIndex += 1;
        this.playNextChapterTrack();
      });
      this.bgmAudio.play();
      return;
    }

    const trackPaths = [
      `assets/audio/chapter${this.bgmIndex}.mp3`,
      `assets/chapter${this.bgmIndex}.mp3`,
    ];
    this.fetchFirstExistingTrack(trackPaths)
      .then((response) => {
        if (!response) {
          if (this.bgmIndex !== TILED_MAP_CONFIG.chapter) {
            this.bgmIndex = TILED_MAP_CONFIG.chapter;
            this.playNextChapterTrack();
          }
          return null;
        }
        return response.blob();
      })
      .then((blob) => {
        if (!blob) return;

        this.bgmObjectUrl = URL.createObjectURL(blob);
        this.bgmAudio = new Audio(this.bgmObjectUrl);
        this.bgmAudio.volume = 0.32;
        this.bgmAudio.addEventListener(
          "ended",
          () => {
            this.cleanupBgmObjectUrl();
            this.bgmIndex += 1;
            this.playNextChapterTrack();
          },
          { once: true },
        );
        this.bgmAudio.play().catch(() => {});
      })
      .catch(() => {});
  }

  fetchFirstExistingTrack(paths) {
    const [path, ...rest] = paths;
    if (!path) {
      return Promise.resolve(null);
    }

    return fetch(new URL(path, window.location.href), { cache: "no-store" }).then((response) => {
      if (response.ok) {
        return response;
      }
      return this.fetchFirstExistingTrack(rest);
    });
  }

  stopChapterMusic() {
    if (this.bgmAudio) {
      if (typeof this.bgmAudio.stop === "function") {
        this.bgmAudio.stop();
        this.bgmAudio.destroy?.();
      } else {
        this.bgmAudio.pause();
        this.bgmAudio.removeAttribute("src");
      }
      this.bgmAudio = null;
    }
    this.cleanupBgmObjectUrl();
  }

  cleanupBgmObjectUrl() {
    if (this.bgmObjectUrl) {
      URL.revokeObjectURL(this.bgmObjectUrl);
      this.bgmObjectUrl = null;
    }
  }

  updateHud() {
    const visibleWaveCount = this.isMissionComplete
      ? this.cleanProgressEls.length
      : Math.floor((this.totalCleanedCount / GAME_CONFIG.totalGoal) * this.cleanProgressEls.length);

    this.cleanProgressEls?.forEach((dot, index) => {
      dot.classList.toggle("is-cleaned", index < visibleWaveCount);
    });

    this.canProgressEls?.forEach((dot, index) => {
      dot.classList.toggle("is-cleaned", index < this.cleanedCanCount);
    });

    if (this.missionCountEl) {
      this.missionCountEl.textContent = `${this.totalCleanedCount}/${GAME_CONFIG.totalGoal}`;
    }

    this.sweepButton?.classList.toggle("is-upgraded", this.hasBroomUpgrade);

    if (this.specialButton) {
      this.specialButton.hidden = !this.hasUnlockedSangcheori || this.hasUsedSangcheori;
      this.specialButton.classList.toggle("is-ready", this.hasUnlockedSangcheori && !this.hasUsedSangcheori);
    }
  }
}
