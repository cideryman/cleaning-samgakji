export default class ObjectVisibilitySystem {
  constructor(scene) {
    this.scene = scene;
  }

  updateBehindObjectsOpacity() {
    const scene = this.scene;
    if (!scene.player || !scene.player.active) return;

    const playerBounds = scene.player.getBounds();
    this.getTransparencyCandidates().forEach((object) => {
      this.updateObjectOpacity(object, playerBounds);
    });
  }

  getTransparencyCandidates() {
    const scene = this.scene;
    const candidates = [];

    Object.values(scene.mapObjects || {}).forEach((object) => {
      if (this.canFadeObject(object)) {
        candidates.push(object);
      }
    });

    if (this.canFadeObject(scene.vendingMachine)) {
      candidates.push(scene.vendingMachine);
    }

    return candidates;
  }

  canFadeObject(object) {
    return Boolean(object?.active && object.visible && typeof object.getBounds === "function");
  }

  updateObjectOpacity(object, playerBounds) {
    const objectBounds = object.getBounds();
    const behindZone = new Phaser.Geom.Rectangle(
      objectBounds.x,
      objectBounds.y,
      objectBounds.width,
      objectBounds.height * 0.75,
    );

    const shouldFade = Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, behindZone);
    this.setObjectAlpha(object, shouldFade ? 0.5 : 1);
  }

  setObjectAlpha(object, targetAlpha) {
    const isFading = targetAlpha < 1;
    const transitionKey = isFading ? "isTransitioningToSemiTransparent" : "isTransitioningToOpaque";
    const oppositeKey = isFading ? "isTransitioningToOpaque" : "isTransitioningToSemiTransparent";

    if (object.alpha === targetAlpha || object.getData(transitionKey)) return;

    object.setData(transitionKey, true);
    object.setData(oppositeKey, false);
    this.scene.tweens.add({
      targets: object,
      alpha: targetAlpha,
      duration: 150,
      overwrite: true,
      onComplete: () => {
        object.setData(transitionKey, false);
      },
    });
  }
}
