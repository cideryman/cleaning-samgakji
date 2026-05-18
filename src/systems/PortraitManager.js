import { DIALOGUE_OVERLAY_TEXTURES } from "../config/GameConstants.js";

export default class PortraitManager {
  constructor(scene) {
    this.scene = scene;
    this.image = null;
    this.textureKey = null;
    this.options = {};
    this.resizeHandler = () => this.updateLayout();

    window.addEventListener("resize", this.resizeHandler);
    window.addEventListener("orientationchange", this.resizeHandler);
    window.visualViewport?.addEventListener("resize", this.resizeHandler);
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.resizeHandler);
  }

  show(line) {
    const textureKey = this.getTextureKey(line);
    if (!textureKey || !this.scene.textures.exists(textureKey)) {
      this.clear();
      return;
    }

    this.clear();
    this.textureKey = textureKey;
    this.options = line.overlayOptions || {};

    this.image = this.scene.add.image(0, 0, textureKey);
    this.image.setScrollFactor(0);
    this.image.setDepth(61);
    this.image.setOrigin(0, 1);
    this.image.setAlpha(0);
    this.image.setTintFill(0xffffff);
    this.scene.interiorSceneGroup?.add(this.image);
    this.scene.interiorSpeaker = this.scene.interiorSceneGroup ? this.image : null;

    this.updateLayout();
    requestAnimationFrame(() => this.updateLayout());

    this.scene.tweens.add({
      targets: this.image,
      alpha: 1,
      x: this.image.x + 8,
      duration: 180,
      ease: "Sine.easeOut",
      onComplete: () => this.image?.clearTint(),
    });
  }

  updateLayout() {
    if (!this.image?.active || !this.textureKey) return;

    const viewport = this.getViewportSize();
    const panelRect = document.querySelector(".dialog-panel")?.getBoundingClientRect();
    const panelLeft = panelRect?.left ?? viewport.width * 0.18;
    const panelTop = panelRect?.top ?? viewport.height - 168;
    const panelOverlap = this.options.panelOverlap ?? 2;
    const maxWidth = this.getMaxWidth(viewport);
    const speakerLeft = Phaser.Math.Clamp(
      this.options.x ?? Math.round(panelLeft),
      12,
      Math.max(12, viewport.width - maxWidth - 8),
    );
    const speakerBottom = Phaser.Math.Clamp(
      this.options.y ?? Math.round(panelTop + panelOverlap),
      72,
      Math.max(72, viewport.height - 24),
    );

    document.querySelector(".dialog-modal")?.style.setProperty("--dialog-scene-left", `${speakerLeft}px`);
    this.image.setPosition(speakerLeft, speakerBottom);
    this.applyScale(viewport, speakerBottom);
  }

  clear() {
    this.image?.destroy();
    this.image = null;
    this.textureKey = null;
    this.options = {};
    this.scene.interiorSpeaker = null;
  }

  destroy() {
    this.clear();
    window.removeEventListener("resize", this.resizeHandler);
    window.removeEventListener("orientationchange", this.resizeHandler);
    window.visualViewport?.removeEventListener("resize", this.resizeHandler);
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.resizeHandler);
  }

  getTextureKey(line) {
    if (!line) return null;

    const requestedKey = line.overlayKey || line.portraitKey;
    if (!requestedKey) return null;
    return DIALOGUE_OVERLAY_TEXTURES[requestedKey] || requestedKey;
  }

  getViewportSize() {
    return {
      width: Math.max(1, Math.round(window.visualViewport?.width || window.innerWidth || this.scene.scale.width || 768)),
      height: Math.max(1, Math.round(window.visualViewport?.height || window.innerHeight || this.scene.scale.height || 480)),
    };
  }

  applyScale(viewport, speakerBottom) {
    const texture = this.scene.textures.get(this.textureKey);
    const source = texture.getSourceImage();
    const sourceWidth = Math.max(1, source?.width || 400);
    const sourceHeight = Math.max(1, source?.height || 400);
    const maxWidth = this.getMaxWidth(viewport);
    const availableHeight = Math.max(96, speakerBottom - 8);
    const maxHeight = Math.min(this.options.maxHeight ?? viewport.height * 0.62, availableHeight);
    const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
    this.image.setScale(scale);
  }

  getMaxWidth(viewport) {
    return this.options.maxWidth ?? Phaser.Math.Clamp(viewport.width * 0.24, 120, 280);
  }
}
