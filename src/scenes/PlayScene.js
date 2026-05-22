import PlayerController from "../controllers/PlayerController.js";
import {
  DRINK_OPTIONS,
  GAME_CONFIG,
  NPC_TEXTURES,
  NPC_WALK_ANIMS,
  PLAYER_TEXTURES,
  RECYCLE_BIN_CONFIG,
  TILED_MAP_CONFIG,
} from "../config/GameConstants.js";
import { StateManager } from "../config/SceneState.js";
import CleaningSystem from "../systems/CleaningSystem.js";
import CheckpointStorage from "../systems/CheckpointStorage.js";
import DialogueManager from "../systems/DialogueManager.js";
import DialogueSystem from "../systems/DialogueSystem.js";
import InteractionSystem from "../systems/InteractionSystem.js";
import MoneySystem from "../systems/MoneySystem.js";
import PortraitManager from "../systems/PortraitManager.js";
import QuestManager from "../systems/QuestManager.js";
import SlimeSystem from "../systems/SlimeSystem.js";
import UIManager from "../systems/UIManager.js";

const CLOTHING_SHOP_ITEMS = [
  { key: "white_tshirt", label: "반팔 티셔츠", category: "top", price: 12000, texture: "shop_white_tshirt" },
  { key: "check_shirt", label: "체크 셔츠", category: "top", price: 25000, texture: "shop_check_shirt" },
  { key: "sweatshirt", label: "맨투맨", category: "top", price: 38000, texture: "shop_sweatshirt" },
  { key: "cotton_pants", label: "면바지", category: "pants", price: 29000, texture: "shop_cotton_pants" },
  { key: "jeans", label: "청바지", category: "pants", price: 45000, texture: "shop_jeans" },
  { key: "jogger_pants", label: "조거팬츠", category: "pants", price: 22000, texture: "shop_jogger_pants" },
  { key: "hoodie_jacket", label: "기본 후드집업", category: "outer", price: 39000, texture: "shop_hoodie_jacket" },
  { key: "denim_jacket", label: "청자켓", category: "outer", price: 69000, texture: "shop_denim_jacket" },
  { key: "padded_jacket", label: "브랜드 패딩", category: "outer", price: 129000, texture: "shop_padded_jacket" },
  { key: "sneakers", label: "운동화", category: "shoes", price: 49000, texture: "shop_sneakers" },
  { key: "canvas_shoes", label: "캔버스화", category: "shoes", price: 32000, texture: "shop_canvas_shoes" },
  { key: "running_shoes", label: "브랜드 러닝화", category: "shoes", price: 89000, texture: "shop_running_shoes" },
];

const CLOTHING_SHOP_CATEGORIES = [
  { key: "top", label: "상의" },
  { key: "pants", label: "하의" },
  { key: "outer", label: "외투" },
  { key: "shoes", label: "신발" },
];

const CLOTHING_SHOP_CATEGORY_LABELS = Object.fromEntries(
  CLOTHING_SHOP_CATEGORIES.map((category) => [category.key, category.label]),
);

