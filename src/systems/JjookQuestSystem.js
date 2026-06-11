import { GAME_CONFIG } from "../config/GameConstants.js";
import {
  JjookQuestState,
  ClothesQuestState,
  PackingQuestState,
} from "../config/QuestStates.js";

export default class JjookQuestSystem {
  constructor(scene) {
    this.scene = scene;
    this.ploggingTarget = null;
  }

  requestPloggingHelp() {
    const scene = this.scene;
    if (scene.isJjookFollowActive) {
      scene.dialogueSystem?.start([
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
      scene.dialogueSystem?.start([
        { name: "쭉쭉이", portraitKey: "jjook_plogging", text: Phaser.Utils.Array.GetRandom(reasons) },
      ], () => this.activateFollower({ buyColaOnComplete: true }));
      return;
    }

    const reasons = [
      "미안! 오늘은 다리가 조금 뻐근해서 쉬어야겠어.",
      "지금은 물을 좀 마시고 쉬어야 할 것 같아. 다음에 꼭 도와줄게!",
      "방금 운동을 너무 열심히 했나 봐. 조금 쉬고 싶어.",
    ];
    scene.dialogueSystem?.start([
      { name: "쭉쭉이", portraitKey: "jjook_smile", text: Phaser.Utils.Array.GetRandom(reasons) },
    ]);
  }

  sayBye() {
    this.scene.dialogueSystem?.start([
      { name: "쭉쭉이", portraitKey: "jjook_smile", text: "좋아! 필요하면 또 불러줘." },
    ]);
  }

  handleInteraction() {
    const scene = this.scene;
    if (scene.isInDialogue || !scene.dialogueSystem || scene.jjookQuestState === JjookQuestState.LOCKED) return;
    if (scene.isJjookClothesEscortActive && scene.interactionSystem?.handlePriorityLocationInteraction()) return;
    if (!scene.isPlayerNearJjookNpc()) return;

    if (scene.jjookQuestState === JjookQuestState.WALLET_MISSING) {
      scene.dialogueSystem.start([
        { name: "쭉쭉이", portraitKey: "jjook_lost", text: "아... 이동하다가 지갑을 잃어버렸어. 목도 너무 마른데 어떡하지?" },
        { name: "쭉쭉이", portraitKey: "jjook_lost", text: "혹시 도로 아래쪽 길 어딘가에 떨어졌을지도 몰라... 갈색 지갑인데, 반짝반짝 빛나고 있을 거야! 같이 찾아줄래?" },
      ], () => {
        if (!scene.walletItem?.active && !scene.hasWallet) scene.spawnWalletItem();
      });
      return;
    }

    if (scene.jjookQuestState === JjookQuestState.WALLET_FOUND) {
      scene.dialogueSystem.start([
        { name: "쭉쭉이", portraitKey: "jjook_found", text: "지갑을 찾아줘서 정말 고마워. 보답으로 시원한 음료수 하나 사줄게. 뭐 마실래?" },
      ], () => scene.openVendingMenu({ completeQuestOnSelect: true }));
      return;
    }

    if (scene.jjookQuestState !== JjookQuestState.COMPLETED) return;

    if (scene.clothesQuestState === ClothesQuestState.READY || scene.clothesQuestState === ClothesQuestState.DECLINED) {
      this.startClothesQuestDialogue();
      return;
    }

    if (scene.clothesQuestState === ClothesQuestState.SHOPPING) {
      scene.dialogueSystem.start([
        { name: "쭉쭉이", portraitKey: "jjook_expectant", text: "옷가게는 맵 위쪽 상점가에 있어. 같이 가보자!" },
      ]);
      return;
    }

    if (scene.clothesQuestState === ClothesQuestState.COMPLETED && [PackingQuestState.OFFERED, PackingQuestState.DECLINED].includes(scene.packingQuestState)) {
      this.startPackingOfferDialogue({ repeat: scene.packingQuestState === PackingQuestState.DECLINED });
      return;
    }

    if (scene.clothesQuestState === ClothesQuestState.COMPLETED && scene.packingQuestState === PackingQuestState.GOING_BUS_STOP) {
      scene.dialogueSystem.start([
        { name: "쭉쭉이", portraitKey: "jjook_travel_bag", text: "버스정류장에서 만나자. 천천히 걸어와도 괜찮아!" },
      ]);
      return;
    }

    if (scene.isJjookFollowActive) {
      scene.dialogueSystem.start([
        { name: "쭉쭉이", portraitKey: "jjook_plogging", text: "지금 같이 플로깅 중이야! 주변 쓰레기를 같이 치워보자." },
        { name: "해냄이", portraitKey: "haenaem_determined", text: "좋아. 지금처럼 같이 깨끗하게 치우자!" },
      ]);
      return;
    }

    const memoryLine = scene.npcMemorySystem?.getQuestSafeMemoryDialogueLine?.("jjook");
    scene.dialogueSystem.start([
      ...(memoryLine ? [memoryLine] : []),
      { name: "쭉쭉이", portraitKey: "jjook_smile", text: "나랑 같이 걷자! 음료수가 필요하면 자판기 앞에서 골라줘." },
      {
        name: "해냄이",
        portraitKey: "haenaem_confused",
        text: "쭉쭉이에게 뭐라고 말할까요?",
        choices: [
          { label: "플로깅을 도와줄래?", onSelect: () => this.requestPloggingHelp() },
          { label: "다음에 보자.", onSelect: () => this.sayBye() },
        ],
      },
    ]);
  }

  startClothesQuestDialogue() {
    const scene = this.scene;
    if (!scene.dialogueManager?.has("zzuk_clothes_start_001")) {
      scene.dialogueSystem?.start([
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

    scene.dialogueManager.startLoaded("zzuk_clothes_start_001");
  }

  startClothesShoppingQuest() {
    const scene = this.scene;
    scene.clothesQuestState = ClothesQuestState.SHOPPING;
    scene.hasAnnouncedClothesQuest = true;
    scene.isJjookClothesEscortActive = true;
    scene.pauseNpcRoaming("jjook");
    this.stopIdleTween();
    scene.clearQuestMarker("clothesQuest");
    const shopTarget = scene.mapObjects?.clothing_store || {
      active: true,
      ...scene.getMapPoint("clothing_store_door", GAME_CONFIG.clothingStoreDoor),
      displayHeight: 96,
    };
    scene.setQuestMarker("clothesShop", shopTarget, "!");
    scene.showQuestToast("쭉쭉이와 함께 옷가게로 가요.", 6000);
    scene.showSpeechBubble(scene.jjookNpc, "같이 가자!", 2800);
    scene.saveCheckpoint("clothes_shopping");
  }

  declineClothesShoppingQuest() {
    const scene = this.scene;
    scene.clothesQuestState = ClothesQuestState.DECLINED;
    scene.hasAnnouncedClothesQuest = true;
    scene.setQuestMarker("clothesQuest", scene.jjookNpc, "!");
    scene.saveCheckpoint("clothes_declined");
  }

  handleClothingStoreInteraction() {
    const scene = this.scene;
    if (![ClothesQuestState.SHOPPING, ClothesQuestState.COMPLETED].includes(scene.clothesQuestState)) {
      scene.showQuestToast("쭉쭉이와 먼저 이야기해 보자.");
      return;
    }

    scene.playSceneMusic("ambient_clothing_shop_bgm", 0.25);
    scene.showInteriorScene("clothing_store_interior", "clothing");
    scene.isJjookClothesEscortActive = false;
    scene.stopNpcWalk(scene.jjookNpc, "jjook");
    scene.dialogueSystem.start([
      { name: "옷가게 사장님", portraitKey: "clothing_shop_owner", text: "어서와~ 서울 여행 간다면서?" },
      { name: "옷가게 사장님", portraitKey: "clothing_shop_owner", text: "천천히 둘러봐! 마음에 드는 걸 골라보렴." },
    ], () => scene.openClothingShopMenu());
  }

  completeClothesShoppingQuest() {
    const scene = this.scene;
    scene.closeClothingShopMenu();
    scene.clearInteriorScene();
    scene.clothesQuestState = ClothesQuestState.COMPLETED;
    scene.packingQuestState = PackingQuestState.OFFERED;
    scene.clearQuestMarker("clothesShop");
    scene.clearQuestMarker("clothesQuest");
    scene.saveCheckpoint("clothes_completed");
    
    const startDialogue = () => {
      scene.dialogueSystem.start([
        { name: "쭉쭉이", portraitKey: "jjook_smile", text: "오! 잘 어울린다!" },
        { name: "쭉쭉이", portraitKey: "jjook_expectant", text: "오~ 이제 진짜 서울 가는 느낌 난다!" },
        { name: "해냄이", portraitKey: "haenaem_touched", text: "고마워! 마음에 드는 옷을 직접 고르니까 더 설렌다." },
        {
          name: "쭉쭉이",
          portraitKey: "jjook_travel_bag",
          text: "해냄아, 우리 이제 여행 짐도 슬슬 준비해야 하지 않을까?",
          choices: [
            { label: "그래! 짐 싸러 가자!", onSelect: () => this.acceptPackingQuest() },
            { label: "아니! 돈 더 벌어서 옷 더 사고 싶어!", onSelect: () => this.declinePackingQuest() },
          ],
        },
      ], () => {
        scene.clearInteriorScene();
      });
    };

    if (scene.player) {
      scene.playerController?.playWalkAnimation?.("down");
      scene.tweens.add({
        targets: scene.player,
        y: scene.player.y + 48,
        duration: 500,
        onComplete: () => {
          scene.playerController?.stopWalkAnimation?.();
          scene.time.delayedCall(200, startDialogue);
        }
      });
    } else {
      startDialogue();
    }
  }

  startPackingOfferDialogue({ repeat = false } = {}) {
    const scene = this.scene;
    const lines = repeat
      ? [
          {
            name: "쭉쭉이",
            portraitKey: "jjook_travel_bag",
            text: "이제 준비 다 됐어?",
            choices: [
              { label: "응! 짐 싸러 가자!", onSelect: () => this.acceptPackingQuest() },
              { label: "아직 준비 중이야!", onSelect: () => this.declinePackingQuest(true) },
            ],
          },
        ]
      : [
          {
            name: "쭉쭉이",
            portraitKey: "jjook_travel_bag",
            text: "여행 짐도 슬슬 준비해볼까?",
            choices: [
              { label: "그래! 짐 싸러 가자!", onSelect: () => this.acceptPackingQuest() },
              { label: "아니! 조금 더 둘러볼래!", onSelect: () => this.declinePackingQuest() },
            ],
          },
        ];

    scene.dialogueSystem.start(lines);
  }

  declinePackingQuest(isRepeat = false) {
    const scene = this.scene;
    scene.clearInteriorScene();
    scene.packingQuestState = PackingQuestState.DECLINED;
    scene.setQuestMarker("packingQuest", scene.jjookNpc, "!");
    scene.saveCheckpoint("packing_declined");
    scene.dialogueSystem.start([
      {
        name: "쭉쭉이",
        portraitKey: "jjook_smile",
        text: isRepeat ? "좋아! 천천히 준비해도 돼!" : "그래! 천천히 준비해도 돼!",
      },
    ], () => {
      this.walkBackToHome();
      scene.showQuestToast("준비가 끝나면 쭉쭉이에게 말해요.", 4200);
    });
  }

  acceptPackingQuest() {
    const scene = this.scene;
    scene.clearInteriorScene();
    scene.packingQuestState = PackingQuestState.GOING_BUS_STOP;
    scene.clearQuestMarker("packingQuest");
    scene.saveCheckpoint("packing_started");
    scene.pauseNpcRoaming("jjook");
    this.stopIdleTween();
    scene.dialogueSystem.start([
      { name: "쭉쭉이", portraitKey: "jjook_travel_bag", text: "좋아! 집 가서 여행 준비 시작하자!" },
      { name: "해냄이", portraitKey: "haenaem_determined", text: "응. 버스 타고 집에 가서 차근차근 챙겨볼게." },
    ], () => scene.travelEndingSystem?.startBusStopBoardingSequence());
  }

  updateFollower() {
    const scene = this.scene;
    if ((!scene.isJjookFollowActive && !scene.isJjookClothesEscortActive && !scene.isJjookBusEscortActive) || !scene.jjookNpc || !scene.player) return;
    this.stopIdleTween();

    const distance = Phaser.Math.Distance.Between(scene.jjookNpc.x, scene.jjookNpc.y, scene.player.x, scene.player.y);

    if (scene.isJjookFollowActive) {
      // If Jjook has a valid plogging target and player is on screen (< 300px), let plogging AI steer Jjook
      if (this.ploggingTarget && this.ploggingTarget.active && !this.ploggingTarget.getData("cleaned") && distance <= 300) {
        return;
      }

      // Return to player if Jjook goes too far or has no current plogging target
      const returnDistance = 64;
      if (distance <= returnDistance) {
        scene.npcFollowRouteSystem?.clear("jjook_follow");
        scene.stopNpcWalk(scene.jjookNpc, "jjook");
        return;
      }

      this.walkOrthogonallyToward(scene.player.x, scene.player.y, distance, returnDistance);
      return;
    }

    const followDistance = scene.isJjookBusEscortActive ? 76 : 88;
    if (distance <= followDistance) {
      scene.npcFollowRouteSystem?.clear("jjook_follow");
      scene.stopNpcWalk(scene.jjookNpc, "jjook");
      return;
    }

    this.walkOrthogonallyToward(scene.player.x, scene.player.y, distance, followDistance);
  }

  updateAutoPlogging() {
    const scene = this.scene;
    if (!scene.isJjookFollowActive || !scene.jjookNpc?.active || !scene.trashSlimes) return;
    if (scene.isInDialogue || scene.interiorSceneGroup) return;

    const playerDist = Phaser.Math.Distance.Between(scene.jjookNpc.x, scene.jjookNpc.y, scene.player.x, scene.player.y);

    // 1. Tether safety check: If too far from player (> 300px), drop plogging target and return
    if (playerDist > 300) {
      this.ploggingTarget = null;
      return;
    }

    // 2. Target validation: If current target is cleaned or inactive, clear it
    if (this.ploggingTarget && (!this.ploggingTarget.active || this.ploggingTarget.getData("cleaned"))) {
      this.ploggingTarget = null;
    }

    // 3. Scan for a new target in viewport/screen bounds
    if (!this.ploggingTarget) {
      // Find a walkable, screen-distributed trash that doesn't overlap player's active cleaning zone
      this.ploggingTarget = this.findSmartPloggingTarget(300);
    }

    // 4. If we have a valid target, walk orthogonally toward it
    if (this.ploggingTarget) {
      const distToTrash = Phaser.Math.Distance.Between(scene.jjookNpc.x, scene.jjookNpc.y, this.ploggingTarget.x, this.ploggingTarget.y);

      // Stop and sweep when extremely close to the trash
      if (distToTrash <= 24) {
        scene.stopNpcWalk(scene.jjookNpc, "jjook");

        if (scene.time.now >= (scene.nextJjookAutoCleanAt || 0)) {
          scene.nextJjookAutoCleanAt = scene.time.now + GAME_CONFIG.jjookAutoCleanCooldownMs;
          this.sweepAndCleanTarget(this.ploggingTarget);
        }
      } else {
        // Walk orthogonally toward the trash
        this.walkOrthogonallyToward(this.ploggingTarget.x, this.ploggingTarget.y, distToTrash, 12);
      }
    }
  }

  adjustTargetForTrafficRules(npcSprite, targetX, targetY) {
    const scene = this.scene;
    const roadTop = 192;
    const roadBottom = 270;

    const npcY = npcSprite.y;
    const isNpcNorth = npcY < roadTop;
    const isNpcSouth = npcY > roadBottom;
    const isNpcOnRoad = npcY >= roadTop && npcY <= roadBottom;

    const isTargetNorth = targetY < roadTop;
    const isTargetSouth = targetY > roadBottom;

    const isCrossingNeeded = (isNpcNorth && isTargetSouth) || (isNpcSouth && isTargetNorth) || isNpcOnRoad;
    if (!isCrossingNeeded) {
      return { x: targetX, y: targetY, waitAtRedLight: false };
    }

    const crosswalkXs = scene.roadTrafficSystem?.getCrosswalkXs() || [472, 1144];
    const crosswalkX = crosswalkXs.reduce((best, x) => {
      return Math.abs(x - npcSprite.x) < Math.abs(best - npcSprite.x) ? x : best;
    }, crosswalkXs[0]);

    if (Math.abs(npcSprite.x - crosswalkX) > 16) {
      return { x: crosswalkX, y: npcSprite.y, waitAtRedLight: false };
    }

    const isPedestrianGreen = scene.roadTrafficSystem?.isPedestrianSignalGreen() !== false;

    if (!isPedestrianGreen) {
      if (isNpcNorth && npcSprite.y >= roadTop - 12) {
        return { x: crosswalkX, y: roadTop - 12, waitAtRedLight: true };
      }
      if (isNpcSouth && npcSprite.y <= roadBottom + 12) {
        return { x: crosswalkX, y: roadBottom + 12, waitAtRedLight: true };
      }
    }

    if (isNpcNorth) {
      return { x: crosswalkX, y: roadBottom + 16, waitAtRedLight: false };
    }
    if (isNpcSouth) {
      return { x: crosswalkX, y: roadTop - 16, waitAtRedLight: false };
    }

    return { x: crosswalkX, y: targetY, waitAtRedLight: false };
  }

  walkOrthogonallyToward(targetX, targetY, distance, stopDistance) {
    const scene = this.scene;

    const adjusted = this.adjustTargetForTrafficRules(scene.jjookNpc, targetX, targetY);
    if (adjusted.waitAtRedLight) {
      scene.npcFollowRouteSystem?.clear("jjook_follow");
      scene.stopNpcWalk(scene.jjookNpc, "jjook");
      return;
    }

    const activeTargetX = adjusted.x;
    const activeTargetY = adjusted.y;
    const activeDistance = Phaser.Math.Distance.Between(scene.jjookNpc.x, scene.jjookNpc.y, activeTargetX, activeTargetY);

    const roadTop = 192;
    const roadBottom = 270;
    const isNpcNorth = scene.jjookNpc.y < roadTop;
    const isNpcSouth = scene.jjookNpc.y > roadBottom;
    const isNpcOnRoad = scene.jjookNpc.y >= roadTop && scene.jjookNpc.y <= roadBottom;
    const isTargetNorth = targetY < roadTop;
    const isTargetSouth = targetY > roadBottom;
    const isCrossingRoad = isNpcOnRoad || (isNpcNorth && isTargetSouth) || (isNpcSouth && isTargetNorth);

    const isIntermediate = (activeTargetX !== targetX || activeTargetY !== targetY) || isCrossingRoad;
    const effectiveStopDistance = isIntermediate ? 0 : stopDistance;

    const baseFollowSpeed = scene.isJjookClothesEscortActive ? GAME_CONFIG.playerSpeed * 1.55 : 118;
    const boostedFollowSpeed = scene.isSpeedBuffActive ? baseFollowSpeed * GAME_CONFIG.speedBuffMultiplier : baseFollowSpeed;
    const followSpeed = distance > 220 ? boostedFollowSpeed * 1.35 : boostedFollowSpeed;
    const step = (scene.game.loop.delta / 1000) * followSpeed;

    if (scene.npcFollowRouteSystem?.follow("jjook_follow", scene.jjookNpc, "jjook", {
      x: activeTargetX,
      y: activeTargetY,
    }, {
      speed: followSpeed,
      stopDistance: effectiveStopDistance,
      repathMs: scene.isJjookBusEscortActive ? 500 : 700,
      targetMoveTolerance: scene.isJjookBusEscortActive ? 24 : 36,
    })) {
      return;
    }

    if (scene.npcFollowRouteSystem && activeDistance <= effectiveStopDistance + 2) {
      scene.stopNpcWalk(scene.jjookNpc, "jjook");
      return;
    }

    const dx = activeTargetX - scene.jjookNpc.x;
    const dy = activeTargetY - scene.jjookNpc.y;

    let moveX = 0;
    let moveY = 0;
    let directionKey = scene.jjookNpc.getData("directionKey") || "down";

    // Orthogonal movement: X-axis prioritized.
    if (Math.abs(dx) > 8) {
      const stepX = Math.min(step, Math.abs(dx) - (Math.abs(dy) <= 8 ? effectiveStopDistance : 0));
      if (stepX > 0) {
        moveX = Math.sign(dx) * stepX;
        scene.jjookNpc.x += moveX;
        directionKey = moveX < 0 ? "left" : "right";
      }
    } else if (Math.abs(dy) > 8) {
      const stepY = Math.min(step, Math.abs(dy) - effectiveStopDistance);
      if (stepY > 0) {
        moveY = Math.sign(dy) * stepY;
        scene.jjookNpc.y += moveY;
        directionKey = moveY < 0 ? "up" : "down";
      }
    }

    if (moveX !== 0 || moveY !== 0) {
      scene.setNpcDirectionTexture(scene.jjookNpc, "jjook", directionKey, true);
    } else {
      scene.stopNpcWalk(scene.jjookNpc, "jjook");
    }
  }

  sweepAndCleanTarget(target) {
    const scene = this.scene;
    const direction = new Phaser.Math.Vector2(target.x - scene.jjookNpc.x, target.y - scene.jjookNpc.y);
    if (direction.lengthSq() > 0) {
      direction.normalize();
      const directionKey = scene.getDirectionKeyFromVector(direction.x, direction.y, scene.jjookNpc.getData("directionKey") || "down");
      scene.setNpcDirectionTexture(scene.jjookNpc, "jjook", directionKey, true);
    }

    scene.playSweepSound();
    scene.showSweepEffect(target.x, target.y, 78, 60, direction.lengthSq() > 0 ? direction : null);

    scene.time.delayedCall(120, () => {
      if (!target?.active || target.getData("cleaned")) return;
      const trashType = target.getData("trashType") || "normal";
      if (trashType === "can") {
        scene.playCanCleanSound();
      } else {
        scene.playCleanSound();
      }
      scene.autoCleanTrash(target, { shouldRespawn: true });
      this.ploggingTarget = null; // Clear target after cleaning

      if (Phaser.Math.Between(0, 99) < 22) {
        scene.showSpeechBubble(scene.jjookNpc, "여기도 깨끗하게!", 1200);
      }
    });
  }

  findSmartPloggingTarget(maxDistFromPlayer) {
    const scene = this.scene;
    if (!scene.jjookNpc || !scene.trashSlimes || !scene.player) return null;

    let bestTarget = null;
    let bestDistance = maxDistFromPlayer;

    scene.trashSlimes.children.iterate((trash) => {
      if (!trash?.active || trash.getData("cleaned")) return;

      // Ensure the trash is in Jjook's active tether range from the player (stays on the same screen)
      const distFromPlayer = Phaser.Math.Distance.Between(scene.player.x, scene.player.y, trash.x, trash.y);
      if (distFromPlayer > maxDistFromPlayer) return;

      // Avoid overlapping with player's active sweep boundary (avoid duplicate work)
      const distFromPlayerActual = Phaser.Math.Distance.Between(scene.player.x, scene.player.y, trash.x, trash.y);
      if (distFromPlayerActual < 100) return; // Skip if too close to player's current action spot

      const distFromJjook = Phaser.Math.Distance.Between(scene.jjookNpc.x, scene.jjookNpc.y, trash.x, trash.y);
      if (distFromJjook < bestDistance) {
        bestTarget = trash;
        bestDistance = distFromJjook;
      }
    });

    return bestTarget;
  }

  findNearestTrashTo(source, radius) {
    const scene = this.scene;
    if (!source || !scene.trashSlimes) return null;

    let nearest = null;
    let nearestDistance = radius;
    scene.trashSlimes.children.iterate((trash) => {
      if (!trash?.active || trash.getData("cleaned")) return;
      const distance = Phaser.Math.Distance.Between(source.x, source.y, trash.x, trash.y);
      if (distance <= nearestDistance) {
        nearest = trash;
        nearestDistance = distance;
      }
    });

    return nearest;
  }

  stopIdleTween() {
    const scene = this.scene;
    scene.jjookIdleTween?.stop();
    scene.jjookIdleTween = null;
    if (scene.jjookNpc) scene.tweens.killTweensOf(scene.jjookNpc);
  }

  walkBackToHome() {
    const scene = this.scene;
    if (!scene.jjookNpc?.active) return;
    scene.pauseNpcRoaming("jjook");
    scene.jjookReturningHome = true;
    scene.isJjookClothesEscortActive = false;
    scene.isJjookFollowActive = false;
    scene.isJjookBusEscortActive = false;
    scene.walkNpcToTarget(scene.jjookNpc, "jjook", scene.getMapPoint("jjook_start", GAME_CONFIG.jjookSpawn), {
      speed: 112,
      onComplete: () => {
        scene.jjookReturningHome = false;
        scene.showSpeechBubble(scene.jjookNpc, "나중에 또 같이 가자!", 2200);
        scene.updateNpcRoaming(true);
      },
    });
  }

  activateFollower({ buyColaOnComplete = false } = {}) {
    const scene = this.scene;
    scene.pauseNpcRoaming("jjook");
    scene.isJjookFollowActive = true;
    scene.jjookFollowEndsAt = scene.time.now + GAME_CONFIG.jjookFollowDurationMs;
    scene.shouldBuyJjookColaAfterFollow = buyColaOnComplete;
    scene.jjookFollowTimer?.remove(false);
    scene.jjookFollowCountdownEvent?.remove(false);
    scene.startEffectCountdown(scene.jjookFollowHudEl, scene.jjookFollowTimerEl, GAME_CONFIG.jjookFollowDurationMs, (event) => {
      scene.jjookFollowCountdownEvent = event;
    });
    scene.showQuestToast("쭉쭉이가 1분 동안 플로깅을 도와줘.");
    scene.jjookFollowTimer = scene.time.delayedCall(GAME_CONFIG.jjookFollowDurationMs, () => {
      scene.isJjookFollowActive = false;
      scene.jjookFollowCountdownEvent?.remove(false);
      scene.jjookFollowCountdownEvent = null;
      scene.hideEffectHud(scene.jjookFollowHudEl, scene.jjookFollowTimerEl);
      scene.showQuestToast("쭉쭉이: 그럼 다음에 또 봐!");
      if (scene.jjookNpc?.active) {
        scene.showSpeechBubble(scene.jjookNpc, "그럼 다음에 또 봐!", 3600);
      }
      if (scene.shouldBuyJjookColaAfterFollow) {
        scene.shouldBuyJjookColaAfterFollow = false;
        this.buyThanksCola();
      }
      this.walkBackToHome();
    });
  }

  finishQuestWithoutDrink() {
    const scene = this.scene;
    scene.jjookQuestState = JjookQuestState.COMPLETED;
    scene.hasWallet = false;
    scene.clearQuestMarker("jjookQuest");
    this.activateFollower();
    scene.shouldCompleteJjookAfterDrink = false;
    scene.selectedDrink = null;
    scene.saveCheckpoint("jjook_completed");
    scene.dialogueSystem?.start([
      { name: "쭉쭉이", portraitKey: "jjook_plogging", text: "그럼 내가 쓰레기 줍는 것이라도 도와줄게!" },
    ]);
  }

  finishQuest() {
    const scene = this.scene;
    scene.jjookQuestState = JjookQuestState.COMPLETED;
    scene.hasWallet = false;
    scene.clearQuestMarker("jjookQuest");
    if (scene.selectedDrink) {
      scene.drinkInventory.push(scene.selectedDrink.key);
      scene.showQuestToast(`${scene.selectedDrink.label}를 마셨어. 해냄이와 쭉쭉이 이동 속도 UP`);
    }
    scene.activateDrinkSpeedBuff();
    this.activateFollower();
    scene.shouldCompleteJjookAfterDrink = false;
    scene.selectedDrink = null;
    scene.saveCheckpoint("jjook_completed");
    scene.dialogueSystem?.start([
      { name: "해냄이", portraitKey: "haenaem_touched", text: "잘 먹었어. 고마워! 시원하다!" },
      { name: "쭉쭉이", portraitKey: "jjook_plogging", text: "나도 플로깅을 좋아해. 이제 내가 쓰레기 정리를 도와줄게. 같이 하자!" },
    ]);
  }

  buyThanksCola() {
    const scene = this.scene;
    if (scene.moneySystem?.deductMoney(GAME_CONFIG.drinkPrice)) {
      scene.showQuestToast("고마운 마음으로 쭉쭉이에게 콜라를 사줬어. -1,000원", 2600);
      scene.playItemPickupSound();
      scene.showSpeechBubble(scene.jjookNpc || scene.player, "콜라 고마워!", 2600);
      return;
    }

    scene.showQuestToast("콜라를 사주고 싶었지만 돈이 조금 부족해.", 2600);
    scene.showSpeechBubble(scene.player, "다음엔 꼭 콜라 사줄게!", 2200);
  }
}
