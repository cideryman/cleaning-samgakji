export default class MapTransitionSystem {
  constructor(scene) {
    this.scene = scene;
    this.lastPromptAt = 0;
    this.promptCooldown = 3500;
    this.gateRadius = 72;
    this.transitioning = false;
    this.hiddenMainNpcState = null;
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
    if (distance > this.gateRadius) {
      this.showThrottledToast(time, "위쪽 길로 돌아가면 삼각지 중심으로 갈 수 있어요.", 5200);
      return;
    }

    this.returnToMainMap();
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
      },
      afterSwitch: () => {
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
        this.scene.createRecyclingCenter?.();
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

    scene.cameras.main.fadeOut(180, 20, 28, 22);
    scene.time.delayedCall(190, () => {
      beforeSwitch?.();
      const switched = scene.tiledMapSystem?.switchMap?.(mapId, spawnKey, fallbackSpawn);
      if (switched) {
        this.resetTrashForCurrentMap();
        afterSwitch?.();
      } else {
        scene.showQuestToast?.("아직 이어지는 길을 찾지 못했어요.", 2600);
      }

      scene.cameras.main.fadeIn(220, 20, 28, 22);
      scene.time.delayedCall(240, () => {
        this.transitioning = false;
        scene.sceneControlSystem?.blockWorldInput?.(false);
      });
    });

    return true;
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
      sprite?.setVisible?.(false);
      sprite?.setActive?.(false);
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
  }
}
