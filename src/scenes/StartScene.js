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

    let savedTtsEnabled = false;
    try {
      savedTtsEnabled = window.localStorage?.getItem("samgakji_tts_enabled") === "true";
    } catch (e) {}
    this.registry.set("ttsEnabled", savedTtsEnabled);

    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    this.addStartBackground(centerX, centerY);
    this.addTitle(centerX, centerY);

    const hasCheckpoint = CheckpointStorage.hasSave();
    const buttonLayout = hasCheckpoint
      ? { startY: centerY - 46, gap: 50, width: 236, height: 38 }
      : { startY: centerY - 10, gap: 50, width: 236, height: 38 };
    this.options = [];

    if (hasCheckpoint) {
      this.options.push(this.createOption(centerX, buttonLayout.startY, "이어하기", () => this.continueGame(), "action", buttonLayout));
      this.options.push(this.createOption(centerX, buttonLayout.startY + buttonLayout.gap, "처음부터", () => this.startNewGame(), "action", buttonLayout));
      this.options.push(this.createOption(centerX, buttonLayout.startY + buttonLayout.gap * 2, this.getSoundLabel(), () => this.toggleSound(), "sound", buttonLayout));
      this.options.push(this.createOption(centerX, buttonLayout.startY + buttonLayout.gap * 3, this.getTextSizeLabel(), () => this.toggleTextSize(), "textsize", buttonLayout));
      this.options.push(this.createOption(centerX, buttonLayout.startY + buttonLayout.gap * 4, this.getTtsLabel(), () => this.toggleTts(), "tts", buttonLayout));
    } else {
      this.options.push(this.createOption(centerX, buttonLayout.startY, "게임 시작", () => this.startNewGame(), "action", buttonLayout));
      this.options.push(this.createOption(centerX, buttonLayout.startY + buttonLayout.gap, this.getSoundLabel(), () => this.toggleSound(), "sound", buttonLayout));
      this.options.push(this.createOption(centerX, buttonLayout.startY + buttonLayout.gap * 2, this.getTextSizeLabel(), () => this.toggleTextSize(), "textsize", buttonLayout));
      this.options.push(this.createOption(centerX, buttonLayout.startY + buttonLayout.gap * 3, this.getTtsLabel(), () => this.toggleTts(), "tts", buttonLayout));
    }

    this.input.keyboard.on("keydown-UP", () => this.moveSelection(-1));
    this.input.keyboard.on("keydown-DOWN", () => this.moveSelection(1));
    this.input.keyboard.on("keydown-ENTER", () => this.activateSelection());
    this.input.keyboard.on("keydown-SPACE", () => this.activateSelection());

    // 화면 크기 변경 및 가로 모드 회전 감지 리스너 바인딩
    this.onResizeBound = () => this.handleViewportResize();
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", this.onResizeBound);
    } else {
      window.addEventListener("resize", this.onResizeBound);
    }

    // 씬 해제 시 리스너 완벽 회수 (메모리 누수 방지)
    this.events.on("shutdown", () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", this.onResizeBound);
      } else {
        window.removeEventListener("resize", this.onResizeBound);
      }
      if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
    });

    // 시작 화면 띄운 직후 가로/세로 최종 배치 수행
    this.repositionUI();
  }

  addStartBackground(centerX, centerY) {
    this.bgRectangle = this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x91c77d);
    if (!this.textures.exists("start_park_background")) return;

    this.bgImage = this.add.image(centerX, centerY, "start_park_background");
    const source = this.textures.get("start_park_background").getSourceImage();
    const scale = Math.max(this.scale.width / source.width, this.scale.height / source.height);
    this.bgImage.setScale(scale);
    this.bgImage.setDepth(0);

    this.overlay1 = this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x21352c, 0.12).setDepth(1);
    this.overlay2 = this.add.rectangle(centerX, this.scale.height - 96, this.scale.width, 192, 0x21352c, 0.18).setDepth(1);
  }

  addTitle(centerX, centerY) {
    const titleY = centerY - 126;
    this.titleShadow = this.add.text(centerX + 3, titleY + 4, "삼각지 대청소", {
      fontFamily: "Arial",
      fontSize: "46px",
      color: "#10261e",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(2);

    this.titleText = this.add.text(centerX, titleY, "삼각지 대청소", {
      fontFamily: "Arial",
      fontSize: "46px",
      color: "#fff8d7",
      fontStyle: "bold",
      stroke: "#21352c",
      strokeThickness: 8,
    }).setOrigin(0.5).setDepth(3);

    this.subtitleText = this.add.text(centerX, titleY + 52, "청소하고, 모으고, 여행을 준비해요", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#f5fff0",
      stroke: "#21352c",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(3);
  }

  handleViewportResize() {
    if (!this.sys || !this.sys.isActive()) return;

    if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      if (!this.sys || !this.sys.isActive() || !this.scale) return;

      const { width, height } = getViewportSize();
      this.scale.resize(width, height);
      this.repositionUI();
    }, 150); // standalone PWA 회전 렌더링 딜레이 대응 세이프 버퍼
  }

  repositionUI() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;
    const viewportHeight = this.scale.height;

    // 모바일 가로 모드(높이 420px 미만)일 때 압축 레이아웃 적용하여 하단 컷오프를 완벽 차단
    const isCompact = viewportHeight < 420;
    
    const buttonHeight = isCompact ? 30 : 38;
    const buttonGap = isCompact ? 41 : 50;
    const buttonFontSize = isCompact ? "18px" : "23px";
    
    const buttonLayout = {
      width: isCompact ? 220 : 236,
      height: buttonHeight,
      gap: buttonGap
    };

    const hasCheckpoint = CheckpointStorage.hasSave();
    let startY = centerY - 10;
    if (hasCheckpoint) {
      startY = isCompact ? centerY - 58 : centerY - 46;
    } else {
      startY = isCompact ? centerY - 25 : centerY - 10;
    }

    // 1. 배경 재조정
    if (this.bgRectangle) {
      this.bgRectangle.setPosition(centerX, centerY);
      this.bgRectangle.setSize(this.scale.width, this.scale.height);
    }
    if (this.bgImage) {
      this.bgImage.setPosition(centerX, centerY);
      const source = this.textures.get("start_park_background").getSourceImage();
      const scale = Math.max(this.scale.width / source.width, this.scale.height / source.height);
      this.bgImage.setScale(scale);
    }
    if (this.overlay1) {
      this.overlay1.setPosition(centerX, centerY);
      this.overlay1.setSize(this.scale.width, this.scale.height);
    }
    if (this.overlay2) {
      const overlay2Height = isCompact ? 130 : 192;
      this.overlay2.setPosition(centerX, this.scale.height - (overlay2Height / 2));
      this.overlay2.setSize(this.scale.width, overlay2Height);
    }

    // 2. 타이틀 재배치
    const titleY = isCompact ? centerY - 110 : centerY - 126;
    const titleFontSize = isCompact ? "34px" : "46px";
    const subtitleFontSize = isCompact ? "14px" : "18px";
    const subtitleOffset = isCompact ? 38 : 52;

    if (this.titleShadow) {
      this.titleShadow.setPosition(centerX + 3, titleY + 4);
      this.titleShadow.setFontSize(titleFontSize);
    }
    if (this.titleText) {
      this.titleText.setPosition(centerX, titleY);
      this.titleText.setFontSize(titleFontSize);
    }
    if (this.subtitleText) {
      this.subtitleText.setPosition(centerX, titleY + subtitleOffset);
      this.subtitleText.setFontSize(subtitleFontSize);
    }

    // 3. 버튼 리스트 재배치
    this.options.forEach((option, index) => {
      const y = startY + buttonLayout.gap * index;
      
      option.box.setPosition(centerX, y);
      option.box.setSize(buttonLayout.width, buttonLayout.height);
      option.shadow.setPosition(centerX + 3, y + 4);
      option.shadow.setSize(buttonLayout.width, buttonLayout.height);
      
      option.text.setPosition(centerX, y);
      option.text.setFontSize(buttonFontSize);
    });

    this.updateSelection();
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

  getTtsLabel() {
    return this.registry.get("ttsEnabled") === true ? "음성 안내: 켜기" : "음성 안내: 끄기";
  }

  toggleTts() {
    const nextValue = this.registry.get("ttsEnabled") !== true;
    this.registry.set("ttsEnabled", nextValue);

    try {
      window.localStorage?.setItem("samgakji_tts_enabled", nextValue ? "true" : "false");
    } catch (e) {}

    const ttsOption = this.options.find((option) => option.kind === "tts");
    ttsOption?.text.setText(this.getTtsLabel());
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
