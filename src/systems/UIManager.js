import { GAME_CONFIG } from "../config/GameConstants.js";

export default class UIManager {
  constructor(scene) {
    this.scene = scene;
    this.questToastQueue = [];
    this.isShowingQuestToast = false;
  }

  showQuestToast(message, duration = 1700) {
    if (!message) return;

    this.questToastQueue.push({ message, duration });
    this.showNextQuestToast();
  }

  showNextQuestToast() {
    if (this.isShowingQuestToast || this.questToastQueue.length === 0) return;

    this.isShowingQuestToast = true;
    const { message, duration } = this.questToastQueue.shift();
    const toast = document.createElement("div");
    toast.className = "quest-toast";
    toast.textContent = message;
    toast.style.setProperty("--toast-duration", `${duration}ms`);
    document.querySelector(".game-stage")?.appendChild(toast);
    window.setTimeout(() => {
      toast.remove();
      this.isShowingQuestToast = false;
      this.showNextQuestToast();
    }, duration + 120);
  }

  showSpeechBubble(target, message, duration = 1050) {
    if (!target || !message) return;

    const bubble = this.scene.add.text(target.x, target.y - 58, message, {
      fontFamily: "Arial",
      fontSize: "15px",
      color: "#21352c",
      fontStyle: "bold",
      backgroundColor: "rgba(255,255,255,0.94)",
      padding: { left: 8, right: 8, top: 5, bottom: 5 },
    });
    bubble.setOrigin(0.5);
    bubble.setDepth(20);

    this.scene.tweens.add({
      targets: bubble,
      y: bubble.y - 18,
      alpha: 0,
      duration,
      ease: "Cubic.easeOut",
      onComplete: () => bubble.destroy(),
    });
  }

  queueInventoryCaption(message) {
    if (!message) return;

    this.scene.inventoryCaptionQueue.push(message);
    this.showNextInventoryCaption();
  }

  showNextInventoryCaption() {
    if (this.scene.isShowingInventoryCaption || this.scene.inventoryCaptionQueue.length === 0) return;

    this.scene.isShowingInventoryCaption = true;
    const message = this.scene.inventoryCaptionQueue.shift();
    this.showSpeechBubble(this.scene.player, message, 760);
    this.scene.time.delayedCall(780, () => {
      this.scene.isShowingInventoryCaption = false;
      this.showNextInventoryCaption();
    });
  }

  showMoneyRewardAnimation(amount, { label = "\uC120\uBB3C", icon = "./assets/ui/10000won.png", framed = true } = {}) {
    const stage = document.querySelector(".game-stage");
    if (!stage) return;

    const reward = document.createElement("div");
    reward.className = "money-reward-pop";
    reward.classList.toggle("is-unframed", !framed);
    reward.innerHTML = `
      <img src="${icon}" alt="${label}" />
      <strong>${label} ${amount.toLocaleString()}\uC6D0</strong>
    `;
    stage.appendChild(reward);
    window.setTimeout(() => reward.remove(), 3600);
  }

  updateHud() {
    const scene = this.scene;
    const visibleWaveCount = scene.isMissionComplete
      ? scene.cleanProgressEls.length
      : Math.floor((scene.totalCleanedCount / GAME_CONFIG.totalGoal) * scene.cleanProgressEls.length);

    scene.cleanProgressEls?.forEach((dot, index) => {
      dot.classList.toggle("is-cleaned", index < visibleWaveCount);
    });

    scene.canProgressEls?.forEach((dot, index) => {
      dot.classList.toggle("is-cleaned", index < scene.cleanedCanCount);
    });

    if (scene.missionCountEl) {
      scene.missionCountEl.textContent = `${scene.totalCleanedCount}/${GAME_CONFIG.totalGoal}`;
    }

    if (scene.inventoryNormalCountEl) {
      scene.inventoryNormalCountEl.textContent = scene.recyclingInventory.normal;
    }
    if (scene.inventoryPlasticCountEl) {
      scene.inventoryPlasticCountEl.textContent = scene.recyclingInventory.plastic;
    }
    if (scene.inventoryCanCountEl) {
      scene.inventoryCanCountEl.textContent = scene.recyclingInventory.can;
    }

    scene.sweepButton?.classList.toggle("is-upgraded", scene.hasBroomUpgrade);

    if (scene.specialButton) {
      scene.specialButton.hidden = !scene.hasUnlockedYebi || scene.hasUsedYebi;
      scene.specialButton.classList.toggle("is-ready", scene.hasUnlockedYebi && !scene.hasUsedYebi);
    }
  }
}
