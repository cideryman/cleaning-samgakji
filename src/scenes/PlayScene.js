const GAME_CONFIG = {
  worldWidth: 1536,
  worldHeight: 960,
  playerSpeed: 135,
  waveSize: 30,
  totalGoal: 30,
  canCount: 20,
  sangcheoriRemoveCount: 10,
  playerDisplaySize: 64,
  slimeDisplaySize: 42,
  broomItemDisplaySize: 44,
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
  // 새로운 경제 시스템 설정
  slimeRespawnDelayMs: 12000,    // 12초 후 리스폰
  maxSlimes: 25,                 // 동시 최대 슬라임 수
  rewardPerSlime: 100,           // 슬라임당 100원
  recycleDepositReward: 100,
  recycleQuestUnlockMoney: 25000,
  jjookQuestUnlockMoney: 45000,
  drinkPrice: 1000,
  speedBuffMultiplier: 1.35,
  speedBuffDurationMs: 60000,
  jjookFollowDurationMs: 60000,
  chapter1TargetMoney: 100000,   // 챕터1 목표 금액
  recyclingCenter: { x: 1210, y: 420 },
  vendingMachine: { x: 690, y: 465 },
  jjookSpawn: { x: 685, y: 545 },
  walletSpawn: { x: 250, y: 735 },
  recycleBinHitboxWidth: 82,
  recycleBinHitboxHeight: 90,
};

const DRINK_OPTIONS = [
  { key: "cider", label: "사이다", texture: "drink_cider" },
  { key: "cola", label: "콜라", texture: "drink_cola" },
  { key: "water", label: "생수", texture: "drink_water" },
];

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

const PLAYER_TEXTURES = {
  down: "player",
  left: "player_left",
  right: "player_right",
  up: "player_back",
};

const TRASH_TEXTURES = {
  can: ["trash_can", "trash_can_2", "trash_can_3"],
  normal: ["trash_slime", "trash_slime_2"],
  plastic: ["trash_plastic"],
};

const RECYCLE_BIN_CONFIG = [
  { type: "can", texture: "recycle_bin_can", xOffset: -84, yOffset: 28, label: "캔/고철" },
  { type: "normal", texture: "recycle_bin_normal", xOffset: 0, yOffset: 28, label: "종이/일반" },
  { type: "plastic", texture: "recycle_bin_plastic", xOffset: 84, yOffset: 28, label: "플라스틱" },
];

