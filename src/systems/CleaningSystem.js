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

    // Set animation lock flag during sweeping (300ms)
    scene.isSweeping = true;
    scene.time.delayedCall(300, () => {
      scene.isSweeping = false;
      // 빗자루질이 끝나면 즉시 원래 서 있는 방향의 걷기 텍스처와 크기(64x96)로 자연스럽게 복원합니다.
      if (scene.player && scene.playerController) {
        scene.playerController.setPlayerDirectionTexture(dirKey, false);
      }
    });

    // Play sweeping animation matching facing direction
    const dirKey = scene.playerDirectionKey || "down";
    const sweepAnimKey = `haenaem_sweep_${dirKey}_anim`;
    if (scene.player && scene.anims.exists(sweepAnimKey)) {
      scene.player.anims.play(sweepAnimKey, true);
      // 쓸기 스프라이트는 빗자루 범위까지 포함해 90x96 크기로 제작되어 있어, 몸집이 상대적으로 작아 보일 수 있습니다.
      // 이를 해결하기 위해 쓸기 모션 동안 캐릭터 크기를 1.15배 확대하여 걷기 캐릭터와 시각적 비율을 완벽하게 맞춥니다.
      const sweepScale = 1.15;
      scene.player.setDisplaySize(90 * sweepScale, 96 * sweepScale);
    }

    const multiplier = this.getSweepMultiplier();
    const width = GAME_CONFIG.baseSweepWidth * multiplier;
    const height = GAME_CONFIG.baseSweepHeight * multiplier;
    const offset = 42 * multiplier;
    const sweepX = scene.player.x + scene.lastDirection.x * offset;
    const sweepY = scene.player.y + scene.lastDirection.y * offset;

    scene.playSweepSound();
    this.performSweepAt(sweepX, sweepY, width, height, scene.lastDirection);
  }

  getSweepMultiplier() {
    const scene = this.scene;
    const broomMultiplier = scene.hasBroomUpgrade ? GAME_CONFIG.upgradedSweepMultiplier : 1;
    return broomMultiplier;
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

    scene.tweens.add({
      targets: sweepFlash,
      alpha: 0,
      scaleX: 1.18,
      scaleY: 1.18,
      duration: 180,
      ease: "Cubic.easeOut",
      onComplete: () => sweepFlash.destroy(),
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
    const specialType = slime.getData("specialType") || null;
    const isSpecial = !!specialType;
    const isCanTrash = trashType === "can" || specialType === "golden_can";

    if (isCanTrash) {
      scene.cleanedCanCount += 1;
      scene.yebiQuestSystem?.updateQuestProgress(1);
    }
    this.addTrashToRecycleInventory(trashType, specialType);

    // 보상 지급 (특수 친환경 쓰레기는 대폭 상향된 보상액 적용)
    let reward = this.getTrashCleanReward();
    if (isSpecial) {
      reward = GAME_CONFIG.specialTrashReward || 2000;
    }
    scene.moneySystem.addMoney(reward);

    if (isCanTrash) {
      scene.playCanCleanSound();
    } else {
      scene.playCleanSound();
    }

    // 1️⃣ 일반 쓰레기 반응 텍스트는 1번 조치에 따라 전면 배제 (머리 위 혼잡 방지)
    // 2️⃣ 단, 친환경 특수 쓰레기 습득 시 각 종류당 최초 1회만 화면 중앙에 설명 오버레이 노출!
    if (isSpecial) {
      if (!scene.shownSpecialOverlays) {
        scene.shownSpecialOverlays = {};
      }
      if (!scene.shownSpecialOverlays[specialType]) {
        scene.shownSpecialOverlays[specialType] = true;
        scene.uiManager?.showSpecialWasteOverlay(specialType);
        scene.saveCheckpoint("special_overlay_" + specialType);
      }
    }

    this.showSlimePop(slime);
    this.showCleanFeedback(slimeX, slimeY, isCanTrash || isSpecial);
    scene.samgakjiProgressSystem?.refresh({ silent: true });
    scene.updateHud();

    scene.time.delayedCall(GAME_CONFIG.slimeRespawnDelayMs, () => {
      if (this.getActiveTrashCount() < GAME_CONFIG.maxSlimes) {
        scene.slimeSystem.respawnSlime();
      }
    });
  }

  addTrashToRecycleInventory(type, specialType = null) {
    const scene = this.scene;
    let normalizedType = type === "slime" ? "normal" : type;
    if (specialType) {
      // 특수 자원의 인벤토리 가산 규칙
      if (specialType === "golden_can") normalizedType = "can";
      else if (specialType === "label_pet") normalizedType = "plastic";
      else normalizedType = "normal"; // 깨끗이 헹군 병, 묶음 신문지
    }

    if (!(normalizedType in scene.recyclingInventory)) return;

    scene.recyclingInventory[normalizedType] += 1;
    
    // 특수 자원의 인벤토리 캡션 설명
    let captionText = "";
    if (specialType) {
      const specialCaptions = {
        golden_can: "황금 압축 캔 +1",
        clean_bottle: "깨끗이 헹군 병 +1",
        label_pet: "라벨 뗀 투명 페트 +1",
        bundled_paper: "차곡차곡 묶음 신문지 +1",
      };
      captionText = specialCaptions[specialType] || "특수 자원 +1";
    } else {
      const labelByType = {
        normal: "일반 쓰레기",
        can: "캔",
        plastic: "플라스틱",
      };
      captionText = `${labelByType[normalizedType]} +1`;
    }
    
    // 토스트 캡션이 UIManager의 순차적인 HTML Floating Pop Text 엔진으로 안전 배출됩니다.
    scene.queueInventoryCaption(captionText);
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

  autoCleanTrash(trash, { shouldRespawn = false } = {}) {
    const scene = this.scene;
    if (!trash?.active || trash.getData("cleaned")) return;

    trash.setData("cleaned", true);
    if (trash.body) trash.body.enable = false;
    scene.totalCleanedCount += 1;
    scene.waveCleanedCount += 1;
    
    const trashType = trash.getData("trashType") || "normal";
    const specialType = trash.getData("specialType") || null;
    const isSpecial = !!specialType;
    const isCanTrash = trashType === "can" || specialType === "golden_can";

    if (isCanTrash) {
      scene.cleanedCanCount += 1;
      scene.yebiQuestSystem?.updateQuestProgress(1);
    }
    this.addTrashToRecycleInventory(trashType, specialType);

    // 보상 지급 (특수 친환경 쓰레기는 대폭 상향된 보상액 적용)
    let reward = this.getTrashCleanReward();
    if (isSpecial) {
      reward = GAME_CONFIG.specialTrashReward || 2000;
    }
    scene.moneySystem.addMoney(reward);

    if (isCanTrash) {
      scene.playCanCleanSound();
    } else {
      scene.playCleanSound();
    }

    // 1️⃣ 일반 쓰레기 반응 텍스트는 전면 배제 (머리 위 혼잡 방지)
    // 2️⃣ 단, 친환경 특수 쓰레기 습득 시 각 종류당 최초 1회만 화면 중앙에 설명 오버레이 노출!
    if (isSpecial) {
      if (!scene.shownSpecialOverlays) {
        scene.shownSpecialOverlays = {};
      }
      if (!scene.shownSpecialOverlays[specialType]) {
        scene.shownSpecialOverlays[specialType] = true;
        scene.uiManager?.showSpecialWasteOverlay(specialType);
        scene.saveCheckpoint("special_overlay_" + specialType);
      }
    }

    this.showCleanFeedback(trash.x, trash.y, isCanTrash || isSpecial);
    this.showSlimePop(trash);
    scene.samgakjiProgressSystem?.refresh({ silent: true });
    scene.updateHud();

    if (shouldRespawn) {
      scene.time.delayedCall(GAME_CONFIG.slimeRespawnDelayMs, () => {
        if (this.getActiveTrashCount() < GAME_CONFIG.maxSlimes) {
          scene.slimeSystem.respawnSlime();
        }
      });
    }
  }

  getActiveTrashCount() {
    return this.scene.trashSlimes
      ?.getChildren()
      .filter((trash) => trash.active && !trash.getData("cleaned")).length || 0;
  }
}
