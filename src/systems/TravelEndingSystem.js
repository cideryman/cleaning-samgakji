import { GAME_CONFIG } from "../config/GameConstants.js";
import { SceneState } from "../config/SceneState.js";

const TRAVEL_ALLOWANCE_REWARD = 20000;

export default class TravelEndingSystem {
  constructor(scene) {
    this.scene = scene;
  }

  getBusStopPoint() {
    return this.scene.getMapPoint("bus_stop", GAME_CONFIG.busStop);
  }

  createPermanentBusStopObjects() {
    const scene = this.scene;
    this.cleanupPermanentBusStopObjects();

    const stop = this.getBusStopPoint();
    if (!stop) return null;

    scene.permanentBusStopObjects = [];
    const waitingSpot = scene.add.ellipse(stop.x, stop.y + 42, 104, 32, 0xf7d96f, 0.26);
    waitingSpot.setStrokeStyle(2, 0x21352c, 0.32);
    waitingSpot.setDepth(scene.getWorldDepth(stop.y + 42, -0.35));
    scene.permanentBusStopObjects.push(waitingSpot);

    if (scene.textures.exists("bus_stop_sign")) {
      const sign = scene.add.image(stop.x - 58, stop.y + 32, "bus_stop_sign");
      sign.setOrigin(0.5, 1);
      sign.setDisplaySize(38, 72);
      sign.setDepth(scene.getWorldDepth(stop.y + 32, 0.02));
      scene.permanentBusStopObjects.push(sign);
    }

    return stop;
  }

  cleanupPermanentBusStopObjects() {
    const scene = this.scene;
    scene.permanentBusStopObjects?.forEach((object) => object?.destroy?.());
    scene.permanentBusStopObjects = [];
  }

  createBusStopObjects() {
    const scene = this.scene;
    this.cleanupBusStopSequence();

    if (!scene.permanentBusStopObjects?.length) {
      return this.createPermanentBusStopObjects();
    }

    return this.getBusStopPoint();
  }

