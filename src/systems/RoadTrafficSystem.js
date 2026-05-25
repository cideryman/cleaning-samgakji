import { GAME_CONFIG } from "../config/GameConstants.js";

export default class RoadTrafficSystem {
  constructor(scene) {
    this.scene = scene;
    this.vehicles = [];
    this.stopLines = [];
    this.enabled = true;
  }

  create() {
    this.cleanup();

    const scene = this.scene;
    const stop = scene.getTravelBusStopPoint();
    const baseY = stop?.y ?? GAME_CONFIG.busStop.y;
    const leftLanePoint = scene.getMapPoint("traffic_left_lane", null)
      || scene.getMapPoint("road_left_lane", null)
      || scene.getMapPoint("vehicle_left_lane", null);
    const rightLanePoint = scene.getMapPoint("traffic_right_lane", null)
      || scene.getMapPoint("road_right_lane", null)
      || scene.getMapPoint("vehicle_right_lane", null);
    const startLeft = GAME_CONFIG.worldWidth + 220;
    const startRight = -220;
    const leftLaneY = Number(leftLanePoint?.y ?? baseY - 36);
    const rightLaneY = Number(rightLanePoint?.y ?? baseY + 18);

    this.createStopLines();

    const vehicles = [
      { texture: "car_blue_left", anim: "car_blue_left_drive", direction: "left", x: startLeft, y: leftLaneY, speed: 58, displayWidth: 118, displayHeight: 59, offset: 1.05 },
      { texture: "car_yellow_left", anim: "car_yellow_left_drive", direction: "left", x: startLeft + 560, y: leftLaneY - 4, speed: 52, displayWidth: 118, displayHeight: 59, offset: 1.03 },
      { texture: "car_white_left", anim: "car_white_left_drive", direction: "left", x: startLeft + 1080, y: leftLaneY + 2, speed: 54, displayWidth: 118, displayHeight: 59, offset: 1.04 },
      { texture: "car_red_right", anim: "car_red_right_drive", direction: "right", x: startRight, y: rightLaneY, speed: 56, displayWidth: 120, displayHeight: 60, offset: 0.22 },
      { texture: "car_white_right", anim: "car_white_right_drive", direction: "right", x: startRight - 520, y: rightLaneY + 2, speed: 50, displayWidth: 120, displayHeight: 60, offset: 0.24 },
    ];

    this.vehicles = vehicles
      .filter((config) => scene.textures.exists(config.texture))
      .map((config) => {
        const sprite = scene.add.sprite(config.x, config.y, config.texture, 0);
        sprite.setOrigin(0.5, 0.5);
        sprite.setDisplaySize(config.displayWidth, config.displayHeight);
        sprite.setData("trafficConfig", config);
        sprite.setDepth(this.getVehicleDepth(sprite, config));
        if (scene.anims.exists(config.anim)) {
          sprite.anims.play(config.anim);
        }
        return sprite;
      });

    this.updateSignalDepths();
  }

  cleanup() {
    const scene = this.scene;
    this.vehicles.forEach((vehicle) => {
      scene.tweens.killTweensOf(vehicle);
      vehicle?.destroy?.();
    });
    this.vehicles = [];
    this.stopLines.forEach((line) => line?.destroy?.());
    this.stopLines = [];
  }

  update(delta = 16.67) {
    if (!this.vehicles.length || !this.enabled) return;

    const scene = this.scene;
    const seconds = Math.min(0.05, Math.max(0, delta / 1000));
    const isPedestrianGreen = this.isPedestrianSignalGreen();
    this.updatePedestrianSignalFrames(isPedestrianGreen);
    const shouldCarsStop = isPedestrianGreen;

    this.vehicles.forEach((vehicle) => {
      if (!vehicle?.active) return;
      const config = vehicle.getData("trafficConfig");
      if (!config) return;

      const direction = config.direction === "left" ? -1 : 1;
      const step = config.speed * seconds * direction;
      const stopCenterX = shouldCarsStop ? this.getVehicleStopCenterAhead(vehicle, step, config.direction) : null;
      if (Number.isFinite(stopCenterX)) {
        vehicle.x = stopCenterX;
        vehicle.anims?.pause?.();
      } else {
        if (vehicle.anims?.isPaused && scene.anims.exists(config.anim)) {
          vehicle.anims.resume();
        }
        vehicle.x += step;
      }

      this.wrapVehicle(vehicle, config);
      vehicle.setDepth(this.getVehicleDepth(vehicle, config));
    });
  }

  getCrosswalkXs() {
    const scene = this.scene;
    const crosswalks = [
      scene.getMapPoint("crosswalk_west", null)?.x,
      scene.getMapPoint("crosswalk_east", null)?.x,
    ].filter((x) => Number.isFinite(Number(x))).map(Number)
      .sort((a, b) => a - b);

    return crosswalks.length > 0 ? crosswalks : [472, 1144];
  }

