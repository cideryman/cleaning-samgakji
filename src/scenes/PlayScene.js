import PlayerController from "../controllers/PlayerController.js";
import {
  GAME_CONFIG,
  NPC_TEXTURES,
  NPC_WALK_ANIMS,
  PLAYER_TEXTURES,
} from "../config/GameConstants.js";
import { createInitialGameState } from "../config/InitialGameState.js";
import { SceneState, StateManager } from "../config/SceneState.js";
import CleaningSystem from "../systems/CleaningSystem.js";
import CheckpointStorage from "../systems/CheckpointStorage.js";
import DialogueManager from "../systems/DialogueManager.js";
import DialogueSystem from "../systems/DialogueSystem.js";
import AudioManager from "../systems/AudioManager.js";
import InteriorSceneSystem from "../systems/InteriorSceneSystem.js";
import InteractionSystem from "../systems/InteractionSystem.js";
import ConsumableSystem from "../systems/ConsumableSystem.js";
import MoneySystem from "../systems/MoneySystem.js";
import PortraitManager from "../systems/PortraitManager.js";
import RoadTrafficSystem from "../systems/RoadTrafficSystem.js";
import RouteGuideSystem from "../systems/RouteGuideSystem.js";
import SceneControlSystem from "../systems/SceneControlSystem.js";
import SlimeSystem from "../systems/SlimeSystem.js";
import ObjectVisibilitySystem from "../systems/ObjectVisibilitySystem.js";
import NextGoalSystem from "../systems/NextGoalSystem.js";
import NpcMemorySystem from "../systems/NpcMemorySystem.js";
import NeighborhoodProgressSystem from "../systems/NeighborhoodProgressSystem.js";
import TiledMapSystem from "../systems/TiledMapSystem.js";
import PathfindingSystem from "../systems/PathfindingSystem.js";
import UIManager from "../systems/UIManager.js";
import VendingMachineSystem from "../systems/VendingMachineSystem.js";
import PackingSystem from "../systems/PackingSystem.js";
import ClothingShopSystem from "../systems/ClothingShopSystem.js";
import SunisuniQuestSystem from "../systems/SunisuniQuestSystem.js";
import JjookQuestSystem from "../systems/JjookQuestSystem.js";
import TravelEndingSystem from "../systems/TravelEndingSystem.js";
import YebiQuestSystem from "../systems/YebiQuestSystem.js";
import HtmlUiBindingSystem from "../systems/HtmlUiBindingSystem.js";
import EducationalGuideSystem from "../systems/EducationalGuideSystem.js";
import TutorialSystem from "../systems/TutorialSystem.js";
import { PACKING_ITEMS } from "../config/PackingData.js";
import { CLOTHING_SHOP_ITEMS } from "../config/ClothingShopData.js";
import { EXTERNAL_ASSETS } from "../config/AssetsData.js";
import {
  JjookQuestState,
  SunisuniQuestState,
  ClothesQuestState,
  PackingQuestState,
} from "../config/QuestStates.js";

const NPC_ROAM_CONFIG = {
  yebi: {
    spriteProp: "yebiNpc",
    npcKey: "yeobi",
    speed: 58,
    waitRangeMs: [2600, 5600],
    messageChance: 42,
    messages: ["캔은 캔 통에!", "오늘도 깨끗하게!", "분리수거는 차근차근!"],
  },
  jjook: {
    spriteProp: "jjookNpc",
    npcKey: "jjook",
    speed: 70,
    waitRangeMs: [2400, 5200],
    messageChance: 36,
    messages: ["걷기 좋은 날이야!", "물도 챙겨야지.", "서울 가면 뭐 먹지?", "나 기차 타는 거 기대돼.", "짐 너무 많이 싸면 힘들겠지?"],
  },
  sunisuni: {
    spriteProp: "sunisuniNpc",
    npcKey: "sunisuni",
    speed: 52,
    waitRangeMs: [2800, 5800],
    messageChance: 36,
    messages: ["천천히 걸으면 좋아.", "약은 설명대로 먹어야 해.", "도와줘서 고마워."],
  },
};

export default class PlayScene extends Phaser.Scene {
  // ---------------------------------------------------------------------------
  // Scene State And Lifecycle
  // ---------------------------------------------------------------------------

  constructor() {
    super("PlayScene");
    Object.assign(this, createInitialGameState());
    this.roadTrafficSystem = null;
    this.routeGuideSystem = null;
    this.vendingMachineSystem = null;
    this.packingSystem = null;
    this.clothingShopSystem = null;
    this.sunisuniQuestSystem = null;
    this.jjookQuestSystem = null;
    this.travelEndingSystem = null;
    this.yebiQuestSystem = null;
    this.htmlUiBindingSystem = null;
    this.pathfindingSystem = null;
    this.tutorialSystem = null;
    this.audioManager = null;
    this.sceneControlSystem = null;
    this.interiorSceneSystem = null;
    this.consumableSystem = null;
    this.objectVisibilitySystem = null;
    this.nextGoalSystem = null;
    this.npcMemorySystem = null;
    this.neighborhoodProgressSystem = null;
    this.lastDirection = new Phaser.Math.Vector2(1, 0);
    this.joystickVector = new Phaser.Math.Vector2(0, 0);
    this.audioContext = null;
    this.bgmAudio = null;
    this.sceneBgmAudio = null;
    this.bgmIndex = 1;
    this.bgmObjectUrl = null;
  }

  // ---------------------------------------------------------------------------
  // Scene Bootstrapping
  // ---------------------------------------------------------------------------

