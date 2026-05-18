import { DIALOGUE_OVERLAY_PATHS, DIALOGUE_OVERLAY_TEXTURES } from "../config/GameConstants.js";

export default class PortraitManager {
  constructor(scene) {
    this.scene = scene;
    this.textureKey = null;
    this.options = {};
    this.dialogModal = document.querySelector("#dialogModal");
    this.dialogPanel = document.querySelector(".dialog-panel");
    this.element = document.createElement("img");
    this.element.className = "dialogue-portrait-overlay";
    this.element.alt = "";
    this.element.setAttribute("aria-hidden", "true");
    this.dialogModal?.appendChild(this.element);
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

    this.textureKey = textureKey;
    this.options = line.overlayOptions || {};

    const source = this.scene.textures.get(textureKey)?.getSourceImage?.();
    const sourceUrl = DIALOGUE_OVERLAY_PATHS[textureKey] || source?.currentSrc || source?.src;
    if (!sourceUrl) {
      this.clear();
      return;
    }

    this.element.src = sourceUrl;
    this.element.classList.add("is-visible");
    this.updateLayout();
    requestAnimationFrame(() => this.updateLayout());
  }

  updateLayout() {
    if (!this.textureKey || !this.element.classList.contains("is-visible")) return;

    const viewport = this.getViewportSize();
    const panelRect = this.dialogPanel?.getBoundingClientRect();
    if (!panelRect) return;

    const dimensions = this.getDisplayDimensions(viewport, panelRect.top);
    const left = Phaser.Math.Clamp(
      this.options.x ?? Math.round(panelRect.left + 12),
      8,
      Math.max(8, viewport.width - dimensions.width - 8),
    );
    const bottomEdge = Math.round(panelRect.top + (this.options.panelOverlap ?? 0));
    const top = Phaser.Math.Clamp(
      bottomEdge - dimensions.height,
      4,
      Math.max(4, viewport.height - dimensions.height - 4),
    );

    this.element.style.width = `${dimensions.width}px`;
    this.element.style.height = `${dimensions.height}px`;
    this.element.style.left = `${left}px`;
    this.element.style.top = `${top}px`;
  }

  clear() {
    this.element.classList.remove("is-visible");
    this.element.removeAttribute("src");
    this.element.removeAttribute("style");
    this.textureKey = null;
    this.options = {};
  }

  destroy() {
    this.clear();
    this.element.remove();
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
      width: Math.max(1, Math.round(window.visualViewport?.width || window.innerWidth || 768)),
      height: Math.max(1, Math.round(window.visualViewport?.height || window.innerHeight || 480)),
    };
  }

  getDisplayDimensions(viewport, panelTop) {
    const texture = this.scene.textures.get(this.textureKey);
    const frame = texture?.get()?.cutWidth ? texture.get() : null;
    const source = texture?.getSourceImage?.();
    const sourceWidth = Math.max(1, frame?.cutWidth || source?.naturalWidth || source?.width || 400);
    const sourceHeight = Math.max(1, frame?.cutHeight || source?.naturalHeight || source?.height || 400);
    const maxWidth = this.options.maxWidth ?? Phaser.Math.Clamp(viewport.width * 0.34, 128, 250);
    const maxHeight = Math.max(96, Math.min(this.options.maxHeight ?? viewport.height * 0.48, panelTop - 4));
    const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);

    return {
      width: Math.round(sourceWidth * scale),
      height: Math.round(sourceHeight * scale),
    };
  }
}
