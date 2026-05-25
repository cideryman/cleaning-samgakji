import { GAME_CONFIG } from "../config/GameConstants.js";

export default class JjookQuestSystem {
  constructor(scene) {
    this.scene = scene;
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
    if (scene.isInDialogue || !scene.dialogueSystem || scene.jjookQuestState === "locked") return;
    if (!scene.isPlayerNearJjookNpc()) return;

    if (scene.jjookQuestState === "wallet_missing") {
      scene.dialogueSystem.start([
        { name: "쭉쭉이", portraitKey: "jjook_lost", text: "아... 이동하다가 지갑을 잃어버렸어. 목도 너무 마른데 어떡하지?" },
        { name: "쭉쭉이", portraitKey: "jjook_lost", text: "혹시 근처 화단이나 벤치 밑을 같이 봐줄래? 갈색 지갑이야." },
      ], () => {
        if (!scene.walletItem?.active && !scene.hasWallet) scene.spawnWalletItem();
      });
      return;
    }

    if (scene.jjookQuestState === "wallet_found") {
      scene.dialogueSystem.start([
        { name: "쭉쭉이", portraitKey: "jjook_found", text: "지갑을 찾아줘서 정말 고마워. 보답으로 시원한 음료수 하나 사줄게. 뭐 마실래?" },
      ], () => scene.openVendingMenu({ completeQuestOnSelect: true }));
      return;
    }

    if (scene.jjookQuestState !== "completed") return;

    if (scene.clothesQuestState === "ready" || scene.clothesQuestState === "declined") {
      this.startClothesQuestDialogue();
      return;
    }

    if (scene.clothesQuestState === "shopping") {
      scene.dialogueSystem.start([
        { name: "쭉쭉이", portraitKey: "jjook_expectant", text: "옷가게는 맵 위쪽 상점가에 있어. 같이 가보자!" },
      ]);
      return;
    }

    if (scene.clothesQuestState === "completed" && ["offered", "declined"].includes(scene.packingQuestState)) {
      scene.startPackingOfferDialogue({ repeat: scene.packingQuestState === "declined" });
      return;
    }

    if (scene.clothesQuestState === "completed" && scene.packingQuestState === "going_bus_stop") {
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

    scene.dialogueSystem.start([
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
    scene.clothesQuestState = "shopping";
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
    scene.clothesQuestState = "declined";
    scene.hasAnnouncedClothesQuest = true;
    scene.setQuestMarker("clothesQuest", scene.jjookNpc, "!");
    scene.saveCheckpoint("clothes_declined");
  }

  updateFollower() {
    const scene = this.scene;
    if ((!scene.isJjookFollowActive && !scene.isJjookClothesEscortActive && !scene.isJjookBusEscortActive) || !scene.jjookNpc || !scene.player) return;
    this.stopIdleTween();

    const distance = Phaser.Math.Distance.Between(scene.jjookNpc.x, scene.jjookNpc.y, scene.player.x, scene.player.y);
    const followDistance = scene.isJjookBusEscortActive ? 76 : 88;
    if (distance <= followDistance) {
      scene.stopNpcWalk(scene.jjookNpc, "jjook");
      return;
    }

    const baseFollowSpeed = scene.isJjookClothesEscortActive ? GAME_CONFIG.playerSpeed * 1.55 : 118;
    const boostedFollowSpeed = scene.isSpeedBuffActive ? baseFollowSpeed * GAME_CONFIG.speedBuffMultiplier : baseFollowSpeed;
    const followSpeed = distance > 220 ? boostedFollowSpeed * 1.35 : boostedFollowSpeed;
    const step = (scene.game.loop.delta / 1000) * followSpeed;
    const angle = Phaser.Math.Angle.Between(scene.jjookNpc.x, scene.jjookNpc.y, scene.player.x, scene.player.y);
    const moveX = Math.cos(angle) * Math.min(step, distance - followDistance);
    const moveY = Math.sin(angle) * Math.min(step, distance - followDistance);
    scene.jjookNpc.x += moveX;
    scene.jjookNpc.y += moveY;
    const directionKey = scene.getDirectionKeyFromVector(moveX, moveY, scene.jjookNpc.getData("directionKey") || "down");
    scene.setNpcDirectionTexture(scene.jjookNpc, "jjook", directionKey, true);
  }

  updateAutoPlogging() {
    const scene = this.scene;
    if (!scene.isJjookFollowActive || !scene.jjookNpc?.active || !scene.trashSlimes) return;
    if (scene.isInDialogue || scene.interiorSceneGroup || scene.time.now < scene.nextJjookAutoCleanAt) return;

    const target = this.findNearestTrashTo(scene.jjookNpc, GAME_CONFIG.jjookAutoCleanRadius);
    if (!target) return;

    scene.nextJjookAutoCleanAt = scene.time.now + GAME_CONFIG.jjookAutoCleanCooldownMs;
    const direction = new Phaser.Math.Vector2(target.x - scene.jjookNpc.x, target.y - scene.jjookNpc.y);
    if (direction.lengthSq() > 0) {
      direction.normalize();
      const directionKey = scene.getDirectionKeyFromVector(direction.x, direction.y, scene.jjookNpc.getData("directionKey") || "down");
      scene.setNpcDirectionTexture(scene.jjookNpc, "jjook", directionKey, true);
    }

    scene.playSweepSound();
    scene.showSweepEffect(target.x, target.y, 78, 60, direction.lengthSq() > 0 ? direction : null);
    scene.time.delayedCall(90, () => {
      if (!target?.active || target.getData("cleaned")) return;
      const trashType = target.getData("trashType") || "normal";
      if (trashType === "can") {
        scene.playCanCleanSound();
      } else {
        scene.playCleanSound();
      }
      scene.autoCleanTrash(target, { shouldRespawn: true });
      if (Phaser.Math.Between(0, 99) < 20) {
        scene.showSpeechBubble(scene.jjookNpc, "여기도 치울게!", 1200);
      }
    });
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
    scene.jjookQuestState = "completed";
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
    scene.jjookQuestState = "completed";
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
