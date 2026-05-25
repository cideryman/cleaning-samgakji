import { DRINK_OPTIONS, GAME_CONFIG } from "../config/GameConstants.js";

export default class VendingMachineSystem {
  constructor(scene) {
    this.scene = scene;
    this.group = null;
    this.options = [];
    this.selectedIndex = 0;
    this.inputLockedUntil = 0;
  }

  open({ completeQuestOnSelect = false } = {}) {
    const scene = this.scene;
    if (this.group) return;

    scene.jjookStateBeforeVending = scene.jjookQuestState;
    scene.shouldCompleteJjookAfterDrink = completeQuestOnSelect;
    scene.jjookQuestState = "choosing_drink";

    this.selectedIndex = 0;
    this.options = [];
    this.inputLockedUntil = scene.time.now + 260;
    this.syncSceneSelection();

    const group = scene.add.group();
    this.group = group;
    scene.vendingMenuGroup = group;

    const dim = scene.add.rectangle(384, 240, 768, 480, 0x000000, 0.45);
    dim.setScrollFactor(0);
    dim.setDepth(60);
    group.add(dim);

    const title = scene.add.text(384, 128, "마실 음료를 골라줘", {
      fontFamily: "Arial",
      fontSize: "24px",
      color: "#fff3a3",
      fontStyle: "bold",
      stroke: "#21352c",
      strokeThickness: 6,
    });
    title.setOrigin(0.5);
    title.setScrollFactor(0);
    title.setDepth(62);
    group.add(title);

    const menuOptions = [
      ...DRINK_OPTIONS,
      { key: "cancel", label: "안 먹는다", isCancel: true },
    ];

    menuOptions.forEach((drink, index) => {
      const x = 204 + index * 120;
      const button = scene.add.rectangle(x, 236, 96, 122, 0xffffff, 0.9);
      button.setStrokeStyle(4, 0x21352c);
      button.setScrollFactor(0);
      button.setDepth(62);
      button.setInteractive({ useHandCursor: true });
      button.on("pointerdown", () => this.selectOption(index));
      group.add(button);

      if (!drink.isCancel) {
        const icon = scene.add.image(x, 220, drink.texture);
        icon.setDisplaySize(68, 68);
        icon.setScrollFactor(0);
        icon.setDepth(63);
        group.add(icon);
      } else {
        const cancelMark = scene.add.text(x, 218, "X", {
          fontFamily: "Arial",
          fontSize: "42px",
          color: "#d45b5b",
          fontStyle: "bold",
          stroke: "#21352c",
          strokeThickness: 5,
        });
        cancelMark.setOrigin(0.5);
        cancelMark.setScrollFactor(0);
        cancelMark.setDepth(63);
        group.add(cancelMark);
      }

      const label = scene.add.text(x, 280, drink.label, {
        fontFamily: "Arial",
        fontSize: "17px",
        color: "#21352c",
        fontStyle: "bold",
      });
      label.setOrigin(0.5);
      label.setScrollFactor(0);
      label.setDepth(63);
      group.add(label);

      const priceText = drink.isCancel ? "닫기" : `${GAME_CONFIG.drinkPrice.toLocaleString()}원`;
      const price = scene.add.text(x, 312, priceText, {
        fontFamily: "Arial",
        fontSize: "17px",
        color: "#ffd966",
        fontStyle: "bold",
        stroke: "#21352c",
        strokeThickness: 4,
      });
      price.setOrigin(0.5);
      price.setScrollFactor(0);
      price.setDepth(63);
      group.add(price);

      this.options.push({ drink, button });
    });

    scene.vendingMenuOptions = this.options;
    this.updateSelection();
  }

  close() {
    const scene = this.scene;
    this.group?.clear(true, true);
    this.group = null;
    this.options = [];
    scene.vendingMenuGroup = null;
    scene.vendingMenuOptions = [];
    scene.selectedVendingIndex = 0;
    scene.vendingMenuInputLockedUntil = 0;

    if (scene.jjookQuestState === "choosing_drink") {
      scene.jjookQuestState = scene.jjookStateBeforeVending || "completed";
    }
  }

