import { GAME_CONFIG } from "../config/GameConstants.js";

export default class CleaningSystem {
  constructor(scene) {
    this.scene = scene;
  }

  trySweep() {
    const scene = this.scene;
    if (!scene.canSweep || scene.isMissionComplete) return;
    scene.unlockAudio();

    scene.canSweep = false;
    scene.time.delayedCall(GAME_CONFIG.sweepCooldownMs, () => {
      scene.canSweep = true;
    });

    const multiplier = this.getSweepMultiplier();
    const width = GAME_CONFIG.baseSweepWidth * multiplier;
    const height = GAME_CONFIG.baseSweepHeight * multiplier;
    const offset = 42 * multiplier;
    const sweepX = scene.player.x + scene.lastDirection.x * offset;
    const sweepY = scene.player.y + scene.lastDirection.y * offset;

    scene.playSweepSound();
    this.performSweepAt(sweepX, sweepY, width, height, scene.lastDirection);

    if (scene.isJjookFollowActive && scene.jjookNpc?.active) {
      const jjookWidth = width * 0.92;
      const jjookHeight = height * 0.92;
      this.performSweepAt(scene.jjookNpc.x, scene.jjookNpc.y + 8, jjookWidth, jjookHeight, null);
    }
  }

  getSweepMultiplier() {
    const scene = this.scene;
    const broomMultiplier = scene.hasBroomUpgrade ? GAME_CONFIG.upgradedSweepMultiplier : 1;
    const bacchusMultiplier = scene.isBacchusActive ? GAME_CONFIG.bacchusSweepMultiplier : 1;
    return Math.max(broomMultiplier, bacchusMultiplier);
  }

  performSweepAt(x, y, width, height, direction = null) {
    const scene = this.scene;
    const sweepZone = scene.add.zone(x, y, width, height);
    scene.physics.add.existing(sweepZone);
    sweepZone.body.setAllowGravity(false);

    this.showSweepEffect(x, y, width, height, direction);

    scene.physics.overlap(sweepZone, scene.trashSlimes, (_, slime) => {
      this.cleanTrash(slime);
    });

    scene.time.delayedCall(80, () => sweepZone.destroy());
  }

  showSweepEffect(x, y, width, height, direction = this.scene.lastDirection) {
    const scene = this.scene;
    const sweepFlash = scene.add.ellipse(x, y, width, height, 0xfff3a3, 0.42);
    sweepFlash.setStrokeStyle(5, 0xf2c94c, 0.9);
    sweepFlash.setDepth(6);

    const broomGhost = scene.add.image(x, y, "broom_item");
    broomGhost.setDisplaySize(48, 48);
    broomGhost.setAlpha(0.75);
    broomGhost.setDepth(7);
    broomGhost.setRotation((direction || scene.lastDirection).angle() + 0.8);
    const broomGhostScale = broomGhost.scaleX;

    scene.tweens.add({
      targets: sweepFlash,
      alpha: 0,
      scaleX: 1.18,
      scaleY: 1.18,
      duration: 180,
      ease: "Cubic.easeOut",
      onComplete: () => sweepFlash.destroy(),
    });

    scene.tweens.add({
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
      const dust = scene.add.circle(
        x + Phaser.Math.Between(-width / 3, width / 3),
        y + Phaser.Math.Between(-height / 3, height / 3),
        Phaser.Math.Between(3, 6),
        0xffffff,
        0.8,
      );
      dust.setDepth(7);
      scene.tweens.add({
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
    const scene = this.scene;
    if (slime.getData("cleaned")) return;

    slime.setData("cleaned", true);
    const slimeX = slime.x;
    const slimeY = slime.y;
    slime.body.enable = false;
    scene.totalCleanedCount += 1;
    scene.waveCleanedCount += 1;
    const trashType = slime.getData("trashType") || "normal";
    const isCanTrash = trashType === "can";
    if (isCanTrash) {
      scene.cleanedCanCount += 1;
      scene.questManager?.updateQuestProgress(1);
    }
    this.addTrashToRecycleInventory(trashType);

    const reward = this.getTrashCleanReward();
    scene.moneySystem.addMoney(reward);

    if (isCanTrash) {
      scene.playCanCleanSound();
    } else {
      scene.playCleanSound();
    }
    this.showSlimePop(slime);
    this.showCleanFeedback(slimeX, slimeY, isCanTrash);
    scene.updateHud();

    scene.time.delayedCall(GAME_CONFIG.slimeRespawnDelayMs, () => {
      if (scene.trashSlimes.getChildren().length < GAME_CONFIG.maxSlimes) {
        scene.slimeSystem.respawnSlime();
      }
    });
  }

  addTrashToRecycleInventory(type) {
    const scene = this.scene;
    const normalizedType = type === "slime" ? "normal" : type;
    if (!(normalizedType in scene.recyclingInventory)) return;

    scene.recyclingInventory[normalizedType] += 1;
    const labelByType = {
      normal: "일반 쓰레기",
      can: "캔",
      plastic: "플라스틱",
    };
    scene.queueInventoryCaption(`${labelByType[normalizedType]} +1`);
  }

  getTrashCleanReward() {
    return this.scene.isJjookFollowActive ? GAME_CONFIG.rewardPerSlime * 2 : GAME_CONFIG.rewardPerSlime;
  }

  showSlimePop(slime) {
    const scene = this.scene;
    scene.tweens.killTweensOf(slime);
    slime.setDepth(8);

    scene.tweens.add({
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
    const scene = this.scene;
    const cleanRing = scene.add.circle(x, y, 8, 0xffffff, 0);
    cleanRing.setStrokeStyle(4, isCanFeedback ? 0x9fd1ff : 0xffffff, 0.95);
    cleanRing.setDepth(6);

    scene.tweens.add({
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
      const sparkle = scene.add.circle(x, y, Phaser.Math.Between(3, 5), sparkleColor, 1);
      sparkle.setDepth(7);
      scene.tweens.add({
        targets: sparkle,
        x: x + Phaser.Math.Between(-42, 42),
        y: y + Phaser.Math.Between(-42, 42),
        alpha: 0,
        duration: 460,
        onComplete: () => sparkle.destroy(),
      });
    }
  }

  autoCleanTrash(trash) {
    const scene = this.scene;
    if (!trash?.active || trash.getData("cleaned")) return;

    trash.setData("cleaned", true);
    if (trash.body) trash.body.enable = false;
    scene.totalCleanedCount += 1;
    scene.waveCleanedCount += 1;
    const trashType = trash.getData("trashType") || "normal";
    if (trashType === "can") {
      scene.cleanedCanCount += 1;
      scene.questManager?.updateQuestProgress(1);
    }
    this.addTrashToRecycleInventory(trashType);
    scene.moneySystem.addMoney(this.getTrashCleanReward());
    this.showCleanFeedback(trash.x, trash.y);
    this.showSlimePop(trash);
    scene.updateHud();
  }
}
