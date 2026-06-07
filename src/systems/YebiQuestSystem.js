import { GAME_CONFIG, RECYCLE_BIN_CONFIG } from "../config/GameConstants.js";
import { CanQuestState, RecycleQuestState } from "../config/QuestStates.js";
import { SceneState } from "../config/SceneState.js";

const RECYCLE_INTRO_TRIGGER_DISTANCE = 132;
const RECYCLE_INTRO_TALK_OFFSET_X = 58;
const RECYCLE_INTRO_TALK_OFFSET_Y = 12;

export default class YebiQuestSystem {
  constructor(scene) {
    this.scene = scene;
    this.hasTriggeredRecycleIntro = false;
    this.isRecycleIntroApproachActive = false;

    this.canQuest = {
      id: "collect_cans",
      name: "캔 모으기",
      type: "collect_cans",
      target: 20,
      current: 0,
      reward: 0,
      isActive: false,
      isCompleted: false,
    };
    this.recycleQuest = {
      id: "recycle_master",
      name: "분리수거 전문가",
      type: "recycle",
      target: { normal: 30, can: 10, plastic: 10 },
      current: { normal: 0, can: 0, plastic: 0 },
      reward: 0,
      isUnlocked: false,
      isActive: false,
      isCompleted: false,
    };
    this.uiElements = {
      root: document.querySelector("#canQuestHud"),
      label: document.querySelector("#canQuestLabel"),
      bar: document.querySelector("#canQuestBar"),
    };
    this.renderGauge(20);
    this.updateUI();
  }

