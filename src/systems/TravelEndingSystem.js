import { GAME_CONFIG } from "../config/GameConstants.js";
import { SceneState } from "../config/SceneState.js";

export default class TravelEndingSystem {
  constructor(scene) {
    this.scene = scene;
  }

  getBusStopPoint() {
    return this.scene.getMapPoint("bus_stop", GAME_CONFIG.busStop);
  }

  createBusStopObjects() {
    const scene = this.scene;
    this.cleanupBusStopSequence();

    const stop = this.getBusStopPoint();
    if (!stop) return null;

    const waitingSpot = scene.add.ellipse(stop.x, stop.y + 42, 104, 32, 0xf7d96f, 0.26);
    waitingSpot.setStrokeStyle(2, 0x21352c, 0.32);
    waitingSpot.setDepth(scene.getWorldDepth(stop.y + 42, -0.35));

    if (scene.textures.exists("bus_stop_sign")) {
      const sign = scene.add.image(stop.x - 58, stop.y + 32, "bus_stop_sign");
      sign.setOrigin(0.5, 1);
      sign.setDisplaySize(38, 72);
      sign.setDepth(scene.getWorldDepth(stop.y + 32, 0.02));
      scene.travelBusStopObjects.push(sign);
    }

    scene.travelBusStopObjects.push(waitingSpot);
    return stop;
  }

  startBusStopBoardingSequence() {
    const scene = this.scene;
    const stop = this.createBusStopObjects();
    if (!stop) {
      scene.startTravelHomeSequence();
      return;
    }

    scene.packingQuestState = "going_bus_stop";
    scene.stateManager?.set(SceneState.PLAYING);
    scene.saveCheckpoint("packing_bus_stop");
    scene.pauseNpcRoaming("jjook");
    scene.stopJjookIdleTween();
    scene.showQuestToast("직접 버스정류장으로 걸어가요.", 3600);
    scene.showSpeechBubble(scene.jjookNpc || scene.player, "뒤에서 따라갈게!", 2600);

    if (scene.jjookNpc?.active) {
      scene.isJjookBusEscortActive = true;
      scene.nextBusEscortWaitToastAt = 0;
      scene.tweens.killTweensOf(scene.jjookNpc);
      scene.stopNpcWalk(scene.jjookNpc, "jjook");
    }
    this.updateQuestRouteGuide();
  }

  getBusArrivalPoint() {
    const stop = this.getBusStopPoint();
    return stop ? { x: stop.x - 20, y: stop.y + 52 } : null;
  }

  updateQuestRouteGuide() {
    this.scene.routeGuideSystem?.update();
  }

  updateBusRouteGuide() {
    this.updateQuestRouteGuide();
  }

  checkBusStopArrival() {
    const scene = this.scene;
    if (scene.packingQuestState !== "going_bus_stop" || scene.travelBus) return;
    if (!scene.player || scene.isInDialogue || scene.interiorSceneGroup) return;

    const stop = this.getBusStopPoint();
    const arrivalPoint = this.getBusArrivalPoint();
    if (!stop || !arrivalPoint) return;

    const distance = Phaser.Math.Distance.Between(scene.player.x, scene.player.y, arrivalPoint.x, arrivalPoint.y);
    if (distance > 78) return;

    if (scene.isJjookBusEscortActive && scene.jjookNpc?.active) {
      const jjookDistance = Phaser.Math.Distance.Between(
        scene.jjookNpc.x,
        scene.jjookNpc.y,
        arrivalPoint.x + 46,
        arrivalPoint.y,
      );
      if (jjookDistance > 138) {
        if (scene.time.now > scene.nextBusEscortWaitToastAt) {
          scene.showQuestToast("쭉쭉이를 기다렸다가 같이 버스를 타요.", 2600);
          scene.showSpeechBubble(scene.jjookNpc, "금방 갈게!", 1500);
          scene.nextBusEscortWaitToastAt = scene.time.now + 3200;
        }
        return;
      }
    }

    this.startBusArrivalSequence(stop);
  }

  startBusArrivalSequence(stop) {
    const scene = this.scene;
    if (!stop) {
      scene.startTravelHomeSequence();
      return;
    }

    scene.packingQuestState = "boarding_bus";
    scene.isJjookBusEscortActive = false;
    scene.stateManager?.set(SceneState.CUTSCENE);
    scene.player?.setVelocity(0, 0);
    scene.playerController?.stopWalkAnimation?.();
    scene.pauseNpcRoaming("jjook");
    scene.showQuestToast("버스가 오고 있어요.", 3000);
    scene.showSpeechBubble(scene.jjookNpc || scene.player, "버스 온다!", 2200);

    const busY = stop.y - 14;
    const startX = stop.x - 840;
    const stopX = stop.x - 112;
    scene.travelBus = scene.add.sprite(startX, busY, "bus_right", 0);
    scene.travelBus.setOrigin(0.5, 0.5);
    scene.travelBus.setDisplaySize(244, 122);
    scene.travelBus.setDepth(scene.getWorldDepth(busY + 54, 0.2));
    if (scene.anims.exists("bus_right_drive")) {
      scene.travelBus.anims.play("bus_right_drive");
    }

    scene.tweens.add({
      targets: scene.travelBus,
      x: stopX,
      duration: 4200,
      ease: "Sine.easeOut",
      onUpdate: () => scene.travelBus?.setDepth(scene.getWorldDepth(busY + 54, 0.2)),
      onComplete: () => {
        scene.showQuestToast("버스가 도착했어요.", 1800);
        scene.travelBus?.anims?.stop();
        scene.travelBus?.setFrame(3);
        const pauseEvent = scene.time.delayedCall(1300, () => this.boardTravelBus());
        scene.travelBusSequenceEvents.push(pauseEvent);
      },
    });
  }

  boardTravelBus() {
    const scene = this.scene;
    scene.showQuestToast("버스를 타고 집으로 가요.", 2600);
    scene.player?.setVisible(false);
    scene.jjookNpc?.setVisible(false);

    scene.cameras.main.fadeOut(650, 0, 0, 0);
    const transitionEvent = scene.time.delayedCall(700, () => {
      this.cleanupBusStopSequence();
      scene.player?.setVisible(true);
      scene.jjookNpc?.setVisible(true);
      scene.packingQuestState = "traveling_home";
      scene.stateManager?.set(SceneState.PLAYING);
      scene.cameras.main.fadeIn(420, 0, 0, 0);
      scene.startTravelHomeSequence();
    });
    scene.travelBusSequenceEvents.push(transitionEvent);
  }

  cleanupBusStopSequence() {
    const scene = this.scene;
    scene.travelBusSequenceEvents?.forEach((event) => event?.remove?.(false));
    scene.travelBusSequenceEvents = [];
    scene.travelBusStopObjects?.forEach((object) => object?.destroy?.());
    scene.travelBusStopObjects = [];
    scene.routeGuideSystem?.destroy();
    scene.isJjookBusEscortActive = false;
    if (scene.travelBus) {
      scene.tweens.killTweensOf(scene.travelBus);
      scene.travelBus.destroy();
      scene.travelBus = null;
    }
  }
}
