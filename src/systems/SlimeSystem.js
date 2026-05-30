import { GAME_CONFIG, TRASH_TEXTURES } from "../config/GameConstants.js";

export default class SlimeSystem {
  constructor(scene) {
    this.scene = scene;
    this.respawnTimer = null;
  }

  startRespawnLoop() {
    const scene = this.scene;
    if (this.respawnTimer) {
      this.respawnTimer.destroy();
      this.respawnTimer = null;
    }

    this.respawnTimer = scene.time.addEvent({
      delay: GAME_CONFIG.slimeRespawnDelayMs || 12000,
      loop: true,
      callback: () => {
        // Do not spawn slimes during introductory tutorial
        if (
          scene.tutorialState === "intro" ||
          scene.tutorialState === "move" ||
          scene.tutorialState === "sweep" ||
          scene.tutorialState === "deposit" ||
          scene.tutorialState === "npc"
        ) {
          return;
        }

        const activeSlimes = scene.trashSlimes
          .getChildren()
          .filter((s) => s.active && !s.getData("cleaned")).length;
        if (activeSlimes < GAME_CONFIG.maxSlimes) {
          this.respawnSlime();
        }
      },
    });
  }

  respawnSlime() {
    const scene = this.scene;
    const cam = scene.cameras.main;
    const view = cam ? cam.worldView : null;

    let positions = scene.createRandomSlimePositions();
    
    // 4️⃣ 리스폰 조절: 플레이어 카메라 뷰포트 내 즉시 생성 방지 (화면 밖 뿅 차단)
    if (view && positions.length > 0) {
      const buffer = 32; // 최소 32px 이상 화면 바깥 영역만 허용
      const offscreenPositions = positions.filter(([x, y]) => {
        return (
          x < view.left - buffer ||
          x > view.right + buffer ||
          y < view.top - buffer ||
          y > view.bottom + buffer
        );
      });
      if (offscreenPositions.length > 0) {
        positions = offscreenPositions;
      }
    }

    if (positions.length === 0) return;
    
    // 필터링된 지점 중 무작위 1개 점 선택
    const [x, y] = Phaser.Utils.Array.GetRandom(positions);

    // 2️⃣ 친환경 특수 재활용 자원 스폰 (설정된 저확률 반영)
    const isSpecial = Math.random() < (GAME_CONFIG.specialTrashSpawnChance || 0.005);
    if (isSpecial) {
      const specialTypes = ["golden_can", "clean_bottle", "label_pet", "bundled_paper"];
      const specialType = Phaser.Utils.Array.GetRandom(specialTypes);
      this.createSpecialTrashSprite(x, y, specialType);
    } else {
      const trashType = Math.random() < 0.2 ? "can" : this.getRandomNonCanTrashType();
      this.createTrashSprite(x, y, trashType);
    }
  }

