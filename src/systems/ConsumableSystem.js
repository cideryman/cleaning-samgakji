import { GAME_CONFIG } from "../config/GameConstants.js";

export default class ConsumableSystem {
  constructor(scene) {
    this.scene = scene;
  }

  updateBacchusButton() {
    const scene = this.scene;
    if (!scene.bacchusButton) return;

    if (!scene.hasBacchus && !scene.isBacchusActive) {
      scene.bacchusButton.setAttribute("hidden", "");
      scene.bacchusButton.classList.remove("is-active");
      if (scene.bacchusTimerEl) scene.bacchusTimerEl.textContent = "";
      return;
    }

    scene.bacchusButton.removeAttribute("hidden");
    scene.bacchusButton.classList.toggle("is-active", scene.isBacchusActive);
  }

  useBacchusItem() {
    const scene = this.scene;
    if (!scene.hasBacchus || scene.isBacchusActive) return;

    scene.hasBacchus = false;
    scene.isBacchusActive = true;
    this.updateBacchusButton();
    scene.playItemPickupSound();
    scene.showQuestToast("힘이 나는 것 같아!");
    scene.showSpeechBubble(scene.player, "조금 더 깨끗하게 치울 수 있겠어!", 1800);
    scene.showCleanFeedback(scene.player.x, scene.player.y, true);

    const endAt = scene.time.now + GAME_CONFIG.bacchusDurationMs;
    scene.bacchusCountdownEvent?.remove(false);
    scene.bacchusCountdownEvent = scene.time.addEvent({
      delay: 250,
      loop: true,
      callback: () => {
        const remaining = Math.max(0, Math.ceil((endAt - scene.time.now) / 1000));
        if (scene.bacchusTimerEl) scene.bacchusTimerEl.textContent = `${remaining}`;
      },
    });
    scene.bacchusTimer?.remove(false);
    scene.bacchusTimer = scene.time.delayedCall(GAME_CONFIG.bacchusDurationMs, () => {
      scene.isBacchusActive = false;
      scene.bacchusCountdownEvent?.remove(false);
      scene.bacchusCountdownEvent = null;
      this.updateBacchusButton();
      scene.showQuestToast("박카스 효과가 끝났어요.");
    });
  }
}