  startBusStopBoardingSequence() {
    const scene = this.scene;
    const stop = this.createBusStopObjects();
    if (!stop) {
      this.startTravelHomeSequence();
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
      this.startTravelHomeSequence();
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
      this.startTravelHomeSequence();
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

  startTravelHomeSequence() {
    const scene = this.scene;
    scene.playSceneMusic("ambient_bus_bgm", 0.26);
    scene.showInteriorScene("ending_bus_home", "travel");
    scene.dialogueSystem.start([
      { name: "쭉쭉이", portraitKey: "jjook_travel_bag", text: "버스 타고 가니까 진짜 여행 준비가 시작된 느낌이야." },
      { name: "해냄이", portraitKey: "haenaem_touched", text: "오늘 산 옷도 챙기고, 필요한 것도 골라볼래." },
    ], () => this.startPackingRoomScene());
  }

  startPackingRoomScene() {
    const scene = this.scene;
    scene.playSceneMusic("ambient_room_bgm", 0.24);
    scene.showInteriorScene("ending_packing_room", "home");
    scene.dialogueSystem.start([
      { name: "해냄이", portraitKey: "haenaem_travel_bag", text: "가방을 펼쳐두니까 조금 설렌다." },
      { name: "해냄이", portraitKey: "haenaem_determined", text: "정답은 없으니까, 내가 필요하다고 생각하는 짐을 골라보자." },
    ], () => scene.openPackingMenu());
  }

  startPackedRoomSequence() {
    const scene = this.scene;
    scene.playSceneMusic("ambient_room_bgm", 0.24);
    scene.showInteriorScene("ending_packed_room", "home");
    const itemMessage = scene.packingItems.length
      ? `${scene.packingItems.map((item) => item.label).join(", ")}까지 챙겼어.`
      : "가방은 가볍게 준비했어.";
    scene.dialogueSystem.start([
      { name: "해냄이", portraitKey: "haenaem_travel_bag", text: itemMessage },
      { name: "해냄이", portraitKey: "haenaem_touched", text: "이제 진짜 서울 가는구나..." },
    ], () => this.startMotherAllowanceSequence());
  }

  startMotherAllowanceSequence() {
    const scene = this.scene;
    scene.dialogueSystem.start([
      { name: "엄마", portraitKey: "mother_allowance", text: "우리 해냄이 정말 열심히 준비했네." },
      { name: "엄마", portraitKey: "mother_allowance_2", text: "서울 가서 맛있는 것도 먹고 와." },
      { name: "해냄이", portraitKey: "haenaem_touched", text: "고마워. 잘 다녀올게!" },
    ], () => {
      scene.moneySystem?.addMoney(TRAVEL_ALLOWANCE_REWARD);
      scene.showMoneyRewardAnimation(TRAVEL_ALLOWANCE_REWARD, {
        label: "용돈",
        icon: "./assets/ui/10000won.png",
        framed: false,
      });
      scene.playItemPickupSound();
      scene.saveCheckpoint("travel_allowance");
      scene.time.delayedCall(900, () => this.startTravelMorningSequence());
    });
  }

  startTravelMorningSequence() {
    const scene = this.scene;
    scene.playSceneMusic("ambient_room_bgm", 0.24);
    scene.showInteriorScene("ending_morning_room", "home");
    scene.dialogueSystem.start([
      { name: "해냄이", portraitKey: "haenaem_determined", text: "가방도 챙겼고, 용돈도 받았어." },
      { name: "해냄이", portraitKey: "haenaem_touched", text: "이제 역으로 가자." },
    ], () => this.startStationSequence());
  }

  startStationSequence() {
    const scene = this.scene;
    scene.playSceneMusic("ambient_train_bgm", 0.26);
    scene.showInteriorScene("ending_yeongju_station", "travel");
    scene.dialogueSystem.start([
      { name: "쭉쭉이", portraitKey: "jjook_travel_bag", text: "우와... 진짜 가는구나." },
      { name: "해냄이", portraitKey: "haenaem_surprised", text: "조금 떨려... 그래도 준비했으니까 괜찮아." },
    ], () => this.startTrainArrivalSequence());
  }

  startTrainArrivalSequence() {
    const scene = this.scene;
    scene.playSceneMusic("ambient_train_bgm", 0.28);
    scene.showInteriorScene("ending_train_arrival", "travel");
    scene.dialogueSystem.start([
      { name: "쭉쭉이", portraitKey: "jjook_expectant", text: "기차가 온다! 놓치지 말고 타자." },
      { name: "해냄이", portraitKey: "haenaem_determined", text: "좋아. 서울로 출발!" },
    ], () => this.startSeoulArrivalSequence());
  }

  startSeoulArrivalSequence() {
    const scene = this.scene;
    scene.playSceneMusic("ambient_seoul_station_bgm", 0.26);
    scene.showInteriorScene("ending_seoul_station", "travel");
    scene.dialogueSystem.start([
      { name: "해냄이", portraitKey: "haenaem_surprised", text: "서울역이다... 사람이 정말 많아." },
      { name: "쭉쭉이", portraitKey: "jjook_smile", text: "천천히 같이 다니면 괜찮아!" },
    ], () => this.startTravelMemorySequence());
  }

  startTravelMemorySequence() {
    const scene = this.scene;
    scene.playSceneMusic("ambient_gyeongbokgung_bgm", 0.26);
    scene.showInteriorScene("ending_gyeongbokgung", "travel");
    scene.dialogueSystem.start([
      { name: "해냄이", portraitKey: "haenaem_touched", text: "내가 준비해서 온 여행이라 더 특별해." },
    ], () => {
      scene.playSceneMusic("ambient_amusement_park_bgm", 0.26);
      scene.showInteriorScene("ending_amusement_park", "travel");
      scene.dialogueSystem.start([
        { name: "쭉쭉이", portraitKey: "jjook_playful", text: "오늘 하루 오래 기억날 것 같아!" },
        { name: "해냄이", portraitKey: "haenaem_touched", text: "응. 다음 여행도 내가 준비해보고 싶어." },
      ], () => this.finishChapterOneEnding());
    });
  }

  finishChapterOneEnding() {
    const scene = this.scene;
    scene.packingQuestState = "ending_complete";
    scene.isChapterComplete = true;
    scene.saveCheckpoint("chapter1_ending_complete");
    this.showChapterOneEndingScene();
  }

  showChapterOneEndingScene() {
    const scene = this.scene;
    scene.clearInteriorScene();
    scene.stopSceneMusic();
    scene.stopChapterMusic();
    scene.playSceneMusic("chapter1_ending_bgm", 0.34);
    scene.stateManager?.set(SceneState.CUTSCENE);
    scene.player?.setVelocity(0, 0);
    scene.playerController?.stopWalkAnimation?.();
    scene.showInteriorScene("ending_chapter1_final", "ending");

    const viewportWidth = Math.max(768, scene.scale.width || 768);
    const viewportHeight = Math.max(480, scene.scale.height || 480);
    const centerX = viewportWidth / 2;
    const promptY = Math.min(viewportHeight - 46, viewportHeight * 0.9);
    const promptBack = scene.add.rectangle(centerX, promptY, Math.min(560, viewportWidth - 56), 54, 0x21352c, 0.72);
    promptBack.setScrollFactor(0);
    promptBack.setDepth(74);
    promptBack.setStrokeStyle(3, 0xf7d96f, 0.9);
    const prompt = scene.add.text(centerX, promptY, "스페이스 또는 화면 터치로 시작화면으로", {
      fontFamily: "Arial",
      fontSize: "22px",
      color: "#fff3d0",
      fontStyle: "bold",
      align: "center",
    }).setOrigin(0.5);
    prompt.setScrollFactor(0);
    prompt.setDepth(75);
    scene.interiorSceneGroup?.addMultiple?.([promptBack, prompt]);

    scene.input.keyboard.once("keydown-SPACE", () => this.returnToStartScreenFromEnding());
    scene.input.once("pointerdown", () => this.returnToStartScreenFromEnding());
  }

  returnToStartScreenFromEnding() {
    const scene = this.scene;
    if (scene.packingQuestState !== "ending_complete") return;
    scene.stopSceneMusic();
    scene.stopChapterMusic();
    scene.clearInteriorScene();
    document.body.classList.add("start-screen");
    scene.scene.start("StartScene");
  }
}
