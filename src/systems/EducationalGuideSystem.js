import { EDUCATIONAL_GUIDE_DATA } from "../config/EducationalGuideData.js";

export default class EducationalGuideSystem {
  constructor(scene) {
    this.scene = scene;
    this.icons = [];
    this.isOpen = false;

    this.modalEl = null;
    this.titleEl = null;
    this.textEl = null;
    this.closeBtnEl = null;
    this.okBtnEl = null;
  }

  create() {
    this.lookupElements();
    this.bindEvents();
    this.spawnGuideIcons();
  }

  lookupElements() {
    this.modalEl = document.querySelector("#edu-guide-modal");
    this.titleEl = document.querySelector("#edu-guide-title");
    this.textEl = document.querySelector("#edu-guide-text");
    this.closeBtnEl = document.querySelector("#edu-guide-close");
    this.okBtnEl = document.querySelector("#edu-guide-ok");
  }

  bindEvents() {
    this.closeHandler = () => this.closeGuideModal();
    this.okHandler = () => this.closeGuideModal();

    this.closeBtnEl?.addEventListener("click", this.closeHandler);
    this.okBtnEl?.addEventListener("click", this.okHandler);

    // ESC key closes the modal
    this.escHandler = (event) => {
      if (event.key === "Escape" && this.isOpen) {
        this.closeGuideModal();
      }
    };
    window.addEventListener("keydown", this.escHandler);
  }

  spawnGuideIcons() {
    const scene = this.scene;
    EDUCATIONAL_GUIDE_DATA.forEach((facility) => {
      const container = scene.add.container(facility.x, facility.y);
      container.setDepth(20);

      // Circle background
      const circle = scene.add.circle(0, 0, 18, 0xffd75a);
      circle.setStrokeStyle(3, 0x21352c);
      circle.setInteractive({ useHandCursor: true });

      // "?" Text
      const text = scene.add.text(0, 0, "?", {
        fontFamily: "Arial",
        fontSize: "22px",
        fontStyle: "bold",
        color: "#21352c"
      }).setOrigin(0.5);

      container.add([circle, text]);

      // Micro-animations: Hover Scale
      circle.on("pointerover", () => {
        scene.tweens.add({
          targets: container,
          scale: 1.15,
          duration: 120,
          overwrite: true
        });
      });

      circle.on("pointerout", () => {
        scene.tweens.add({
          targets: container,
          scale: 1.0,
          duration: 120,
          overwrite: true
        });
      });

      // Pointer down event to trigger details
      circle.on("pointerdown", (pointer, localX, localY, event) => {
        event?.stopPropagation();
        this.openGuideModal(facility);
      });

      // Floating dynamic idle animation
      scene.tweens.add({
        targets: container,
        y: facility.y - 6,
        duration: 1200 + Math.random() * 400,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });

      this.icons.push(container);
    });
  }

  openGuideModal(facility) {
    if (this.isOpen) return;

    const scene = this.scene;
    if (scene.sceneControlSystem?.isWorldInputBlocked?.()) return;

    this.isOpen = true;

    // Play button click tone if audioManager exists
    scene.audioManager?.playTone?.({ frequency: 660, duration: 0.08, type: "sine", volume: 0.05 });

    // Block world controls
    scene.sceneControlSystem?.blockWorldInput?.(true);

    // Apply texts
    if (this.titleEl) this.titleEl.textContent = facility.title;
    if (this.textEl) {
      // Allow HTML formatting like bold strings
      this.textEl.innerHTML = facility.description.replace(/\n/g, "<br>");
    }

    // Display modal
    if (this.modalEl) {
      this.modalEl.style.display = "flex";
      this.modalEl.setAttribute("aria-hidden", "false");
    }

    // Temporary keyboard control override
    if (scene.playerController) {
      scene.playerController.cancelMoveTarget?.();
    }
  }

  closeGuideModal() {
    if (!this.isOpen) return;

    const scene = this.scene;
    this.isOpen = false;

    // Play click tone
    scene.audioManager?.playTone?.({ frequency: 440, duration: 0.08, type: "sine", volume: 0.04 });

    // Hide modal
    if (this.modalEl) {
      this.modalEl.style.display = "none";
      this.modalEl.setAttribute("aria-hidden", "true");
    }

    // Unblock world controls
    scene.sceneControlSystem?.blockWorldInput?.(false);
  }

  destroy() {
    this.closeBtnEl?.removeEventListener("click", this.closeHandler);
    this.okBtnEl?.removeEventListener("click", this.okHandler);
    window.removeEventListener("keydown", this.escHandler);

    this.icons.forEach((icon) => {
      icon.destroy();
    });
    this.icons = [];
  }
}
