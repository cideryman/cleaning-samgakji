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

      // Circle background (with transparency for premium overlay blend)
      const circle = scene.add.circle(0, 0, 18, 0xffd75a);
      circle.setAlpha(0.82);
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

    // Apply visual pictogram next to the text
    const pictogramEl = document.querySelector("#edu-guide-pictogram");
    if (pictogramEl) {
      pictogramEl.innerHTML = this.getPictogramHtml(facility.key);
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

  getPictogramHtml(key) {
    switch (key) {
      case "hospital":
        return `
          <svg class="pictogram-svg" viewBox="0 0 100 100" width="80" height="80">
            <circle cx="50" cy="50" r="45" fill="#e8f5e9" stroke="#2c5e3b" stroke-width="4"/>
            <rect x="42" y="20" width="16" height="60" rx="4" fill="#d68b45"/>
            <rect x="20" y="42" width="60" height="16" rx="4" fill="#d68b45"/>
            <circle cx="50" cy="50" r="10" fill="#ffffff" opacity="0.3"/>
          </svg>
        `;
      case "pharmacy":
        return `
          <svg class="pictogram-svg" viewBox="0 0 100 100" width="80" height="80">
            <circle cx="50" cy="50" r="45" fill="#fffde7" stroke="#2c5e3b" stroke-width="4"/>
            <rect x="30" y="38" width="22" height="42" rx="11" fill="#d68b45" transform="rotate(-35 41 59)"/>
            <rect x="48" y="22" width="22" height="42" rx="11" fill="#ffffff" stroke="#d68b45" stroke-width="4" transform="rotate(-35 59 43)"/>
            <line x1="30" y1="52" x2="68" y2="42" stroke="#2c5e3b" stroke-width="4" stroke-linecap="round"/>
          </svg>
        `;
      case "clothing_shop":
        return `
          <svg class="pictogram-svg" viewBox="0 0 100 100" width="80" height="80">
            <circle cx="50" cy="50" r="45" fill="#fbe9e7" stroke="#2c5e3b" stroke-width="4"/>
            <path d="M50,30 L22,56 L34,56 L34,76 L66,76 L66,56 L78,56 Z" fill="#d68b45" stroke="#2c5e3b" stroke-width="3"/>
            <path d="M50,30 C50,22 44,22 44,26" fill="none" stroke="#2c5e3b" stroke-width="4" stroke-linecap="round"/>
          </svg>
        `;
      case "traffic_light":
        return `
          <svg class="pictogram-svg" viewBox="0 0 100 100" width="80" height="80">
            <circle cx="50" cy="50" r="45" fill="#eceff1" stroke="#2c5e3b" stroke-width="4"/>
            <rect x="36" y="20" width="28" height="60" rx="8" fill="#37474f" stroke="#21352c" stroke-width="3"/>
            <circle cx="50" cy="35" r="8" fill="#ff5252"/>
            <circle cx="50" cy="65" r="8" fill="#69f0ae"/>
          </svg>
        `;
      case "vending_machine":
        return `
          <svg class="pictogram-svg" viewBox="0 0 100 100" width="80" height="80">
            <circle cx="50" cy="50" r="45" fill="#e0f7fa" stroke="#2c5e3b" stroke-width="4"/>
            <rect x="32" y="22" width="36" height="56" rx="5" fill="#d68b45" stroke="#2c5e3b" stroke-width="3"/>
            <rect x="40" y="30" width="20" height="15" fill="#ffffff" stroke="#2c5e3b" stroke-width="2"/>
            <circle cx="44" cy="53" r="3" fill="#ffeb3b"/>
            <circle cx="56" cy="53" r="3" fill="#ffeb3b"/>
            <rect x="40" y="64" width="20" height="8" fill="#37474f"/>
          </svg>
        `;
      case "recycling_center":
        return `
          <svg class="pictogram-svg" viewBox="0 0 100 100" width="80" height="80">
            <circle cx="50" cy="50" r="45" fill="#f1f8e9" stroke="#2c5e3b" stroke-width="4"/>
            <path d="M50,22 L35,42 L45,42 L45,62 L55,62 L55,42 L65,42 Z" fill="#2c5e3b" transform="rotate(30 50 42)"/>
            <path d="M50,78 L65,58 L55,58 L55,38 L45,38 L45,58 L35,58 Z" fill="#d68b45" transform="rotate(210 50 58)"/>
          </svg>
        `;
      case "bus_stop":
        return `
          <svg class="pictogram-svg" viewBox="0 0 100 100" width="80" height="80">
            <circle cx="50" cy="50" r="45" fill="#efebe9" stroke="#2c5e3b" stroke-width="4"/>
            <rect x="30" y="25" width="40" height="42" rx="8" fill="#d68b45" stroke="#2c5e3b" stroke-width="3"/>
            <rect x="36" y="32" width="28" height="16" fill="#ffffff" stroke="#2c5e3b" stroke-width="2"/>
            <circle cx="40" cy="58" r="4" fill="#ffffff"/>
            <circle cx="60" cy="58" r="4" fill="#ffffff"/>
            <rect x="35" y="67" width="8" height="12" fill="#37474f"/>
            <rect x="57" y="67" width="8" height="12" fill="#37474f"/>
          </svg>
        `;
      default:
        return "";
    }
  }
}