  create(data = {}) {
    this.htmlUiBindingSystem = new HtmlUiBindingSystem(this);
    this.resetRunState();
    document.body.classList.remove("start-screen");
    document.body.classList.remove("epilogue-scene-active");

    const isLargeText = this.registry.get("textSizeLarge") === true || window.localStorage?.getItem("samgakji_text_size_large") === "true";
    document.body.classList.toggle("ui-large-text", isLargeText);

    const isSound = this.registry.get("soundEnabled") !== false && window.localStorage?.getItem("samgakji_sound_enabled") !== "false";
    this.registry.set("soundEnabled", isSound);
    this.sound.mute = !isSound;

    this.htmlUiBindingSystem.lookupElements();
    this.htmlUiBindingSystem.bind();

    this.completeOverlay?.classList.remove("is-visible");
    this.completeOverlay?.setAttribute("aria-hidden", "true");
    this.specialToast?.classList.remove("is-visible");
    this.specialToast?.setAttribute("aria-hidden", "true");
    this.hideJoystick();
    
    // ===== 시스템 초기화 =====
    this.stateManager = new StateManager();
    this.dialogueSystem = new DialogueSystem(this);
    this.dialogueManager = new DialogueManager(this, { dialogueSystem: this.dialogueSystem });
    this.audioManager = new AudioManager(this);
    this.interiorSceneSystem = new InteriorSceneSystem(this);
    this.consumableSystem = new ConsumableSystem(this);
    this.sceneControlSystem = new SceneControlSystem(this);
    this.objectVisibilitySystem = new ObjectVisibilitySystem(this);
    this.nextGoalSystem = new NextGoalSystem(this);
    this.npcMemorySystem = new NpcMemorySystem(this);
    this.neighborhoodProgressSystem = new NeighborhoodProgressSystem(this);
    this.dialogueManager.addActionHandlers({
      START_CLOTHES_SHOP: () => this.startClothesShoppingQuest(),
      DECLINE_CLOTHES_SHOP: () => this.declineClothesShoppingQuest(),
    });
    this.portraitManager = new PortraitManager(this);
    this.moneySystem = new MoneySystem(this);
    this.roadTrafficSystem = new RoadTrafficSystem(this);
    this.routeGuideSystem = new RouteGuideSystem(this);
    this.tiledMapSystem = new TiledMapSystem(this);
    this.pathfindingSystem = new PathfindingSystem(this);
    this.vendingMachineSystem = new VendingMachineSystem(this);
    this.packingSystem = new PackingSystem(this);
    this.clothingShopSystem = new ClothingShopSystem(this);
    this.sunisuniQuestSystem = new SunisuniQuestSystem(this);
    this.jjookQuestSystem = new JjookQuestSystem(this);
    this.travelEndingSystem = new TravelEndingSystem(this);
    this.yebiQuestSystem = new YebiQuestSystem(this);
    this.playerController = new PlayerController(this);
    this.interactionSystem = new InteractionSystem(this);
    this.interactionSystem.setupInteractiveZones();
    this.slimeSystem = new SlimeSystem(this);
    this.cleaningSystem = new CleaningSystem(this);
    this.uiManager = new UIManager(this);
    this.nextGoalSystem?.create();
    this.educationalGuideSystem = new EducationalGuideSystem(this);
    this.educationalGuideSystem.create();
    this.tutorialSystem = new TutorialSystem(this);
    this.tutorialSystem.create();
    this.isInDialogue = false;
    this.isContractActive = false;   // 챕터 2에서 사용
    this.currentChapter = 1;
    this.isChapterComplete = false;
    
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.npcBubbleEvent?.destroy();
      this.clearNpcRoaming();
      this.stopChapterMusic();
      this.htmlUiBindingSystem?.unbind();
      this.educationalGuideSystem?.destroy();
      this.tutorialSystem?.destroy?.();
      this.pathfindingSystem?.destroy();
      this.nextGoalSystem?.destroy();
      this.neighborhoodProgressSystem?.destroy();
      this.portraitManager?.destroy();
      this.closeClothingShopMenu();
      this.closePackingMenu?.();
      this.vendingMachineSystem?.close();
      this.travelEndingSystem?.cleanupBusStopSequence?.();
      this.travelEndingSystem?.cleanupPermanentBusStopObjects?.();
      this.roadTrafficSystem?.cleanup();
      this.routeGuideSystem?.destroy();
    });

    this.createMap();
    this.neighborhoodProgressSystem?.create();
    this.travelEndingSystem?.createPermanentBusStopObjects?.();
    this.createSunisuniAnimations();
    this.createRecyclingCenter();
    this.createYebiNpc();
    this.createSunisuniNpc();
    this.createPlayer();
    this.trashSlimes = this.physics.add.staticGroup();
    this.spawnTrashWave();
    this.createInput();
    this.roadTrafficSystem.create();
    this.updateHud();
    this.updateTravelPrepHud();
    this.updateCameraZoom();
    this.educationGuideSeen = {
      hospital: false,
      pharmacy: false,
      clothing: false,
      vending: false,
      crosswalk: false,
      recycling: false,
      busStop: false,
      convenienceStore: false
    };
    this.pathfindingSystem?.create();
    const restoredCheckpoint = this.restoreCheckpointIfRequested(data);
    this.neighborhoodProgressSystem?.refresh({ silent: true });
    if (this.packingQuestState === "traveling_home" || this.packingQuestState === "ending_complete") {
      document.body.classList.add("epilogue-scene-active");
    }
    this.updateNpcRoaming(true);
    
    if (this.tutorialState === "completed") {
      this.slimeSystem?.startRespawnLoop();
      this.slimeSystem?.ensureActiveTrash();
    }
    
    // 3️⃣ 45~75초 주기로 마을 주민 랜덤 한 줄 말풍선 대사 연출 (주민 기억 & 서울 기대감)
    this.npcBubbleEvent = this.time.addEvent({
      delay: Phaser.Math.Between(45000, 75000),
      loop: true,
      callback: () => this.triggerRandomNpcBubble(),
    });

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

  // ---------------------------------------------------------------------------
  // Run State Reset And Checkpoints
  // ---------------------------------------------------------------------------

  resetRunState() {
    this.jjookFollowTimer?.remove(false);
    this.jjookFollowCountdownEvent?.remove(false);
    this.speedBuffTimer?.remove(false);
    this.speedBuffCountdownEvent?.remove(false);
    this.bacchusTimer?.remove(false);
    this.bacchusCountdownEvent?.remove(false);
    this.closePackingMenu?.();
    this.travelEndingSystem?.cleanupBusStopSequence?.();
    this.travelEndingSystem?.cleanupPermanentBusStopObjects?.();
    this.clearNpcRoaming?.();
    this.closeClothingShopMenu?.();
    this.htmlUiBindingSystem?.reset();
    this.interiorSceneGroup?.clear(true, true);
    Object.values(this.questMarkers || {}).forEach((marker) => marker.text?.destroy());
    Object.assign(this, createInitialGameState());
    this.lastDirection.set(1, 0);
    this.joystickVector.set(0, 0);
    this.stopSceneMusic?.({ resumeChapter: false });
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

  // ---------------------------------------------------------------------------
  // Frame Update Loop
  // ---------------------------------------------------------------------------

  update(time, delta) {
    this.tutorialSystem?.update?.(time, delta);
    this.handleVendingMenuKeyboard();
    this.handleClothingShopKeyboard();
    this.handlePackingMenuKeyboard();
    this.playerController.update(time, delta);
    this.checkRecycleQuestUnlock();
    this.yebiQuestSystem?.update(time, delta);
    this.checkJjookQuestUnlock();
    this.checkSunisuniQuestUnlock();
    this.checkClothesQuestUnlock();
    this.checkWalletPickup();
    this.updateJjookFollower();
    this.updateSunisuniFollower();
    this.updateJjookAutoPlogging();
    this.roadTrafficSystem?.update(delta);
    this.routeGuideSystem?.update();
    this.neighborhoodProgressSystem?.update();
    this.travelEndingSystem?.checkBusStopArrival();
    this.updateNpcRoaming();
    this.separateNpcSprites();
    this.updateQuestMarkers();
    this.updateWorldDepths();
    this.objectVisibilitySystem?.updateBehindObjectsOpacity();
  }

  // ---------------------------------------------------------------------------
  // Depth Sorting, Quest Markers, And Direction Helpers
  // ---------------------------------------------------------------------------

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

    const previousAnimKey = sprite.anims?.currentAnim?.key;
    sprite.setData("directionKey", directionKey);
    if (sprite.texture?.key !== textureKey) {
      sprite.setTexture(textureKey, 1);
    }
    sprite.setDisplaySize(GAME_CONFIG.playerDisplayWidth, GAME_CONFIG.playerDisplayHeight);
    sprite.setOrigin(0.5, 0.5);

    const animKey = NPC_WALK_ANIMS[npcKey]?.[directionKey];
    if (moving && animKey && this.anims.exists(animKey)) {
      if (previousAnimKey !== animKey || !sprite.anims?.isPlaying) {
        sprite.anims?.play(animKey, true);
      }
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

  // ---------------------------------------------------------------------------
  // Quest Unlock Gates
  // ---------------------------------------------------------------------------

  checkRecycleQuestUnlock() {
    this.yebiQuestSystem?.checkRecycleQuestUnlock();
  }

  checkJjookQuestUnlock() {
    if (!this.moneySystem || !this.yebiQuestSystem || this.hasAnnouncedJjookQuest) return;
    if (this.jjookQuestState !== JjookQuestState.LOCKED) return;
    if (this.yebiQuestSystem.getRecycleQuestState() !== "completed") return;
    if (this.moneySystem.money < GAME_CONFIG.jjookQuestUnlockMoney) return;

    this.hasAnnouncedJjookQuest = true;
    this.jjookQuestState = JjookQuestState.WALLET_MISSING;
    this.createJjookQuestObjects();
    this.setQuestMarker("jjookQuest", this.jjookNpc, "?");
    this.showQuestToast("쭉쭉이가 자판기 앞에서 기다리고 있어!", 10000);
    this.showSpeechBubble(this.jjookNpc, "내 지갑 어디 갔지?", 10000);
    this.saveCheckpoint("jjook_unlocked");
  }

  checkSunisuniQuestUnlock() {
    if (!this.moneySystem || this.hasAnnouncedSunisuniQuest) return;
    if (this.sunisuniQuestState !== SunisuniQuestState.LOCKED) return;
    if (this.jjookQuestState !== JjookQuestState.COMPLETED) return;
    if (this.moneySystem.money < GAME_CONFIG.sunisuniQuestUnlockMoney) return;

    this.hasAnnouncedSunisuniQuest = true;
    this.sunisuniQuestState = SunisuniQuestState.FOUND;
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
    if (this.clothesQuestState !== ClothesQuestState.LOCKED) return;
    if (this.sunisuniQuestState !== SunisuniQuestState.QUEST_COMPLETE) return;
    if (this.moneySystem.money < GAME_CONFIG.clothesQuestUnlockMoney) return;

    this.hasAnnouncedClothesQuest = true;
    this.clothesQuestState = ClothesQuestState.READY;
    this.createJjookQuestObjects();
    this.setQuestMarker("clothesQuest", this.jjookNpc, "!");
    this.showQuestToast("쭉쭉이가 서울 여행 준비 이야기를 하고 싶어 해요!", 10000);
    this.showSpeechBubble(this.jjookNpc, "옷 보러 갈래?", 10000);
    this.saveCheckpoint("clothes_ready");
  }

  // ---------------------------------------------------------------------------
  // Map Loading And Tiled Object Construction
  // ---------------------------------------------------------------------------

  createMap() {
    this.tiledMapSystem?.createMap();
  }

  getMapPoint(key, fallback) {
    return this.tiledMapSystem?.getMapPoint(key, fallback) || fallback;
  }

  addObjectCollider(name, x, y, width, height) {
    return this.tiledMapSystem?.addObjectCollider(name, x, y, width, height) || null;
  }

  // ---------------------------------------------------------------------------
  // Core World Object Creation
  // ---------------------------------------------------------------------------

  createRecyclingCenter() {
    this.yebiQuestSystem?.createRecyclingCenter();
  }

  getYebiRecyclePosition() {
    return this.yebiQuestSystem?.getRecyclePosition() || this.getMapPoint("recycling_center", GAME_CONFIG.recyclingCenter);
  }

  // ---------------------------------------------------------------------------
  // NPC Creation And Setup
  // ---------------------------------------------------------------------------

  createJjookQuestObjects() {
    if (!this.jjookNpc) {
      const { x, y } = this.getMapPoint("jjook_start", GAME_CONFIG.jjookSpawn);
      this.jjookNpc = this.add.sprite(x, y, NPC_TEXTURES.jjook.down, 1);
      this.setNpcDirectionTexture(this.jjookNpc, "jjook", "down", false);
      this.jjookNpc.setDepth(4.2);
      this.jjookNpc.setInteractive(
        new Phaser.Geom.Rectangle(-16, -16, this.jjookNpc.width + 32, this.jjookNpc.height + 32),
        Phaser.Geom.Rectangle.Contains
      );
      this.jjookNpc.input.useHandCursor = true;
      this.jjookNpc.on("pointerdown", (pointer) => {
        pointer.event?.preventDefault();
        pointer.event?.stopPropagation();
        if (this.sceneControlSystem?.isWorldInputBlocked()) return;
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

    const { x, y } = this.getMapPoint("sunisuni_start", GAME_CONFIG.sunisuniSpawn);
    this.sunisuniNpc = this.add.sprite(x, y, NPC_TEXTURES.sunisuni.down, 1);
    this.setSunisuniWaitingPose();
    this.sunisuniNpc.setDepth(4.15);
    this.sunisuniNpc.setVisible(false);
    this.sunisuniNpc.setActive(false);
    this.sunisuniNpc.setInteractive(
      new Phaser.Geom.Rectangle(-16, -16, this.sunisuniNpc.width + 32, this.sunisuniNpc.height + 32),
      Phaser.Geom.Rectangle.Contains
    );
    this.sunisuniNpc.input.useHandCursor = true;
    this.sunisuniNpc.on("pointerdown", (pointer) => {
      pointer.event?.preventDefault();
      pointer.event?.stopPropagation();
      if (this.sceneControlSystem?.isWorldInputBlocked()) return;
      this.handleSunisuniInteraction();
    });
  }

  setSunisuniWaitingPose() {
    if (!this.sunisuniNpc) return;

    this.setNpcDirectionTexture(this.sunisuniNpc, "sunisuni", "down", false);
  }

  // ---------------------------------------------------------------------------
  // Early Quest Items And Vending Entry
  // ---------------------------------------------------------------------------

  handleVendingMachineInteraction() {
    if (this.sceneControlSystem?.isWorldInputBlocked()) return;
    if (this.isInDialogue || this.vendingMenuGroup) return;
    if (!this.isPlayerNearVendingMachine()) return;

    if (this.jjookQuestState === JjookQuestState.COMPLETED) {
      this.openVendingMenu({ completeQuestOnSelect: false });
      return;
    }

    if (this.jjookQuestState === JjookQuestState.WALLET_FOUND) {
      this.handleJjookInteraction();
      return;
    }

    this.dialogueSystem?.start([
      { name: "해냄이", portraitKey: "haenaem_confused", text: "아냐, 돈을 먼저 모아야 해." },
    ]);
  }

  spawnWalletItem() {
    if (this.walletItem?.active) return;

    // Filter slime spawn points below the road (y > 320) and not blocked
    const possiblePoints = (this.slimeSpawnPoints || []).filter(([x, y]) => {
      return y > 320 && !this.isBlockedSpawnPoint(x, y);
    });

    let spawnPoint;
    if (possiblePoints.length > 0) {
      const [x, y] = Phaser.Utils.Array.GetRandom(possiblePoints);
      spawnPoint = { x, y };
    } else {
      spawnPoint = GAME_CONFIG.walletSpawn; // Fallback to { x: 250, y: 735 }
    }

    const { x, y } = spawnPoint;
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
      delay: 150, // Faster sparkles (150ms instead of 360ms)
      loop: true,
      callback: () => this.showWalletSparkle(),
    });

    this.physics.add.overlap(this.player, this.walletItem, () => this.collectWallet());
  }

  showWalletSparkle() {
    if (!this.walletItem?.active) return;

    const count = Phaser.Math.Between(1, 2);
    for (let i = 0; i < count; i++) {
      const sparkle = this.add.circle(
        this.walletItem.x + Phaser.Math.Between(-26, 26),
        this.walletItem.y + Phaser.Math.Between(-22, 20),
        Phaser.Math.Between(3, 6),
        0xffeb3b, // Golden yellow color
        0.95,
      );
      sparkle.setDepth(7);
      this.tweens.add({
        targets: sparkle,
        y: sparkle.y - Phaser.Math.Between(15, 30),
        alpha: 0,
        scale: 0.1,
        duration: Phaser.Math.Between(400, 700),
        ease: "Cubic.easeOut",
        onComplete: () => sparkle.destroy(),
      });
    }
  }

  collectWallet() {
    if (this.hasWallet || this.jjookQuestState !== JjookQuestState.WALLET_MISSING) return;

    this.hasWallet = true;
    this.jjookQuestState = JjookQuestState.WALLET_FOUND;
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
    if (!this.walletItem?.active || !this.player || this.jjookQuestState !== JjookQuestState.WALLET_MISSING) return;

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

  // ---------------------------------------------------------------------------
  // Yebi Quest Movement
  // ---------------------------------------------------------------------------

  createYebiNpc() {
    const startPoint = this.getMapPoint("yebi_start", {
      x: this.playerStart.x + 108,
      y: this.playerStart.y - 8,
    });
    const fallbackX = startPoint.x;
    const fallbackY = startPoint.y;
    const x = this.isBlockedSpawnPoint(fallbackX, fallbackY) ? this.playerStart.x + 72 : fallbackX;
    const y = fallbackY;

    this.yebiNpc = this.add.sprite(x, y, NPC_TEXTURES.yeobi.down, 1);
    this.setNpcDirectionTexture(this.yebiNpc, "yeobi", "down", false);
    this.yebiNpc.setDepth(3.5);
    this.yebiNpc.setInteractive(
      new Phaser.Geom.Rectangle(-16, -16, this.yebiNpc.width + 32, this.yebiNpc.height + 32),
      Phaser.Geom.Rectangle.Contains
    );
    this.yebiNpc.input.useHandCursor = true;
    this.yebiNpc.on("pointerdown", (pointer) => {
      pointer.event?.preventDefault();
      pointer.event?.stopPropagation();
      if (this.sceneControlSystem?.isWorldInputBlocked()) return;
      this.showYebiQuestDialogue();
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
    this.yebiQuestSystem?.moveYebiToRecyclingCenter();
  }

  walkYebiToRecyclingCenter() {
    this.yebiQuestSystem?.walkYebiToRecyclingCenter();
  }

  getYebiPathToRecyclingCenter(target) {
    return this.yebiQuestSystem?.getPathToRecyclingCenter(target) || [];
  }

  walkYebiAlongPath(path, index) {
    this.yebiQuestSystem?.walkAlongPath(path, index);
  }

  startYebiIdleBob() {
    this.yebiQuestSystem?.startIdleBob();
  }

  // ---------------------------------------------------------------------------
  // Player, Trash Spawns, And Input
  // ---------------------------------------------------------------------------

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
    this.trashSlimes = this.trashSlimes || this.physics.add.staticGroup();

    // Do not spawn slimes if in the introductory tutorial
    if (this.tutorialState === "intro" || this.tutorialState === "move" || this.tutorialState === "sweep" || this.tutorialState === "deposit" || this.tutorialState === "npc") {
      return;
    }
    const positions = this.createRandomSlimePositions();
    const canIndexes = new Set(Phaser.Utils.Array.Shuffle(
      Array.from({ length: positions.length }, (_, index) => index),
    ).slice(0, Math.min(GAME_CONFIG.canCount, positions.length)));

    positions.forEach(([x, y], index) => {
      const trashType = canIndexes.has(index) ? "can" : this.getRandomNonCanTrashType();
      this.createTrashSprite(x, y, trashType);
    });

    this.updateHud();
    this.slimeSystem?.startRespawnLoop();
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
      { left: 300, right: 870, top: 570, bottom: 760 },
      { left: 860, right: 1250, top: 460, bottom: 565 },
      { left: 1040, right: 1410, top: 360, bottom: 525 },
      { left: 1030, right: 1430, top: 600, bottom: 930 },
      { left: 1220, right: 1415, top: 440, bottom: 760 },
      { left: 160, right: 520, top: 488, bottom: 920 },
      { left: 520, right: 1040, top: 800, bottom: 990 },
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

  isCollisionTileBlocked(x, y) {
    if (!this.walls?.getTileAtWorldXY) return false;

    const tile = this.walls.getTileAtWorldXY(x, y, true);
    return Boolean(tile && tile.index !== -1 && tile.collides);
  }

  isBlockedSpawnPoint(x, y) {
    const blockedAreas = [
      { left: 0, right: 90, top: 0, bottom: GAME_CONFIG.worldHeight },
      { left: GAME_CONFIG.worldWidth - 90, right: GAME_CONFIG.worldWidth, top: 0, bottom: GAME_CONFIG.worldHeight },
      { left: 0, right: GAME_CONFIG.worldWidth, top: 0, bottom: 64 },
      { left: 0, right: GAME_CONFIG.worldWidth, top: GAME_CONFIG.worldHeight - 64, bottom: GAME_CONFIG.worldHeight },
    ];

    const isStaticAreaBlocked = blockedAreas.some((area) => {
      return x >= area.left && x <= area.right && y >= area.top && y <= area.bottom;
    });
    if (isStaticAreaBlocked) return true;

    if (this.isCollisionTileBlocked(x, y)) return true;

    return (this.objectCollisionRects || []).some((rect) => {
      return Phaser.Geom.Rectangle.Contains(rect, x, y);
    });
  }

  createInput() {
    this.playerController.createInput();
  }

  // ---------------------------------------------------------------------------
  // Development Shortcuts
  // ---------------------------------------------------------------------------

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

    const canQuest = this.yebiQuestSystem?.canQuest;
    const recycleQuest = this.yebiQuestSystem?.recycleQuest;

    if (canQuest && !canQuest.isCompleted) {
      canQuest.isActive = false;
      canQuest.isCompleted = true;
      canQuest.current = canQuest.target;
      this.yebiQuestSystem.updateUI();
      this.yebiQuestSystem.hideQuestGaugeWithPoof();
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
      this.yebiQuestSystem.updateUI();
      this.yebiQuestSystem.hideQuestGaugeWithPoof();
      this.clearQuestMarker("recycleQuest");
      this.ensureDevMoney(GAME_CONFIG.jjookQuestUnlockMoney);
      this.hasAnnouncedJjookQuest = false;
      this.checkJjookQuestUnlock();
      this.showQuestToast("F4: 쭉쭉이 퀘스트로 이동");
      return;
    }

    if (this.jjookQuestState !== JjookQuestState.COMPLETED) {
      this.createJjookQuestObjects();
      this.jjookQuestState = JjookQuestState.COMPLETED;
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

    if (this.sunisuniQuestState === SunisuniQuestState.LOCKED) {
      this.ensureDevMoney(GAME_CONFIG.sunisuniQuestUnlockMoney);
      this.hasAnnouncedSunisuniQuest = false;
      this.checkSunisuniQuestUnlock();
      this.showQuestToast("F4: 수니수니 퀘스트 시작");
      return;
    }

    if (this.sunisuniQuestState !== SunisuniQuestState.QUEST_COMPLETE) {
      this.forceCompleteDevSunisuniQuest();
      this.showQuestToast("F4: 옷가게 퀘스트로 이동");
      return;
    }

    if (this.clothesQuestState === ClothesQuestState.LOCKED) {
      this.ensureDevMoney(GAME_CONFIG.clothesQuestUnlockMoney);
      this.hasAnnouncedClothesQuest = false;
      this.checkClothesQuestUnlock();
      this.showQuestToast("F4: 옷가게 퀘스트 시작");
      return;
    }

    if (this.clothesQuestState !== ClothesQuestState.COMPLETED) {
      this.forceCompleteDevClothesQuest();
      this.showQuestToast("F4: 짐싸기 퀘스트로 이동");
      return;
    }

    if (this.packingQuestState === PackingQuestState.LOCKED) {
      this.packingQuestState = PackingQuestState.OFFERED;
      this.setQuestMarker("packingQuest", this.jjookNpc, "!");
      this.saveCheckpoint("packing_unlocked");
      this.showQuestToast("F4: 짐싸기 퀘스트 준비");
      return;
    }

    if (this.packingQuestState !== PackingQuestState.ENDING_COMPLETE) {
      this.forceCompleteDevPackingQuest();
      this.showQuestToast("F4: 챕터 1 엔딩 완료");
      return;
    }

    this.showQuestToast("F4: 이미 마지막 퀘스트까지 완료했어.");
  }

  forceCompleteDevSunisuniQuest() {
    this.clearInteriorScene?.();
    this.closePackingMenu?.();
    this.closeClothingShopMenu?.();
    this.travelEndingSystem?.cleanupBusStopSequence?.();
    this.sunisuniQuestState = SunisuniQuestState.QUEST_COMPLETE;
    this.hasPrescription = false;
    this.hasMedicine = false;
    this.hasBacchus = true;
    this.clearQuestMarker("sunisuniQuest");
    this.clearQuestMarker("sunisuniHospital");
    if (this.sunisuniNpc) {
      this.sunisuniNpc.setVisible(true);
      this.sunisuniNpc.setActive(true);
      this.setNpcDirectionTexture(this.sunisuniNpc, "sunisuni", "down", false);
    }
    this.updateBacchusButton?.();
    this.ensureDevMoney(GAME_CONFIG.clothesQuestUnlockMoney);
    this.hasAnnouncedClothesQuest = false;
    this.checkClothesQuestUnlock();
    this.saveCheckpoint("dev_sunisuni_completed");
  }

  forceCompleteDevClothesQuest() {
    this.closeClothingShopMenu?.();
    this.clearInteriorScene?.();
    this.isJjookClothesEscortActive = false;
    this.clothesQuestState = ClothesQuestState.COMPLETED;
    this.packingQuestState = PackingQuestState.OFFERED;
    this.clearQuestMarker("clothesShop");
    this.clearQuestMarker("clothesQuest");
    this.setQuestMarker("packingQuest", this.jjookNpc, "!");
    if (!this.travelPrepItems?.length) {
      const sampleItems = ["white_tshirt", "cotton_pants", "sneakers"]
        .map((key) => CLOTHING_SHOP_ITEMS.find((item) => item.key === key))
        .filter(Boolean);
      this.travelPrepItems = sampleItems.map((item) => ({
        key: item.key,
        category: item.category,
        label: item.label,
        texture: item.texture,
        price: item.price,
      }));
      this.updateTravelPrepHud?.();
    }
    this.saveCheckpoint("dev_clothes_completed");
  }

  forceCompleteDevPackingQuest() {
    this.closePackingMenu?.();
    this.closeClothingShopMenu?.();
    this.clearInteriorScene?.();
    this.travelEndingSystem?.cleanupBusStopSequence?.();
    this.clearQuestMarker("packingQuest");
    this.isJjookBusEscortActive = false;
    this.packingItems = PACKING_ITEMS
      .filter((item) => ["socks", "toothbrush", "phone", "charger", "wallet", "transit_card"].includes(item.key))
      .map((item) => ({ ...item }));
    this.packingQuestState = PackingQuestState.COMPLETED;
    this.saveCheckpoint("dev_packing_completed");
    this.travelEndingSystem?.finishChapterOneEnding();
  }

  ensureDevMoney(amount) {
    if (!this.moneySystem || this.moneySystem.money >= amount) return;
    this.moneySystem.addMoney(amount - this.moneySystem.money);
  }

  // ---------------------------------------------------------------------------
  // Interaction Facade
  // ---------------------------------------------------------------------------

  handleSpaceAction() {
    if (this.isInDialogue) {
      return;
    }

    if (this.clothingShopModal) {
      this.selectFocusedClothingShopOption();
      return;
    }

    if (this.packingModal) {
      this.selectFocusedPackingOption();
      return;
    }

    if (this.vendingMenuGroup) {
      this.selectHighlightedVendingOption();
      return;
    }

    if (this.sceneControlSystem?.isWorldInputBlocked()) {
      return;
    }

    this.handlePrimaryAction();
  }

  handlePrimaryAction() {
    if (this.sceneControlSystem?.isWorldInputBlocked()) return;
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

  isPlayerNearConvenienceStoreDoor() {
    return this.interactionSystem.isPlayerNearConvenienceStoreDoor();
  }

  isPlayerNearVendingMachine() {
    return this.interactionSystem.isPlayerNearVendingMachine();
  }

  // ---------------------------------------------------------------------------
  // Jjook, Clothing, And Travel Prep Quests
  // ---------------------------------------------------------------------------

  handleJjookInteraction() {
    if (this.sceneControlSystem?.isWorldInputBlocked()) return;
    this.jjookQuestSystem?.handleInteraction();
  }

  startClothesQuestDialogue() {
    this.jjookQuestSystem?.startClothesQuestDialogue();
  }

  startClothesShoppingQuest() {
    this.jjookQuestSystem?.startClothesShoppingQuest();
  }

  declineClothesShoppingQuest() {
    this.jjookQuestSystem?.declineClothesShoppingQuest();
  }

  handleClothingStoreInteraction() {
    if (this.sceneControlSystem?.isWorldInputBlocked()) return;
    this.jjookQuestSystem?.handleClothingStoreInteraction();
  }

  handleConvenienceStoreInteraction() {
    if (this.sceneControlSystem?.isWorldInputBlocked()) return;
    if (this.hasCheckedConvenienceStore) return;

    this.hasCheckedConvenienceStore = true;
    this.saveCheckpoint("convenience_store_checked");
    this.dialogueSystem.start([
      { name: "해냄이", portraitKey: "haenaem_confused", text: "아, 아직 준비 중이구나?" },
    ]);
  }

  // ---------------------------------------------------------------------------
  // Clothing Shop Modal
  // ---------------------------------------------------------------------------

  openClothingShopMenu() {
    this.clothingShopSystem?.open();
  }

  closeClothingShopMenu() {
    this.clothingShopSystem?.close();
  }

  completeClothesShoppingQuest() {
    this.jjookQuestSystem?.completeClothesShoppingQuest();
  }

  // ---------------------------------------------------------------------------
  // Packing Quest And Bus Stop Flow
  // ---------------------------------------------------------------------------

  startPackingOfferDialogue({ repeat = false } = {}) {
    this.jjookQuestSystem?.startPackingOfferDialogue({ repeat });
  }

  declinePackingQuest(isRepeat = false) {
    this.jjookQuestSystem?.declinePackingQuest(isRepeat);
  }

  acceptPackingQuest() {
    this.jjookQuestSystem?.acceptPackingQuest();
  }


  // ---------------------------------------------------------------------------
  // Packing Modal
  // ---------------------------------------------------------------------------

  openPackingMenu() {
    this.packingSystem?.open();
  }

  closePackingMenu() {
    this.packingSystem?.close();
  }

  selectFocusedPackingOption() {
    return this.packingSystem?.selectFocusedOption() ?? false;
  }

  handlePackingMenuKeyboard() {
    this.packingSystem?.handleKeyboard();
  }


  // ---------------------------------------------------------------------------
  // Clothing Shop Focus And Travel Prep HUD
  // ---------------------------------------------------------------------------

  showClothingShopNotEnoughMoney(totalPrice) {
    this.clothingShopSystem?.showNotEnoughMoney(totalPrice);
  }

  refreshClothingShopSelection() {
    this.clothingShopSystem?.refreshSelection();
  }

  moveClothingShopFocus(delta) {
    this.clothingShopSystem?.moveFocus(delta);
  }

  moveClothingShopFocusVertical(deltaRows) {
    this.clothingShopSystem?.moveFocusVertical(deltaRows);
  }

  getClothingShopColumnCount() {
    return this.clothingShopSystem?.getColumnCount() ?? 1;
  }

  getClothingShopOptionButtons() {
    return this.clothingShopSystem?.getOptionButtons() ?? [];
  }

  renderClothingShopSummary() {
    this.clothingShopSystem?.renderSummary();
  }

  selectFocusedClothingShopOption() {
    return this.clothingShopSystem?.selectFocusedOption() ?? false;
  }

  handleClothingShopKeyboard() {
    this.clothingShopSystem?.handleKeyboard();
  }

  finishClothingShopVisit() {
    this.clothingShopSystem?.finishVisit();
  }

  updateTravelPrepHud() {
    this.clothingShopSystem?.updateTravelPrepHud();
  }

  toggleTravelPrepFan() {
    this.clothingShopSystem?.toggleTravelPrepFan();
  }

  renderTravelPrepFan() {
    this.clothingShopSystem?.renderTravelPrepFan();
  }

  // ---------------------------------------------------------------------------
  // Jjook Plogging Support
  // ---------------------------------------------------------------------------

  requestJjookPloggingHelp() {
    this.jjookQuestSystem?.requestPloggingHelp();
  }

  sayByeToJjook() {
    this.jjookQuestSystem?.sayBye();
  }

  // ---------------------------------------------------------------------------
  // Sunisuni, Hospital, And Pharmacy Quest
  // ---------------------------------------------------------------------------

  handleSunisuniInteraction() {
    if (this.sceneControlSystem?.isWorldInputBlocked()) return;
    this.sunisuniQuestSystem?.handleInteraction();
  }

  askSunisuniHospitalHelp() {
    this.sunisuniQuestSystem?.askHospitalHelp();
  }

  deferSunisuniHelp() {
    this.sunisuniQuestSystem?.deferHelp();
  }

  startSunisuniEscort() {
    this.sunisuniQuestSystem?.startEscort();
  }

  handleHospitalInteraction() {
    if (this.sceneControlSystem?.isWorldInputBlocked()) return;
    this.sunisuniQuestSystem?.handleHospitalInteraction();
  }

  retryHospitalReception() {
    this.sunisuniQuestSystem?.retryHospitalReception();
  }

  completeHospitalReception() {
    this.sunisuniQuestSystem?.completeHospitalReception();
  }

  retryDoctorQuiz() {
    this.sunisuniQuestSystem?.retryDoctorQuiz();
  }

  completeDoctorQuiz() {
    this.sunisuniQuestSystem?.completeDoctorQuiz();
  }

  startHospitalRevisitDialogue() {
    this.sunisuniQuestSystem?.startHospitalRevisitDialogue();
  }

  startPretendHospitalVisit(symptomLabel) {
    this.sunisuniQuestSystem?.startPretendHospitalVisit(symptomLabel);
  }

  finishPretendHospitalVisit() {
    this.sunisuniQuestSystem?.finishPretendHospitalVisit();
  }

  closeHospitalRevisit(message) {
    this.sunisuniQuestSystem?.closeHospitalRevisit(message);
  }

  handlePharmacyInteraction() {
    if (this.sceneControlSystem?.isWorldInputBlocked()) return;
    this.sunisuniQuestSystem?.handlePharmacyInteraction();
  }

  payForMedicine() {
    this.sunisuniQuestSystem?.payForMedicine();
  }

  startPharmacyRevisitDialogue() {
    this.sunisuniQuestSystem?.startPharmacyRevisitDialogue();
  }

  startPharmacyHeadacheRoute() {
    this.sunisuniQuestSystem?.startPharmacyHeadacheRoute();
  }

  answerPharmacyHeadache(isStillSick) {
    this.sunisuniQuestSystem?.answerPharmacyHeadache(isStillSick);
  }

  startVitalDrinkRoute() {
    this.sunisuniQuestSystem?.startVitalDrinkRoute();
  }

  choosePharmacyDrinkChoice(drinkLabel, isWater) {
    this.sunisuniQuestSystem?.choosePharmacyDrinkChoice(drinkLabel, isWater);
  }

  closePharmacyRevisit(message) {
    this.sunisuniQuestSystem?.closePharmacyRevisit(message);
  }

  completeSunisuniQuest() {
    this.sunisuniQuestSystem?.completeQuest();
  }

  // ---------------------------------------------------------------------------
  // Yebi Dialogue And First Guide
  // ---------------------------------------------------------------------------

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
    if (this.tutorialState === "npc") {
      this.tutorialSystem?.complete();
    }
    this.yebiQuestSystem?.showQuestDialogue();
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
    this.dialogueSystem.start(dialogue, () => {
      this.yebiQuestSystem?.markCanQuestAvailable();
      if (this.tutorialState && this.tutorialState !== "completed") {
        this.tutorialSystem?.start?.();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Movement And NPC Follow Systems
  // ---------------------------------------------------------------------------

  handleMovement() {
    this.playerController.update();
  }

  getPlayerSpeed() {
    return this.playerController.getPlayerSpeed();
  }

  isSunisuniFollowing() {
    return this.sunisuniQuestSystem?.isFollowing() ?? false;
  }

  updateSunisuniFollower() {
    this.sunisuniQuestSystem?.updateFollower();
  }

  updateSunisuniDirection(moveX, moveY) {
    this.sunisuniQuestSystem?.updateDirection(moveX, moveY);
  }

  updateJjookFollower() {
    this.jjookQuestSystem?.updateFollower();
  }

  updateJjookAutoPlogging() {
    this.jjookQuestSystem?.updateAutoPlogging();
  }

  findNearestTrashTo(source, radius) {
    return this.jjookQuestSystem?.findNearestTrashTo(source, radius) ?? null;
  }

  // ---------------------------------------------------------------------------
  // NPC Routing And Roaming
  // ---------------------------------------------------------------------------

  buildNpcRouteThroughCrosswalk(start, target) {
    const crossesRoad = (start.y > 300 && target.y < 260) || (start.y < 260 && target.y > 300);
    const toOrthogonalRoute = (points) => points.reduce((route, point) => {
      const previous = route[route.length - 1] || start;
      if (Math.abs(previous.x - point.x) > 6 && Math.abs(previous.y - point.y) > 6) {
        route.push({ x: point.x, y: previous.y });
      }
      route.push(point);
      return route;
    }, []);

    if (!crossesRoad) {
      return toOrthogonalRoute([target]);
    }

    const crosswalks = [472, 1144];
    const preferredX = crosswalks.reduce((best, x) => {
      return Math.abs(x - target.x) < Math.abs(best - target.x) ? x : best;
    }, crosswalks[0]);
    return toOrthogonalRoute([
      { x: preferredX, y: start.y },
      { x: preferredX, y: target.y },
      target,
    ]);
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

  updateNpcRoaming(force = false) {
    Object.keys(NPC_ROAM_CONFIG).forEach((key) => {
      if (this.canNpcRoam(key)) {
        this.ensureNpcRoaming(key, force);
      } else {
        this.pauseNpcRoaming(key);
      }
    });
  }

  clearNpcRoaming() {
    Object.values(this.npcRoamState || {}).forEach((state) => {
      state?.timer?.remove(false);
      state.timer = null;
    });
  }

  canNpcRoam(key) {
    const config = NPC_ROAM_CONFIG[key];
    const sprite = config ? this[config.spriteProp] : null;
    if (!config || !sprite?.active || !sprite.visible) return false;
    if (this.stateManager && !this.stateManager.isPlaying()) return false;
    if (this.isMissionComplete || this.isInDialogue || this.vendingMenuGroup || this.clothingShopModal || this.packingModal || this.interiorSceneGroup) {
      return false;
    }

    if (key === "yebi") {
      const canState = this.yebiQuestSystem?.getQuestState?.() || "inactive";
      const recycleState = this.yebiQuestSystem?.getRecycleQuestState?.() || "locked";
      return canState !== "active" && recycleState !== "unlocked" && recycleState !== "active";
    }

    if (key === "jjook") {
      if (this.jjookReturningHome || this.isJjookFollowActive || this.isJjookClothesEscortActive) return false;
      if ([JjookQuestState.WALLET_MISSING, JjookQuestState.WALLET_FOUND, JjookQuestState.CHOOSING_DRINK].includes(this.jjookQuestState)) return false;
      if ([ClothesQuestState.READY, ClothesQuestState.DECLINED, ClothesQuestState.SHOPPING].includes(this.clothesQuestState)) return false;
      if ([PackingQuestState.GOING_BUS_STOP, PackingQuestState.BOARDING_BUS].includes(this.packingQuestState)) return false;
      return this.jjookQuestState === JjookQuestState.COMPLETED;
    }

    if (key === "sunisuni") {
      if (this.sunisuniReturningToBench || this.isSunisuniFollowing?.()) return false;
      return this.sunisuniQuestState === SunisuniQuestState.QUEST_COMPLETE;
    }

    return false;
  }

  ensureNpcRoaming(key, force = false) {
    const state = this.getNpcRoamState(key);
    if (force) {
      this.pauseNpcRoaming(key);
    }
    if (state.isWalking || state.timer) return;

    this.scheduleNpcRoamStep(key, Phaser.Math.Between(900, 2400));
  }

  getNpcRoamState(key) {
    if (!this.npcRoamState[key]) {
      this.npcRoamState[key] = {
        isWalking: false,
        timer: null,
        lastTarget: null,
      };
    }
    return this.npcRoamState[key];
  }

  pauseNpcRoaming(key) {
    const state = this.npcRoamState?.[key];
    if (!state) return;

    state.timer?.remove(false);
    state.timer = null;
    if (state.isWalking) {
      const config = NPC_ROAM_CONFIG[key];
      const sprite = config ? this[config.spriteProp] : null;
      if (sprite?.active) {
        this.tweens.killTweensOf(sprite);
        this.stopNpcWalk(sprite, config.npcKey);
      }
    }
    state.isWalking = false;
  }

  scheduleNpcRoamStep(key, delayMs = 0) {
    if (!this.canNpcRoam(key)) return;

    const state = this.getNpcRoamState(key);
    state.timer?.remove(false);
    state.timer = this.time.delayedCall(delayMs, () => {
      state.timer = null;
      this.startNpcRoamStep(key);
    });
  }

  startNpcRoamStep(key) {
    if (!this.canNpcRoam(key)) return;

    const config = NPC_ROAM_CONFIG[key];
    const sprite = this[config.spriteProp];
    const target = this.pickNpcRoamTarget(key);
    if (!sprite?.active || !target) {
      this.scheduleNpcRoamStep(key, Phaser.Math.Between(...config.waitRangeMs));
      return;
    }

    const distance = Phaser.Math.Distance.Between(sprite.x, sprite.y, target.x, target.y);
    if (distance < 12) {
      this.maybeShowNpcAmbientLine(key);
      this.scheduleNpcRoamStep(key, Phaser.Math.Between(...config.waitRangeMs));
      return;
    }

    this.walkNpcRoamToTarget(key, target);
  }

  walkNpcRoamToTarget(key, target) {
    const config = NPC_ROAM_CONFIG[key];
    const sprite = this[config.spriteProp];
    const state = this.getNpcRoamState(key);
    if (!sprite?.active || !target) return;

    if (sprite === this.jjookNpc) {
      this.jjookIdleTween?.stop();
      this.jjookIdleTween = null;
    }
    this.tweens.killTweensOf(sprite);
    state.isWalking = true;

    let previousX = sprite.x;
    let previousY = sprite.y;
    const distance = Phaser.Math.Distance.Between(sprite.x, sprite.y, target.x, target.y);
    this.tweens.add({
      targets: sprite,
      x: target.x,
      y: target.y,
      duration: Phaser.Math.Clamp((distance / config.speed) * 1000, 320, 5200),
      ease: "Linear",
      onUpdate: () => {
        const dx = sprite.x - previousX;
        const dy = sprite.y - previousY;
        if (Math.abs(dx) + Math.abs(dy) > 0.1) {
          const directionKey = this.getDirectionKeyFromVector(dx, dy, sprite.getData("directionKey") || "down");
          this.setNpcDirectionTexture(sprite, config.npcKey, directionKey, true);
        }
        previousX = sprite.x;
        previousY = sprite.y;
      },
      onComplete: () => {
        state.isWalking = false;
        state.lastTarget = target;
        this.stopNpcWalk(sprite, config.npcKey);
        if (this.canNpcRoam(key)) {
          this.maybeShowNpcAmbientLine(key);
          this.scheduleNpcRoamStep(key, Phaser.Math.Between(...config.waitRangeMs));
        }
      },
    });
  }

  pickNpcRoamTarget(key) {
    const config = NPC_ROAM_CONFIG[key];
    const sprite = this[config.spriteProp];
    const points = this.getNpcRoamPoints(key);
    if (!sprite?.active || !points.length) return null;

    const usablePoints = points.filter((point) => {
      const distance = Phaser.Math.Distance.Between(sprite.x, sprite.y, point.x, point.y);
      return distance > 34 && !this.isNpcRoamPointBlocked(key, point.x, point.y);
    });
    if (!usablePoints.length) return null;
    return Phaser.Utils.Array.GetRandom(usablePoints);
  }

  getNpcRoamPoints(key) {
    const config = NPC_ROAM_CONFIG[key];
    const sprite = config ? this[config.spriteProp] : null;
    const laneY = sprite?.y || this.playerStart.y;
    const horizontalPatrol = (centerX, radius = 92) => this.clampNpcRoamPoints([
      { x: centerX - radius, y: laneY },
      { x: centerX, y: laneY },
      { x: centerX + radius, y: laneY },
    ]);

    if (key === "yebi") {
      const canState = this.yebiQuestSystem?.getQuestState?.() || "inactive";
      const recycleState = this.yebiQuestSystem?.getRecycleQuestState?.() || "locked";
      if (canState === "completed" || recycleState === "completed") {
        const anchor = this.getYebiRecyclePosition();
        return horizontalPatrol(anchor.x, 112);
      }

      return horizontalPatrol(this.playerStart.x + 154, 96);
    }

    if (key === "jjook") {
      const jjookStart = this.getMapPoint("jjook_start", GAME_CONFIG.jjookSpawn);
      return horizontalPatrol(jjookStart.x + 66, 108);
    }

    if (key === "sunisuni") {
      const home = this.getMapPoint("sunisuni_start", GAME_CONFIG.sunisuniSpawn);
      return horizontalPatrol(home.x, 88);
    }

    return [];
  }

  clampNpcRoamPoints(points) {
    const bounds = this.physics?.world?.bounds;
    const worldWidth = bounds?.width || GAME_CONFIG.worldWidth;
    const worldHeight = bounds?.height || GAME_CONFIG.worldHeight;
    return points.map((point) => ({
      x: Phaser.Math.Clamp(point.x, 82, worldWidth - 82),
      y: Phaser.Math.Clamp(point.y, 110, worldHeight - 70),
    }));
  }

  isNpcRoamPointBlocked(key, x, y) {
    if ((this.objectCollisionRects || []).some((rect) => Phaser.Geom.Rectangle.Contains(rect, x, y))) {
      return true;
    }

    return this.getActiveNpcEntries().some((entry) => {
      if (entry.key === key) return false;
      return Phaser.Math.Distance.Between(x, y, entry.sprite.x, entry.sprite.y) < GAME_CONFIG.npcPersonalSpace + 14;
    });
  }

  maybeShowNpcAmbientLine(key) {
    const config = NPC_ROAM_CONFIG[key];
    const sprite = config ? this[config.spriteProp] : null;
    if (!config || !sprite?.active || !this.canNpcRoam(key)) return;
    if (!this.npcMemorySystem?.canShowAmbientMemory?.()) return;
    if (Phaser.Math.Between(0, 99) >= config.messageChance) return;
    if (this.time.now < this.nextNpcAmbientBubbleAt) return;

    const message = this.npcMemorySystem?.getMemorySpeech(key) || Phaser.Utils.Array.GetRandom(config.messages);
    this.showSpeechBubble(sprite, message, 4200);
    this.nextNpcAmbientBubbleAt = this.time.now + Phaser.Math.Between(3400, 6200);
  }

  separateNpcSprites() {
    const npcs = this.getActiveNpcEntries();
    if (npcs.length < 2) return;

    const minDistance = GAME_CONFIG.npcPersonalSpace;
    for (let i = 0; i < npcs.length - 1; i += 1) {
      for (let j = i + 1; j < npcs.length; j += 1) {
        const first = npcs[i];
        const second = npcs[j];
        const dx = second.sprite.x - first.sprite.x;
        const dy = second.sprite.y - first.sprite.y;
        const distance = Math.max(Phaser.Math.Distance.Between(first.sprite.x, first.sprite.y, second.sprite.x, second.sprite.y), 0.01);
        if (distance >= minDistance) continue;

        const firstMovable = this.isNpcSeparationMovable(first.key);
        const secondMovable = this.isNpcSeparationMovable(second.key);
        if (!firstMovable && !secondMovable) continue;

        const push = (minDistance - distance) + 1;
        const nx = dx / distance;
        const ny = dy / distance;
        if (firstMovable && secondMovable) {
          this.tryMoveNpcBy(first.sprite, -nx * push * 0.5, -ny * push * 0.5);
          this.tryMoveNpcBy(second.sprite, nx * push * 0.5, ny * push * 0.5);
        } else if (firstMovable) {
          this.tryMoveNpcBy(first.sprite, -nx * push, -ny * push);
        } else {
          this.tryMoveNpcBy(second.sprite, nx * push, ny * push);
        }
      }
    }
  }

  getActiveNpcEntries() {
    return [
      { key: "yebi", sprite: this.yebiNpc },
      { key: "jjook", sprite: this.jjookNpc },
      { key: "sunisuni", sprite: this.sunisuniNpc },
    ].filter(({ sprite }) => sprite?.active && sprite.visible);
  }

  isNpcSeparationMovable(key) {
    if (key === "yebi") return this.canNpcRoam("yebi");
    if (key === "jjook") {
      return this.canNpcRoam("jjook")
        || this.isJjookFollowActive
        || this.isJjookClothesEscortActive
        || this.isJjookBusEscortActive
        || this.jjookReturningHome;
    }
    if (key === "sunisuni") {
      return this.canNpcRoam("sunisuni")
        || this.isSunisuniFollowing?.()
        || this.sunisuniReturningToBench;
    }
    return false;
  }

  tryMoveNpcBy(sprite, dx, dy) {
    if (!sprite?.active) return false;

    const bounds = this.physics?.world?.bounds;
    const worldWidth = bounds?.width || GAME_CONFIG.worldWidth;
    const worldHeight = bounds?.height || GAME_CONFIG.worldHeight;
    const nextX = Phaser.Math.Clamp(sprite.x + dx, 82, worldWidth - 82);
    const nextY = Phaser.Math.Clamp(sprite.y + dy, 110, worldHeight - 70);
    if ((this.objectCollisionRects || []).some((rect) => Phaser.Geom.Rectangle.Contains(rect, nextX, nextY))) {
      return false;
    }
    sprite.setPosition(nextX, nextY);
    return true;
  }

  stopJjookIdleTween() {
    this.jjookQuestSystem?.stopIdleTween();
  }

  walkJjookBackToHome() {
    this.jjookQuestSystem?.walkBackToHome();
  }

  updatePlayerDirection(velocity) {
    this.playerController.updatePlayerDirection(velocity);
  }

  setPlayerDirectionTexture(directionKey) {
    this.playerController.setPlayerDirectionTexture(directionKey);
  }

  // ---------------------------------------------------------------------------
  // Mobile Joystick Input
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Recycling Deposit
  // ---------------------------------------------------------------------------

  tryDepositNearestRecycleBin() {
    return this.yebiQuestSystem?.tryDepositNearestRecycleBin() ?? false;
  }

  depositRecycleItem(type, binSprite) {
    this.yebiQuestSystem?.depositRecycleItem(type, binSprite);
  }

  // ---------------------------------------------------------------------------
  // Vending Machine Menu
  // ---------------------------------------------------------------------------

  openVendingMenu({ completeQuestOnSelect = false } = {}) {
    this.vendingMachineSystem?.open({ completeQuestOnSelect });
  }

  closeVendingMenu() {
    this.vendingMachineSystem?.close();
  }

  handleVendingMenuKeyboard() {
    this.vendingMachineSystem?.handleKeyboard();
  }

  selectHighlightedVendingOption() {
    this.vendingMachineSystem?.selectHighlightedOption();
  }

  finishJjookQuestWithoutDrink() {
    this.jjookQuestSystem?.finishQuestWithoutDrink();
  }

  finishJjookQuest() {
    this.jjookQuestSystem?.finishQuest();
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
    this.jjookQuestSystem?.activateFollower({ buyColaOnComplete });
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
    this.jjookQuestSystem?.buyThanksCola();
  }

  // ---------------------------------------------------------------------------
  // Recycling Feedback Helpers
  // ---------------------------------------------------------------------------

  showRecycleDepositEffect(target, type, count = 1) {
    this.yebiQuestSystem?.showDepositEffect(target, type, count);
  }

  getRecycleTypeLabel(type) {
    return this.yebiQuestSystem?.getTypeLabel(type) || "쓰레기";
  }

  // ---------------------------------------------------------------------------
  // Cleaning And Slime System Facades
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Rewards And Mission Completion
  // ---------------------------------------------------------------------------

  activateRecycleMasterReward() {
    this.yebiQuestSystem?.activateRecycleMasterReward();
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

  // ---------------------------------------------------------------------------
  // UI, Dialogue, And Interior Helpers
  // ---------------------------------------------------------------------------

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
    if (!this.textures.exists(textureKey)) {
      const asset = EXTERNAL_ASSETS.find((a) => a.key === textureKey);
      if (asset) {
        this.load.image(textureKey, asset.path);
        this.load.once(Phaser.Loader.Events.COMPLETE, () => {
          this.interiorSceneSystem?.show(textureKey, type);
        });
        this.load.start();
        return;
      }
    }
    this.interiorSceneSystem?.show(textureKey, type);
  }

  fitInteriorBackground(image, targetWidth, targetHeight) {
    this.interiorSceneSystem?.fitBackground(image, targetWidth, targetHeight);
  }

  clearInteriorScene() {
    this.interiorSceneSystem?.clear();
    if (this.player) {
      this.player.setVelocity(0, 0);
      this.playerController?.stopWalkAnimation?.();
      this.playerController?.cancelMoveTarget?.();
    }
    this.stopSceneMusic({ resumeChapter: true });
  }

  handleDialogueLineChange(line) {
    this.portraitManager?.show(line);
  }

  handleDialogueClose() {
    this.portraitManager?.clear();
  }

  showFloatingItem(textureKey, x, y, size = 64, fixedToCamera = false, options = {}) {
    this.interiorSceneSystem?.showFloatingItem(textureKey, x, y, size, fixedToCamera, options);
  }

  playVendingPaymentAnimationLike(textureKey, onComplete) {
    this.interiorSceneSystem?.playPaymentAnimation(textureKey, onComplete);
  }

  playSunisuniEffect(animKey, x, y) {
    this.sunisuniQuestSystem?.playEffect(animKey, x, y);
  }

  // ---------------------------------------------------------------------------
  // Consumable And Special Item Effects
  // ---------------------------------------------------------------------------

  updateBacchusButton() {
    this.consumableSystem?.updateBacchusButton();
  }

  useBacchusItem() {
    this.consumableSystem?.useBacchusItem();
  }

  sendSunisuniBackToBench() {
    this.sunisuniQuestSystem?.sendBackToBench();
  }

  useYebiItem() {
    this.yebiQuestSystem?.useItem();
  }

  showYebiCleanCutscene() {
    this.yebiQuestSystem?.showCleanCutscene();
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
    this.yebiQuestSystem?.showCenterMessage(caption, {
      panelWidth,
      holdMs,
      sparkleCount,
      flashColor,
      strokeColor,
      faceOnly,
    });
  }

  autoCleanTrash(trash, options = {}) {
    this.cleaningSystem.autoCleanTrash(trash, options);
  }

  // ---------------------------------------------------------------------------
  // Scene Controls And Fullscreen
  // ---------------------------------------------------------------------------

  restartGame() {
    this.sceneControlSystem?.restartGame();
  }

  toggleFullscreen(event) {
    this.sceneControlSystem?.toggleFullscreen(event);
  }

  handleFullscreenChange() {
    this.sceneControlSystem?.handleFullscreenChange();
  }

  toggleAppFitMode() {
    this.sceneControlSystem?.toggleAppFitMode();
  }

  lockLandscapeOrientation() {
    this.sceneControlSystem?.lockLandscapeOrientation();
  }

  unlockScreenOrientation() {
    this.sceneControlSystem?.unlockScreenOrientation();
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

  // ---------------------------------------------------------------------------
  // Audio And Music
  // ---------------------------------------------------------------------------

  getAudioContext() {
    return this.audioManager?.getAudioContext() ?? null;
  }

  isSoundEnabled() {
    return this.audioManager?.isSoundEnabled() ?? false;
  }

  unlockAudio() {
    this.audioManager?.unlockAudio();
  }

  loadThanksAudioBuffer() {
    this.audioManager?.loadThanksAudioBuffer();
  }

  loadAudioBuffer(path, assign) {
    return this.audioManager?.loadAudioBuffer(path, assign) ?? Promise.reject(new Error("AudioManager unavailable"));
  }

  playAudioBuffer(buffer) {
    return this.audioManager?.playAudioBuffer(buffer) ?? false;
  }

  playTone({ frequency, duration, type = "sine", volume = 0.08, delay = 0 }) {
    this.audioManager?.playTone({ frequency, duration, type, volume, delay });
  }

  playSweepSound() {
    this.audioManager?.playSweepSound();
  }

  playCleanSound() {
    this.audioManager?.playCleanSound();
  }

  playCanCleanSound() {
    this.audioManager?.playCanCleanSound();
  }

  playItemPickupSound() {
    this.audioManager?.playItemPickupSound();
  }

  playMoneyRewardSound() {
    this.audioManager?.playMoneyRewardSound();
  }

  playSpecialUseSound() {
    this.audioManager?.playSpecialUseSound();
  }

  playMissionCompleteSound() {
    this.audioManager?.playMissionCompleteSound();
  }

  playThanksVoice() {
    this.audioManager?.playThanksVoice();
  }

  playCollectCansVoice() {
    this.audioManager?.playCollectCansVoice();
  }

  playHelpVoice() {
    this.audioManager?.playHelpVoice();
  }

  playClearSlimeVoice() {
    this.audioManager?.playClearSlimeVoice();
  }

  startChapterMusic() {
    this.audioManager?.startChapterMusic();
  }

  playSceneMusic(key, volume = 0.26) {
    this.audioManager?.playSceneMusic(key, volume);
  }

  stopSceneMusic({ resumeChapter = false } = {}) {
    this.audioManager?.stopSceneMusic({ resumeChapter });
  }

  playNextChapterTrack() {
    this.audioManager?.playNextChapterTrack();
  }

  fetchFirstExistingTrack(paths) {
    return this.audioManager?.fetchFirstExistingTrack(paths) ?? Promise.resolve(null);
  }

  stopChapterMusic() {
    this.audioManager?.stopChapterMusic();
  }

  stopAudioForPageExit() {
    this.audioManager?.stopAudioForPageExit();
  }

  cleanupBgmObjectUrl() {
    this.audioManager?.cleanupBgmObjectUrl();
  }

  // ---------------------------------------------------------------------------
  // HUD Updates
  // ---------------------------------------------------------------------------

  updateHud() {
    this.uiManager.updateHud();
  }

  // --- 3️⃣ & 7️⃣ & 8️⃣ 주민 기억 시스템 & 서울 기대감 NPC 랜덤 대사 격발기 ---
  triggerRandomNpcBubble() {
    if (!this.npcMemorySystem?.canShowAmbientMemory?.()) return;

    const npcs = [];
    if (this.yebiNpc && this.yebiNpc.active) npcs.push({ key: "yebi", sprite: this.yebiNpc });
    if (this.jjookNpc && this.jjookNpc.active) npcs.push({ key: "jjook", sprite: this.jjookNpc });
    if (this.sunisuniNpc && this.sunisuniNpc.active) npcs.push({ key: "sunisuni", sprite: this.sunisuniNpc });

    if (npcs.length === 0) return;

    const npc = Phaser.Utils.Array.GetRandom(npcs);
    const config = NPC_ROAM_CONFIG[npc.key];
    const fallbackSpeech = config?.messages?.length ? Phaser.Utils.Array.GetRandom(config.messages) : "오늘 하루도 씩씩하게 보내자!";
    const speech = this.npcMemorySystem.getMemorySpeech(npc.key) || fallbackSpeech;

    this.uiManager.showSpeechBubble(npc.sprite, speech, 4600);
  }

}