  createTrashSprite(x, y, trashType = "normal") {
    const scene = this.scene;
    const normalizedType = trashType === "slime" ? "normal" : trashType;
    const textureKey = this.getRandomTrashTexture(normalizedType);
    const slime = scene.trashSlimes.create(x, y, textureKey);

    // Set a random static frame to avoid awkward morphing animation
    this.setRandomTrashFrame(slime, textureKey);

    const displaySize = this.getTrashDisplaySize(textureKey, normalizedType);
    slime.setDisplaySize(displaySize.width, displaySize.height);
    slime.refreshBody();
    slime.setDepth(4);
    slime.setData("cleaned", false);
    slime.setData("trashType", normalizedType);
    slime.setAlpha(0);
    slime.setScale(0.35);

    scene.tweens.add({
      targets: slime,
      alpha: 1,
      scaleX: displaySize.width / slime.width,
      scaleY: displaySize.height / slime.height,
      duration: 220,
      ease: "Back.easeOut",
      onComplete: () => {
        // Slow organic wind sway tween (gentle X/Y drift + subtle rotation)
        scene.tweens.add({
          targets: slime,
          x: x + Phaser.Math.Between(-8, 8),
          y: y + Phaser.Math.Between(-6, 6),
          rotation: Phaser.Math.FloatBetween(-0.12, 0.12),
          duration: Phaser.Math.Between(1800, 2600),
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      },
    });
    return slime;
  }

  // 2️⃣ 친환경 특수 쓰레기용 스프라이트 생성기 (황금빛 틴트 + 150ms 분출 파티클)
  createSpecialTrashSprite(x, y, specialType) {
    const scene = this.scene;
    let textureKey = "";
    let baseType = "normal";

    if (specialType === "golden_can") {
      textureKey = "special_golden_can";
      baseType = "can";
    } else if (specialType === "label_pet") {
      textureKey = "special_label_pet";
      baseType = "plastic";
    } else if (specialType === "bundled_paper") {
      textureKey = "special_bundled_paper";
      baseType = "normal";
    } else if (specialType === "clean_bottle") {
      textureKey = "special_clean_bottle";
      baseType = "plastic";
    } else {
      textureKey = "trash_plastic"; // fallback
      baseType = "plastic";
    }

    if (!scene.textures.exists(textureKey)) {
      textureKey = this.getRandomTrashTexture(baseType);
    }

    const slime = scene.trashSlimes.create(x, y, textureKey);

    // Set a random static frame if it's a spritesheet texture
    this.setRandomTrashFrame(slime, textureKey);

    const displaySize = this.getTrashDisplaySize(textureKey, baseType);
    
    // 특수 자원의 시각 인지 향상을 위해 1.15배 소폭 스케일 확대
    slime.setDisplaySize(displaySize.width * 1.15, displaySize.height * 1.15);
    slime.refreshBody();
    slime.setDepth(5); // 일반 쓰레기보다 위에 출력
    slime.setData("cleaned", false);
    slime.setData("trashType", baseType);
    slime.setData("specialType", specialType);

    slime.setAlpha(0);
    slime.setScale(0.35);

    scene.tweens.add({
      targets: slime,
      alpha: 1,
      scaleX: (displaySize.width * 1.15) / slime.width,
      scaleY: (displaySize.height * 1.15) / slime.height,
      duration: 220,
      ease: "Back.easeOut",
      onComplete: () => {
        // Slow organic wind sway tween (gentle X/Y drift + subtle rotation)
        scene.tweens.add({
          targets: slime,
          x: x + Phaser.Math.Between(-8, 8),
          y: y + Phaser.Math.Between(-6, 6),
          rotation: Phaser.Math.FloatBetween(-0.12, 0.12),
          duration: Phaser.Math.Between(1800, 2600),
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });

        // 150ms 주기의 활발한 위로 치솟는 황금빛 파티클 분출 효과음 연계
        const particleTimer = scene.time.addEvent({
          delay: 150,
          loop: true,
          callback: () => {
            if (!slime.active || slime.getData("cleaned")) {
              particleTimer.destroy();
              return;
            }
            const sparkle = scene.add.circle(
              slime.x + Phaser.Math.Between(-14, 14),
              slime.y + Phaser.Math.Between(-14, 14),
              Phaser.Math.Between(3, 5),
              0xffeb3b,
              1
            );
            sparkle.setDepth(7);
            scene.tweens.add({
              targets: sparkle,
              y: sparkle.y - Phaser.Math.Between(15, 30),
              alpha: 0,
              scaleX: 0.2,
              scaleY: 0.2,
              duration: 380,
              ease: "Quad.easeOut",
              onComplete: () => sparkle.destroy()
            });
          }
        });
      },
    });

    return slime;
  }

  getRandomNonCanTrashType() {
    return Math.random() < 0.18 && this.scene.textures.exists("trash_plastic") ? "plastic" : "normal";
  }

  getRandomTrashTexture(trashType) {
    const textureKeys = TRASH_TEXTURES[trashType] || TRASH_TEXTURES.normal;
    const fallback = trashType === "can" ? "trash_can" : "trash_slime";
    const availableKeys = textureKeys.filter((key) => this.scene.textures.exists(key));
    return Phaser.Utils.Array.GetRandom(availableKeys.length > 0 ? availableKeys : [fallback]);
  }

  getTrashDisplaySize(textureKey, trashType) {
    if (textureKey === "special_golden_can" || textureKey === "special_label_pet" || textureKey === "special_bundled_paper") {
      return { width: 50, height: 50 }; // Increased from 42 to 50
    }

    if (trashType === "plastic") {
      return { width: 36, height: 41 }; // Increased from 30x34 to 36x41
    }

    if (trashType !== "can") {
      return {
        width: GAME_CONFIG.slimeDisplaySize,
        height: GAME_CONFIG.slimeDisplaySize,
      };
    }

    if (textureKey === "trash_can_2") {
      return { width: 29, height: 38 }; // Increased from 24x32 to 29x38
    }

    return { width: 41, height: 28 }; // Increased from 34x23 to 41x28
  }

  setRandomTrashFrame(slime, textureKey) {
    const frameCounts = {
      trash_slime: 4,
      trash_slime_2: 3,
      trash_can: 3,
      trash_can_2: 3,
      trash_can_3: 4,
      trash_plastic: 3
    };
    const maxFrames = frameCounts[textureKey] || 1;
    if (maxFrames > 1) {
      const randomFrame = Phaser.Math.Between(0, maxFrames - 1);
      slime.setFrame(randomFrame);
    }
  }
}