class PlayScene extends Phaser.Scene {
  constructor() {
    super("PlayScene");
    this.totalCleanedCount = 0;
    this.waveCleanedCount = 0;
    this.currentWave = 0;
    this.hasBroomUpgrade = false;
    this.hasDroppedBroomUpgrade = false;
    this.cleanedCanCount = 0;
    this.recyclingInventory = { normal: 0, can: 0, plastic: 0 };
    this.isRecycleMaster = false;
    this.inventoryCaptionQueue = [];
    this.isShowingInventoryCaption = false;
    this.jjookQuestState = "locked";
    this.hasAnnouncedJjookQuest = false;
    this.hasWallet = false;
    this.selectedDrink = null;
    this.drinkInventory = [];
    this.isSpeedBuffActive = false;
    this.isJjookFollowActive = false;
    this.jjookFollowEndsAt = 0;
    this.jjookStateBeforeVending = null;
    this.shouldCompleteJjookAfterDrink = false;
    this.speedBuffTimer = null;
    this.speedBuffIconGroup = null;
    this.questMarkers = {};
    this.vendingMenuOptions = [];
    this.selectedVendingIndex = 0;
    this.vendingMenuInputLockedUntil = 0;
    this.hasAnnouncedRecycleQuest = false;
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
    this.clearSlimeAudioBuffer = null;
    this.bgmAudio = null;
    this.bgmIndex = 1;
    this.bgmObjectUrl = null;
    this.hasStartedAudioLoad = false;
    this.playerStart = { x: 170, y: 424 };
    this.broomSpawn = { x: 650, y: 420 };
    this.slimeSpawnPoints = [];
    this.finalFlowerPositions = null;
    // 챕터 및 경제 시스템 관련
    this.currentChapter = 1;
    this.isChapterComplete = false;
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
    this.speedBuffHudEl = document.querySelector("#speedBuffHud");
    this.resultTrashCountEl = document.querySelector("#resultTrashCount");
    this.resultCanCountEl = document.querySelector("#resultCanCount");
    this.resultHelpUsedEl = document.querySelector("#resultHelpUsed");
    this.inventoryNormalCountEl = document.querySelector("#inventoryNormalCount");
    this.inventoryPlasticCountEl = document.querySelector("#inventoryPlasticCount");
    this.inventoryCanCountEl = document.querySelector("#inventoryCanCount");
    this.restartButton = document.querySelector("#restartButton");
    this.restartHandler = () => this.restartGame();
    this.sweepHandler = (event) => {
      event?.preventDefault();
      event?.stopPropagation();
      this.handlePrimaryAction();
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
    this.devKeyHandler = (event) => this.handleDevKeydown(event);
    this.pageAudioStopHandler = () => this.stopAudioForPageExit();
    this.visibilityChangeHandler = () => {
      if (document.hidden) this.stopAudioForPageExit();
    };
    this.restartButton?.addEventListener("click", this.restartHandler);
    this.sweepButton?.addEventListener("pointerdown", this.sweepHandler);
    this.specialButton?.addEventListener("pointerdown", this.specialHandler);
    window.addEventListener("pointerdown", this.audioUnlockHandler, { passive: true });
    window.addEventListener("keydown", this.audioUnlockHandler);
    window.addEventListener("keydown", this.devKeyHandler, true);
    window.addEventListener("pointerdown", this.moveStartHandler);
    window.addEventListener("pointermove", this.moveUpdateHandler);
    window.addEventListener("pointerup", this.moveStopHandler);
    window.addEventListener("pointercancel", this.moveStopHandler);
    this.fullscreenButton?.addEventListener("click", this.fullscreenHandler);
    document.addEventListener("fullscreenchange", this.fullscreenChangeHandler);
    document.addEventListener("webkitfullscreenchange", this.fullscreenChangeHandler);
    window.addEventListener("resize", this.resizeHandler);
    window.addEventListener("orientationchange", this.resizeHandler);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.resizeHandler);
    window.addEventListener("pagehide", this.pageAudioStopHandler);
    window.addEventListener("beforeunload", this.pageAudioStopHandler);
    document.addEventListener("visibilitychange", this.visibilityChangeHandler);
    this.completeOverlay?.classList.remove("is-visible");
    this.completeOverlay?.setAttribute("aria-hidden", "true");
    this.specialToast?.classList.remove("is-visible");
    this.specialToast?.setAttribute("aria-hidden", "true");
    this.hideJoystick();
    
    // ===== 시스템 초기화 =====
    this.dialogueSystem = new DialogueSystem(this);
    this.moneySystem = new MoneySystem(this);
    this.questManager = new QuestManager(this);
    this.isInDialogue = false;
    this.isContractActive = false;   // 챕터2에서 사용
    this.currentChapter = 1;
    this.isChapterComplete = false;
    
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.stopChapterMusic();
      this.restartButton?.removeEventListener("click", this.restartHandler);
      this.sweepButton?.removeEventListener("pointerdown", this.sweepHandler);
      this.specialButton?.removeEventListener("pointerdown", this.specialHandler);
      window.removeEventListener("pointerdown", this.audioUnlockHandler);
      window.removeEventListener("keydown", this.audioUnlockHandler);
      window.removeEventListener("keydown", this.devKeyHandler, true);
      window.removeEventListener("pointerdown", this.moveStartHandler);
      window.removeEventListener("pointermove", this.moveUpdateHandler);
      window.removeEventListener("pointerup", this.moveStopHandler);
      window.removeEventListener("pointercancel", this.moveStopHandler);
      this.fullscreenButton?.removeEventListener("click", this.fullscreenHandler);
      document.removeEventListener("fullscreenchange", this.fullscreenChangeHandler);
      document.removeEventListener("webkitfullscreenchange", this.fullscreenChangeHandler);
      window.removeEventListener("resize", this.resizeHandler);
      window.removeEventListener("orientationchange", this.resizeHandler);
      this.scale.off(Phaser.Scale.Events.RESIZE, this.resizeHandler);
      window.removeEventListener("pagehide", this.pageAudioStopHandler);
      window.removeEventListener("beforeunload", this.pageAudioStopHandler);
      document.removeEventListener("visibilitychange", this.visibilityChangeHandler);
    });

    this.createMap();
    this.createLargeBenchOverlays();
    this.createRecyclingCenter();
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
    this.recyclingInventory = { normal: 0, can: 0, plastic: 0 };
    this.isRecycleMaster = false;
    this.inventoryCaptionQueue = [];
    this.isShowingInventoryCaption = false;
    this.jjookQuestState = "locked";
    this.hasAnnouncedJjookQuest = false;
    this.hasWallet = false;
    this.selectedDrink = null;
    this.drinkInventory = [];
    this.isSpeedBuffActive = false;
    this.isJjookFollowActive = false;
    this.jjookFollowEndsAt = 0;
    this.jjookStateBeforeVending = null;
    this.shouldCompleteJjookAfterDrink = false;
    this.speedBuffTimer?.remove(false);
    this.speedBuffTimer = null;
    this.speedBuffIconGroup?.clear(true, true);
    this.speedBuffIconGroup = null;
    Object.values(this.questMarkers || {}).forEach((marker) => marker.text?.destroy());
    this.questMarkers = {};
    this.vendingMenuOptions = [];
    this.selectedVendingIndex = 0;
    this.vendingMenuInputLockedUntil = 0;
    this.speedBuffHudEl?.classList.remove("is-visible");
    this.hasAnnouncedRecycleQuest = false;
    this.hasUnlockedSangcheori = false;
    this.hasUsedSangcheori = false;
    this.isMissionComplete = false;
    this.isChapterComplete = false;
    this.lastDirection.set(1, 0);
    this.joystickVector.set(0, 0);
    this.activeJoystickPointerId = null;
    this.joystickBase = { x: 0, y: 0 };
    this.canSweep = true;
    this.thanksAudioBuffer = null;
    this.collectCansAudioBuffer = null;
    this.helpAudioBuffer = null;
    this.clearSlimeAudioBuffer = null;
    this.hasStartedAudioLoad = false;
    this.playerStart = { x: 170, y: 424 };
    this.broomSpawn = { x: 650, y: 420 };
    this.slimeSpawnPoints = [];
    this.finalFlowerPositions = null;
  }

  update() {
    this.handleVendingMenuKeyboard();
    this.handleMovement();
    this.checkRecycleQuestUnlock();
    this.checkJjookQuestUnlock();
    this.checkWalletPickup();
    this.updateJjookFollower();
    this.updateQuestMarkers();
    if (!this.isChapterComplete && this.moneySystem && this.moneySystem.money >= GAME_CONFIG.chapter1TargetMoney) {
      this.completeChapter1();
    }
  }

  setQuestMarker(key, target, symbol = "!") {
    if (!key || !target) return;

    const existing = this.questMarkers[key];
    if (existing) {
      existing.target = target;
      existing.text.setText(symbol);
      existing.text.setVisible(true);
      return;
    }

    const text = this.add.text(target.x, target.y - 64, symbol, {
      fontFamily: "Arial",
      fontSize: "28px",
      color: "#fff3a3",
      fontStyle: "bold",
      stroke: "#21352c",
      strokeThickness: 6,
    });
    text.setOrigin(0.5);
    text.setDepth(12);
    this.questMarkers[key] = { target, text, offset: Phaser.Math.Between(0, 628) };
  }

  clearQuestMarker(key) {
    const marker = this.questMarkers?.[key];
    if (!marker) return;

    marker.text?.destroy();
    delete this.questMarkers[key];
  }

  updateQuestMarkers() {
    if (!this.questMarkers) return;

    Object.values(this.questMarkers).forEach((marker) => {
      if (!marker.target?.active || !marker.text?.active) {
        return;
      }
      const bob = Math.sin((this.time.now + marker.offset) / 220) * 4;
      marker.text.setPosition(
        marker.target.x,
        marker.target.y - marker.target.displayHeight / 2 - 20 + bob,
      );
    });
  }

  checkRecycleQuestUnlock() {
    if (!this.moneySystem || !this.questManager || this.hasAnnouncedRecycleQuest) return;
    if (this.moneySystem.money < GAME_CONFIG.recycleQuestUnlockMoney) return;

    this.hasAnnouncedRecycleQuest = true;
    const didUnlock = this.questManager.unlockRecycleQuest();
    if (!didUnlock) return;

    this.moveSangcheoriToRecyclingCenter();
    this.setQuestMarker("recycleQuest", this.sangcheoriNpc, "!");
    this.showQuestToast("여비 아저씨가 분리수거장에서 기다리고 있어!", 10000);
    this.showSpeechBubble(this.sangcheoriNpc, "분리수거장으로 와!", 10000);
  }

  checkJjookQuestUnlock() {
    if (!this.moneySystem || !this.questManager || this.hasAnnouncedJjookQuest) return;
    if (this.questManager.getRecycleQuestState() !== "completed") return;
    if (this.moneySystem.money < GAME_CONFIG.jjookQuestUnlockMoney) return;

    this.hasAnnouncedJjookQuest = true;
    this.jjookQuestState = "wallet_missing";
    this.createJjookQuestObjects();
    this.setQuestMarker("jjookQuest", this.jjookNpc, "?");
    this.showQuestToast("쭉쭉이가 자판기 앞에서 기다리고 있어!", 10000);
    this.showSpeechBubble(this.jjookNpc, "내 지갑 어디 갔지?", 10000);
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

  createRecyclingCenter() {
    const center = GAME_CONFIG.recyclingCenter;
    this.recycleBins = [];

    const vendingMachine = this.add.image(
      GAME_CONFIG.vendingMachine.x,
      GAME_CONFIG.vendingMachine.y,
      "vending_machine_full",
    );
    vendingMachine.setDisplaySize(96, 118);
    vendingMachine.setDepth(3.2);
    vendingMachine.setInteractive({ useHandCursor: true });
    vendingMachine.on("pointerdown", (pointer) => {
      pointer.event?.preventDefault();
      pointer.event?.stopPropagation();
      this.handleVendingMachineInteraction();
    });
    this.vendingMachine = vendingMachine;

    RECYCLE_BIN_CONFIG.forEach((binConfig) => {
      const x = center.x + binConfig.xOffset;
      const y = center.y + binConfig.yOffset + 76;
      const bin = this.add.image(x, y, binConfig.texture);
      bin.setDisplaySize(70, 78);
      bin.setDepth(3.4);

      const label = this.add.text(x, y + 58, binConfig.label, {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#21352c",
        fontStyle: "bold",
        backgroundColor: "rgba(255,255,255,0.78)",
        padding: { left: 5, right: 5, top: 2, bottom: 2 },
      });
      label.setOrigin(0.5);
      label.setDepth(3.5);

      const zone = this.add.zone(
        x,
        y + 28,
        GAME_CONFIG.recycleBinHitboxWidth,
        GAME_CONFIG.recycleBinHitboxHeight,
      );
      this.physics.add.existing(zone, true);
      zone.setData("recycleType", binConfig.type);
      this.recycleBins.push({ ...binConfig, x, y, bin, label, zone });
    });
  }

  getSangcheoriRecyclePosition() {
    return {
      x: GAME_CONFIG.recyclingCenter.x - 270,
      y: GAME_CONFIG.recyclingCenter.y + 28,
    };
  }

  createJjookQuestObjects() {
    if (!this.jjookNpc) {
      const { x, y } = GAME_CONFIG.jjookSpawn;
      this.jjookNpc = this.add.image(x, y, "jjook_npc");
      this.jjookNpc.setDisplaySize(48, 96);
      this.jjookNpc.setDepth(4.2);
      this.jjookNpc.setInteractive({ useHandCursor: true });
      this.jjookNpc.on("pointerdown", (pointer) => {
        pointer.event?.preventDefault();
        pointer.event?.stopPropagation();
        this.handleJjookInteraction();
      });
      this.tweens.add({
        targets: this.jjookNpc,
        y: y - 5,
        duration: 780,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

  }

  handleVendingMachineInteraction() {
    if (this.isInDialogue || this.vendingMenuGroup) return;

    if (this.jjookQuestState === "completed") {
      this.openVendingMenu({ completeQuestOnSelect: false });
      return;
    }

    if (this.jjookQuestState === "wallet_found") {
      this.handleJjookInteraction();
      return;
    }

    this.dialogueSystem?.start([
      {
        name: "해냄이",
        text: "아냐, 돈을 더 모아야 해.",
      },
    ]);
  }

  spawnWalletItem() {
    if (this.walletItem?.active) return;

    const { x, y } = GAME_CONFIG.walletSpawn;
    this.walletItem = this.physics.add.image(x, y, "wallet_item");
    this.walletItem.setDisplaySize(42, 34);
    this.walletItem.setDepth(4.1);
    this.walletItem.body.setSize(110, 82);
    this.walletItem.body.setOffset(170, 145);

    this.tweens.add({
      targets: this.walletItem,
      y: y - 7,
      duration: 640,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.walletSparkles = this.time.addEvent({
      delay: 360,
      loop: true,
      callback: () => this.showWalletSparkle(),
    });

    this.physics.add.overlap(this.player, this.walletItem, () => this.collectWallet());
  }

  showWalletSparkle() {
    if (!this.walletItem?.active) return;

    const sparkle = this.add.circle(
      this.walletItem.x + Phaser.Math.Between(-26, 26),
      this.walletItem.y + Phaser.Math.Between(-22, 20),
      Phaser.Math.Between(3, 5),
      0x79c6ff,
      0.95,
    );
    sparkle.setDepth(7);
    this.tweens.add({
      targets: sparkle,
      y: sparkle.y - 22,
      alpha: 0,
      duration: 520,
      ease: "Cubic.easeOut",
      onComplete: () => sparkle.destroy(),
    });
  }

  collectWallet() {
    if (this.hasWallet || this.jjookQuestState !== "wallet_missing") return;

    this.hasWallet = true;
    this.jjookQuestState = "wallet_found";
    this.walletSparkles?.remove(false);
    this.walletItem?.destroy();
    this.walletItem = null;
    this.playItemPickupSound();
    this.setQuestMarker("jjookQuest", this.jjookNpc, "!");
    this.showQuestToast("갈색 지갑을 찾았다!");
    this.showSpeechBubble(this.player, "지갑 찾았다!");
  }

  checkWalletPickup() {
    if (!this.walletItem?.active || !this.player || this.jjookQuestState !== "wallet_missing") return;

    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.walletItem.x,
      this.walletItem.y,
    );
    if (distance < 58) {
      this.collectWallet();
    }
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
      this.handlePrimaryAction();
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

  moveSangcheoriToRecyclingCenter() {
    if (!this.sangcheoriNpc) return;

    const position = this.getSangcheoriRecyclePosition();
    this.tweens.killTweensOf(this.sangcheoriNpc);
    this.sangcheoriNpc.setPosition(position.x, position.y);
    this.sangcheoriNpc.setDepth(3.6);
    this.tweens.add({
      targets: this.sangcheoriNpc,
      y: position.y - 5,
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
    this.playerDirectionKey = "down";
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(5);
    this.player.body.setSize(72, 76);
    this.player.body.setOffset(28, 30);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
  }

  updateCameraZoom() {
    const width = window.innerWidth || this.scale.width;
    const height = window.innerHeight || this.scale.height;
    const isMobileLandscape = width <= 1200 && height <= 560 && width > height;
    const zoom = isMobileLandscape ? 2.05 : 1;

    this.cameras.main.setViewport(0, 0, this.scale.width, this.scale.height);
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
      const trashType = canIndexes.has(index) ? "can" : this.getRandomNonCanTrashType();
      this.createTrashSprite(x, y, trashType);
    });

    this.updateHud();
  }
  
    completeChapter1() {
    if (this.isChapterComplete) return;
    this.isChapterComplete = true;
    this.dialogueSystem.start([
      { name: "알림", text: `목표 금액 ${GAME_CONFIG.chapter1TargetMoney}원을 달성했습니다!` },
      { name: "알림", text: "다음 챕터로 이동합니다." }
    ]);
    // 추가로 챕터 전환 로직 (예: 2초 후 새 맵 로드)
    this.time.delayedCall(2000, () => {
      // this.scene.restart() 또는 다음 챕터로 이동하는 코드
      console.log("챕터2로 전환 예정");
    });
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
      { left: 470, right: 760, top: 460, bottom: 650 },
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
      devMoney: Phaser.Input.Keyboard.KeyCodes.F2,
      devTrash: Phaser.Input.Keyboard.KeyCodes.F3,
    });

    this.keys.sweep.on("down", () => this.handleSpaceAction());
    this.keys.specialEnter.on("down", () => this.useSangcheoriItem());
  }

  isDevMode() {
    const params = new URLSearchParams(window.location.search);
    return params.get("dev") === "1"
      || ["localhost", "127.0.0.1"].includes(window.location.hostname);
  }

  handleDevKeydown(event) {
    if (!this.isDevMode()) return;
    if (event.code !== "F2" && event.code !== "F3") return;

    event.preventDefault();
    event.stopPropagation();
    if (event.code === "F2") {
      this.addDevMoney();
    } else {
      this.addDevTrashInventory();
    }
  }

  addDevMoney() {
    this.moneySystem?.addMoney(10000);
    this.showQuestToast("개발 치트: 10,000원 추가");
  }

  addDevTrashInventory() {
    this.recyclingInventory.normal += 20;
    this.recyclingInventory.can += 20;
    this.recyclingInventory.plastic += 20;
    this.updateHud();
    this.showQuestToast("개발 치트: 쓰레기 20개씩 추가");
  }

  handleSpaceAction() {
    if (this.isInDialogue) {
      return;
    }

    if (this.vendingMenuGroup) {
      this.selectHighlightedVendingOption();
      return;
    }

    this.handlePrimaryAction();
  }

  handlePrimaryAction() {
    if (this.tryDepositNearestRecycleBin()) {
      return;
    }

    if (this.hasTrashInSweepRange()) {
      this.trySweep();
      return;
    }

    if (this.shouldPrioritizeJjookDialogue()) {
      this.handleJjookInteraction();
      return;
    }

    if (this.isPlayerNearVendingMachine() && !this.isInDialogue) {
      this.handleVendingMachineInteraction();
      return;
    }

    if (this.isPlayerNearJjookNpc() && !this.isInDialogue) {
      this.handleJjookInteraction();
      return;
    }

    if (this.isPlayerNearSangcheoriNpc() && !this.isInDialogue) {
      this.showSangcheoriQuestDialogue();
      return;
    }

    this.trySweep();
  }

  isPlayerNearJjookNpc() {
    if (!this.player || !this.jjookNpc) return false;

    return Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.jjookNpc.x,
      this.jjookNpc.y,
    ) < 120;
  }

  shouldPrioritizeJjookDialogue() {
    return !this.isInDialogue
      && this.jjookQuestState !== "locked"
      && this.jjookQuestState !== "completed"
      && this.isPlayerNearJjookNpc();
  }

  isPlayerNearVendingMachine() {
    if (!this.player || !this.vendingMachine) return false;

    const dx = Math.abs(this.player.x - this.vendingMachine.x);
    const dy = Math.abs(this.player.y - (this.vendingMachine.y + 6));
    return dx <= 82 && dy <= 74;
  }

  handleJjookInteraction() {
    if (this.isInDialogue || !this.dialogueSystem || this.jjookQuestState === "locked") return;

    if (this.jjookQuestState === "wallet_missing") {
      this.dialogueSystem.start([
        {
          name: "쭉쭉이",
          portraitKey: "jjookface",
          frame: 0,
          text: "아... 운동하다 지갑을 잃어버렸어... 목도 너무 마른데 어떡하지?",
        },
        {
          name: "쭉쭉이",
          portraitKey: "jjookface",
          frame: 2,
          text: "혹시 근처 수풀이나 벤치 밑을 같이 봐줄래? 갈색 지갑이야!",
        },
      ], () => {
        if (!this.walletItem?.active && !this.hasWallet) {
          this.spawnWalletItem();
        }
      });
      return;
    }

    if (this.jjookQuestState === "wallet_found") {
      this.dialogueSystem.start([
        {
          name: "쭉쭉이",
          portraitKey: "jjookface",
          frame: 1,
          text: "지갑을 찾아줘서 정말 고마워! 내가 보답으로 시원한 음료수 하나 사줄게. 해냄아, 뭐 마실래?",
        },
      ], () => this.openVendingMenu({ completeQuestOnSelect: true }));
      return;
    }

    if (this.jjookQuestState === "completed") {
      this.dialogueSystem.start([
        {
          name: "쭉쭉이",
          portraitKey: "jjookface",
          frame: 1,
          text: "나랑 같이 뛰자! 음료수가 필요하면 자판기 앞에서 골라줘.",
        },
      ]);
    }
  }

  hasTrashInSweepRange() {
    if (!this.player || !this.trashSlimes) return false;

    const multiplier = this.hasBroomUpgrade ? GAME_CONFIG.upgradedSweepMultiplier : 1;
    const range = 112 * multiplier;
    return this.trashSlimes.getChildren().some((trash) => {
      return trash.active
        && !trash.getData("cleaned")
        && Phaser.Math.Distance.Between(this.player.x, this.player.y, trash.x, trash.y) <= range;
    });
  }

  showSangcheoriQuestDialogue() {
    if (this.isInDialogue || !this.dialogueSystem || !this.questManager) return;

    const recycleState = this.questManager.getRecycleQuestState();
    if (recycleState === "unlocked") {
      this.dialogueSystem.start([
        {
          name: "여비",
          text: "오! 해냄이, 청소 실력이 대단한데? 이제 진짜 전문가는 '나눠서 버릴 줄' 알아야 해!",
        },
        {
          name: "여비",
          text: "쓰레기를 치우면 바로 100원을 받고, 퀘스트를 끝낸 뒤 분리수거장에 맞게 넣으면 100원을 더 받을 수 있어.",
        },
        {
          name: "여비",
          text: "여기 분리수거장 보이지? 일반 쓰레기 30개, 캔 10개, 플라스틱 10개를 딱 맞춰서 통에 넣어봐. 그럼 분리수거 수당을 열어줄게!",
          choices: [
            {
              label: "해볼게!",
              onSelect: () => this.questManager.startRecycleQuest(),
            },
          ],
        },
      ]);
      return;
    }

    if (recycleState === "active") {
      const quest = this.questManager.recycleQuest;
      this.dialogueSystem.start([
        {
          name: "여비",
          text: `좋아! 일반 ${quest.current.normal}/${quest.target.normal}, 캔 ${quest.current.can}/${quest.target.can}, 플라스틱 ${quest.current.plastic}/${quest.target.plastic}이야. 통 앞에서 빗자루 버튼을 눌러!`,
        },
      ]);
      return;
    }

    if (recycleState === "completed") {
      this.dialogueSystem.start([
        { name: "여비", text: "이제 모아둔 쓰레기를 맞는 통에 넣어봐. 하나 넣을 때마다 분리수거 수당 100원을 받을 수 있어!" },
      ]);
      return;
    }

    const questState = this.questManager.getQuestState();
    if (questState === "inactive") {
      this.dialogueSystem.start([
        {
          name: "여비",
          text: "안녕! 혹시 나 좀 도와줄 수 있어?",
          choices: [
            {
              label: "예",
              onSelect: () => {
                this.dialogueSystem.start(
                  [
                    {
                      name: "여비",
                      text: "고마워! 캔 20개만 모아주면 특별한 선물을 줄게!",
                    },
                  ],
                  () => this.questManager.startQuest(),
                );
              },
            },
            {
              label: "아니오",
              onSelect: () => {
                this.dialogueSystem.start([
                  { name: "여비", text: "아... 그래. 다음에 꼭 부탁할게." },
                ]);
              },
            },
          ],
        },
      ]);
      return;
    }

    if (questState === "active") {
      this.dialogueSystem.start([
        { name: "여비", text: "아직 캔 20개 모으는 중이구나? 힘내!" },
      ]);
      return;
    }

    this.dialogueSystem.start([
      { name: "여비", text: "오늘도 고마워! 깨끗한 거리를 같이 만들자." },
    ]);
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
    
    // 대화창으로 첫 가이드 표시
    const dialogue = [
      { name: "알림", text: "여행을 가려면 돈이 조금 부족해요." },
      { name: "엄마", text: "삼각지 청소를 도와주면 청소 수당을 줄게." },
      { name: "알림", text: "쓰레기를 빗자루로 치우고 수당을 모아보세요!" }
    ];
    this.dialogueSystem.start(dialogue);
  }

  handleMovement() {
    if (this.isInDialogue || this.vendingMenuGroup) {
      this.player.setVelocity(0, 0);
      return;
    }
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

    const speed = this.getPlayerSpeed();
    this.player.setVelocity(
      velocity.x * speed,
      velocity.y * speed,
    );
  }

  getPlayerSpeed() {
    return this.isSpeedBuffActive
      ? GAME_CONFIG.playerSpeed * GAME_CONFIG.speedBuffMultiplier
      : GAME_CONFIG.playerSpeed;
  }

  updateJjookFollower() {
    if (!this.isJjookFollowActive || !this.jjookNpc || !this.player) return;

    const distance = Phaser.Math.Distance.Between(this.jjookNpc.x, this.jjookNpc.y, this.player.x, this.player.y);
    if (distance <= 88) return;

    const step = (this.game.loop.delta / 1000) * 118;
    const angle = Phaser.Math.Angle.Between(this.jjookNpc.x, this.jjookNpc.y, this.player.x, this.player.y);
    this.jjookNpc.x += Math.cos(angle) * Math.min(step, distance - 88);
    this.jjookNpc.y += Math.sin(angle) * Math.min(step, distance - 88);
  }

  updatePlayerDirection(velocity) {
    if (Math.abs(velocity.x) > Math.abs(velocity.y)) {
      this.setPlayerDirectionTexture(velocity.x < 0 ? "left" : "right");
      this.player.setScale(this.playerBaseScale.x, this.playerBaseScale.y * 0.98);
      this.player.clearTint();
      return;
    }

    this.player.setFlipX(false);
    if (velocity.y < 0) {
      this.setPlayerDirectionTexture("up");
      this.player.setScale(this.playerBaseScale.x * 0.94, this.playerBaseScale.y * 1.06);
    } else {
      this.setPlayerDirectionTexture("down");
      this.player.setScale(this.playerBaseScale.x, this.playerBaseScale.y);
    }
    this.player.clearTint();
  }

  setPlayerDirectionTexture(directionKey) {
    const textureKey = PLAYER_TEXTURES[directionKey] || PLAYER_TEXTURES.down;
    if (this.playerDirectionKey === directionKey || !this.textures.exists(textureKey)) return;

    this.playerDirectionKey = directionKey;
    this.player.setTexture(textureKey);
    this.player.setDisplaySize(GAME_CONFIG.playerDisplaySize, GAME_CONFIG.playerDisplaySize);
    this.playerBaseScale = { x: this.player.scaleX, y: this.player.scaleY };
    this.player.setFlipX(false);
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

  tryDepositNearestRecycleBin() {
    if (!this.player || !this.recycleBins?.length) return false;

    const nearest = this.recycleBins.find(({ zone }) => {
      const bounds = zone.getBounds();
      return Phaser.Geom.Rectangle.Contains(bounds, this.player.x, this.player.y);
    });
    if (!nearest) return false;

    this.depositRecycleItem(nearest.type, nearest.bin);
    return true;
  }

  depositRecycleItem(type, binSprite) {
    const inventoryCount = this.recyclingInventory[type] || 0;
    if (inventoryCount <= 0) {
      const message = type === "plastic"
        ? "플라스틱을 아직 안 주웠어!"
        : "잉? 이건 여기가 아니야!";
      this.showSpeechBubble(this.player, message);
      this.playTone({ frequency: 220, duration: 0.09, type: "square", volume: 0.035 });
      return;
    }

    const recycleState = this.questManager?.getRecycleQuestState();
    if (recycleState === "locked" || recycleState === "unlocked") {
      this.showSpeechBubble(this.player, "여비 아저씨에게 먼저 물어보자!");
      return;
    }

    if (recycleState === "active") {
      const didDepositForQuest = this.questManager?.depositRecycleItem(type);
      if (!didDepositForQuest) return;

      this.recyclingInventory[type] -= 1;
      this.showRecycleDepositEffect(binSprite || this.player, type);
      this.playItemPickupSound();
      this.updateHud();
      return;
    }

    this.recyclingInventory[type] -= 1;
    this.showRecycleDepositEffect(binSprite || this.player, type);
    this.moneySystem?.addMoney(GAME_CONFIG.recycleDepositReward);
    this.playItemPickupSound();
    this.updateHud();
  }

  openVendingMenu({ completeQuestOnSelect = false } = {}) {
    if (this.vendingMenuGroup) return;

    this.jjookStateBeforeVending = this.jjookQuestState;
    this.shouldCompleteJjookAfterDrink = completeQuestOnSelect;
    this.jjookQuestState = "choosing_drink";
    this.selectedVendingIndex = 0;
    this.vendingMenuOptions = [];
    this.vendingMenuInputLockedUntil = this.time.now + 260;
    const group = this.add.group();
    this.vendingMenuGroup = group;

    const dim = this.add.rectangle(384, 240, 768, 480, 0x000000, 0.45);
    dim.setScrollFactor(0);
    dim.setDepth(60);
    group.add(dim);

    const title = this.add.text(384, 128, "마실 음료를 골라줘", {
      fontFamily: "Arial",
      fontSize: "24px",
      color: "#fff3a3",
      fontStyle: "bold",
      stroke: "#21352c",
      strokeThickness: 6,
    });
    title.setOrigin(0.5);
    title.setScrollFactor(0);
    title.setDepth(62);
    group.add(title);

    const menuOptions = [
      ...DRINK_OPTIONS,
      { key: "cancel", label: "안 산다", isCancel: true },
    ];

    menuOptions.forEach((drink, index) => {
      const x = 204 + index * 120;
      const button = this.add.rectangle(x, 236, 96, 122, 0xffffff, 0.9);
      button.setStrokeStyle(4, 0x21352c);
      button.setScrollFactor(0);
      button.setDepth(62);
      button.setInteractive({ useHandCursor: true });
      button.on("pointerdown", () => this.selectVendingOption(index));
      group.add(button);

      if (!drink.isCancel) {
        const icon = this.add.image(x, 220, drink.texture);
        icon.setDisplaySize(68, 68);
        icon.setScrollFactor(0);
        icon.setDepth(63);
        group.add(icon);
      } else {
        const cancelMark = this.add.text(x, 218, "X", {
          fontFamily: "Arial",
          fontSize: "42px",
          color: "#d45b5b",
          fontStyle: "bold",
          stroke: "#21352c",
          strokeThickness: 5,
        });
        cancelMark.setOrigin(0.5);
        cancelMark.setScrollFactor(0);
        cancelMark.setDepth(63);
        group.add(cancelMark);
      }

      const label = this.add.text(x, 280, drink.label, {
        fontFamily: "Arial",
        fontSize: "17px",
        color: "#21352c",
        fontStyle: "bold",
      });
      label.setOrigin(0.5);
      label.setScrollFactor(0);
      label.setDepth(63);
      group.add(label);

      const price = this.add.text(x, 312, `${GAME_CONFIG.drinkPrice.toLocaleString()}원`, {
        fontFamily: "Arial",
        fontSize: "17px",
        color: "#ffd966",
        fontStyle: "bold",
        stroke: "#21352c",
        strokeThickness: 4,
      });
      price.setText(drink.isCancel ? "닫기" : `${GAME_CONFIG.drinkPrice.toLocaleString()}원`);
      price.setOrigin(0.5);
      price.setScrollFactor(0);
      price.setDepth(63);
      group.add(price);

      this.vendingMenuOptions.push({ drink, button });
    });
    this.updateVendingSelection();
  }

  closeVendingMenu() {
    this.vendingMenuGroup?.clear(true, true);
    this.vendingMenuGroup = null;
    this.vendingMenuOptions = [];
    if (this.jjookQuestState === "choosing_drink") {
      this.jjookQuestState = this.jjookStateBeforeVending || "completed";
    }
  }

  handleVendingMenuKeyboard() {
    if (!this.vendingMenuGroup || !this.cursors || !this.keys) return;
    if (this.time.now < this.vendingMenuInputLockedUntil) return;

    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      this.selectedVendingIndex = Phaser.Math.Wrap(this.selectedVendingIndex - 1, 0, this.vendingMenuOptions.length);
      this.updateVendingSelection();
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      this.selectedVendingIndex = Phaser.Math.Wrap(this.selectedVendingIndex + 1, 0, this.vendingMenuOptions.length);
      this.updateVendingSelection();
    }
  }

  updateVendingSelection() {
    this.vendingMenuOptions.forEach((option, index) => {
      const isSelected = index === this.selectedVendingIndex;
      option.button.setStrokeStyle(isSelected ? 6 : 4, isSelected ? 0xffd84f : 0x21352c);
      option.button.setScale(isSelected ? 1.08 : 1);
    });
  }

  selectVendingOption(index) {
    this.selectedVendingIndex = index;
    this.updateVendingSelection();
    this.selectHighlightedVendingOption();
  }

  selectHighlightedVendingOption() {
    if (this.time.now < this.vendingMenuInputLockedUntil) return;

    const selected = this.vendingMenuOptions[this.selectedVendingIndex];
    if (!selected) return;
    this.selectDrink(selected.drink);
  }

  selectDrink(drink) {
    if (!drink || this.jjookQuestState !== "choosing_drink") return;

    if (drink.isCancel) {
      const shouldFinishQuest = this.shouldCompleteJjookAfterDrink;
      this.closeVendingMenu();
      if (shouldFinishQuest) {
        this.finishJjookQuestWithoutDrink();
      } else {
        this.showQuestToast("다음에 마시자!");
      }
      return;
    }

    if (!this.moneySystem?.deductMoney(GAME_CONFIG.drinkPrice)) {
      this.showQuestToast("돈이 1,000원 필요해!");
      return;
    }

    this.selectedDrink = drink;
    this.closeVendingMenu();
    this.playVendingPaymentAnimation(drink);
  }

  playVendingPaymentAnimation(drink) {
    const bill = this.add.image(384, 250, "bill_1000");
    bill.setScrollFactor(0);
    bill.setDisplaySize(156, 78);
    bill.setDepth(70);
    bill.setAlpha(0);

    this.playTone({ frequency: 880, duration: 0.08, type: "triangle", volume: 0.06 });
    this.tweens.add({
      targets: bill,
      alpha: 1,
      y: 205,
      duration: 220,
      ease: "Back.easeOut",
      onComplete: () => {
        this.playTone({ frequency: 1240, duration: 0.08, type: "square", volume: 0.045 });
        this.tweens.add({
          targets: bill,
          x: 480,
          y: 210,
          scaleX: bill.scaleX * 0.35,
          scaleY: bill.scaleY * 0.35,
          alpha: 0,
          duration: 420,
          ease: "Cubic.easeIn",
          onComplete: () => {
            bill.destroy();
            this.dropSelectedDrink(drink);
          },
        });
      },
    });
  }

  dropSelectedDrink(drink) {
    const can = this.add.image(384, 205, drink.texture);
    can.setScrollFactor(0);
    can.setDisplaySize(62, 62);
    can.setDepth(70);
    can.setAlpha(0);
    this.playTone({ frequency: 196, duration: 0.08, type: "square", volume: 0.06 });
    this.playTone({ frequency: 330, duration: 0.1, type: "triangle", volume: 0.05, delay: 0.07 });

    this.tweens.add({
      targets: can,
      alpha: 1,
      y: 285,
      duration: 420,
      ease: "Bounce.easeOut",
      onComplete: () => {
        this.time.delayedCall(520, () => {
          can.destroy();
          if (this.shouldCompleteJjookAfterDrink) {
            this.finishJjookQuest();
          } else {
            this.finishPurchasedDrink(drink);
          }
        });
      },
    });
  }

  finishPurchasedDrink(drink) {
    this.jjookQuestState = this.jjookStateBeforeVending || "completed";
    this.drinkInventory.push(drink.key);
    this.showQuestToast(`${drink.label}을 마셨다! 이동 속도 UP`);
    this.activateDrinkSpeedBuff();
    this.selectedDrink = null;
    this.shouldCompleteJjookAfterDrink = false;
  }

  finishJjookQuestWithoutDrink() {
    this.jjookQuestState = "completed";
    this.hasWallet = false;
    this.clearQuestMarker("jjookQuest");
    this.activateJjookFollower();
    this.shouldCompleteJjookAfterDrink = false;
    this.selectedDrink = null;
    this.dialogueSystem?.start([
      {
        name: "쭉쭉이",
        portraitKey: "jjookface",
        frame: 2,
        text: "그럼 내가 쓰레기 줍는 것이라도 도와줄게!",
      },
    ]);
  }

  finishJjookQuest() {
    this.jjookQuestState = "completed";
    this.hasWallet = false;
    this.clearQuestMarker("jjookQuest");
    if (this.selectedDrink) {
      this.drinkInventory.push(this.selectedDrink.key);
      this.showQuestToast(`${this.selectedDrink.label}을 마셨다! 이동 속도 UP`);
    }
    this.activateDrinkSpeedBuff();
    this.activateJjookFollower();
    this.shouldCompleteJjookAfterDrink = false;
    this.selectedDrink = null;
    this.dialogueSystem?.start([
      {
        name: "해냄이",
        text: "잘 먹었어, 고마워! 시원하다!",
      },
      {
        name: "쭉쭉이",
        portraitKey: "jjookface",
        frame: 2,
        text: "아냐, 내가 더 고맙지! 나도 플로깅을 좋아해. 이제 내가 쓰레기 정리를 도와줄게. 같이 하자!",
      },
    ]);
  }

  activateDrinkSpeedBuff() {
    this.isSpeedBuffActive = true;
    this.speedBuffTimer?.remove(false);
    this.showBuffIcon("speed_buff_icon", "이동 속도 UP", GAME_CONFIG.speedBuffDurationMs);
    this.speedBuffTimer = this.time.delayedCall(GAME_CONFIG.speedBuffDurationMs, () => {
      this.isSpeedBuffActive = false;
      this.showQuestToast("음료수 속도 효과가 끝났어.");
    });
  }

  activateJjookFollower() {
    this.isJjookFollowActive = true;
    this.jjookFollowEndsAt = this.time.now + GAME_CONFIG.jjookFollowDurationMs;
    this.showQuestToast("쭉쭉이가 1분 동안 플로깅을 도와줘!");
    this.time.delayedCall(GAME_CONFIG.jjookFollowDurationMs, () => {
      this.isJjookFollowActive = false;
      this.showQuestToast("쭉쭉이: 그럼 다음에 또 봐!");
      if (this.jjookNpc?.active) {
        this.showSpeechBubble(this.jjookNpc, "그럼 다음에 또 봐!", 3600);
      }
    });
  }

  showBuffIcon(textureKey, label, duration) {
    if (this.speedBuffHudEl) {
      this.speedBuffHudEl.classList.add("is-visible");
    }

    this.time.delayedCall(duration, () => {
      this.speedBuffHudEl?.classList.remove("is-visible");
    });
  }

  showRecycleDepositEffect(target, type) {
    const colorByType = {
      can: 0x6fcf97,
      normal: 0x79c6ff,
      plastic: 0xf2c94c,
    };
    const color = colorByType[type] || 0xffffff;
    this.showSpeechBubble(target, "쏙!");

    const itemTexture = this.getRandomTrashTexture(type);
    if (this.textures.exists(itemTexture)) {
      const item = this.add.image(target.x, target.y - 88, itemTexture);
      const itemSize = this.getTrashDisplaySize(itemTexture, type);
      item.setDepth(8);
      item.setDisplaySize(itemSize.width, itemSize.height);
      this.tweens.add({
        targets: item,
        y: target.y - 18,
        scaleX: item.scaleX * 0.35,
        scaleY: item.scaleY * 0.35,
        alpha: 0,
        duration: 360,
        ease: "Cubic.easeIn",
        onComplete: () => item.destroy(),
      });
    }

    for (let i = 0; i < 12; i += 1) {
      const sparkle = this.add.circle(target.x, target.y, Phaser.Math.Between(3, 5), color, 0.95);
      sparkle.setDepth(7);
      this.tweens.add({
        targets: sparkle,
        x: target.x + Phaser.Math.Between(-32, 32),
        y: target.y + Phaser.Math.Between(-42, 16),
        alpha: 0,
        duration: 420,
        ease: "Cubic.easeOut",
        onComplete: () => sparkle.destroy(),
      });
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

    this.playSweepSound();
    this.performSweepAt(sweepX, sweepY, width, height, this.lastDirection);

    if (this.isJjookFollowActive && this.jjookNpc?.active) {
      const jjookWidth = width * 0.92;
      const jjookHeight = height * 0.92;
      this.performSweepAt(this.jjookNpc.x, this.jjookNpc.y + 8, jjookWidth, jjookHeight, null);
    }
  }

  performSweepAt(x, y, width, height, direction = null) {
    const sweepZone = this.add.zone(x, y, width, height);
    this.physics.add.existing(sweepZone);
    sweepZone.body.setAllowGravity(false);

    this.showSweepEffect(x, y, width, height, direction);

    this.physics.overlap(sweepZone, this.trashSlimes, (_, slime) => {
      this.cleanTrash(slime);
    });

    this.time.delayedCall(80, () => sweepZone.destroy());
  }

  showSweepEffect(x, y, width, height, direction = this.lastDirection) {
    const sweepFlash = this.add.ellipse(x, y, width, height, 0xfff3a3, 0.42);
    sweepFlash.setStrokeStyle(5, 0xf2c94c, 0.9);
    sweepFlash.setDepth(6);

    const broomGhost = this.add.image(x, y, "broom_item");
    broomGhost.setDisplaySize(48, 48);
    broomGhost.setAlpha(0.75);
    broomGhost.setDepth(7);
    broomGhost.setRotation((direction || this.lastDirection).angle() + 0.8);
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
    const trashType = slime.getData("trashType") || "normal";
    const isCanTrash = trashType === "can";
    if (isCanTrash) {
      this.cleanedCanCount += 1;
      this.questManager?.updateQuestProgress(1);
    }
    this.addTrashToRecycleInventory(trashType);

    const reward = this.getTrashCleanReward();
    console.log(`획득: ${reward}원 (총: ${this.totalCleanedCount}개)`);
    this.moneySystem.addMoney(reward);

    if (isCanTrash) {
      this.playCanCleanSound();
    } else {
      this.playCleanSound();
    }
    this.showSlimePop(slime);
    this.showCleanFeedback(slimeX, slimeY, isCanTrash);
    this.updateHud();

    // ===== 슬라임 리스폰 시스템 =====
    this.time.delayedCall(GAME_CONFIG.slimeRespawnDelayMs, () => {
      if (this.trashSlimes.getChildren().length < GAME_CONFIG.maxSlimes) {
        this.respawnSlime();
      }
    });
  }

  addTrashToRecycleInventory(type) {
    const normalizedType = type === "slime" ? "normal" : type;
    if (!(normalizedType in this.recyclingInventory)) return;

    this.recyclingInventory[normalizedType] += 1;
    const labelByType = {
      normal: "일반 쓰레기",
      can: "캔",
      plastic: "플라스틱",
    };
    this.queueInventoryCaption(`${labelByType[normalizedType]} +1`);
  }

  getTrashCleanReward() {
    return this.isJjookFollowActive ? GAME_CONFIG.rewardPerSlime * 2 : GAME_CONFIG.rewardPerSlime;
  }

  respawnSlime() {
    const positions = this.createRandomSlimePositions();
    if (positions.length === 0) return;
    const [x, y] = positions[0];

    const trashType = Math.random() < 0.2 ? "can" : this.getRandomNonCanTrashType();
    this.createTrashSprite(x, y, trashType);
  }

  createTrashSprite(x, y, trashType = "normal") {
    const normalizedType = trashType === "slime" ? "normal" : trashType;
    const isCan = normalizedType === "can";
    const textureKey = this.getRandomTrashTexture(normalizedType);
    const slime = this.trashSlimes.create(x, y, textureKey);
    const displaySize = this.getTrashDisplaySize(textureKey, normalizedType);
    slime.setDisplaySize(displaySize.width, displaySize.height);
    slime.refreshBody();
    slime.setDepth(4);
    slime.setData("cleaned", false);
    slime.setData("trashType", normalizedType);
    slime.setAlpha(0);
    slime.setScale(0.35);
    
    this.tweens.add({
      targets: slime,
      alpha: 1,
      scaleX: displaySize.width / slime.width,
      scaleY: displaySize.height / slime.height,
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
    return slime;
  }

  getRandomNonCanTrashType() {
    return Math.random() < 0.18 && this.textures.exists("trash_plastic") ? "plastic" : "normal";
  }

  getRandomTrashTexture(trashType) {
    const textureKeys = TRASH_TEXTURES[trashType] || TRASH_TEXTURES.normal;
    const fallback = trashType === "can" ? "trash_can" : "trash_slime";
    const availableKeys = textureKeys.filter((key) => this.textures.exists(key));
    return Phaser.Utils.Array.GetRandom(availableKeys.length > 0 ? availableKeys : [fallback]);
  }

  getTrashDisplaySize(textureKey, trashType) {
    if (trashType === "plastic") {
      return { width: 30, height: 34 };
    }

    if (trashType !== "can") {
      return {
        width: GAME_CONFIG.slimeDisplaySize,
        height: GAME_CONFIG.slimeDisplaySize,
      };
    }

    if (textureKey === "trash_can_2") {
      return { width: 24, height: 32 };
    }

    return { width: 34, height: 23 };
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

  activateRecycleMasterReward() {
    if (this.isRecycleMaster) return;

    this.isRecycleMaster = true;
    this.playMoneyRewardSound();
    this.showCleanFeedback(this.player.x, this.player.y, true);
    this.showQuestToast("분리수거 수당 개방! 맞는 통에 넣으면 100원");
    this.dialogueSystem?.start([
      {
        name: "여비",
        text: "역시 해냄이야! 이제 쓰레기를 치우면 100원, 분리수거장에서 맞는 통에 넣으면 100원을 더 받을 수 있어.",
      },
      {
        name: "여비",
        text: "그리고 약속한 멋진 빗자루야. 이걸로 더 넓게 쓸어보자!",
      },
    ]);
    this.dropBroomUpgrade();
  }

  dropBroomUpgrade() {
    this.hasDroppedBroomUpgrade = true;

    const itemX = this.player ? this.player.x + 38 : this.broomSpawn.x;
    const itemY = this.player ? this.player.y : this.broomSpawn.y;
    const item = this.physics.add.sprite(itemX, itemY, "broom_item");
    item.setDisplaySize(GAME_CONFIG.broomItemDisplaySize, GAME_CONFIG.broomItemDisplaySize);
    item.body.setSize(66, 66);
    item.body.setOffset(31, 31);
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
      this.resultHelpUsedEl.textContent = this.hasUsedSangcheori ? "여비 도움 완료" : "여비 도움 미사용";
    }
    this.completeOverlay?.classList.add("is-visible");
    this.completeOverlay?.setAttribute("aria-hidden", "false");
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

  showQuestToast(message, duration = 1700) {
    const toast = document.createElement("div");
    toast.className = "quest-toast";
    toast.textContent = message;
    toast.style.setProperty("--toast-duration", `${duration}ms`);
    document.querySelector(".game-stage")?.appendChild(toast);
    window.setTimeout(() => toast.remove(), duration + 80);
  }

  showSpeechBubble(target, message, duration = 1050) {
    if (!target || !message) return;

    const bubble = this.add.text(target.x, target.y - 58, message, {
      fontFamily: "Arial",
      fontSize: "15px",
      color: "#21352c",
      fontStyle: "bold",
      backgroundColor: "rgba(255,255,255,0.94)",
      padding: { left: 8, right: 8, top: 5, bottom: 5 },
    });
    bubble.setOrigin(0.5);
    bubble.setDepth(20);

    this.tweens.add({
      targets: bubble,
      y: bubble.y - 18,
      alpha: 0,
      duration,
      ease: "Cubic.easeOut",
      onComplete: () => bubble.destroy(),
    });
  }

  queueInventoryCaption(message) {
    if (!message) return;

    this.inventoryCaptionQueue.push(message);
    this.showNextInventoryCaption();
  }

  showNextInventoryCaption() {
    if (this.isShowingInventoryCaption || this.inventoryCaptionQueue.length === 0) return;

    this.isShowingInventoryCaption = true;
    const message = this.inventoryCaptionQueue.shift();
    this.showSpeechBubble(this.player, message, 760);
    this.time.delayedCall(780, () => {
      this.isShowingInventoryCaption = false;
      this.showNextInventoryCaption();
    });
  }

  showMoneyRewardAnimation(amount, { label = "선물", icon = "./assets/ui/10000won.png" } = {}) {
    const stage = document.querySelector(".game-stage");
    if (!stage) return;

    const reward = document.createElement("div");
    reward.className = "money-reward-pop";
    reward.innerHTML = `
      <img src="${icon}" alt="${label}" />
      <strong>${label} ${amount.toLocaleString()}원</strong>
    `;
    stage.appendChild(reward);
    window.setTimeout(() => reward.remove(), 3600);
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
    this.showSangcheoriCenterMessage("내가 도울께");
  }

  showSangcheoriCenterMessage(
    caption,
    {
      panelWidth = 164,
      holdMs = 780,
      sparkleCount = 28,
      flashColor = 0xfff3a3,
      strokeColor = 0xf2c94c,
      faceOnly = false,
    } = {},
  ) {
    const npc = this.add.image(384, 220, "sangcheori_npc");
    npc.setScrollFactor(0);
    const npcFinalScale = faceOnly ? 1.7 : 1;
    if (faceOnly) {
      npc.setCrop(28, 0, 72, 60);
      npc.y = 224;
    } else {
      npc.setDisplaySize(112, 112);
    }
    npc.setDepth(50);
    npc.setAlpha(0);
    npc.setScale(0.35);

    const flash = this.add.ellipse(384, 240, 230, 160, flashColor, 0.36);
    flash.setScrollFactor(0);
    flash.setStrokeStyle(6, strokeColor, 0.92);
    flash.setDepth(49);
    flash.setAlpha(0);

    const captionPanel = this.add.rectangle(384, 132, panelWidth, 42, 0xffffff, 0.96);
    captionPanel.setScrollFactor(0);
    captionPanel.setStrokeStyle(4, 0x21352c);
    captionPanel.setDepth(51);
    captionPanel.setAlpha(0);

    const captionText = this.add.text(384, 131, caption, {
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
      targets: npc,
      alpha: 1,
      scaleX: npcFinalScale,
      scaleY: npcFinalScale,
      duration: 180,
      ease: "Back.easeOut",
    });
    this.tweens.add({
      targets: [flash, captionPanel, captionText],
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 180,
      ease: "Back.easeOut",
    });

    for (let i = 0; i < sparkleCount; i += 1) {
      const sparkle = this.add.circle(
        384,
        240,
        Phaser.Math.Between(3, 6),
        i % 2 === 0 ? 0xffffff : flashColor,
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

    this.time.delayedCall(holdMs, () => {
      this.tweens.add({
        targets: [npc, flash, captionPanel, captionText],
        alpha: 0,
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
    const trashType = trash.getData("trashType") || "normal";
    if (trashType === "can") {
      this.cleanedCanCount += 1;
      this.questManager?.updateQuestProgress(1);
    }
    this.addTrashToRecycleInventory(trashType);

    const reward = this.getTrashCleanReward();
    this.moneySystem.addMoney(reward);

    this.showCleanFeedback(trash.x, trash.y);
    this.showSlimePop(trash);
    this.updateHud();

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

  playMoneyRewardSound() {
    this.playTone({ frequency: 523, duration: 0.1, type: "triangle", volume: 0.06 });
    this.playTone({ frequency: 784, duration: 0.12, type: "triangle", volume: 0.07, delay: 0.08 });
    this.playTone({ frequency: 1046, duration: 0.16, type: "sine", volume: 0.06, delay: 0.18 });
    this.playTone({ frequency: 1568, duration: 0.2, type: "sine", volume: 0.05, delay: 0.3 });
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

  playClearSlimeVoice() {
    if (!this.isSoundEnabled()) return;

    this.unlockAudio();
    if (this.playAudioBuffer(this.clearSlimeAudioBuffer)) {
      return;
    }

    this.loadAudioBuffer("assets/audio/clear-slime.mp3", "clearSlimeAudioBuffer")
      .then(() => this.playClearSlimeVoice())
      .catch(() => {
        this.playTone({ frequency: 440, duration: 0.14, type: "triangle", volume: 0.06 });
        this.playTone({ frequency: 587, duration: 0.16, type: "triangle", volume: 0.06, delay: 0.1 });
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

  stopAudioForPageExit() {
    this.stopChapterMusic();
    this.sound?.stopAll?.();
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

    if (this.inventoryNormalCountEl) {
      this.inventoryNormalCountEl.textContent = this.recyclingInventory.normal;
    }
    if (this.inventoryPlasticCountEl) {
      this.inventoryPlasticCountEl.textContent = this.recyclingInventory.plastic;
    }
    if (this.inventoryCanCountEl) {
      this.inventoryCanCountEl.textContent = this.recyclingInventory.can;
    }

    this.sweepButton?.classList.toggle("is-upgraded", this.hasBroomUpgrade);

    if (this.specialButton) {
      this.specialButton.hidden = !this.hasUnlockedSangcheori || this.hasUsedSangcheori;
      this.specialButton.classList.toggle("is-ready", this.hasUnlockedSangcheori && !this.hasUsedSangcheori);
    }
  }
}
