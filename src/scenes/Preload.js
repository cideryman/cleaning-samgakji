const EXTERNAL_ASSETS = [
  { key: "player", path: "assets/sprites/player.png", fallback: "createPlayerTexture" },
  { key: "trash_slime", path: "assets/sprites/trash-slime.png", fallback: "createTrashSlimeTexture" },
  { key: "broom_item", path: "assets/sprites/broom.png", fallback: "createBroomTexture" },
  { key: "flower", path: "assets/sprites/flower.png", fallback: "createFlowerTexture" },
  { key: "grass_tile", path: "assets/tiles/grass.png", fallback: "createGrassTileTexture" },
  { key: "path_tile", path: "assets/tiles/path.png", fallback: "createPathTileTexture" },
  { key: "sidewalk_tile", path: "assets/tiles/sidewalk.png", fallback: "createSidewalkTileTexture" },
  { key: "building_tile", path: "assets/tiles/building.png", fallback: "createBuildingTileTexture" },
  { key: "garden_tile", path: "assets/tiles/garden.png", fallback: "createGardenTileTexture" },
  { key: "road_tile", path: "assets/tiles/road.png", fallback: "createRoadTileTexture" },
];

class Preload extends Phaser.Scene {
  constructor() {
    super("Preload");
  }

  preload() {
    EXTERNAL_ASSETS.forEach((asset) => {
      this.load.image(asset.key, asset.path);
    });
  }

  create() {
    this.createMissingExternalTextures();
    this.createBlockTexture("clean_tile", 32, 32, "#f6fff3", "#6fcf97");
    this.createBlockTexture("sweep_hitbox", 96, 72, "#fff3a3", "#f2c94c");

    this.scene.start("PlayScene");
  }

  createMissingExternalTextures() {
    EXTERNAL_ASSETS.forEach((asset) => {
      if (!this.textures.exists(asset.key)) {
        this[asset.fallback]();
      }
    });
  }

