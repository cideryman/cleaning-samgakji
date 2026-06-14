export default class InteriorSceneSystem {
  constructor(scene) {
    this.scene = scene;
  }

  show(textureKey, type = "hospital") {
    const scene = this.scene;
    this.clear();

    // Clear any active HTML quest toasts, overlays, or money popups to prevent overlap during interior scenes
    document.querySelectorAll(".quest-toast").forEach((el) => el.remove());
    document.querySelectorAll(".money-reward-pop").forEach((el) => el.remove());
    document.querySelectorAll(".special-overlay-pop").forEach((el) => el.remove());

    document.body.classList.add("interior-scene-active");
    document.body.dataset.interiorScene = type;
    scene.interiorSceneGroup = scene.add.group();
    scene.interiorSceneType = type;

    const viewportWidth = Math.max(768, scene.scale.width || 768);
    const viewportHeight = Math.max(480, scene.scale.height || 480);
    const centerX = viewportWidth / 2;
    const centerY = viewportHeight / 2;
    const overscan = 1.18;
    const fillColor = type === "ending" ? 0x000000 : type === "pharmacy" ? 0xe9ded2 : 0xded2c4;
    const dimAlpha = type === "ending" ? 0 : 0.35;

    const solidBack = scene.add.rectangle(
      centerX,
      centerY,
      viewportWidth * 2,
      viewportHeight * 2,
      fillColor,
      1,
    );
    solidBack.setScrollFactor(0);
    solidBack.setDepth(58);
    scene.interiorSceneGroup.add(solidBack);

    if (dimAlpha > 0) {
      const dim = scene.add.rectangle(centerX, centerY, viewportWidth * 2, viewportHeight * 2, 0x000000, dimAlpha);
      dim.setScrollFactor(0);
      dim.setDepth(59);
      scene.interiorSceneGroup.add(dim);
    }

    const bg = scene.add.image(centerX, centerY, textureKey);
    bg.setScrollFactor(0);
    this.fitBackground(bg, viewportWidth * overscan, viewportHeight * overscan);
    bg.setDepth(60);
    scene.interiorSceneGroup.add(bg);
  }

  fitBackground(image, targetWidth, targetHeight) {
    const scene = this.scene;
    const texture = scene.textures.get(image.texture.key);
    const source = texture?.getSourceImage?.();
    const sourceWidth = Math.max(1, source?.width || image.width || 1);
    const sourceHeight = Math.max(1, source?.height || image.height || 1);
    const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);
    image.setScale(scale);
  }

  clear() {
    const scene = this.scene;
    scene.interiorSceneGroup?.clear(true, true);
    scene.interiorSceneGroup = null;
    scene.interiorSpeaker = null;
    scene.interiorSceneType = null;
    document.body.classList.remove("interior-scene-active");
    delete document.body.dataset.interiorScene;
  }

  showFloatingItem(textureKey, x, y, size = 64, fixedToCamera = false, options = {}) {
    const scene = this.scene;
    if (!scene.textures.exists(textureKey)) {
      options.onComplete?.();
      return;
    }

    const item = scene.add.image(x, y, textureKey);
    item.setDepth(72);
    if (fixedToCamera) item.setScrollFactor(0);
    if (typeof size === "object") {
      item.setDisplaySize(size.width, size.height);
    } else {
      item.setDisplaySize(size, size);
    }
    item.setAlpha(0);
    scene.tweens.add({
      targets: item,
      alpha: 1,
      y: y + (options.floatY ?? -18),
      duration: options.duration ?? 280,
      ease: "Back.easeOut",
      yoyo: true,
      hold: options.hold ?? 760,
      onComplete: () => {
        item.destroy();
        options.onComplete?.();
      },
    });
  }

  playPaymentAnimation(textureKey, onComplete) {
    const scene = this.scene;
    const bill = scene.add.image(384, 250, textureKey);
    bill.setScrollFactor(0);
    bill.setDisplaySize(132, 80);
    bill.setDepth(71);
    bill.setAlpha(0);
    scene.playTone({ frequency: 880, duration: 0.08, type: "triangle", volume: 0.06 });
    scene.tweens.add({
      targets: bill,
      alpha: 1,
      y: 205,
      duration: 240,
      ease: "Back.easeOut",
      onComplete: () => {
        scene.playTone({ frequency: 1240, duration: 0.08, type: "square", volume: 0.045 });
        scene.tweens.add({
          targets: bill,
          x: 520,
          y: 220,
          scaleX: bill.scaleX * 0.25,
          scaleY: bill.scaleY * 0.25,
          alpha: 0,
          duration: 460,
          ease: "Cubic.easeIn",
          onComplete: () => {
            bill.destroy();
            onComplete?.();
          },
        });
      },
    });
  }
}
