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