  createPlayerTexture() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    this.drawEllipse(g, 32, 108, 68, 12, "#21352c", 0.22);
    this.drawRect(g, 96, 32, 8, 72, "#6b451f");
    this.drawRect(g, 104, 32, 4, 72, "#b8792f");
    this.drawRect(g, 96, 100, 24, 8, "#f2c94c");
    this.drawRect(g, 100, 108, 18, 12, "#f2994a");
    this.drawRect(g, 48, 20, 32, 10, "#4a2c1f");
    this.drawRect(g, 44, 28, 40, 22, "#4a2c1f");
    this.drawRect(g, 48, 42, 32, 24, "#f0b27f");
    this.drawRect(g, 44, 50, 8, 12, "#f0b27f");
    this.drawRect(g, 76, 50, 8, 12, "#f0b27f");
    this.drawRect(g, 52, 50, 4, 4, "#21352c");
    this.drawRect(g, 72, 50, 4, 4, "#21352c");
    this.drawRect(g, 60, 60, 12, 4, "#b46c55");
    this.drawRect(g, 52, 66, 24, 8, "#f0b27f");
    this.drawRect(g, 36, 72, 56, 44, "#244a87");
    this.drawRect(g, 40, 76, 48, 36, "#2f80ed");
    this.drawRect(g, 48, 72, 32, 40, "#fff7df");
    this.drawRect(g, 44, 84, 40, 4, "#9fd1ff");
    this.drawRect(g, 52, 96, 24, 4, "#e0ecff");
    this.drawRect(g, 28, 76, 12, 32, "#f0b27f");
    this.drawRect(g, 88, 76, 12, 32, "#f0b27f");
    this.drawRect(g, 92, 92, 8, 8, "#d89064");
    this.drawRect(g, 44, 116, 16, 12, "#244a87");
    this.drawRect(g, 68, 116, 16, 12, "#244a87");
    this.drawRect(g, 40, 124, 20, 4, "#17243a");
    this.drawRect(g, 68, 124, 20, 4, "#17243a");
    this.drawRect(g, 40, 72, 4, 36, "#8ec5ff");
    this.drawRect(g, 84, 72, 4, 36, "#1c5fb8");
    g.generateTexture("player", 128, 128);
    g.destroy();
  }

  createTrashSlimeTexture() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    this.drawEllipse(g, 20, 100, 88, 20, "#21352c", 0.28);
    this.drawRect(g, 56, 8, 20, 16, "#101418");
    this.drawRect(g, 48, 20, 36, 16, "#101418");
    this.drawRect(g, 32, 36, 68, 12, "#101418");
    this.drawRect(g, 20, 48, 92, 16, "#101418");
    this.drawRect(g, 12, 64, 108, 36, "#101418");
    this.drawRect(g, 16, 100, 100, 12, "#101418");
    this.drawRect(g, 60, 12, 12, 12, "#3d4652");
    this.drawRect(g, 52, 24, 28, 12, "#424c5a");
    this.drawRect(g, 36, 40, 60, 16, "#46515f");
    this.drawRect(g, 24, 52, 84, 20, "#3a4350");
    this.drawRect(g, 16, 68, 100, 28, "#333b47");
    this.drawRect(g, 24, 96, 84, 8, "#2c333e");
    this.drawRect(g, 40, 44, 16, 4, "#627081");
    this.drawRect(g, 80, 48, 16, 4, "#627081");
    this.drawRect(g, 36, 64, 12, 4, "#566373");
    this.drawRect(g, 68, 68, 12, 4, "#566373");
    this.drawRect(g, 36, 68, 20, 16, "#15191f");
    this.drawRect(g, 76, 68, 20, 16, "#15191f");
    this.drawRect(g, 40, 72, 12, 8, "#ffe34d");
    this.drawRect(g, 80, 72, 12, 8, "#ffe34d");
    this.drawRect(g, 48, 72, 4, 4, "#fff6a2");
    this.drawRect(g, 88, 72, 4, 4, "#fff6a2");
    this.drawRect(g, 16, 76, 12, 20, "#2f80ed");
    this.drawRect(g, 20, 72, 12, 4, "#79c6ff");
    this.drawRect(g, 28, 76, 12, 20, "#eb5757");
    this.drawRect(g, 96, 72, 16, 16, "#6fcf97");
    this.drawRect(g, 104, 68, 8, 8, "#a7f0aa");
    this.drawRect(g, 60, 92, 12, 4, "#171b21");
    this.drawRect(g, 28, 100, 20, 4, "#0f1318");
    this.drawRect(g, 84, 100, 20, 4, "#0f1318");
    g.generateTexture("trash_slime", 128, 128);
    g.destroy();
  }

  createBroomTexture() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    this.drawEllipse(g, 28, 100, 72, 16, "#21352c", 0.22);
    this.drawRect(g, 80, 16, 4, 16, "#fff3a3");
    this.drawRect(g, 72, 24, 20, 4, "#fff3a3");
    this.drawRect(g, 100, 40, 4, 12, "#ffe34d");
    this.drawRect(g, 96, 44, 12, 4, "#ffe34d");
    for (let i = 0; i < 13; i += 1) {
      this.drawRect(g, 28 + i * 4, 18 + i * 4, 8, 8, "#6b451f");
      this.drawRect(g, 32 + i * 4, 18 + i * 4, 4, 4, "#c48237");
    }
    this.drawPolygon(g, [[72, 60], [108, 80], [96, 116], [52, 100]], "#6b451f");
    this.drawPolygon(g, [[72, 64], [104, 80], [92, 108], [56, 96]], "#f2c94c");
    this.drawRect(g, 60, 96, 8, 20, "#f2994a");
    this.drawRect(g, 72, 100, 8, 20, "#f2994a");
    this.drawRect(g, 84, 100, 8, 16, "#c46d2d");
    this.drawRect(g, 52, 88, 52, 8, "#ffe34d");
    g.generateTexture("broom_item", 128, 128);
    g.destroy();
  }

  createFlowerTexture() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    this.drawEllipse(g, 36, 104, 56, 12, "#2f8f5b", 0.35);
    this.drawRect(g, 60, 56, 8, 48, "#2f8f5b");
    this.drawRect(g, 48, 80, 16, 8, "#48b85f");
    this.drawRect(g, 68, 72, 16, 8, "#48b85f");
    this.drawRect(g, 60, 28, 8, 8, "#fff3a3");
    this.drawRect(g, 48, 36, 12, 12, "#f2994a");
    this.drawRect(g, 68, 36, 12, 12, "#f2994a");
    this.drawRect(g, 56, 48, 16, 16, "#f2c94c");
    this.drawRect(g, 60, 44, 8, 8, "#fff3a3");
    g.generateTexture("flower", 128, 128);
    g.destroy();
  }

  createGrassTileTexture() {
    this.createTileTexture("grass_tile", "#9acb87", [
      ["rect", 3, 5, 4, 2, "#a9d895"],
      ["rect", 22, 9, 3, 2, "#8fbd7d"],
      ["rect", 12, 23, 4, 2, "#8fbd7d"],
      ["rect", 28, 26, 3, 2, "#b2dc9f"],
    ]);
  }

  createPathTileTexture() {
    this.createTileTexture("path_tile", "#d8c59a", [
      ["rect", 0, 0, 32, 1, "#e2d0a8"],
      ["rect", 6, 9, 5, 2, "#cab68c"],
      ["rect", 19, 20, 6, 2, "#e6d5ae"],
      ["rect", 28, 7, 3, 2, "#c8b185"],
    ]);
  }

  createSidewalkTileTexture() {
    this.createTileTexture("sidewalk_tile", "#cbbd95", [
      ["rect", 0, 15, 32, 1, "#b6a982"],
      ["rect", 15, 0, 1, 32, "#d6caa5"],
      ["rect", 4, 4, 2, 2, "#ded2ad"],
    ]);
  }

  createBuildingTileTexture() {
    this.createTileTexture("building_tile", "#8e9b98", [
      ["rect", 2, 2, 11, 11, "#aebbb8"],
      ["rect", 20, 4, 10, 8, "#768581"],
      ["rect", 5, 20, 22, 4, "#dbe5e2"],
    ]);
  }

  createGardenTileTexture() {
    this.createTileTexture("garden_tile", "#b2d18d", [
      ["rect", 5, 7, 4, 2, "#8fbd7d"],
      ["rect", 16, 14, 6, 2, "#c6e2a3"],
      ["rect", 24, 24, 4, 2, "#7fb46d"],
    ]);
  }

  createRoadTileTexture() {
    this.createTileTexture("road_tile", "#303a37", [
      ["rect", 15, 0, 2, 32, "#4b5955"],
      ["rect", 25, 4, 3, 8, "#f1f1e6"],
      ["rect", 25, 20, 3, 8, "#f1f1e6"],
    ]);
  }

  createTileTexture(key, fill, marks) {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    this.drawRect(g, 0, 0, 32, 32, fill);
    marks.forEach((mark) => {
      const [, x, y, width, height, color] = mark;
      this.drawRect(g, x, y, width, height, color);
    });
    g.generateTexture(key, 32, 32);
    g.destroy();
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

  drawRect(graphics, x, y, width, height, fill, alpha = 1) {
    graphics.fillStyle(Phaser.Display.Color.HexStringToColor(fill).color, alpha);
    graphics.fillRect(x, y, width, height);
  }

  drawEllipse(graphics, x, y, width, height, fill, alpha = 1) {
    graphics.fillStyle(Phaser.Display.Color.HexStringToColor(fill).color, alpha);
    graphics.fillEllipse(x + width / 2, y + height / 2, width, height);
  }

  drawPolygon(graphics, points, fill, alpha = 1) {
    graphics.fillStyle(Phaser.Display.Color.HexStringToColor(fill).color, alpha);
    graphics.beginPath();
    graphics.moveTo(points[0][0], points[0][1]);
    points.slice(1).forEach(([x, y]) => graphics.lineTo(x, y));
    graphics.closePath();
    graphics.fillPath();
  }
}
