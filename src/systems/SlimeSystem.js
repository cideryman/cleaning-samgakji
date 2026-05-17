import { GAME_CONFIG, TRASH_TEXTURES } from "../config/GameConstants.js";

export default class SlimeSystem {
  constructor(scene) {
    this.scene = scene;
  }

  respawnSlime() {
    const scene = this.scene;
    const positions = scene.createRandomSlimePositions();
    if (positions.length === 0) return;
    const [x, y] = positions[0];

    const trashType = Math.random() < 0.2 ? "can" : this.getRandomNonCanTrashType();
    this.createTrashSprite(x, y, trashType);
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