export default class PlayScene extends Phaser.Scene {
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
    this.isJjookClothesEscortActive = false;
    this.jjookFollowEndsAt = 0;
    this.jjookFollowTimer = null;
    this.jjookFollowCountdownEvent = null;
    this.shouldBuyJjookColaAfterFollow = false;
    this.jjookStateBeforeVending = null;
    this.shouldCompleteJjookAfterDrink = false;
    this.speedBuffTimer = null;
    this.speedBuffCountdownEvent = null;
    this.sunisuniQuestState = "locked";
    this.hasAnnouncedSunisuniQuest = false;
    this.hasPrescription = false;
    this.hasMedicine = false;
    this.hasBacchus = false;
    this.hospitalRevisitUsed = false;
    this.hasReceivedPharmacyDrink = false;
    this.isBacchusActive = false;
    this.bacchusTimer = null;
    this.bacchusCountdownEvent = null;
    this.clothesQuestState = "locked";
    this.hasAnnouncedClothesQuest = false;
    this.travelPrepItems = [];
    this.isTravelPrepFanOpen = false;
    this.clothingShopModal = null;
    this.clothingShopSelectedKeys = new Set();
    this.selectedClothingShopIndex = 0;
    this.clothingShopStepIndex = 0;
    this.clothingShopMode = "category";
    this.jjookIdleTween = null;
    this.interiorSceneGroup = null;
    this.questMarkers = {};
    this.vendingMenuOptions = [];
    this.selectedVendingIndex = 0;
    this.vendingMenuInputLockedUntil = 0;
    this.hasAnnouncedRecycleQuest = false;
    this.hasUnlockedYebi = false;
    this.hasUsedYebi = false;
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
    this.mapObjects = {};
    this.objectWalls = null;
    this.objectCollisionRects = [];
    // 챕터 및 경제 시스템 관련
    this.currentChapter = 1;
    this.isChapterComplete = false;
  }

  create(data = {}) {
    this.resetRunState();
    document.body.classList.remove("start-screen");

    this.cleanProgressEls = Array.from(document.querySelectorAll("#cleanProgress span"));
    this.canProgressEls = Array.from(document.querySelectorAll("#canProgress span"));
    this.missionCountEl = document.querySelector("#missionCount");
    this.sweepButton = document.querySelector("#sweepButton");
    this.specialButton = document.querySelector("#specialButton");
    this.bacchusButton = document.querySelector("#bacchusButton");
    this.bacchusTimerEl = document.querySelector("#bacchusTimer");
    this.movePad = document.querySelector("#movePad");
    this.moveKnob = document.querySelector("#moveKnob");
    this.fullscreenButton = document.querySelector("#fullscreenButton");
    this.completeOverlay = document.querySelector("#completeOverlay");
    this.specialToast = document.querySelector("#specialToast");
    this.speedBuffHudEl = document.querySelector("#speedBuffHud");
    this.speedBuffTimerEl = document.querySelector("#speedBuffTimer");
    this.jjookFollowHudEl = document.querySelector("#jjookFollowHud");
    this.jjookFollowTimerEl = document.querySelector("#jjookFollowTimer");
    this.travelPrepHudEl = document.querySelector("#travelPrepHud");
    this.travelPrepBagIconEl = document.querySelector("#travelPrepBagIcon");
    this.travelPrepCountEl = document.querySelector("#travelPrepCount");
    this.travelPrepFanEl = document.querySelector("#travelPrepFan");
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
      this.useYebiItem();
    };
    this.bacchusHandler = (event) => {
      event?.preventDefault();
      event?.stopPropagation();
      this.useBacchusItem();
    };
    this.travelPrepHandler = (event) => {
      event?.preventDefault();
      event?.stopPropagation();
      this.toggleTravelPrepFan();
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
    this.bacchusButton?.addEventListener("pointerdown", this.bacchusHandler);
    this.travelPrepHudEl?.addEventListener("pointerdown", this.travelPrepHandler);
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
    this.stateManager = new StateManager();
    this.dialogueSystem = new DialogueSystem(this);
    this.dialogueManager = new DialogueManager(this, { dialogueSystem: this.dialogueSystem });
    this.dialogueManager.addActionHandlers({
      START_CLOTHES_SHOP: () => this.startClothesShoppingQuest(),
      DECLINE_CLOTHES_SHOP: () => this.declineClothesShoppingQuest(),
    });
    this.portraitManager = new PortraitManager(this);
    this.moneySystem = new MoneySystem(this);
    this.questManager = new QuestManager(this);
    this.playerController = new PlayerController(this);
    this.interactionSystem = new InteractionSystem(this);
    this.slimeSystem = new SlimeSystem(this);
    this.cleaningSystem = new CleaningSystem(this);
    this.uiManager = new UIManager(this);
    this.isInDialogue = false;
    this.isContractActive = false;   // 챕터 2에서 사용
    this.currentChapter = 1;
    this.isChapterComplete = false;
    
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.stopChapterMusic();
      this.restartButton?.removeEventListener("click", this.restartHandler);
      this.sweepButton?.removeEventListener("pointerdown", this.sweepHandler);
      this.specialButton?.removeEventListener("pointerdown", this.specialHandler);
      this.bacchusButton?.removeEventListener("pointerdown", this.bacchusHandler);
      this.travelPrepHudEl?.removeEventListener("pointerdown", this.travelPrepHandler);
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
      this.portraitManager?.destroy();
      this.closeClothingShopMenu();
      window.removeEventListener("pagehide", this.pageAudioStopHandler);
      window.removeEventListener("beforeunload", this.pageAudioStopHandler);
      document.removeEventListener("visibilitychange", this.visibilityChangeHandler);
    });

    this.createMap();
    this.createSunisuniAnimations();
    this.createRecyclingCenter();
    this.createYebiNpc();
    this.createSunisuniNpc();
    this.createPlayer();
    this.trashSlimes = this.physics.add.staticGroup();
    this.spawnTrashWave();
    this.createInput();
    this.updateHud();
    this.updateTravelPrepHud();
    this.updateCameraZoom();
    const restoredCheckpoint = this.restoreCheckpointIfRequested(data);

    this.physics.add.collider(this.player, this.walls);
    if (this.objectWalls) {
      this.physics.add.collider(this.player, this.objectWalls);
    }
    this.startChapterMusic();
    if (!restoredCheckpoint || this.restoredCheckpointId === "prologue_complete") {
      this.time.delayedCall(800, () => this.showFirstGuide());
    } else {
      this.time.delayedCall(600, () => this.showQuestToast("저장 지점에서 이어합니다."));
    }
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
    this.isJjookClothesEscortActive = false;
    this.jjookFollowEndsAt = 0;
    this.jjookFollowTimer?.remove(false);
    this.jjookFollowCountdownEvent?.remove(false);
    this.jjookFollowTimer = null;
    this.jjookFollowCountdownEvent = null;
    this.shouldBuyJjookColaAfterFollow = false;
    this.jjookStateBeforeVending = null;
    this.shouldCompleteJjookAfterDrink = false;
    this.speedBuffTimer?.remove(false);
    this.speedBuffCountdownEvent?.remove(false);
    this.speedBuffTimer = null;
    this.speedBuffCountdownEvent = null;
    this.sunisuniQuestState = "locked";
    this.hasAnnouncedSunisuniQuest = false;
    this.hasPrescription = false;
    this.hasMedicine = false;
    this.hasBacchus = false;
    this.hospitalRevisitUsed = false;
    this.hasReceivedPharmacyDrink = false;
    this.isBacchusActive = false;
    this.bacchusTimer?.remove(false);
    this.bacchusCountdownEvent?.remove(false);
    this.bacchusTimer = null;
    this.bacchusCountdownEvent = null;
    this.bacchusButton?.setAttribute("hidden", "");
    this.bacchusButton?.classList.remove("is-active");
    if (this.bacchusTimerEl) this.bacchusTimerEl.textContent = "";
    this.clothesQuestState = "locked";
    this.hasAnnouncedClothesQuest = false;
    this.travelPrepItems = [];
    this.clothingShopSelectedKeys = new Set();
    this.selectedClothingShopIndex = 0;
    this.clothingShopStepIndex = 0;
    this.clothingShopMode = "category";
    this.isTravelPrepFanOpen = false;
    this.closeClothingShopMenu?.();
    this.travelPrepHudEl?.classList.remove("is-visible", "is-open");
    this.travelPrepHudEl?.setAttribute("aria-hidden", "true");
    if (this.travelPrepFanEl) {
      this.travelPrepFanEl.innerHTML = "";
      this.travelPrepFanEl.setAttribute("aria-hidden", "true");
    }
    this.interiorSceneGroup?.clear(true, true);
    this.interiorSceneGroup = null;
    Object.values(this.questMarkers || {}).forEach((marker) => marker.text?.destroy());
    this.questMarkers = {};
    this.vendingMenuOptions = [];
    this.selectedVendingIndex = 0;
    this.vendingMenuInputLockedUntil = 0;
    this.speedBuffHudEl?.classList.remove("is-visible");
    this.jjookFollowHudEl?.classList.remove("is-visible");
    if (this.speedBuffTimerEl) this.speedBuffTimerEl.textContent = "";
    if (this.jjookFollowTimerEl) this.jjookFollowTimerEl.textContent = "";
    this.hasAnnouncedRecycleQuest = false;
    this.hasUnlockedYebi = false;
    this.hasUsedYebi = false;
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
    this.mapObjects = {};
    this.objectWalls = null;
    this.objectCollisionRects = [];
  }

  restoreCheckpointIfRequested(data = {}) {
    if (!data.loadCheckpoint) return false;

    const checkpoint = CheckpointStorage.load();
    const didRestore = CheckpointStorage.applyToScene(this, checkpoint);
    if (!didRestore) {
      this.showQuestToast("저장된 지점을 찾지 못했어요.");
    }
    return didRestore;
  }

  saveCheckpoint(checkpointId) {
    CheckpointStorage.saveSceneCheckpoint(this, checkpointId);
  }

  update(time, delta) {
    this.handleVendingMenuKeyboard();
    this.handleClothingShopKeyboard();
    this.playerController.update(time, delta);
    this.checkRecycleQuestUnlock();
    this.checkJjookQuestUnlock();
    this.checkSunisuniQuestUnlock();
    this.checkClothesQuestUnlock();
    this.checkWalletPickup();
    this.updateJjookFollower();
    this.updateSunisuniFollower();
    this.updateQuestMarkers();
    this.updateWorldDepths();
    const canCompleteChapter = this.sunisuniQuestState !== "quest_complete" || this.clothesQuestState === "completed";
    if (canCompleteChapter && !this.isChapterComplete && this.moneySystem && this.moneySystem.money >= GAME_CONFIG.chapter1TargetMoney) {
      this.completeChapter1();
    }
  }

  getWorldDepth(y, offset = 0) {
    return y / 32 + offset;
  }

  getDepthSortY(target) {
    if (!target) return 0;

    const manualSortY = target.getData?.("depthSortY");
    if (Number.isFinite(manualSortY)) return manualSortY;

    const displayHeight = target.displayHeight || Math.abs(target.height * (target.scaleY || 1)) || 0;
    const originY = Number.isFinite(target.originY) ? target.originY : 0.5;
    return target.y + displayHeight * (1 - originY);
  }

  setDepthFromY(target, offset = 0) {
    if (!target?.active && target !== this.player) return;
    target.setDepth(this.getWorldDepth(this.getDepthSortY(target), offset));
  }

  updateWorldDepths() {
    this.setDepthFromY(this.player, 0.05);
    this.setDepthFromY(this.yebiNpc, 0.04);
    this.setDepthFromY(this.jjookNpc, 0.04);
    this.setDepthFromY(this.sunisuniNpc, 0.04);
    this.setDepthFromY(this.walletItem, 0.03);

    this.trashSlimes?.children?.iterate((trash) => {
      if (trash?.active && !trash.getData("cleaned")) {
        this.setDepthFromY(trash, -0.05);
      }
    });
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

  getDirectionKeyFromVector(dx, dy, fallback = "down") {
    if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) return fallback;
    if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? "left" : "right";
    return dy < 0 ? "up" : "down";
  }

  setNpcDirectionTexture(sprite, npcKey, directionKey = "down", moving = false) {
    if (!sprite) return;

    const textureKey = NPC_TEXTURES[npcKey]?.[directionKey] || NPC_TEXTURES[npcKey]?.down;
    if (!textureKey || !this.textures.exists(textureKey)) return;

    sprite.setData("directionKey", directionKey);
    if (sprite.texture?.key !== textureKey) {
      sprite.setTexture(textureKey, 1);
    }
    sprite.setDisplaySize(GAME_CONFIG.playerDisplayWidth, GAME_CONFIG.playerDisplayHeight);
    sprite.setOrigin(0.5, 0.5);

    const animKey = NPC_WALK_ANIMS[npcKey]?.[directionKey];
    if (moving && animKey && this.anims.exists(animKey)) {
      sprite.anims?.play(animKey, true);
      return;
    }

    sprite.anims?.stop();
    if (sprite.anims?.currentFrame || sprite.frame?.name !== 1) {
      sprite.setFrame(1);
    }
  }

  stopNpcWalk(sprite, npcKey) {
    const directionKey = sprite?.getData("directionKey") || "down";
    this.setNpcDirectionTexture(sprite, npcKey, directionKey, false);
  }

  checkRecycleQuestUnlock() {
    if (!this.moneySystem || !this.questManager || this.hasAnnouncedRecycleQuest) return;
    if (this.moneySystem.money < GAME_CONFIG.recycleQuestUnlockMoney) return;

    this.hasAnnouncedRecycleQuest = true;
    const didUnlock = this.questManager.unlockRecycleQuest();
    if (!didUnlock) return;

    this.moveYebiToRecyclingCenter();
    this.setQuestMarker("recycleQuest", this.yebiNpc, "!");
    this.showQuestToast("여비 아저씨가 분리수거장에서 기다리고 있어!", 10000);
    this.showSpeechBubble(this.yebiNpc, "분리수거장으로 와!", 10000);
    this.saveCheckpoint("recycle_unlocked");
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
    this.saveCheckpoint("jjook_unlocked");
  }

  checkSunisuniQuestUnlock() {
    if (!this.moneySystem || this.hasAnnouncedSunisuniQuest) return;
    if (this.jjookQuestState !== "completed") return;
    if (this.moneySystem.money < GAME_CONFIG.sunisuniQuestUnlockMoney) return;

    this.hasAnnouncedSunisuniQuest = true;
    this.sunisuniQuestState = "sunisuni_found";
    if (this.sunisuniNpc) {
      this.sunisuniNpc.setVisible(true);
      this.sunisuniNpc.setActive(true);
      this.setSunisuniWaitingPose();
      this.setQuestMarker("sunisuniQuest", this.sunisuniNpc, "!");
      this.playSunisuniEffect("sweat_drop", this.sunisuniNpc.x + 28, this.sunisuniNpc.y - 42);
      this.showSpeechBubble(this.sunisuniNpc, "아우... 배야...", 10000);
    }
    this.showQuestToast("수니수니가 배를 잡고 앉아 있어요!", 10000);
    this.saveCheckpoint("sunisuni_found");
  }

  checkClothesQuestUnlock() {
    if (!this.moneySystem || this.hasAnnouncedClothesQuest) return;
    if (this.sunisuniQuestState !== "quest_complete") return;
    if (this.moneySystem.money < GAME_CONFIG.clothesQuestUnlockMoney) return;

    this.hasAnnouncedClothesQuest = true;
    this.clothesQuestState = "ready";
    this.createJjookQuestObjects();
    this.setQuestMarker("clothesQuest", this.jjookNpc, "!");
    this.showQuestToast("쭉쭉이가 서울 여행 준비 이야기를 하고 싶어 해요!", 10000);
    this.showSpeechBubble(this.jjookNpc, "옷 보러 갈래?", 10000);
    this.saveCheckpoint("clothes_ready");
  }

  createMap() {
    this.objectWalls = this.physics.add.staticGroup();
    this.objectCollisionRects = [];
    this.mapObjects = {};

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
    this.createTiledMapObjects(map);
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

  getTiledObjectProperties(object) {
    return Object.fromEntries((object.properties || []).map((property) => [property.name, property.value]));
  }

  createTiledMapObjects(map) {
    const objectLayer = map.getObjectLayer(TILED_MAP_CONFIG.mapObjectsLayer);
    if (!objectLayer) return;

    objectLayer.objects.forEach((object) => {
      const props = this.getTiledObjectProperties(object);
      const textureKey = props.texture || object.type || object.name;
      if (!textureKey || !this.textures.exists(textureKey)) return;

      const originX = Number(props.originX ?? 0.5);
      const originY = Number(props.originY ?? 1);
      const displayWidth = Number(props.displayWidth || object.width || 96);
      const displayHeight = Number(props.displayHeight || object.height || 96);
      const x = object.x + (object.width || displayWidth) * originX;
      const y = object.y + (object.height || displayHeight) * originY;
      const image = props.animation
        ? this.add.sprite(x, y, textureKey, Number(props.frame || 0))
        : this.add.image(x, y, textureKey);

      image.setOrigin(originX, originY);
      image.setDisplaySize(displayWidth, displayHeight);
      const sortY = Number(props.sortY ?? this.getDepthSortY(image));
      image.setData("depthSortY", sortY);
      image.setDepth(this.getWorldDepth(sortY, Number(props.depthOffset ?? 0)));
      if (props.name) image.setName(props.name);
      const objectKey = props.name || object.name;
      if (objectKey) this.mapObjects[objectKey] = image;
      if (props.animation && image.anims) {
        image.anims.play(props.animation);
      }

      if (this.shouldMapObjectCollide(object, props, textureKey)) {
        this.addMapObjectCollider(object, props, x, y, displayWidth, displayHeight, textureKey);
      }
    });
  }

  shouldMapObjectCollide(object, props, textureKey) {
    if (props.collides === true || props.collides === "true") return true;

    const name = `${object.name || ""} ${textureKey || ""}`.toLowerCase();
    return ["tree", "bench", "building", "store", "pharmacy", "hospital"].some((keyword) => name.includes(keyword));
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

    const height = Math.max(32, displayHeight * 0.28);
    return {
      width: Math.max(96, displayWidth * 0.82),
      height,
      offsetX: 0,
      offsetY: -height * 0.5,
    };
  }

  addObjectCollider(name, x, y, width, height) {
    if (!this.objectWalls) {
      this.objectWalls = this.physics.add.staticGroup();
    }

    const zone = this.add.zone(x, y, width, height);
    this.physics.add.existing(zone, true);
    zone.setName(name);
    this.objectWalls.add(zone);
    this.objectCollisionRects.push(new Phaser.Geom.Rectangle(
      x - width / 2,
      y - height / 2,
      width,
      height,
    ));
    return zone;
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
    vendingMachine.setData("depthSortY", this.getDepthSortY(vendingMachine));
    vendingMachine.setDepth(this.getWorldDepth(vendingMachine.getData("depthSortY")));
    vendingMachine.setInteractive({ useHandCursor: true });
    vendingMachine.on("pointerdown", (pointer) => {
      pointer.event?.preventDefault();
      pointer.event?.stopPropagation();
      this.handleVendingMachineInteraction();
    });
    this.vendingMachine = vendingMachine;
    this.addObjectCollider(
      "vending_machine_collider",
      GAME_CONFIG.vendingMachine.x,
      GAME_CONFIG.vendingMachine.y + 20,
      76,
      48,
    );

    RECYCLE_BIN_CONFIG.forEach((binConfig) => {
      const x = center.x + binConfig.xOffset;
      const y = center.y + binConfig.yOffset + 76;
      const bin = this.add.image(x, y, binConfig.texture);
      bin.setDisplaySize(70, 78);
      bin.setData("depthSortY", this.getDepthSortY(bin));
      bin.setDepth(this.getWorldDepth(bin.getData("depthSortY")));

      const label = this.add.text(x, y + 58, binConfig.label, {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#21352c",
        fontStyle: "bold",
        backgroundColor: "rgba(255,255,255,0.78)",
        padding: { left: 5, right: 5, top: 2, bottom: 2 },
      });
      label.setOrigin(0.5);
      label.setDepth(bin.depth + 0.04);

      const zone = this.add.zone(
        x,
        y + 60,
        GAME_CONFIG.recycleBinHitboxWidth + 18,
        GAME_CONFIG.recycleBinHitboxHeight + 28,
      );
      this.physics.add.existing(zone, true);
      zone.setData("recycleType", binConfig.type);
      this.recycleBins.push({ ...binConfig, x, y, bin, label, zone });
      this.addObjectCollider(`${binConfig.type}_recycle_bin_collider`, x, y + 20, 54, 34);
    });
  }

  getYebiRecyclePosition() {
    return {
      x: GAME_CONFIG.recyclingCenter.x - 270,
      y: GAME_CONFIG.recyclingCenter.y + 28,
    };
  }

  createJjookQuestObjects() {
    if (!this.jjookNpc) {
      const { x, y } = GAME_CONFIG.jjookSpawn;
      this.jjookNpc = this.add.sprite(x, y, NPC_TEXTURES.jjook.down, 1);
      this.setNpcDirectionTexture(this.jjookNpc, "jjook", "down", false);
      this.jjookNpc.setDepth(4.2);
      this.jjookNpc.setInteractive({ useHandCursor: true });
      this.jjookNpc.on("pointerdown", (pointer) => {
        pointer.event?.preventDefault();
        pointer.event?.stopPropagation();
        this.handleJjookInteraction();
      });
      this.jjookIdleTween = this.tweens.add({
        targets: this.jjookNpc,
        y: y - 5,
        duration: 780,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

  }

  createSunisuniAnimations() {
    [
      "sunisuni_walk_down",
      "sunisuni_walk_up",
      "sunisuni_walk_left",
      "sunisuni_walk_right",
      "yeobi_walk_down",
      "yeobi_walk_up",
      "yeobi_walk_left",
      "yeobi_walk_right",
      "jjook_walk_down",
      "jjook_walk_up",
      "jjook_walk_left",
      "jjook_walk_right",
    ].forEach((textureKey) => {
      this.textures.get(textureKey)?.setFilter(Phaser.Textures.FilterMode.LINEAR);
    });
    ["hospital_staff", "hospital_doctor", "chemist", "sunisuni_bench", "sunisuni_tree", "clothing_store"].forEach((textureKey) => {
      this.textures.get(textureKey)?.setFilter(Phaser.Textures.FilterMode.LINEAR);
    });

    const configs = [
      ["sweat_drop", "sweat_effect"],
      ["sunisuni_star", "star_effect"],
      ["sunisuni_heart", "heart_effect"],
    ];

    configs.forEach(([key, texture]) => {
      if (this.anims.exists(key) || !this.textures.exists(texture)) return;
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers(texture, { start: 0, end: 2 }),
        frameRate: 4,
        repeat: -1,
      });
    });
  }

  createSunisuniNpc() {
    if (!this.textures.exists(NPC_TEXTURES.sunisuni.down)) return;

    const { x, y } = GAME_CONFIG.sunisuniSpawn;
    this.sunisuniNpc = this.add.sprite(x, y, NPC_TEXTURES.sunisuni.down, 1);
    this.setSunisuniWaitingPose();
    this.sunisuniNpc.setDepth(4.15);
    this.sunisuniNpc.setVisible(false);
    this.sunisuniNpc.setActive(false);
    this.sunisuniNpc.setInteractive({ useHandCursor: true });
    this.sunisuniNpc.on("pointerdown", (pointer) => {
      pointer.event?.preventDefault();
      pointer.event?.stopPropagation();
      this.handleSunisuniInteraction();
    });
  }

  setSunisuniWaitingPose() {
    if (!this.sunisuniNpc) return;

    this.setNpcDirectionTexture(this.sunisuniNpc, "sunisuni", "down", false);
  }

  handleVendingMachineInteraction() {
    if (this.isInDialogue || this.vendingMenuGroup) return;
    if (!this.isPlayerNearVendingMachine()) return;

    if (this.jjookQuestState === "completed") {
      this.openVendingMenu({ completeQuestOnSelect: false });
      return;
    }

    if (this.jjookQuestState === "wallet_found") {
      this.handleJjookInteraction();
      return;
    }

    this.dialogueSystem?.start([
      { name: "해냄이", portraitKey: "haenaem_confused", text: "아냐, 돈을 먼저 모아야 해." },
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
    this.showQuestToast("갈색 지갑을 찾았어!");
    this.showSpeechBubble(this.player, "지갑 찾았어!");
    this.saveCheckpoint("jjook_wallet_found");
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

  createYebiNpc() {
    const fallbackX = this.playerStart.x + 108;
    const fallbackY = this.playerStart.y - 8;
    const x = this.isBlockedSpawnPoint(fallbackX, fallbackY) ? this.playerStart.x + 72 : fallbackX;
    const y = fallbackY;

    this.yebiNpc = this.add.sprite(x, y, NPC_TEXTURES.yeobi.down, 1);
    this.setNpcDirectionTexture(this.yebiNpc, "yeobi", "down", false);
    this.yebiNpc.setDepth(3.5);
    this.yebiNpc.setInteractive({ useHandCursor: true });
    this.yebiNpc.on("pointerdown", (pointer) => {
      pointer.event?.preventDefault();
      pointer.event?.stopPropagation();
      this.handlePrimaryAction();
    });
    this.tweens.add({
      targets: this.yebiNpc,
      y: y - 5,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  moveYebiToRecyclingCenter() {
    if (!this.yebiNpc) return;

    const position = this.getYebiRecyclePosition();
    this.tweens.killTweensOf(this.yebiNpc);
    this.yebiNpc.setPosition(position.x, position.y);
    this.yebiNpc.setDepth(3.6);
    this.setNpcDirectionTexture(this.yebiNpc, "yeobi", "down", false);
    this.tweens.add({
      targets: this.yebiNpc,
      y: position.y - 5,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  walkYebiToRecyclingCenter() {
    if (!this.yebiNpc) return;

    const position = this.getYebiRecyclePosition();
    this.tweens.killTweensOf(this.yebiNpc);
    this.yebiNpc.setDepth(3.6);
    const path = this.getYebiPathToRecyclingCenter(position);
    this.walkYebiAlongPath(path, 0);
  }

  getYebiPathToRecyclingCenter(target) {
    const startX = this.yebiNpc?.x ?? this.playerStart.x;
    const startY = this.yebiNpc?.y ?? this.playerStart.y;
    const upperLaneY = Math.min(startY - 70, GAME_CONFIG.vendingMachine.y - 118);

    return [
      { x: startX + 130, y: upperLaneY },
      { x: GAME_CONFIG.vendingMachine.x - 145, y: upperLaneY },
      { x: GAME_CONFIG.vendingMachine.x + 155, y: upperLaneY },
      { x: target.x, y: target.y },
    ];
  }

  walkYebiAlongPath(path, index) {
    if (!this.yebiNpc || index >= path.length) {
      this.startYebiIdleBob();
      return;
    }

    const target = path[index];
    const distance = Phaser.Math.Distance.Between(this.yebiNpc.x, this.yebiNpc.y, target.x, target.y);
    if (distance < 4) {
      this.walkYebiAlongPath(path, index + 1);
      return;
    }

    const directionKey = this.getDirectionKeyFromVector(
      target.x - this.yebiNpc.x,
      target.y - this.yebiNpc.y,
      this.yebiNpc.getData("directionKey") || "down",
    );
    this.setNpcDirectionTexture(this.yebiNpc, "yeobi", directionKey, true);
    const walkingSpeed = GAME_CONFIG.playerSpeed * 0.72;
    this.tweens.add({
      targets: this.yebiNpc,
      x: target.x,
      y: target.y,
      duration: Math.max(420, (distance / walkingSpeed) * 1000),
      ease: "Linear",
      onComplete: () => this.walkYebiAlongPath(path, index + 1),
    });
  }

  startYebiIdleBob() {
    if (!this.yebiNpc) return;

    const idleY = this.yebiNpc.y;
    this.setNpcDirectionTexture(this.yebiNpc, "yeobi", "down", false);
    this.tweens.add({
      targets: this.yebiNpc,
      y: idleY - 5,
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

  createPlayer() {
    const playerTexture = this.textures.exists(PLAYER_TEXTURES.down) ? PLAYER_TEXTURES.down : "player";
    this.player = this.physics.add.sprite(this.playerStart.x, this.playerStart.y, playerTexture, 1);
    this.player.setDisplaySize(GAME_CONFIG.playerDisplayWidth, GAME_CONFIG.playerDisplayHeight);
    this.playerBaseScale = { x: this.player.scaleX, y: this.player.scaleY };
    this.playerDirectionKey = "down";
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(5);
    this.player.body.setSize(GAME_CONFIG.playerBodyWidth, GAME_CONFIG.playerBodyHeight);
    this.player.body.setOffset(GAME_CONFIG.playerBodyOffsetX, GAME_CONFIG.playerBodyOffsetY);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
  }

  updateCameraZoom() {
    const viewport = window.visualViewport;
    const width = viewport?.width || window.innerWidth || this.scale.width;
    const height = viewport?.height || window.innerHeight || this.scale.height;
    const isTouchDevice = navigator.maxTouchPoints > 0 || window.matchMedia?.("(pointer: coarse)")?.matches;
    const isMobileLandscape = isTouchDevice && width / Math.max(height, 1) > 1.35;
    const zoom = isMobileLandscape ? GAME_CONFIG.wideCameraZoom : 1;

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
    this.saveCheckpoint("chapter1_complete");
    this.dialogueSystem.start([
      { name: "알림", text: `목표 금액 ${GAME_CONFIG.chapter1TargetMoney.toLocaleString()}원을 달성했습니다!` },
      { name: "알림", text: "다음 챕터로 이동합니다." }
    ]);
    // 추가 챕터 전환 로직
    this.time.delayedCall(2000, () => {
      // this.scene.restart() 또는 다음 챕터로 이동하는 코드
      console.log("챕터 2로 전환 예정");
    });
  }

  createRandomSlimePositions() {
    if (this.slimeSpawnPoints.length > 0) {
      const positions = Phaser.Utils.Array.Shuffle([...this.slimeSpawnPoints])
        .filter(([x, y]) => !this.isBlockedSpawnPoint(x, y));
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

    let fallbackAttempts = 0;
    while (positions.length < count && fallbackAttempts < 300) {
      fallbackAttempts += 1;
      const area = spawnAreas[Phaser.Math.Between(0, spawnAreas.length - 1)];
      const x = Phaser.Math.Between(area.left, area.right);
      const y = Phaser.Math.Between(area.top, area.bottom);
      if (!this.isBlockedSpawnPoint(x, y)) {
        positions.push([x, y]);
      }
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

    const isStaticAreaBlocked = blockedAreas.some((area) => {
      return x >= area.left && x <= area.right && y >= area.top && y <= area.bottom;
    });
    if (isStaticAreaBlocked) return true;

    return (this.objectCollisionRects || []).some((rect) => {
      return Phaser.Geom.Rectangle.Contains(rect, x, y);
    });
  }

  createInput() {
    this.playerController.createInput();
  }

  isDevMode() {
    const params = new URLSearchParams(window.location.search);
    return params.get("dev") === "1"
      || ["localhost", "127.0.0.1"].includes(window.location.hostname);
  }

  handleDevKeydown(event) {
    if (!this.isDevMode()) return;
    if (event.code !== "F2" && event.code !== "F3" && event.code !== "F4") return;

    event.preventDefault();
    event.stopPropagation();
    if (event.code === "F2") {
      this.addDevMoney();
    } else if (event.code === "F3") {
      this.addDevTrashInventory();
    } else {
      this.advanceDevQuest();
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

  advanceDevQuest() {
    if (this.isInDialogue || this.vendingMenuGroup) {
      this.showQuestToast("대화가 끝난 뒤 F4를 눌러줘.");
      return;
    }

    const canQuest = this.questManager?.canQuest;
    const recycleQuest = this.questManager?.recycleQuest;

    if (canQuest && !canQuest.isCompleted) {
      canQuest.isActive = false;
      canQuest.isCompleted = true;
      canQuest.current = canQuest.target;
      this.questManager.updateUI();
      this.questManager.hideQuestGaugeWithPoof();
      this.clearQuestMarker("canQuest");
      this.ensureDevMoney(GAME_CONFIG.recycleQuestUnlockMoney);
      this.hasAnnouncedRecycleQuest = false;
      this.checkRecycleQuestUnlock();
      this.showQuestToast("F4: 분리수거 퀘스트로 이동");
      return;
    }

    if (recycleQuest && !recycleQuest.isCompleted) {
      recycleQuest.isUnlocked = true;
      recycleQuest.isActive = false;
      recycleQuest.isCompleted = true;
      recycleQuest.current.normal = recycleQuest.target.normal;
      recycleQuest.current.can = recycleQuest.target.can;
      recycleQuest.current.plastic = recycleQuest.target.plastic;
      this.questManager.updateUI();
      this.questManager.hideQuestGaugeWithPoof();
      this.clearQuestMarker("recycleQuest");
      this.ensureDevMoney(GAME_CONFIG.jjookQuestUnlockMoney);
      this.hasAnnouncedJjookQuest = false;
      this.checkJjookQuestUnlock();
      this.showQuestToast("F4: 쭉쭉이 퀘스트로 이동");
      return;
    }

    if (this.jjookQuestState !== "completed") {
      this.createJjookQuestObjects();
      this.jjookQuestState = "completed";
      this.hasWallet = false;
      this.walletItem?.destroy();
      this.walletItem = null;
      this.clearQuestMarker("jjookQuest");
      this.ensureDevMoney(GAME_CONFIG.sunisuniQuestUnlockMoney);
      this.hasAnnouncedSunisuniQuest = false;
      this.checkSunisuniQuestUnlock();
      this.showQuestToast("F4: 수니수니 퀘스트로 이동");
      return;
    }

    if (this.sunisuniQuestState === "locked") {
      this.ensureDevMoney(GAME_CONFIG.sunisuniQuestUnlockMoney);
      this.hasAnnouncedSunisuniQuest = false;
      this.checkSunisuniQuestUnlock();
      this.showQuestToast("F4: 수니수니 퀘스트 시작");
      return;
    }

    if (this.sunisuniQuestState === "quest_complete" && this.clothesQuestState === "locked") {
      this.ensureDevMoney(GAME_CONFIG.clothesQuestUnlockMoney);
      this.hasAnnouncedClothesQuest = false;
      this.checkClothesQuestUnlock();
      this.showQuestToast("F4: 옷가게 퀘스트 시작");
      return;
    }

    this.showQuestToast("F4: 이미 마지막 퀘스트까지 열렸어.");
  }

  ensureDevMoney(amount) {
    if (!this.moneySystem || this.moneySystem.money >= amount) return;
    this.moneySystem.addMoney(amount - this.moneySystem.money);
  }

  handleSpaceAction() {
    if (this.isInDialogue) {
      return;
    }

    if (this.clothingShopModal) {
      this.selectFocusedClothingShopOption();
      return;
    }

    if (this.vendingMenuGroup) {
      this.selectHighlightedVendingOption();
      return;
    }

    this.handlePrimaryAction();
  }

  handlePrimaryAction() {
    this.interactionSystem.handlePrimaryAction();
  }

  isPlayerNearJjookNpc() {
    return this.interactionSystem.isPlayerNearJjookNpc();
  }

  shouldPrioritizeJjookDialogue() {
    return this.interactionSystem.shouldPrioritizeJjookDialogue();
  }

  isPlayerNearSunisuniNpc() {
    return this.interactionSystem.isPlayerNearSunisuniNpc();
  }

  shouldPrioritizeSunisuniDialogue() {
    return this.interactionSystem.shouldPrioritizeSunisuniDialogue();
  }

  isPlayerNearHospitalDoor() {
    return this.interactionSystem.isPlayerNearHospitalDoor();
  }

  isPlayerNearPharmacyDoor() {
    return this.interactionSystem.isPlayerNearPharmacyDoor();
  }

  isPlayerNearClothingStoreDoor() {
    return this.interactionSystem.isPlayerNearClothingStoreDoor();
  }

  isPlayerNearVendingMachine() {
    return this.interactionSystem.isPlayerNearVendingMachine();
  }

  handleJjookInteraction() {
    if (this.isInDialogue || !this.dialogueSystem || this.jjookQuestState === "locked") return;
    if (!this.isPlayerNearJjookNpc()) return;

    if (this.jjookQuestState === "wallet_missing") {
      this.dialogueSystem.start([
        { name: "쭉쭉이", portraitKey: "jjook_lost", text: "아... 이동하다가 지갑을 잃어버렸어. 목도 너무 마른데 어떡하지?" },
        { name: "쭉쭉이", portraitKey: "jjook_lost", text: "혹시 근처 화단이나 벤치 밑을 같이 봐줄래? 갈색 지갑이야." },
      ], () => {
        if (!this.walletItem?.active && !this.hasWallet) this.spawnWalletItem();
      });
      return;
    }

    if (this.jjookQuestState === "wallet_found") {
      this.dialogueSystem.start([
        { name: "쭉쭉이", portraitKey: "jjook_found", text: "지갑을 찾아줘서 정말 고마워. 보답으로 시원한 음료수 하나 사줄게. 뭐 마실래?" },
      ], () => this.openVendingMenu({ completeQuestOnSelect: true }));
      return;
    }

    if (this.jjookQuestState === "completed") {
      if (this.clothesQuestState === "ready" || this.clothesQuestState === "declined") {
        this.startClothesQuestDialogue();
        return;
      }

      if (this.clothesQuestState === "shopping") {
        this.dialogueSystem.start([
          { name: "쭉쭉이", portraitKey: "jjook_expectant", text: "옷가게는 맵 위쪽 상점가에 있어. 같이 가보자!" },
        ]);
        return;
      }

      if (this.isJjookFollowActive) {
        this.dialogueSystem.start([
          { name: "쭉쭉이", portraitKey: "jjook_plogging", text: "지금 같이 플로깅 중이야! 주변 쓰레기를 같이 치워보자." },
          { name: "해냄이", portraitKey: "haenaem_determined", text: "좋아. 지금처럼 같이 깨끗하게 치우자!" },
        ]);
        return;
      }

      this.dialogueSystem.start([
        { name: "쭉쭉이", portraitKey: "jjook_smile", text: "나랑 같이 걷자! 음료수가 필요하면 자판기 앞에서 골라줘." },
        {
          name: "해냄이",
          portraitKey: "haenaem_confused",
          text: "쭉쭉이에게 뭐라고 말할까요?",
          choices: [
            { label: "플로깅을 도와줄래?", onSelect: () => this.requestJjookPloggingHelp() },
            { label: "다음에 보자.", onSelect: () => this.sayByeToJjook() },
          ],
        },
      ]);
    }
  }

  startClothesQuestDialogue() {
    if (!this.dialogueManager?.has("zzuk_clothes_start_001")) {
      this.dialogueSystem?.start([
        { name: "쭉쭉이", portraitKey: "jjook_smile", text: "해냄아! 서울 여행 준비는 잘 되고 있어?" },
        {
          name: "쭉쭉이",
          portraitKey: "jjook_expectant",
          text: "우리 여행 가기 전에 옷이라도 하나 사러 갈래?",
          choices: [
            { label: "응! 같이 가자!", onSelect: () => this.startClothesShoppingQuest() },
            { label: "아직 고민중이야", onSelect: () => this.declineClothesShoppingQuest() },
          ],
        },
      ]);
      return;
    }

    this.dialogueManager.startLoaded("zzuk_clothes_start_001");
  }

  startClothesShoppingQuest() {
    this.clothesQuestState = "shopping";
    this.hasAnnouncedClothesQuest = true;
    this.isJjookClothesEscortActive = true;
    this.stopJjookIdleTween();
    this.clearQuestMarker("clothesQuest");
    const shopTarget = this.mapObjects?.clothing_store || {
      active: true,
      x: GAME_CONFIG.clothingStoreDoor.x,
      y: GAME_CONFIG.clothingStoreDoor.y,
      displayHeight: 96,
    };
    this.setQuestMarker("clothesShop", shopTarget, "!");
    this.showQuestToast("쭉쭉이와 함께 옷가게로 가요.", 6000);
    this.showSpeechBubble(this.jjookNpc, "같이 가자!", 2800);
    this.saveCheckpoint("clothes_shopping");
  }

  declineClothesShoppingQuest() {
    this.clothesQuestState = "declined";
    this.hasAnnouncedClothesQuest = true;
    this.setQuestMarker("clothesQuest", this.jjookNpc, "!");
    this.saveCheckpoint("clothes_declined");
  }

  handleClothingStoreInteraction() {
    if (!["shopping", "completed"].includes(this.clothesQuestState)) {
      this.showQuestToast("쭉쭉이와 먼저 이야기해 보자.");
      return;
    }

    this.showInteriorScene("clothing_store_interior", "clothing");
    this.isJjookClothesEscortActive = false;
    this.stopNpcWalk(this.jjookNpc, "jjook");
    this.dialogueSystem.start([
      { name: "옷가게 사장님", portraitKey: "clothing_shop_owner", text: "어서와~ 서울 여행 간다면서?" },
      { name: "옷가게 사장님", portraitKey: "clothing_shop_owner", text: "천천히 둘러봐! 마음에 드는 걸 골라보렴." },
    ], () => this.openClothingShopMenu());
  }

  openClothingShopMenu() {
    this.closeClothingShopMenu();
    this.clothingShopSelectedKeys = new Set();
    this.selectedClothingShopIndex = 0;
    this.clothingShopStepIndex = 0;
    this.clothingShopMode = "category";
    const stage = document.querySelector(".game-stage") || document.body;
    const modal = document.createElement("div");
    modal.className = "clothing-shop-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-label", "옷가게");
    modal.innerHTML = `
      <div class="clothing-shop-panel">
        <div class="clothing-shop-header">
          <strong>삼각옷방</strong>
          <span>마음에 드는 것을 고른 뒤 한 번에 계산해요.</span>
        </div>
        <div class="clothing-shop-progress"></div>
        <div class="clothing-shop-body"></div>
        <div class="clothing-shop-summary"></div>
        <div class="clothing-shop-footer"></div>
      </div>
    `;
    this.clothingShopModal = modal;
    stage.appendChild(modal);
    this.renderClothingShopStep();
  }

  closeClothingShopMenu() {
    this.clothingShopModal?.remove();
    this.clothingShopModal = null;
    this.clothingShopSelectedKeys = new Set();
    this.selectedClothingShopIndex = 0;
    this.clothingShopStepIndex = 0;
    this.clothingShopMode = "category";
  }

  getShopIconFile(textureKey) {
    return `${textureKey.replace(/^shop_/, "").replaceAll("_", "-")}.png`;
  }

  hasTravelPrepItem(itemKey) {
    return this.travelPrepItems.some((entry) => entry.key === itemKey);
  }

  getCurrentClothingCategory() {
    return CLOTHING_SHOP_CATEGORIES[this.clothingShopStepIndex] || CLOTHING_SHOP_CATEGORIES[0];
  }

  getSelectedClothingShopItems() {
    return CLOTHING_SHOP_ITEMS.filter((item) => this.clothingShopSelectedKeys.has(item.key));
  }

  getSelectedClothingShopTotal() {
    return this.getSelectedClothingShopItems().reduce((sum, item) => sum + item.price, 0);
  }

  formatShopMoney(amount) {
    return `${Math.max(0, amount).toLocaleString()}원`;
  }

  renderClothingShopStep() {
    if (!this.clothingShopModal) return;

    const progress = this.clothingShopModal.querySelector(".clothing-shop-progress");
    const body = this.clothingShopModal.querySelector(".clothing-shop-body");
    const footer = this.clothingShopModal.querySelector(".clothing-shop-footer");
    if (!progress || !body || !footer) return;

    body.className = "clothing-shop-body";
    body.innerHTML = "";
    footer.innerHTML = "";
    const isReview = this.clothingShopMode === "review";
    progress.innerHTML = this.renderClothingShopProgress();

    if (isReview) {
      this.renderClothingShopReview(body, footer);
    } else {
      this.renderClothingShopCategory(body, footer);
    }

    this.refreshClothingShopSelection();
  }

  renderClothingShopProgress() {
    const steps = CLOTHING_SHOP_CATEGORIES.map((category, index) => {
      const isDone = index < this.clothingShopStepIndex || this.clothingShopMode === "review";
      const isCurrent = index === this.clothingShopStepIndex && this.clothingShopMode !== "review";
      const className = ["clothing-shop-step", isDone ? "is-done" : "", isCurrent ? "is-current" : ""]
        .filter(Boolean)
        .join(" ");
      return `<span class="${className}">${category.label}</span>`;
    }).join("");

    const reviewClass = this.clothingShopMode === "review" ? "clothing-shop-step is-current" : "clothing-shop-step";
    return `${steps}<span class="${reviewClass}">확인</span>`;
  }

  renderClothingShopCategory(body, footer) {
    const category = this.getCurrentClothingCategory();
    const selectedCount = this.getSelectedClothingShopItems().filter((item) => item.category === category.key).length;
    const items = CLOTHING_SHOP_ITEMS.filter((item) => item.category === category.key);
    const grid = document.createElement("div");
    grid.className = "clothing-shop-grid";
    body.innerHTML = `
      <div class="clothing-shop-category-title">
        <strong>${category.label}</strong>
        <span>${category.label}는 여러 개 골라도 돼요. 선택 ${selectedCount}개</span>
      </div>
    `;
    body.appendChild(grid);

    items.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "clothing-shop-item clothing-shop-option";
      button.dataset.action = "toggle";
      button.dataset.itemKey = item.key;
      if (this.hasTravelPrepItem(item.key)) {
        button.classList.add("is-owned");
        button.setAttribute("aria-label", `${item.label}, 이미 준비한 물건`);
      }
      button.innerHTML = `
        <img src="./assets/shop-icons/${this.getShopIconFile(item.texture)}" alt="" aria-hidden="true" />
        <span class="item-label">${item.label}</span>
        <span class="item-price">${item.price.toLocaleString()}원</span>
        ${this.hasTravelPrepItem(item.key) ? '<span class="item-status">이미 준비</span>' : ""}
      `;
      button.addEventListener("click", () => this.toggleClothingShopSelection(item.key));
      grid.appendChild(button);
    });

    const previousCategory = CLOTHING_SHOP_CATEGORIES[this.clothingShopStepIndex - 1];
    const nextCategory = CLOTHING_SHOP_CATEGORIES[this.clothingShopStepIndex + 1];
    if (this.clothingShopStepIndex > 0) {
      this.addClothingShopFooterButton(footer, `${previousCategory.label} 보기`, "previous-category", "secondary");
    }
    this.addClothingShopFooterButton(
      footer,
      nextCategory ? `${nextCategory.label} 보기` : "확인하기",
      "next-category",
    );
    this.addClothingShopFooterButton(footer, "나가기", "close", "secondary");
    this.renderClothingShopSummary();
  }

  renderClothingShopReview(body, footer) {
    const selectedItems = this.getSelectedClothingShopItems();
    body.classList.add("is-review");
    body.innerHTML = `
      <div class="clothing-shop-category-title">
        <strong>마지막 확인</strong>
        <span>방향키로 고른 뒤 Space 또는 터치하면 선택을 뺄 수 있어요.</span>
      </div>
      <div class="clothing-shop-review-list"></div>
    `;
    const list = body.querySelector(".clothing-shop-review-list");

    if (selectedItems.length === 0) {
      list.innerHTML = '<div class="clothing-shop-empty">고른 옷이 없어요. 이전으로 돌아가서 골라볼까요?</div>';
    } else {
      selectedItems.forEach((item) => {
        const row = document.createElement("button");
        row.type = "button";
        row.className = "clothing-shop-review-item clothing-shop-option";
        row.dataset.action = "remove";
        row.dataset.itemKey = item.key;
        row.innerHTML = `
          <img src="./assets/shop-icons/${this.getShopIconFile(item.texture)}" alt="" aria-hidden="true" />
          <span class="review-name">${item.label}</span>
          <span class="review-category">${CLOTHING_SHOP_CATEGORY_LABELS[item.category] || item.category}</span>
          <span class="review-price">${item.price.toLocaleString()}원</span>
          <span class="review-remove">선택 취소</span>
        `;
        row.addEventListener("click", () => this.removeClothingShopSelection(item.key));
        list.appendChild(row);
      });
    }

    this.addClothingShopFooterButton(footer, "계산하기", "checkout");
    const lastCategory = CLOTHING_SHOP_CATEGORIES[CLOTHING_SHOP_CATEGORIES.length - 1];
    this.addClothingShopFooterButton(footer, `${lastCategory.label} 보기`, "previous-category", "secondary");
    this.addClothingShopFooterButton(footer, "나가기", "close", "secondary");
    this.renderClothingShopSummary();
  }

  addClothingShopFooterButton(footer, label, action, tone = "primary") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `clothing-shop-footer-button clothing-shop-option is-${tone}`;
    button.dataset.action = action;
    button.textContent = label;
    button.addEventListener("click", () => this.handleClothingShopAction(action));
    footer.appendChild(button);
    return button;
  }

  handleClothingShopAction(action) {
    if (action === "next-category") {
      this.advanceClothingShopStep();
      return;
    }

    if (action === "previous-category") {
      this.goBackClothingShopStep();
      return;
    }

    if (action === "checkout") {
      this.checkoutClothingShopSelection();
      return;
    }

    if (action === "close") {
      this.finishClothingShopVisit();
    }
  }

  advanceClothingShopStep() {
    if (this.clothingShopMode === "review") return;

    if (this.clothingShopStepIndex >= CLOTHING_SHOP_CATEGORIES.length - 1) {
      this.clothingShopMode = "review";
    } else {
      this.clothingShopStepIndex += 1;
    }
    this.selectedClothingShopIndex = 0;
    this.renderClothingShopStep();
  }

  goBackClothingShopStep() {
    if (this.clothingShopMode === "review") {
      this.clothingShopMode = "category";
      this.clothingShopStepIndex = CLOTHING_SHOP_CATEGORIES.length - 1;
    } else if (this.clothingShopStepIndex > 0) {
      this.clothingShopStepIndex -= 1;
    }
    this.selectedClothingShopIndex = 0;
    this.renderClothingShopStep();
  }

  toggleClothingShopSelection(itemKey) {
    const item = CLOTHING_SHOP_ITEMS.find((candidate) => candidate.key === itemKey);
    if (!item) return;

    if (this.hasTravelPrepItem(item.key)) {
      this.showQuestToast("이미 준비한 물건이에요.");
      return;
    }

    if (this.clothingShopSelectedKeys.has(item.key)) {
      this.clothingShopSelectedKeys.delete(item.key);
    } else {
      this.clothingShopSelectedKeys.add(item.key);
    }
    this.renderClothingShopStep();
  }

  removeClothingShopSelection(itemKey) {
    this.clothingShopSelectedKeys.delete(itemKey);
    this.selectedClothingShopIndex = Math.max(0, this.selectedClothingShopIndex - 1);
    this.renderClothingShopStep();
  }

  checkoutClothingShopSelection() {
    const items = this.getSelectedClothingShopItems().filter((item) => !this.hasTravelPrepItem(item.key));
    if (!items.length) {
      this.showQuestToast("먼저 살 물건을 골라주세요.");
      return;
    }

    const totalPrice = items.reduce((sum, item) => sum + item.price, 0);
    if (!this.moneySystem?.deductMoney(totalPrice)) {
      this.clothingShopMode = "review";
      this.showClothingShopNotEnoughMoney(totalPrice);
      this.renderClothingShopStep();
      return;
    }

    items.forEach((item) => {
      this.travelPrepItems.push({
        key: item.key,
        category: item.category,
        label: item.label,
        texture: item.texture,
        price: item.price,
      });
    });
    this.playItemPickupSound();
    const previewItem = items[items.length - 1];
    this.showFloatingItem(previewItem.texture, this.scale.width / 2, this.scale.height / 2 - 24, 86, true, { duration: 420 });
    this.updateTravelPrepHud();
    this.showQuestToast(`${items.length}개 준비 완료! -${totalPrice.toLocaleString()}원`);
    if (this.clothesQuestState === "completed") {
      this.saveCheckpoint("clothes_extra_items_bought");
      this.openClothingShopMenu();
      return;
    }
    this.completeClothesShoppingQuest();
  }

  completeClothesShoppingQuest() {
    this.closeClothingShopMenu();
    this.clothesQuestState = "completed";
    this.clearQuestMarker("clothesShop");
    this.clearQuestMarker("clothesQuest");
    this.saveCheckpoint("clothes_completed");
    this.dialogueSystem.start([
      { name: "쭉쭉이", portraitKey: "jjook_smile", text: "오! 잘 어울린다!" },
      { name: "쭉쭉이", portraitKey: "jjook_expectant", text: "이제 진짜 여행 가는 느낌 난다!" },
      { name: "해냄이", portraitKey: "haenaem_touched", text: "고마워! 마음에 드는 옷을 직접 고르니까 더 설렌다." },
      { name: "해냄이", portraitKey: "haenaem_determined", text: "좋아. 다음엔 여행 가방도 차근차근 준비해야겠다." },
    ], () => {
      this.clearInteriorScene();
      this.walkJjookBackToHome();
      this.showQuestToast("다음 목표: 여행 가방 준비하기", 5000);
    });
  }

  showClothingShopNotEnoughMoney(totalPrice) {
    const balance = this.moneySystem?.money ?? 0;
    const shortfall = Math.max(0, totalPrice - balance);
    this.showQuestToast(`돈이 ${shortfall.toLocaleString()}원 부족해요. 항목을 빼보세요.`, 5000);
  }

  refreshClothingShopSelection() {
    if (!this.clothingShopModal) return;
    const buttons = this.getClothingShopOptionButtons();
    buttons.forEach((button, index) => {
      const itemKey = button.dataset.itemKey;
      button.classList.toggle("is-selected", Boolean(itemKey && this.clothingShopSelectedKeys.has(itemKey)));
      button.classList.toggle("is-focused", index === this.selectedClothingShopIndex);
    });

    const focused = buttons[this.selectedClothingShopIndex];
    focused?.scrollIntoView({ block: "nearest", inline: "nearest" });
    this.renderClothingShopSummary();
  }

  moveClothingShopFocus(delta) {
    const count = this.getClothingShopOptionButtons().length;
    if (count <= 0) return;
    this.selectedClothingShopIndex = (this.selectedClothingShopIndex + delta + count) % count;
    this.refreshClothingShopSelection();
  }

  moveClothingShopFocusVertical(deltaRows) {
    this.moveClothingShopFocus(deltaRows * this.getClothingShopColumnCount());
  }

  getClothingShopColumnCount() {
    if (!this.clothingShopModal || this.clothingShopMode === "review") return 1;
    const grid = this.clothingShopModal.querySelector(".clothing-shop-grid");
    if (!grid) return 1;
    const columns = window.getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean).length;
    return Math.max(1, columns || 3);
  }

  getClothingShopOptionButtons() {
    if (!this.clothingShopModal) return [];
    return Array.from(this.clothingShopModal.querySelectorAll(".clothing-shop-option:not(.is-owned)"));
  }

  renderClothingShopSummary() {
    if (!this.clothingShopModal) return;

    const summary = this.clothingShopModal.querySelector(".clothing-shop-summary");
    if (!summary) return;

    const selectedItems = this.getSelectedClothingShopItems();
    const totalPrice = this.getSelectedClothingShopTotal();
    const balance = this.moneySystem?.money ?? 0;
    const shortfall = Math.max(0, totalPrice - balance);
    const remaining = Math.max(0, balance - totalPrice);
    const overBudgetClass = shortfall > 0 ? "is-over-budget" : "is-in-budget";

    summary.innerHTML = `
      <div class="clothing-shop-money-grid ${overBudgetClass}">
        <div><span>고른 옷</span><strong>${selectedItems.length}개</strong></div>
        <div><span>합계</span><strong>${this.formatShopMoney(totalPrice)}</strong></div>
        <div><span>내 잔고</span><strong>${this.formatShopMoney(balance)}</strong></div>
        <div><span>${shortfall > 0 ? "부족" : "남는 돈"}</span><strong>${this.formatShopMoney(shortfall > 0 ? shortfall : remaining)}</strong></div>
      </div>
    `;
  }

  selectFocusedClothingShopOption() {
    if (!this.clothingShopModal) return false;
    const option = this.getClothingShopOptionButtons()[this.selectedClothingShopIndex];
    option?.click();
    return true;
  }

  handleClothingShopKeyboard() {
    if (!this.clothingShopModal || !this.cursors || !this.keys) return;
    const Key = Phaser.Input.Keyboard;
    if (Key.JustDown(this.cursors.left) || Key.JustDown(this.keys.left)) {
      this.moveClothingShopFocus(-1);
    } else if (Key.JustDown(this.cursors.right) || Key.JustDown(this.keys.right)) {
      this.moveClothingShopFocus(1);
    } else if (Key.JustDown(this.cursors.up) || Key.JustDown(this.keys.up)) {
      this.moveClothingShopFocusVertical(-1);
    } else if (Key.JustDown(this.cursors.down) || Key.JustDown(this.keys.down)) {
      this.moveClothingShopFocusVertical(1);
    }
  }

  finishClothingShopVisit() {
    this.closeClothingShopMenu();
    this.clearInteriorScene();
    if (this.clothesQuestState === "completed") {
      return;
    }

    this.isJjookClothesEscortActive = true;
    const message = this.travelPrepItems.length > 0
      ? "좋아! 나머지는 다음에 또 골라보자."
      : "괜찮아! 보는 것도 준비야. 다음에 다시 골라보자.";
    this.showSpeechBubble(this.jjookNpc || this.player, message, 2600);
  }

  updateTravelPrepHud() {
    const items = Array.isArray(this.travelPrepItems) ? this.travelPrepItems : [];
    if (!this.travelPrepHudEl) return;

    if (!items.length) {
      this.isTravelPrepFanOpen = false;
      this.travelPrepHudEl.classList.remove("is-visible", "is-open");
      this.travelPrepHudEl.setAttribute("aria-hidden", "true");
      this.travelPrepFanEl?.replaceChildren();
      this.travelPrepFanEl?.setAttribute("aria-hidden", "true");
      if (this.travelPrepCountEl) this.travelPrepCountEl.textContent = "0";
      return;
    }

    this.travelPrepHudEl.classList.add("is-visible");
    this.travelPrepHudEl.setAttribute("aria-hidden", "false");
    this.travelPrepHudEl.setAttribute("aria-label", `준비한 옷 ${items.length}개 보기`);
    if (this.travelPrepBagIconEl) this.travelPrepBagIconEl.src = "./assets/shop-icons/paper-bag.png";
    if (this.travelPrepCountEl) this.travelPrepCountEl.textContent = String(items.length);
    this.renderTravelPrepFan();
  }

  toggleTravelPrepFan() {
    if (!this.travelPrepItems?.length) return;
    this.isTravelPrepFanOpen = !this.isTravelPrepFanOpen;
    this.renderTravelPrepFan();
  }

  renderTravelPrepFan() {
    if (!this.travelPrepFanEl || !this.travelPrepHudEl) return;
    const items = Array.isArray(this.travelPrepItems) ? this.travelPrepItems : [];
    this.travelPrepFanEl.replaceChildren();
    this.travelPrepHudEl.classList.toggle("is-open", this.isTravelPrepFanOpen && items.length > 0);
    this.travelPrepFanEl.setAttribute("aria-hidden", this.isTravelPrepFanOpen ? "false" : "true");

    const maxPerRing = 6;
    items.forEach((item, index) => {
      const ring = Math.floor(index / maxPerRing);
      const ringStart = ring * maxPerRing;
      const ringCount = Math.min(maxPerRing, items.length - ringStart);
      const ringIndex = index - ringStart;
      const spread = ringCount <= 1 ? 0 : 82;
      const startAngle = 220;
      const angle = startAngle + (ringCount <= 1 ? 0 : (spread * ringIndex) / (ringCount - 1));
      const distance = 92 + ring * 48;
      const radians = Phaser.Math.DegToRad(angle);
      const x = Math.cos(radians) * distance;
      const y = Math.sin(radians) * distance;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "travel-prep-fan-item";
      button.style.setProperty("--fan-x", `${x.toFixed(1)}px`);
      button.style.setProperty("--fan-y", `${y.toFixed(1)}px`);
      button.style.setProperty("--fan-rotation", `${(angle - 260).toFixed(1)}deg`);
      button.style.setProperty("--fan-delay", `${Math.min(index, 8) * 24}ms`);
      button.setAttribute("aria-label", `${item.label} 준비됨`);
      button.innerHTML = `
        <img src="./assets/shop-icons/${this.getShopIconFile(item.texture)}" alt="" aria-hidden="true" />
        <span>${item.label}</span>
      `;
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.showQuestToast(`${item.label} 준비했어요.`);
      });
      this.travelPrepFanEl.appendChild(button);
    });
  }

  requestJjookPloggingHelp() {
    if (this.isJjookFollowActive) {
      this.dialogueSystem?.start([
        { name: "쭉쭉이", portraitKey: "jjook_plogging", text: "이미 같이 줍고 있잖아! 조금만 더 힘내자!" },
      ]);
      return;
    }

    const accepted = Phaser.Math.Between(0, 99) < 65;
    if (accepted) {
      const reasons = [
        "좋아! 방금 몸도 풀렸고, 같이 걸으면 더 신나지!",
        "좋아! 나도 오늘은 조금 더 움직이고 싶었어.",
        "물론이지! 해냄이랑 같이하면 플로깅도 재밌어.",
      ];
      this.dialogueSystem?.start([
        { name: "쭉쭉이", portraitKey: "jjook_plogging", text: Phaser.Utils.Array.GetRandom(reasons) },
      ], () => this.activateJjookFollower({ buyColaOnComplete: true }));
      return;
    }

    const reasons = [
      "미안! 오늘은 다리가 조금 뻐근해서 쉬어야겠어.",
      "지금은 물을 좀 마시고 쉬어야 할 것 같아. 다음에 꼭 도와줄게!",
      "방금 운동을 너무 열심히 했나 봐. 조금 쉬고 싶어.",
    ];
    this.dialogueSystem?.start([
      { name: "쭉쭉이", portraitKey: "jjook_smile", text: Phaser.Utils.Array.GetRandom(reasons) },
    ]);
  }

  sayByeToJjook() {
    this.dialogueSystem?.start([
      { name: "쭉쭉이", portraitKey: "jjook_smile", text: "좋아! 필요하면 또 불러줘." },
    ]);
  }

  handleSunisuniInteraction() {
    if (this.isInDialogue || !this.dialogueSystem || this.sunisuniQuestState === "locked") return;
    if (!this.isPlayerNearSunisuniNpc()) return;

    if (this.sunisuniQuestState === "sunisuni_found") {
      this.dialogueSystem.start([
        { name: "수니수니", portraitKey: "sunisuni-portrait-sick", portraitSingle: true, text: "아우... 배야..." },
        { name: "수니수니", portraitKey: "sunisuni-portrait-sick", portraitSingle: true, text: "너무 아파서 일어나기가 힘들어..." },
        {
          name: "해냄이",
          portraitKey: "haenaem_confused",
          text: "수니수니에게 뭐라고 말할까요?",
          choices: [
            { label: "괜찮으세요?", onSelect: () => this.askSunisuniHospitalHelp() },
            { label: "도움이 필요하세요?", onSelect: () => this.askSunisuniHospitalHelp() },
          ],
        },
      ]);
      return;
    }

    if (this.sunisuniQuestState === "accepted_help" || this.sunisuniQuestState === "going_hospital") {
      this.dialogueSystem.start([
        { name: "수니수니", portraitKey: "sunisuni-portrait-worried", portraitSingle: true, text: "조금만 천천히 가줄래...?" },
        { name: "해냄이", portraitKey: "haenaem_determined", text: "천천히 같이 가야겠다." },
      ]);
      return;
    }

    if (this.sunisuniQuestState === "got_prescription" || this.sunisuniQuestState === "going_pharmacy") {
      this.dialogueSystem.start([
        { name: "수니수니", portraitKey: "sunisuni-portrait-worried", portraitSingle: true, text: "처방전을 가지고 약국으로 가요." },
      ]);
      return;
    }

    if (this.sunisuniQuestState === "quest_complete") {
      this.dialogueSystem.start([
        { name: "수니수니", portraitKey: "sunisuni-portrait-smile", portraitSingle: true, text: "해냄이 덕분에 많이 괜찮아졌어." },
        { name: "수니수니", portraitKey: "sunisuni-portrait-smile", portraitSingle: true, text: "약은 꼭 설명대로 먹어야 해." },
      ]);
    }
  }

  askSunisuniHospitalHelp() {
    this.dialogueSystem.start([
      { name: "수니수니", portraitKey: "sunisuni-portrait-worried", portraitSingle: true, text: "혼자서는 병원까지 가기 어려울 것 같아..." },
      { name: "수니수니", portraitKey: "sunisuni-portrait-worried", portraitSingle: true, text: "혹시 나랑 같이 가줄 수 있을까?" },
      { name: "수니수니", portraitKey: "sunisuni-portrait-worried", portraitSingle: true, text: "병원에 갔다가 약국도 들러야 할 것 같아..." },
      {
        name: "해냄이",
        portraitKey: "haenaem_confused",
        text: "어떻게 할까요?",
        choices: [
          { label: "같이 가요.", onSelect: () => this.startSunisuniEscort() },
          { label: "잠깐만요...", onSelect: () => this.deferSunisuniHelp() },
        ],
      },
    ]);
  }

  deferSunisuniHelp() {
    this.dialogueSystem.start([
      { name: "수니수니", portraitKey: "sunisuni-portrait-worried", portraitSingle: true, text: "괜찮아... 기다릴게..." },
      { name: "수니수니", portraitKey: "sunisuni-portrait-sick", portraitSingle: true, text: "그래도 너무 아파서 도움이 필요해..." },
    ]);
  }

  startSunisuniEscort() {
    this.dialogueSystem.start([
      { name: "해냄이", portraitKey: "haenaem_determined", text: "같이 가요. 천천히 병원까지 같이 걸어갈게요." },
    ], () => {
      this.sunisuniQuestState = "going_hospital";
      this.clearQuestMarker("sunisuniQuest");
      this.setQuestMarker("sunisuniHospital", this.sunisuniNpc, "!");
      this.setNpcDirectionTexture(this.sunisuniNpc, "sunisuni", "down", false);
      this.showQuestToast("병원으로 가요.");
      this.showSpeechBubble(this.sunisuniNpc, "고마워... 같이 와줘서 마음이 놓여...", 4200);
      this.saveCheckpoint("sunisuni_escort");
    });
  }

  handleHospitalInteraction() {
    if (this.sunisuniQuestState === "quest_complete") {
      this.startHospitalRevisitDialogue();
      return;
    }

    if (this.sunisuniQuestState !== "going_hospital") return;
    this.sunisuniQuestState = "hospital_reception";
    this.showInteriorScene("hospital_interior", "hospital");
    this.dialogueSystem.start([
      { name: "접수 직원", portraitKey: "hospital_staff", text: "어서 오세요. 접수를 도와드릴게요." },
      { name: "접수 직원", portraitKey: "hospital_staff", text: "환자분 성함과 어디가 불편한지 알려주세요." },
      { name: "수니수니", portraitKey: "sunisuni-portrait-worried", text: "해냄아... 내가 너무 긴장해서 말이 잘 안 나와..." },
      {
        name: "해냄이",
        portraitKey: "haenaem_confused",
        text: "접수처에 뭐라고 말하면 좋을까요?",
        choices: [
          { label: "배가 아파서 왔어요.", onSelect: () => this.completeHospitalReception() },
          { label: "음료수를 사러 왔어요.", onSelect: () => this.retryHospitalReception() },
          { label: "쓰레기를 버리러 왔어요.", onSelect: () => this.retryHospitalReception() },
        ],
      },
    ]);
  }

  retryHospitalReception() {
    this.dialogueSystem.start([
      { name: "접수 직원", portraitKey: "hospital_staff", text: "괜찮아요. 천천히 다시 말해볼까요?" },
      { name: "접수 직원", portraitKey: "hospital_staff", text: "병원에서는 아픈 곳을 말하면 접수하기 쉬워요." },
    ], () => {
      this.sunisuniQuestState = "going_hospital";
      this.handleHospitalInteraction();
    });
  }

  completeHospitalReception() {
    this.dialogueSystem.start([
      { name: "접수 직원", portraitKey: "hospital_staff", text: "네, 수니수니 님 배가 아파서 오셨군요." },
      { name: "접수 직원", portraitKey: "hospital_staff", text: "접수되었습니다. 잠시만 기다리면 의사 선생님을 만날 수 있어요." },
      { name: "의사", portraitKey: "hospital_doctor", text: "안녕하세요. 어디가 어떻게 아픈지 알려주세요." },
      { name: "수니수니", portraitKey: "sunisuni-portrait-worried", text: "해냄아... 내가 긴장해서 말이 잘 안 나와..." },
      { name: "수니수니", portraitKey: "sunisuni-portrait-sick", text: "내 배가 아프다고 대신 말해줄래?" },
      {
        name: "해냄이",
        portraitKey: "haenaem_confused",
        text: "의사 선생님께 뭐라고 말할까요?",
        choices: [
          { label: "배가 아파요.", onSelect: () => this.completeDoctorQuiz() },
          { label: "귀가 아파요.", onSelect: () => this.retryDoctorQuiz() },
          { label: "발이 아파요.", onSelect: () => this.retryDoctorQuiz() },
        ],
      },
    ]);
  }

  retryDoctorQuiz() {
    this.dialogueSystem.start([
      { name: "의사", portraitKey: "hospital_doctor", text: "괜찮아요. 다시 해볼까요?" },
      { name: "의사", portraitKey: "hospital_doctor", text: "배가 아플 때는 배가 아프다고 말하면 됩니다." },
    ], () => this.completeHospitalReception());
  }

  completeDoctorQuiz() {
    this.hasPrescription = true;
    this.sunisuniQuestState = "going_pharmacy";
    this.clearQuestMarker("sunisuniHospital");
    this.saveCheckpoint("sunisuni_prescription");
    this.dialogueSystem.start([
      { name: "의사", portraitKey: "hospital_doctor", text: "잘 말했어요. 배가 아플 때는 이렇게 아픈 곳을 알려주면 됩니다." },
      { name: "의사", portraitKey: "hospital_doctor", text: "오늘은 처방전을 줄게요. 이 처방전을 가지고 약국으로 가세요." },
      { name: "의사", portraitKey: "hospital_doctor", text: "처방전입니다." },
    ], () => {
      this.playItemPickupSound();
      this.showQuestToast("처방전을 가지고 약국으로 가요.");
      this.showFloatingItem("prescription_item", Math.max(384, (this.scale.width || 768) / 2), Math.max(240, (this.scale.height || 480) / 2), { width: 190, height: 142 }, true, { duration: 360, hold: 1900, floatY: -12, onComplete: () => this.clearInteriorScene() });
    });
  }

  startHospitalRevisitDialogue() {
    this.showInteriorScene("hospital_interior", "hospital");

    if (this.hospitalRevisitUsed) {
      this.dialogueSystem.start([
        { name: "접수 직원", portraitKey: "hospital_staff", text: "오늘은 이미 진료를 받으셨어요." },
        { name: "접수 직원", portraitKey: "hospital_staff", text: "정말 아프면 보호자와 함께 다시 와 주세요." },
      ], () => this.clearInteriorScene());
      return;
    }

    this.dialogueSystem.start([
      {
        name: "접수 직원",
        portraitKey: "hospital_staff",
        text: "어디가 아프세요?",
        choices: [
          { label: "목이 아파요.", onSelect: () => this.startPretendHospitalVisit("목이") },
          { label: "머리가 아파요.", onSelect: () => this.startPretendHospitalVisit("머리가") },
          { label: "안 아파요.", onSelect: () => this.closeHospitalRevisit("아프지 않다니 다행이에요. 건강할 때도 몸을 잘 살펴보세요.") },
          { label: "잘못 들어왔어요.", onSelect: () => this.closeHospitalRevisit("괜찮아요. 필요할 때 다시 오세요.") },
        ],
      },
    ]);
  }

  startPretendHospitalVisit(symptomLabel) {
    this.dialogueSystem.start([
      { name: "접수 직원", portraitKey: "hospital_staff", text: `${symptomLabel} 아프다고 접수할게요. 진료실로 들어가세요.` },
      { name: "의사", portraitKey: "hospital_doctor", text: "안녕하세요. 어디가 얼마나 아픈지 천천히 말해볼까요?" },
      { name: "해냄이", portraitKey: "haenaem_confused", text: `음... ${symptomLabel}가 아픈 것 같기도 하고 아닌 것 같기도 해요.` },
      { name: "의사", portraitKey: "hospital_doctor", text: "음... 특별히 아픈 곳은 없어 보이는데요?" },
      { name: "의사", portraitKey: "hospital_doctor", text: "병원은 정말 아플 때 오는 곳이에요. 궁금해서 들어오는 곳은 아니랍니다." },
      { name: "의사", portraitKey: "hospital_doctor", text: "몸이 이상하면 보호자에게 먼저 말하고, 필요한 때 진료를 받는 게 좋아요." },
      { name: "접수 직원", portraitKey: "hospital_staff", text: "진료는 끝났습니다." },
      { name: "접수 직원", portraitKey: "hospital_staff", text: "특별한 이상은 없으셨지만 진료비는 내셔야 해요. 1만원입니다." },
    ], () => this.finishPretendHospitalVisit());
  }

  finishPretendHospitalVisit() {
    this.hospitalRevisitUsed = true;
    this.clearInteriorScene();

    if (this.moneySystem?.deductMoney(10000)) {
      this.showQuestToast("진료비 10,000원을 냈어요.", 2600);
      return;
    }

    this.showQuestToast("진료비 10,000원이 부족해요. 다음에는 꼭 챙겨 오자.", 3200);
  }

  closeHospitalRevisit(message) {
    this.dialogueSystem.start([
      { name: "접수 직원", portraitKey: "hospital_staff", text: message },
    ], () => this.clearInteriorScene());
  }

  handlePharmacyInteraction() {
    if (this.sunisuniQuestState === "quest_complete") {
      this.startPharmacyRevisitDialogue();
      return;
    }

    if (this.sunisuniQuestState !== "going_pharmacy" || !this.hasPrescription) return;
    this.sunisuniQuestState = "medicine_paid";
    this.showInteriorScene("pharmacy_interior", "pharmacy");
    this.dialogueSystem.start([
      { name: "약사", portraitKey: "chemist", text: "안녕하세요. 처방전이 있으면 보여주세요." },
      { name: "약사", portraitKey: "chemist", text: "처방전을 확인할게요. 잠시만 기다려 주세요." },
      { name: "약사", portraitKey: "chemist", text: "처방약이 나왔습니다." },
      { name: "약사", portraitKey: "chemist", text: "이 약은 수니수니 님만 드셔야 해요. 다른 사람이 먹으면 안 됩니다." },
      { name: "약사", portraitKey: "chemist", text: "밥을 먹고 30분 뒤에 드세요. 이제 약값 5,000원을 결제해 주세요." },
    ], () => this.payForMedicine());
  }

  payForMedicine() {
    if (!this.moneySystem?.deductMoney(5000)) {
      this.sunisuniQuestState = "going_pharmacy";
      this.clearInteriorScene();
      this.showQuestToast("약값 5,000원이 필요해요.");
      return;
    }

    this.hasPrescription = false;
    this.hasMedicine = true;
    this.playVendingPaymentAnimationLike("bill_5000", () => {
      this.showFloatingItem("medicine_bag", Math.max(384, (this.scale.width || 768) / 2), Math.max(240, (this.scale.height || 480) / 2), { width: 150, height: 150 }, true, {
        duration: 360,
        hold: 1900,
        floatY: -12,
        onComplete: () => {
          this.dialogueSystem.start([
            { name: "약사", portraitKey: "chemist", text: "결제가 완료되었습니다." },
            { name: "약사", portraitKey: "chemist", text: "약 봉투를 잘 챙겨 주세요." },
            { name: "약사", portraitKey: "chemist", text: "약은 꼭 설명대로 먹어야 해요." },
          ], () => this.completeSunisuniQuest());
        },
      });
    });
  }

  startPharmacyRevisitDialogue() {
    this.showInteriorScene("pharmacy_interior", "pharmacy");
    this.dialogueSystem.start([
      {
        name: "약사",
        portraitKey: "chemist",
        text: "어떻게 오셨어요?",
        choices: [
          { label: "머리가 아파요.", onSelect: () => this.startPharmacyHeadacheRoute() },
          { label: "잘못 들어왔어요.", onSelect: () => this.closePharmacyRevisit("언제든 필요할 때 들러주세요.") },
          { label: "활력수를 사고 싶어요.", onSelect: () => this.startVitalDrinkRoute() },
        ],
      },
    ]);
  }

  startPharmacyHeadacheRoute() {
    this.dialogueSystem.start([
      { name: "약사", portraitKey: "chemist", text: "병원은 다녀오셨어요? 처방전 있으신가요?" },
      { name: "해냄이", portraitKey: "haenaem_confused", text: "처방전이 없어요." },
      { name: "약사", portraitKey: "chemist", text: "정말 아프신 건 맞나요? 아파 보이지는 않는데..." },
      {
        name: "해냄이",
        portraitKey: "haenaem_confused",
        text: "어떻게 말할까요?",
        choices: [
          { label: "아파요.", onSelect: () => this.answerPharmacyHeadache(true) },
          { label: "괜찮아요.", onSelect: () => this.answerPharmacyHeadache(false) },
        ],
      },
    ]);
  }

  answerPharmacyHeadache(isStillSick) {
    if (!isStillSick) {
      this.dialogueSystem.start([
        { name: "약사", portraitKey: "chemist", text: "괜찮다니 다행이에요." },
        { name: "약사", portraitKey: "chemist", text: "약은 필요할 때만 먹는 거예요." },
      ], () => this.clearInteriorScene());
      return;
    }

    this.dialogueSystem.start([
      { name: "약사", portraitKey: "chemist", text: "처방전이 없으면 일반 의약품만 드릴 수 있어요." },
      { name: "약사", portraitKey: "chemist", text: "두통약이나 감기약도 꼭 필요한 만큼만 먹어야 해요." },
      { name: "약사", portraitKey: "chemist", text: "정말 아프면 병원에서 먼저 진료를 받아야 합니다." },
    ], () => this.clearInteriorScene());
  }

  startVitalDrinkRoute() {
    if (this.hasReceivedPharmacyDrink) {
      this.dialogueSystem.start([
        { name: "약사", portraitKey: "chemist", text: "활력수나 카페인이 많은 음료는 자주 마시면 몸에 좋지 않아요." },
        { name: "약사", portraitKey: "chemist", text: "오늘은 더 마시지 말고 물을 마시며 쉬어보는 게 좋겠어요." },
      ], () => this.clearInteriorScene());
      return;
    }

    this.dialogueSystem.start([
      { name: "약사", portraitKey: "chemist", text: "아직 어리신데 활력수는 너무 많이 마시면 좋지 않아요." },
      { name: "약사", portraitKey: "chemist", text: "보호자랑 같이 오면 다시 이야기해볼게요." },
      { name: "엄마", portraitKey: "mother_calm", text: "왜 마시고 싶은 거야?" },
      { name: "해냄이", portraitKey: "haenaem_confused", text: "그냥... 다들 마셔서..." },
      { name: "엄마", portraitKey: "mother_worried", text: "그런 음료는 많이 마시면 몸에 안 좋아." },
      { name: "엄마", portraitKey: "mother_smile", text: "대신 엄마가 음료 하나 사줄게. 뭘 마실래?" },
      {
        name: "해냄이",
        portraitKey: "haenaem_confused",
        text: "무엇을 고를까요?",
        choices: [
          { label: "생수", onSelect: () => this.choosePharmacyDrinkChoice("생수", true) },
          { label: "음료수", onSelect: () => this.choosePharmacyDrinkChoice("음료수", false) },
        ],
      },
    ]);
  }

  choosePharmacyDrinkChoice(drinkLabel, isWater) {
    this.hasReceivedPharmacyDrink = true;
    this.dialogueSystem.start([
      { name: "엄마", portraitKey: "mother_smile", text: `${drinkLabel} 좋지. 몸을 생각해서 고르는 것도 멋진 선택이야.` },
      { name: "해냄이", portraitKey: "haenaem_touched", text: "고마워요. 다음엔 몸에 필요한 걸 먼저 생각해볼게요." },
    ], () => {
      this.clearInteriorScene();
      if (isWater) {
        this.showQuestToast("생수를 마셨어. 몸이 편안해졌어.", 2600);
        return;
      }
      this.activateDrinkSpeedBuff();
      this.showQuestToast("음료수를 마셨어. 잠깐 힘이 났어!", 2600);
    });
  }

  closePharmacyRevisit(message) {
    this.dialogueSystem.start([
      { name: "약사", portraitKey: "chemist", text: message },
    ], () => this.clearInteriorScene());
  }

  completeSunisuniQuest() {
    this.sunisuniQuestState = "quest_complete";
    this.clearInteriorScene();
    this.clearQuestMarker("sunisuniHospital");
    this.clearQuestMarker("sunisuniQuest");
    this.hasMedicine = false;
    this.hasBacchus = true;
    this.moneySystem?.addMoney(10000);
    this.playMoneyRewardSound();
    this.showMoneyRewardAnimation?.(10000, { label: "수고비", icon: "./assets/ui/10000won.png" });
    this.showFloatingItem("bacchus_item", this.player.x + 28, this.player.y - 68, 58);
    this.updateBacchusButton();
    this.saveCheckpoint("sunisuni_completed");
    if (this.sunisuniNpc?.active) {
      this.setNpcDirectionTexture(this.sunisuniNpc, "sunisuni", "down", false);
      this.playSunisuniEffect("sunisuni_heart", this.sunisuniNpc.x, this.sunisuniNpc.y - 48);
    }
    this.dialogueSystem.start([
      { name: "수니수니", portraitKey: "sunisuni-portrait-smile", portraitSingle: true, text: "해냄이 덕분에 병원도 가고 약도 샀어." },
      { name: "수니수니", portraitKey: "sunisuni-portrait-smile", portraitSingle: true, text: "정말 고마워." },
      { name: "수니수니", portraitKey: "sunisuni-portrait-smile", portraitSingle: true, text: "이건 같이 가준 보답이야." },
      { name: "엄마", portraitKey: "mother_smile", text: "해냄이, 오늘은 청소뿐 아니라 아픈 친구도 도왔구나!" },
      { name: "엄마", portraitKey: "mother_smile", text: "스스로 생각하고 도와준 모습이 정말 멋졌어." },
    ], () => this.sendSunisuniBackToBench());
  }

  hasTrashInSweepRange() {
    if (!this.player || !this.trashSlimes) return false;

    const multiplier = this.getSweepMultiplier();
    const range = 112 * multiplier;
    return this.trashSlimes.getChildren().some((trash) => {
      return trash.active
        && !trash.getData("cleaned")
        && Phaser.Math.Distance.Between(this.player.x, this.player.y, trash.x, trash.y) <= range;
    });
  }

  showYebiQuestDialogue() {
    if (this.isInDialogue || !this.dialogueSystem || !this.questManager) return;

    const recycleState = this.questManager.getRecycleQuestState();
    if (recycleState === "unlocked") {
      this.dialogueSystem.start([
        { name: "여비", portraitKey: "yeobi", text: "해냄이, 이제 분리수거도 해볼 수 있겠어?" },
        { name: "여비", portraitKey: "yeobi", text: "일반 쓰레기, 캔, 플라스틱을 맞는 통에 넣으면 보상을 받을 수 있어." },
        {
          name: "여비",
          portraitKey: "yeobi",
          text: "일반 30개, 캔 10개, 플라스틱 10개를 모아서 분리수거장에 넣어보자!",
          choices: [{ label: "해볼게", onSelect: () => this.questManager.startRecycleQuest() }],
        },
      ]);
      return;
    }

    if (recycleState === "active") {
      const quest = this.questManager.recycleQuest;
      this.dialogueSystem.start([
        { name: "여비", portraitKey: "yeobi", text: "좋아! 일반 " + quest.current.normal + "/" + quest.target.normal + ", 캔 " + quest.current.can + "/" + quest.target.can + ", 플라스틱 " + quest.current.plastic + "/" + quest.target.plastic + "이야." },
      ]);
      return;
    }

    if (recycleState === "completed") {
      this.dialogueSystem.start([
        { name: "여비", portraitKey: "yeobi", text: "모은 쓰레기를 맞는 통에 넣어보자. 하나 넣을 때마다 분리수거 보상을 받을 수 있어!" },
      ]);
      return;
    }

    const questState = this.questManager.getQuestState();
    if (questState === "inactive") {
      this.dialogueSystem.start([
        {
          name: "여비",
          portraitKey: "yeobi",
          text: "안녕! 혹시 나 좀 도와줄 수 있어?",
          choices: [
            {
              label: "예",
              onSelect: () => {
                this.dialogueSystem.start([
                  { name: "해냄이", portraitKey: "haenaem_determined", text: "알겠어요. 캔을 모아볼게요!" },
                  { name: "여비", portraitKey: "yeobi", text: "고마워! 캔 20개만 모아주면 특별한 선물을 줄게!" },
                ], () => this.questManager.startQuest());
              },
            },
            {
              label: "아니오",
              onSelect: () => {
                this.dialogueSystem.start([
                  { name: "여비", portraitKey: "yeobi", text: "아... 그래. 다음에 꼭 부탁할게." },
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
        { name: "여비", portraitKey: "yeobi", text: "아직 캔 20개 모으는 중이구나? 힘내!" },
      ]);
      return;
    }

    this.dialogueSystem.start([
      { name: "여비", portraitKey: "yeobi", text: "오늘도 고마워. 깨끗한 거리를 같이 만들자!" },
    ]);
  }

  isPlayerNearYebiNpc() {
    return this.interactionSystem.isPlayerNearYebiNpc();
  }

  showFirstGuide() {
    if (this.isMissionComplete || !this.yebiNpc) return;
    
    // 대화창으로 첫 가이드 표시
    const dialogue = [
      { name: "엄마", portraitKey: "mother_smile", text: "해냄아, 삼각지 청소를 도와주면 청소 보상을 받을 수 있대." },
      { name: "엄마", portraitKey: "mother_calm", text: "쓰레기를 빗자루로 치우고 스스로 보상을 모아보자." },
      { name: "해냄이", portraitKey: "haenaem_determined", text: "알겠어. 내가 직접 깨끗하게 치워볼게!" },
    ];
    this.dialogueSystem.start(dialogue, () => this.showYebiQuestDialogue());
  }

  handleMovement() {
    this.playerController.update();
  }

  getPlayerSpeed() {
    return this.playerController.getPlayerSpeed();
  }

  isSunisuniFollowing() {
    return ["going_hospital", "going_pharmacy"].includes(this.sunisuniQuestState);
  }

  updateSunisuniFollower() {
    if (!this.isSunisuniFollowing() || !this.sunisuniNpc?.active || !this.player) return;

    const distance = Phaser.Math.Distance.Between(this.sunisuniNpc.x, this.sunisuniNpc.y, this.player.x, this.player.y);
    if (distance > GAME_CONFIG.sunisuniMaxDistance) {
      this.showSpeechBubble(this.sunisuniNpc, "조금만 천천히 가줄래...?", 900);
    }
    if (distance <= GAME_CONFIG.sunisuniFollowDistance) {
      this.stopNpcWalk(this.sunisuniNpc, "sunisuni");
      return;
    }

    const step = (this.game.loop.delta / 1000) * GAME_CONFIG.playerSpeed * GAME_CONFIG.sunisuniSpeedMultiplier;
    const angle = Phaser.Math.Angle.Between(this.sunisuniNpc.x, this.sunisuniNpc.y, this.player.x, this.player.y);
    const moveX = Math.cos(angle) * Math.min(step, distance - GAME_CONFIG.sunisuniFollowDistance);
    const moveY = Math.sin(angle) * Math.min(step, distance - GAME_CONFIG.sunisuniFollowDistance);
    this.sunisuniNpc.x += moveX;
    this.sunisuniNpc.y += moveY;
    this.updateSunisuniDirection(moveX, moveY);
  }

  updateSunisuniDirection(moveX, moveY) {
    if (!this.sunisuniNpc?.active) return;

    const directionKey = this.getDirectionKeyFromVector(moveX, moveY, this.sunisuniNpc.getData("directionKey") || "down");
    this.setNpcDirectionTexture(this.sunisuniNpc, "sunisuni", directionKey, true);
  }

  updateJjookFollower() {
    if ((!this.isJjookFollowActive && !this.isJjookClothesEscortActive) || !this.jjookNpc || !this.player) return;
    this.stopJjookIdleTween();

    const distance = Phaser.Math.Distance.Between(this.jjookNpc.x, this.jjookNpc.y, this.player.x, this.player.y);
    if (distance <= 88) {
      this.stopNpcWalk(this.jjookNpc, "jjook");
      return;
    }

    const baseFollowSpeed = this.isJjookClothesEscortActive ? GAME_CONFIG.playerSpeed * 1.55 : 118;
    const boostedFollowSpeed = this.isSpeedBuffActive ? baseFollowSpeed * GAME_CONFIG.speedBuffMultiplier : baseFollowSpeed;
    const followSpeed = distance > 220 ? boostedFollowSpeed * 1.35 : boostedFollowSpeed;
    const step = (this.game.loop.delta / 1000) * followSpeed;
    const angle = Phaser.Math.Angle.Between(this.jjookNpc.x, this.jjookNpc.y, this.player.x, this.player.y);
    const moveX = Math.cos(angle) * Math.min(step, distance - 88);
    const moveY = Math.sin(angle) * Math.min(step, distance - 88);
    this.jjookNpc.x += moveX;
    this.jjookNpc.y += moveY;
    const directionKey = this.getDirectionKeyFromVector(moveX, moveY, this.jjookNpc.getData("directionKey") || "down");
    this.setNpcDirectionTexture(this.jjookNpc, "jjook", directionKey, true);
  }

  buildNpcRouteThroughCrosswalk(start, target) {
    const crossesRoad = (start.y > 300 && target.y < 260) || (start.y < 260 && target.y > 300);
    if (!crossesRoad) return [target];

    const crosswalks = [472, 1144];
    const preferredX = crosswalks.reduce((best, x) => {
      return Math.abs(x - target.x) < Math.abs(best - target.x) ? x : best;
    }, crosswalks[0]);
    return [
      { x: preferredX, y: start.y },
      { x: preferredX, y: target.y },
      target,
    ];
  }

  walkNpcToTarget(sprite, npcKey, target, { speed = 105, onComplete = null } = {}) {
    if (!sprite?.active || !target) {
      onComplete?.();
      return;
    }

    if (sprite === this.jjookNpc) {
      this.jjookIdleTween?.stop();
      this.jjookIdleTween = null;
    }
    this.tweens.killTweensOf(sprite);

    const route = this.buildNpcRouteThroughCrosswalk({ x: sprite.x, y: sprite.y }, target)
      .filter((point) => Phaser.Math.Distance.Between(sprite.x, sprite.y, point.x, point.y) > 6);
    const walkNext = (index = 0) => {
      const point = route[index];
      if (!point) {
        this.setNpcDirectionTexture(sprite, npcKey, "down", false);
        onComplete?.();
        return;
      }

      let previousX = sprite.x;
      let previousY = sprite.y;
      const distance = Phaser.Math.Distance.Between(sprite.x, sprite.y, point.x, point.y);
      this.tweens.add({
        targets: sprite,
        x: point.x,
        y: point.y,
        duration: Phaser.Math.Clamp((distance / speed) * 1000, 280, 5200),
        ease: "Linear",
        onUpdate: () => {
          const dx = sprite.x - previousX;
          const dy = sprite.y - previousY;
          if (Math.abs(dx) + Math.abs(dy) > 0.1) {
            const directionKey = this.getDirectionKeyFromVector(dx, dy, sprite.getData("directionKey") || "down");
            this.setNpcDirectionTexture(sprite, npcKey, directionKey, true);
          }
          previousX = sprite.x;
          previousY = sprite.y;
        },
        onComplete: () => walkNext(index + 1),
      });
    };

    walkNext();
  }

  stopJjookIdleTween() {
    this.jjookIdleTween?.stop();
    this.jjookIdleTween = null;
    if (this.jjookNpc) this.tweens.killTweensOf(this.jjookNpc);
  }

  walkJjookBackToHome() {
    if (!this.jjookNpc?.active) return;
    this.isJjookClothesEscortActive = false;
    this.isJjookFollowActive = false;
    this.walkNpcToTarget(this.jjookNpc, "jjook", GAME_CONFIG.jjookSpawn, {
      speed: 112,
      onComplete: () => this.showSpeechBubble(this.jjookNpc, "나중에 또 같이 가자!", 2200),
    });
  }

  updatePlayerDirection(velocity) {
    this.playerController.updatePlayerDirection(velocity);
  }

  setPlayerDirectionTexture(directionKey) {
    this.playerController.setPlayerDirectionTexture(directionKey);
  }

  startFloatingJoystick(event) {
    this.playerController.startFloatingJoystick(event);
  }

  isJoystickStartEvent(event) {
    return this.playerController.isJoystickStartEvent(event);
  }

  updateJoystick(event) {
    this.playerController.updateJoystick(event);
  }

  stopJoystick(event) {
    this.playerController.stopJoystick(event);
  }

  showJoystick(x, y) {
    this.playerController.showJoystick(x, y);
  }

  hideJoystick() {
    this.playerController?.hideJoystick();
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
        ? "플라스틱을 아직 못 주웠어."
        : "이건 여기가 아니야.";
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

    const depositCount = inventoryCount;
    const reward = depositCount * GAME_CONFIG.recycleDepositReward;
    this.recyclingInventory[type] = 0;
    this.showRecycleDepositEffect(binSprite || this.player, type, depositCount);
    this.moneySystem?.addMoney(reward);
    this.playItemPickupSound();
    this.showQuestToast(`${this.getRecycleTypeLabel(type)} ${depositCount}개 분리수거! +${reward.toLocaleString()}원`);
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
      { key: "cancel", label: "안 먹는다", isCancel: true },
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

      const priceText = drink.isCancel ? "닫기" : GAME_CONFIG.drinkPrice.toLocaleString() + "원";
      const price = this.add.text(x, 312, priceText, {
        fontFamily: "Arial",
        fontSize: "17px",
        color: "#ffd966",
        fontStyle: "bold",
        stroke: "#21352c",
        strokeThickness: 4,
      });
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
        this.showQuestToast("다음에 마실게.");
      }
      return;
    }

    if (!this.moneySystem?.deductMoney(GAME_CONFIG.drinkPrice)) {
      this.showQuestToast("돈이 1,000원 필요해요.");
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
    const speedTarget = this.isJjookFollowActive ? "해냄이와 쭉쭉이" : "해냄이";
    this.showQuestToast(`${drink.label}를 마셨어. ${speedTarget} 이동 속도 UP`);
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
    this.saveCheckpoint("jjook_completed");
    this.dialogueSystem?.start([
      { name: "쭉쭉이", portraitKey: "jjook_plogging", text: "그럼 내가 쓰레기 줍는 것이라도 도와줄게!" },
    ]);
  }

  finishJjookQuest() {
    this.jjookQuestState = "completed";
    this.hasWallet = false;
    this.clearQuestMarker("jjookQuest");
    if (this.selectedDrink) {
      this.drinkInventory.push(this.selectedDrink.key);
      this.showQuestToast(this.selectedDrink.label + "를 마셨어. 해냄이와 쭉쭉이 이동 속도 UP");
    }
    this.activateDrinkSpeedBuff();
    this.activateJjookFollower();
    this.shouldCompleteJjookAfterDrink = false;
    this.selectedDrink = null;
    this.saveCheckpoint("jjook_completed");
    this.dialogueSystem?.start([
      { name: "해냄이", portraitKey: "haenaem_touched", text: "잘 먹었어. 고마워! 시원하다!" },
      { name: "쭉쭉이", portraitKey: "jjook_plogging", text: "나도 플로깅을 좋아해. 이제 내가 쓰레기 정리를 도와줄게. 같이 하자!" },
    ]);
  }

  activateDrinkSpeedBuff() {
    this.isSpeedBuffActive = true;
    this.speedBuffTimer?.remove(false);
    this.speedBuffCountdownEvent?.remove(false);
    this.showBuffIcon("speed_buff_icon", "이동 속도 UP", GAME_CONFIG.speedBuffDurationMs);
    this.startEffectCountdown(this.speedBuffHudEl, this.speedBuffTimerEl, GAME_CONFIG.speedBuffDurationMs, (event) => {
      this.speedBuffCountdownEvent = event;
    });
    this.speedBuffTimer = this.time.delayedCall(GAME_CONFIG.speedBuffDurationMs, () => {
      this.isSpeedBuffActive = false;
      this.speedBuffCountdownEvent?.remove(false);
      this.speedBuffCountdownEvent = null;
      this.hideEffectHud(this.speedBuffHudEl, this.speedBuffTimerEl);
      this.showQuestToast("음료수 속도 효과가 끝났어요.");
    });
  }

  activateJjookFollower({ buyColaOnComplete = false } = {}) {
    this.isJjookFollowActive = true;
    this.jjookFollowEndsAt = this.time.now + GAME_CONFIG.jjookFollowDurationMs;
    this.shouldBuyJjookColaAfterFollow = buyColaOnComplete;
    this.jjookFollowTimer?.remove(false);
    this.jjookFollowCountdownEvent?.remove(false);
    this.startEffectCountdown(this.jjookFollowHudEl, this.jjookFollowTimerEl, GAME_CONFIG.jjookFollowDurationMs, (event) => {
      this.jjookFollowCountdownEvent = event;
    });
    this.showQuestToast("쭉쭉이가 1분 동안 플로깅을 도와줘.");
    this.jjookFollowTimer = this.time.delayedCall(GAME_CONFIG.jjookFollowDurationMs, () => {
      this.isJjookFollowActive = false;
      this.jjookFollowCountdownEvent?.remove(false);
      this.jjookFollowCountdownEvent = null;
      this.hideEffectHud(this.jjookFollowHudEl, this.jjookFollowTimerEl);
      this.showQuestToast("쭉쭉이: 그럼 다음에 또 봐!");
      if (this.jjookNpc?.active) {
        this.showSpeechBubble(this.jjookNpc, "그럼 다음에 또 봐!", 3600);
      }
      if (this.shouldBuyJjookColaAfterFollow) {
        this.shouldBuyJjookColaAfterFollow = false;
        this.buyJjookThanksCola();
      }
      this.walkJjookBackToHome();
    });
  }

  showBuffIcon(textureKey, label, duration) {
    if (this.speedBuffHudEl) {
      this.speedBuffHudEl.classList.add("is-visible");
      this.speedBuffHudEl.setAttribute("aria-hidden", "false");
    }
  }

  startEffectCountdown(hudEl, timerEl, duration, saveEvent) {
    hudEl?.classList.add("is-visible");
    hudEl?.setAttribute("aria-hidden", "false");
    const endAt = this.time.now + duration;
    const update = () => {
      const remaining = Math.max(0, Math.ceil((endAt - this.time.now) / 1000));
      if (timerEl) timerEl.textContent = `${remaining}`;
    };
    update();
    const event = this.time.addEvent({ delay: 250, loop: true, callback: update });
    saveEvent?.(event);
  }

  hideEffectHud(hudEl, timerEl) {
    hudEl?.classList.remove("is-visible");
    hudEl?.setAttribute("aria-hidden", "true");
    if (timerEl) timerEl.textContent = "";
  }

  buyJjookThanksCola() {
    if (this.moneySystem?.deductMoney(GAME_CONFIG.drinkPrice)) {
      this.showQuestToast("고마운 마음으로 쭉쭉이에게 콜라를 사줬어. -1,000원", 2600);
      this.playItemPickupSound();
      this.showSpeechBubble(this.jjookNpc || this.player, "콜라 고마워!", 2600);
      return;
    }

    this.showQuestToast("콜라를 사주고 싶었지만 돈이 조금 부족해.", 2600);
    this.showSpeechBubble(this.player, "다음엔 꼭 콜라 사줄게!", 2200);
  }

  showRecycleDepositEffect(target, type, count = 1) {
    const colorByType = {
      can: 0x6fcf97,
      normal: 0x79c6ff,
      plastic: 0xf2c94c,
    };
    const color = colorByType[type] || 0xffffff;
    this.showSpeechBubble(target, count > 1 ? `${count}개 쏙!` : "쏙!");

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

  getRecycleTypeLabel(type) {
    const labelByType = {
      can: "캔",
      normal: "일반 쓰레기",
      plastic: "플라스틱",
    };
    return labelByType[type] || "쓰레기";
  }

  trySweep() {
    this.cleaningSystem.trySweep();
  }

  getSweepMultiplier() {
    return this.cleaningSystem.getSweepMultiplier();
  }

  performSweepAt(x, y, width, height, direction = null) {
    this.cleaningSystem.performSweepAt(x, y, width, height, direction);
  }

  showSweepEffect(x, y, width, height, direction = this.lastDirection) {
    this.cleaningSystem.showSweepEffect(x, y, width, height, direction);
  }

  cleanTrash(slime) {
    this.cleaningSystem.cleanTrash(slime);
  }

  addTrashToRecycleInventory(type) {
    this.cleaningSystem.addTrashToRecycleInventory(type);
  }

  getTrashCleanReward() {
    return this.cleaningSystem.getTrashCleanReward();
  }

  respawnSlime() {
    this.slimeSystem.respawnSlime();
  }

  createTrashSprite(x, y, trashType = "normal") {
    return this.slimeSystem.createTrashSprite(x, y, trashType);
  }

  getRandomNonCanTrashType() {
    return this.slimeSystem.getRandomNonCanTrashType();
  }

  getRandomTrashTexture(trashType) {
    return this.slimeSystem.getRandomTrashTexture(trashType);
  }

  getTrashDisplaySize(textureKey, trashType) {
    return this.slimeSystem.getTrashDisplaySize(textureKey, trashType);
  }

  showSlimePop(slime) {
    this.cleaningSystem.showSlimePop(slime);
  }

  showCleanFeedback(x, y, isCanFeedback = false) {
    this.cleaningSystem.showCleanFeedback(x, y, isCanFeedback);
  }

  activateRecycleMasterReward() {
    if (this.isRecycleMaster) return;

    this.isRecycleMaster = true;
    this.playMoneyRewardSound();
    this.showCleanFeedback(this.player.x, this.player.y, true);
    this.showQuestToast("분리수거 보상 개방! 맞는 통에 넣으면 100원");
    this.dialogueSystem?.start([
      { name: "여비", portraitKey: "yeobi", text: "역시 해냄이야! 이제 쓰레기를 치우면 100원, 분리수거장에 맞게 넣으면 100원을 더 받을 수 있어." },
      { name: "여비", portraitKey: "yeobi", text: "그리고 약속한 멋진 빗자루야. 더 넓게 쓸어보자!" },
    ]);
    this.dropBroomUpgrade();
    this.saveCheckpoint("recycle_completed");
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
      this.saveCheckpoint("broom_upgraded");
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
      this.resultTrashCountEl.textContent = "쓰레기 " + this.totalCleanedCount + "개";
    }
    if (this.resultCanCountEl) {
      this.resultCanCountEl.textContent = "캔 " + this.cleanedCanCount + "개";
    }
    if (this.resultHelpUsedEl) {
      this.resultHelpUsedEl.textContent = this.hasUsedYebi ? "여비 도움 완료" : "여비 도움 미사용";
    }
    this.completeOverlay?.classList.add("is-visible");
    this.completeOverlay?.setAttribute("aria-hidden", "false");
  }

  showYebiUnlockToast() {
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
    this.uiManager.showQuestToast(message, duration);
  }

  showSpeechBubble(target, message, duration = 1050) {
    this.uiManager.showSpeechBubble(target, message, duration);
  }

  queueInventoryCaption(message) {
    this.uiManager.queueInventoryCaption(message);
  }

  showNextInventoryCaption() {
    this.uiManager.showNextInventoryCaption();
  }

  showMoneyRewardAnimation(amount, { label = "선물", icon = "./assets/ui/10000won.png", framed = true } = {}) {
    this.uiManager.showMoneyRewardAnimation(amount, { label, icon, framed });
  }



  showInteriorScene(textureKey, type = "hospital") {
    this.clearInteriorScene();
    document.body.classList.add("interior-scene-active");
    document.body.dataset.interiorScene = type;
    this.interiorSceneGroup = this.add.group();
    this.interiorSceneType = type;

    const viewportWidth = Math.max(768, this.scale.width || 768);
    const viewportHeight = Math.max(480, this.scale.height || 480);
    const centerX = viewportWidth / 2;
    const centerY = viewportHeight / 2;
    const overscan = 1.18;
    const fillColor = type === "pharmacy" ? 0xe9ded2 : 0xded2c4;

    const solidBack = this.add.rectangle(
      centerX,
      centerY,
      viewportWidth * 2,
      viewportHeight * 2,
      fillColor,
      1,
    );
    solidBack.setScrollFactor(0);
    solidBack.setDepth(58);
    this.interiorSceneGroup.add(solidBack);

    const dim = this.add.rectangle(centerX, centerY, viewportWidth * 2, viewportHeight * 2, 0x000000, 0.35);
    dim.setScrollFactor(0);
    dim.setDepth(59);
    this.interiorSceneGroup.add(dim);

    const bg = this.add.image(centerX, centerY, textureKey);
    bg.setScrollFactor(0);
    this.fitInteriorBackground(bg, viewportWidth * overscan, viewportHeight * overscan);
    bg.setDepth(60);
    this.interiorSceneGroup.add(bg);
  }

  fitInteriorBackground(image, targetWidth, targetHeight) {
    const texture = this.textures.get(image.texture.key);
    const source = texture?.getSourceImage?.();
    const sourceWidth = Math.max(1, source?.width || image.width || 1);
    const sourceHeight = Math.max(1, source?.height || image.height || 1);
    const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);
    image.setScale(scale);
  }

  clearInteriorScene() {
    this.interiorSceneGroup?.clear(true, true);
    this.interiorSceneGroup = null;
    this.interiorSpeaker = null;
    this.interiorSceneType = null;
    document.body.classList.remove("interior-scene-active");
    delete document.body.dataset.interiorScene;
  }

  handleDialogueLineChange(line) {
    this.portraitManager?.show(line);
  }

  handleDialogueClose() {
    this.portraitManager?.clear();
  }

  showFloatingItem(textureKey, x, y, size = 64, fixedToCamera = false, options = {}) {
    if (!this.textures.exists(textureKey)) {
      options.onComplete?.();
      return;
    }

    const item = this.add.image(x, y, textureKey);
    item.setDepth(72);
    if (fixedToCamera) item.setScrollFactor(0);
    if (typeof size === "object") {
      item.setDisplaySize(size.width, size.height);
    } else {
      item.setDisplaySize(size, size);
    }
    item.setAlpha(0);
    this.tweens.add({
      targets: item,
      alpha: 1,
      y: y + (options.floatY ?? -18),
      duration: options.duration ?? 280,
      ease: "Back.easeOut",
      yoyo: true,
      hold: options.hold ?? 760,
      onComplete: () => {
        item.destroy();
        options.onComplete?.();
      },
    });
  }

  playVendingPaymentAnimationLike(textureKey, onComplete) {
    const bill = this.add.image(384, 250, textureKey);
    bill.setScrollFactor(0);
    bill.setDisplaySize(132, 80);
    bill.setDepth(71);
    bill.setAlpha(0);
    this.playTone({ frequency: 880, duration: 0.08, type: "triangle", volume: 0.06 });
    this.tweens.add({
      targets: bill,
      alpha: 1,
      y: 205,
      duration: 240,
      ease: "Back.easeOut",
      onComplete: () => {
        this.playTone({ frequency: 1240, duration: 0.08, type: "square", volume: 0.045 });
        this.tweens.add({
          targets: bill,
          x: 520,
          y: 220,
          scaleX: bill.scaleX * 0.25,
          scaleY: bill.scaleY * 0.25,
          alpha: 0,
          duration: 460,
          ease: "Cubic.easeIn",
          onComplete: () => {
            bill.destroy();
            onComplete?.();
          },
        });
      },
    });
  }

  playSunisuniEffect(animKey, x, y) {
    const textureByAnim = {
      sweat_drop: "sweat_effect",
      sunisuni_star: "star_effect",
      sunisuni_heart: "heart_effect",
    };
    const textureKey = textureByAnim[animKey] || "sweat_effect";
    if (!this.anims.exists(animKey) || !this.textures.exists(textureKey)) return;

    const effect = this.add.sprite(x, y, textureKey);
    effect.setDisplaySize(48, 48);
    effect.setDepth(9);
    effect.play(animKey);
    this.tweens.add({
      targets: effect,
      y: y - 18,
      alpha: 0,
      duration: 1200,
      ease: "Cubic.easeOut",
      onComplete: () => effect.destroy(),
    });
  }

  updateBacchusButton() {
    if (!this.bacchusButton) return;

    if (!this.hasBacchus && !this.isBacchusActive) {
      this.bacchusButton.setAttribute("hidden", "");
      this.bacchusButton.classList.remove("is-active");
      if (this.bacchusTimerEl) this.bacchusTimerEl.textContent = "";
      return;
    }

    this.bacchusButton.removeAttribute("hidden");
    this.bacchusButton.classList.toggle("is-active", this.isBacchusActive);
  }

  useBacchusItem() {
    if (!this.hasBacchus || this.isBacchusActive) return;

    this.hasBacchus = false;
    this.isBacchusActive = true;
    this.updateBacchusButton();
    this.playItemPickupSound();
    this.showQuestToast("힘이 나는 것 같아!");
    this.showSpeechBubble(this.player, "조금 더 깨끗하게 치울 수 있겠어!", 1800);
    this.showCleanFeedback(this.player.x, this.player.y, true);

    const endAt = this.time.now + GAME_CONFIG.bacchusDurationMs;
    this.bacchusCountdownEvent?.remove(false);
    this.bacchusCountdownEvent = this.time.addEvent({
      delay: 250,
      loop: true,
      callback: () => {
        const remaining = Math.max(0, Math.ceil((endAt - this.time.now) / 1000));
        if (this.bacchusTimerEl) this.bacchusTimerEl.textContent = `${remaining}`;
      },
    });
    this.bacchusTimer?.remove(false);
    this.bacchusTimer = this.time.delayedCall(GAME_CONFIG.bacchusDurationMs, () => {
      this.isBacchusActive = false;
      this.bacchusCountdownEvent?.remove(false);
      this.bacchusCountdownEvent = null;
      this.updateBacchusButton();
      this.showQuestToast("박카스 효과가 끝났어요.");
    });
  }

  sendSunisuniBackToBench() {
    if (!this.sunisuniNpc?.active) return;

    const target = GAME_CONFIG.sunisuniSpawn;
    this.setNpcDirectionTexture(this.sunisuniNpc, "sunisuni", "down", false);
    this.showSpeechBubble(this.sunisuniNpc, "벤치로 가서 조금 쉴게.", 2200);
    this.walkNpcToTarget(this.sunisuniNpc, "sunisuni", target, {
      speed: 92,
      onComplete: () => {
        this.setNpcDirectionTexture(this.sunisuniNpc, "sunisuni", "down", false);
        this.showSpeechBubble(this.sunisuniNpc, "많이 괜찮아졌어.", 2400);
      },
    });
  }

  useYebiItem() {
    if (!this.hasUnlockedYebi || this.hasUsedYebi || this.isMissionComplete) {
      return;
    }

    this.hasUsedYebi = true;
    this.hasUnlockedYebi = false;
    this.specialButton.hidden = true;
    this.specialButton.setAttribute("aria-hidden", "true");
    this.specialButton.classList.remove("is-ready");
    this.playHelpVoice();
    this.playSpecialUseSound();
    this.showYebiCleanCutscene();

    const remainingTrash = this.trashSlimes
      .getChildren()
      .filter((trash) => trash.active && !trash.getData("cleaned"));
    const targets = Phaser.Utils.Array.Shuffle(remainingTrash).slice(
      0,
      GAME_CONFIG.yebiRemoveCount,
    );

    targets.forEach((trash, index) => {
      this.time.delayedCall(index * 80, () => {
        this.autoCleanTrash(trash);
      });
    });
  }

  showYebiCleanCutscene() {
    this.showYebiCenterMessage("내가 도울게");
  }

  showYebiCenterMessage(
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
    const npc = this.add.sprite(384, 220, NPC_TEXTURES.yeobi.down, 1);
    npc.setScrollFactor(0);
    const npcFinalScale = faceOnly ? 1.7 : 1;
    if (faceOnly) {
      npc.setCrop(12, 0, 40, 48);
      npc.y = 224;
    } else {
      npc.setDisplaySize(112, 168);
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
    this.cleaningSystem.autoCleanTrash(trash);
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
    this.uiManager.updateHud();
  }
}
