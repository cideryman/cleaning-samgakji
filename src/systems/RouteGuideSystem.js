import { GAME_CONFIG } from "../config/GameConstants.js";

export default class RouteGuideSystem {
  constructor(scene) {
    this.scene = scene;
    this.graphics = null;
  }

  update() {
    const scene = this.scene;
    if (!scene.player?.active) {
      this.clear();
      return;
    }

    const routeGuide = this.getActiveRouteGuide();
    if (!routeGuide?.target) {
      this.clear();
      return;
    }

    if (!this.graphics) {
      this.graphics = scene.add.graphics();
      this.graphics.setDepth(18);
    }

    const start = { x: scene.player.x, y: scene.player.y + 8 };
    const target = routeGuide.target;
    const route = routeGuide.useCrosswalk
      ? scene.buildNpcRouteThroughCrosswalk(start, target)
      : this.buildOrthogonalRoute(start, target);
    const points = [start, ...route].filter((point, index, array) => {
      if (index === 0) return true;
      const previous = array[index - 1];
      return Phaser.Math.Distance.Between(previous.x, previous.y, point.x, point.y) > 8;
    });

    this.graphics.clear();
    this.drawDashedPath(points);
  }

  clear() {
    this.graphics?.clear();
  }

  destroy() {
    this.graphics?.destroy();
    this.graphics = null;
  }

  buildOrthogonalRoute(start, target) {
    const bend = Math.abs(target.x - start.x) > 24
      ? { x: target.x, y: start.y }
      : { x: start.x, y: target.y };
    return [bend, target];
  }

  getActiveRouteGuide() {
    const scene = this.scene;
    if (scene.packingQuestState === "going_bus_stop") {
      return {
        key: "bus_stop",
        target: scene.getTravelBusArrivalPoint(),
        useCrosswalk: false,
      };
    }

    const recycleQuestState = scene.questManager?.getRecycleQuestState?.();
    if (["unlocked", "active"].includes(recycleQuestState)) {
      return {
        key: "recycling_center",
        target: scene.getMapPoint("recycling_center", GAME_CONFIG.recyclingCenter),
        useCrosswalk: true,
      };
    }

    if (["wallet_missing", "wallet_found"].includes(scene.jjookQuestState) && scene.jjookNpc?.active) {
      return {
        key: "jjook",
        target: { x: scene.jjookNpc.x, y: scene.jjookNpc.y },
        useCrosswalk: true,
      };
    }

    if (scene.sunisuniQuestState === "sunisuni_found" && scene.sunisuniNpc?.active) {
      return {
        key: "sunisuni",
        target: { x: scene.sunisuniNpc.x, y: scene.sunisuniNpc.y },
        useCrosswalk: true,
      };
    }

    if (scene.sunisuniQuestState === "going_hospital") {
      return {
        key: "hospital",
        target: scene.getMapPoint("hospital_door", GAME_CONFIG.hospitalDoor),
        useCrosswalk: true,
      };
    }

    if (scene.sunisuniQuestState === "going_pharmacy") {
      return {
        key: "pharmacy",
        target: scene.getMapPoint("pharmacy_door", GAME_CONFIG.pharmacyDoor),
        useCrosswalk: true,
      };
    }

    if (scene.clothesQuestState === "shopping") {
      return {
        key: "clothing_store",
        target: scene.getMapPoint("clothing_store_door", GAME_CONFIG.clothingStoreDoor),
        useCrosswalk: true,
      };
    }

    return null;
  }

  drawDashedPath(points) {
    const graphics = this.graphics;
    if (!graphics || points.length < 2) return;

    const dashLength = 18;
    const gapLength = 12;
    const shadowColor = 0x21352c;
    const lineColor = 0xffd95a;
    const drawSegment = (from, to, offsetX = 0, offsetY = 0) => {
      const distance = Phaser.Math.Distance.Between(from.x, from.y, to.x, to.y);
      if (distance <= 0) return;

      const angle = Phaser.Math.Angle.Between(from.x, from.y, to.x, to.y);
      let progress = 14;
      while (progress < distance) {
        const nextProgress = Math.min(progress + dashLength, distance);
        const x1 = from.x + Math.cos(angle) * progress + offsetX;
        const y1 = from.y + Math.sin(angle) * progress + offsetY;
        const x2 = from.x + Math.cos(angle) * nextProgress + offsetX;
        const y2 = from.y + Math.sin(angle) * nextProgress + offsetY;
        graphics.beginPath();
        graphics.moveTo(x1, y1);
        graphics.lineTo(x2, y2);
        graphics.strokePath();
        progress += dashLength + gapLength;
      }
    };

    graphics.lineStyle(8, shadowColor, 0.35);
    points.slice(0, -1).forEach((point, index) => drawSegment(point, points[index + 1], 2, 2));
    graphics.lineStyle(5, lineColor, 0.88);
    points.slice(0, -1).forEach((point, index) => drawSegment(point, points[index + 1]));

    const beforeEnd = points[points.length - 2];
    const end = points[points.length - 1];
    const angle = Phaser.Math.Angle.Between(beforeEnd.x, beforeEnd.y, end.x, end.y);
    const tip = {
      x: end.x,
      y: end.y,
    };
    const left = {
      x: end.x - Math.cos(angle - 0.72) * 20,
      y: end.y - Math.sin(angle - 0.72) * 20,
    };
    const right = {
      x: end.x - Math.cos(angle + 0.72) * 20,
      y: end.y - Math.sin(angle + 0.72) * 20,
    };

    graphics.fillStyle(shadowColor, 0.35);
    graphics.fillTriangle(tip.x + 2, tip.y + 2, left.x + 2, left.y + 2, right.x + 2, right.y + 2);
    graphics.fillStyle(lineColor, 0.95);
    graphics.fillTriangle(tip.x, tip.y, left.x, left.y, right.x, right.y);
  }
}
