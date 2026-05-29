import CheckpointStorage from "../systems/CheckpointStorage.js";

const BASE_GAME_WIDTH = 768;
const BASE_GAME_HEIGHT = 480;

function isTouchDevice() {
  return navigator.maxTouchPoints > 0 || window.matchMedia?.("(pointer: coarse)")?.matches;
}

function getViewportSize() {
  const viewport = window.visualViewport;
  return {
    width: Math.max(Math.round(viewport?.width || window.innerWidth || BASE_GAME_WIDTH), 320),
    height: Math.max(Math.round(viewport?.height || window.innerHeight || BASE_GAME_HEIGHT), 240),
  };
}

export default class StartScene extends Phaser.Scene {
  constructor() {
    super("StartScene");
    this.selectedIndex = 0;
    this.options = [];
  }

  create() {
    document.body.classList.add("start-screen");
    this.resizeForStartScreen();
    this.registry.set("soundEnabled", this.registry.get("soundEnabled") !== false);

    let savedTextSizeLarge = false;
    try {
      savedTextSizeLarge = window.localStorage?.getItem("samgakji_text_size_large") === "true";
    } catch (e) {}
    this.registry.set("textSizeLarge", savedTextSizeLarge);

    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    this.addStartBackground(centerX, centerY);
    this.addTitle(centerX, centerY);

    const hasCheckpoint = CheckpointStorage.hasSave();
    const buttonLayout = hasCheckpoint
      ? { startY: centerY - 10, gap: 58, width: 236, height: 44 }
      : { startY: centerY + 22, gap: 60, width: 236, height: 46 };
    this.options = [];

    if (hasCheckpoint) {
      this.options.push(this.createOption(centerX, buttonLayout.startY, "이어하기", () => this.continueGame(), "action", buttonLayout));
      this.options.push(this.createOption(centerX, buttonLayout.startY + buttonLayout.gap, "처음부터", () => this.startNewGame(), "action", buttonLayout));
      this.options.push(this.createOption(centerX, buttonLayout.startY + buttonLayout.gap * 2, this.getSoundLabel(), () => this.toggleSound(), "sound", buttonLayout));
      this.options.push(this.createOption(centerX, buttonLayout.startY + buttonLayout.gap * 3, this.getTextSizeLabel(), () => this.toggleTextSize(), "textsize", buttonLayout));
    } else {
      this.options.push(this.createOption(centerX, buttonLayout.startY, "게임 시작", () => this.startNewGame(), "action", buttonLayout));
      this.options.push(this.createOption(centerX, buttonLayout.startY + buttonLayout.gap, this.getSoundLabel(), () => this.toggleSound(), "sound", buttonLayout));
      this.options.push(this.createOption(centerX, buttonLayout.startY + buttonLayout.gap * 2, this.getTextSizeLabel(), () => this.toggleTextSize(), "textsize", buttonLayout));
    }

    this.input.keyboard.on("keydown-UP", () => this.moveSelection(-1));
    this.input.keyboard.on("keydown-DOWN", () => this.moveSelection(1));
    this.input.keyboard.on("keydown-ENTER", () => this.activateSelection());
    this.input.keyboard.on("keydown-SPACE", () => this.activateSelection());
    this.updateSelection();
  }

  addStartBackground(centerX, centerY) {
    this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x91c77d);
    if (!this.textures.exists("start_park_background")) return;

    const bg = this.add.image(centerX, centerY, "start_park_background");
    const source = this.textures.get("start_park_background").getSourceImage();
    const scale = Math.max(this.scale.width / source.width, this.scale.height / source.height);
    bg.setScale(scale);
    bg.setDepth(0);

    this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x21352c, 0.12).setDepth(1);
    this.add.rectangle(centerX, this.scale.height - 96, this.scale.width, 192, 0x21352c, 0.18).setDepth(1);
  }

  addTitle(centerX, centerY) {
    const titleY = centerY - 126;
    this.add.text(centerX + 3, titleY + 4, "삼각지 대청소", {
      fontFamily: "Arial",
      fontSize: "46px",
      color: "#10261e",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(2);

    this.add.text(centerX, titleY, "삼각지 대청소", {
      fontFamily: "Arial",
      fontSize: "46px",
      color: "#fff8d7",
      fontStyle: "bold",
      stroke: "#21352c",
      strokeThickness: 8,
    }).setOrigin(0.5).setDepth(3);

    this.add.text(centerX, titleY + 52, "청소하고, 모으고, 여행을 준비해요", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#f5fff0",
      stroke: "#21352c",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(3);
  }

  createOption(x, y, label, action, kind = "action", layout = { width: 236, height: 50 }) {
    const shadow = this.add.rectangle(x + 3, y + 4, layout.width, layout.height, 0x10261e, 0.36);
    shadow.setDepth(2);

    const box = this.add.rectangle(x, y, layout.width, layout.height, 0xf7f2df, 0.94);
    box.setStrokeStyle(4, 0x21352c, 0.96);
    box.setDepth(3);
    box.setInteractive({ useHandCursor: true });
    box.on("pointerdown", () => action());

    const text = this.add.text(x, y, label, {
      fontFamily: "Arial",
      fontSize: "23px",
      color: "#21352c",
      fontStyle: "bold",
    });
    text.setOrigin(0.5);
    text.setDepth(4);
    text.setInteractive({ useHandCursor: true });
    text.on("pointerdown", () => action());

    return { box, shadow, text, action, kind };
  }

  getSoundLabel() {
    return this.registry.get("soundEnabled") === false ? "소리 켜기" : "소리 끄기";
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
      option.box.setFillStyle(isSelected ? 0xffd75a : 0xf7f2df, isSelected ? 0.98 : 0.94);
      option.box.setStrokeStyle(4, isSelected ? 0x10261e : 0x21352c, 1);
      option.box.setScale(isSelected ? 1.04 : 1);
      option.shadow.setScale(isSelected ? 1.04 : 1);
      option.text.setScale(isSelected ? 1.04 : 1);
    });
  }

  toggleSound() {
    const nextValue = this.registry.get("soundEnabled") === false;
    this.registry.set("soundEnabled", nextValue);
    const soundOption = this.options.find((option) => option.kind === "sound");
    soundOption?.text.setText(this.getSoundLabel());
    this.updateSelection();
  }

  getTextSizeLabel() {
    return this.registry.get("textSizeLarge") === true ? "글자 크기: 크게" : "글자 크기: 보통";
  }

  toggleTextSize() {
    const nextValue = this.registry.get("textSizeLarge") !== true;
    this.registry.set("textSizeLarge", nextValue);

    try {
      window.localStorage?.setItem("samgakji_text_size_large", nextValue ? "true" : "false");
    } catch (e) {}

    if (nextValue) {
      document.body.classList.add("ui-large-text");
    } else {
      document.body.classList.remove("ui-large-text");
    }

    const textOption = this.options.find((option) => option.kind === "textsize");
    textOption?.text.setText(this.getTextSizeLabel());
    this.updateSelection();
  }

  startNewGame() {
    CheckpointStorage.clear();
    this.resizeForGameScenes();
    this.scene.start("PrologueScene");
  }

  continueGame() {
    this.resizeForGameScenes();
    this.scene.start("PlayScene", { loadCheckpoint: true });
  }

  resizeForStartScreen() {
    if (!isTouchDevice()) return;

    const { width, height } = getViewportSize();
    this.scale.resize(width, height);
  }

  resizeForGameScenes() {
    if (!isTouchDevice()) return;

    this.scale.resize(BASE_GAME_WIDTH, BASE_GAME_HEIGHT);
  }
}
