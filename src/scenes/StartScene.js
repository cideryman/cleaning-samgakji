import CheckpointStorage from "../systems/CheckpointStorage.js";

export default class StartScene extends Phaser.Scene {
  constructor() {
    super("StartScene");
    this.selectedIndex = 0;
    this.options = [];
  }

  create() {
    document.body.classList.add("start-screen");
    this.registry.set("soundEnabled", this.registry.get("soundEnabled") !== false);

    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x9acb87);
    this.add.rectangle(centerX, centerY, 620, 340, 0xedf6f0, 0.94).setStrokeStyle(5, 0x21352c);
    this.add.text(centerX, centerY - 120, "\uC0BC\uAC01\uC9C0 \uB300\uCCAD\uC18C", {
      fontFamily: "Arial",
      fontSize: "42px",
      color: "#21352c",
      fontStyle: "bold",
    }).setOrigin(0.5);
    this.add.text(centerX, centerY - 70, "\uD504\uB864\uB85C\uADF8  \uC5EC\uB984 \uBC29\uD559\uC758 \uC57D\uC18D", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#315545",
    }).setOrigin(0.5);

    const hasCheckpoint = CheckpointStorage.hasSave();
    const optionStartY = centerY + (hasCheckpoint ? -18 : 10);
    this.options = [];

    if (hasCheckpoint) {
      this.options.push(this.createOption(centerX, optionStartY, "\uC774\uC5B4\uD558\uAE30", () => this.continueGame()));
      this.options.push(this.createOption(centerX, optionStartY + 64, "\uCC98\uC74C\uBD80\uD130", () => this.startNewGame()));
      this.options.push(this.createOption(centerX, optionStartY + 128, this.getSoundLabel(), () => this.toggleSound(), "sound"));
    } else {
      this.options.push(this.createOption(centerX, optionStartY, "\uC2DC\uC791\uD558\uAE30", () => this.startNewGame()));
      this.options.push(this.createOption(centerX, optionStartY + 68, this.getSoundLabel(), () => this.toggleSound(), "sound"));
    }

    this.input.keyboard.on("keydown-UP", () => this.moveSelection(-1));
    this.input.keyboard.on("keydown-DOWN", () => this.moveSelection(1));
    this.input.keyboard.on("keydown-ENTER", () => this.activateSelection());
    this.input.keyboard.on("keydown-SPACE", () => this.activateSelection());
    this.updateSelection();
  }

  createOption(x, y, label, action, kind = "action") {
    const box = this.add.rectangle(x, y, 260, 52, 0xffffff).setStrokeStyle(4, 0x21352c);
    const text = this.add.text(x, y, label, {
      fontFamily: "Arial",
      fontSize: "24px",
      color: "#21352c",
      fontStyle: "bold",
    }).setOrigin(0.5);
    box.setInteractive({ useHandCursor: true });
    box.on("pointerdown", () => action());
    text.setInteractive({ useHandCursor: true });
    text.on("pointerdown", () => action());
    return { box, text, action, kind };
  }

  getSoundLabel() {
    return this.registry.get("soundEnabled") === false ? "\uC18C\uB9AC \uCF1C\uAE30" : "\uC18C\uB9AC \uB044\uAE30";
  }

  moveSelection(delta) {
    this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + delta, 0, this.options.length);
    this.updateSelection();
  }

  activateSelection() {
    this.options[this.selectedIndex].action();
  }

  updateSelection() {
    this.options.forEach((option, index) => {
      const isSelected = index === this.selectedIndex;
      option.box.setFillStyle(isSelected ? 0xffd75a : 0xffffff);
      option.box.setScale(isSelected ? 1.06 : 1);
    });
  }

  toggleSound() {
    const nextValue = this.registry.get("soundEnabled") === false;
    this.registry.set("soundEnabled", nextValue);
    this.options.find((option) => option.kind === "sound")?.text.setText(this.getSoundLabel());
    this.updateSelection();
  }

  startNewGame() {
    CheckpointStorage.clear();
    this.scene.start("PrologueScene");
  }

  continueGame() {
    this.scene.start("PlayScene", { loadCheckpoint: true });
  }
}
