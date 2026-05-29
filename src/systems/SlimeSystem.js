import { GAME_CONFIG, TRASH_TEXTURES } from "../config/GameConstants.js";

export default class SlimeSystem {
  constructor(scene) {
    this.scene = scene;
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

    // 2️⃣ 8% 확률로 친환경 특수 재활용 자원 스폰
    const isSpecial = Math.random() < 0.08;
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
        scene.tweens.add({
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

  // 2️⃣ 친환경 특수 쓰레기용 스프라이트 생성기 (황금빛 틴트 + 150ms 분출 파티클)
  createSpecialTrashSprite(x, y, specialType) {
    const scene = this.scene;
    let baseType = "normal";
    if (specialType === "golden_can") baseType = "can";
    else if (specialType === "label_pet") baseType = "plastic";

    const textureKey = this.getRandomTrashTexture(baseType);
    const slime = scene.trashSlimes.create(x, y, textureKey);
    const displaySize = this.getTrashDisplaySize(textureKey, baseType);
    
    // 특수 자원의 시각 인지 향상을 위해 1.15배 소폭 스케일 확대
    slime.setDisplaySize(displaySize.width * 1.15, displaySize.height * 1.15);
    slime.refreshBody();
    slime.setDepth(5); // 일반 쓰레기보다 위에 출력
    slime.setData("cleaned", false);
    slime.setData("trashType", baseType);
    slime.setData("specialType", specialType);

    // 선명한 황금빛 틴트(색조) 강제 적용
    slime.setTint(0xffeb3b);

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
        // 부유 모션
        scene.tweens.add({
          targets: slime,
          y: y - 7,
          duration: 750,
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
}
