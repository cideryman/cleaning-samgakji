import { EDUCATIONAL_GUIDE_DATA } from "../config/EducationalGuideData.js";

const KEY_MAP = {
  "hospital": "hospital",
  "pharmacy": "pharmacy",
  "clothing_shop": "clothing",
  "vending_machine": "vending",
  "traffic_light": "crosswalk",
  "recycling_center": "recycling",
  "bus_stop": "busStop"
};

export default class EducationalGuideSystem {
  constructor(scene) {
    this.scene = scene;
    this.icons = [];
    this.isOpen = false;
    this.openedFromNotes = false;

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
    this.modalInputTrapHandler = (event) => {
      event.stopPropagation();
    };

    this.closeBtnEl?.addEventListener("click", this.closeHandler);
    this.okBtnEl?.addEventListener("click", this.okHandler);
    this.modalEl?.addEventListener("pointerdown", this.modalInputTrapHandler);
    this.modalEl?.addEventListener("touchstart", this.modalInputTrapHandler);

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
    this.icons = [];

    EDUCATIONAL_GUIDE_DATA.forEach((facility) => {
      const mappedKey = KEY_MAP[facility.key];
      const seen = scene.educationGuideSeen?.[mappedKey] === true;

      const container = scene.add.container(facility.x, facility.y);
      container.setDepth(20);

      container.facility = facility;
      container.mappedKey = mappedKey;

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
        const currentSeen = scene.educationGuideSeen?.[mappedKey] === true;
        scene.tweens.add({
          targets: container,
          scale: currentSeen ? 1.1 : 1.15,
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

      container.circleObj = circle;
      container.textObj = text;

      this.icons.push(container);
      this.applyIconStyle(container, seen);
    });
  }

  applyIconStyle(container, seen) {
    const scene = this.scene;
    const circle = container.circleObj;
    const text = container.textObj;
    const facility = container.facility;

    if (container.floatTween) {
      container.floatTween.stop();
      container.floatTween = null;
    }

    if (seen) {
      // Small, quiet "다시보기" style
      circle.setRadius(11);
      circle.setFillStyle(0xffd75a, 0.42);
      circle.setStrokeStyle(2, 0x21352c, 0.5);
      circle.setAlpha(0.42);

      text.setStyle({
        fontSize: "13px",
        color: "rgba(33, 53, 44, 0.6)"
      });
      text.setAlpha(0.6);

      container.y = facility.y;
      container.floatTween = scene.tweens.add({
        targets: container,
        y: facility.y - 2,
        duration: 3500,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
    } else {
      // Standard highlight style
      circle.setRadius(18);
      circle.setFillStyle(0xffd75a, 0.82);
      circle.setStrokeStyle(3, 0x21352c, 1.0);
      circle.setAlpha(1.0);

      text.setStyle({
        fontSize: "22px",
        color: "#21352c"
      });
      text.setAlpha(1.0);

      container.y = facility.y;
      container.floatTween = scene.tweens.add({
        targets: container,
        y: facility.y - 6,
        duration: 1200 + Math.random() * 400,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
    }
  }

  openGuideModal(facility) {
    if (this.isOpen) return;

    const scene = this.scene;
    if (scene.sceneControlSystem?.isWorldInputBlocked?.() && !this.openedFromNotes) return;

    this.isOpen = true;

    // Track viewed seen state
    const mappedKey = KEY_MAP[facility.key];
    if (mappedKey && scene.educationGuideSeen) {
      scene.educationGuideSeen[mappedKey] = true;
      const targetIcon = this.icons.find(icon => icon.mappedKey === mappedKey);
      if (targetIcon) {
        this.applyIconStyle(targetIcon, true);
      }
      scene.saveCheckpoint("edu_seen_" + mappedKey);
    }

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

    if (this.openedFromNotes) {
      this.openedFromNotes = false;
      scene.htmlUiBindingSystem?.showLearningNotes?.();
      this.renderLearningNotes();
    } else {
      // Unblock world controls
      scene.sceneControlSystem?.blockWorldInput?.(false);
    }
  }

  renderLearningNotes() {
    const scene = this.scene;
    const listEl = scene.eduNotesList;
    if (!listEl) return;

    listEl.innerHTML = "";

    const emojiMap = {
      "hospital": "🏥",
      "pharmacy": "💊",
      "clothing_shop": "👕",
      "vending_machine": "🥤",
      "traffic_light": "🚦",
      "recycling_center": "♻️",
      "bus_stop": "🚌"
    };

    EDUCATIONAL_GUIDE_DATA.forEach((facility) => {
      const mappedKey = KEY_MAP[facility.key];
      const seen = scene.educationGuideSeen?.[mappedKey] === true;

      const card = document.createElement("div");
      card.className = "edu-note-card";

      const emoji = emojiMap[facility.key] || "💡";

      card.innerHTML = `
        <div class="edu-note-info">
          <span class="edu-note-icon">${emoji}</span>
          <span class="edu-note-title">${facility.title}</span>
        </div>
        <span class="edu-note-status ${seen ? 'seen' : 'unseen'}">
          ${seen ? '봤어요 ✓' : '아직 안 봤어요'}
        </span>
      `;

      card.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        scene.htmlUiBindingSystem?.hideLearningNotes();
        this.openedFromNotes = true;
        this.openGuideModal(facility);
      });

      listEl.appendChild(card);
    });
  }

  destroy() {
    this.closeBtnEl?.removeEventListener("click", this.closeHandler);
    this.okBtnEl?.removeEventListener("click", this.okHandler);
    this.modalEl?.removeEventListener("pointerdown", this.modalInputTrapHandler);
    this.modalEl?.removeEventListener("touchstart", this.modalInputTrapHandler);
    window.removeEventListener("keydown", this.escHandler);

    this.icons.forEach((icon) => {
      if (icon.floatTween) {
        icon.floatTween.stop();
      }
      icon.destroy();
    });
    this.icons = [];
  }

  isModalOpen() {
    return this.isOpen || this.scene.eduNotesModal?.style?.display !== "none";
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