  getStopLinePoints(direction) {
    const prefixes = direction === "left"
      ? ["vehicle_stop_left", "vehicle_stop_line_left", "stop_line_left"]
      : ["vehicle_stop_right", "vehicle_stop_line_right", "stop_line_right"];

    const points = Object.entries(this.scene.mapPoints || {})
      .filter(([key]) => prefixes.some((prefix) => key.startsWith(prefix)))
      .map(([key, point]) => ({ key, x: Number(point.x), y: Number(point.y) }))
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));

    return points.sort((a, b) => a.x - b.x);
  }

  getAllStopLinePoints() {
    const byKey = new Map();
    [...this.getStopLinePoints("left"), ...this.getStopLinePoints("right")].forEach((point) => {
      byKey.set(point.key, point);
    });
    return [...byKey.values()];
  }

  createStopLines() {
    const scene = this.scene;
    const stopLinePoints = this.getAllStopLinePoints();
    if (!stopLinePoints.length) return;

    this.stopLines = stopLinePoints.map((point) => {
      const line = scene.add.image(point.x, point.y, "vehicle_stop_line");
      line.setOrigin(0.5);
      line.setDisplaySize(32, 32);
      line.setDepth(scene.getWorldDepth(point.y, -0.75));
      line.setName(point.key);
      return line;
    });
  }

  updateSignalDepths() {
    const scene = this.scene;
    const leftLaneY = Number(scene.getMapPoint("traffic_left_lane", null)?.y ?? 207);
    const rightLaneY = Number(scene.getMapPoint("traffic_right_lane", null)?.y ?? 255);
    Object.entries(scene.mapObjects || {}).forEach(([key, object]) => {
      if (!object?.setDepth) return;
      const name = key.toLowerCase();
      const isTrafficObject = ["traffic", "crosswalk_sign", "stop_sign"].some((keyword) => name.includes(keyword));
      if (!isTrafficObject) return;

      if (object.y <= leftLaneY + 10) {
        object.setDepth(scene.getWorldDepth(leftLaneY, -1.25));
      } else if (object.y >= rightLaneY - 10) {
        object.setDepth(scene.getWorldDepth(rightLaneY, 2.25));
      } else {
        object.setDepth(scene.getWorldDepth(scene.getDepthSortY(object), -0.5));
      }
    });
  }

  isPedestrianSignalGreen() {
    const redMs = 3200;
    const greenMs = 5600;
    const elapsed = (this.scene.time.now || 0) % (redMs + greenMs);
    return elapsed >= redMs;
  }

  updatePedestrianSignalFrames(isGreen) {
    Object.values(this.scene.mapObjects || {}).forEach((object) => {
      if (object?.texture?.key !== "pedestrian_light") return;
      object.anims?.stop?.();
      object.setFrame(isGreen ? 1 : 0);
    });
  }

  getVehicleStopCenterAhead(vehicle, step, direction) {
    const stopLinePoints = this.getStopLinePoints(direction).map((point) => point.x);
    const stopLines = stopLinePoints.length > 0
      ? stopLinePoints
      : this.getCrosswalkXs().map((x) => direction === "right" ? x - 62 : x + 62);
    const halfWidth = (vehicle.displayWidth || 100) / 2;

    if (direction === "right") {
      const upcoming = stopLines.find((x) => vehicle.x < x - 8);
      if (!upcoming) return null;
      const stopCenter = upcoming - halfWidth - 4;
      return vehicle.x <= stopCenter && vehicle.x + step >= stopCenter - 2 ? stopCenter : null;
    }

    const upcoming = [...stopLines].reverse().find((x) => vehicle.x > x + 8);
    if (!upcoming) return null;
    const stopCenter = upcoming + halfWidth + 4;
    return vehicle.x >= stopCenter && vehicle.x + step <= stopCenter + 2 ? stopCenter : null;
  }

  wrapVehicle(vehicle, config) {
    const margin = 260;
    if (config.direction === "right" && vehicle.x > GAME_CONFIG.worldWidth + margin) {
      vehicle.x = -margin - Phaser.Math.Between(0, 360);
    } else if (config.direction === "left" && vehicle.x < -margin) {
      vehicle.x = GAME_CONFIG.worldWidth + margin + Phaser.Math.Between(0, 360);
    }
  }

  getVehicleDepth(vehicle, config) {
    const sortY = vehicle.y + (vehicle.displayHeight || 0) * 0.42;
    return this.scene.getWorldDepth(sortY, config.offset ?? 0);
  }
}
