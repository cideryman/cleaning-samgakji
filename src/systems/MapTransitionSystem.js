export default class MapTransitionSystem {
  constructor(scene) {
    this.scene = scene;
    this.lastPromptAt = 0;
    this.promptCooldown = 3500;
    this.gateRadius = 72;
    this.gateReleaseRadius = 96;
    this.transitioning = false;
    this.hiddenMainNpcState = null;
    this.suppressedGate = null;
    this.transitionSafetyTimer = null;
    this.pendingSpawn = null;
  }

  update(time = 0) {
    const scene = this.scene;
    if (this.isBlocked()) return;

    if (scene.currentWorldMapId === "chapter1_south_park") {
      this.updateSouthParkReturn(time);
      return;
    }

    this.updateSouthParkGate(time);
  }

  updateSouthParkGate(time = 0) {
    const scene = this.scene;
    const gate = scene.getMapPoint?.("south_park_gate", null);
    if (!gate || !scene.player?.active || this.transitioning) return;

    const distance = Phaser.Math.Distance.Between(scene.player.x, scene.player.y, gate.x, gate.y);
    if (this.isSuppressedGate("main", "south_park_gate", distance)) return;
    if (distance > this.gateRadius) return;

    const unlockLevel = this.getSouthParkUnlockLevel();
    const currentLevel = scene.samgakjiProgressSystem?.getCurrentLevel?.() ?? 1;
    if (currentLevel < unlockLevel) {
      this.showThrottledToast(time, `삼각지 Lv.${unlockLevel}이 되면 아래 공원으로 갈 수 있어요.`);
      return;
    }

    this.enterSouthPark();
  }

  updateSouthParkReturn(time = 0) {
    const scene = this.scene;
    const gate = scene.getMapPoint?.("samgakji_return", null);
    if (!gate || !scene.player?.active || this.transitioning) return;

    const distance = Phaser.Math.Distance.Between(scene.player.x, scene.player.y, gate.x, gate.y);
    if (this.isSuppressedGate("chapter1_south_park", "samgakji_return", distance)) return;
    if (distance > this.gateRadius) {
      this.showThrottledToast(time, "위쪽 길로 돌아가면 삼각지 중심으로 갈 수 있어요.", 5200);
      return;
    }

    this.returnToMainMap();
  }

  isSuppressedGate(mapId, gateKey, distance) {
    if (!this.suppressedGate) return false;
    if (this.suppressedGate.mapId !== mapId || this.suppressedGate.gateKey !== gateKey) return false;
    if (distance <= this.gateReleaseRadius) return true;
    this.suppressedGate = null;
    return false;
  }

  isBlocked() {
    const scene = this.scene;
    return Boolean(
      scene.sceneControlSystem?.isWorldInputBlocked?.()
      || scene.interiorSceneGroup
      || scene.pharmacyMapSystem?.isActive
      || !scene.stateManager?.canMove?.()
    );
  }

  showThrottledToast(time, text, cooldown = this.promptCooldown) {
    if (time - this.lastPromptAt < cooldown) return;
    this.lastPromptAt = time;
    this.scene.showQuestToast?.(text, 3000);
  }

  showSouthParkGatePrompt() {
    const scene = this.scene;
    const unlockLevel = this.getSouthParkUnlockLevel();
    const currentLevel = scene.samgakjiProgressSystem?.getCurrentLevel?.() ?? 1;

    if (currentLevel < unlockLevel) {
      scene.showQuestToast?.(`삼각지 Lv.${unlockLevel}이 되면 아래 공원으로 갈 수 있어요.`, 3000);
      return;
    }

    scene.showQuestToast?.("아래 공원 입구가 보여요. 이동 연결은 다음 단계에서 열릴 예정이에요.", 3000);
  }

  getSouthParkUnlockLevel() {
    const value = this.scene.mapPointMeta?.south_park_gate?.properties?.unlockLevel;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 9;
  }

  enterSouthPark() {
    this.transitionToMap({
      mapId: "chapter1_south_park",
      spawnKey: "south_park_entry",
      fallbackSpawn: { x: 896, y: 112 },
      beforeSwitch: () => {
        this.hideMainWorldActors();
        this.destroyMainWorldUtilityObjects();
        this.scene.roadTrafficSystem?.cleanup?.();
      },
      afterSwitch: () => {
        this.suppressedGate = { mapId: "chapter1_south_park", gateKey: "samgakji_return" };
        this.setMainWorldActorsVisible(false);
        this.setQuestMarkersVisible(false);
        this.scene.showQuestToast?.("삼각지 공원으로 왔어요.", 2600);
      },
    });
  }

  returnToMainMap() {
    this.transitionToMap({
      mapId: "main",
      spawnKey: "south_park_gate",
      fallbackSpawn: { x: 896, y: 1120 },
      beforeSwitch: () => {
        this.destroyMainWorldUtilityObjects();
      },
      afterSwitch: () => {
        const gate = this.scene.getMapPoint?.("south_park_gate", { x: 896, y: 1184 });
        this.scene.player?.setPosition(gate.x, Math.max(96, gate.y - 72));
        this.scene.player?.body?.reset?.(gate.x, Math.max(96, gate.y - 72));
        this.suppressedGate = { mapId: "main", gateKey: "south_park_gate" };
        this.scene.createRecyclingCenter?.();
        this.scene.roadTrafficSystem?.create?.();
        this.restoreMainWorldActors();
        this.scene.showQuestToast?.("삼각지 중심으로 돌아왔어요.", 2600);
      },
    });
  }

  transitionToMap({ mapId, spawnKey, fallbackSpawn, beforeSwitch, afterSwitch }) {
    const scene = this.scene;
    if (this.transitioning) return false;
    this.transitioning = true;
    scene.sceneControlSystem?.blockWorldInput?.(true);
    scene.playerController?.cancelMoveTarget?.();
    scene.npcFollowRouteSystem?.clearAll?.();
    scene.clearInteriorScene?.();
    this.armTransitionSafetyTimer();
    this.pendingSpawn = { spawnKey, fallbackSpawn };

    scene.cameras.main.resetFX?.();
    // World-map transitions must not rely on camera fade. A stuck fade overlay
    // can hide the whole map while the green game frame remains visible.
    scene.time.delayedCall(30, () => {
      let switched = false;

      try {
        beforeSwitch?.();
        switched = Boolean(scene.tiledMapSystem?.switchMap?.(mapId, spawnKey, fallbackSpawn))
          && scene.currentWorldMapId === mapId;
        if (switched) {
          this.forcePlayerToSpawn(spawnKey, fallbackSpawn);
          scene.neighborhoodProgressSystem?.rebuildForCurrentMap?.({ silent: true });
          this.resetTrashForCurrentMap();
          this.recoverWorldView();
          afterSwitch?.();
        } else {
          this.restoreMainWorldActors();
          scene.createRecyclingCenter?.();
          scene.showQuestToast?.("아직 이어지는 길을 찾지 못했어요.", 2600);
        }
      } catch (error) {
        console.error("Map transition failed:", error);
        if (!switched) {
          this.restoreMainWorldActors();
          scene.createRecyclingCenter?.();
        }
        scene.showQuestToast?.("화면 전환을 복구했어요. 다시 한 번 시도해 주세요.", 3200);
      }

      scene.cameras.main.resetFX?.();
      scene.time.delayedCall(60, () => {
        this.finishTransition();
      });
    });

    return true;
  }

  forcePlayerToSpawn(spawnKey, fallbackSpawn = null) {
    const scene = this.scene;
    if (!scene.player?.active) return;

    const spawn = scene.getMapPoint?.(spawnKey, fallbackSpawn) || fallbackSpawn;
    if (!spawn) return;

    scene.player.setPosition(spawn.x, spawn.y);
    scene.player.body?.reset?.(spawn.x, spawn.y);
    scene.playerController?.cancelMoveTarget?.();
    scene.mouseMoveTarget = null;
  }

  armTransitionSafetyTimer() {
    this.clearTransitionSafetyTimer();
    this.transitionSafetyTimer = this.scene.time.delayedCall(1800, () => {
      if (!this.transitioning) return;
      console.warn("Map transition safety timer released a stuck transition.");
      this.scene.showQuestToast?.("화면 전환을 복구했어요.", 2200);
      this.finishTransition();
    });
  }

  clearTransitionSafetyTimer() {
    this.transitionSafetyTimer?.remove?.(false);
    this.transitionSafetyTimer = null;
  }

  finishTransition() {
    const scene = this.scene;
    this.clearTransitionSafetyTimer();
    if (this.pendingSpawn) {
      this.forcePlayerToSpawn(this.pendingSpawn.spawnKey, this.pendingSpawn.fallbackSpawn);
      this.pendingSpawn = null;
    }
    this.recoverWorldView();
    scene.cameras.main.resetFX?.();
    this.transitioning = false;
    scene.sceneControlSystem?.blockWorldInput?.(false);
  }

  recoverWorldView() {
    const scene = this.scene;
    document.body.classList.remove("interior-scene-active");
    delete document.body.dataset.interiorScene;
    scene.interiorSceneType = null;
    scene.cameras.main.resetFX?.();
    scene.cameras.main.setAlpha?.(1);
    if (scene.player?.active) {
      scene.cameras.main.startFollow(scene.player, true, 1, 1);
      scene.cameras.main.centerOn(scene.player.x, scene.player.y);
    }
    document.body.classList.remove("start-screen", "prologue-scene-active", "epilogue-scene-active");
    scene.tiledMapLayers?.forEach((layer) => {
      layer?.setAlpha?.(1);
      if (layer !== scene.walls) {
        layer?.setVisible?.(true);
      }
    });
  }

  resetTrashForCurrentMap() {
    const scene = this.scene;
    scene.trashSlimes?.clear?.(true, true);
    scene.trashSlimes = scene.physics.add.staticGroup();
    scene.spawnTrashWave?.();
  }

  hideMainWorldActors() {
    const scene = this.scene;
    this.hiddenMainNpcState = {
      yebi: this.captureVisibleState(scene.yebiNpc),
      jjook: this.captureVisibleState(scene.jjookNpc),
      sunisuni: this.captureVisibleState(scene.sunisuniNpc),
    };
    [scene.yebiNpc, scene.jjookNpc, scene.sunisuniNpc].forEach((sprite) => {
      this.setActorVisible(sprite, false);
    });
    this.setQuestMarkersVisible(false);
  }

  restoreMainWorldActors() {
    const scene = this.scene;
    this.restoreVisibleState(scene.yebiNpc, this.hiddenMainNpcState?.yebi, true);
    this.restoreVisibleState(scene.jjookNpc, this.hiddenMainNpcState?.jjook, false);
    this.restoreVisibleState(scene.sunisuniNpc, this.hiddenMainNpcState?.sunisuni, false);
    this.hiddenMainNpcState = null;
    this.setQuestMarkersVisible(true);
  }

  captureVisibleState(sprite) {
    if (!sprite) return null;
    return {
      active: sprite.active,
      visible: sprite.visible,
    };
  }

  restoreVisibleState(sprite, state, defaultVisible = false) {
    if (!sprite) return;
    const visible = state ? state.visible : defaultVisible;
    const active = state ? state.active : defaultVisible;
    sprite.setVisible(Boolean(visible));
    sprite.setActive(Boolean(active));
  }

  setMainWorldActorsVisible(visible) {
    const scene = this.scene;
    [scene.yebiNpc, scene.jjookNpc, scene.sunisuniNpc].forEach((sprite) => {
      this.setActorVisible(sprite, visible);
    });
  }

  setActorVisible(sprite, visible) {
    sprite?.setVisible?.(Boolean(visible));
    sprite?.setActive?.(Boolean(visible));
  }

  setQuestMarkersVisible(visible) {
    Object.values(this.scene.questMarkers || {}).forEach((marker) => {
      marker.text?.setVisible?.(Boolean(visible && marker.target?.active !== false));
    });
  }

  destroyMainWorldUtilityObjects() {
    const scene = this.scene;
    scene.vendingMachine?.destroy?.();
    scene.vendingMachine = null;
    (scene.recycleBins || []).forEach((entry) => {
      ["bin", "label", "labelPanel", "zone", "spotlight"].forEach((key) => {
        entry[key]?.destroy?.();
      });
    });
    scene.recycleBins = [];
  }

  destroy() {
    this.lastPromptAt = 0;
    this.transitioning = false;
    this.suppressedGate = null;
    this.pendingSpawn = null;
    this.clearTransitionSafetyTimer();
  }
}