  createRecyclingCenter() {
    const scene = this.scene;
    const center = scene.getMapPoint("recycling_center", GAME_CONFIG.recyclingCenter);
    const vendingPoint = scene.getMapPoint("vending_machine", GAME_CONFIG.vendingMachine);
    scene.recycleBins = [];

    const existingVendingMachine = scene.mapObjects?.vending_machine;
    const vendingMachine = existingVendingMachine || scene.add.image(
      vendingPoint.x,
      vendingPoint.y,
      "vending_machine_full",
    );
    vendingMachine.setDisplaySize(96, 118);
    vendingMachine.setData("depthSortY", scene.getDepthSortY(vendingMachine));
    vendingMachine.setDepth(scene.getWorldDepth(vendingMachine.getData("depthSortY")));
    vendingMachine.setInteractive({ useHandCursor: true });
    vendingMachine.on("pointerover", () => {
      vendingMachine.setTint(0xffeb3b);
    });
    vendingMachine.on("pointerout", () => {
      vendingMachine.clearTint();
    });
    vendingMachine.on("pointerdown", (pointer) => {
      const button = pointer.event?.button ?? pointer.button;
      if (button !== 0) return;
      if (scene.sceneControlSystem?.isWorldInputBlocked()) return;
      if (!scene.player?.active || !scene.stateManager?.canMove()) return;
      if (scene.isMissionComplete || scene.isInDialogue || scene.vendingMenuGroup || scene.clothingShopModal || scene.packingModal || scene.interiorSceneGroup) return;

      pointer.event?.preventDefault();
      pointer.event?.stopPropagation();

      // 1. 이미 근처라면 즉시 상호작용 실행!
      if (scene.interactionSystem?.isPlayerNearVendingMachine()) {
        scene.handleVendingMachineInteraction();
        return;
      }

      // 2. 멀리 있다면 A* 자동 주행 시동!
      const usePoint = scene.getMapPoint("vending_use", {
        x: vendingMachine.x,
        y: vendingMachine.y + 6,
      });

      if (scene.pathfindingSystem) {
        const path = scene.pathfindingSystem.findPath(scene.player.x, scene.player.y, usePoint.x, usePoint.y);
        if (path && path.length > 0) {
          scene.playerController.movePath = path;
          scene.playerController.currentPathIndex = 0;
          scene.playerController.cleanTarget = null;
          scene.playerController.interactionTarget = "vending";
          scene.mouseMoveTarget = null;
        }
      }
    });
    scene.vendingMachine = vendingMachine;
    if (!existingVendingMachine) {
      scene.addObjectCollider(
        "vending_machine_collider",
        vendingMachine.x,
        vendingMachine.y + 20,
        76,
        48,
      );
    }

    RECYCLE_BIN_CONFIG.forEach((binConfig) => {
      const binPoint = scene.getMapPoint(`recycle_bin_${binConfig.type}`, {
        x: center.x + binConfig.xOffset,
        y: center.y + binConfig.yOffset + 76,
      });
      const objectKey = `recycle_bin_${binConfig.type}`;
      const existingBin = scene.mapObjects?.[objectKey];
      const x = existingBin?.x ?? binPoint.x;
      const y = existingBin?.y ?? binPoint.y;
      const zoneWidth = 148;
      const zoneHeight = 150;
      const zoneCenterY = y + 10;
      const spotlight = scene.add.ellipse(
        x,
        zoneCenterY,
        112,
        78,
        0xfff3a3,
        0.22,
      );
      spotlight.setStrokeStyle(4, 0xffd75a, 0.62);
      spotlight.setDepth(scene.getWorldDepth(zoneCenterY, -0.22));
      spotlight.setData("depthSortY", zoneCenterY);
      scene.tweens.add({
        targets: spotlight,
        alpha: { from: 0.2, to: 0.34 },
        scaleX: { from: 0.96, to: 1.04 },
        scaleY: { from: 0.96, to: 1.04 },
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      const bin = existingBin || scene.add.image(x, y, binConfig.texture);
      bin.setDisplaySize(68, 78);
      bin.setData("depthSortY", scene.getDepthSortY(bin));
      bin.setDepth(scene.getWorldDepth(bin.getData("depthSortY")));
      
      bin.setInteractive({ useHandCursor: true });
      bin.on("pointerover", () => {
        bin.setTint(0xffeb3b);
      });
      bin.on("pointerout", () => {
        bin.clearTint();
      });
      bin.on("pointerdown", (pointer) => {
        const button = pointer.event?.button ?? pointer.button;
        if (button !== 0) return;
        if (scene.sceneControlSystem?.isWorldInputBlocked()) return;
        if (!scene.player?.active || !scene.stateManager?.canMove()) return;
        if (scene.isMissionComplete || scene.isInDialogue || scene.vendingMenuGroup || scene.clothingShopModal || scene.packingModal || scene.interiorSceneGroup) return;

        pointer.event?.preventDefault();
        pointer.event?.stopPropagation();

        // 1. 이미 분리수거 구역 내에 있다면 즉시 투입!
        const playerPoints = [
          { x: scene.player.x, y: scene.player.y },
          { x: scene.player.x, y: scene.player.y + GAME_CONFIG.playerDisplayHeight * 0.22 },
          { x: scene.player.x, y: scene.player.y - GAME_CONFIG.playerDisplayHeight * 0.16 },
        ];
        const bounds = zone.getBounds();
        const isPlayerInside = playerPoints.some((point) => Phaser.Geom.Rectangle.Contains(bounds, point.x, point.y));

        if (isPlayerInside) {
          this.depositRecycleItem(binConfig.type, bin);
          return;
        }

        // 2. 멀리 있다면 A* 자동 주행 시동!
        if (scene.pathfindingSystem) {
          const path = scene.pathfindingSystem.findPath(scene.player.x, scene.player.y, x, y + 22);
          if (path && path.length > 0) {
            scene.playerController.movePath = path;
            scene.playerController.currentPathIndex = 0;
            scene.playerController.cleanTarget = null;
            scene.playerController.interactionTarget = `bin_${binConfig.type}`;
            scene.mouseMoveTarget = null;
          }
        }
      });

      const label = scene.add.text(x, y + 54, binConfig.label, {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#21352c",
        fontStyle: "bold",
        backgroundColor: "rgba(255,255,255,0.78)",
        padding: { left: 5, right: 5, top: 2, bottom: 2 },
      });
      label.setOrigin(0.5);
      label.setDepth(bin.depth + 0.04);

      const zone = scene.add.zone(
        x,
        zoneCenterY,
        zoneWidth,
        zoneHeight,
      );
      scene.physics.add.existing(zone, true);
      zone.setData("recycleType", binConfig.type);
      scene.recycleBins.push({ ...binConfig, x, y, bin, label, zone, spotlight });
      if (!existingBin) {
        scene.addObjectCollider(`${binConfig.type}_recycle_bin_collider`, x, y + 28, 46, 32);
      }
    });
  }

  checkRecycleQuestUnlock() {
    const scene = this.scene;
    if (!scene.moneySystem || scene.hasAnnouncedRecycleQuest) return;
    if (scene.moneySystem.money < GAME_CONFIG.recycleQuestUnlockMoney) return;

    scene.hasAnnouncedRecycleQuest = true;
    const didUnlock = this.unlockRecycleQuest();
    if (!didUnlock) return;

    this.moveYebiToRecyclingCenter();
    scene.setQuestMarker("recycleQuest", scene.yebiNpc, "!");
    scene.showQuestToast("여비 아저씨가 분리수거장에서 기다리고 있어!", 10000);
    scene.showSpeechBubble(scene.yebiNpc, "분리수거장으로 와!", 10000);
    scene.saveCheckpoint("recycle_unlocked");
  }

  update() {
    this.checkRecycleIntroArrival();
  }

  checkRecycleIntroArrival() {
    const scene = this.scene;
    if (this.hasTriggeredRecycleIntro || this.isRecycleIntroApproachActive) return;
    if (!scene.player?.active || !scene.yebiNpc?.active) return;
    if (scene.sceneControlSystem?.isWorldInputBlocked?.()) return;
    if (this.getRecycleQuestState?.() !== RecycleQuestState.UNLOCKED) return;

    const center = scene.getMapPoint("recycling_center", GAME_CONFIG.recyclingCenter);
    const distance = Phaser.Math.Distance.Between(scene.player.x, scene.player.y, center.x, center.y);
    if (distance > RECYCLE_INTRO_TRIGGER_DISTANCE) return;

    this.hasTriggeredRecycleIntro = true;
    this.approachPlayerForRecycleIntro();
  }

  approachPlayerForRecycleIntro() {
    const scene = this.scene;
    if (!scene.yebiNpc?.active || !scene.player?.active) {
      this.showQuestDialogue();
      return;
    }

    this.isRecycleIntroApproachActive = true;
    scene.pauseNpcRoaming("yebi");
    scene.tweens.killTweensOf(scene.yebiNpc);
    scene.player.setVelocity?.(0, 0);
    scene.playerController?.stopWalkAnimation?.();
    scene.stateManager?.set(SceneState.CUTSCENE);

    const target = this.getRecycleIntroTalkPosition();
    const startX = scene.yebiNpc.x;
    const startY = scene.yebiNpc.y;

    const walkingSpeed = GAME_CONFIG.playerSpeed * 0.82;

    // Helper to start the second axis (Y-axis) motion
    const startYMotion = () => {
      const distY = Math.abs(target.y - scene.yebiNpc.y);
      if (distY > 8) {
        let previousY = scene.yebiNpc.y;
        scene.tweens.add({
          targets: scene.yebiNpc,
          y: target.y,
          duration: Math.max(280, (distY / walkingSpeed) * 1000),
          ease: "Linear",
          onUpdate: () => {
            const currentDy = scene.yebiNpc.y - previousY;
            if (Math.abs(currentDy) > 0.1) {
              const directionKey = currentDy < 0 ? "up" : "down";
              scene.setNpcDirectionTexture(scene.yebiNpc, "yeobi", directionKey, true);
            }
            previousY = scene.yebiNpc.y;
          },
          onComplete: () => {
            this.finishRecycleIntroApproach();
          }
        });
      } else {
        this.finishRecycleIntroApproach();
      }
    };

    // 1. First move along the X-axis (Orthogonal horizontal step)
    const distX = Math.abs(target.x - startX);
    if (distX > 8) {
      let previousX = scene.yebiNpc.x;
      scene.tweens.add({
        targets: scene.yebiNpc,
        x: target.x,
        duration: Math.max(280, (distX / walkingSpeed) * 1000),
        ease: "Linear",
        onUpdate: () => {
          const currentDx = scene.yebiNpc.x - previousX;
          if (Math.abs(currentDx) > 0.1) {
            const directionKey = currentDx < 0 ? "left" : "right";
            scene.setNpcDirectionTexture(scene.yebiNpc, "yeobi", directionKey, true);
          }
          previousX = scene.yebiNpc.x;
        },
        onComplete: () => {
          startYMotion();
        }
      });
    } else {
      startYMotion();
    }
  }

  getRecycleIntroTalkPosition() {
    const scene = this.scene;
    const offsetX = scene.yebiNpc.x <= scene.player.x
      ? -RECYCLE_INTRO_TALK_OFFSET_X
      : RECYCLE_INTRO_TALK_OFFSET_X;

    return {
      x: Phaser.Math.Clamp(scene.player.x + offsetX, 32, GAME_CONFIG.worldWidth - 32),
      y: Phaser.Math.Clamp(scene.player.y + RECYCLE_INTRO_TALK_OFFSET_Y, 32, GAME_CONFIG.worldHeight - 32),
    };
  }

  finishRecycleIntroApproach() {
    const scene = this.scene;
    this.isRecycleIntroApproachActive = false;
    if (scene.yebiNpc && scene.player) {
      const directionKey = scene.getDirectionKeyFromVector(
        scene.player.x - scene.yebiNpc.x,
        scene.player.y - scene.yebiNpc.y,
        scene.yebiNpc.getData("directionKey") || "down",
      );
      scene.setNpcDirectionTexture(scene.yebiNpc, "yeobi", directionKey, false);
    }
    scene.stateManager?.set(SceneState.PLAYING);
    this.showQuestDialogue();
  }

  markCanQuestAvailable() {
    const scene = this.scene;
    if (!scene.yebiNpc) return;
    if (scene.tutorialState && scene.tutorialState !== "completed") return; // 튜토리얼 중에는 캔 퀘스트 물음표 표시 배제
    if (this.getQuestState?.() !== CanQuestState.INACTIVE) return;
    if (this.getRecycleQuestState?.() !== RecycleQuestState.LOCKED) return;

    scene.setQuestMarker?.("canQuest", scene.yebiNpc, "?");
  }

  getRecyclePosition() {
    const scene = this.scene;
    const center = scene.getMapPoint("recycling_center", GAME_CONFIG.recyclingCenter);
    return scene.getMapPoint("yebi_recycle_stand", {
      x: center.x - 270,
      y: center.y + 28,
    });
  }

  moveYebiToRecyclingCenter() {
    const scene = this.scene;
    if (!scene.yebiNpc) return;

    scene.pauseNpcRoaming("yebi");
    const position = this.getRecyclePosition();
    scene.tweens.killTweensOf(scene.yebiNpc);
    scene.yebiNpc.setPosition(position.x, position.y);
    scene.yebiNpc.setDepth(3.6);
    scene.setNpcDirectionTexture(scene.yebiNpc, "yeobi", "down", false);
    scene.tweens.add({
      targets: scene.yebiNpc,
      y: position.y - 5,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  walkYebiToRecyclingCenter() {
    const scene = this.scene;
    if (!scene.yebiNpc) return;

    scene.pauseNpcRoaming("yebi");
    const position = this.getRecyclePosition();
    scene.tweens.killTweensOf(scene.yebiNpc);
    scene.yebiNpc.setDepth(3.6);
    const path = this.getPathToRecyclingCenter(position);
    this.walkAlongPath(path, 0);
  }

  getPathToRecyclingCenter(target) {
    const scene = this.scene;
    const startX = scene.yebiNpc?.x ?? scene.playerStart.x;
    const startY = scene.yebiNpc?.y ?? scene.playerStart.y;
    const vendingPoint = scene.getMapPoint("vending_machine", GAME_CONFIG.vendingMachine);
    const upperLaneY = Math.min(startY - 70, vendingPoint.y - 118);

    return [
      { x: startX, y: upperLaneY },
      { x: startX + 130, y: upperLaneY },
      { x: vendingPoint.x - 145, y: upperLaneY },
      { x: vendingPoint.x + 155, y: upperLaneY },
      { x: target.x, y: upperLaneY },
      { x: target.x, y: target.y },
    ];
  }

  walkAlongPath(path, index) {
    const scene = this.scene;
    if (!scene.yebiNpc || index >= path.length) {
      this.startIdleBob();
      return;
    }

    const target = path[index];
    const distance = Phaser.Math.Distance.Between(scene.yebiNpc.x, scene.yebiNpc.y, target.x, target.y);
    if (distance < 4) {
      this.walkAlongPath(path, index + 1);
      return;
    }

    let previousX = scene.yebiNpc.x;
    let previousY = scene.yebiNpc.y;
    const walkingSpeed = GAME_CONFIG.playerSpeed * 0.72;
    scene.tweens.add({
      targets: scene.yebiNpc,
      x: target.x,
      y: target.y,
      duration: Math.max(420, (distance / walkingSpeed) * 1000),
      ease: "Linear",
      onUpdate: () => {
        const dx = scene.yebiNpc.x - previousX;
        const dy = scene.yebiNpc.y - previousY;
        if (Math.abs(dx) + Math.abs(dy) > 0.1) {
          const directionKey = scene.getDirectionKeyFromVector(
            dx,
            dy,
            scene.yebiNpc.getData("directionKey") || "down",
          );
          scene.setNpcDirectionTexture(scene.yebiNpc, "yeobi", directionKey, true);
        }
        previousX = scene.yebiNpc.x;
        previousY = scene.yebiNpc.y;
      },
      onComplete: () => this.walkAlongPath(path, index + 1),
    });
  }

  startIdleBob() {
    const scene = this.scene;
    if (!scene.yebiNpc) return;

    const idleY = scene.yebiNpc.y;
    scene.setNpcDirectionTexture(scene.yebiNpc, "yeobi", "down", false);
    scene.tweens.add({
      targets: scene.yebiNpc,
      y: idleY - 5,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  showQuestDialogue() {
    const scene = this.scene;
    if (scene.isInDialogue || !scene.dialogueSystem) return;

    const recycleState = this.getRecycleQuestState();
    if (recycleState === RecycleQuestState.UNLOCKED) {
      scene.dialogueSystem.start([
        { name: "여비", portraitKey: "yeobi", text: "해냄이, 이제 분리수거도 해볼 수 있겠어?" },
        { name: "여비", portraitKey: "yeobi", text: "일반 쓰레기, 캔, 플라스틱을 맞는 통에 넣으면 보상을 받을 수 있어." },
        {
          name: "여비",
          portraitKey: "yeobi",
          text: "일반 30개, 캔 10개, 플라스틱 10개를 모아서 분리수거장에 넣어보자!",
          choices: [{ label: "해볼게", onSelect: () => this.startRecycleQuest() }],
        },
      ]);
      return;
    }

    if (recycleState === RecycleQuestState.ACTIVE) {
      const quest = this.recycleQuest;
      scene.dialogueSystem.start([
        { name: "여비", portraitKey: "yeobi", text: "좋아! 일반 " + quest.current.normal + "/" + quest.target.normal + ", 캔 " + quest.current.can + "/" + quest.target.can + ", 플라스틱 " + quest.current.plastic + "/" + quest.target.plastic + "이야." },
      ]);
      return;
    }

    if (recycleState === RecycleQuestState.COMPLETED) {
      scene.dialogueSystem.start([
        { name: "여비", portraitKey: "yeobi", text: "모은 쓰레기를 맞는 통에 넣어보자. 하나 넣을 때마다 분리수거 보상을 받을 수 있어!" },
      ]);
      return;
    }

    const questState = this.getQuestState();
    if (questState === CanQuestState.INACTIVE) {
      scene.dialogueSystem.start([
        {
          name: "여비",
          portraitKey: "yeobi",
          text: "안녕! 혹시 나 좀 도와줄 수 있어?",
          choices: [
            {
              label: "예",
              onSelect: () => {
                scene.dialogueSystem.start([
                  { name: "해냄이", portraitKey: "haenaem_confused", text: "네. 어떤 걸 도와드리면 될까요?" },
                  { name: "여비", portraitKey: "yeobi", text: "고마워! 캔 20개만 모아주면 더 넓게 쓸 수 있는 빗자루를 줄게!" },
                ], () => this.startQuest());
              },
            },
            {
              label: "아니오",
              onSelect: () => {
                scene.dialogueSystem.start([
                  { name: "여비", portraitKey: "yeobi", text: "아... 그래. 다음에 꼭 부탁할게." },
                ], () => this.markCanQuestAvailable());
              },
            },
          ],
        },
      ]);
      return;
    }

    if (questState === CanQuestState.ACTIVE) {
      scene.dialogueSystem.start([
        { name: "여비", portraitKey: "yeobi", text: "아직 캔 20개 모으는 중이구나? 힘내!" },
      ]);
      return;
    }

    scene.dialogueSystem.start([
      { name: "여비", portraitKey: "yeobi", text: "오늘도 고마워. 깨끗한 거리를 같이 만들자!" },
    ]);
  }

  tryDepositNearestRecycleBin() {
    const scene = this.scene;
    if (!scene.player || !scene.recycleBins?.length) return false;

    const playerPoints = [
      { x: scene.player.x, y: scene.player.y },
      { x: scene.player.x, y: scene.player.y + GAME_CONFIG.playerDisplayHeight * 0.22 },
      { x: scene.player.x, y: scene.player.y - GAME_CONFIG.playerDisplayHeight * 0.16 },
    ];

    const nearest = scene.recycleBins.find(({ zone }) => {
      const bounds = zone.getBounds();
      return playerPoints.some((point) => Phaser.Geom.Rectangle.Contains(bounds, point.x, point.y));
    });
    if (!nearest) return false;

    this.depositRecycleItem(nearest.type, nearest.bin);
    return true;
  }

  depositRecycleItem(type, binSprite) {
    const scene = this.scene;
    const inventoryCount = scene.recyclingInventory[type] || 0;
    if (inventoryCount <= 0) {
      const message = type === "plastic"
        ? "플라스틱을 아직 못 주웠어."
        : "이건 여기가 아니야.";
      scene.showSpeechBubble(scene.player, message);
      scene.playTone({ frequency: 220, duration: 0.09, type: "square", volume: 0.035 });
      return;
    }

    const recycleState = this.getRecycleQuestState();
    if (recycleState === RecycleQuestState.LOCKED || recycleState === RecycleQuestState.UNLOCKED) {
      return;
    }

    if (recycleState === RecycleQuestState.ACTIVE) {
      const didDepositForQuest = this.progressRecycleQuest(type);
      if (!didDepositForQuest) return;

      scene.recyclingInventory[type] -= 1;
      scene.totalRecycledCount = (scene.totalRecycledCount || 0) + 1; // 퀘스트 분리배출 가산
      this.showDepositEffect(binSprite || scene.player, type);
      scene.playItemPickupSound();
      scene.updateHud();
      return;
    }

    const depositCount = inventoryCount;
    const reward = depositCount * GAME_CONFIG.recycleDepositReward;
    scene.recyclingInventory[type] = 0;
    scene.totalRecycledCount = (scene.totalRecycledCount || 0) + depositCount; // 무한 분리배출 가산
    this.showDepositEffect(binSprite || scene.player, type, depositCount);
    scene.moneySystem?.addMoney(reward);
    scene.playItemPickupSound();
    scene.showQuestToast(`${this.getTypeLabel(type)} ${depositCount}개 분리수거! +${reward.toLocaleString()}원`);
    scene.updateHud();
  }

  showDepositEffect(target, type, count = 1) {
    const scene = this.scene;
    const colorByType = {
      can: 0x6fcf97,
      normal: 0x79c6ff,
      plastic: 0xf2c94c,
    };
    const color = colorByType[type] || 0xffffff;
    scene.showSpeechBubble(target, count > 1 ? `${count}개 쏙!` : "쏙!");

    const itemTexture = scene.getRandomTrashTexture(type);
    if (scene.textures.exists(itemTexture)) {
      const item = scene.add.image(target.x, target.y - 88, itemTexture);
      const itemSize = scene.getTrashDisplaySize(itemTexture, type);
      item.setDepth(8);
      item.setDisplaySize(itemSize.width, itemSize.height);
      scene.tweens.add({
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
      const sparkle = scene.add.circle(target.x, target.y, Phaser.Math.Between(3, 5), color, 0.95);
      sparkle.setDepth(7);
      scene.tweens.add({
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

  getTypeLabel(type) {
    const labelByType = {
      can: "캔",
      normal: "일반 쓰레기",
      plastic: "플라스틱",
    };
    return labelByType[type] || "쓰레기";
  }

  activateRecycleMasterReward() {
    const scene = this.scene;
    if (scene.isRecycleMaster) return;

    scene.isRecycleMaster = true;
    scene.playItemPickupSound();
    scene.showCleanFeedback(scene.player.x, scene.player.y, true);
    scene.showQuestToast("분리수거 보상 개방! 맞는 통에 넣으면 100원");
    scene.dialogueSystem?.start([
      { name: "여비", portraitKey: "yeobi", text: "역시 해냄이야! 이제 분리수거장이 열렸어." },
      { name: "여비", portraitKey: "yeobi", text: "쓰레기를 치우면 100원, 분리수거장에 맞게 넣으면 100원을 더 받을 수 있어. 나눠 버리는 습관이 진짜 실력이야!" },
    ]);
    scene.saveCheckpoint("recycle_completed");
  }

  useItem() {
    const scene = this.scene;
    if (!scene.hasUnlockedYebi || scene.hasUsedYebi || scene.isMissionComplete) {
      return;
    }

    scene.hasUsedYebi = true;
    scene.hasUnlockedYebi = false;
    scene.specialButton.hidden = true;
    scene.specialButton.setAttribute("aria-hidden", "true");
    scene.specialButton.classList.remove("is-ready");
    scene.playHelpVoice();
    scene.playSpecialUseSound();
    this.showCleanCutscene();

    const remainingTrash = scene.trashSlimes
      .getChildren()
      .filter((trash) => trash.active && !trash.getData("cleaned"));
    const targets = Phaser.Utils.Array.Shuffle(remainingTrash).slice(
      0,
      GAME_CONFIG.yebiRemoveCount,
    );

    targets.forEach((trash, index) => {
      scene.time.delayedCall(index * 80, () => {
        scene.autoCleanTrash(trash);
      });
    });
  }

  showCleanCutscene() {
    this.showCenterMessage("내가 도울게");
  }

  showCenterMessage(
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
    const scene = this.scene;
    const npc = scene.add.sprite(384, 220, "yeobi_walk_down", 1);
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

    const flash = scene.add.ellipse(384, 240, 230, 160, flashColor, 0.36);
    flash.setScrollFactor(0);
    flash.setStrokeStyle(6, strokeColor, 0.92);
    flash.setDepth(49);
    flash.setAlpha(0);

    const captionPanel = scene.add.rectangle(384, 132, panelWidth, 42, 0xffffff, 0.96);
    captionPanel.setScrollFactor(0);
    captionPanel.setStrokeStyle(4, 0x21352c);
    captionPanel.setDepth(51);
    captionPanel.setAlpha(0);

    const captionText = scene.add.text(384, 131, caption, {
      fontFamily: "Arial",
      fontSize: "22px",
      color: "#21352c",
      fontStyle: "bold",
    });
    captionText.setOrigin(0.5);
    captionText.setScrollFactor(0);
    captionText.setDepth(52);
    captionText.setAlpha(0);

    scene.tweens.add({
      targets: npc,
      alpha: 1,
      scaleX: npcFinalScale,
      scaleY: npcFinalScale,
      duration: 180,
      ease: "Back.easeOut",
    });
    scene.tweens.add({
      targets: [flash, captionPanel, captionText],
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 180,
      ease: "Back.easeOut",
    });

    for (let i = 0; i < sparkleCount; i += 1) {
      const sparkle = scene.add.circle(
        384,
        240,
        Phaser.Math.Between(3, 6),
        i % 2 === 0 ? 0xffffff : flashColor,
        0.95,
      );
      sparkle.setScrollFactor(0);
      sparkle.setDepth(51);
      scene.tweens.add({
        targets: sparkle,
        x: 384 + Phaser.Math.Between(-150, 150),
        y: 240 + Phaser.Math.Between(-95, 105),
        alpha: 0,
        duration: Phaser.Math.Between(520, 820),
        ease: "Cubic.easeOut",
        onComplete: () => sparkle.destroy(),
      });
    }

    scene.time.delayedCall(holdMs, () => {
      scene.tweens.add({
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

  renderGauge(count) {
    if (!this.uiElements.bar) return;

    this.uiElements.bar.innerHTML = "";
    for (let i = 0; i < count; i += 1) {
      this.uiElements.bar.appendChild(document.createElement("span"));
    }
  }

  renderRecycleGauge() {
    if (!this.uiElements.bar) return;

    const typeConfig = [
      { type: "normal", icon: "assets/ui/trash.png", label: "일반" },
      { type: "can", icon: "assets/ui/trash-can.png", label: "캔" },
      { type: "plastic", icon: "assets/ui/plastic.png", label: "플라스틱" },
    ];
    this.uiElements.bar.innerHTML = "";
    this.uiElements.bar.classList.add("is-recycle");

    typeConfig.forEach(({ type, icon, label }) => {
      const row = document.createElement("div");
      row.className = "recycle-gauge-row";
      row.dataset.type = type;

      const image = document.createElement("img");
      image.src = icon;
      image.alt = label;
      image.className = "recycle-gauge-icon";

      const track = document.createElement("div");
      track.className = "recycle-gauge-track";

      for (let i = 0; i < this.recycleQuest.target[type]; i += 1) {
        track.appendChild(document.createElement("span"));
      }

      row.appendChild(image);
      row.appendChild(track);
      this.uiElements.bar.appendChild(row);
    });
  }

  startQuest() {
    const quest = this.canQuest;
    if (quest.isCompleted) return;

    quest.isActive = true;
    this.uiElements.root?.classList.remove("is-poofing");
    this.renderGauge(quest.target);
    this.uiElements.bar?.classList.remove("is-recycle");
    this.updateUI();
    this.scene.setQuestMarker?.("canQuest", this.scene.yebiNpc, "!");
    this.scene.showQuestToast?.("새 퀘스트: 캔 20개 모으기");
    this.scene.playItemPickupSound?.();
    this.walkYebiToRecyclingCenter();
    this.scene.saveCheckpoint?.("can_started");
  }

  updateQuestProgress(canCount = 1) {
    const quest = this.canQuest;
    if (!quest.isActive || quest.isCompleted) return;

    quest.current = Math.min(quest.target, quest.current + canCount);
    this.updateUI();

    if (quest.current >= quest.target) {
      this.completeQuest();
    }
  }

  completeQuest() {
    const quest = this.canQuest;
    if (quest.isCompleted) return;

    quest.isActive = false;
    quest.isCompleted = true;
    quest.current = quest.target;
    this.updateUI();

    this.scene.playItemPickupSound?.();
    this.scene.dropBroomUpgrade?.();
    this.scene.showQuestToast?.("빗자루 획득! 더 넓게 쓸 수 있어요.");
    if (this.scene.player) {
      this.scene.showCleanFeedback?.(this.scene.player.x, this.scene.player.y, true);
    }
    this.hideQuestGaugeWithPoof();
    this.scene.clearQuestMarker?.("canQuest");
    this.scene.saveCheckpoint?.("can_completed");

    this.scene.time.delayedCall(180, () => {
      this.scene.dialogueSystem?.start([
        {
          name: "여비",
          portraitKey: "yeobi",
          text: "고마워! 캔 20개를 모아줬으니 약속한 빗자루야. 이제 더 넓게 쓸어보자!",
        },
      ]);
    });
  }

  unlockRecycleQuest() {
    if (this.recycleQuest.isUnlocked || this.recycleQuest.isCompleted) return false;

    this.recycleQuest.isUnlocked = true;
    return true;
  }

  startRecycleQuest() {
    const quest = this.recycleQuest;
    if (!quest.isUnlocked || quest.isCompleted) return;

    quest.isActive = true;
    this.scene.setQuestMarker?.("recycleQuest", this.scene.yebiNpc, "!");
    this.uiElements.root?.classList.remove("is-poofing");
    this.renderRecycleGauge();
    this.updateUI();
    this.scene.showQuestToast?.("분리수거 퀘스트 시작!");
    this.scene.playItemPickupSound?.();
    this.scene.saveCheckpoint?.("recycle_started");
  }

  progressRecycleQuest(type) {
    const quest = this.recycleQuest;
    if (!quest.isActive || quest.isCompleted || !(type in quest.target)) return false;

    if (quest.current[type] >= quest.target[type]) {
      this.scene.showSpeechBubble?.(this.scene.player, "이 종류는 충분해!");
      return false;
    }

    quest.current[type] += 1;
    this.updateUI();

    if (this.isRecycleQuestReadyToComplete()) {
      this.completeRecycleQuest();
    }

    return true;
  }

  completeRecycleQuest() {
    const quest = this.recycleQuest;
    if (quest.isCompleted) return;

    quest.isActive = false;
    quest.isCompleted = true;
    quest.current.normal = quest.target.normal;
    quest.current.can = quest.target.can;
    quest.current.plastic = quest.target.plastic;
    this.updateUI();
    this.activateRecycleMasterReward();
    this.hideQuestGaugeWithPoof();
    this.scene.clearQuestMarker?.("recycleQuest");
  }

  isRecycleQuestReadyToComplete() {
    const quest = this.recycleQuest;
    return Object.keys(quest.target).every((type) => quest.current[type] >= quest.target[type]);
  }

  getRecycleTargetTotal() {
    return Object.values(this.recycleQuest.target).reduce((sum, value) => sum + value, 0);
  }

  getRecycleCurrentTotal() {
    return Object.keys(this.recycleQuest.target).reduce((sum, type) => {
      return sum + Math.min(this.recycleQuest.current[type], this.recycleQuest.target[type]);
    }, 0);
  }

  hideQuestGaugeWithPoof() {
    const { root } = this.uiElements;
    if (!root) return;

    root.classList.remove("is-hidden");
    root.classList.add("is-poofing");
    root.setAttribute("aria-hidden", "true");
    window.setTimeout(() => {
      root.classList.remove("is-poofing");
      root.classList.add("is-hidden");
    }, 460);
  }

  getQuestState() {
    if (this.canQuest.isCompleted) return CanQuestState.COMPLETED;
    if (this.canQuest.isActive) return CanQuestState.ACTIVE;
    return CanQuestState.INACTIVE;
  }

  getRecycleQuestState() {
    if (this.recycleQuest.isCompleted) return RecycleQuestState.COMPLETED;
    if (this.recycleQuest.isActive) return RecycleQuestState.ACTIVE;
    if (this.recycleQuest.isUnlocked) return RecycleQuestState.UNLOCKED;
    return RecycleQuestState.LOCKED;
  }

  updateUI() {
    const { root, label, bar } = this.uiElements;
    if (!root || !label || !bar) return;

    const recycleQuest = this.recycleQuest;
    if (recycleQuest.isActive) {
      root.classList.toggle("is-hidden", false);
      root.classList.toggle("is-complete", false);
      root.setAttribute("aria-hidden", "false");
      if (!bar.classList.contains("is-recycle")) {
        this.renderRecycleGauge();
      }
      label.textContent =
        `분리수거: 일반 ${recycleQuest.current.normal}/${recycleQuest.target.normal} · ` +
        `캔 ${recycleQuest.current.can}/${recycleQuest.target.can} · ` +
        `플라스틱 ${recycleQuest.current.plastic}/${recycleQuest.target.plastic}`;
      Array.from(bar.querySelectorAll(".recycle-gauge-row")).forEach((row) => {
        const type = row.dataset.type;
        const filled = Math.min(recycleQuest.current[type], recycleQuest.target[type]);
        Array.from(row.querySelectorAll("span")).forEach((dot, index) => {
          dot.classList.toggle("is-filled", index < filled);
        });
      });
      return;
    }

    const quest = this.canQuest;
    if (bar.classList.contains("is-recycle")) {
      this.renderGauge(quest.target);
      bar.classList.remove("is-recycle");
    }
    root.classList.toggle("is-hidden", !quest.isActive && !quest.isCompleted);
    root.classList.toggle("is-complete", quest.isCompleted);
    root.setAttribute("aria-hidden", String(!quest.isActive && !quest.isCompleted));

    if (quest.isCompleted) {
      label.textContent = "캔 모으기 완료";
    } else if (quest.isActive) {
      label.textContent = `캔 수집: ${quest.current} / ${quest.target}`;
    } else {
      label.textContent = "퀘스트 없음";
    }

    Array.from(bar.children).forEach((dot, index) => {
      dot.classList.toggle("is-filled", index < quest.current);
    });
  }
}
