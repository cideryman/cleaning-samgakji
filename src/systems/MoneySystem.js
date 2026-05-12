class MoneySystem {
  constructor(scene) {
    this.scene = scene;
    this.money = 0;
    this.uiElements = {
      count10000: document.querySelector("#count10000"),
      count1000: document.querySelector("#count1000"),
      totalMoney: document.querySelector("#totalMoney")
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
    this.uiElements.count10000.textContent = count10000;
    this.uiElements.count1000.textContent = count1000;
    this.uiElements.totalMoney.textContent = `￦${this.money.toLocaleString()}`;
  }
  
  // 보너스 캔 처리 (선택)
  processCanBonus(isCan) {
    if (isCan) {
      this.addMoney(200);
      return true;
    }
    return false;
  }
}