class Preload extends Phaser.Scene {
  constructor() {
    super("Preload");
  }

  preload() {}

  create() {
    this.createPlayerTexture();
    this.createTrashSlimeTexture();
    this.createBroomTexture();
    this.createBlockTexture("clean_tile", 32, 32, "#f6fff3", "#6fcf97");
    this.createFlowerTexture();
    this.createBlockTexture("sweep_hitbox", 96, 72, "#fff3a3", "#f2c94c");

    this.scene.start("PlayScene");
  }

  createPlayerTexture() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    this.drawRect(g, 52, 18, 24, 20, "#4a2c1f");
    this.drawRect(g, 48, 34, 32, 28, "#f2c08b");
    this.drawRect(g, 44, 60, 40, 42, "#2f80ed");
    this.drawRect(g, 50, 66, 28, 30, "#ffffff");
    this.drawRect(g, 42, 66, 10, 28, "#f2c08b");
    this.drawRect(g, 78, 66, 10, 28, "#f2c08b");
    this.drawRect(g, 54, 100, 10, 16, "#23406f");
    this.drawRect(g, 68, 100, 10, 16, "#23406f");
    this.drawRect(g, 90, 32, 8, 74, "#8d5a24");
    this.drawRect(g, 82, 96, 24, 14, "#f2c94c");
    this.drawRect(g, 84, 42, 8, 8, "#21352c");
    this.drawRect(g, 92, 40, 8, 8, "#21352c");
    this.drawRect(g, 56, 44, 6, 6, "#21352c");
    this.drawRect(g, 68, 44, 6, 6, "#21352c");
    g.generateTexture("player", 128, 128);
    g.destroy();
  }

  createTrashSlimeTexture() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    this.drawRect(g, 52, 12, 24, 18, "#101418");
    this.drawRect(g, 44, 28, 40, 16, "#252b33");
    this.drawRect(g, 28, 44, 72, 18, "#313844");
    this.drawRect(g, 20, 62, 88, 22, "#313844");
    this.drawRect(g, 16, 84, 96, 22, "#252b33");
    this.drawRect(g, 24, 106, 80, 10, "#101418");
    this.drawRect(g, 38, 70, 16, 14, "#ffe34d");
    this.drawRect(g, 74, 70, 16, 14, "#ffe34d");
    this.drawRect(g, 42, 74, 10, 8, "#fff17a");
    this.drawRect(g, 78, 74, 10, 8, "#fff17a");
    this.drawRect(g, 24, 78, 16, 24, "#e84b3c");
    this.drawRect(g, 18, 82, 12, 20, "#3d8ddb");
    this.drawRect(g, 88, 76, 18, 18, "#48b85f");
    this.drawRect(g, 96, 84, 14, 14, "#76d36f");
    this.drawRect(g, 30, 48, 16, 8, "#4d5663");
    this.drawRect(g, 72, 48, 20, 8, "#4d5663");
    g.generateTexture("trash_slime", 128, 128);
    g.destroy();
  }

  createBroomTexture() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    this.drawRect(g, 34, 22, 8, 76, "#8d5a24");
    this.drawRect(g, 42, 30, 8, 76, "#b8792f");
    this.drawRect(g, 46, 82, 42, 12, "#f2c94c");
    this.drawRect(g, 50, 94, 36, 18, "#f2994a");
    this.drawRect(g, 54, 108, 28, 8, "#c46d2d");
    this.drawRect(g, 72, 22, 8, 8, "#ffffff");
    this.drawRect(g, 84, 34, 8, 8, "#ffffff");
    this.drawRect(g, 66, 40, 8, 8, "#ffe34d");
    this.drawRect(g, 94, 52, 8, 8, "#ffe34d");
    this.drawRect(g, 58, 22, 6, 6, "#ffe34d");
    g.generateTexture("broom_item", 128, 128);
    g.destroy();
  }

  createFlowerTexture() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    this.drawRect(g, 14, 16, 4, 12, "#2f8f5b");
    this.drawRect(g, 10, 22, 6, 4, "#48b85f");
    this.drawRect(g, 18, 20, 6, 4, "#48b85f");
    this.drawRect(g, 14, 8, 4, 4, "#f2c94c");
    this.drawRect(g, 10, 12, 4, 4, "#f2994a");
    this.drawRect(g, 18, 12, 4, 4, "#f2994a");
    this.drawRect(g, 14, 16, 4, 4, "#f2994a");
    this.drawRect(g, 14, 12, 4, 4, "#fff3a3");
    this.drawRect(g, 8, 28, 18, 3, "#6fcf97");
    g.generateTexture("flower", 32, 32);
    g.destroy();
  }

  drawRect(graphics, x, y, width, height, fill) {
    graphics.fillStyle(Phaser.Display.Color.HexStringToColor(fill).color, 1);
    graphics.fillRect(x, y, width, height);
  }

  createBlockTexture(key, width, height, fill, stroke) {
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(Phaser.Display.Color.HexStringToColor(fill).color, 1);
    graphics.fillRoundedRect(2, 2, width - 4, height - 4, 6);
    graphics.lineStyle(3, Phaser.Display.Color.HexStringToColor(stroke).color, 1);
    graphics.strokeRoundedRect(2, 2, width - 4, height - 4, 6);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }
}
