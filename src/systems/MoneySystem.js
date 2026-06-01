export default class MoneySystem {
  constructor(scene) {
    this.scene = scene;
    this.money = 0;
    this.uiElements = {
      totalMoney: document.querySelector("#totalMoney"),
    };
  }

  addMoney(amount) {
    this.money += amount;
    this.updateUI();
    return this.money;
  }

  deductMoney(amount) {
    if (this.money >= amount) {
      this.money -= amount;
      this.updateUI();
      return true;
    }
    return false;
  }

  updateUI() {
    if (this.uiElements.totalMoney) {
      this.uiElements.totalMoney.textContent = `${this.money.toLocaleString()}원`;
    }
    this.scene.uiManager?.updateNextQuestHint?.();
  }

  processCanBonus(isCan) {
    if (isCan) {
      this.addMoney(200);
      return true;
    }
    return false;
  }
}
