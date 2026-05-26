import { GAME_CONFIG } from "../config/GameConstants.js";

export default class UIManager {
  constructor(scene) {
    this.scene = scene;
    this.questToastQueue = [];
    this.isShowingQuestToast = false;
    this.nextQuestHintEl = document.querySelector("#nextQuestHint");
    this.nextQuestHintRefreshEvent = this.scene.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => this.updateNextQuestHint(),
    });
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

    this.updateNextQuestHint();
  }

  updateNextQuestHint() {
    if (!this.nextQuestHintEl) return;

    const hint = this.getNextQuestHint();
    if (!hint) {
      this.nextQuestHintEl.classList.add("is-hidden");
      this.nextQuestHintEl.setAttribute("aria-hidden", "true");
      this.nextQuestHintEl.textContent = "";
      return;
    }

    this.nextQuestHintEl.textContent = hint;
    this.nextQuestHintEl.classList.remove("is-hidden");
    this.nextQuestHintEl.setAttribute("aria-hidden", "false");
  }

  getNextQuestHint() {
    const scene = this.scene;
    const money = scene.moneySystem?.money ?? 0;
    const questManager = scene.questManager;
    if (!questManager) return "";

    const recycleState = questManager.getRecycleQuestState?.() ?? "locked";
    if (recycleState === "locked" && !scene.hasAnnouncedRecycleQuest) {
      return this.formatQuestHint("분리수거", GAME_CONFIG.recycleQuestUnlockMoney, money);
    }

    if (recycleState === "completed" && scene.jjookQuestState === "locked" && !scene.hasAnnouncedJjookQuest) {
      return this.formatQuestHint("쭉쭉이", GAME_CONFIG.jjookQuestUnlockMoney, money);
    }

    if (scene.jjookQuestState === "completed" && scene.sunisuniQuestState === "locked" && !scene.hasAnnouncedSunisuniQuest) {
      return this.formatQuestHint("병원", GAME_CONFIG.sunisuniQuestUnlockMoney, money);
    }

    if (scene.sunisuniQuestState === "quest_complete" && scene.clothesQuestState === "locked" && !scene.hasAnnouncedClothesQuest) {
      return this.formatQuestHint("여행 준비", GAME_CONFIG.clothesQuestUnlockMoney, money);
    }

    return "";
  }

  formatQuestHint(label, targetMoney, currentMoney) {
    const remaining = Math.max(0, targetMoney - currentMoney);
    if (remaining <= 0) {
      return `다음: ${label} 가능`;
    }
    return `다음: ${label} ${targetMoney.toLocaleString()}원`;
  }
}