  handleKeyboard() {
    const scene = this.scene;
    if (!this.group || !scene.cursors || !scene.keys) return;
    if (scene.time.now < this.inputLockedUntil) return;

    if (Phaser.Input.Keyboard.JustDown(scene.cursors.left)) {
      this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex - 1, 0, this.options.length);
      this.syncSceneSelection();
      this.updateSelection();
    } else if (Phaser.Input.Keyboard.JustDown(scene.cursors.right)) {
      this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + 1, 0, this.options.length);
      this.syncSceneSelection();
      this.updateSelection();
    }
  }

  updateSelection() {
    this.options.forEach((option, index) => {
      const isSelected = index === this.selectedIndex;
      option.button.setStrokeStyle(isSelected ? 6 : 4, isSelected ? 0xffd84f : 0x21352c);
      option.button.setScale(isSelected ? 1.08 : 1);
    });
  }

  selectOption(index) {
    this.selectedIndex = index;
    this.syncSceneSelection();
    this.updateSelection();
    this.selectHighlightedOption();
  }

  selectHighlightedOption() {
    const scene = this.scene;
    if (scene.time.now < this.inputLockedUntil) return;

    const selected = this.options[this.selectedIndex];
    if (!selected) return;
    this.selectDrink(selected.drink);
  }

  selectDrink(drink) {
    const scene = this.scene;
    if (!drink || scene.jjookQuestState !== "choosing_drink") return;

    if (drink.isCancel) {
      const shouldFinishQuest = scene.shouldCompleteJjookAfterDrink;
      this.close();
      if (shouldFinishQuest) {
        scene.finishJjookQuestWithoutDrink();
      } else {
        scene.showQuestToast("다음에 마실게.");
      }
      return;
    }

    if (!scene.moneySystem?.deductMoney(GAME_CONFIG.drinkPrice)) {
      scene.showQuestToast("돈이 1,000원 필요해요.");
      return;
    }

    scene.selectedDrink = drink;
    this.close();
    this.playPaymentAnimation(drink);
  }

  playPaymentAnimation(drink) {
    const scene = this.scene;
    const bill = scene.add.image(384, 250, "bill_1000");
    bill.setScrollFactor(0);
    bill.setDisplaySize(156, 78);
    bill.setDepth(70);
    bill.setAlpha(0);

    scene.playTone({ frequency: 880, duration: 0.08, type: "triangle", volume: 0.06 });
    scene.tweens.add({
      targets: bill,
      alpha: 1,
      y: 205,
      duration: 220,
      ease: "Back.easeOut",
      onComplete: () => {
        scene.playTone({ frequency: 1240, duration: 0.08, type: "square", volume: 0.045 });
        scene.tweens.add({
          targets: bill,
          x: 480,
          y: 210,
          scaleX: bill.scaleX * 0.35,
          scaleY: bill.scaleY * 0.35,
          alpha: 0,
          duration: 420,
          ease: "Cubic.easeIn",
          onComplete: () => {
            bill.destroy();
            this.dropDrink(drink);
          },
        });
      },
    });
  }

  dropDrink(drink) {
    const scene = this.scene;
    const can = scene.add.image(384, 205, drink.texture);
    can.setScrollFactor(0);
    can.setDisplaySize(62, 62);
    can.setDepth(70);
    can.setAlpha(0);
    scene.playTone({ frequency: 196, duration: 0.08, type: "square", volume: 0.06 });
    scene.playTone({ frequency: 330, duration: 0.1, type: "triangle", volume: 0.05, delay: 0.07 });

    scene.tweens.add({
      targets: can,
      alpha: 1,
      y: 285,
      duration: 420,
      ease: "Bounce.easeOut",
      onComplete: () => {
        scene.time.delayedCall(520, () => {
          can.destroy();
          if (scene.shouldCompleteJjookAfterDrink) {
            scene.finishJjookQuest();
          } else {
            this.finishPurchasedDrink(drink);
          }
        });
      },
    });
  }

  finishPurchasedDrink(drink) {
    const scene = this.scene;
    scene.jjookQuestState = scene.jjookStateBeforeVending || "completed";
    scene.drinkInventory.push(drink.key);
    const speedTarget = scene.isJjookFollowActive ? "해냄이와 쭉쭉이" : "해냄이";
    scene.showQuestToast(`${drink.label}를 마셨어. ${speedTarget} 이동 속도 UP`);
    scene.activateDrinkSpeedBuff();
    scene.selectedDrink = null;
    scene.shouldCompleteJjookAfterDrink = false;
  }

  syncSceneSelection() {
    this.scene.selectedVendingIndex = this.selectedIndex;
    this.scene.vendingMenuOptions = this.options;
    this.scene.vendingMenuInputLockedUntil = this.inputLockedUntil;
  }
}
