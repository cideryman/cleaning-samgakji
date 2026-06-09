import { GAME_CONFIG } from "../config/GameConstants.js";

export default class ConsumableSystem {
  constructor(scene) {
    this.scene = scene;
  }

  updateBacchusButton() {
    const scene = this.scene;
    if (!scene.bacchusButton) return;

    if (!scene.hasBacchus) {
      scene.bacchusButton.setAttribute("hidden", "");
      scene.bacchusButton.classList.remove("is-active");
      if (scene.bacchusTimerEl) scene.bacchusTimerEl.textContent = "";
      return;
    }

    scene.bacchusButton.removeAttribute("hidden");
    scene.bacchusButton.classList.remove("is-active");
  }

  useBacchusItem() {
    const scene = this.scene;
    if (!scene.hasBacchus) return;

    scene.hasBacchus = false;
    this.updateBacchusButton();
    scene.playItemPickupSound();
    scene.showQuestToast("활력수를 마셨어. 발걸음이 가벼워졌어!");
    scene.showSpeechBubble(scene.player, "조금 더 빠르게 움직일 수 있겠어!", 1800);
    scene.showCleanFeedback(scene.player.x, scene.player.y, true);
    scene.activateDrinkSpeedBuff?.();
  }
}
