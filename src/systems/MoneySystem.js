export default class MoneySystem {
  constructor(scene) {
    this.scene = scene;
    this.money = 0;
    this.uiElements = {
      count10000: document.querySelector("#count10000"),
      count1000: document.querySelector("#count1000"),
      count500: document.querySelector("#count500"),
      count100: document.querySelector("#count100"),
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
    const count10000 = Math.floor(this.money / 10000);
    const count1000 = Math.floor((this.money % 10000) / 1000);
    const count500 = Math.floor((this.money % 1000) / 500);
    const count100 = Math.floor((this.money % 500) / 100);
    this.uiElements.count10000.textContent = count10000;
    this.uiElements.count1000.textContent = count1000;
    this.uiElements.count500.textContent = count500;
    this.uiElements.count100.textContent = count100;
    this.uiElements.totalMoney.textContent = `₩${this.money.toLocaleString()}`;
  }

  processCanBonus(isCan) {
    if (isCan) {
      this.addMoney(200);
      return true;
    }
    return false;
  }
}
