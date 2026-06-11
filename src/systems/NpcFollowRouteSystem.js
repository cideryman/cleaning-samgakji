export default class NpcFollowRouteSystem {
  constructor(scene) {
    this.scene = scene;
    this.states = new Map();
  }

  clear(key) {
    this.states.delete(key);
  }

  clearAll() {
    this.states.clear();
  }

  follow(key, sprite, npcTextureKey, target, {
    speed = 90,
    stopDistance = 64,
    repathMs = 650,
    targetMoveTolerance = 36,
  } = {}) {
    if (!sprite?.active || !target) return false;

    const scene = this.scene;
    const distanceToTarget = Phaser.Math.Distance.Between(sprite.x, sprite.y, target.x, target.y);
    if (distanceToTarget <= stopDistance) {
      this.clear(key);
      scene.stopNpcWalk?.(sprite, npcTextureKey);
      return false;
    }

    const state = this.getState(key);
    const now = scene.time?.now ?? 0;
    const shouldRepath = this.shouldRepath(state, target, now, targetMoveTolerance, repathMs);
    if (shouldRepath) {
      this.rebuildRoute(state, sprite, target, now, repathMs);
    }

    const nextPoint = this.getNextPoint(state, sprite);
    if (!nextPoint) {
      return this.moveDirect(sprite, npcTextureKey, target, speed);
    }

    return this.moveDirect(sprite, npcTextureKey, nextPoint, speed);
  }

  getState(key) {
    if (!this.states.has(key)) {
      this.states.set(key, {
        route: [],
        lastTarget: null,
        nextRepathAt: 0,
      });
    }
    return this.states.get(key);
  }

  shouldRepath(state, target, now, targetMoveTolerance, repathMs) {
    if (!state.route.length) return true;
    if (now < state.nextRepathAt) return false;
    if (!state.lastTarget) return true;

    const targetMoved = Phaser.Math.Distance.Between(
      state.lastTarget.x,
      state.lastTarget.y,
      target.x,
      target.y
    ) >= targetMoveTolerance;
    return targetMoved || repathMs <= 0;
  }

  rebuildRoute(state, sprite, target, now, repathMs) {
    const path = this.scene.pathfindingSystem?.findPath?.(sprite.x, sprite.y, target.x, target.y);
    state.route = Array.isArray(path)
      ? path
          .map((point) => ({ x: point.x, y: point.y }))
          .filter((point) => Phaser.Math.Distance.Between(sprite.x, sprite.y, point.x, point.y) > 8)
      : [];
    state.lastTarget = { x: target.x, y: target.y };
    state.nextRepathAt = now + repathMs;
  }

  getNextPoint(state, sprite) {
    while (state.route.length) {
      const point = state.route[0];
      if (Phaser.Math.Distance.Between(sprite.x, sprite.y, point.x, point.y) > 7) {
        return point;
      }
      state.route.shift();
    }
    return null;
  }

  moveDirect(sprite, npcTextureKey, target, speed) {
    const scene = this.scene;
    const distance = Phaser.Math.Distance.Between(sprite.x, sprite.y, target.x, target.y);
    if (distance <= 1) {
      scene.stopNpcWalk?.(sprite, npcTextureKey);
      return false;
    }

    const step = Math.min((scene.game.loop.delta / 1000) * speed, distance);
    const angle = Phaser.Math.Angle.Between(sprite.x, sprite.y, target.x, target.y);
    const moveX = Math.cos(angle) * step;
    const moveY = Math.sin(angle) * step;

    sprite.x += moveX;
    sprite.y += moveY;

    const directionKey = scene.getDirectionKeyFromVector?.(
      moveX,
      moveY,
      sprite.getData("directionKey") || "down"
    ) || "down";
    scene.setNpcDirectionTexture?.(sprite, npcTextureKey, directionKey, true);
    return true;
  }
}
